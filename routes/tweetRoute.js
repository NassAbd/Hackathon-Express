const express = require('express');
const { createTweet, getTweets, getTweetById, putTweetById, delTweetById, likeTweet, retweetTweet, replyToTweet, mentionUser, followUser } = require('../controllers/tweetController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/', authMiddleware, createTweet);
router.get('/', authMiddleware, getTweets);
router.get('/:id', authMiddleware, getTweetById);
router.put('/:id', authMiddleware, putTweetById);
router.delete('/:id', authMiddleware, delTweetById);

router.post("/:id/like", authMiddleware, likeTweet); // Liker un tweet
router.post("/:id/retweet", authMiddleware, retweetTweet); // Retweeter un tweet
router.post("/:id/reply", authMiddleware, replyToTweet); // Répondre à un tweet
router.post("/mention", authMiddleware, mentionUser); // Mentionner un utilisateur
router.post("/:id/follow", authMiddleware, followUser); // Suivre un utilisateur

module.exports = router;