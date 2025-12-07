const express = require('express');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validateRegister, validateLogin } = require('../middleware/validation');

const router = express.Router();

// Public routes
router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);

// Protected routes
router.use(protect); // All routes after this middleware are protected

router.get('/me', authController.getMe);
router.post('/logout', authController.logout);

module.exports = router;