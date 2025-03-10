const Notification = require("../models/Notification");

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
    req.user.notificationsEnabled = !req.user.notificationsEnabled;
    await req.user.save();
    res.json({ notificationsEnabled: req.user.notificationsEnabled });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

module.exports = { getNotifications, markAsRead, toggleNotifications };