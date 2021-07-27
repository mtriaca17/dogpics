if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const flash = require('connect-flash');

const passport = require('passport');
const localStrategy = require('passport-local');

const session = require('express-session');
const MongoStore = require('connect-mongo');

const mongoSanitize = require('express-mongo-sanitize');

const User = require('./models/user');

const AppError = require('./utils/AppError');

const postRoutes = require('./routes/posts');
const commentRoutes = require('./routes/comments');
const userRoutes = require('./routes/users');

const dbUrl = process.env.DB_URL;
// const dbUrl = 'mongodb://localhost:27017/dogPics';
mongoose
  .connect(dbUrl, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then(console.log('Database Connected!'))
  .catch(e => console.log(e));

const app = express();

app.use(methodOverride('_method'));

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(mongoSanitize());

//session store
const secret = process.env.SECRET || 'notthebestsecret';

const store = MongoStore.create({
  mongoUrl: dbUrl,
  touchAfter: 24 * 60 * 60,
  crypto: {
    secret: secret,
  },
});

//session
const sessionConfig = {
  store,
  name: 'session',
  secret,
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
};

app.use(session(sessionConfig));
app.use(flash());
//passport
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

//home route
app.get('/', (req, res) => {
  res.render('home');
});

app.use('/', postRoutes);
app.use('/', commentRoutes);
app.use('/', userRoutes);

//catch all route
app.all('*', (req, res, next) => {
  next(new AppError('Page Not found!', 404));
});

//error middleware
app.use((err, req, res, next) => {
  let { statusCode = 500 } = err;
  if (err.name === 'CastError') {
    err.message = "Sorry, that page couldn't be found";
    err.statusCode = 404;
    return res.status(404).render('error', { err });
  }
  if (!err.message) err.message = 'Oh no, something went wrong';
  res.status(statusCode).render('error', { err });
});

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`listening on port ${port}`);
});
