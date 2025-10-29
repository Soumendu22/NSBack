# NexusSentinel Backend - Modular Structure

This backend has been refactored into a modular structure for better maintainability and organization.

## Project Structure

```
nexus-backend/
├── config/
│   ├── cors.js          # CORS configuration
│   ├── database.js      # Supabase database configuration
│   └── email.js         # Email/nodemailer configuration
├── controllers/
│   ├── adminController.js       # Admin profile and setup logic
│   ├── analyticsController.js   # Analytics and reporting endpoints
│   ├── authController.js        # User authentication (signup/login)
│   ├── bulkUploadController.js  # Excel/CSV bulk upload functionality
│   ├── dashboardController.js   # Admin dashboard operations
│   ├── endpointController.js    # Endpoint user registration
│   ├── organizationController.js # Organization management
│   └── wazuhController.js       # Wazuh integration management
├── routes/
│   ├── adminRoutes.js       # Admin-related routes
│   ├── analyticsRoutes.js   # Analytics and reporting routes
│   ├── authRoutes.js        # Authentication routes
│   ├── bulkUploadRoutes.js  # Bulk upload routes
│   ├── dashboardRoutes.js   # Dashboard management routes
│   ├── endpointRoutes.js    # Endpoint user routes
│   ├── organizationRoutes.js # Organization routes
│   └── wazuhRoutes.js       # Wazuh integration routes
├── utils/
│   └── helpers.js       # Utility functions (username generator, etc.)
├── uploads/             # Temporary file upload directory
├── index.js            # Original monolithic file (preserved)
├── index_new.js        # New modular entry point
├── system_info.py      # Python system information collector
└── requirements.txt    # Python dependencies
```

## Files Description

### Configuration Files
- **`config/cors.js`**: CORS policy configuration with allowed origins
- **`config/database.js`**: Supabase client configuration
- **`config/email.js`**: Nodemailer/Gmail SMTP configuration

### Controllers
- **`authController.js`**: User signup, login, password verification
- **`adminController.js`**: Admin profile setup and management
- **`organizationController.js`**: Organization listing and management
- **`endpointController.js`**: Endpoint user registration and IP detection
- **`dashboardController.js`**: User approval/rejection, dashboard counts
- **`bulkUploadController.js`**: Excel/CSV file processing for bulk user import
- **`wazuhController.js`**: Wazuh manager credentials and integration
- **`analyticsController.js`**: Analytics, trends, and reporting

### Routes
Each route file contains the Express.js route definitions for their respective controllers.

### Utilities
- **`helpers.js`**: Common utility functions like NX username generation

## Running the Modular Backend

### Option 1: Use the new modular structure
```bash
node index_new.js
```

### Option 2: Continue using the original file
```bash
node index.js
# or
npm start
```

## Key Features Maintained

All existing functionality has been preserved:

1. **Authentication System**: Signup, login with bcrypt password hashing
2. **Admin Management**: Profile setup, organization management
3. **Endpoint User System**: Registration, approval workflow
4. **Dashboard Operations**: User management, bulk operations
5. **File Upload**: Excel/CSV bulk import with validation
6. **Wazuh Integration**: Credential management for Wazuh EDR
7. **Analytics**: Comprehensive reporting and trends
8. **System Information**: Python script for OS/network data collection

## Database Schema

The backend works with the following main tables:
- `users`: Admin users with company information
- `profiles`: Extended user profiles with preferences
- `endpoint_users`: End users requesting access to organizations
- Additional Wazuh credential fields in the `users` table

## Environment Variables Required

```bash
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key

# Email
GMAIL_USER=your_gmail_address
GMAIL_PASS=your_gmail_app_password

# Frontend
FRONTEND_URL=your_frontend_url

# Server
PORT=5000
```

## Benefits of Modular Structure

1. **Maintainability**: Each feature is in its own file
2. **Scalability**: Easy to add new features without affecting existing code
3. **Testing**: Individual controllers can be tested in isolation
4. **Code Reuse**: Controllers can be reused in different route configurations
5. **Team Development**: Multiple developers can work on different features simultaneously
6. **Debugging**: Easier to locate and fix issues in specific features

## Migration Notes

- The original `index.js` file is preserved for backward compatibility
- `index_new.js` is the new entry point using the modular structure
- All API endpoints remain exactly the same - no breaking changes
- Database interactions and business logic are unchanged
- Error handling and logging patterns are maintained

## Next Steps

1. Update your deployment scripts to use `index_new.js`
2. Update package.json start script if desired:
   ```json
   {
     "scripts": {
       "start": "node index_new.js",
       "start:old": "node index.js"
     }
   }
   ```
3. Consider adding middleware files for authentication, logging, etc.
4. Add unit tests for individual controllers
5. Consider using environment-specific configuration files
