const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const servicioTerceroController = require("../controllers/servicioTerceroController");

/**
 * 📌 Crear servicio
 */
router.post("/", auth, servicioTerceroController.crearServicio);

/**
 * 📌 Obtener todos
 */
router.get("/", auth, servicioTerceroController.obtenerTodos);

/**
 * 📌 Obtener por instrumento
 */
router.get(
  "/instrumento/:id",
  auth,
  servicioTerceroController.obtenerPorInstrumento
);

/**
 * 📌 Eliminar servicio
 */
router.delete("/:id", auth, servicioTerceroController.eliminarServicio);

router.put("/:id", auth, servicioTerceroController.actualizarServicio);

module.exports = router;