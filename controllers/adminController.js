// controllers/adminController.js
const { supabase } = require('../config/database');

// ADMIN SETUP ENDPOINT
const adminSetup = async (req, res) => {
  try {
    const data = req.body;

    // Basic validation
    if (
      !data.fullName ||
      !data.role ||
      !data.acceptedTerms ||
      !data.acceptedPrivacyPolicy ||
      !data.securityContactEmail
    ) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    // Get user ID from request
    const userId = req.headers["x-user-id"] || data.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: Missing user ID." });
    }

    // Upsert data into profiles table
    const profileData = {
      id: userId,
      company_size: data.companySize,
      industry: data.industry === "Others" ? data.otherIndustryText : data.industry,
      website: data.website,
      address: data.address,
      ceo_name: data.ceoName,
      company_registration: data.companyRegistration,
      country: data.country,
      timezone: data.timezone,
      contact_number: data.contactNumber || data.phoneNumber,
      full_name: data.fullName,
      role: data.role,
      backup_email: data.backupEmail,
      ip_address: data.ip_address, // Add IP address field
      alert_sensitivity: data.alertSensitivity,
      mfa_enabled: data.mfaEnabled,
      notify_email: data.notificationPreference.email,
      notify_sms: data.notificationPreference.sms,
      notify_push: data.notificationPreference.push,
      endpoint_approval_mode: data.endpointApprovalMode,
      virustotal_api_key: data.virusTotalApiKey,
      endpoint_limit: data.endpointLimit,
      threat_response_mode: data.threatResponseMode,
      device_verification_method: data.deviceVerificationMethod,
      accepted_terms: data.acceptedTerms,
      accepted_privacy_policy: data.acceptedPrivacyPolicy,
      security_contact_email: data.securityContactEmail,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("profiles").upsert(profileData);

    if (error) {
      throw error;
    }

    return res.status(200).json({ message: "Admin profile saved successfully." });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to save admin profile." });
  }
};

// GET ADMIN PROFILE ENDPOINT
const getAdminProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    // Get profile data using service key (bypasses RLS)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code === 'PGRST116') {
      // No profile found, create a basic one
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({ id: userId })
        .select()
        .single();

      if (insertError) {
        return res.status(500).json({ message: "Failed to create profile." });
      }

      return res.json(newProfile);
    } else if (error) {
      return res.status(500).json({ message: "Failed to get profile." });
    }

    return res.json(data);
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to get profile." });
  }
};

module.exports = { adminSetup, getAdminProfile };
