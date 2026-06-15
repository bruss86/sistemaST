// models/Contador.js

const mongoose = require("mongoose");

const contadorSchema = new mongoose.Schema({
  nombre: String,
  ultimoNumero: Number,
});

module.exports = mongoose.model("Contador", contadorSchema);