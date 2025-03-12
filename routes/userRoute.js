const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");

const router = (usersList) => {


    const {
        getUsers,
        getCurrentUser,
        getUserById,
        updateUserById,
        getUserFollowers,
        followUserById
    } = require("../controllers/userController")(usersList);
    const route = express.Router();

    route.get("/current", authMiddleware, getCurrentUser);
    route.get("/", authMiddleware, getUsers);
    route.get('/:id', authMiddleware, getUserById);
    route.put('/update/:id', authMiddleware, updateUserById);
    route.get('/followers/:id', authMiddleware, getUserFollowers);
    route.put('/follow/:id', authMiddleware, followUserById);

    return route
}

module.exports = router;
