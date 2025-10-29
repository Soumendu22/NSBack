require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Import configurations
const { corsOptions } = require('./config/cors');

// Import routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const organizationRoutes = require('./routes/organizationRoutes');
const endpointRoutes = require('./routes/endpointRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const bulkUploadRoutes = require('./routes/bulkUploadRoutes');
const wazuhRoutes = require('./routes/wazuhRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();
app.use(express.json());

// Enable CORS
app.use(cors(corsOptions));

// Use routes
app.use('/', authRoutes);
app.use('/', adminRoutes);
app.use('/', organizationRoutes);
app.use('/', endpointRoutes);
app.use('/', dashboardRoutes);
app.use('/', bulkUploadRoutes);
app.use('/', wazuhRoutes);
app.use('/', analyticsRoutes);

// START SERVER
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
