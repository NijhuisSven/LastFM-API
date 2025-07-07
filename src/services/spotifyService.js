const SpotifyWebApi = require('spotify-web-api-node');
const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REDIRECT_URI } = require('../config/spotify');
const SpotifyUser = require('../models/SpotifyUser');
const spotifyAuthController = require('../controllers/spotifyAuthController');

const spotifyApi = new SpotifyWebApi({
  clientId: SPOTIFY_CLIENT_ID,
  clientSecret: SPOTIFY_CLIENT_SECRET,
  redirectUri: SPOTIFY_REDIRECT_URI
});

exports.getNowPlaying = async (userId) => {
  try {
    // Get fresh access token for user
    const accessToken = await spotifyAuthController.refreshToken(userId);
    spotifyApi.setAccessToken(accessToken);
    
    const data = await spotifyApi.getMyCurrentPlaybackState();
    if (!data.body || !data.body.is_playing || !data.body.item) {
      return { error: 'No track is currently playing' };
    }
    
    const track = data.body.item;
    return {
      artist: track.artists.map(a => a.name).join(', '),
      track: track.name,
      album: track.album.name,
      image: track.album.images[0]?.url,
      url: track.external_urls.spotify,
      nowPlaying: data.body.is_playing,
      progress_ms: data.body.progress_ms,
      duration_ms: track.duration_ms
    };
  } catch (error) {
    console.error('Spotify API error:', error);
    return { error: 'Failed to fetch data from Spotify' };
  }
}; 