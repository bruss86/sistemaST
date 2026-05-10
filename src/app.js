const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");

app.use(cors());
const app = express();

const instrumentoRoutes = require("./routes/instrumentoRoutes");
const clienteRoutes = require("./routes/clienteRoutes");



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

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB conectado"))
  .catch((err) => console.log(err));

app.get("/", (req, res) => {
  res.send("API funcionando 🚀");
});

module.exports = app;