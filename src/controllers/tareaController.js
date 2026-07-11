const Tarea = require("../models/Tarea");
const transporter = require("../config/mail");

exports.crearTarea = async (req, res) => {
  try {
    const nueva  = new Tarea({
      ...req.body,

      fecha: req.body.fecha,
    });

    await nueva.save();

    res.status(201).json(nueva);
  } catch (error) {
    console.error("Error creando tarea:", error);
    res.status(500).json({ error: "Error creando tarea" });
  }
};

exports.obtenerTareas = async (req, res) => {
  try {
    const tareas = await Tarea.find()
      .populate("cliente", "nombre")
      .populate("instrumento", "descripcion numeroSerie")
      .sort({ fecha: -1 });

    res.json(tareas);
  } catch (error) {
    console.error("Error obteniendo tareas:", error);
    res.status(500).json({ error: "Error obteniendo tareas" });
  }
};

exports.actualizarTarea = async (req, res) => {
  try {

    const updateData = {
      ...req.body,

      fecha: req.body.fecha,
    };

    const tarea = await Tarea.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    )
      .populate("cliente", "nombre")
      .populate("instrumento", "descripcion numeroSerie");

    res.json(tarea);
  } catch (error) {
    console.error("Error actualizando tarea:", error);
    res.status(500).json({ error: "Error actualizando tarea" });
  }
};

exports.eliminarTarea = async (req, res) => {
  try {
    await Tarea.findByIdAndDelete(req.params.id);
    res.json({ mensaje: "Tarea eliminada" });
  } catch (error) {
    console.error("Error eliminando tarea:", error);
    res.status(500).json({ error: "Error eliminando tarea" });
  }
};

exports.obtenerTareaPorId = async (req, res) => {
  try {
    const tarea = await Tarea.findById(req.params.id)
      .populate("cliente", "nombre")
      .populate("instrumento", "descripcion numeroSerie");

    res.json(tarea);
  } catch (error) {
    console.error("Error obteniendo tarea:", error);
    res.status(500).json({ error: "Error obteniendo tarea" });
  }
};

exports.enviarResumenTareas = async (req, res) => {
  try {
    await transporter.sendMail({
      from: `"Sistema ST" <${process.env.SMTP_USER}>`,
      to: process.env.RESUMEN_EMAIL,
      subject: "Prueba Sistema ST",
      text: "Este es un correo de prueba enviado desde el Sistema ST.",
    });

    res.json({
      ok: true,
      mensaje: "Correo enviado correctamente.",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
};