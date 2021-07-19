const express = require('express');
const router = express.Router();

const catchAsync = require('../utils/catchAsync');
const Post = require('../models/post');
const Comment = require('../models/comment');

const { isLoggedIn, validateComment, isCommentAuthor } = require('../middleware');

router.post(
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

router.delete('/posts/:id/comments/:commentId', isLoggedIn, isCommentAuthor, async (req, res) => {
  const { id, commentId } = req.params;
  await Post.findByIdAndUpdate(id, { $pull: { comments: commentId } });
  await Comment.findByIdAndDelete(commentId);
  req.flash('success', 'Comment Deleted');
  res.redirect(`/posts/${id}`);
});

module.exports = router;
