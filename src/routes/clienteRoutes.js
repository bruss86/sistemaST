const express = require("express");
const router = express.Router();
const clienteController = require("../controllers/clienteController");
const auth = require("../middleware/auth");


const {
  getClientes,
  getClienteById,
  createCliente,
  updateCliente,
  deleteCliente,
} = require("../controllers/clienteController");

// 📌 Obtener todos los clientes
router.get("/", auth, getClientes);

// 📌 Obtener cliente por ID
router.get("/:id", auth, getClienteById);

// 📌 Crear cliente
router.post("/", auth, createCliente);

// 📌 Actualizar cliente
router.put("/:id", auth, updateCliente);

// 📌 Eliminar cliente
router.delete("/:id", auth, deleteCliente);

router.get("/:id/instrumentos", auth, clienteController.getInstrumentosByCliente);

module.exports = router;