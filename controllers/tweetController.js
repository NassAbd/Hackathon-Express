const express = require('express');
const Tweet = require('../models/Tweet');

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

module.exports = { createTweet, getTweets, getTweetById, putTweetById, delTweetById };