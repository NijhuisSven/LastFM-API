const express = require('express');
const router = express.Router();
const spotifyAuthController = require('../controllers/spotifyAuthController');

router.get('/login', spotifyAuthController.login);
router.get('/callback', spotifyAuthController.callback);
router.get('/logout', spotifyAuthController.logout);

module.exports = router; 