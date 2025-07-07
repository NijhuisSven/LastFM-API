const SpotifyWebApi = require('spotify-web-api-node');
const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REDIRECT_URI } = require('../config/spotify');
const SpotifyUser = require('../models/SpotifyUser');
const log = require('../utils/logger');

const spotifyApi = new SpotifyWebApi({
  clientId: SPOTIFY_CLIENT_ID,
  clientSecret: SPOTIFY_CLIENT_SECRET,
  redirectUri: SPOTIFY_REDIRECT_URI
});

exports.login = (req, res) => {
  const scopes = [
    'user-read-private',
    'user-read-email',
    'user-read-playback-state',
    'user-read-currently-playing'
  ];
  
  const state = Math.random().toString(36).substring(7);
  req.session.spotifyState = state;
  
  const authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);
  log.auth(`Spotify login initiated for session ${req.session.id}`);
  
  res.redirect(authorizeURL);
};

exports.callback = async (req, res) => {
  const { code, state } = req.query;
  
  if (!code) {
    log.error('Spotify auth failed: No authorization code provided');
    return res.status(400).send('Authentication failed: No authorization code provided.');
  }
  
  if (state !== req.session.spotifyState) {
    log.error('Spotify auth failed: State mismatch');
    return res.status(400).send('Authentication failed: Invalid state.');
  }
  
  try {
    // Exchange code for tokens
    const data = await spotifyApi.authorizationCodeGrant(code);
    const { access_token, refresh_token, expires_in } = data.body;
    
    // Set tokens
    spotifyApi.setAccessToken(access_token);
    spotifyApi.setRefreshToken(refresh_token);
    
    // Get user profile
    const userData = await spotifyApi.getMe();
    const user = userData.body;
    
    // Calculate token expiry
    const tokenExpiresAt = new Date(Date.now() + expires_in * 1000);
    
    // Save or update user in database
    let spotifyUser = await SpotifyUser.findOne({ spotifyId: user.id });
    
    if (spotifyUser) {
      // Update existing user
      spotifyUser.accessToken = access_token;
      spotifyUser.refreshToken = refresh_token;
      spotifyUser.tokenExpiresAt = tokenExpiresAt;
      spotifyUser.lastLogin = new Date();
      await spotifyUser.save();
      log.success(`Existing user logged in: ${user.display_name}`);
    } else {
      // Create new user
      spotifyUser = await SpotifyUser.create({
        spotifyId: user.id,
        displayName: user.display_name,
        email: user.email,
        accessToken: access_token,
        refreshToken: refresh_token,
        tokenExpiresAt: tokenExpiresAt,
        profileImage: user.images?.[0]?.url
      });
      log.success(`New user created: ${user.display_name}`);
    }
    
    // Set session
    req.session.user = {
      id: spotifyUser._id,
      spotifyId: user.id,
      displayName: user.display_name,
      email: user.email,
      profileImage: user.images?.[0]?.url
    };
    
    // Clear state
    delete req.session.spotifyState;
    
    res.redirect('/dashboard');
  } catch (error) {
    log.error(`Spotify auth error: ${error.message}`);
    res.status(500).send('Authentication failed. Please try again.');
  }
};

exports.logout = (req, res) => {
  req.session.destroy();
  res.redirect('/');
};

exports.refreshToken = async (userId) => {
  try {
    const user = await SpotifyUser.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Check if token needs refresh
    if (user.tokenExpiresAt > new Date()) {
      return user.accessToken; // Token still valid
    }
    
    // Refresh token
    spotifyApi.setRefreshToken(user.refreshToken);
    const data = await spotifyApi.refreshAccessToken();
    const { access_token, expires_in } = data.body;
    
    // Update user
    user.accessToken = access_token;
    user.tokenExpiresAt = new Date(Date.now() + expires_in * 1000);
    await user.save();
    
    log.info(`Token refreshed for user: ${user.displayName}`);
    return access_token;
  } catch (error) {
    log.error(`Token refresh failed: ${error.message}`);
    throw error;
  }
}; 