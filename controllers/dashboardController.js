// controllers/dashboardController.js
const { supabase } = require('../config/database');
const { transporter } = require('../config/email');

// GET DASHBOARD COUNTS - Get counts for pending and approved users
const getDashboardCounts = async (req, res) => {
  try {
    const { organizationId } = req.query;

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization ID is required' });
    }

    console.log('Getting dashboard counts for organization:', organizationId);

    // Get pending count
    const { data: pendingData, error: pendingError } = await supabase
      .from('endpoint_users')
      .select('id', { count: 'exact' })
      .eq('organization_id', organizationId)
      .eq('is_approved', false);

    // Get approved count
    const { data: approvedData, error: approvedError } = await supabase
      .from('endpoint_users')
      .select('id', { count: 'exact' })
      .eq('organization_id', organizationId)
      .eq('is_approved', true);

    if (pendingError || approvedError) {
      throw pendingError || approvedError;
    }

    const pendingCount = pendingData?.length || 0;
    const approvedCount = approvedData?.length || 0;
    const totalCount = pendingCount + approvedCount;

    res.json({
      pendingCount,
      approvedCount,
      totalCount
    });

  } catch (error) {
    console.error('Error getting dashboard counts:', error);
    res.status(500).json({ error: 'Failed to get dashboard counts' });
  }
};

// GET PENDING USERS - Get all pending users for organization
const getPendingUsers = async (req, res) => {
  try {
    const { organizationId } = req.query;

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization ID is required' });
    }

    console.log('Getting pending users for organization:', organizationId);

    const { data, error } = await supabase
      .from('endpoint_users')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_approved', false)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json(data || []);

  } catch (error) {
    console.error('Error getting pending users:', error);
    res.status(500).json({ error: 'Failed to get pending users' });
  }
};

// GET APPROVED USERS - Get all approved users for organization
const getApprovedUsers = async (req, res) => {
  try {
    const { organizationId } = req.query;

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization ID is required' });
    }

    console.log('Getting approved users for organization:', organizationId);

    const { data, error } = await supabase
      .from('endpoint_users')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_approved', true)
      .order('updated_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json(data || []);

  } catch (error) {
    console.error('Error getting approved users:', error);
    res.status(500).json({ error: 'Failed to get approved users' });
  }
};

// POST APPROVE USER - Approve a pending user
const approveUser = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    console.log('Approving user:', userId);

    const { data, error } = await supabase
      .from('endpoint_users')
      .update({
        is_approved: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      message: 'User approved successfully',
      user: data
    });

  } catch (error) {
    console.error('Error approving user:', error);
    res.status(500).json({ error: 'Failed to approve user' });
  }
};

// POST REJECT USER - Reject/delete a pending user
const rejectUser = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    console.log('Rejecting user:', userId);

    const { data, error } = await supabase
      .from('endpoint_users')
      .delete()
      .eq('id', userId)
      .eq('is_approved', false)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({ error: 'User not found or already approved' });
    }

    res.json({
      success: true,
      message: 'User rejected successfully'
    });

  } catch (error) {
    console.error('Error rejecting user:', error);
    res.status(500).json({ error: 'Failed to reject user' });
  }
};

// POST REVOKE APPROVAL - Revoke approval for a user
const revokeApproval = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    console.log('Revoking approval for user:', userId);

    const { data, error } = await supabase
      .from('endpoint_users')
      .update({
        is_approved: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      message: 'User approval revoked successfully',
      user: data
    });

  } catch (error) {
    console.error('Error revoking approval:', error);
    res.status(500).json({ error: 'Failed to revoke approval' });
  }
};

