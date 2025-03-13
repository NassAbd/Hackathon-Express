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
    notificationPreferences: {
      like: { type: Boolean, default: true },
      retweet: { type: Boolean, default: true },
      reply: { type: Boolean, default: true },
      mention: { type: Boolean, default: true },
      follow: { type: Boolean, default: true }
    },
    admin: { type: Boolean, default: false },
    createdAt: {type: Date, default: Date.now},
    trends: {
        type: Map,
        of: Number,
        default: {}
    }
});

// Avant de définir un utilisateur comme admin, vérifier qu'il n'en existe pas déjà un
UserSchema.pre("save", async function (next) {
    if (this.admin) {
        const existingAdmin = await this.constructor.findOne({ admin: true });
        if (existingAdmin && existingAdmin._id.toString() !== this._id.toString()) {
            throw new Error("Il ne peut y avoir qu'un seul administrateur.");
        }
    }
    next();
});

module.exports = mongoose.model("User", UserSchema);
