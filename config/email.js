// config/email.js
require('dotenv').config();
const nodemailer = require('nodemailer');

// Nodemailer/Gmail setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

module.exports = { transporter };
