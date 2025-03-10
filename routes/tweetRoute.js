const express = require('express');
const { createTweet, getTweets, getTweetById, putTweetById, delTweetById } = require('../controllers/tweetController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/', authMiddleware, createTweet);
router.get('/', authMiddleware, getTweets);
router.get('/:id', authMiddleware, getTweetById);
router.put('/:id', authMiddleware, putTweetById);
router.delete('/:id', authMiddleware, delTweetById);

module.exports = router;