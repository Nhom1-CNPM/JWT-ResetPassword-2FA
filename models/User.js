const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: String,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  twoFactorSecret: String,
  is2FAEnabled: { type: Boolean, default: false },
});

module.exports = mongoose.model('User', userSchema);