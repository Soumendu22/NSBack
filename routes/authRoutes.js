// routes/authRoutes.js
const express = require('express');
const { signup, login } = require('../controllers/authController');

const router = express.Router();

// HEALTHCHECK ENDPOINT
router.get('/', (req, res) => {
  res.send('Backend is running!');
});

// Authentication routes
router.post('/signup', signup);
router.post('/login', login);

module.exports = router;
