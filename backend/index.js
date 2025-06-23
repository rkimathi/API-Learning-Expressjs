const express = require('express');
const connectDB = require('./config/db');

// Connect to Database only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Import Routers
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'UP', timestamp: new Date().toISOString() });
});

// Mount Routers
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes); // authMiddleware is applied within taskRoutes.js

// Middleware for 404 Not Found errors
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Basic global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err.stack); // Log error stack for debugging
  res.status(500).json({ error: 'Internal Server Error' });
});

// Export the app instance for testing BEFORE starting the server
module.exports = app;

// Start the server only if this file is run directly (not imported as a module)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}
