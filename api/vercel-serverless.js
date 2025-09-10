// Vercel serverless function handler
const app = require('./dist/index.js').default;

// Export the Express app as a Vercel serverless function
module.exports = app;

// Also export as default for compatibility
module.exports.default = app;