const mongoose = require('mongoose');
const Article = mongoose.model('Article');

module.exports = app => {
  app.get('/api/articles', async (req, res) => {
    const articles = await Article.find().cache({ expire: 10 });

    res.json(articles);
  });

  app.post('/api/articles', async (req, res) => {
    const { title, author, content } = req.body;

    if (!title || !author || !content) {
      return res.status(400).send('Missing title, author, or content')
    }

    const article = new Article({
      title,
      author,
      content
    });

    try {
      await article.save();
      res.send(article);
    } catch (err) {
      res.status(400).send(err.message);
    }
  });
};