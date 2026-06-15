// services/casoService.js

const Contador = require("../models/Contador");

async function generarNumeroCaso() {
  const contador = await Contador.findOneAndUpdate(
    { nombre: "casos" },
    { $inc: { ultimoNumero: 1 } },
    {
      new: true,
      upsert: true,
    }
  );

  return `CAS-${String(contador.ultimoNumero).padStart(6, "0")}`;
}

module.exports = {
  generarNumeroCaso,
};