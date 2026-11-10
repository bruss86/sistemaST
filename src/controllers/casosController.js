const Caso = require("../models/Caso");
const { google } = require("googleapis");
const { enviarCorreoCierre } = require("../services/mailService");

const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "https://developers.google.com/oauthplayground"
);

oAuth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

// Función auxiliar para obtener el siguiente número de caso secuencial (0001, 0002, ...)
async function obtenerSiguienteNumeroCaso() {
  const ultimoCaso = await Caso.findOne().sort({ fechaCreacion: -1 });
  if (!ultimoCaso || !ultimoCaso.numero) return "0001";

  const siguiente = parseInt(ultimoCaso.numero, 10) + 1;
  return String(siguiente).padStart(4, "0");
}

exports.sincronizarCasosGmail = async (req, res) => {
  try {
    const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

    // 1. Buscamos correos no leídos que tengan la etiqueta "Casos"
    // (Asegúrate de que la etiqueta en Gmail se llame "Casos" o ajusta el nombre exacto)
    const response = await gmail.users.messages.list({
      userId: "me",
      q: "label:Casos",
      maxResults: 10,
    });

    const messages = response.data.messages || [];
    let nuevosProcesados = 0;

    for (const msg of messages) {
      const detalle = await gmail.users.messages.get({ userId: "me", id: msg.id });
      const headers = detalle.data.payload.headers;

      const asunto = headers.find((h) => h.name === "Subject")?.value || "Sin asunto";
      const fromHeader = headers.find((h) => h.name === "From")?.value || "";
      const messageId = headers.find((h) => h.name === "Message-ID")?.value || msg.id;
      const fechaHeader = headers.find((h) => h.name === "Date")?.value;
      const threadId = detalle.data.threadId;

      const emailMatch = fromHeader.match(/<(.+?)>/);
      const remitenteEmail = emailMatch ? emailMatch[1] : fromHeader.trim().toLowerCase();
      const cuerpoMensaje = detalle.data.snippet || "";
      const fechaMensaje = fechaHeader ? new Date(fechaHeader) : new Date();

      // 2. Verificar si el hilo de este correo ya tiene un caso asignado en la base de datos
      let casoExistente = await Caso.findOne({ gmailThreadId: threadId });

      if (casoExistente) {
        // Si el hilo ya existe, solo agregamos el mensaje nuevo si no está duplicado
        const mensajeDuplicado = casoExistente.mensajes.some(
          (m) => m.gmailMessageId === messageId
        );

        if (!mensajeDuplicado) {
          casoExistente.mensajes.push({
            gmailMessageId: messageId,
            remitente: remitenteEmail,
            fecha: fechaMensaje,
            texto: cuerpoMensaje,
          });
          await casoExistente.save();
        }
      } else {
        // 3. Si no tiene caso asignado (hilo nuevo), creamos el caso
        const numeroCaso = await obtenerSiguienteNumeroCaso();

        casoExistente = await Caso.create({
          numero: numeroCaso,
          gmailThreadId: threadId,
          remitente: remitenteEmail,
          asunto: asunto,
          estado: "Abierto",
          fechaCreacion: fechaMensaje,
          mensajes: [
            {
              gmailMessageId: messageId,
              remitente: remitenteEmail,
              fecha: fechaMensaje,
              texto: cuerpoMensaje,
            },
          ],
        });

        // 4. Respuesta automática dentro del mismo hilo confirmando la recepción
        const subjectRespuesta = `Re: ${asunto} [Caso #${numeroCaso}]`;
        const bodyRespuesta = 
          `Hola,\n\nHemos registrado tu solicitud correctamente bajo el número de caso #${numeroCaso}.\n` +
          `Nuestro equipo se pondrá en contacto a la brevedad.\n\nSaludos cordiales,\nEquipo de Soporte`;

        const rawMessage = [
          `To: ${remitenteEmail}`,
          `Subject: ${subjectRespuesta}`,
          `In-Reply-To: ${messageId}`,
          `References: ${messageId}`,
          `Content-Type: text/plain; charset=utf-8`,
          ``,
          bodyRespuesta,
        ].join("\r\n");

        const encodedMessage = Buffer.from(rawMessage)
          .toString("base64")
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=+$/, "");

        await gmail.users.messages.send({
          userId: "me",
          requestBody: { raw: encodedMessage, threadId: threadId },
        });

        nuevosProcesados++;
      }

      // Marcar el correo como leído en Gmail para que no se vuelva a procesar
      await gmail.users.messages.batchModify({
        userId: "me",
        requestBody: { ids: [msg.id], removeLabelIds: ["UNREAD"] },
      });
    }

    res.json({
      success: true,
      message: `Proceso finalizado. Se crearon ${nuevosProcesados} nuevos casos.`,
    });
  } catch (error) {
    console.error("Error al sincronizar correos con etiqueta Casos:", error);
    res.status(500).json({ error: "Error al sincronizar con Gmail" });
  }
};

