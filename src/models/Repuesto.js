const mongoose = require("mongoose");

const repuestoSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },

    codigo: {
      type: String,
      unique: true,
      trim: true,
    },

    fabricante: {
      type: String,
      default: "",
      trim: true,
    },

    modelo: {
      type: String,
      default: "",
      trim: true,
    },  

    descripcion: {
      type: String,
      default: "",
      trim: true,
    },

    stock: {
      type: Number,
      default: 0,
      min: 0,
    },

    stockMinimo: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Repuesto", repuestoSchema);