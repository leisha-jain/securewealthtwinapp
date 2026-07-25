const proxyHeaders = (req) => ({
  'Authorization': req.headers.authorization || '',
  'X-Internal-Token': process.env.INTERNAL_SECRET || '',
  'Content-Type': 'application/json',
  'Accept-Language': req.headers['accept-language'] || 'en'
});

module.exports = { proxyHeaders };
