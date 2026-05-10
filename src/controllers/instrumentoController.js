const Instrumento = require("../models/Instrumento");
const Cliente = require("../models/Cliente"); 

// Obtener todos los instrumentos
exports.getInstrumentos = async (req, res) => {
  try {
    const instrumentos = await Instrumento.find()
      .populate("cliente") // 👈 clave
      .sort({ createdAt: -1 });

    res.json(instrumentos);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Error al obtener instrumentos",
    });
  }
};

// Obtener un instrumento por ID
exports.getInstrumentoById = async (req, res) => {
  try {
    const instrumento = await Instrumento.findById(req.params.id)
      .populate("cliente");

    if (!instrumento) {
      return res.status(404).json({
        error: "Instrumento no encontrado",
      });
    }

    res.json(instrumento);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Error al obtener el instrumento",
    });
  }
};

// Crear instrumento
exports.createInstrumento = async (req, res) => {
  try {
    console.log("BODY RECIBIDO:", req.body);

    // 1. Validar cliente existe
    const cliente = await Cliente.findById(req.body.cliente);

    if (!cliente) {
      return res.status(404).json({
        error: "Cliente no encontrado",
      });
    }

    // 2. Crear instrumento
    const nuevoInstrumento = new Instrumento(req.body);
    const guardado = await nuevoInstrumento.save();

    console.log("INSTRUMENTO GUARDADO:", guardado._id);

    // 3. Actualizar cliente (IMPORTANTE: usar cliente._id real)
    await Cliente.updateOne(
      { _id: cliente._id },
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

// Actualizar instrumento
exports.updateInstrumento = async (req, res) => {
  try {
    const instrumentoActualizado = await Instrumento.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!instrumentoActualizado) {
      return res.status(404).json({
        error: "Instrumento no encontrado",
      });
    }

    res.json(instrumentoActualizado);
  } catch (error) {
    console.error(error);

    res.status(400).json({
      error: "Error al actualizar instrumento",
    });
  }
};

// Eliminar instrumento
exports.deleteInstrumento = async (req, res) => {
  try {
    const instrumentoEliminado = await Instrumento.findByIdAndDelete(
      req.params.id
    );

    if (!instrumentoEliminado) {
      return res.status(404).json({
        error: "Instrumento no encontrado",
      });
    }

    res.json({
      mensaje: "Instrumento eliminado correctamente",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Error al eliminar instrumento",
    });
  }
};