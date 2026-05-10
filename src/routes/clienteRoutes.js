const express = require("express");
const router = express.Router();
const clienteController = require("../controllers/clienteController");

const {
  getClientes,
  getClienteById,
  createCliente,
  updateCliente,
  deleteCliente,
} = require("../controllers/clienteController");

// 📌 Obtener todos los clientes
router.get("/", getClientes);

// 📌 Obtener cliente por ID
router.get("/:id", getClienteById);

// 📌 Crear cliente
router.post("/", createCliente);

// 📌 Actualizar cliente
router.put("/:id", updateCliente);

// 📌 Eliminar cliente
router.delete("/:id", deleteCliente);

router.get("/:id/instrumentos", clienteController.getInstrumentosByCliente);

module.exports = router;