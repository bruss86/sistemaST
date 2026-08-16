require("dotenv").config();


//BORRAR AL ENVIAR AL BACKEND-----

const dns = require("dns");
dns.setServers([
  "8.8.8.8",
  "8.8.4.4"
]);

//--------------------------------

const app = require("./src/app");


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
