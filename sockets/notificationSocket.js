const Notification = require("../models/Notification");
const User = require("../models/User");
const Tweet = require("../models/Tweet");

// Stocker les utilisateurs connectés { userId: socketId }
const connectedUsers = new Map();

// Fonction pour envoyer une notification
const sendNotification = async (userId, senderId, type, tweetId = null, io) => {
  try {
    const notification = new Notification({
      user: userId,
      sender: senderId,
      type,
      tweet: tweetId,
    });
    await notification.save();

    const socketId = connectedUsers.get(userId);
    if (socketId) {
      io.to(socketId).emit("new_notification", notification);
      console.log(`📩 Notification envoyée à ${userId} : ${type}`);
    }
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi de la notification :", error);
  }
};

// Fonction principale pour gérer WebSockets
const setupNotificationSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("🟢 Un utilisateur s'est connecté :", socket.id);

    socket.on("identify", (userId) => {
      connectedUsers.set(userId, socket.id);
      console.log(`✅ Utilisateur ${userId} enregistré avec le socket ${socket.id}`);
    });

    socket.on("disconnect", () => {
      for (let [userId, socketId] of connectedUsers.entries()) {
        if (socketId === socket.id) {
          connectedUsers.delete(userId);
          console.log(`🔴 Utilisateur ${userId} déconnecté`);
          break;
        }
      }
    });

    socket.on("toggle_notifications", (userId, enabled) => {
      if (enabled) {
        connectedUsers.set(userId, socket.id);
        console.log(`🔔 Notifications activées pour ${userId}`);
      } else {
        connectedUsers.delete(userId);
        console.log(`🔕 Notifications désactivées pour ${userId}`);
      }
    });
  });
};

// Exporte la fonction de configuration et l'envoi de notifications
module.exports = { setupNotificationSocket, sendNotification };
