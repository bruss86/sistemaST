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
      required: true,
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
    },

    cliente: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Cliente",
        required: false,
    },

    fechaUltimoMantenimiento: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Instrumento", instrumentoSchema);