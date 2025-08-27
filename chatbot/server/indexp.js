const express = require('express');
const app = express();
const PORT = process.env.PORT || 5050;

app.get('/health', (_req, res) => res.send('ok'));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server UP: http://localhost:${PORT}/health`);
});