const path = require('path');
const express = require('express');
const resultsRouter = require('./routes/results');
const challengesRouter = require('./routes/challenges');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// API routes
app.use('/api/results', resultsRouter);
app.use('/api/challenges', challengesRouter);

// Serve static files from the built frontend
const distPath = path.join(__dirname, '../../dist');
app.use(express.static(distPath));

// Fallback to index.html for client-side routing
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
