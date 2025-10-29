// routes/analyticsRoutes.js
const express = require('express');
const { 
  getUserTrends, 
  getOrganizationDistribution, 
  getApprovalStatus, 
  getSystemStatus, 
  getRecentActivity,
  getDeviceAnalytics,
  getHourlyActivity,
  getSecurityMetrics,
  getGrowthMetrics
} = require('../controllers/analyticsController');

const router = express.Router();

// Analytics routes
router.get('/api/admin/analytics/user-trends', getUserTrends);
router.get('/api/admin/analytics/organization-distribution', getOrganizationDistribution);
router.get('/api/admin/analytics/approval-status', getApprovalStatus);
router.get('/api/admin/analytics/system-status', getSystemStatus);
router.get('/api/admin/analytics/recent-activity', getRecentActivity);
router.get('/api/admin/analytics/device-analytics', getDeviceAnalytics);
router.get('/api/admin/analytics/hourly-activity', getHourlyActivity);
router.get('/api/admin/analytics/security-metrics', getSecurityMetrics);
router.get('/api/admin/analytics/growth-metrics', getGrowthMetrics);

module.exports = router;
