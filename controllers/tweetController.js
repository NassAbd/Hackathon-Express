const express = require('express');
const Tweet = require('../models/Tweet');
const { sendNotification } = require("../sockets/notificationSocket"); // Import de la fonction Socket.io

const likeTweet = async (req, res) => {
  try {
    const tweet = await Tweet.findById(req.params.id);

    if (!tweet) {
      return res.status(404).json({ message: "Tweet non trouvé" });
    }

    // Vérifier si l'utilisateur a déjà liké
    if (tweet.likes.includes(req.user.id)) {
      return res.status(400).json({ message: "Vous avez déjà liké ce tweet" });
    }

    tweet.likes.push(req.user.id);
    await tweet.save();

    // Envoyer une notification
    if (tweet.author.toString() !== req.user.id) {
      sendNotification(tweet.author.toString(), {
        user: tweet.author.toString(),
        sender: req.user.id,
        type: "like",
        tweet: tweet._id,
      });
    }

    res.json({ message: "Tweet liké" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

const retweetTweet = async (req, res) => {
  try {
    const tweet = await Tweet.findById(req.params.id);

    if (!tweet) {
      return res.status(404).json({ message: "Tweet non trouvé" });
    }

    // Vérifier si l'utilisateur a déjà retweeté
    if (tweet.retweets.includes(req.user.id)) {
      return res.status(400).json({ message: "Vous avez déjà retweeté ce tweet" });
    }

    tweet.retweets.push(req.user.id);
    await tweet.save();

    // Envoyer une notification
    if (tweet.author.toString() !== req.user.id) {
      sendNotification(tweet.author.toString(), {
        user: tweet.author.toString(),
        sender: req.user.id,
        type: "retweet",
        tweet: tweet._id,
      });
    }

    res.json({ message: "Tweet retweeté" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};


const replyToTweet = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || content.trim() === "") {
      return res.status(400).json({ message: "La réponse ne peut pas être vide" });
    }

    const parentTweet = await Tweet.findById(req.params.id);

    if (!parentTweet) {
      return res.status(404).json({ message: "Tweet non trouvé" });
    }

    const newReply = new Tweet({
      author: req.user.id,
      content,
      replies: [],
    });

    await newReply.save();

    // Ajouter la réponse au tweet original
    parentTweet.replies.push(newReply._id);
    await parentTweet.save();

    // Envoyer une notification
    if (parentTweet.author.toString() !== req.user.id) {
      sendNotification(parentTweet.author.toString(), {
        user: parentTweet.author.toString(),
        sender: req.user.id,
        type: "reply",
        tweet: parentTweet._id,
      });
    }

    res.status(201).json(newReply);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};


const followUser = async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.id);

    if (!userToFollow) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    if (userToFollow.followers.includes(req.user.id)) {
      return res.status(400).json({ message: "Vous suivez déjà cet utilisateur" });
    }

    userToFollow.followers.push(req.user.id);
    await userToFollow.save();

    // Envoyer une notification
    if (userToFollow._id.toString() !== req.user.id) {
      sendNotification(userToFollow._id.toString(), {
        user: userToFollow._id.toString(),
        sender: req.user.id,
        type: "follow",
      });
    }

    res.json({ message: "Utilisateur suivi" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

const mentionUser = async (req, res) => {
  try {
    const { content, mentions } = req.body;

    if (!content || content.trim() === "") {
      return res.status(400).json({ message: "Le tweet ne peut pas être vide" });
    }

    const newTweet = new Tweet({
      author: req.user.id,
      content,
      mentions,
    });

    await newTweet.save();

    // Envoyer une notification aux utilisateurs mentionnés
    mentions.forEach((userId) => {
      if (userId !== req.user.id) {
        sendNotification(userId, {
          user: userId,
          sender: req.user.id,
          type: "mention",
          tweet: newTweet._id,
        });
      }
    });

    res.status(201).json(newTweet);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};



// @route POST api/tweets
// @desc Create a new tweet
// @access Private

const createTweet = async (req, res) => {
    try {
      const { content, media, hashtags, mentions } = req.body;
  
      // Vérification du contenu du tweet
      if (!content || content.trim() === "") {
        return res.status(400).json({ error: "Le tweet ne peut pas être vide" });
      }
  
      const newTweet = new Tweet({
        author: req.user.id,
        content,
        media: media || "", 
        hashtags: hashtags || [], 
        mentions: mentions || [], 
      });
  
      const tweet = await newTweet.save();
      res.status(201).json(tweet);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Erreur serveur");
    }
  };

// @route GET api/tweets
// @desc Get all tweets
// @access Private

const getTweets = async (req, res) => {
    try {
      // Récupération des tweets par ordre décroissant de création
      const tweets = await Tweet.find({ author: req.user.id }).sort({ createdAt: -1 });
      res.json(tweets);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Erreur serveur");
    }
  };

// @route GET api/tweets/:id
// @desc Get tweet by ID
// @access Private

const getTweetById = async (req, res) => {
    try {
      const tweet = await Tweet.findById(req.params.id);
  
      if (!tweet) {
        return res.status(404).json({ message: "Tweet non trouvé" });
      }
  
      if (tweet.author.toString() !== req.user.id) {
        return res.status(401).json({ message: "Vous n'êtes pas l'auteur de ce tweet" });
      }
  
      res.json(tweet);
    } catch (err) {
      console.error(err.message);
      if (err.kind === "ObjectId") {
        return res.status(404).json({ message: "Tweet non trouvé" });
      }
      res.status(500).send("Erreur serveur");
    }
  };

// @route PUT api/tweets/:id
// @desc Update a tweet
// @access Private

const putTweetById = async (req, res) => {
    try {
      const { content, media, hashtags, mentions } = req.body;
      const tweet = await Tweet.findById(req.params.id);

        if (!tweet) {
        return res.status(404).json({ message: "Tweet non trouvé" });
      }

      if (tweet.author.toString()!== req.user.id) {
        return res.status(401).json({ message: "Vous n'êtes pas l'auteur de ce tweet" });
      }

      tweet.content = content;
      tweet.media = media;
      tweet.hashtags = hashtags;
      tweet.mentions = mentions;

      await tweet.save();
      res.json(tweet);
    } catch (err) {
        console.error(err.message);
        if (err.kind === "ObjectId") {
        return res.status(404).json({ message: "Tweet non trouvé" });
      }
      res.status(500).send("Erreur serveur");
    }
};

// @route DELETE api/tweets/:id
// @desc Delete a tweet
// @access Private

const delTweetById = async (req, res) => {
  try {
    // Vérifier si le tweet existe et récupérer son auteur
    const tweet = await Tweet.findById(req.params.id);

    if (!tweet) {
      return res.status(404).json({ message: "Tweet non trouvé" });
    }

    // Vérifier si l'utilisateur est bien l'auteur
    if (tweet.author.toString() !== req.user.id) {
      return res.status(403).json({ message: "Action non autorisée" });
    }

    // Supprimer le tweet
    await Tweet.findByIdAndDelete(req.params.id);

    res.json({ message: "Tweet supprimé avec succès" });
  } catch (err) {
    console.error(err.message);

    // Gérer l'erreur si l'ID est invalide
    if (err.name === "CastError") {
      return res.status(400).json({ message: "ID invalide" });
    }

    res.status(500).send("Erreur serveur");
  }
};

module.exports = { likeTweet, retweetTweet, replyToTweet, mentionUser, followUser, createTweet, getTweets, getTweetById, putTweetById, delTweetById };