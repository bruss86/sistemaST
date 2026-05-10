const mongoose = require("mongoose");

const clienteSchema = new mongoose.Schema(
  {
    codigoCliente: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    nombre: {
      type: String,
      required: true,
      trim: true,
    },

    direccion: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Cliente", clienteSchema);