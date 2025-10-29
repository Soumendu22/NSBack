// controllers/bulkUploadController.js
const { supabase } = require('../config/database');
const multer = require('multer');
const XLSX = require('xlsx');

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    if (allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(xlsx|xls|csv)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Please upload Excel or CSV files only.'));
    }
  }
});

// GET DEMO EXCEL - Download demo Excel template
const getDemoExcel = (req, res) => {
  try {
    // Create demo data
    const demoData = [
      {
        full_name: 'John Doe',
        email: 'john.doe@example.com',
        phone_number: '+1-555-0123',
        operating_system: 'Windows',
        os_version: 'Windows 11',
        ip_address: '192.168.1.100',
        mac_address: '00:11:22:33:44:55'
      },
      {
        full_name: 'Bob Johnson',
        email: 'bob.johnson@example.com',
        phone_number: '+1-555-0125',
        operating_system: 'Linux',
        os_version: 'Ubuntu 22.04',
        ip_address: '192.168.1.102',
        mac_address: '00:11:22:33:44:57'
      }
    ];

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(demoData);

    // Set column widths
    ws['!cols'] = [
      { wch: 15 }, // full_name
      { wch: 25 }, // email
      { wch: 15 }, // phone_number
      { wch: 15 }, // operating_system
      { wch: 15 }, // os_version
      { wch: 15 }, // ip_address
      { wch: 18 }  // mac_address
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Endpoint Users');

    // Generate buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename="endpoint_users_template.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);

  } catch (error) {
    console.error('Error generating demo Excel:', error);
    res.status(500).json({ error: 'Failed to generate demo Excel file' });
  }
};

// POST BULK UPLOAD - Upload Excel file with endpoint users
const bulkUpload = async (req, res) => {
  try {
    const { organizationId } = req.body;

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization ID is required' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('Processing bulk upload for organization:', organizationId);
    console.log('File details:', req.file);

    // Read the uploaded file
    let workbook;
    try {
      workbook = XLSX.readFile(req.file.path);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid file format. Please upload a valid Excel or CSV file.' });
    }

    // Get the first worksheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    if (jsonData.length === 0) {
      return res.status(400).json({ error: 'The uploaded file is empty or has no data rows.' });
    }

    // Validate required columns
    const requiredColumns = ['full_name', 'email', 'phone_number', 'operating_system', 'os_version', 'ip_address', 'mac_address'];
    const firstRow = jsonData[0];
    const missingColumns = requiredColumns.filter(col => !(col in firstRow));

    if (missingColumns.length > 0) {
      return res.status(400).json({
        error: `Missing required columns: ${missingColumns.join(', ')}`,
        requiredColumns: requiredColumns
      });
    }

    // Process each row
    const results = {
      success: true,
      totalRows: jsonData.length,
      successCount: 0,
      errorCount: 0,
      errors: []
    };

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      const rowNumber = i + 2; // Excel row number (accounting for header)

      try {
        // Validate required fields
        const missingFields = requiredColumns.filter(col => !row[col] || row[col].toString().trim() === '');
        if (missingFields.length > 0) {
          throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(row.email)) {
          throw new Error('Invalid email format');
        }

        // Check for duplicate email
        const { data: existingUser } = await supabase
          .from('endpoint_users')
          .select('id')
          .eq('email', row.email)
          .single();

        if (existingUser) {
          throw new Error('Email already exists');
        }

        // Insert user
        const userData = {
          full_name: row.full_name.toString().trim(),
          email: row.email.toString().trim().toLowerCase(),
          phone_number: row.phone_number.toString().trim(),
          organization_id: organizationId,
          organization_company_name: '', // Will be filled by trigger or separate query
          operating_system: row.operating_system.toString().trim(),
          os_version: row.os_version.toString().trim(),
          ip_address: row.ip_address.toString().trim(),
          mac_address: row.mac_address.toString().trim().toUpperCase(),
          is_approved: true, // Bulk uploaded users are auto-approved
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { error: insertError } = await supabase
          .from('endpoint_users')
          .insert(userData);

        if (insertError) {
          throw insertError;
        }

        results.successCount++;

      } catch (error) {
        results.errorCount++;
        results.errors.push(`Row ${rowNumber}: ${error.message}`);
        console.error(`Error processing row ${rowNumber}:`, error);
      }
    }

    // Clean up uploaded file
    const fs = require('fs');
    try {
      fs.unlinkSync(req.file.path);
    } catch (cleanupError) {
      console.error('Error cleaning up uploaded file:', cleanupError);
    }

    // Determine overall success
    results.success = results.errorCount === 0;

    console.log('Bulk upload results:', results);
    res.json(results);

  } catch (error) {
    console.error('Error processing bulk upload:', error);

    // Clean up uploaded file on error
    if (req.file) {
      const fs = require('fs');
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up uploaded file:', cleanupError);
      }
    }

    res.status(500).json({ error: 'Failed to process bulk upload' });
  }
};

module.exports = { upload, getDemoExcel, bulkUpload };
