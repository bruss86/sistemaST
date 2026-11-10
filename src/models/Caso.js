// models/Caso.js

const mongoose = require("mongoose");

const casoSchema = new mongoose.Schema({
  numero: {
    type: String,
    unique: true,
    required: true,
  },

  gmailThreadId: {
    type: String,
    unique: true,
    required: true,
  },
  
  remitente: String,

  asunto: String,

  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Cliente",
    required: false,
    default: null,
  },

  instrumento: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Instrumento",
    required: false,
    default: null,
  },

  estado: {
    type: String,
    default: "Abierto",
  },

  fechaCreacion: {
    type: Date,
    default: Date.now,
  },

  mensajes: [
    {
      gmailMessageId: String,
      remitente: String,
      fecha: Date,
      texto: String,
    },
  ],
});

module.exports = mongoose.model("Caso", casoSchema);