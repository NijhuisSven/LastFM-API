const express = require('express');
const router = express.Router();
const trackController = require('../controllers/trackController');
const lyricsController = require('../controllers/lyricsController');

router.get('/now-playing', trackController.getNowPlaying);
router.get('/now-playing-with-lyrics', lyricsController.getNowPlayingWithLyrics);
router.get('/lyrics', lyricsController.getLyrics);

module.exports = router;