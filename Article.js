const mongoose = require('mongoose');
const { Schema } = mongoose;

const articleSchema = new Schema({
  title: String,
  author: String,
  content: String,
  createdAt: { type: Date, default: Date.now },
});

mongoose.model('Article', articleSchema);