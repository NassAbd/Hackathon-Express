const mongoose = require("mongoose");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const User = require("./models/User");
const bcrypt = require("bcryptjs");


dotenv.config();

const ensureSingleAdmin = async () => {
    try {
        await connectDB(); // Assurer la connexion à MongoDB

        const existingAdmin = await User.findOne({ admin: true });

        if (!existingAdmin) {
            console.log("✅ Aucun admin trouvé, création d'un administrateur par défaut...");
            // Création d'un nouvel administrateur par défaut
            const password = "1234";
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const adminUser = new User({
                username: "admin1",
                email: "admin1@test.com",
                password: hashedPassword, // ⚠️ À hasher avant stockage réel !
                admin: true
            });
            await adminUser.save();
            console.log("✅ Administrateur créé avec succès !");
        } else {
            console.log("⚠️ Un administrateur existe déjà :", existingAdmin.username);
        }
        
        mongoose.connection.close(); // Fermer la connexion après l'opération
    } catch (error) {
        console.error("❌ Erreur lors de la vérification de l'admin :", error.message);
        mongoose.connection.close();
    }
};

// Exécuter uniquement si ce fichier est lancé directement
if (require.main === module) {
    ensureSingleAdmin();
}

module.exports = ensureSingleAdmin;
