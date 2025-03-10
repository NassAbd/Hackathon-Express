const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const { getNotifications, markAsRead, toggleNotifications } = require("../controllers/notificationController");

const router = express.Router();

router.get("/", authMiddleware, getNotifications); // Récupérer les notifications
router.put("/:id/read", authMiddleware, markAsRead); // Marquer une notification comme lue
router.post("/toggle", authMiddleware, toggleNotifications); // Activer/désactiver les notifications

module.exports = router;
