const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  }, // L'utilisateur qui reçoit la notification
  sender: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  }, // L'utilisateur qui a déclenché l'événement (like, follow, etc.)
  type: { 
    type: String, 
    enum: ["like", "retweet", "reply", "follow", "mention"], 
    required: true 
  },
  tweet: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Tweet",
    default: null 
  }, // Le tweet concerné (facultatif)
  isRead: { 
    type: Boolean, 
    default: false 
  }, // L'utilisateur a-t-il vu la notif ?
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model("Notification", NotificationSchema);