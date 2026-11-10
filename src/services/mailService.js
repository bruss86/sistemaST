const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Envía una respuesta de soporte manteniendo el hilo original y adjuntando el mensaje original abajo.
 */

const firma = `<br><br>
<hr style="border: none; border-top: 1px solid #ccc;">
<strong>Atentamente,</strong><br>
<strong>Servicio Técnico | BIOARS</strong><br>
📧 <a href="mailto:${process.env.EMAIL_USER}" style="color: #0d6efd; text-decoration: none;">${process.env.EMAIL_USER}</a><br>
🌐 <a href="https://www.bioars.com.ar">www.bioars.com.ar</a>`;

async function enviarRespuesta(
  destinatario, 
  numeroCaso, 
  textoRespuesta, 
  asuntoOriginal = "", 
  messageIdOriginal = "",
  cuerpoOriginal = "" 
) {
  try {
    const asuntoFinal = asuntoOriginal 
      ? `Re: ${asuntoOriginal} [${numeroCaso}]` 
      : `Actualización de su caso [${numeroCaso}]`;


    // ✉️ Construimos el cuerpo del correo combinando tu respuesta y citando el mensaje original abajo
   
    let cuerpoFinalParaEnviar = textoRespuesta + firma;

    if (cuerpoOriginal) {
      cuerpoFinalParaEnviar += `\n\n----------------------------------------\nEl mensaje original:\n${cuerpoOriginal}`;
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: destinatario,
      subject: asuntoFinal,
      html: cuerpoFinalParaEnviar, // Enviamos el texto combinado
      inReplyTo: messageIdOriginal,
      references: messageIdOriginal ? [messageIdOriginal] : [],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Correo de respuesta enviado a ${destinatario} en el hilo [${numeroCaso}]. ID:`, info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Error al enviar la respuesta por correo:", error);
    throw error;
  }
}

async function enviarCorreoCierre(destinatario, numeroCaso, asuntoOriginal = "") {
  try {
    const asuntoFinal = asuntoOriginal 
      ? `Caso Cerrado: ${asuntoOriginal} [${numeroCaso}]` 
      : `Su caso [${numeroCaso}] ha sido cerrado`;

    

    const texto = `Hola,\n\nTe informamos que tu caso con número [${numeroCaso}] ha sido marcado como Cerrado.\n\nGracias por comunicarte con nosotros.` + firma;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: destinatario,
      subject: asuntoFinal,
      html: texto,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Correo de cierre enviado exitosamente a ${destinatario}`);
    return info;
  } catch (error) {
    console.error("❌ Error al enviar correo de cierre:", error);
    throw error;
  }
}

module.exports = {
  enviarRespuesta,
  enviarCorreoCierre,
};