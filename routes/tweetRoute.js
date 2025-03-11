const express = require('express');
const {createTweet, getTweets, getTweetById, putTweetById, delTweetById, addUserEmotion} = require('../controllers/tweetController');
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

router.post("/:id/emotion", authMiddleware, multer.single("image"), addUserEmotion)

module.exports = router;