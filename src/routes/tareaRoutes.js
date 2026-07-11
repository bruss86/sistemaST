const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");


const {
  crearTarea,
  obtenerTareas,
  obtenerTareaPorId,
  actualizarTarea,
  eliminarTarea,
  enviarResumenTareas,
} = require("../controllers/tareaController");

// =========================
// CREATE
// =========================
router.post("/", auth, crearTarea);

// =========================
// READ ALL
// =========================
router.get("/", auth, obtenerTareas);

// =========================
// READ ONE
// =========================
router.get("/:id", auth, obtenerTareaPorId);

// =========================
// UPDATE
// =========================
router.put("/:id", auth, actualizarTarea);

// =========================
// DELETE
// =========================
router.delete("/:id", auth, eliminarTarea);

router.post("/enviar-resumen", auth, enviarResumenTareas);

module.exports = router;