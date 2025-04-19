const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.get('/login', authController.login);

router.get('/callback', authController.callback);

router.get('/logout', authController.logout);

router.post('/generate-code', authController.generateNewAuthCode);

module.exports = router;