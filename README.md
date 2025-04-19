# Last.fm Now Playing API

A simple web app + API that shows what you're currently listening to on Last.fm. Built with Node.js, Express, and MongoDB.


## What it does

- 🎵 Shows your currently playing track from Last.fm
- 🔑 OAuth authentication with Last.fm
- 🔄 Real-time updates every 10 seconds
- 🚀 API endpoints for integration with other services
- 💾 MongoDB storage for auth tokens

## Getting Started

### Prerequisites

- Node.js 14+
- MongoDB instance (local or Atlas)
- Last.fm API credentials

### Setup

1. Clone the repo ``git clone https://github.com/NijhuisSven/LastFM-API.git cd LastFM-API``

2. Install dependencies ``npm install``

3. Create a `.env` file in the root directory:
```
API_KEY=your_lastfm_api_key
API_SECRET=your_last
fm_api_secret
CALLBACK_URL=http://localhost:3000/auth/callback 
SESSION_SECRET=your_random_session_secret 
MONGODB_URI=your_mongodb_connection_string
```

4. Start the server ``npm start``
For development with auto-restart: ``npm run dev``

## Usage

### Web Interface

1. Visit `http://localhost:3000`
2. Log in with your Last.fm account
3. View your currently playing track on the dashboard
4. Get your auth code for API usage

### API Endpoints

#### Get Currently Playing Track
``GET /api/now-playing?authCode=your_auth_code``

OR
```
POST /api/now-playing Content-Type: application/json

{ "authCode": "your_auth_code" }
```

#### Response Format

```json
{
  "artist": "The Beatles",
  "track": "Yesterday",
  "album": "Help!",
  "image": "https://lastfm.freetls.fastly.net/i/u/300x300/...",
  "url": "https://www.last.fm/music/The+Beatles/_/Yesterday",
  "nowPlaying": true
}
```

## Contributing

We welcome contributions to improve and expand the project! If you'd like to make changes or add new features

##### Guidelines

- Ensure your code follows the existing style and conventions.
- Write clear commit messages and PR descriptions.
- Test your changes thoroughly before submitting.
- If adding a new feature, update the documentation as needed.

Thank you for contributing!
