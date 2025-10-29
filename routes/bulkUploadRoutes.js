// routes/bulkUploadRoutes.js
const express = require('express');
const { upload, getDemoExcel, bulkUpload } = require('../controllers/bulkUploadController');

const router = express.Router();

// Bulk upload routes
router.get('/api/admin/download-demo-excel', getDemoExcel);
router.post('/api/admin/bulk-upload', upload.single('file'), bulkUpload);

module.exports = router;
