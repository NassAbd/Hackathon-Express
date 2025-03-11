const User = require('../models/User');

// Fonction pour récupérer tous les utilisateurs

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('username avatar bio');
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error });
  }
};

// Fonction pour obtenir les informations d'un utilisateur par ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error });
  }
};

// Fonction pour mettre à jour les informations d'un utilisateur par ID
exports.updateUserById = async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-password');
    if (!updatedUser) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error });
  }
};

// Fonction pour obtenir les abonnés d'un utilisateur par ID
exports.getUserFollowers = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('followers', '-password');
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }
    res.status(200).json(user.followers);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error });
  }
};

// Fonction pour suivre un utilisateur par ID
exports.followUserById = async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id); 

    if (!userToFollow) {
      return res.status(404).json({ message: 'Utilisateur à suivre non trouvé.' });
    }

    if (currentUser.following.includes(req.params.id)) {
      return res.status(400).json({ message: 'Vous suivez déjà cet utilisateur.' });
    }

    currentUser.following.push(req.params.id);
    userToFollow.followers.push(req.user.id);

    await currentUser.save();
    await userToFollow.save();

    res.status(200).json({ message: 'Utilisateur suivi avec succès.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error });
  }
};
