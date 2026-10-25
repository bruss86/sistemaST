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
      unique: false,
      trim: true, //  Elimina espacios en blanco al inicio y al final
    },

    numeroPartida: {
      type: String,
      unique: true, //se asegura que no se repita el número de partida
      required: true,
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