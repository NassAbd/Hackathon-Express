const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: "Utilisateur créé avec succès !" });
  } catch (error) {
    console.error("Erreur serveur :", error);
    res.status(500).json({ error: `Erreur serveur ${error}` });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      console.log("Utilisateur introuvable");
      return res.status(400).json({ error: "Utilisateur introuvable" });
    }

    console.log("Mot de passe en base :", user.password);

    const isMatch = await bcrypt.compare(password, user.password);
    console.log("Résultat comparaison bcrypt :", isMatch);

    if (!isMatch) {
      console.log("Le mot de passe ne correspond pas !");
      return res.status(400).json({ error: "Mot de passe incorrect" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({ token, user });
  } catch (error) {
    console.error("Erreur serveur :", error); // 🔴 Ajoute ce log pour voir le problème exact
    res.status(500).json({ error: "Erreur serveur" });
  }
};

