const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: false }  // ✅ Make sure this is included
});

const User = mongoose.model('User', userSchema);
module.exports = User;
