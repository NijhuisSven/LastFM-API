const express = require('express');
const router = express.Router();
const trackController = require('../controllers/trackController');
const LastfmAuthCode = require('../models/AuthCode');

const authMiddleware = async (req, res, next) => {
  const { authCode } = req.body;
  
  if (req.session && req.session.user) {
    next();
    return;
  }
  
  if (authCode) {
    try {
      const authRecord = await LastfmAuthCode.findOne({ code: authCode });
      if (authRecord) {
        req.authUsername = authRecord.username;
        next();
        return;
      }
    } catch (error) {
      console.error('Error verifying auth code:', error);
    }
  }
  
  res.status(401).json({ error: 'Unauthorized access' });
};

router.get('/now-playing', async (req, res, next) => {
  const { authCode } = req.query;
  
  if (authCode) {
    try {
      const authRecord = await LastfmAuthCode.findOne({ code: authCode });
      if (authRecord) {
        req.authUsername = authRecord.username;
      }
    } catch (error) {
      console.error('Error verifying auth code:', error);
    }
  }
  
  next();
}, trackController.getNowPlaying);

router.post('/now-playing', authMiddleware, trackController.getNowPlaying);

module.exports = router;