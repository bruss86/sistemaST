const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
//const cron = require("node-cron");
const authRoutes = require("./routes/authRoutes");
const servicioTerceroRoutes = require("./routes/servicioTerceroRoutes");
const gmailAuth = require("./routes/gmailAuth");

const procesarCorreos =
  require("./jobs/procesarCorreos");

/*cron.schedule("* * * * *", async () => {

  console.log("Buscando correos...");

  try {
    await procesarCorreos();
  } catch (error) {
    console.error(error);
  }
}); */



const app = express();
app.use(cors());
const instrumentoRoutes = require("./routes/instrumentoRoutes");
const clienteRoutes = require("./routes/clienteRoutes");
const repuestoRoutes = require("./routes/repuestoRoutes");
const tareaRoutes = require("./routes/tareaRoutes");
const casos = require("./routes/casos");


/*app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://sistemast.onrender.com",
      "https://sistema-st-frontend.vercel.app/"
    ],
    credentials: true,
  })
);*/

app.use(express.json());

app.use("/instrumentos", instrumentoRoutes);
app.use("/clientes", clienteRoutes);
app.use("/auth", authRoutes);
app.use("/servicios-terceros", servicioTerceroRoutes);
app.use("/repuestos", repuestoRoutes);
app.use("/tareas", tareaRoutes);
app.use("/gmail", gmailAuth);
app.use("/casos", casos);


mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB conectado"))
  .catch((err) => console.log(err));

app.get("/", (req, res) => {
  res.send("API funcionando 🚀");
});

module.exports = app;