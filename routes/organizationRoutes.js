// routes/organizationRoutes.js
const express = require('express');
const { getOrganizations } = require('../controllers/organizationController');

const router = express.Router();

// Organization routes
router.get('/api/organizations', getOrganizations);

module.exports = router;
