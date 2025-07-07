const express = require('express');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const log = require('./utils/logger');

dotenv.config();

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => log.success('MongoDB connected successfully'))
.catch(err => {
  log.error(`MongoDB connection error: ${err.message}`);
});

// Create MongoDB session store
const store = new MongoDBStore({
  uri: process.env.MONGODB_URI,
  collection: 'sessions',
  expires: 1000 * 60 * 60 * 24 * 30,
});

store.on('error', function(error) {
  console.error('Session store error:', error);
});

const spotifyAuthRoutes = require('./routes/spotifyAuth');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'defaultsecret',
  resave: false,
  saveUninitialized: false,
  store: store
}));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.use('/auth', spotifyAuthRoutes);
app.use('/api', apiRoutes);

// Homepage
app.get('/', (req, res) => {
  res.render('index', { 
    user: req.session.user || null 
  });
});

// Dashboard (requires authentication)
app.get('/dashboard', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/');
  }
  res.render('dashboard', { 
    user: req.session.user
  });
});

// Fullscreen lyrics page (requires authentication)
app.get('/fullscreen', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/');
  }
  res.render('fullscreen', { 
    user: req.session.user
  });
});

app.listen(PORT, () => {
  log.success(`Server running on http://localhost:${PORT}`);
});