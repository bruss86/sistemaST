const Cliente = require("../models/Cliente");
const Instrumento = require("../models/Instrumento");

// 📌 Obtener todos los clientes (con instrumentos opcionalmente)
exports.getClientes = async (req, res) => {
  try {
    const clientes = await Cliente.find();
    res.json(clientes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener clientes" });
  }
};

// 📌 Obtener cliente por ID
exports.getClienteById = async (req, res) => {
  try {
    const cliente = await Cliente.findById(req.params.id).populate(
      "instrumentos"
    );

    if (!cliente) {
      return res.status(404).json({
        error: "Cliente no encontrado",
      });
    }

    res.json(cliente);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Error al obtener el cliente",
    });
  }
};

// 📌 Crear cliente
exports.createCliente = async (req, res) => {
  try {
    const nuevoCliente = new Cliente(req.body);

    const clienteGuardado = await nuevoCliente.save();

    res.status(201).json(clienteGuardado);
  } catch (error) {
    console.error(error);

    res.status(400).json({
      error: "Error al crear cliente",
    });
  }
};

// 📌 Actualizar cliente
exports.updateCliente = async (req, res) => {
  try {
    const clienteActualizado = await Cliente.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!clienteActualizado) {
      return res.status(404).json({
        error: "Cliente no encontrado",
      });
    }

    res.json(clienteActualizado);
  } catch (error) {
    console.error(error);

    res.status(400).json({
      error: "Error al actualizar cliente",
    });
  }
};

// 📌 Eliminar cliente
exports.deleteCliente = async (req, res) => {
  try {
    const clienteEliminado = await Cliente.findByIdAndDelete(req.params.id);

    if (!clienteEliminado) {
      return res.status(404).json({
        error: "Cliente no encontrado",
      });
    }

    res.json({
      mensaje: "Cliente eliminado correctamente",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Error al eliminar cliente",
    });
  }
};

// 📌 instrumentos de un cliente
exports.getInstrumentosByCliente = async (req, res) => {
  try {
    const instrumentos = await Instrumento.find({
      cliente: req.params.id,
    });

    res.json(instrumentos);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Error al obtener instrumentos del cliente",
    });
  }
};