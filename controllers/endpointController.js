// controllers/endpointController.js
const { supabase } = require('../config/database');

// POST ENDPOINT USER REGISTRATION
const registerEndpointUser = async (req, res) => {
  try {
    console.log('Received endpoint user registration request:', req.body);

    const {
      fullName,
      email,
      phoneNumber,
      organizationId,
      organizationCompanyName,
      operatingSystem,
      osVersion,
      ipAddress,
      macAddress
    } = req.body;

    console.log('Extracted fields:', {
      fullName,
      email,
      phoneNumber,
      organizationId,
      organizationCompanyName,
      operatingSystem,
      osVersion,
      ipAddress,
      macAddress
    });

    // Validation
    if (!fullName || !email || !phoneNumber || !organizationId || !organizationCompanyName) {
      console.log('Validation failed - missing required fields');
      return res.status(400).json({ message: "All required fields must be provided." });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format." });
    }

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('endpoint_users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    // Verify organization exists in public.users table
    console.log('Verifying organization with ID:', organizationId);

    const { data: orgData, error: orgError } = await supabase
      .from('users')
      .select('id, username, company_name')
      .eq('id', organizationId)
      .single();

    console.log('Organization verification result:', { orgData, orgError });

    if (orgError || !orgData) {
      console.error('Organization verification failed:', orgError);
      return res.status(400).json({
        message: "Invalid organization selected.",
        error: orgError?.message,
        organizationId: organizationId
      });
    }

    console.log('Organization verified:', orgData);

    // Insert endpoint user
    const endpointUserData = {
      full_name: fullName,
      email: email,
      phone_number: phoneNumber,
      organization_id: organizationId,
      organization_company_name: organizationCompanyName,
      operating_system: operatingSystem || 'Unknown',
      os_version: osVersion || 'Unknown',
      ip_address: ipAddress || 'Unknown',
      mac_address: macAddress || 'Unknown',
      is_approved: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('Attempting to insert endpoint user data:', endpointUserData);

    // Try to insert the endpoint user data
    const { data: newUser, error: insertError } = await supabase
      .from('endpoint_users')
      .insert(endpointUserData)
      .select()
      .single();

    if (insertError) {
      console.error('Insert error details:', {
        error: insertError,
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        data: endpointUserData
      });

      // Check if it's a RLS policy error
      if (insertError.code === '42501' || insertError.message?.includes('policy')) {
        return res.status(403).json({
          message: "Database access denied. Please check RLS policies.",
          error: insertError.message,
          hint: "The endpoint_users table may have restrictive Row Level Security policies."
        });
      }

      // Check if it's a foreign key constraint error
      if (insertError.code === '23503') {
        return res.status(400).json({
          message: "Invalid organization selected. Organization not found.",
          error: insertError.message,
          organizationId: organizationId
        });
      }

      return res.status(500).json({
        message: "Failed to create endpoint user account.",
        error: insertError.message,
        details: insertError.details,
        code: insertError.code
      });
    }

    return res.status(201).json({
      message: `Your request has been submitted to ${organizationCompanyName}. You will be notified when your access is approved.`,
      user: {
        id: newUser.id,
        fullName: newUser.full_name,
        email: newUser.email,
        organization: organizationCompanyName
      }
    });

  } catch (err) {
    console.error('Endpoint user registration error:', err);
    return res.status(500).json({ message: err.message || "Failed to register endpoint user." });
  }
};

// GET USER IP ADDRESS - Helper endpoint for system info detection
const getUserIP = (req, res) => {
  try {
    // Get IP address from various headers (handles proxies, load balancers, etc.)
    const forwarded = req.headers['x-forwarded-for'];
    const realIP = req.headers['x-real-ip'];
    const clientIP = req.headers['x-client-ip'];
    const remoteAddr = req.socket?.remoteAddress;

    let ipAddress = '';

    if (forwarded) {
      // x-forwarded-for can contain multiple IPs, take the first one
      ipAddress = forwarded.split(',')[0].trim();
    } else if (realIP) {
      ipAddress = realIP;
    } else if (clientIP) {
      ipAddress = clientIP;
    } else if (remoteAddr) {
      ipAddress = remoteAddr;
    } else {
      ipAddress = 'Unknown';
    }

    // Remove IPv6 prefix if present
    if (ipAddress.startsWith('::ffff:')) {
      ipAddress = ipAddress.substring(7);
    }

    console.log('IP detection request:', {
      forwarded,
      realIP,
      clientIP,
      remoteAddr,
      detectedIP: ipAddress
    });

    res.json({
      ip: ipAddress,
      headers: {
        'x-forwarded-for': forwarded,
        'x-real-ip': realIP,
        'x-client-ip': clientIP
      }
    });
  } catch (error) {
    console.error('IP detection error:', error);
    res.status(500).json({ error: 'Failed to detect IP address' });
  }
};

module.exports = { registerEndpointUser, getUserIP };
