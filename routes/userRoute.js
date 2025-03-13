const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");

const router = (usersList) => {


    const {
        getUsers,
        getCurrentUser,
        getUserById,
        updateUserById,
        getUserFollowers,
        followUserById,
        getListUserInMonth,
        getListUserByDay
    } = require("../controllers/userController")(usersList);
    const route = express.Router();

    route.get("/current", authMiddleware, getCurrentUser);
    route.get("/", authMiddleware, getUsers);
    route.get('/:id', authMiddleware, getUserById);
    route.put('/update/:id', authMiddleware, updateUserById);
    route.get('/followers/:id', authMiddleware, getUserFollowers);
    route.put('/follow/:id', authMiddleware, followUserById);

    //backoffice data
    route.get('/getListUserInMonth/:id/:range', getListUserInMonth);
    route.get('/getListUserByDay/:id/:range', getListUserByDay);

    return route
}





module.exports = router;
