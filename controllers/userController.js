const User = require('../models/User');
const Notification = require('../models/Notification');
const router = require("../routes/authRoute");
const sendNotification = require("../sockets/sendNotification");


const controller = (usersList) => {

    const getCurrentUser = async (req, res) => {
        try {
            const users = await User.findById(req.user.id);
            res.status(200).json(users);
        } catch (error) {
            res.status(500).json({message: 'Erreur serveur.', error});
        }
    };

// Fonction pour récupérer tous les utilisateurs
    const getUsers = async (req, res) => {
        try {
            const users = await User.find().select('username avatar bio');
            res.status(200).json(users);
        } catch (error) {
            res.status(500).json({message: 'Erreur serveur.', error});
        }
    };

// Fonction pour obtenir les informations d'un utilisateur par ID
    const getUserById = async (req, res) => {
        try {
            const user = await User.findById(req.params.id).select('-password');
            if (!user) {
                return res.status(404).json({message: 'Utilisateur non trouvé.'});
            }
            res.status(200).json(user);
        } catch (error) {
            res.status(500).json({message: 'Erreur serveur.', error});
        }
    };

// Fonction pour mettre à jour les informations d'un utilisateur par ID
    const updateUserById = async (req, res) => {
        try {
            const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, {new: true}).select('-password');
            if (!updatedUser) {
                return res.status(404).json({message: 'Utilisateur non trouvé.'});
            }
            res.status(200).json(updatedUser);
        } catch (error) {
            res.status(500).json({message: 'Erreur serveur.', error});
        }
    };

// Fonction pour obtenir les abonnés d'un utilisateur par ID
    const getUserFollowers = async (req, res) => {
        try {
            const user = await User.findById(req.params.id).populate('followers', '-password');
            if (!user) {
                return res.status(404).json({message: 'Utilisateur non trouvé.'});
            }
            res.status(200).json(user.followers);
        } catch (error) {
            res.status(500).json({message: 'Erreur serveur.', error});
        }
    };

// Fonction pour suivre un utilisateur par ID
    const followUserById = async (req, res) => {
        try {
            const userIdToFollow = req.params.id;
            const currentUserId = req.user.id;

            // Vérifier si l'utilisateur essaie de se suivre lui-même
            if (userIdToFollow === currentUserId) {
                return res.status(400).json({message: "Vous ne pouvez pas vous suivre vous-même."});
            }

            const userToFollow = await User.findById(userIdToFollow);
            const currentUser = await User.findById(currentUserId);

            if (!userToFollow) {
                return res.status(404).json({message: "Utilisateur non trouvé."});
            }

            // Vérifier si l'utilisateur est déjà suivi
            const isFollowing = currentUser.following.includes(userIdToFollow);

            if (isFollowing) {
                // Si l'utilisateur est déjà suivi, on le unfollow
                currentUser.following = currentUser.following.filter(id => id.toString() !== userIdToFollow);
                userToFollow.followers = userToFollow.followers.filter(id => id.toString() !== currentUserId);

                await currentUser.save();
                await userToFollow.save();

                // Supprimer la notification de suivi
                await Notification.findOneAndDelete({
                    user: userIdToFollow,
                    sender: currentUserId,
                    type: "follow",
                });

                // Envoyer un message WebSocket
                await sendNotification(usersList, userIdToFollow, {
                    user: currentUser.username,
                    message: "Vien de t'unfollow"
                })

                return res.status(200).json({message: "Utilisateur unfollow avec succès et notification supprimée."});
            } else {
                // Si l'utilisateur n'est pas suivi, on le follow
                currentUser.following.push(userIdToFollow);
                userToFollow.followers.push(currentUserId);

                await currentUser.save();
                await userToFollow.save();

                // Créer la notification de suivi
                const followNotification = new Notification({
                    user: userToFollow._id,
                    sender: currentUser._id,
                    type: "follow",
                });

                // Envoyer un message WebSocket
                await sendNotification(usersList, userIdToFollow, {
                    user: currentUser.username,
                    message: "Vien de te follow"
                })

                await followNotification.save();

                return res.status(200).json({message: "Utilisateur suivi avec succès et notification envoyée."});
            }
        } catch (error) {
            console.error("❌ Erreur lors du suivi/désabonnement :", error);
            res.status(500).json({message: "Erreur serveur.", error});
        }
    };

    // Fonction pour récupérer le nombre d'utilisateurs créés dans le mois actuel ou précédent
    const getListUserInMonth = async (req, res) => {
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
            users: 0,
            evolutionPercentage: null,
          });
        }

        for (const month of monthsData) {
          const startDate = new Date(month.year, monthNames.indexOf(month.month), 1);
          const endDate = new Date(month.year, monthNames.indexOf(month.month) + 1, 0, 23, 59, 59);

          month.users = await User.countDocuments({
            createdAt: { $gte: startDate, $lte: endDate },
          });
        }

        for (let i = 0; i < monthsData.length - 1; i++) {
          const currentMonth = monthsData[i];
          const previousMonth = monthsData[i + 1];

          if (previousMonth.users > 0) {
            currentMonth.evolutionPercentage = ((currentMonth.users - previousMonth.users) / previousMonth.users * 100).toFixed(2);
          } else {
            currentMonth.evolutionPercentage = null;
          }
        }

        res.status(200).json({ monthOffset, range, months: monthsData });
      } catch (error) {
        res.status(500).json({ message: "Erreur serveur.", error });
      }
    };


    const getListUserByDay = async (req, res) => {
      try {
        const dayOffset = parseInt(req.params.id, 10);
        const range = parseInt(req.params.range, 10);

        if (isNaN(dayOffset) || isNaN(range) || dayOffset < 0 || range <= 0) {
          return res.status(400).json({ message: "Paramètres invalides." });
        }

        const now = new Date();
        const monthNames = [
          "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
          "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
        ];

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
            users: 0,
            evolutionPercentage: null, // Initialisé à null
          });
        }

        // **Première boucle : récupérer le nombre d'utilisateurs pour chaque jour**
        for (const day of daysData) {
          const startDate = new Date(day.date.year, monthNames.indexOf(day.date.month), day.date.dayNumber, 0, 0, 0, 0);
          const endDate = new Date(day.date.year, monthNames.indexOf(day.date.month), day.date.dayNumber, 23, 59, 59, 999);

          day.users = await User.countDocuments({
            createdAt: { $gte: startDate, $lte: endDate },
          });
        }

        // **Deuxième boucle : calculer l'évolution**
        for (let i = 0; i < daysData.length - 1; i++) {
          const currentDay = daysData[i];
          const previousDay = daysData[i + 1];

          if (previousDay.users > 0) {
            currentDay.evolutionPercentage = ((currentDay.users - previousDay.users) / previousDay.users * 100).toFixed(2);
          } else {
            currentDay.evolutionPercentage = null; // Évite la division par 0
          }
        }

        res.status(200).json({ dayOffset, range, days: daysData });
      } catch (error) {
        res.status(500).json({ message: "Erreur serveur.", error });
      }
    };


    return {
        getCurrentUser,
        getUsers,
        getUserById,
        updateUserById,
        getUserFollowers,
        followUserById,
        getListUserInMonth,
        getListUserByDay
    }
}




module.exports = controller;
