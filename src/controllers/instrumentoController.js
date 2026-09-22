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
    const instrumento = await Instrumento.findById(req.params.id)
    .populate("cliente");

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
      codigo,
      numeroSerie,
      numeroPartida,
      descripcion,
      condicion,
      cliente,
      fechaUltimoMantenimiento,
      notas,
    } = req.body;

    //validaciones básicas
    if(!numeroSerie?.trim()) {
      return res.status(400).json({
        error: "Número de serie es obligatorio",
      });
    }

    if(!descripcion?.trim()) {
      return res.status(400).json({
        error: "Descripción es obligatoria",
      });
    }

    // validar cliente solamente si fue informado
    if (cliente) {
      const clienteExistente = await Cliente.findById(cliente);
      if (!clienteExistente) {
        return res.status(404).json({
          error: "Cliente no encontrado",
        });
      }
    }



    const nuevoInstrumento = new Instrumento({
      codigo: codigo?.trim() || "",
      numeroSerie: numeroSerie.trim(),
      numeroPartida: numeroPartida?.trim() || undefined,
      descripcion: descripcion.trim(),
      condicion: condicion || "Comodato",
      cliente: cliente || undefined,
      fechaUltimoMantenimiento: fechaUltimoMantenimiento || undefined,
      notas: notas?.trim() || undefined,
    });

    const guardado = await nuevoInstrumento.save();

    //Agregar instrumento al cliente si fue informado
    if (cliente) {
      await Cliente.updateOne(
        { _id: cliente },
        { $addToSet: { instrumentos: guardado._id } }
      );
    }

    const resultado = await Instrumento.findById(guardado._id)
    .populate("cliente");

    res.status(201).json(resultado);

  } catch (error) {
    console.error(error);

    //Errores de campos únicos
    if (error.code === 11000) {
      const campoDuplicado = Object.keys(error.keyPattern || {})[0];

      return res.status(400).json({
        error: `El valor para el campo '${campoDuplicado}' ya existe.`,
      });
    }
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

    const instrumentoAnterior = await Instrumento.findById(req.params.id);

    if (!instrumentoAnterior) {
      return res.status(404).json({
        error: "Instrumento no encontrado",
      });
    }

    const nuevoCliente = req.body.cliente || null;

    const clienteAnterior = instrumentoAnterior.cliente?.toString() || null;

    // ==========================================
    // CAMBIÓ EL CLIENTE
    // ==========================================

    if (clienteAnterior !== nuevoCliente) {

      // quitar del cliente anterior
      if (clienteAnterior) {
        await Cliente.updateOne(
          { _id: clienteAnterior },
          { $pull: { instrumentos: instrumentoAnterior._id } }
        );
      }


      // agregar al nuevo cliente
      if (nuevoCliente) {
        const clienteExistente = await Cliente.findById(nuevoCliente);
        
        if (!clienteExistente) {
          return res.status(404).json({
            error: "Cliente no encontrado",
          });
        }
      } 



      await Cliente.updateOne(
        { _id: req.body.cliente },
        { $addToSet: { instrumentos: instrumentoAnterior._id } }
      );
    }

     // ==========================================
    // PREPARAR DATOS
    // ==========================================

    const datos = {
      codigo: req.body.codigo?.trim() || "",
      numeroSerie: req.body.numeroSerie?.trim() || instrumentoAnterior.numeroSerie,
      numeroPartida: req.body.numeroPartida?.trim() || undefined,
      descripcion: req.body.descripcion?.trim() || instrumentoAnterior.descripcion,
      condicion: req.body.condicion || instrumentoAnterior.condicion,
      cliente: req.body.cliente || undefined,
      fechaUltimoMantenimiento: req.body.fechaUltimoMantenimiento || undefined,
      notas: req.body.notas?.trim() || undefined,
    };
    

    const actualizado = await Instrumento.findByIdAndUpdate(
      req.params.id,
      datos,
      {
        new: true,
        runValidators: true,
      }
    ).populate("cliente");

    res.json(actualizado);

  } catch (error) {
    console.error(error);

    //Errores de campos únicos
    if (error.code === 11000) {
      const campoDuplicado = Object.keys(error.keyPattern || {})[0];
    
    return res.status(400).json({
      error: `El valor para el campo '${campoDuplicado}' ya existe.`,
    });
  }

    res.status(400).json({
      error: "Error al actualizar instrumento",
      details: error.message,
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