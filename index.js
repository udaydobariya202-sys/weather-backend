const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Import Routes
const weatherRoutes = require('./routes/weatherRoutes');

// Health check route
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Weather App Backend Running',
    timestamp: new Date()
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Mount Routes
app.use('/api/weather', weatherRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
