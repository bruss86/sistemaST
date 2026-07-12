const Tarea = require("../models/Tarea");
const resend = require("../config/mail");

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
    const tareas = await Tarea.find({
      estado: { $in: ["Pendiente", "En proceso"] },
    })
      .populate("cliente", "nombre")
      .populate("instrumento", "descripcion numeroSerie")
      .lean();

    // =========================
    // ESTADÍSTICAS
    // =========================
    const pendientes = tareas.filter(
      (t) => t.estado === "Pendiente"
    ).length;

    const proceso = tareas.filter(
      (t) => t.estado === "En proceso"
    ).length;

    const urgentes = tareas.filter(
      (t) => t.prioridad === "Urgente"
    ).length;

    const altas = tareas.filter(
      (t) => t.prioridad === "Alta"
    ).length;

    const medias = tareas.filter(
      (t) => t.prioridad === "Media"
    ).length;

    const bajas = tareas.filter(
      (t) => t.prioridad === "Baja"
    ).length;

    // =========================
    // ORDEN
    // =========================
    const prioridadOrden = {
      Urgente: 1,
      Alta: 2,
      Media: 3,
      Baja: 4,
    };

    tareas.sort((a, b) => {
      const pa = prioridadOrden[a.prioridad] || 99;
      const pb = prioridadOrden[b.prioridad] || 99;

      if (pa !== pb) return pa - pb;

      return a.fecha.localeCompare(b.fecha);
    });

    // =========================
    // FILAS TABLA
    // =========================
    const filas = tareas
      .map((t) => {
        let color = "#6c757d";

        if (t.prioridad === "Urgente") color = "#dc3545";
        if (t.prioridad === "Alta") color = "#fd7e14";
        if (t.prioridad === "Media") color = "#0d6efd";
        if (t.prioridad === "Baja") color = "#198754";

        return `
        <tr>
          <td style="padding:10px;border:1px solid #ddd;">${t.fecha}</td>

          <td style="padding:10px;border:1px solid #ddd;">
            ${t.cliente?.nombre || "-"}
          </td>

          <td style="padding:10px;border:1px solid #ddd;">
            ${t.instrumento?.descripcion || "-"}
          </td>

          <td style="padding:10px;border:1px solid #ddd;">
            ${t.tarea}
          </td>

          <td style="padding:10px;border:1px solid #ddd;">
            ${t.responsable || "-"}
          </td>

          <td
            style="
              padding:10px;
              border:1px solid #ddd;
              text-align:center;
              font-weight:bold;
              color:white;
              background:${color};
            "
          >
            ${t.prioridad}
          </td>
        </tr>
      `;
      })
      .join("");

    // =========================
    // HTML
    // =========================
    const html = `
<!DOCTYPE html>
<html>

<head>
<meta charset="UTF-8">

</head>

<body style="
font-family:Arial,Helvetica,sans-serif;
background:#f4f6f9;
padding:30px;
">

<div style="
max-width:1100px;
margin:auto;
background:white;
border-radius:10px;
overflow:hidden;
box-shadow:0 2px 10px rgba(0,0,0,.15);
">

<div style="
background:#0d6efd;
color:white;
padding:25px;
">

<h1 style="margin:0;">
📋 Sistema ST
</h1>

<p style="margin-top:8px;">
Resumen diario de tareas
</p>

</div>

<div style="padding:25px;">

<h2>Resumen</h2>

<table style="width:100%;margin-bottom:25px;">

<tr>

<td><b>Total</b></td>
<td>${tareas.length}</td>

<td><b>Pendientes</b></td>
<td>${pendientes}</td>

<td><b>En proceso</b></td>
<td>${proceso}</td>

</tr>

<tr>

<td><b>Urgentes</b></td>
<td>${urgentes}</td>

<td><b>Altas</b></td>
<td>${altas}</td>

<td><b>Medias</b></td>
<td>${medias}</td>

</tr>

<tr>

<td><b>Bajas</b></td>
<td>${bajas}</td>

</tr>

</table>

<h2>Tareas pendientes</h2>

<table
style="
width:100%;
border-collapse:collapse;
font-size:14px;
"
>

<thead>

<tr style="
background:#343a40;
color:white;
">

<th style="padding:10px;">Fecha</th>
<th>Cliente</th>
<th>Instrumento</th>
<th>Tarea</th>
<th>Responsable</th>
<th>Prioridad</th>

</tr>

</thead>

<tbody>

${filas}

</tbody>

</table>

<p style="
margin-top:30px;
font-size:12px;
color:#777;
text-align:center;
">

Correo generado automáticamente por Sistema ST.

</p>

</div>

</div>

</body>

</html>
`;

    // =========================
    // ENVÍO
    // =========================
    const resultado = await resend.emails.send({
      from: "Sistema ST <onboarding@resend.dev>",
      to: process.env.RESUMEN_EMAIL,
      subject: "📋 Resumen diario de tareas",
      html,
    });

    res.json(resultado);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
};