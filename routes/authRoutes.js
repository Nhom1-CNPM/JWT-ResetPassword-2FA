const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const controller = require('../controllers/authController');

router.post('/register', controller.register);
router.post('/login', controller.login);
router.post('/verify-2fa', controller.verify2FA);
router.get('/setup-2fa', auth, controller.setup2FA);
router.post('/forgot-password', controller.forgotPassword);
router.post('/reset-password/:token', controller.resetPassword);

module.exports = router;