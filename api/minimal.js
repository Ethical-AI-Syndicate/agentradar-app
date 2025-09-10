// Absolute minimal test function for Vercel
module.exports = (req, res) => {
  res.status(200).json({
    status: 'working',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    message: 'Minimal function operational'
  });
};