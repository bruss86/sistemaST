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
// ENDPOINT CRON
// =========================
router.post("/enviar-resumen", enviarResumenTareas);

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

module.exports = router;