const express = require('express');
const Tweet = require('../models/Tweet');
const FormData = require("form-data");
const fs = require("node:fs");
const axios = require("axios");
const User = require("../models/User");
const Notification = require('../models/Notification');
const sendNotification = require("../sockets/sendNotification");

const controller = (usersList, server) => {

// @route POST api/tweets
// @desc Create a new tweet
// @access Private

    const createTweet = async (req, res) => {
        try {
            if (req.file)
                console.log(req.file.filename);
            const {content, media, hashtags, mentions, replyTo} = req.body;

            // Vérification du contenu du tweet
            if (!content || content.trim() === "") {
                return res.status(400).json({error: "Le tweet ne peut pas être vide"});
            }

            // Création du tweet
            const newTweet = new Tweet({
                author: req.user.id,
                content,
                media: req.file?.filename || "",
                mediaType: req.file ? "image" : null,
                hashtags: hashtags || [],
                mentions: mentions || [],
            });

            // Sauvegarde du tweet
            const tweet = await newTweet.save();

            // Si le tweet est une réponse, mise à jour du tweet parent
            if (replyTo) {
                const parentTweet = await Tweet.findById(replyTo);
                if (!parentTweet) {
                    return res.status(404).json({error: "Tweet parent non trouvé"});
                }

                // Ajouter la réponse au tweet parent
                parentTweet.replies.push(tweet._id);
                await parentTweet.save();

                tweet.replyTo = parentTweet._id;
                await tweet.save();

                // Création d'une notification pour l'auteur du tweet parent
                if (parentTweet.author.toString() !== req.user.id) {
                    const notification = new Notification({
                        user: parentTweet.author,  // L'auteur du tweet parent reçoit la notif
                        sender: req.user.id,       // L'utilisateur qui a répondu
                        type: "reply",
                        tweet: tweet._id,          // Le tweet de réponse
                    });

                    await notification.save();
                }
            }

            await tweet.populate("author")

            server.emit("tweet_posted", tweet)
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
            // Récupérer tous les tweets triés par date décroissante
            let tweets = await Tweet.find().sort({createdAt: -1});

            // Transformer les tweets pour inclure les informations de l'auteur
            let tweetsWithAuthor = await Promise.all(tweets.map(async (tweet) => {
                let user = await User.findById(tweet.author).select("username avatar");

                return {
                    ...tweet.toObject(),  // Convertir le document Mongoose en objet JS
                    author: user // Remplace l'ID par les données de l'utilisateur
                };
            }));

            res.json(tweetsWithAuthor);
        } catch (err) {
            console.error(err.message);
            res.status(500).send("Erreur serveur");
        }
    };

    const getAllTweets = async (req, res) => {
        try {
            // Récupération des tweets par ordre décroissant de création
            const tweets = await Tweet.find().sort({createdAt: -1}).populate("author");
            res.json(tweets);
        } catch (err) {
            console.error(err.message);
            res.status(500).send("Erreur serveur");
        }
    };

    const getPersonalizedFeed = async (req, res) => {
        try {
            const userId = req.user.id;
            const user = await User.findById(userId).populate("following");

            if (!user) {
                return res.status(404).json({message: "Utilisateur non trouvé."});
            }

            // 📌 1️⃣ Récupérer les tweets des personnes suivies
            const followingIds = user.following.map(user => user._id);

            // 📌 2️⃣ Récupérer les hashtags préférés (via trends)
            const hashtagScores = user.trends || new Map();
            const preferredHashtags = [...hashtagScores.keys()];

            // 📌 3️⃣ Récupérer les tweets pertinents
            let tweets = await Tweet.find({
                $or: [
                    {author: {$in: followingIds}},
                    {hashtags: {$in: preferredHashtags}}
                ],
                author: {$ne: userId} // ❌ Exclure les tweets de l'utilisateur
            })
                .populate("author", "username avatar")
                .lean(); // Utiliser lean() pour éviter les objets Mongoose

            // 📌 4️⃣ Ajouter un champ `engagementScore`
            const scoredTweets = tweets.map(tweet => {
                const engagementScore =
                    (tweet.likes?.length || 0) * 1 +
                    (tweet.retweets?.length || 0) * 2 +
                    (tweet.replies?.length || 0) * 3;

                return {...tweet, engagementScore};
            });

            // 📌 Trier par `engagementScore` en DESC
            scoredTweets.sort((a, b) => b.engagementScore - a.engagementScore);

            // 📌 5️⃣ Si aucun tweet pertinent, renvoyer des tweets populaires
            if (scoredTweets.length === 0) {
                tweets = await Tweet.find({author: {$ne: userId}})
                    .populate("author", "username avatar")
                    .sort({createdAt: -1}) // On trie uniquement par date pour éviter l'erreur
                    .limit(50);

                return res.status(200).json(tweets);
            }

            res.status(200).json(scoredTweets);
        } catch (error) {
            console.error("❌ Erreur lors de la récupération du fil :", error);
            res.status(500).json({message: "Erreur serveur.", error});
        }
    };


// @route GET api/tweets/:id
// @desc Get tweet by ID
// @access Private

    const getTweetById = async (req, res) => {
        try {
            const tweet = await Tweet.findById(req.params.id);

            if (!tweet) {
                return res.status(404).json({message: "Tweet non trouvé"});
            }

            if (tweet.author.toString() !== req.user.id) {
                return res.status(401).json({message: "Vous n'êtes pas l'auteur de ce tweet"});
            }

            res.json(tweet);
        } catch (err) {
            console.error(err.message);
            if (err.kind === "ObjectId") {
                return res.status(404).json({message: "Tweet non trouvé"});
            }
            res.status(500).send("Erreur serveur");
        }
    };

// @route PUT api/tweets/:id
// @desc Update a tweet
// @access Private

    const putTweetById = async (req, res) => {
        try {
            const {content, media, hashtags, mentions} = req.body;
            const tweet = await Tweet.findById(req.params.id);

            if (!tweet) {
                return res.status(404).json({message: "Tweet non trouvé"});
            }

            if (tweet.author.toString() !== req.user.id) {
                return res.status(401).json({message: "Vous n'êtes pas l'auteur de ce tweet"});
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
                return res.status(404).json({message: "Tweet non trouvé"});
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
                return res.status(404).json({message: "Tweet non trouvé"});
            }

            // Vérifier si l'utilisateur est bien l'auteur
            if (tweet.author.toString() !== req.user.id) {
                return res.status(403).json({message: "Action non autorisée"});
            }

            // Supprimer le tweet
            await Tweet.findByIdAndDelete(req.params.id);

            res.json({message: "Tweet supprimé avec succès"});
        } catch (err) {
            console.error(err.message);

            // Gérer l'erreur si l'ID est invalide
            if (err.name === "CastError") {
                return res.status(400).json({message: "ID invalide"});
            }

            res.status(500).send("Erreur serveur");
        }
    };

    const likeTweet = async (req, res) => {
        try {
            const userId = req.user.id;

            // Vérifier si le tweet existe
            const tweet = await Tweet.findById(req.params.id);
            if (!tweet) {
                return res.status(404).json({message: "Tweet non trouvé"});
            }

            // Vérifier si l'utilisateur a déjà liké le tweet
            const isLiked = tweet.likes.includes(userId);

            if (isLiked) {
                // Supprimer le like
                tweet.likes = tweet.likes.filter((id) => id.toString() !== userId);

                // Supprimer la notification associée
                await Notification.findOneAndDelete({
                    user: tweet.author,
                    sender: userId,
                    type: "like",
                    tweet: tweet._id,
                });
            } else {
                // Ajouter le like
                tweet.likes.push(userId);

                // Créer une notification si ce n'est pas l'auteur qui like son propre tweet
                if (tweet.author.toString() !== userId) {
                    const notification = new Notification({
                        user: tweet.author,
                        sender: userId,
                        type: "like",
                        tweet: tweet._id
                    });
                    await notification.save();

                    await sendNotification(usersList, tweet.author.id, {
                        user: userId,
                        tweet: tweet.id,
                        message: "A liker votre post"
                    })
                }
            }

            const tweetSaves = await tweet.save();
            await tweetSaves.populate("author")

            server.emit("tweet_likeed", tweetSaves);

            res.status(200).json({likes: tweet.likes.length, liked: !isLiked});
        } catch (error) {
            console.error("❌ Erreur lors du like :", error);
            res.status(500).json({message: "Erreur serveur"});
        }
    };

    const saveTweet = async (req, res) => {
        try {
            const userId = req.user.id;

            // Vérifier si le tweet existe
            const tweet = await Tweet.findById(req.params.id);
            if (!tweet) {
                return res.status(404).json({message: "Tweet non trouvé"});
            }

            // Vérifier si l'utilisateur a déjà enregistré le tweet
            const isSaved = tweet.saved.includes(userId);

            if (isSaved) {
                // Supprimer le tweet des sauvegardes
                tweet.saved = tweet.saved.filter((id) => id.toString() !== userId);
            } else {
                // Ajouter le tweet aux sauvegardes
                tweet.saved.push(userId);
            }

            await tweet.save();
            res.status(200).json({savedCount: tweet.saved.length, saved: !isSaved});
        } catch (error) {
            console.error("❌ Erreur lors de la sauvegarde du tweet :", error);
            res.status(500).json({message: "Erreur serveur"});
        }
    };

    const reTweet = async (req, res) => {
        try {
            const userId = req.user.id;

            // Vérifier si le tweet existe
            const tweet = await Tweet.findById(req.params.id);
            if (!tweet) {
                return res.status(404).json({message: "Tweet non trouvé"});
            }

            // Vérifier si l'utilisateur a déjà retweeté le tweet
            const isRetweeted = tweet.retweets.includes(userId);

            if (isRetweeted) {
                // Supprimer le retweet
                tweet.retweets = tweet.retweets.filter((id) => id.toString() !== userId);

                // Supprimer la notification associée
                await Notification.findOneAndDelete({
                    user: tweet.author,
                    sender: userId,
                    type: "retweet",
                    tweet: tweet._id,
                });
            } else {
                // Ajouter le retweet
                tweet.retweets.push(userId);

                // Créer une notification pour l'auteur du tweet
                if (tweet.author.toString() !== userId) {
                    const notification = new Notification({
                        user: tweet.author,
                        sender: userId,
                        type: "retweet",
                        tweet: tweet._id,
                    });
                    await notification.save();
                    await sendNotification(usersList, tweet.author.id, {
                        user: userId,
                        tweet: tweet.id,
                        message: "A reTweet votre post"
                    })
                }
            }

            await tweet.save();
            res.status(200).json({retweetsCount: tweet.retweets.length, retweeted: !isRetweeted});
        } catch (error) {
            console.error("❌ Erreur lors du retweet :", error);
            res.status(500).json({message: "Erreur serveur"});
        }
    };

    const mentionUser = async (req, res) => {
        try {
            const userId = req.user.id;
            const {mentionedUsers} = req.body; // Tableau contenant les IDs des utilisateurs mentionnés

            // Vérifier si le tweet existe
            const tweet = await Tweet.findById(req.params.id);
            if (!tweet) {
                return res.status(404).json({message: "Tweet non trouvé"});
            }

            // Vérifier si les utilisateurs mentionnés existent
            const validUsers = await User.find({_id: {$in: mentionedUsers}});
            const validUserIds = validUsers.map((user) => user._id.toString());

            // Filtrer les nouveaux utilisateurs mentionnés (éviter les doublons et l'auto-mention)
            const newMentions = validUserIds.filter(
                (id) => !tweet.mentions.includes(id) && id !== userId
            );

            if (newMentions.length === 0) {
                return res.status(400).json({message: "Aucune nouvelle mention à ajouter"});
            }

            // Ajouter les nouvelles mentions au tweet
            tweet.mentions.push(...newMentions);
            await tweet.save();

            // Créer des notifications pour les utilisateurs mentionnés
            const notifications = newMentions.map((mentionedUserId) => ({
                user: mentionedUserId,
                sender: userId,
                type: "mention",
                tweet: tweet._id,
            }));

            await Notification.insertMany(notifications);

            for (notification of notifications) {

                await sendNotification(usersList, mentionedUserId, {
                    user: userId,
                    tweet: tweet.id,
                    message: "Vous a mentionné"
                })
            }

            res.status(200).json({
                message: "Mentions ajoutées et notifications envoyées",
                mentions: tweet.mentions,
            });
        } catch (error) {
            console.error("❌ Erreur lors de l'ajout de mentions :", error);
            res.status(500).json({message: "Erreur serveur"});
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

    const getTweetCountByDay = async (req, res) => {
      try {
        const dayOffset = parseInt(req.params.id, 10);
        const range = parseInt(req.params.range, 10);
    
        if (isNaN(dayOffset) || isNaN(range) || dayOffset < 0 || range <= 0) {
          return res.status(400).json({ message: "Paramètres invalides." });
        }
    
        const now = new Date();
        const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
    
        let daysData = [];
    
        for (let i = 0; i < range; i++) {
          const targetDate = new Date();
          targetDate.setDate(now.getDate() - (dayOffset + i));
    
          const dayNumber = targetDate.getDate();
          const dayName = targetDate.toLocaleDateString("fr-FR", { weekday: 'long' });
          const month = monthNames[targetDate.getMonth()];
          const year = targetDate.getFullYear();
    
          daysData.push({
            date: { dayNumber, dayName, month, year },
            tweetCount: 0,
            evolutionPercentage: null,
          });
        }
    
        // **Première boucle : récupérer les tweets pour chaque jour**
        for (const day of daysData) {
          const startDate = new Date(day.date.year, monthNames.indexOf(day.date.month), day.date.dayNumber, 0, 0, 0, 0);
          const endDate = new Date(day.date.year, monthNames.indexOf(day.date.month), day.date.dayNumber, 23, 59, 59, 999);
    
          day.tweetCount = await Tweet.countDocuments({
            createdAt: { $gte: startDate, $lte: endDate },
          });
        }
    
        // **Deuxième boucle : calculer l'évolution**
        for (let i = 0; i < daysData.length - 1; i++) {
          const currentDay = daysData[i];
          const previousDay = daysData[i + 1];
    
          if (previousDay.tweetCount > 0) {
            currentDay.evolutionPercentage = ((currentDay.tweetCount - previousDay.tweetCount) / previousDay.tweetCount * 100).toFixed(2);
          } else {
            currentDay.evolutionPercentage = null;
          }
        }
    
        res.status(200).json({ dayOffset, range, days: daysData });
      } catch (error) {
        res.status(500).json({ message: "Erreur serveur.", error });
      }
    };
    
    
    
    
    const getTweetCountByMonth = async (req, res) => {
      try {
        const monthOffset = parseInt(req.params.id, 10);
        const range = parseInt(req.params.range, 10);
    
        if (isNaN(monthOffset) || isNaN(range) || monthOffset < 0 || range <= 0) {
          return res.status(400).json({ message: "Paramètres invalides." });
        }
    
        const now = new Date();
        const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
    
        let monthsData = [];
    
        for (let i = 0; i < range; i++) {
          const targetDate = new Date();
          targetDate.setMonth(targetDate.getMonth() - (monthOffset + i));
    
          const monthIndex = targetDate.getMonth();
          const year = targetDate.getFullYear();
    
          monthsData.push({
            month: monthNames[monthIndex],
            year: year,
            tweetCount: 0,
            evolutionPercentage: null, // Initialisé à null
          });
        }
    
        // **Première boucle : récupérer les tweets pour chaque mois**
        for (const month of monthsData) {
          const startDate = new Date(month.year, monthNames.indexOf(month.month), 1);
          const endDate = new Date(month.year, monthNames.indexOf(month.month) + 1, 0, 23, 59, 59);
    
          month.tweetCount = await Tweet.countDocuments({
            createdAt: { $gte: startDate, $lte: endDate },
          });
        }
    
        // **Deuxième boucle : calculer l'évolution**
        for (let i = 0; i < monthsData.length - 1; i++) {
          const currentMonth = monthsData[i];
          const previousMonth = monthsData[i + 1];
    
          if (previousMonth.tweetCount > 0) {
            currentMonth.evolutionPercentage = ((currentMonth.tweetCount - previousMonth.tweetCount) / previousMonth.tweetCount * 100).toFixed(2);
          } else {
            currentMonth.evolutionPercentage = null; // Aucun calcul possible
          }
        }
    
        res.status(200).json({ monthOffset, range, months: monthsData });
      } catch (error) {
        res.status(500).json({ message: "Erreur serveur.", error });
      }
    };

    return {
        createTweet,
        getTweets,
        getAllTweets,
        getPersonalizedFeed,
        getTweetById,
        putTweetById,
        delTweetById,
        addUserEmotion,
        likeTweet,
        saveTweet,
        reTweet,
        mentionUser,
        getTweetCountByMonth,
        getTweetCountByDay

    }
}

module.exports = controller;
