const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

exports.register = async (req, res) => {
  const { email, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ email, password: hashed });
  res.status(201).json({ message: 'Tạo tài khoản thành công' });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !await bcrypt.compare(password, user.password)) {
    return res.status(401).json({ message: 'Sai thông tin đăng nhập' });
  }

  if (user.is2FAEnabled) {
    return res.status(200).json({ requires2FA: true, userId: user._id });
  }

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
};

exports.verify2FA = async (req, res) => {
  const { userId, token } = req.body;
  const user = await User.findById(userId);
  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token,
    window: 1,
  });
  if (!verified) return res.status(401).json({ message: 'OTP không đúng' });
  const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.json({ token: jwtToken });
};

exports.setup2FA = async (req, res) => {
  const user = await User.findById(req.user.id);
  const secret = speakeasy.generateSecret({ name: 'MyApp' });
  user.twoFactorSecret = secret.base32;
  user.is2FAEnabled = true;
  await user.save();
  const qr = await qrcode.toDataURL(secret.otpauth_url);
  res.json({ qr });
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
  const resetToken = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.resetPasswordToken = hash;
  user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
  await user.save();
  const link = `http://localhost:3000/api/auth/reset-password/${resetToken}`;
  await sendEmail(email, 'Reset Password', `Click: ${link}`);
  res.json({ message: 'Đã gửi email đặt lại mật khẩu' });
};

exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    resetPasswordToken: hash,
    resetPasswordExpire: { $gt: Date.now() },
  });
  if (!user) return res.status(400).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
  if (!newPassword) {
    return res.status(400).json({ message: 'Vui lòng nhập mật khẩu mới' });
  }
  user.password = await bcrypt.hash(newPassword, 10);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();
  res.json({ message: 'Mật khẩu đã được đặt lại' });
};
