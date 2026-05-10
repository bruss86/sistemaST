require("dotenv").config();
console.log("JWT:", process.env.JWT_SECRET);
const app = require("./src/app");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
