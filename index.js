const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.send('Weather App Backend is running!');
});

app.get('/api/weather', (req, res) => {
  const { city } = req.query;
  
  if (!city) {
    return res.status(400).json({ error: 'City is required' });
  }

  // Mock data for the demo
  const mockWeather = {
    city: city,
    temperature: Math.floor(Math.random() * (35 - 15 + 1)) + 15,
    condition: 'Sunny',
    humidity: 60,
    windSpeed: 10
  };

  res.json(mockWeather);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
