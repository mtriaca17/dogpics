const express = require('express');
const router = express.Router();

const catchAsync = require('../utils/catchAsync');
const Post = require('../models/post');

const { isLoggedIn, validatePost, isPostAuthor } = require('../middleware');

router.get(
  '/posts',
  catchAsync(async (req, res) => {
    const posts = await Post.find({}).limit(6).sort({ createdAt: -1 });
    res.render('posts/index', { posts });
  })
);

router.get(
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

router.get('/posts/new', isLoggedIn, (req, res) => {
  res.render('posts/new');
});

router.post(
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

router.get(
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

router.get(
  '/posts/:id/edit',
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const post = await Post.findById(id);
    res.render('posts/edit', { post });
  })
);

router.put(
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

router.delete(
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

module.exports = router;
