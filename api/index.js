const { app, connectMongo } = require('../server');

module.exports = async (req, res) => {
  await connectMongo();
  const originalUrl = req.url;
  if (!req.url.startsWith('/api')) {
    req.url = `/api${req.url.startsWith('/') ? '' : '/'}${req.url}`;
  }

  try {
    return app(req, res);
  } finally {
    req.url = originalUrl;
  }
};