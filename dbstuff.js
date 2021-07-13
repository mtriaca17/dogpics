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

const makeUpdates = async () => {
  await Post.updateMany({}, { createdAt: new Date() });
};

makeUpdates()
  .then(() => {
    console.log('done with updates');
    mongoose.connection.close();
  })
  .catch(e => console.log(e));
