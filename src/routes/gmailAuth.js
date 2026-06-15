const express = require("express");
const { google } = require("googleapis");
const gmail = require("../services/gmailService");
const Caso = require("../models/Caso");
const { generarNumeroCaso } = require("../services/casoService");
const { enviarRespuesta } = require("../services/mailService");
const procesarCorreos =
  require("../jobs/procesarCorreos");

const router = express.Router();

const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  "http://localhost:3000/gmail/oauth2callback",
  "https://sistemast.onrender.com/gmail/oauth2callback"
);

function getHeader(headers, nombre) {
  return headers.find(
    h => h.name.toLowerCase() === nombre.toLowerCase()
  )?.value;
}

function extraerEmail(remitente) {
  const match = remitente.match(/<(.+?)>/);
  return match ? match[1] : remitente;
}

router.get("/auth/google", (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/gmail.modify",
    ],
  });

  res.redirect(url);
});

router.get("/oauth2callback", async (req, res) => {
  try {
    const { code } = req.query;

    const { tokens } = await oauth2Client.getToken(code);

    console.log("TOKENS:");
    console.log(tokens);

    res.send(`
      <h2>Autorización correcta</h2>
      <pre>${JSON.stringify(tokens, null, 2)}</pre>
    `);
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});

router.get("/test-gmail", async (req, res) => {
  try {
    const result = await gmail.users.messages.list({
      userId: "me",
      maxResults: 10,
    });

    res.json(result.data);
  } catch (error) {
    console.error(error);
    res.status(500).json(error.message);
  }
});

router.get("/mensaje/:id", async (req, res) => {
  try {
    const mensaje = await gmail.users.messages.get({
      userId: "me",
      id: req.params.id,
    });

    const headers = mensaje.data.payload.headers;

    const asunto = getHeader(headers, "Subject");
    const remitente = getHeader(headers, "From");
    const fecha = getHeader(headers, "Date");

    console.log(asunto);
    console.log(remitente);
    console.log(fecha);

    //res.json(mensaje.data);

    res.json({
      threadId: mensaje.data.threadId,
      asunto: getHeader(headers, "Subject"),
      remitente: getHeader(headers, "From"),
      fecha: getHeader(headers, "Date"),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(error.message);
  }
});

router.get("/crear-caso-prueba/:id", async (req, res) => {

    try {
        const mensaje = await gmail.users.messages.get({
        userId: "me",
        id: req.params.id,
        });

        const headers = mensaje.data.payload.headers;

        const threadId = mensaje.data.threadId;
        const asunto = getHeader(headers, "Subject");
        const remitente = getHeader(headers, "From");
        const fecha = getHeader(headers, "Date");

        // Evitar duplicados
        const existente = await Caso.findOne({
        gmailThreadId: threadId,
        });

        if (existente) {
        return res.json({
            mensaje: "El caso ya existe",
            numero: existente.numero,
        });
        }

        const numero = await generarNumeroCaso();

        const caso = await Caso.create({
        numero,
        gmailThreadId: threadId,
        remitente,
        asunto,
        fechaCreacion: new Date(fecha),
        mensajes: [
            {
            gmailMessageId: mensaje.data.id,
            remitente,
            fecha: new Date(fecha),
            texto: mensaje.data.snippet,
            },
        ],
        });

        const email = extraerEmail(remitente);

        await enviarRespuesta(email, numero);

        res.json(caso);

    } catch (error) {
        console.error(error);
        res.status(500).json(error.message);
    }
});

router.get("/procesar", async (req, res) => {
  try {

    const resultado =
      await procesarCorreos();

    res.json(resultado);

  } catch (error) {
    console.error(error);
    res.status(500).json(error.message);
  }
});

router.get("/gmail-profile", async (req, res) => {
  try {

    const profile =
      await gmail.users.getProfile({
        userId: "me",
      });

    res.json(profile.data);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: error.message,
      stack: error.stack,
    });

  }
});


module.exports = router;