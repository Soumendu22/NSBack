// routes/adminRoutes.js
const express = require('express');
const { adminSetup, getAdminProfile } = require('../controllers/adminController');

const router = express.Router();

// Admin routes
router.post('/admin/setup', adminSetup);
router.get('/admin/profile/:userId', getAdminProfile);

module.exports = router;
