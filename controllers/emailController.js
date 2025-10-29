// controllers/emailController.js
const nodemailer = require('nodemailer');

// Email configuration - in production, these should be environment variables
const EMAIL_CONFIG = {
  service: 'gmail', // or your preferred email service
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-email-password'
  }
};

// Create transporter
const transporter = nodemailer.createTransporter(EMAIL_CONFIG);

// Generate email template for agent installation
const generateAgentEmailTemplate = (userInfo) => {
  const { name, operatingSystem, downloadLink } = userInfo;
  
  const osType = operatingSystem.toLowerCase().includes('linux') ? 'Linux' : 'Windows';
  
  return {
    subject: 'NexusSentinel Agent Installation - Action Required',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .button:hover { background: #5a6fd8; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .highlight { background: #e3f2fd; padding: 15px; border-left: 4px solid #2196f3; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🛡️ NexusSentinel Agent Installation</h1>
            <p>Secure Your Endpoint Today</p>
          </div>
          
          <div class="content">
            <h2>Hello ${name},</h2>
            
            <p>Your endpoint has been approved for NexusSentinel monitoring. To complete the setup, please install the NexusSentinel agent on your device.</p>
            
            <div class="highlight">
              <strong>📋 Your System Information:</strong><br>
              • Operating System: ${operatingSystem}<br>
              • Agent Type: ${osType}<br>
              • Status: Approved ✅
            </div>
            
            <h3>📦 Installation Instructions:</h3>
            <ol>
              <li>Click the download button below to access the ${osType} agent</li>
              <li>Follow the installation instructions on the download page</li>
              <li>The agent will automatically connect to NexusSentinel</li>
              <li>You'll receive a confirmation once the agent is active</li>
            </ol>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${downloadLink}" class="button" style="color: white;">
                📥 Download ${osType} Agent
              </a>
            </div>
            
            <div class="highlight">
              <strong>🔒 Security Note:</strong><br>
              This agent will monitor your endpoint for security threats and ensure compliance with your organization's security policies. All data is encrypted and handled according to industry standards.
            </div>
            
            <h3>❓ Need Help?</h3>
            <p>If you encounter any issues during installation:</p>
            <ul>
              <li>Contact your system administrator</li>
              <li>Check the installation guide at the download page</li>
              <li>Ensure you have administrator privileges</li>
            </ul>
            
            <p>Thank you for helping keep our organization secure!</p>
            
            <p>Best regards,<br>
            <strong>NexusSentinel Security Team</strong></p>
          </div>
          
          <div class="footer">
            <p>This is an automated message from NexusSentinel. Please do not reply to this email.</p>
            <p>© 2025 NexusSentinel. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Hello ${name},

      Your endpoint has been approved for NexusSentinel monitoring. To complete the setup, please install the NexusSentinel agent on your device.

      System Information:
      - Operating System: ${operatingSystem}
      - Agent Type: ${osType}
      - Status: Approved

      Installation Instructions:
      1. Visit: ${downloadLink}
      2. Download the ${osType} agent
      3. Follow the installation instructions
      4. The agent will automatically connect to NexusSentinel

      Security Note:
      This agent will monitor your endpoint for security threats and ensure compliance with your organization's security policies.

      Need help? Contact your system administrator.

      Best regards,
      NexusSentinel Security Team
    `
  };
};

// Send agent installation email
const sendAgentEmail = async (req, res) => {
  try {
    const { to, subject, userInfo } = req.body;

    if (!to || !userInfo) {
      return res.status(400).json({ error: 'Missing required fields: to, userInfo' });
    }

    // Generate email content
    const emailContent = generateAgentEmailTemplate(userInfo);

    // Email options
    const mailOptions = {
      from: `"NexusSentinel Security" <${EMAIL_CONFIG.auth.user}>`,
      to: to,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text
    };

    // Send email
    await transporter.sendMail(mailOptions);

    console.log(`Agent email sent successfully to: ${to}`);
    res.status(200).json({ 
      message: 'Email sent successfully',
      recipient: to,
      agentType: userInfo.operatingSystem.toLowerCase().includes('linux') ? 'Linux' : 'Windows'
    });

  } catch (error) {
    console.error('Error sending agent email:', error);
    
    // Handle specific email errors
    if (error.code === 'EAUTH') {
      return res.status(500).json({ error: 'Email authentication failed. Please check email configuration.' });
    } else if (error.code === 'ENOTFOUND') {
      return res.status(500).json({ error: 'Email service not found. Please check network connection.' });
    }
    
    res.status(500).json({ 
      error: 'Failed to send email',
      details: error.message 
    });
  }
};

// Test email configuration
const testEmailConfig = async (req, res) => {
  try {
    await transporter.verify();
    res.status(200).json({ message: 'Email configuration is valid' });
  } catch (error) {
    console.error('Email configuration test failed:', error);
    res.status(500).json({ 
      error: 'Email configuration is invalid',
      details: error.message 
    });
  }
};

module.exports = {
  sendAgentEmail,
  testEmailConfig
};
