const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./src/routes/auth');
const dashboardRoutes = require('./src/routes/dashboard');
const newsRoutes = require('./src/routes/news');
const votingRoutes = require('./src/routes/votings');
const adminRoutes = require('./src/routes/admin');
const profileRoutes = require('./src/routes/profile');
const servicesRoutes = require('./src/routes/services');
const registerRoutes = require('./src/routes/register');
const internalRoutes = require('./src/routes/internal');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/votings', votingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/register', registerRoutes);
app.use('/api/internal', internalRoutes);

app.get('/', (req, res) => {
  res.send('Good Neighbor API');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});