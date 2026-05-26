const mongoose = require("mongoose");

const instrumentoSchema = new mongoose.Schema(
  {
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
      required: false,
      enum: ["Comodato", "Propio", "Alquilado"],
      default: "Comodato",
    },

    cliente: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Cliente",
        required: false,
    },

    fechaUltimoMantenimiento: {
      type: Date,
      default: undefined,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Instrumento", instrumentoSchema);