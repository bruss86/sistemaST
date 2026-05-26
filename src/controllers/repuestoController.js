const Repuesto = require("../models/Repuesto");

/**
 * 📌 Crear repuesto
 */
exports.crearRepuesto = async (req, res) => {
  try {
    const { nombre, codigo, descripcion, stock, stockMinimo } = req.body;

    const nuevoRepuesto = new Repuesto({
      nombre,
      codigo,
      descripcion,
      stock,
      stockMinimo,
    });

    await nuevoRepuesto.save();

    res.status(201).json(nuevoRepuesto);
  } catch (error) {
    console.error("Error creando repuesto:", error);
    res.status(500).json({ error: "Error creando repuesto" });
  }
};

/**
 * 📌 Obtener todos los repuestos
 */
exports.obtenerRepuestos = async (req, res) => {
  try {
    const repuestos = await Repuesto.find().sort({ nombre: 1 });

    res.json(repuestos);
  } catch (error) {
    console.error("Error obteniendo repuestos:", error);
    res.status(500).json({ error: "Error obteniendo repuestos" });
  }
};

/**
 * 📌 Obtener repuestos con bajo stock
 */
exports.obtenerBajoStock = async (req, res) => {
  try {
    const repuestos = await Repuesto.find({
      $expr: { $lte: ["$stock", "$stockMinimo"] },
    }).sort({ stock: 1 });

    res.json(repuestos);
  } catch (error) {
    console.error("Error obteniendo bajo stock:", error);
    res.status(500).json({ error: "Error obteniendo repuestos bajo stock" });
  }
};

/**
 * 📌 Actualizar repuesto
 */
exports.actualizarRepuesto = async (req, res) => {
  try {
    const repuesto = await Repuesto.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!repuesto) {
      return res.status(404).json({ error: "Repuesto no encontrado" });
    }

    res.json(repuesto);
  } catch (error) {
    console.error("Error actualizando repuesto:", error);
    res.status(500).json({ error: "Error actualizando repuesto" });
  }
};

/**
 * 📌 Eliminar repuesto
 */
exports.eliminarRepuesto = async (req, res) => {
  try {
    const repuesto = await Repuesto.findByIdAndDelete(req.params.id);

    if (!repuesto) {
      return res.status(404).json({ error: "Repuesto no encontrado" });
    }

    res.json({ mensaje: "Repuesto eliminado correctamente" });
  } catch (error) {
    console.error("Error eliminando repuesto:", error);
    res.status(500).json({ error: "Error eliminando repuesto" });
  }
};

/**
 * 📌 Ajustar stock manualmente
 * body:
 * {
 *   tipo: "sumar" | "restar",
 *   cantidad: number
 * }
 */
exports.ajustarStock = async (req, res) => {
  try {
    const { tipo, cantidad } = req.body;

    const repuesto = await Repuesto.findById(req.params.id);

    if (!repuesto) {
      return res.status(404).json({ error: "Repuesto no encontrado" });
    }

    const cant = Number(cantidad);

    if (isNaN(cant) || cant <= 0) {
      return res.status(400).json({ error: "Cantidad inválida" });
    }

    if (tipo === "sumar") {
      repuesto.stock += cant;
    } else if (tipo === "restar") {
      if (repuesto.stock - cant < 0) {
        return res.status(400).json({ error: "Stock insuficiente" });
      }
      repuesto.stock -= cant;
    } else {
      return res.status(400).json({ error: "Tipo inválido" });
    }

    await repuesto.save();

    res.json(repuesto);
  } catch (error) {
    console.error("Error ajustando stock:", error);
    res.status(500).json({ error: "Error ajustando stock" });
  }
};