// models/CorreoProcesado.js
//evitar reprocesar correos

const mongoose = require("mongoose");

const correoProcesadoSchema = new mongoose.Schema({
  gmailMessageId: {
    type: String,
    unique: true,
  },

  fechaProcesado: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model(
  "CorreoProcesado",
  correoProcesadoSchema
);