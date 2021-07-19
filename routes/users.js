const express = require('express');
const router = express.Router();

const catchAsync = require('../utils/catchAsync');
const Post = require('../models/post');
const User = require('../models/user');
const passport = require('passport');

const { isAlreadyLoggedIn } = require('../middleware');

router.get('/register', isAlreadyLoggedIn, (req, res) => {
  res.render('users/register');
});

router.post(
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

router.get(
  '/users/:id',
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(id);
    const posts = await Post.find({ author: id }).sort({ createdAt: -1 });
    const totalPosts = await Post.countDocuments({ author: id });
    res.render('users/profile', { user, posts, totalPosts });
  })
);

router.get('/login', isAlreadyLoggedIn, (req, res) => {
  res.render('users/login');
});

router.post(
  '/login',
  passport.authenticate('local', { failureRedirect: '/login', failureFlash: true }),
  (req, res) => {
    req.flash('success', 'Welcome Back!');
    const redirectUrl = req.session.returnTo || '/posts';
    delete req.session.returnTo;
    res.redirect(redirectUrl);
  }
);

router.get('/logout', (req, res) => {
  req.logout();
  req.flash('success', 'Logged Out');
  res.redirect('/posts');
});

module.exports = router;
