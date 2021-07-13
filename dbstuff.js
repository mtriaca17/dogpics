const mongoose = require('mongoose');
const Post = require('./models/post');

mongoose
  .connect('mongodb://localhost:27017/dogPics', {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
  })
  .then(console.log('Database Connected!'))
  .catch(e => console.log(e));
mongoose.set('useFindAndModify', false);

const timer = ms => new Promise(res => setTimeout(res, ms));
const makeUpdates = async () => {
  const posts = await Post.find();
  for (let post of posts) {
    post.createdAt = new Date();
    post.save();
    await timer(50);
  }
};

makeUpdates()
  .then(() => {
    console.log('done with updates');
    mongoose.connection.close();
  })
  .catch(e => console.log(e));
