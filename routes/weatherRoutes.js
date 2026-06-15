const express = require('express');
const router = express.Router();

// GET /api/weather
router.get('/', (req, res) => {
  const { city } = req.query;
  
  if (!city) {
    return res.status(400).json({ 
      error: 'City parameter is required',
      example: '/api/weather?city=London'
    });
  }

  // Mock response for testing
  res.json({
    city: city,
    temperature: 22,
    condition: 'Cloudy',
    humidity: 55,
    timestamp: new Date()
  });
});

// GET /api/weather/current
router.get('/current', (req, res) => {
  res.json({
    message: "Current weather endpoint is working!",
    data: {
      temp: 25,
      status: "Sunny"
    }
  });
});

module.exports = router;
