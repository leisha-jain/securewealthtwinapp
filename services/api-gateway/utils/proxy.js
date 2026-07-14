const proxyHeaders = (req) => ({
  'Authorization': req.headers.authorization || '',
  'X-Internal-Token': process.env.INTERNAL_SECRET || '',
  'Content-Type': 'application/json'
});

module.exports = { proxyHeaders };
