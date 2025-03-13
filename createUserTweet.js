const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const connectDB = require("./config/db");
const User = require("./models/User");
const Tweet = require("./models/Tweet");

dotenv.config();

// Option pour supprimer ou non les anciennes données
const CLEAR_DB = true; // Mettre à false pour ne pas supprimer

const createData = async () => {
    try {
        await connectDB();

        if (CLEAR_DB) {
            console.log("🚀 Suppression des anciennes données...");
            await User.deleteMany();
            await Tweet.deleteMany();
        }

        console.log("👤 Création des utilisateurs...");
        const usernames = [
            "alice", "bob", "charlie", "diana", "eric", "fanny", "george", "hannah", "ian", "julia",
            "kevin", "laura", "mike", "nina", "oliver", "paula", "quentin", "rachel", "steve", "tina",
            "ursula", "victor", "wendy", "xavier", "yasmine", "zach", "leo", "marie", "noah", "sophie"
        ];

        const usersData = usernames.map(username => ({
            username,
            email: `${username}@test.com`,
            password: "password123",
            bio: "",
            avatar: ""
        }));

        for (let user of usersData) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
        }

        const users = await User.insertMany(usersData);
        console.log(`✅ ${users.length} utilisateurs créés avec succès !`);

        console.log("🐦 Création des tweets...");
        const tweetsData = [];
        const now = new Date();

        const contentOptions = [
            "Superbe journée pour coder en #React ! @alice, tu testes aussi ?",
            "J'adore l'écosystème #NodeJS et #Express pour le back-end !",
            "Qui a testé la nouvelle mise à jour de #NextJS ?",
            "Petit rappel : ne jamais coder sans café ☕ #DevLife",
            "@bob et moi travaillons sur un projet #AI très excitant !",
            "Une conférence géniale sur #CyberSecurity ce matin !",
            "Je recommande fortement ce cours sur #MongoDB, super complet !",
            "Pourquoi tant de développeurs aiment #TypeScript ?",
            "Petite pause bien méritée après 5h de code ! @kevin #WorkHard",
            "La nouvelle doc de #GraphQL est top, très bien expliquée !",
            "Ça fait plaisir de voir autant d'intérêt pour #Python en 2025 !",
            "Nouveau challenge : 100 jours de code en #JavaScript ! Qui me suit ?",
            "Toujours une galère d'optimiser les requêtes en #SQL 😅",
            "@charlie a trouvé un super outil pour la CI/CD ! #DevOps",
            "Enfin passé mon examen certifié en #AWS 🎉 !",
            "La créativité est essentielle en #Design et #UIUX !",
            "Le nouveau framework #Svelte fait vraiment parler de lui !",
            "Travailler en remote change vraiment la perception du #WorkLifeBalance",
            "Petit débat du jour : #VueJS ou #React ? Vos avis ?",
            "Apprendre #Rust en 2025, bonne idée ou pas ? 🤔"
        ];

        for (let i = 0; i < 500; i++) {
            const author = users[Math.floor(Math.random() * users.length)]._id;
            const content = contentOptions[Math.floor(Math.random() * contentOptions.length)];

            // Extraction des hashtags et mentions
            const hashtags = [...content.matchAll(/#(\w+)/g)].map(match => match[1]);
            const mentionedUsernames = [...content.matchAll(/@(\w+)/g)].map(match => match[1]);
            const mentions = await User.find({ username: { $in: mentionedUsernames } }).select("_id");

            // Date aléatoire sur les 7 derniers mois
            const tweetDate = new Date();
            tweetDate.setMonth(now.getMonth() - Math.floor(Math.random() * 7));
            tweetDate.setDate(Math.floor(Math.random() * 28) + 1);

            tweetsData.push({
                author,
                content,
                hashtags,
                mentions: mentions.map(user => user._id),
                createdAt: tweetDate
            });
        }

        await Tweet.insertMany(tweetsData);
        console.log(`✅ ${tweetsData.length} tweets créés avec succès !`);

        mongoose.connection.close();
        console.log("🔌 Connexion MongoDB fermée.");
    } catch (error) {
        console.error("❌ Erreur :", error.message);
        mongoose.connection.close();
    }
};

if (require.main === module) {
    createData();
}

module.exports = createData;
