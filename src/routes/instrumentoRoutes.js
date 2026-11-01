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

const { obtenerPrimerasSeisPestanas } = require("../services/googleSheets");

// Ruta para el visor del Excel (sin auth temporalmente para probar)
router.get("/visor-excel", async (req, res) => {
  try {
    const resultado = await obtenerPrimerasSeisPestanas();
    
    res.json({
      status: "success",
      totalPestanas: resultado.nombresHojas.length,
      nombres: resultado.nombresHojas,
      data: resultado.contenido
    });
  } catch (error) {
    res.status(500).json({ 
      status: "error", 
      mensaje: "No se pudieron cargar las pestañas del Excel", 
      detalles: error.message 
    });
  }
});
// ===============================================

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