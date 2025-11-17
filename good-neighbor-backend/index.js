const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001; // Обираємо порт для бекенду


app.use(cors({
    origin: 'http://localhost:5173'
  }));

// Це наш "Health Check" ендпоінт згідно Завдання 1.1 
app.get('/api/health', (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});