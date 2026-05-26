const Instrumento = require("../models/Instrumento");
const Cliente = require("../models/Cliente");

/**
 * 📌 Obtener todos los instrumentos
 */
exports.getInstrumentos = async (req, res) => {
  try {
    const instrumentos = await Instrumento.find()
      .populate("cliente")
      .sort({ createdAt: -1 });

    res.json(instrumentos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener instrumentos" });
  }
};

/**
 * 📌 Obtener instrumento por ID
 */
exports.getInstrumentoById = async (req, res) => {
  try {
    const instrumento = await Instrumento.findById(req.params.id).populate(
      "cliente"
    );

    if (!instrumento) {
      return res.status(404).json({ error: "Instrumento no encontrado" });
    }

    res.json(instrumento);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener el instrumento" });
  }
};

/**
 * 📌 Crear instrumento
 */
exports.createInstrumento = async (req, res) => {
  try {
    const {
      numeroSerie,
      numeroPartida,
      descripcion,
      condicion,
      cliente,
    } = req.body;

    // validar cliente obligatorio
    if (!cliente) {
      return res.status(400).json({
        error: "Cliente es obligatorio",
      });
    }

    const clienteExiste = await Cliente.findById(cliente);

    if (!clienteExiste) {
      return res.status(404).json({
        error: "Cliente no encontrado",
      });
    }

    // 🔥 corregir timezone
    const fechaUltimoMantenimiento =
      req.body.fechaUltimoMantenimiento
        ? new Date(
            req.body.fechaUltimoMantenimiento + "T00:00:00"
          )
        : null;

    const nuevoInstrumento = new Instrumento({
      numeroSerie,
      numeroPartida,
      descripcion,
      condicion,
      cliente,
      fechaUltimoMantenimiento,
    });

    const guardado = await nuevoInstrumento.save();

    // actualizar cliente
    await Cliente.updateOne(
      { _id: cliente },
      { $push: { instrumentos: guardado._id } }
    );

    res.status(201).json(guardado);

  } catch (error) {
    console.error(error);

    res.status(400).json({
      error: "Error al crear instrumento",
      details: error.message,
    });
  }
};

/**
 * 📌 Actualizar instrumento
 */
exports.updateInstrumento = async (req, res) => {
  try {

    // 🔥 corregir fecha para evitar problema timezone
    if (req.body.fechaUltimoMantenimiento) {
      req.body.fechaUltimoMantenimiento = new Date(
        req.body.fechaUltimoMantenimiento + "T00:00:00"
      );
    }

    const instrumentoAnterior = await Instrumento.findById(req.params.id);

    if (!instrumentoAnterior) {
      return res.status(404).json({
        error: "Instrumento no encontrado",
      });
    }

    // 🔥 si cambia el cliente, actualizar relaciones
    if (
      req.body.cliente &&
      instrumentoAnterior.cliente?.toString() !== req.body.cliente
    ) {

      // quitar del cliente anterior
      if (instrumentoAnterior.cliente) {
        await Cliente.updateOne(
          { _id: instrumentoAnterior.cliente },
          { $pull: { instrumentos: instrumentoAnterior._id } }
        );
      }

      // agregar al nuevo cliente
      await Cliente.updateOne(
        { _id: req.body.cliente },
        { $push: { instrumentos: instrumentoAnterior._id } }
      );
    }

    const actualizado = await Instrumento.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    ).populate("cliente");

    res.json(actualizado);

  } catch (error) {
    console.error(error);

    res.status(400).json({
      error: "Error al actualizar instrumento",
    });
  }
};

/**
 * 📌 Eliminar instrumento
 */
exports.deleteInstrumento = async (req, res) => {
  try {
    const eliminado = await Instrumento.findByIdAndDelete(req.params.id);

    if (!eliminado) {
      return res.status(404).json({ error: "Instrumento no encontrado" });
    }

    // limpiar relación cliente
    if (eliminado.cliente) {
      await Cliente.updateOne(
        { _id: eliminado.cliente },
        { $pull: { instrumentos: eliminado._id } }
      );
    }

    res.json({ mensaje: "Instrumento eliminado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar instrumento" });
  }
};

/**
 * 📌 Obtener instrumentos por cliente
 */
exports.obtenerInstrumentosPorCliente = async (req, res) => {
  try {
    const { clienteId } = req.params;

    const instrumentos = await Instrumento.find({
      cliente: clienteId,
    })
      .populate("cliente")
      .sort({ descripcion: 1 });

    res.json(instrumentos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error obteniendo instrumentos" });
  }
};