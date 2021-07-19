const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const flash = require('connect-flash');

const passport = require('passport');
const localStrategy = require('passport-local');

const Post = require('./models/post');
const Comment = require('./models/comment');
const User = require('./models/user');

const catchAsync = require('./utils/catchAsync');
const AppError = require('./utils/AppError');
const MongoStore = require('connect-mongo');

const { postSchema, commentSchema } = require('./schemaValidations');

const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/dogPics';
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

//middleware for logged in users
const isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.session.returnTo = req.originalUrl;
    console.log(req.session.returnTo);
    return res.redirect('/login');
  }
  next();
};

//middleware for checking post and comment authors
const isPostAuthor = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const post = await Post.findById(id);
  if (!post.author.equals(req.user._id)) {
    return res.redirect(`/posts/${id}`);
  }
  next();
});

//middleware for validations

const validatePost = (req, res, next) => {
  const { error } = postSchema.validate(req.body);
  if (error) {
    const msg = error.details.map(el => el.message).join(', ');
    throw new AppError(msg, 400);
  } else {
    next();
  }
};

const validateComment = (req, res, next) => {
  const { error } = commentSchema.validate(req.body);
  if (error) {
    const msg = error.details.map(el => el.message).join(', ');
    throw new AppError(msg, 400);
  } else {
    next();
  }
};

const isCommentAuthor = catchAsync(async (req, res, next) => {
  const { id, commentId } = req.params;
  const comment = await Comment.findById(commentId);
  if (!comment.author.equals(req.user._id)) {
    return res.redirect(`/posts/${id}`);
  }
  next();
});

//posts routes
app.get('/', (req, res) => {
  res.render('home');
});

app.get(
  '/posts',
  catchAsync(async (req, res) => {
    const posts = await Post.find({}).limit(6).sort({ createdAt: -1 });
    res.render('posts/index', { posts });
  })
);

app.get(
  '/api/posts',
  catchAsync(async (req, res) => {
    let { page = 1, size = 10 } = req.query;

    const limit = parseInt(size);
    const skip = (page - 1) * size; //skip how many documents based on how many pages have already been sent
    // const posts = await Post.find({}, {}, { limit, skip });
    const posts = await Post.find().limit(limit).skip(skip).sort({ createdAt: -1 });
    const obj = { page, size, data: posts };
    res.json(obj);
  })
);

app.get('/posts/new', isLoggedIn, (req, res) => {
  res.render('posts/new');
});

app.post(
  '/posts',
  isLoggedIn,
  validatePost,
  catchAsync(async (req, res) => {
    const post = new Post(req.body.post);
    post.author = req.user._id;
    post.createdAt = new Date();
    await post.save();
    req.flash('success', 'Post Created Successfully!');
    res.redirect('/posts');
  })
);

app.get(
  '/posts/:id',
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const post = await Post.findById(id)
      .populate({
        path: 'comments',
        populate: { path: 'author' },
      })
      .populate('author');
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
  isLoggedIn,
  isPostAuthor,
  validatePost,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const post = await Post.findByIdAndUpdate(id, { ...req.body.post });
    req.flash('success', 'Post Edited Successfully!');
    res.redirect(`/posts/${id}`);
  })
);

app.delete(
  '/posts/:id',
  isLoggedIn,
  isPostAuthor,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    await Post.findByIdAndDelete(id);
    req.flash('success', 'Post Deleted');
    res.redirect('/posts');
  })
);

//comments routes
app.post(
  '/posts/:id/comments',
  isLoggedIn,
  validateComment,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const post = await Post.findById(id);
    const comment = new Comment(req.body.comment);
    comment.author = req.user._id;
    post.comments.push(comment);
    await comment.save();
    await post.save();
    req.flash('success', 'Commented Successfully!');
    res.redirect(`/posts/${post._id}`);
  })
);

app.delete('/posts/:id/comments/:commentId', isLoggedIn, isCommentAuthor, async (req, res) => {
  const { id, commentId } = req.params;
  await Post.findByIdAndUpdate(id, { $pull: { comments: commentId } });
  await Comment.findByIdAndDelete(commentId);
  req.flash('success', 'Comment Deleted');
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
        req.flash('success', 'Welcome to dogpics!');
        res.redirect('/posts');
      });
      // console.log('registered');
    } catch (e) {
      req.flash('error', e.message);
      res.redirect('/register');
    }
  })
);

app.get(
  '/users/:id',
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(id);
    const posts = await Post.find({ author: id }).sort({ createdAt: -1 });
    const totalPosts = await Post.countDocuments({ author: id });
    res.render('users/profile', { user, posts, totalPosts });
  })
);

app.get('/login', (req, res) => {
  res.render('users/login');
});

app.post(
  '/login',
  passport.authenticate('local', { failureRedirect: '/login', failureFlash: true }),
  (req, res) => {
    req.flash('success', 'Welcome Back!');
    const redirectUrl = req.session.returnTo || '/posts';
    delete req.session.returnTo;
    res.redirect(redirectUrl);
  }
);

app.get('/logout', (req, res) => {
  req.logout();
  req.flash('success', 'Logged Out');
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
  res.status(statusCode).render('error', { err });
});

app.listen(5000, () => {
  console.log('listening on port 5000');
});
