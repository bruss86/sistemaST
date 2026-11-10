const express = require("express");
const router = express.Router();
const Caso = require("../models/Caso");
const { generarNumeroCaso } = require("../services/casoService");
const { enviarRespuesta, enviarCorreoCierre } = require("../services/mailService");
const auth = require("../middleware/auth");
const { sincronizarCorreosReclamo } = require("../services/imapService");

// Importar los controladores de asignación
const {
  asignarClienteACaso,
  asignarInstrumentoACaso,
  crearCasoManual,
  actualizarCaso,
} = require("../controllers/casosController");

// 1. Obtener todos los casos
router.get("/", auth, async (req, res) => {
  try {
    const casos = await Caso.find()
      .populate("cliente", "nombre")
      .populate("instrumento", "descripcion numeroSerie")
      .sort({ fechaCreacion: -1 });
    res.json(casos);
  } catch (error) {
    console.error("❌ Error al obtener los casos:", error);
    res.status(500).json({ error: "Error al obtener los casos" });
  }
});

// 2. Sincronizar correos
router.post("/sincronizar", auth, async (req, res) => {
  try {
    const resultado = await sincronizarCorreosReclamo();
    res.status(200).json({ 
      message: `Sincronización completada. Se procesaron ${resultado.procesados} casos.` 
    });
  } catch (error) {
    console.error("❌ Error detallado en ruta /sincronizar:", error);
    res.status(500).json({ error: error.message || "Error al sincronizar con Gmail mediante IMAP" });
  }
});

// 3. 📧 RESPONDER A UN CASO DESDE EL SISTEMA
router.post("/:id/responder", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { textoRespuesta } = req.body;

    if (!textoRespuesta || !textoRespuesta.trim()) {
      return res.status(400).json({ error: "El texto de la respuesta no puede estar vacío" });
    }

    const caso = await Caso.findById(id);
    if (!caso) {
      return res.status(404).json({ error: "Caso no encontrado" });
    }

    // Buscamos el primer mensaje o el mensaje original para extraer su messageId y asunto
    const mensajeOriginal = caso.mensajes?.[0] || {};
    const messageIdOriginal = mensajeOriginal.gmailMessageId || "";
    const asuntoOriginal = caso.asunto || "";
    const textoOriginal = mensajeOriginal.texto || ""; // 👈 Extraemos el texto del mensaje original

    // Enviamos el correo usando Nodemailer con las cabeceras del hilo
    const infoCorreo = await enviarRespuesta(
      caso.remitente,
      caso.numero,
      textoRespuesta,
      asuntoOriginal,
      messageIdOriginal,
      textoOriginal
    );

    // Agregamos el mensaje saliente al arreglo de mensajes del caso en MongoDB
    caso.mensajes.push({
      gmailMessageId: infoCorreo.messageId || `msg_${Date.now()}`,
      remitente: process.env.EMAIL_USER,
      fecha: new Date(),
      texto: textoRespuesta,
    });

    // Si el caso estaba pendiente o cerrado, lo pasamos a "En Proceso"
    if (caso.estado === "Cerrado" || caso.estado === "Pendiente Cliente") {
      caso.estado = "En Proceso";
    }

    await caso.save();

    res.json({ 
      message: "Respuesta enviada con éxito", 
      caso 
    });
  } catch (error) {
    console.error("❌ Error al enviar respuesta al cliente:", error);
    res.status(500).json({ error: "Error al enviar la respuesta por correo" });
  }
});

// 4. Actualizar el estado de un caso (CON ENVÍO DE CORREO SI ES CERRADO)
router.put("/:id/estado", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const estadosValidos = ["Abierto", "En Proceso", "Pendiente Cliente", "Cerrado"];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ error: "Estado no válido" });
    }

    const casoAnterior = await Caso.findById(id);
    if (!casoAnterior) {
      return res.status(404).json({ error: "Caso no encontrado" });
    }

    const casoActualizado = await Caso.findByIdAndUpdate(
      id,
      { estado },
      { new: true }
    );

    if (estado === "Cerrado" && casoAnterior.estado !== "Cerrado") {
      try {
        await enviarCorreoCierre(casoActualizado.remitente, casoActualizado.numero, casoActualizado.asunto);
        console.log(`✅ Correo de cierre enviado exitosamente a ${casoActualizado.remitente}`);
      } catch (mailError) {
        console.error("⚠️ El caso se cerró pero falló el envío del correo:", mailError);
      }
    }

    res.json({ message: "Estado actualizado con éxito", caso: casoActualizado });
  } catch (error) {
    console.error("❌ Error al actualizar estado:", error);
    res.status(500).json({ error: "Error al actualizar el estado del caso" });
  }
});

// 5. Borrar un caso
router.delete("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    await Caso.findByIdAndDelete(id);
    res.status(200).json({ message: "Caso eliminado con éxito" });
  } catch (error) {
    console.error("Error al eliminar caso:", error);
    res.status(500).json({ error: "Error al eliminar el caso" });
  }
});

// 6. Asignar cliente e instrumento a un caso
router.put("/:casoId/cliente", auth, asignarClienteACaso);
router.put("/:casoId/instrumento", auth, asignarInstrumentoACaso);
router.post("/", auth, crearCasoManual);

module.exports = router;