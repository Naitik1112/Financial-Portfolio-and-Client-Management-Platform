// routes/healthRoutes.js
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date(),
    memoryUsage: process.memoryUsage(),
    uptime: process.uptime()
  });
});

module.exports = router;