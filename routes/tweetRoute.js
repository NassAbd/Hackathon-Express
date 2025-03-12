const express = require('express');
const {createTweet, getTweets, getTweetById, putTweetById, delTweetById, addUserEmotion, likeTweet, saveTweet, reTweet, mentionUser, getTweetCountByDay, getTweetCountByMonth} = require('../controllers/tweetController');
const authMiddleware = require('../middlewares/authMiddleware');
const multer = require("../middlewares/multer");
const axios = require("axios");
const fs = require("node:fs");
const FormData = require("form-data");
const Tweet = require('../models/Tweet');
const User = require('../models/User');


const router = express.Router();

router.post('/', authMiddleware, createTweet);
router.get('/', authMiddleware, getTweets);
router.get('/:id', authMiddleware, getTweetById);
router.put('/:id', authMiddleware, putTweetById);
router.delete('/:id', authMiddleware, delTweetById);

router.put('/like/:id', authMiddleware, likeTweet);
router.put('/save/:id', authMiddleware, saveTweet);
router.put('/retweet/:id', authMiddleware, reTweet);
router.put('/mention/:id', authMiddleware, mentionUser);

router.post("/:id/emotion", authMiddleware, multer.single("image"), addUserEmotion)


//backoffice data
router.get('/getTweetCountByDay/:id/:range', getTweetCountByDay);
router.get('/getTweetCountByMonth/:id/:range', getTweetCountByMonth);
    

module.exports = router;