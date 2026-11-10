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
  crearTareaDesdeCaso,
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
// NUEVA RUTA: Crear tarea desde un caso de soporte
// =========================
router.post("/desde-caso/:casoId", auth, crearTareaDesdeCaso);

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