// SEND AGENT EMAIL - Send installation email to approved user
const sendAgentEmail = async (req, res) => {
  try {
    console.log('=== Send Agent Email Request ===');
    console.log('Request body:', req.body);
    
    const { to, subject, userInfo } = req.body;

    if (!to || !userInfo) {
      console.log('Missing required fields:', { to: !!to, userInfo: !!userInfo });
      return res.status(400).json({ error: 'Email address and user info are required' });
    }

    console.log('Preparing to send email to:', to);
    console.log('User info:', userInfo);
    console.log('Intensity level:', userInfo.intensity || 'medium');

    // Email template for agent installation
    const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .download-btn { display: inline-block; background: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
            .download-btn:hover { background: #45a049; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .os-info { background: #e8f4f8; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🛡️ NexusSentinel Agent Installation</h1>
                <p>Welcome to Enterprise Endpoint Security</p>
            </div>
            <div class="content">
                <h2>Hello ${userInfo.name},</h2>
                
                <p>Your endpoint has been approved for NexusSentinel monitoring. Please install the security agent to complete the setup process.</p>
                
                <div class="os-info">
                    <strong>Detected Operating System:</strong> ${userInfo.operatingSystem}<br>
                    <strong>Scanning Intensity:</strong> <span style="color: ${userInfo.intensity === 'high' ? '#ef4444' : userInfo.intensity === 'medium' ? '#f97316' : '#22c55e'}; font-weight: bold; text-transform: uppercase;">${userInfo.intensity || 'medium'}</span>
                </div>
                
                <p>Click the button below to download and install the appropriate agent for your system:</p>
                
                <div style="text-align: center;">
                    <a href="${userInfo.downloadLink}" class="download-btn">
                        📥 Download ${userInfo.operatingSystem.toLowerCase().includes('windows') ? 'Windows' : 'Linux'} Agent
                    </a>
                </div>
                
                <h3>Installation Instructions:</h3>
                <ol>
                    <li>Click the download button above</li>
                    <li>Run the installer with administrator privileges</li>
                    <li>Follow the on-screen installation wizard</li>
                    <li>The agent will automatically connect to our monitoring system</li>
                    <li>The agent is configured for <strong>${(userInfo.intensity || 'medium').toUpperCase()}</strong> intensity scanning</li>
                </ol>
                
                <h3>Scanning Intensity Information:</h3>
                <ul>
                    <li><strong>High:</strong> Maximum security with frequent deep scans (recommended for critical systems)</li>
                    <li><strong>Medium:</strong> Balanced security with regular scans (recommended for most systems)</li>
                    <li><strong>Low:</strong> Basic security with minimal performance impact (for resource-constrained systems)</li>
                </ul>
                
                <h3>Important Notes:</h3>
                <ul>
                    <li>The agent requires administrator/root privileges to install</li>
                    <li>Installation typically takes 2-3 minutes</li>
                    <li>Your system will be protected immediately after installation</li>
                    <li>No restart is required</li>
                </ul>
                
                <p>If you encounter any issues during installation, please contact your system administrator.</p>
                
                <p>Thank you for helping us secure your organization's endpoints!</p>
            </div>
            <div class="footer">
                <p>This is an automated message from NexusSentinel Security Platform</p>
                <p>Please do not reply to this email</p>
            </div>
        </div>
    </body>
    </html>
    `;

    // Send email
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: to,
      subject: subject || 'NexusSentinel Agent Installation - Action Required',
      html: emailHtml
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('Email sent successfully:', info.messageId);
    console.log('Sending success response to frontend');
    
    res.json({
      success: true,
      message: 'Agent installation email sent successfully',
      messageId: info.messageId
    });

  } catch (error) {
    console.error('Error sending email:', error);
    console.error('Error details:', error.message);
    console.error('Sending error response to frontend');
    
    res.status(500).json({ 
      error: 'Failed to send email',
      details: error.message 
    });
  }
};

// GET ADMIN IP ADDRESS - Get admin's IP from profiles table
const getAdminIP = async (req, res) => {
  try {
    const { adminId } = req.query;
    
    if (!adminId) {
      return res.status(400).json({ error: 'Admin ID is required' });
    }

    console.log('Getting admin IP for ID:', adminId);

    const { data, error } = await supabase
      .from('profiles')
      .select('ip_address')
      .eq('id', adminId)
      .single();

    if (error) {
      console.error('Error fetching admin IP:', error);
      return res.status(500).json({ error: 'Failed to fetch admin IP address' });
    }

    if (!data || !data.ip_address) {
      console.warn('No IP address found for admin:', adminId);
      return res.json({ ip: 'Unknown' });
    }

    console.log('Admin IP found:', data.ip_address);
    res.json({ ip: data.ip_address });
  } catch (error) {
    console.error('Error getting admin IP:', error);
    res.status(500).json({ error: 'Failed to get admin IP address' });
  }
};

module.exports = { 
  getDashboardCounts, 
  getPendingUsers, 
  getApprovedUsers, 
  approveUser, 
  rejectUser, 
  revokeApproval,
  sendAgentEmail,
  getAdminIP
};
