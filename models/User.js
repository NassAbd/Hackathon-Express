const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    username: {type: String, required: true, unique: true},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    bio: {type: String, default: ""},
    avatar: {type: String, default: ""},
    wallpaper: {type: String, default: ""},
    followers: [{type: mongoose.Schema.Types.ObjectId, ref: "User"}],
    following: [{type: mongoose.Schema.Types.ObjectId, ref: "User"}],
    createdAt: {type: Date, default: Date.now},
    trends: {
        type: Map,
        of: Number,
        default: {}
    }
});

module.exports = mongoose.model("User", UserSchema);
