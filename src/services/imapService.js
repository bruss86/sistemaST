const imaps = require("imap-simple");
const { simpleParser } = require("mailparser");
const Caso = require("../models/Caso");
const { generarNumeroCaso } = require("./casoService");
const { enviarRespuesta } = require("./mailService");

async function sincronizarCorreosReclamo() {
  const config = {
    imap: {
      user: process.env.EMAIL_USER,
      password: process.env.EMAIL_PASS,
      host: "imap.gmail.com",
      port: 993,
      tls: true,
      authTimeout: 10000,
      tlsOptions: { rejectUnauthorized: false },
    },
  };

  try {
    console.log("🔄 Conectando a Gmail vía IMAP para sincronizar bandejas...");
    const connection = await imaps.connect(config);

    const fetchOptions = { 
      bodies: [""], 
      struct: true,
      envelope: true,
      modifiers: { fetch: ["X-GM-THRID", "X-GM-MSGID"] } 
    };

    let allMessages = [];

    // 🔑 Creamos un objeto Date real de hace 7 días (exigido por la librería imap)
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - 7);

    // ==========================================
    // 1. BUSCAR EN INBOX (Correos con etiqueta "Casos")
    // ==========================================
    await connection.openBox("INBOX");
    const searchCriteriaInbox = [["X-GM-LABELS", "Casos"], ["SINCE", fechaLimite]];
    const messagesInbox = await connection.search(searchCriteriaInbox, fetchOptions);
    console.log(`✉️ Se encontraron ${messagesInbox.length} correos en INBOX con la etiqueta "Casos".`);
    allMessages.push(...messagesInbox);

    // ==========================================
    // 2. BUSCAR EN ENVIADOS ([Gmail]/Sent Mail) por Thread ID
    // ==========================================
    try {
      await connection.openBox('"[Gmail]/Sent Mail"');
      
      // Obtenemos todos los threadIds únicos de los casos abiertos/activos en Mongo
      const casosActivos = await Caso.find({ gmailThreadId: { $exists: true, $ne: null } }).select("gmailThreadId");
      const threadIdsActivos = [...new Set(casosActivos.map(c => c.gmailThreadId))];

      if (threadIdsActivos.length > 0) {
        for (const thId of threadIdsActivos) {
          const searchSent = [
              ["X-GM-THRID", thId],
              ["SINCE", fechaLimite]
            ];          
          const messagesSent = await connection.search(searchSent, fetchOptions);
          allMessages.push(...messagesSent);
        }
        console.log(`📤 Se escanearon ${threadIdsActivos.length} hilos activos en la carpeta de Enviados.`);
      }
    } catch (sentError) {
      console.warn("⚠️ No se pudo escanear la carpeta de Enviados (revisa el nombre de la carpeta Sent Mail):", sentError.message);
    }

    console.log(`📥 Total de mensajes recopilados para procesar: ${allMessages.length}`);

    let casosProcesadosCount = 0;
    const miEmail = (process.env.EMAIL_USER || "").toLowerCase();

    for (const item of allMessages) {
      const rawMessage = item.parts.find(p => p.which === "").body;
      const parsed = await simpleParser(rawMessage);

      const remitente = parsed.from?.text || parsed.from?.value?.[0]?.address || "desconocido@gmail.com";
      const asunto = parsed.subject || "Sin asunto";
      const cuerpoTexto = parsed.text || parsed.html || "";
      
      // 🔑 IDs únicos proporcionados por Gmail IMAP
      const messageId = item.attributes["x-gm-msgid"] 
        ? String(item.attributes["x-gm-msgid"]) 
        : (parsed.messageId || "msg_" + Date.now());
      
      const threadId = item.attributes["x-gm-thrid"] 
        ? String(item.attributes["x-gm-thrid"]) 
        : null;

      // 🛡️ PASO 0: ¿Este mensaje exacto ya fue procesado antes? (Evita duplicados)
      const casoExistentePorMsg = await Caso.findOne({ "mensajes.gmailMessageId": messageId });
      if (casoExistentePorMsg) {
        continue; // Ya existe, lo omitimos
      }

      let casoExistente = null;

      // 🔍 PASO 1: Buscar número de caso en el asunto
      const matchCaso = asunto.match(/CAS-?(?:CAS-)?(\d+)/i);
      if (matchCaso) {
        const numeroLimpio = matchCaso[1];
        const numeroBuscado = `${numeroLimpio}`;
        casoExistente = await Caso.findOne({ numero: numeroBuscado });
      }

      // 🔍 PASO 2: Buscar por el Thread ID real de Gmail
      if (!casoExistente && threadId) {
        casoExistente = await Caso.findOne({ gmailThreadId: threadId });
      }

      if (casoExistente) {
        // 📥 EL CASO YA EXISTE: Anexar mensaje al hilo (sea del cliente o tu respuesta de soporte)
        casoExistente.mensajes.push({
          gmailMessageId: messageId,
          remitente,
          fecha: new Date(),
          texto: cuerpoTexto,
        });

        // Si el mensaje es nuevo del cliente y estaba cerrado o pendiente, lo pasamos a "En Proceso"
        const esMiCorreo = remitente.toLowerCase().includes(miEmail);
        if (!esMiCorreo && (casoExistente.estado === "Cerrado" || casoExistente.estado === "Pendiente Cliente")) {
          casoExistente.estado = "En Proceso";
        }

        await casoExistente.save();
        casosProcesadosCount++;
        console.log(`💬 Mensaje de (${remitente}) anexado al hilo del caso #${casoExistente.numero}`);

      } else {
        // 🆕 NUEVO CASO: SI EL REMITENTE ERES TÚ, IGNÓRALO PARA EVITAR BUCLES
        const esMiCorreo = remitente.toLowerCase().includes(miEmail);
        if (esMiCorreo) {
          continue; 
        }

        // Crear caso nuevo solo si el correo proviene de un cliente real
        const numero = await generarNumeroCaso();

        await Caso.create({
          numero,
          gmailThreadId: threadId || messageId,
          remitente,
          asunto,
          estado: "Abierto",
          fechaCreacion: new Date(),
          mensajes: [
            {
              gmailMessageId: messageId,
              remitente,
              fecha: new Date(),
              texto: cuerpoTexto,
            },
          ],
        });

        // Respuesta automática inicial respetando el hilo
        await enviarRespuesta(
          remitente, 
          numero, 
          `Hola, hemos recibido tu consulta. Nos pondremos en contacto a la brevedad. Tu número de caso es [CAS-${numero}].`, 
          asunto, 
          messageId
        );

        casosProcesadosCount++;
        console.log(`✅ Caso #${numero} creado y respuesta automática enviada a ${remitente}`);
      }
    }

    await connection.end();
    return { procesados: casosProcesadosCount };
  } catch (error) {
    console.error("❌ Error en la sincronización IMAP:", error);
    throw error;
  }
}

module.exports = { sincronizarCorreosReclamo };