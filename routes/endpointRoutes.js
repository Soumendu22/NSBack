// routes/endpointRoutes.js
const express = require('express');
const { registerEndpointUser, getUserIP } = require('../controllers/endpointController');

const router = express.Router();

// Endpoint user routes
router.post('/api/endpoint-users', registerEndpointUser);
router.get('/api/user-ip', getUserIP);

module.exports = router;
