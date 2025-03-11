const Notification = require("../models/Notification");
const User = require("../models/User");

// Récupérer les notifications d'un utilisateur
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .populate("sender", "username avatar")
      .populate("tweet", "content")
      .sort({ createdAt: -1 });

    res.json(notifications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Marquer une notification comme lue
const markAsRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ message: "Notification marquée comme lue" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Activer/désactiver les notifications (Préférences utilisateur)
const toggleNotifications = async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }
  
      // Vérifier si le corps de la requête contient des préférences valides
      const { notificationPreferences } = req.body;
      if (!notificationPreferences || typeof notificationPreferences !== "object") {
        return res.status(400).json({ message: "Données de préférence invalides" });
      }
  
      // Mettre à jour uniquement les préférences fournies dans la requête
      Object.keys(notificationPreferences).forEach((key) => {
        if (user.notificationPreferences.hasOwnProperty(key)) {
          user.notificationPreferences[key] = notificationPreferences[key];
        }
      });
  
      await user.save();
      res.json({
        message: "Préférences de notification mises à jour",
        preferences: user.notificationPreferences
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Erreur serveur" });
    }
  };

module.exports = { getNotifications, markAsRead, toggleNotifications };