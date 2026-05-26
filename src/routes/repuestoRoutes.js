const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const repuestoController = require("../controllers/repuestoController");

/**
 * 📌 Crear repuesto
 */
router.post("/", auth, repuestoController.crearRepuesto);

/**
 * 📌 Obtener todos los repuestos
 */
router.get("/", auth, repuestoController.obtenerRepuestos);

/**
 * 📌 Obtener repuestos con bajo stock
 */
router.get("/bajo-stock", auth, repuestoController.obtenerBajoStock);

/**
 * 📌 Actualizar repuesto
 */
router.put("/:id", auth, repuestoController.actualizarRepuesto);

/**
 * 📌 Eliminar repuesto
 */
router.delete("/:id", auth, repuestoController.eliminarRepuesto);

/**
 * 📌 Ajustar stock manualmente
 * tipo: "sumar" | "restar"
 * cantidad: number
 */
router.patch("/:id/stock", auth, repuestoController.ajustarStock);

module.exports = router;