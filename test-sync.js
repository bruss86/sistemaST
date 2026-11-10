require("dotenv").config();
const mongoose = require("mongoose");
const Caso = require("./src/models/Caso");
const { generarNumeroCaso } = require("./src/services/casoService");
const { enviarRespuesta } = require("./src/services/mailService");

async function probarFlujoBackend() {
  try {
    // 1. Conectar a MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🟢 Conectado a MongoDB para la prueba...");

    // Simulamos los datos de un correo entrante de un cliente con la palabra "reclamo"
    const correoSimulado = {
      remitente: "leandroger@gmail.com",
      asunto: "Reclamo por mal funcionamiento del equipo",
      cuerpoTexto: "Hola, el equipo que compré no enciende y quiero hacer un reclamo.",
      threadId: "thread_simulado_" + Date.now(),
      messageId: "msg_" + Date.now(),
    };

    console.log(`✉️ Simulando correo recibido de: ${correoSimulado.remitente} | Asunto: "${correoSimulado.asunto}"`);

    // Validación de la palabra "reclamo" (igual que en tu ruta)
    if (!/reclamo/i.test(correoSimulado.asunto)) {
      console.log("⏩ Ignorado (no pasó la validación de reclamo)");
      process.exit(0);
    }

    // 2. Verificar si el hilo ya existe en MongoDB
    let casoExistente = await Caso.findOne({ gmailThreadId: correoSimulado.threadId });

    if (casoExistente) {
      console.log(`ℹ️ El hilo ya pertenece al caso #${casoExistente.numero}. Agregando mensaje...`);
      casoExistente.mensajes.push({
        gmailMessageId: correoSimulado.messageId,
        remitente: correoSimulado.remitente,
        fecha: new Date(),
        texto: correoSimulado.cuerpoTexto,
      });
      await casoExistente.save();
    } else {
      // 3. Crear caso nuevo con numeración secuencial
      const numero = await generarNumeroCaso();
      console.log(`✨ Creando nuevo caso #${numero} en MongoDB...`);

      await Caso.create({
        numero,
        gmailThreadId: correoSimulado.threadId,
        remitente: correoSimulado.remitente,
        asunto: correoSimulado.asunto,
        fechaCreacion: new Date(),
        mensajes: [
          {
            gmailMessageId: correoSimulado.messageId,
            remitente: correoSimulado.remitente,
            fecha: new Date(),
            texto: correoSimulado.cuerpoTexto,
          },
        ],
      });

      // 4. Enviar respuesta automática usando Nodemailer
      console.log(`📤 Enviando respuesta automática a ${correoSimulado.remitente} vía Nodemailer...`);
      await enviarRespuesta(correoSimulado.remitente, numero);
      console.log(`✅ ¡Caso #${numero} creado y respuesta enviada con éxito!`);
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error en la prueba:", error);
    process.exit(1);
  }
}

// Ejecutar la función correctamente
probarFlujoBackend();