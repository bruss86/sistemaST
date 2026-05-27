const mongoose = require("mongoose");

const servicioTerceroSchema = new mongoose.Schema(
  {
    instrumento: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Instrumento",
      required: true,
    },
    proveedor: {
      type: String,
      required: true,
      trim: true,
    },
    tipoServicio: {
      type: String,
      required: true,
    },
    descripcion: {
      type: String,
    },
    fechaServicio: {
      type: String,
      required: true,
    },
    costo: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ServicioTercero", servicioTerceroSchema);