// =========================
// ASIGNAR CLIENTE A UN CASO
// =========================
exports.asignarClienteACaso = async (req, res) => {
  try {
    const { casoId } = req.params;
    const { clienteId } = req.body;

    const caso = await Caso.findByIdAndUpdate(
      casoId,
      { cliente: clienteId || null },
      { returnDocument: 'after' }
    )
      .populate("cliente", "nombre")
      .populate("instrumento", "descripcion numeroSerie"); // 👈 Mantenemos ambos poblados

    if (!caso) return res.status(404).json({ error: "Caso no encontrado" });

    res.json({ message: "Cliente asignado con éxito", caso });
  } catch (error) {
    console.error("Error al asignar cliente:", error);
    res.status(500).json({ error: "Error al asignar cliente" });
  }
};

// =========================
// ASIGNAR INSTRUMENTO A UN CASO
// =========================
exports.asignarInstrumentoACaso = async (req, res) => {
  try {
    const { casoId } = req.params;
    const { instrumentoId } = req.body;

    const caso = await Caso.findByIdAndUpdate(
      casoId,
      { instrumento: instrumentoId || null },
      { returnDocument: 'after' }
    )
      .populate("cliente", "nombre") // 👈 Mantenemos ambos poblados
      .populate("instrumento", "descripcion numeroSerie");

    if (!caso) return res.status(404).json({ error: "Caso no encontrado" });

    res.json({ message: "Instrumento asignado con éxito", caso });
  } catch (error) {
    console.error("Error al asignar instrumento:", error);
    res.status(500).json({ error: "Error al asignar instrumento" });
  }
};

// =========================================
// CREAR CASO MANUAL / DESDE MENSAJE DE TEXTO
// =========================================
exports.crearCasoManual = async (req, res) => {
  try {
    const { remitente, asunto, mensaje, clienteId, instrumentoId } = req.body;

    if (!remitente || !asunto || !mensaje) {
      return res.status(400).json({ error: "Faltan campos obligatorios (remitente, asunto, mensaje)" });
    }

    const numeroCaso = await obtenerSiguienteNumeroCaso();
    const fechaActual = new Date();

    const nuevoCaso = await Caso.create({
      numero: numeroCaso,
      remitente: remitente, // Ej: Teléfono o nombre del contacto de texto
      asunto: asunto,
      estado: "Abierto",
      fechaCreacion: fechaActual,
      cliente: clienteId || null,
      instrumento: instrumentoId || null,
      mensajes: [
        {
          gmailMessageId: `manual_${Date.now()}`, // ID único simulado para mensajes externos
          remitente: remitente,
          fecha: fechaActual,
          texto: mensaje,
        },
      ],
    });

    // Opcional: Popular antes de responder para que el frontend lo pinte completo
    const casoPoblado = await Caso.findById(nuevoCaso._id)
      .populate("cliente", "nombre")
      .populate("instrumento", "descripcion numeroSerie");

    res.status(201).json({
      success: true,
      message: "Caso creado con éxito",
      caso: casoPoblado,
    });
  } catch (error) {
    console.error("Error al crear caso manual:", error);
    res.status(500).json({ error: "Error al crear el caso" });
  }
};

//==========================================
// CERRAR CASO Y ENVIAR CORREO DE CIERRE
//==========================================

exports.actualizarCaso = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const caso = await Caso.findById(id);
    if (!caso) {
      return res.status(404).json({ error: "Caso no encontrado" });
    }

    console.log("🔍 [DEBUG] Estado actual en BD:", caso.estado);
    console.log("🔍 [DEBUG] Estado recibido en req.body:", estado);

    // Comparamos ignorando mayúsculas/minúsculas por si llega "cerrado" en minúscula
    if (estado && estado.toLowerCase() === "cerrado" && caso.estado !== "Cerrado") {
      caso.estado = "Cerrado";
      await caso.save();
      
      console.log("📧 [DEBUG] Intentando enviar correo de cierre a:", caso.remitente);
      try {
        await enviarCorreoCierre(caso.remitente, caso.numero, caso.asunto);
        console.log("✅ [DEBUG] Correo de cierre ejecutado correctamente.");
      } catch (mailErr) {
        console.error("❌ [DEBUG] Error específico al enviar el correo de cierre:", mailErr);
      }
    } else {
      // Si cambia a cualquier otro estado o se actualizan otros datos
      if (estado) caso.estado = estado;
      await caso.save();
      console.log("ℹ️ [DEBUG] El caso se actualizó, pero no entró en la condición de envío de correo de cierre.");
    }

    res.json({
      success: true,
      message: "Caso actualizado correctamente",
      caso,
    });

  } catch (error) {
    console.error("❌ Error general al actualizar el caso:", error);
    res.status(500).json({ error: "Error al actualizar el caso" });
  }
};
