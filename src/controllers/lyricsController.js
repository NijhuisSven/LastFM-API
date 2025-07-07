const lyricsService = require('../services/lyricsService');
const spotifyService = require('../services/spotifyService');
const log = require('../utils/logger');

exports.getLyrics = async (req, res) => {
  const { artist, track } = req.query;
  
  if (!artist || !track) {
    return res.status(400).json({ 
      error: 'Artist and track parameters are required' 
    });
  }

  try {
    log.info(`Fetching lyrics for: ${artist} - ${track}`);
    
    const lyricsData = await lyricsService.getTimedLyrics(artist, track);
    
    res.json(lyricsData);
  } catch (error) {
    log.error(`Error fetching lyrics: ${error.message}`);
    res.status(500).json({ 
      error: 'Failed to fetch lyrics',
      message: error.message 
    });
  }
};

exports.getNowPlayingWithLyrics = async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  try {
    // Get current track from Spotify
    const trackData = await spotifyService.getNowPlaying(req.session.user.id);
    
    if (trackData.error || !trackData.nowPlaying) {
      return res.json({
        ...trackData,
        lyrics: null
      });
    }

    // Get lyrics for the current track
    const lyricsData = await lyricsService.getTimedLyrics(
      trackData.artist, 
      trackData.track
    );

    res.json({
      ...trackData,
      lyrics: lyricsData
    });
  } catch (error) {
    log.error(`Error fetching now playing with lyrics: ${error.message}`);
    res.status(500).json({ 
      error: 'Failed to fetch current track with lyrics',
      message: error.message 
    });
  }
}; 