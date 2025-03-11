const User = require('../models/User');
const Notification = require('../models/Notification');
const router = require("../routes/authRoute");
const sendNotification = require("../sockets/sendNotification");


const controller = (usersList) => {

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

    return {
        getUsers,
        getUserById,
        updateUserById,
        getUserFollowers,
        followUserById
    }
}

module.exports = controller;
