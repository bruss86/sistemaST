// jobs/procesarCorreos.js

const gmail = require("../services/gmailService");

const Caso = require("../models/Caso");
const CorreoProcesado = require("../models/CorreoProcesado");

const {
  generarNumeroCaso,
} = require("../services/casoService");

const {
  enviarRespuesta,
} = require("../services/mailService");

function getHeader(headers, nombre) {
  return headers.find(
    h => h.name.toLowerCase() === nombre.toLowerCase()
  )?.value;
}

function extraerEmail(remitente) {
  const match = remitente?.match(/<(.+?)>/);
  return match ? match[1] : remitente;
}

async function procesarCorreos() {

  const lista = await gmail.users.messages.list({
    userId: "me",
    labelIds: ["INBOX"], // solo bandeja de entrada
    maxResults: 20,
  });

  const resultado = {
    procesados: 0,
    casosNuevos: 0,
    respuestasAgregadas: 0,
  };

  for (const msg of lista.data.messages || []) {

    const yaProcesado =
      await CorreoProcesado.findOne({
        gmailMessageId: msg.id,
      });

    if (yaProcesado) {
      continue;
    }

    const mensaje = await gmail.users.messages.get({
      userId: "me",
      id: msg.id,
    });

    const headers =
      mensaje.data.payload.headers || [];

    const threadId =
      mensaje.data.threadId;

    const asunto =
      getHeader(headers, "Subject") || "";

    const remitente =
      getHeader(headers, "From") || "";


    console.log("================================");
    console.log("THREAD:", threadId);
    console.log("ASUNTO:", asunto);
    console.log("REMITENTE:", remitente);
    console.log("================================");

    const fecha =
      getHeader(headers, "Date");

    const texto =
      mensaje.data.snippet || "";

    const email =
      extraerEmail(remitente);

    // Ignorar correos enviados por la propia cuenta
    if (
      email &&
      process.env.GMAIL_USER &&
      email.toLowerCase() ===
      process.env.GMAIL_USER.toLowerCase()
    ) {

      await CorreoProcesado.create({
        gmailMessageId: msg.id,
      });

      continue;
    }

    let casoExistente = null;

    const match = asunto.match(/\[CAS-\d+\]/i);

    console.log("MATCH:", match);

    if (match) {

    const numeroCaso = match[0]
        .replace("[", "")
        .replace("]", "")
        .trim();

    console.log(
        "NUMERO EXTRAIDO:",
        JSON.stringify(numeroCaso)
    );

    const todos = await Caso.find({}, {
    numero: 1
    });

    console.log(
    "TODOS LOS CASOS:",
    todos.map(c => c.numero)
    );

    const casoPorNumero =
        await Caso.findOne({
        numero: numeroCaso,
        });

    console.log(
        "CASO POR NUMERO:",
        casoPorNumero
        ? casoPorNumero.numero
        : "NO ENCONTRADO"
    );

    casoExistente = casoPorNumero;
    }

    console.log("THREAD:", threadId);
    console.log("ASUNTO:", asunto);
    console.log(
    "CASO:",
    casoExistente
        ? casoExistente.numero
        : "NO ENCONTRADO"
    );

    if (casoExistente) {

      // Evitar agregar el mismo mensaje dos veces
      const mensajeYaExiste =
        casoExistente.mensajes.some(
          m => m.gmailMessageId === mensaje.data.id
        );

      if (!mensajeYaExiste) {

        casoExistente.mensajes.push({
          gmailMessageId: mensaje.data.id,
          remitente,
          fecha: fecha ? new Date(fecha) : new Date(),
          texto,
        });

        await casoExistente.save();

        resultado.respuestasAgregadas++;
      }

    } else {

      const numero =
        await generarNumeroCaso();

      await Caso.create({
        numero,
        gmailThreadId: threadId,
        remitente,
        asunto,
        fechaCreacion: fecha
          ? new Date(fecha)
          : new Date(),

        mensajes: [
          {
            gmailMessageId: mensaje.data.id,
            remitente,
            fecha: fecha
              ? new Date(fecha)
              : new Date(),
            texto,
          },
        ],
      });

      await enviarRespuesta(
        email,
        numero
      );

      resultado.casosNuevos++;
    }

    await CorreoProcesado.create({
      gmailMessageId: msg.id,
    });

    resultado.procesados++;
  }

  return resultado;
}

module.exports = procesarCorreos;