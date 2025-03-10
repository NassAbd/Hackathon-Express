const mongoose = require("mongoose");

const TweetSchema = new mongoose.Schema({
  author: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  content: { 
    type: String, 
    required: true, 
    maxlength: 280 
  },
  media: { 
    type: String, // URL d'une image/vidéo
    default: "" 
  },
  likes: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" 
  }],
  retweets: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" 
  }],
  replies: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Tweet" 
  }],
  hashtags: [{ 
    type: String 
  }],
  mentions: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" 
  }],
  saved: [{
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User"
  }],
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model("Tweet", TweetSchema);
