const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");

const router = (usersList) => {


    const {
        getUsers,
        getUserById,
        updateUserById,
        getUserFollowers,
        followUserById
    } = require("../controllers/userController")(usersList);
    const route = express.Router();

    route.get("/", authMiddleware, getUsers);
    route.get('/:id', authMiddleware, getUserById);
    route.put('/update/:id', authMiddleware, updateUserById);
    route.get('/followers/:id', authMiddleware, getUserFollowers);
    route.put('/follow/:id', authMiddleware, followUserById);
}

module.exports = router;
