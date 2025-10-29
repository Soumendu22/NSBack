// routes/dashboardRoutes.js
const express = require('express');
const { 
  getDashboardCounts, 
  getPendingUsers, 
  getApprovedUsers, 
  approveUser, 
  rejectUser, 
  revokeApproval,
  sendAgentEmail,
  getAdminIP
} = require('../controllers/dashboardController');

const router = express.Router();

// Dashboard routes
router.get('/api/admin/dashboard-counts', getDashboardCounts);
router.get('/api/admin/pending-users', getPendingUsers);
router.get('/api/admin/approved-users', getApprovedUsers);
router.post('/api/admin/approve-user', approveUser);
router.post('/api/admin/reject-user', rejectUser);
router.post('/api/admin/revoke-approval', revokeApproval);
router.post('/api/admin/send-agent-email', sendAgentEmail);
router.get('/api/admin/admin-ip', getAdminIP);

module.exports = router;
