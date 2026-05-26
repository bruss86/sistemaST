const ServicioTercero = require("../models/ServicioTercero");

/**
 * 📌 Crear servicio técnico de tercero
 */
exports.crearServicio = async (req, res) => {
  try {
    const {
      instrumento,
      proveedor,
      tipoServicio,
      descripcion,
      fechaServicio,
      costo,
    } = req.body;
        
    const fecha = new Date(fechaServicio + "T00:00:00");

    const nuevoServicio = new ServicioTercero({
      instrumento,
      proveedor,
      tipoServicio,
      descripcion,
      fechaServicio: fecha,
      costo,
    });

    await nuevoServicio.save();

    res.status(201).json(nuevoServicio);
  } catch (error) {
    console.error("Error creando servicio:", error);
    res.status(500).json({ error: "Error creando servicio técnico" });
  }
};

/**
 * 📌 Obtener TODOS los servicios (CONSISTENTE)
 */
exports.obtenerTodos = async (req, res) => {
  try {
    const servicios = await ServicioTercero.find()
      .populate("instrumento", "descripcion numeroSerie")
      .sort({ fechaServicio: -1 });

    res.json(servicios);
  } catch (error) {
    console.error("Error obteniendo servicios:", error);
    res.status(500).json({ error: "Error obteniendo servicios técnicos" });
  }
};

/**
 * 📌 Obtener por instrumento (CORREGIDO)
 */
exports.obtenerPorInstrumento = async (req, res) => {
  try {
    const servicios = await ServicioTercero.find({
      instrumento: req.params.id,
    })
      .populate("instrumento", "descripcion numeroSerie")
      .sort({ fechaServicio: -1 });

    res.json(servicios);
  } catch (error) {
    console.error("Error obteniendo servicios:", error);
    res.status(500).json({ error: "Error obteniendo servicios técnicos" });
  }
};

/**
 * 📌 Eliminar servicio
 */
exports.eliminarServicio = async (req, res) => {
  try {
    await ServicioTercero.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Servicio técnico eliminado correctamente",
    });
  } catch (error) {
    console.error("Error eliminando servicio:", error);
    res.status(500).json({ error: "Error eliminando servicio técnico" });
  }
};

exports.actualizarServicio = async (req, res) => {
  try {
    const servicio = await ServicioTercero.findByIdAndUpdate(
      req.params.id,
      {
        instrumento: req.body.instrumento,
        proveedor: req.body.proveedor,
        tipoServicio: req.body.tipoServicio,
        descripcion: req.body.descripcion,
        fechaServicio: new Date(req.body.fechaServicio + "T00:00:00"),
        costo: req.body.costo,
      },
      {
        new: true,
        runValidators: true,
      }
    ).populate("instrumento", "descripcion numeroSerie");


    if (!servicio) {
      return res.status(404).json({ error: "Servicio no encontrado" });
    }

    res.json(servicio);
  } catch (error) {
    console.error("Error actualizando servicio:", error);
    res.status(500).json({ error: "Error actualizando servicio" });
  }
};