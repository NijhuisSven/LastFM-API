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
  collection: 'lastfm_sessions',
  expires: 1000 * 60 * 60 * 24 * 30,
});

store.on('error', function(error) {
  console.error('Session store error:', error);
});

const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 30,
    secure: process.env.NODE_ENV === 'production', 
    sameSite: 'lax'
  },
  store: store,
  resave: false,
  saveUninitialized: false
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use('/auth', authRoutes);
app.use('/api', apiRoutes);

app.get('/', (req, res) => {
  res.render('index', { 
    user: req.session.user || null 
  });
});

app.get('/dashboard', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/');
  }
  res.render('dashboard', { 
    user: req.session.user,
    authCode: req.session.authCode || null
  });
});

app.listen(PORT, () => {
  log.info(` Server running on port ${PORT}`);
});