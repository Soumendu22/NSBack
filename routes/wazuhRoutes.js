// routes/wazuhRoutes.js
const express = require('express');
const { 
  saveWazuhCredentials, 
  getWazuhCredentials, 
  verifyAdminPassword, 
  getWazuhPassword, 
  checkWazuhDB 
} = require('../controllers/wazuhController');

const router = express.Router();

// Wazuh routes
router.post('/api/admin/wazuh-credentials', saveWazuhCredentials);
router.get('/api/admin/wazuh-credentials/:userId', getWazuhCredentials);
router.post('/api/admin/verify-password', verifyAdminPassword);
router.post('/api/admin/wazuh-password', getWazuhPassword);
router.get('/api/admin/wazuh-db-check', checkWazuhDB);

module.exports = router;
