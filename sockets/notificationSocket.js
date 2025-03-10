module.exports = (io) => {
    io.on("connection", (socket) => {
      console.log("Nouvelle connexion WebSocket");
  
      socket.on("likeTweet", (data) => {
        io.emit("notification", { message: `${data.username} a liké votre tweet !` });
      });
  
      socket.on("disconnect", () => {
        console.log("Utilisateur déconnecté");
      });
    });
  };
  