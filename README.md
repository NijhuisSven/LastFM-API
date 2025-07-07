# Spotify Now Playing API

A web application that shows what you're currently listening to on Spotify with synchronized lyrics. Built with Node.js, Express, and MongoDB.

## What it does

- 🎵 Shows your currently playing track from Spotify
- 🎤 **Synchronized lyrics with LRC Lib API**
- 🔑 OAuth authentication with Spotify
- 🔄 Real-time updates every 3 seconds
- 🚀 API endpoints for integration with other services
- 💾 MongoDB storage for user tokens

## Getting Started

### Prerequisites

- Node.js 14+
- MongoDB instance (local or Atlas)
- Spotify API credentials

### Setup

1. Clone the repo `git clone https://github.com/NijhuisSven/Spotify-API.git cd Spotify-API`

2. Install dependencies `npm install`

3. Create a `.env` file in the root directory:
```
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/auth/callback
SESSION_SECRET=your_random_session_secret
MONGODB_URI=your_mongodb_connection_string
```

4. Start the server `npm start`
For development with auto-restart: `npm run dev`

## Usage

### Web Interface

1. Visit `http://localhost:3000`
2. Click "Login with Spotify"
3. Authorize the application
4. View your currently playing track on the dashboard

### API Endpoints

#### Get Currently Playing Track
```
GET /api/now-playing
```

#### Response Format
```json
{
  "artist": "The Beatles",
  "track": "Yesterday",
  "album": "Help!",
  "image": "https://i.scdn.co/image/...",
  "url": "https://open.spotify.com/track/...",
  "nowPlaying": true,
  "progressMs": 45000,
  "durationMs": 125000
}
```

#### Get Lyrics for a Track
```
GET /api/lyrics?artist=Artist&track=Track
```

#### Response Format
```json
{
  "found": true,
  "artist": "The Beatles",
  "track": "Yesterday",
  "album": "Help!",
  "duration": 125,
  "plainLyrics": "Yesterday, all my troubles seemed so far away...",
  "syncedLyrics": [
    {
      "time": 0,
      "text": "Yesterday, all my troubles seemed so far away"
    },
    {
      "time": 3000,
      "text": "Now it looks as though they're here to stay"
    }
  ],
  "source": "lrclib.net"
}
```

#### Get Currently Playing Track with Lyrics
```
GET /api/now-playing-with-lyrics
```

## Lyrics Features

### Synchronized Lyrics
The app includes synchronized lyrics powered by the [LRC Lib API](https://lrclib.net/docs). When a track is playing, the app automatically fetches timed lyrics and displays them in the dashboard.

### Features
- 🎤 **Automatic lyrics fetching** for currently playing tracks
- ⏱️ **Synchronized playback** with manual start control
- 🎯 **Highlighted current line** that follows the song timing
- 🔄 **Real-time sync controls** (speed, timing adjustment)
- 📱 **Responsive design** that works on all devices

### How to Use
1. Log in to your dashboard
2. When a track is playing, lyrics will automatically load
3. Click "Show Lyrics" to display the lyrics panel
4. Click "▶️" to start synchronized playback
5. Use the sync controls to adjust timing and speed

## Contributing

We welcome contributions to improve and expand the project! If you'd like to make changes or add new features

##### Guidelines

- Ensure your code follows the existing style and conventions.
- Write clear commit messages and PR descriptions.
