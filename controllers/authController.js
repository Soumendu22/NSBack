// controllers/authController.js
const bcrypt = require('bcrypt');
const { supabase } = require('../config/database');
const { transporter } = require('../config/email');
const { getNxUsername } = require('../utils/helpers');

// SIGNUP ENDPOINT
const signup = async (req, res) => {
  try {
    const { companyName, email, password } = req.body;
    if (!companyName || !email || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Prevent duplicate email
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(409).json({ message: "Email already registered." });
    }

    // Generate unique username (retry on collision)
    let username;
    let unique = false;
    while (!unique) {
      username = getNxUsername();
      const { data: userWithSameUsername } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .single();
      if (!userWithSameUsername) unique = true;
    }

    const password_hash = await bcrypt.hash(password, 10);

    // Insert to users table
    const { data: user, error: insertUserError } = await supabase
      .from('users')
      .insert([
        {
          company_name: companyName,
          email,
          username,
          password_hash,
        },
      ])
      .select()
      .single();

    if (insertUserError || !user) {
      throw insertUserError || new Error("Failed to create user.");
    }

    // Insert to profiles table with same uuid
    const { error: insertProfileError } = await supabase
      .from('profiles')
      .insert([
        {
          id: user.id,
          // Fill profile fields for company details if you collect them at signup:
          // company_size, industry, website, phone, address, etc.
        },
      ]);
    if (insertProfileError) throw insertProfileError;

    // Send email with username
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: email,
      subject: "Welcome to Nexus Sentinel - Your Username Inside!",
      html: `
        <div style="font-family: Arial, sans-serif; background-color:#1a1a2e; color:#e0e0e0; padding: 20px; max-width:600px; margin:auto; border-radius:8px;">
          <h2 style="color:#7f5af0; text-align:center;">Welcome to <span style="color:#ffffff;">Nexus Sentinel</span>!</h2>
          <p style="font-size:16px; line-height:1.5; margin-top:0;">
            Hi there,
          </p>
          <p style="font-size:16px; line-height:1.5;">
            Thank you for registering as an administrator on Nexus Sentinel, your AI-powered EDR platform designed to keep your endpoints secure.
          </p>
          <p style="font-size:16px; line-height:1.5;">
            Your unique username has been generated for you:
          </p>
          <p style="font-size:20px; font-weight:bold; color:#7f5af0; background:#2e2e62; padding: 12px; border-radius: 6px; text-align: center; user-select: all;">
            ${username}
          </p>
          <p style="font-size:16px; line-height:1.5;">
            Please use this username along with the password you created during signup to log in to your admin dashboard.
          </p>
          <p style="font-size:16px; line-height:1.5;">
            <a href="https://your-frontend-domain/login" target="_blank" style="display:inline-block; padding:10px 20px; background:#7f5af0; color:#fff; border-radius: 5px; text-decoration:none; margin-top:10px;">
              Go to Login
            </a>
          </p>
          <hr style="border:none; border-top:1px solid #444; margin: 30px 0;" />
          <p style="font-size:12px; color:#999999; text-align:center;">
            If you did not request this email, please ignore it.<br />
            &copy; ${new Date().getFullYear()} Nexus Sentinel. All rights reserved.
          </p>
        </div>
      `,
    });

    // Return success message and user id to frontend
    res.status(201).json({ 
      message: "Signup successful! Username sent to email.",
      id: user.id,         // <---- return user UUID here
      username: user.username // optional, but may be useful
    });

  } catch (err) {
    res.status(500).json({ message: err.message || "Signup error." });
  }
};

// LOGIN ENDPOINT
const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required." });
    }

    const { data: user } = await supabase
      .from('users')
      .select('id, username, password_hash')
      .eq('username', username)
      .single();

    if (!user) {
      return res.status(401).json({ message: "Invalid username or password." });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ message: "Invalid username or password." });
    }

    // You can add a token/session here (optional)

    // Return success message and user id to frontend
    res.json({
      message: "Login successful.",
      username: user.username,
      id: user.id
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Login error." });
  }
};

module.exports = { signup, login };
