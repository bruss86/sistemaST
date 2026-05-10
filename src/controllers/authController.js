const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


// 🔥 LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Faltan datos" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Usuario no existe" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: "Password incorrecta" });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: { email: user.email }
    });

  } catch (err) {
    res.status(500).json({ error: "Error login" });
  }
};

// 🧑‍💻 REGISTER
exports.register = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Faltan datos" });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ error: "El usuario ya existe" });
    }

    const hash = await bcrypt.hash(password, 10);

    const newUser = new User({
      email,
      password: hash,
    });

    await newUser.save();

    const token = jwt.sign(
      { id: newUser._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(201).json({
      message: "Usuario creado correctamente",
      token,
      user: { email: newUser.email }
    });

  } catch (err) {
    res.status(500).json({ error: "Error al registrar usuario" });
  }
};