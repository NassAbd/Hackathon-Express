const express = require("express");
const { getUsers, getUserById,updateUserById,getUserFollowers,followUserById } = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// router.get("/profile", authMiddleware, getUserProfile);
router.get("/", authMiddleware, getUsers);
router.get('/:id', authMiddleware, getUserById);
router.put('/update/:id', authMiddleware, updateUserById);
router.get('/followers/:id', authMiddleware,  getUserFollowers);
router.post('/follow/:id', authMiddleware, followUserById);

module.exports = router;
