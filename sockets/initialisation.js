const dotenv = require("dotenv");
dotenv.config();
const jwt = require("jsonwebtoken");

const initialisation = (io, usersList) => {
    io.use((socket, next) => {
        const token = socket.handshake.headers.access_token;
        if (!token) {
            return next(new Error("Authentication error"));
        }
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = decoded; // Stocke l'utilisateur dans le socket
            next();
        } catch (err) {
            return next(new Error("Authentication error"));
        }
    });

    io.on("connection", (socket) => {
        // Ajout du socket dans la liste des utilisateurs
        if(!usersList[socket.user.id])
            usersList[socket.user.id] = [];

        usersList[socket.user.id].push(socket);
        console.log(`L'utilisateur ${socket.user.id} c'est connecter!`);

        // Suppression de utilisateur lors de sa deconnexion
        socket.on("disconnect", () => {
            usersList[socket.user.id] = usersList[socket.user.id].filter(x => x.id !== socket.id);
            console.log(`L'utilisateur ${socket.user.id} c'est déconnecter!`);
        })
    })

}

module.exports = initialisation;
