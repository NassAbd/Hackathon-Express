const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const multer = require("../middlewares/multer");

const router = (userList, server) => {

    const {
        createTweet,
        getTweets,
        getAllTweets,
        getPersonalizedFeed,
        getTweetsByUser,
        getTweetById,
        putTweetById,
        delTweetById,
        delTweetByIdAdmin,
        addUserEmotion,
        likeTweet,
        saveTweet,
        reTweet,
        mentionUser,
        getTweetCountByDay,
        getTweetCountByMonth,
        getAllTweetsPlus,
        getTrends,
        getTweetByTrends
    } = require('../controllers/tweetController')(userList, server);

    const route = express.Router();

    route.post('/', authMiddleware, multer.single("file"), createTweet);
    route.get('/', authMiddleware, getTweets);
    route.get('/tweetsPlus/:userId',authMiddleware , getAllTweetsPlus);
    route.get('/all', authMiddleware, getAllTweets);
    route.get('/perso', authMiddleware, getPersonalizedFeed);
    route.get('/trends', authMiddleware, getTrends);
    route.get('/trends/:id', authMiddleware, getTweetByTrends);
    route.get('/user/:id', authMiddleware, getTweetsByUser);
    route.get('/:id', authMiddleware, getTweetById);
    route.put('/:id', authMiddleware, putTweetById);
    route.delete('/:id', authMiddleware, delTweetById);
    route.delete('/:id/admin/:userId',authMiddleware , delTweetByIdAdmin);

    route.put('/like/:id', authMiddleware, likeTweet);
    route.put('/save/:id', authMiddleware, saveTweet);
    route.put('/retweet/:id', authMiddleware, reTweet);
    route.put('/mention/:id', authMiddleware, mentionUser);

    route.post("/:id/emotion", authMiddleware, multer.single("image"), addUserEmotion)

    //backoffice data
    route.get('/getTweetCountByDay/:id/:range/:userId',authMiddleware , getTweetCountByDay);
    route.get('/getTweetCountByMonth/:id/:range/:userId',authMiddleware , getTweetCountByMonth);
    

    return route
}



    

module.exports = router;