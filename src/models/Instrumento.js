const mongoose = require("mongoose");

const instrumentoSchema = new mongoose.Schema(
  {
    
    codigo: {
      type: String,
      required: false,
      unique: false,
      trim: true,
      default: "",
    },
    
    numeroSerie: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    numeroPartida: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },

    descripcion: {
      type: String,
      required: true,
      trim: true,
    },

    condicion: {
      type: String,
      enum: ["Comodato", "Propio", "Alquilado", "Prestado"],
      default: "Comodato",
    },

    cliente: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Cliente",
        required: false,
    },

    fechaUltimoMantenimiento: {
      type: String,
      default: undefined,
    },

    notas: {
      type: String,
      trim: true,
      default: undefined,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Instrumento", instrumentoSchema);