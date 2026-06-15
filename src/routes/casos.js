// routes/casos.js

const express = require("express");
const router = express.Router();
const Caso = require("../models/Caso");

const {
  generarNumeroCaso,
} = require("../services/casoService");

const {
  enviarRespuesta,
} = require("../services/mailService");

function extraerEmail(remitente) {

  const match =
    remitente?.match(/<(.+?)>/);

  return match
    ? match[1]
    : remitente;
}


router.get("/", async (req, res) => {
  try {
    const casos = await Caso.find()
      .sort({ fechaCreacion: -1 });

    res.json(casos);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

router.put("/:id/estado", async (req, res) => {
  try {
    const caso = await Caso.findByIdAndUpdate(
      req.params.id,
      {
        estado: req.body.estado,
      },
      {
        new: true,
      }
    );

    res.json(caso);

  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

router.post("/email", async (req, res) => {

  try {

    const {
      threadId,
      messageId,
      remitente,
      asunto,
      texto,
      fecha,
    } = req.body;

    let casoExistente = null;

    const match =
      asunto?.match(/\[CAS-\d+\]/i);

    if (match) {

      const numeroCaso =
        match[0]
          .replace("[", "")
          .replace("]", "");

      casoExistente =
        await Caso.findOne({
          numero: numeroCaso,
        });
    }

    if (!casoExistente) {

      casoExistente =
        await Caso.findOne({
          gmailThreadId:
            threadId,
        });
    }

    if (casoExistente) {

      const yaExiste =
        casoExistente.mensajes.some(
          m =>
            m.gmailMessageId ===
            messageId
        );

      if (!yaExiste) {

        casoExistente.mensajes.push({
          gmailMessageId:
            messageId,
          remitente,
          fecha:
            fecha
              ? new Date(fecha)
              : new Date(),
          texto,
        });

        await casoExistente.save();

        console.log(
          "Respuesta agregada a:",
          casoExistente.numero
        );
      }

      return res.json({
        ok: true,
        tipo: "respuesta",
      });
    }

    const numero =
      await generarNumeroCaso();

    await Caso.create({

      numero,

      gmailThreadId:
        threadId,

      remitente,

      asunto,

      fechaCreacion:
        fecha
          ? new Date(fecha)
          : new Date(),

      mensajes: [
        {
          gmailMessageId:
            messageId,
          remitente,
          fecha:
            fecha
              ? new Date(fecha)
              : new Date(),
          texto,
        },
      ],
    });

    await enviarRespuesta(
      extraerEmail(remitente),
      numero
    );

    console.log(
      "Caso creado:",
      numero
    );

    res.json({
      ok: true,
      tipo: "nuevo",
      numero,
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error:
        error.message,
    });
  }

});

module.exports = router;