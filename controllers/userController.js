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


// Fonction pour récupérer le nombre d'utilisateurs créés dans le mois actuel ou précédent
exports.getListUserInMonth = async (req, res) => {
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


exports.getListUserByDay = async (req, res) => {
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


