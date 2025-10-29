// controllers/organizationController.js
const { supabase } = require('../config/database');

// GET ORGANIZATIONS ENDPOINT - For endpoint user registration
const getOrganizations = async (req, res) => {
  try {
    // Get all organizations (users with company names)
    const { data, error } = await supabase
      .from('users')
      .select('id, username, company_name, email')
      .not('company_name', 'is', null)
      .not('company_name', 'eq', '')
      .order('company_name');

    if (error) {
      console.error('Organizations query error:', error);
      return res.status(500).json({ message: "Failed to fetch organizations." });
    }

    // Format for dropdown display
    const organizations = data.map(org => ({
      value: org.id, // Use ID instead of username
      label: `${org.company_name} (${org.username})`,
      company_name: org.company_name,
      username: org.username,
      id: org.id
    }));

    return res.json(organizations);
  } catch (err) {
    console.error('Organizations endpoint error:', err);
    return res.status(500).json({ message: err.message || "Failed to fetch organizations." });
  }
};

module.exports = { getOrganizations };
