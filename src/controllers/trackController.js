const lastfmService = require('../services/lastfmService');
const log = require('../utils/logger');

exports.getNowPlaying = async (req, res) => {
  let username = req.body.username;
  
  if (!username && req.authUsername) {
    username = req.authUsername;
  }
  
  if (!username && req.session && req.session.user) {
    username = req.session.user.username;
  }
  
  if (!username) {
    log.error('Username is required');
    return res.status(400).json({ error: 'Username is required' });
  }


  try {
    const trackData = await lastfmService.getNowPlaying(username);

    res.json(trackData);
  } catch (error) {
    log.error(`Error fetching now playing: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch current track' });
  }
};