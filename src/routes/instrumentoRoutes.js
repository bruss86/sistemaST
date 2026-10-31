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

// 1. Importamos la función de lectura de Google Sheets
const { leerDatosPrueba } = require("../services/googleSheets");

// === RUTA TEMPORAL DE PRUEBA DE GOOGLE SHEETS ===
router.get("/probar-sheets", async (req, res) => {
  try {
    console.log("Intentando leer Google Sheets...");
    const datos = await leerDatosPrueba();
    
    if (!datos || datos.length === 0) {
      return res.json({ 
        status: "ok", 
        mensaje: "Conexión exitosa, pero la hoja está vacía en ese rango." 
      });
    }

    res.json({
      status: "success",
      mensaje: "¡Conexión y lectura exitosa desde Google Sheets!",
      filasObtenidas: datos
    });
  } catch (error) {
    console.error("Error en la ruta de prueba:", error);
    res.status(500).json({ 
      status: "error", 
      mensaje: "Fallo la conexión con Google Sheets", 
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