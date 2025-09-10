// Production Vercel Serverless Function  
// This file serves as the entry point for api.agentradar.app

module.exports = require('./dist/index.js').default || require('./dist/index.js');