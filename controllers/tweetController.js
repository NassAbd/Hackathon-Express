const express = require('express');
const Tweet = require('../models/Tweet');
const FormData = require("form-data");
const fs = require("node:fs");
const axios = require("axios");
const User = require("../models/User");

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

// @route POST api/tweets/:id/emotion
// @desc Edit user trends with user image
// @access Private

const addUserEmotion = async (req, res) => {
  try {
    if (!req.file)
      throw new Error("No file selected");
    if (!req.params.id)
      throw new Error("No tweet selected");

    let tweet;

    try {
      tweet = await Tweet.findById(req.params.id)
    } catch (err) {
      throw new Error("Tweet non trouvé.")
    }

    const listHashtag = tweet.hashtags

    const formData = new FormData();
    formData.append("file", fs.createReadStream(req.file.path));

    console.log("Send request")
    const response = await axios.post("http://localhost:5000/upload", formData, {
      headers: {...formData.getHeaders()},
    });

    let modificator = -1;

    switch (response.data.emotion) {
      case "happy":
        modificator = 1;
        break;
      case "neutral":
        modificator = 0;
        break;
      case "sad":
        modificator = 0;
        break;

    }

    user = await User.findById(req.user.id)


    tweet.hashtags.forEach((hashtag) => {
          if (!user.trends.has(hashtag))
            user.trends.set(hashtag, 0);


          user.trends.set(hashtag, user.trends.get(hashtag) + modificator);
        }
    )

    console.log(user)

    user.save();
    // console.log(response.data.emotion);
    await fs.unlinkSync(req.file.path);
    res.status(200).send("Tweet emotion edited");
  } catch
      (error) {
    console.error(error)
    res.status(500).send(error.message);
  }
}

module.exports = { createTweet, getTweets, getTweetById, putTweetById, delTweetById, addUserEmotion };