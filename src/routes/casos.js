// routes/casos.js

const express = require("express");
const router = express.Router();
const Caso = require("../models/Caso");

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
      texto
    } = req.body;

    console.log(
      "Correo recibido:",
      asunto
    );

    res.json({
      ok: true
    });

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }

});

module.exports = router;