const spotifyService = require('../services/spotifyService');
const log = require('../utils/logger');

exports.getNowPlaying = async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  try {
    const trackData = await spotifyService.getNowPlaying(req.session.user.id);
    res.json(trackData);
  } catch (error) {
    log.error(`Error fetching now playing: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch current track' });
  }
};