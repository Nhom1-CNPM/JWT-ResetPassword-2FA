const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');

// Route được bảo vệ
router.get('/', auth, (req, res) => {
  res.json({
    message: 'Bạn đã truy cập thành công API bảo vệ!',
    user: req.user,
  });
});

module.exports = router;
