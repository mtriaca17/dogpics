const AppError = require('./utils/AppError');
const catchAsync = require('./utils/catchAsync');
const Comment = require('./models/comment');
const Post = require('./models/post');
const { postSchema, commentSchema } = require('./schemaValidations');

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

const isAlreadyLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    req.flash('success', 'You signed in already!');
    return res.redirect('/posts');
  }
  next();
};

module.exports = {
  isLoggedIn,
  isPostAuthor,
  isCommentAuthor,
  validateComment,
  validatePost,
  isAlreadyLoggedIn,
};
