const gmail = require("./gmailService");

async function enviarRespuesta(destinatario, numeroCaso) {

  const mensaje = [
    `To: ${destinatario}`,
    `Subject: [${numeroCaso}] Caso recibido`,
    "Content-Type: text/plain; charset=utf-8",
    "",
    "Hemos recibido su solicitud.",
    "",
    `Número de caso: ${numeroCaso}`,
    "",
    "Por favor responda sobre este mismo correo para agregar información al caso.",
  ].join("\n");

  const encodedMessage = Buffer.from(mensaje)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: encodedMessage,
    },
  });
}

module.exports = {
  enviarRespuesta,
};