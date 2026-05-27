const mongoose = require("mongoose");

const tareaSchema = new mongoose.Schema(
  {
    cliente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cliente",
      required: true,
    },

    instrumento: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Instrumento",
      required: true,
    },

    tarea: {
      type: String,
      required: true,
      trim: true,
    },

    fecha: {
      type: String,
      required: true,
      index: true,
    },

    prioridad: {
      type: String,
      enum: ["Baja", "Media", "Alta", "Urgente"],
      default: "Media",
    },

    estado: {
      type: String,
      enum: ["Pendiente", "En proceso", "Finalizada", "Cancelada"],
      default: "Pendiente",
    },

    responsable: {
      type: String,
      trim: true,
      default: "",
    },

    notas: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Tarea", tareaSchema);