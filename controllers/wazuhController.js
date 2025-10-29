// controllers/wazuhController.js
const bcrypt = require('bcrypt');
const { supabase } = require('../config/database');
const { encrypt, decrypt, isEncrypted } = require('../utils/encryption');

// WAZUH CREDENTIALS ENDPOINT - Save Wazuh manager credentials
const saveWazuhCredentials = async (req, res) => {
  try {
    const { userId, wazuh_username, wazuh_password } = req.body;
    console.log('Received Wazuh credentials request:', { userId, wazuh_username, hasPassword: !!wazuh_password });

    // Validate required fields
    if (!userId || !wazuh_username) {
      return res.status(400).json({
        error: 'Missing required fields: userId, wazuh_username'
      });
    }

    // Check if user already has credentials (for update vs insert)
    const { data: existingUser } = await supabase
      .from('users')
      .select('wazuh_username')
      .eq('id', userId)
      .single();

    const isUpdate = existingUser && existingUser.wazuh_username;
    console.log('Is update:', isUpdate);

    // For new credentials, password is required. For updates, it's optional
    if (!isUpdate && !wazuh_password) {
      return res.status(400).json({
        error: 'Password is required for new credentials'
      });
    }

    // Prepare update data
    const updateData = {
      wazuh_username: wazuh_username.trim(),
      updated_at: new Date().toISOString()
    };

    // Only update password if provided (for updates, empty password means keep current)
    if (wazuh_password && wazuh_password.trim()) {
      const encryptedPassword = encrypt(wazuh_password.trim());
      updateData.wazuh_password = encryptedPassword;
    }

    console.log('Updating user with data:', { ...updateData, wazuh_password: updateData.wazuh_password ? '[ENCRYPTED]' : 'NOT_UPDATED' });

    // Update user record with Wazuh credentials (no role checking, just store)
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select();

    if (error) {
      console.error('Error saving Wazuh credentials:', error);
      return res.status(500).json({ error: 'Failed to save Wazuh credentials: ' + error.message });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'User not found or no rows updated' });
    }

    console.log('Successfully saved Wazuh credentials for user:', userId);
    res.status(200).json({
      message: 'Wazuh credentials saved successfully',
      data: {
        id: data[0].id,
        wazuh_username: data[0].wazuh_username
        // Note: Never return the hashed password
      }
    });

  } catch (error) {
    console.error('Error in wazuh-credentials endpoint:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
};

// GET WAZUH CREDENTIALS ENDPOINT - Check if user has Wazuh credentials
const getWazuhCredentials = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('Checking Wazuh credentials for user:', userId);

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Simply check if user has Wazuh credentials (no role checking)
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, wazuh_username')
      .eq('id', userId)
      .single();

    console.log('User query result:', { user, userError });

    if (userError) {
      console.error('Database error:', userError);

      // Check if it's a column not found error (database schema issue)
      if (userError.message && userError.message.includes('wazuh_username')) {
        return res.status(500).json({
          error: 'Database schema error: wazuh_username column not found. Please run the database migration.'
        });
      }

      // If user not found, return empty credentials (don't error)
      return res.status(200).json({
        hasCredentials: false,
        wazuh_username: null
      });
    }

    if (!user) {
      // If user not found, return empty credentials (don't error)
      return res.status(200).json({
        hasCredentials: false,
        wazuh_username: null
      });
    }

    const response = {
      hasCredentials: !!user.wazuh_username,
      wazuh_username: user.wazuh_username || null
    };

    console.log('Sending response:', response);
    res.status(200).json(response);

  } catch (error) {
    console.error('Error checking Wazuh credentials:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
};

// VERIFY ADMIN PASSWORD ENDPOINT - For secure Wazuh password viewing
const verifyAdminPassword = async (req, res) => {
  try {
    const { userId, password } = req.body;
    console.log('Verifying admin password for user:', userId);

    if (!userId || !password) {
      return res.status(400).json({ error: 'User ID and password are required' });
    }

    // Get user's stored password hash
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, password_hash')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.error('User not found:', userError);
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      console.log('Invalid password for user:', userId);
      return res.status(401).json({ error: 'Invalid password' });
    }

    console.log('Password verified successfully for user:', userId);
    res.status(200).json({ message: 'Password verified successfully' });

  } catch (error) {
    console.error('Error verifying admin password:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
};

// GET WAZUH PASSWORD ENDPOINT - Retrieve decrypted Wazuh password (requires verified session)
const getWazuhPassword = async (req, res) => {
  try {
    const { userId, adminPassword } = req.body;
    console.log('Retrieving Wazuh password for user:', userId);

    if (!userId || !adminPassword) {
      return res.status(400).json({ error: 'User ID and admin password are required' });
    }

    // First verify the admin password
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, password_hash, wazuh_password')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify admin password
    const isValidPassword = await bcrypt.compare(adminPassword, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid admin password' });
    }

    if (!user.wazuh_password) {
      return res.status(404).json({ error: 'No Wazuh password found' });
    }

    // Decrypt the password for display
    let decryptedPassword = null;
    try {
      decryptedPassword = decrypt(user.wazuh_password);
      if (!decryptedPassword) {
        throw new Error('Failed to decrypt password');
      }
    } catch (error) {
      console.error('Password decryption failed:', error);
      return res.status(500).json({ 
        error: 'Failed to decrypt password',
        note: 'The stored password may be corrupted or was encrypted with a different key'
      });
    }

    res.status(200).json({
      message: 'Credentials retrieved successfully',
      wazuh_password: decryptedPassword,
      note: 'Password successfully decrypted and retrieved',
      hasPassword: true,
      passwordStatus: 'decrypted'
    });

  } catch (error) {
    console.error('Error retrieving Wazuh password:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
};

// DATABASE HEALTH CHECK ENDPOINT - Check if Wazuh columns exist
const checkWazuhDB = async (req, res) => {
  try {
    console.log('Checking Wazuh database schema...');

    // Try to query the users table with Wazuh columns
    const { data, error } = await supabase
      .from('users')
      .select('id, wazuh_username, wazuh_password')
      .limit(1);

    if (error) {
      console.error('Database schema check failed:', error);

      if (error.message && error.message.includes('wazuh_username')) {
        return res.status(500).json({
          error: 'Wazuh columns not found',
          message: 'Please run the database migration to add wazuh_username and wazuh_password columns',
          migration: 'ALTER TABLE users ADD COLUMN wazuh_username VARCHAR(255) NULL, ADD COLUMN wazuh_password VARCHAR(255) NULL;'
        });
      }

      return res.status(500).json({ error: 'Database error: ' + error.message });
    }

    res.status(200).json({
      message: 'Wazuh database schema is ready',
      columns: ['wazuh_username', 'wazuh_password'],
      status: 'ok'
    });

  } catch (error) {
    console.error('Error checking Wazuh database schema:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
};

module.exports = { 
  saveWazuhCredentials, 
  getWazuhCredentials, 
  verifyAdminPassword, 
  getWazuhPassword, 
  checkWazuhDB 
};
