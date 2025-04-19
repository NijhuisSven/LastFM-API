const axios = require('axios');
const crypto = require('crypto');
const { randomString } = require('crypto-random-string');
const lastfmService = require('../services/lastfmService');
const { API_KEY, API_SECRET, CALLBACK_URL } = require('../config/lastfm');
const LastfmAuthCode = require('../models/AuthCode');
const log = require('../utils/logger');

// Generate a signature for Last.fm API
const generateSignature = (params) => {
  const signature = Object.keys(params)
    .sort()
    .map(key => `${key}${params[key]}`)
    .join('') + API_SECRET;
  
  return crypto.createHash('md5').update(signature).digest('hex');
};

exports.login = (req, res) => {
  const state = crypto.randomBytes(16).toString('hex');
  
  req.session.authState = state;
  
  log.auth(`Login initiated for session ${req.session.id}`);
  const authUrl = `http://www.last.fm/api/auth/?api_key=${API_KEY}&cb=${CALLBACK_URL}`;
  res.redirect(authUrl);
};

exports.callback = async (req, res) => {
  const { token } = req.query;
  
  if (!token) {
    log.error('Authentication failed: No token provided');
    return res.status(400).send('Authentication failed: No token provided.');
  }

  try {
    const params = {
      api_key: API_KEY,
      method: 'auth.getSession',
      token
    };
    params.api_sig = generateSignature(params);
    params.format = 'json';

    log.info('Requesting Last.fm session with params');
    const response = await axios.get('http://ws.audioscrobbler.com/2.0/', { params });
    
    if (!response.data || !response.data.session) {
      log.error('Unexpected Last.fm response');
      return res.status(500).send('Authentication failed: Invalid response from Last.fm');
    }
    
    const username = response.data.session.name;
    log.success(`Authentication successful for user: ${username}`);
    
    req.session.user = {
      username: username,
      sessionKey: response.data.session.key
    };
    
    try {
      let existingUser = await LastfmAuthCode.findOne({ username: username });
      let authCode;
      
      if (existingUser) {
        log.db(`User ${username} exists, using existing auth code`);
        authCode = existingUser.code;
      } else {
        log.db(`New user ${username}, generating auth code`);
        try {
          authCode = randomString({length: 32, type: 'url-safe'});
        } catch (cryptoError) {
          log.warning(`Falling back to native crypto: ${cryptoError.message}`);
          authCode = crypto.randomBytes(16).toString('hex');
        }
        
        await LastfmAuthCode.create({
          username: username,
          code: authCode
        });
        
        log.db(`New user ${username} created with auth code`);
      }
      
      req.session.authCode = authCode;
      
      return res.redirect('/dashboard');
    } catch (dbError) {
      log.error(`Database error: ${dbError.message}`);
      return res.redirect('/dashboard');
    }
  } catch (error) {
    log.error('Last.fm auth error details');
    
    if (error.response) {
      log.error(`Last.fm API response error: ${error.response.status}`);
    }
    
    return res.status(500).send('Authentication failed. Please try again. Error: ' + (error.message || 'Unknown error'));
  }
};

exports.logout = (req, res) => {
  req.session.destroy();
  res.redirect('/');
};

exports.generateNewAuthCode = async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const authCode = randomString({length: 32, type: 'url-safe'});
    
    await LastfmAuthCode.findOneAndUpdate(
      { username: req.session.user.username },
      { 
        code: authCode,
        username: req.session.user.username
      },
      { upsert: true, new: true }
    );
    
    req.session.authCode = authCode;
    
    res.json({ success: true, authCode });
  } catch (error) {
    log.error(`Error generating new auth code: ${error.message}`);
    res.status(500).json({ error: 'Failed to generate new auth code' });
  }
};