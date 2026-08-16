const Repuesto = require("../models/Repuesto");

/**
 * 📌 Crear repuesto
 */
exports.crearRepuesto = async (req, res) => {
  try {
    const {
      nombre,
      codigo,
      fabricante,
      modelo,
      descripcion,
      stock,
      stockMinimo,
    } = req.body;

    const nuevoRepuesto = new Repuesto({
      nombre,
      codigo,
      fabricante,
      modelo,
      descripcion,
      stock,
      stockMinimo,
    });

    await nuevoRepuesto.save();

    res.status(201).json(nuevoRepuesto);
  } catch (error) {
    console.error(
      "Error creando repuesto:",
      error
    );

    res.status(500).json({
      error: "Error creando repuesto",
    });
  }
};

/**
 * 📌 Obtener todos los repuestos
 */
exports.obtenerRepuestos = async (req, res) => {
  try {
    const repuestos =
      await Repuesto.find().sort({
        nombre: 1,
      });

    res.json(repuestos);
  } catch (error) {
    console.error(
      "Error obteniendo repuestos:",
      error
    );

    res.status(500).json({
      error: "Error obteniendo repuestos",
    });
  }
};

/**
 * 📌 Obtener repuestos con bajo stock
 */
exports.obtenerBajoStock = async (req, res) => {
  try {
    const repuestos =
      await Repuesto.find({
        $expr: {
          $lte: [
            "$stock",
            "$stockMinimo",
          ],
        },
      }).sort({
        stock: 1,
      });

    res.json(repuestos);
  } catch (error) {
    console.error(
      "Error obteniendo bajo stock:",
      error
    );

    res.status(500).json({
      error:
        "Error obteniendo repuestos bajo stock",
    });
  }
};

/**
 * 📌 Importar stock desde Excel
 *
 * body:
 * {
 *   movimientos: [
 *     {
 *       codigo: "ABC001",
 *       cantidad: 5
 *     },
 *     {
 *       codigo: "ABC002",
 *       cantidad: 10
 *     }
 *   ]
 * }
 *
 * La cantidad se SUMA al stock existente.
 */
exports.importarStock = async (req, res) => {
  try {
    const { movimientos } = req.body;

    // =====================================================
    // VALIDAR DATOS
    // =====================================================

    if (
      !Array.isArray(movimientos) ||
      movimientos.length === 0
    ) {
      return res.status(400).json({
        error:
          "No se recibieron movimientos de stock",
      });
    }

    // =====================================================
    // AGRUPAR CÓDIGOS
    // =====================================================

    const agrupados = new Map();

    for (const movimiento of movimientos) {
      const codigo =
        String(
          movimiento.codigo || ""
        ).trim();

      const cantidad =
        Number(
          movimiento.cantidad
        );

      if (
        !codigo ||
        !Number.isFinite(
          cantidad
        ) ||
        cantidad <= 0
      ) {
        continue;
      }

      const key =
        codigo.toLowerCase();

      if (!agrupados.has(key)) {
        agrupados.set(key, {
          codigo,
          cantidad: 0,
        });
      }

      agrupados.get(
        key
      ).cantidad += cantidad;
    }

    if (agrupados.size === 0) {
      return res.status(400).json({
        error:
          "No hay movimientos válidos para importar",
      });
    }

    // =====================================================
    // PREPARAR OPERACIONES
    // =====================================================

    const operaciones = [];

    for (const {
      codigo,
      cantidad,
    } of agrupados.values()) {
      operaciones.push({
        updateOne: {
          filter: {
            codigo: codigo,
          },

          update: {
            $inc: {
              stock: cantidad,
            },
          },
        },
      });
    }

    // =====================================================
    // ACTUALIZAR STOCK
    // =====================================================

    const resultado =
      await Repuesto.bulkWrite(
        operaciones,
        {
          ordered: false,
        }
      );

    // =====================================================
    // RESPUESTA
    // =====================================================

    res.json({
      ok: true,

      mensaje:
        "Stock importado correctamente",

      solicitados:
        agrupados.size,

      actualizados:
        resultado.modifiedCount || 0,

      noEncontrados:
        agrupados.size -
        (resultado.matchedCount || 0),
    });

  } catch (error) {
    console.error(
      "Error importando stock:",
      error
    );

    res.status(500).json({
      error:
        "Error importando stock",
    });
  }
};

/**
 * 📌 Actualizar repuesto
 */
exports.actualizarRepuesto = async (
  req,
  res
) => {
  try {
    const repuesto =
      await Repuesto.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          new: true,
        }
      );

    if (!repuesto) {
      return res.status(404).json({
        error:
          "Repuesto no encontrado",
      });
    }

    res.json(repuesto);
  } catch (error) {
    console.error(
      "Error actualizando repuesto:",
      error
    );

    res.status(500).json({
      error:
        "Error actualizando repuesto",
    });
  }
};

/**
 * 📌 Eliminar repuesto
 */
exports.eliminarRepuesto = async (
  req,
  res
) => {
  try {
    const repuesto =
      await Repuesto.findByIdAndDelete(
        req.params.id
      );

    if (!repuesto) {
      return res.status(404).json({
        error:
          "Repuesto no encontrado",
      });
    }

    res.json({
      mensaje:
        "Repuesto eliminado correctamente",
    });
  } catch (error) {
    console.error(
      "Error eliminando repuesto:",
      error
    );

    res.status(500).json({
      error:
        "Error eliminando repuesto",
    });
  }
};

/**
 * 📌 Ajustar stock manualmente
 *
 * body:
 * {
 *   tipo: "sumar" | "restar",
 *   cantidad: number
 * }
 */
exports.ajustarStock = async (
  req,
  res
) => {
  try {
    const {
      tipo,
      cantidad,
    } = req.body;

    const repuesto =
      await Repuesto.findById(
        req.params.id
      );

    if (!repuesto) {
      return res.status(404).json({
        error:
          "Repuesto no encontrado",
      });
    }

    const cant =
      Number(cantidad);

    if (
      isNaN(cant) ||
      cant <= 0
    ) {
      return res.status(400).json({
        error:
          "Cantidad inválida",
      });
    }

    if (tipo === "sumar") {
      repuesto.stock += cant;

    } else if (
      tipo === "restar"
    ) {
      if (
        repuesto.stock - cant <
        0
      ) {
        return res.status(400).json({
          error:
            "Stock insuficiente",
        });
      }

      repuesto.stock -= cant;

    } else {
      return res.status(400).json({
        error:
          "Tipo inválido",
      });
    }

    await repuesto.save();

    res.json(repuesto);

  } catch (error) {
    console.error(
      "Error ajustando stock:",
      error
    );

    res.status(500).json({
      error:
        "Error ajustando stock",
    });
  }
};