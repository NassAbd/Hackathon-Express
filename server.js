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

app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

// Importation des routes
app.use("/api/auth", require("./routes/authRoute"));
app.use("/api/tweet", require("./routes/tweetRoute"));
//app.use("/api/users", require("./routes/userRoute")); TODO: 

// WebSocket Notifications
//require("./sockets/notificationSocket")(io); TODO:

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`));
