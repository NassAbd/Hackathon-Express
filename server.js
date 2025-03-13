const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const morgan = require("morgan");
const http = require("http");
const { Server } = require("socket.io");

dotenv.config();
const connectDB = require("./config/db");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

connectDB();

// Liste des instance de socket.io client connecter a l'app
const listUserConnected = {};

require("./sockets/initialisation")(io, listUserConnected);


app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

app.use('/static', express.static('uploads'))


// Importation des routes
app.use("/api/auth", require("./routes/authRoute"));
app.use("/api/tweet", require("./routes/tweetRoute")(listUserConnected, io));
app.use("/api/notification", require("./routes/notificationRoute"));
app.use("/api/users", require("./routes/userRoute")(listUserConnected));

// WebSocket Notifications
//require("./sockets/notificationSocket")(io); TODO:

const PORT = process.env.PORT || 5500;
server.listen(PORT, () => console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`));
