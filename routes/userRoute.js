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
        getListUserByDay,
        getUsersPlus,
        delUserByIdAdmin
    } = require("../controllers/userController")(usersList);
    
    const route = express.Router();

    
    
    //backoffice
    route.get('/getListUserInMonth/:id/:range/:userId', authMiddleware , getListUserInMonth);
    //backoffice
    route.get('/getListUserByDay/:id/:range/:userId', authMiddleware , getListUserByDay);

    route.delete('/:id/admin/:userId', authMiddleware, delUserByIdAdmin);
    route.put('/update/:id', authMiddleware, updateUserById);
    route.get('/followers/:id', authMiddleware, getUserFollowers);
    route.put('/follow/:id', authMiddleware, followUserById);

    //backoffice get more info on user
    route.get('/userPlus/:userId', authMiddleware ,getUsersPlus);

    route.get("/current", authMiddleware, getCurrentUser);
    route.get("/", authMiddleware , getUsers);
    route.get('/:id', authMiddleware, getUserById);
    

    return route
}





module.exports = router;
