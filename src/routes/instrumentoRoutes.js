const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

const {
  getInstrumentos,
  getInstrumentoById,
  createInstrumento,
  updateInstrumento,
  deleteInstrumento,
  obtenerInstrumentosPorCliente,
} = require("../controllers/instrumentoController");

// Obtener instrumentos por cliente
router.get("/cliente/:clienteId", auth, obtenerInstrumentosPorCliente);

// Obtener todos los instrumentos
router.get("/", auth, getInstrumentos);

// Obtener un instrumento por ID
router.get("/:id", auth, getInstrumentoById);

// Crear instrumento
router.post("/", auth, createInstrumento);

// Actualizar instrumento
router.put("/:id", auth, updateInstrumento);

// Eliminar instrumento
router.delete("/:id", auth, deleteInstrumento);



module.exports = router;