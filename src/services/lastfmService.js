const axios = require('axios');
const { API_KEY } = require('../config/lastfm');

exports.getNowPlaying = async (username) => {
  try {
    const response = await axios.get('http://ws.audioscrobbler.com/2.0/', {
      params: {
        method: 'user.getRecentTracks',
        user: username,
        api_key: API_KEY,
        format: 'json',
        limit: 1
      }
    });

    const tracks = response.data.recenttracks.track;
    
    if (!tracks || tracks.length === 0) {
      return { error: 'No recent tracks found' };
    }

    const track = tracks[0];
    const isNowPlaying = track['@attr'] && track['@attr'].nowplaying === 'true';

    return {
      artist: track.artist['#text'],
      track: track.name,
      album: track.album['#text'],
      image: track.image.find(img => img.size === 'large')['#text'],
      url: track.url,
      nowPlaying: isNowPlaying
    };
  } catch (error) {
    console.error('Last.fm API error:', error);
    throw new Error('Failed to fetch data from Last.fm');
  }
};