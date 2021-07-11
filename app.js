const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const session = require('express-session');

const passport = require('passport');
const localStrategy = require('passport-local');

const Post = require('./models/post');
const Comment = require('./models/comment');
const User = require('./models/user');

const catchAsync = require('./utils/catchAsync');
const AppError = require('./utils/AppError');

mongoose
  .connect('mongodb://localhost:27017/dogPics', {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
  })
  .then(console.log('Database Connected!'))
  .catch(e => console.log(e));
mongoose.set('useFindAndModify', false);

const app = express();

app.use(methodOverride('_method'));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

//session
const sessionConfig = {
  secret: 'thisisnotagoodsecret',
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
};

app.use(session(sessionConfig));

//passport
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  next();
});

//posts routes
app.get('/', (req, res) => {
  res.send('HELLO!');
});

app.get(
  '/posts',
  catchAsync(async (req, res) => {
    const posts = await Post.find({});
    res.render('posts/index', { posts });
  })
);

app.get('/posts/new', (req, res) => {
  res.render('posts/new');
});

app.post(
  '/posts',
  catchAsync(async (req, res) => {
    const post = new Post(req.body.post);
    post.author = req.user._id;
    await post.save();
    res.redirect('/posts');
  })
);

app.get(
  '/posts/:id',
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const post = await Post.findById(id).populate({
      path: 'comments',
      populate: { path: 'author' },
    });
    res.render('posts/show', { post });
  })
);

app.get(
  '/posts/:id/edit',
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const post = await Post.findById(id);
    res.render('posts/edit', { post });
  })
);

app.put(
  '/posts/:id',
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const post = await Post.findByIdAndUpdate(id, { ...req.body.post });
    res.redirect(`/posts/${id}`);
  })
);

app.delete(
  '/posts/:id',
  catchAsync(async (req, res) => {
    const { id } = req.params;
    await Post.findByIdAndDelete(id);
    res.redirect('/posts');
  })
);

//comments routes
app.post('/posts/:id/comments', async (req, res) => {
  const { id } = req.params;
  const post = await Post.findById(id);
  const comment = new Comment(req.body.comment);
  comment.author = req.user._id;
  post.comments.push(comment);
  await comment.save();
  await post.save();
  res.redirect(`/posts/${post._id}`);
});

app.delete('/posts/:id/comments/:commentId', async (req, res) => {
  const { id, commentId } = req.params;
  await Post.findByIdAndUpdate(id, { $pull: { comments: commentId } });
  await Comment.findByIdAndDelete(commentId);
  res.redirect(`/posts/${id}`);
});

//user routes
app.get('/register', (req, res) => {
  res.render('users/register');
});

app.post(
  '/register',
  catchAsync(async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await new User({ username });
      const registeredUser = await User.register(user, password);
      req.login(registeredUser, err => {
        if (err) return next(err);
        res.redirect('/posts');
      });
      console.log('registered');
    } catch (e) {
      console.log(e);
      res.redirect('/register');
    }
  })
);

app.get('/login', (req, res) => {
  res.render('users/login');
});

app.post('/login', passport.authenticate('local', { failureRedirect: '/login' }), (req, res) => {
  console.log('logged in');
  res.redirect('/posts');
});

app.get('/logout', (req, res) => {
  req.logout();
  console.log('logged out');
  res.redirect('/posts');
});

//catch all route
app.all('*', (req, res, next) => {
  next(new AppError('Page Not found!', 404));
});

//error middleware
app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;
  if (!err.message) err.message = 'Oh no, something went wrong';
  res.status(statusCode).send(`error ${statusCode} - ${err.message}`);
});

app.listen(5000, () => {
  console.log('listening on port 5000');
});
