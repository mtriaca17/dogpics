const mongoose = require('mongoose');
const Comment = require('./comment');

const PostSchema = new mongoose.Schema({
  title: String,
  image: String,
  description: String,
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
});

PostSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    await Comment.deleteMany({
      _id: { $in: doc.comments },
    });
  }
});

module.exports = mongoose.model('Post', PostSchema);
