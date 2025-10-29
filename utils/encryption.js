// utils/encryption.js
const crypto = require('crypto');

// Use a fixed encryption key - in production, this should be in environment variables
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-character-ultra-secure-key!'; // 32 characters
const ALGORITHM = 'aes-256-cbc';

// Ensure the key is exactly 32 bytes
const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').substring(0, 32));

/**
 * Encrypt a text string
 * @param {string} text - The text to encrypt
 * @returns {string} - The encrypted text with IV prepended
 */
function encrypt(text) {
  if (!text) return null;
  
  const iv = crypto.randomBytes(16); // Generate random IV
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Prepend IV to encrypted text
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt an encrypted string
 * @param {string} encryptedData - The encrypted text with IV prepended
 * @returns {string} - The decrypted text
 */
function decrypt(encryptedData) {
  if (!encryptedData) return null;
  
  try {
    const parts = encryptedData.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted data format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
}

/**
 * Check if a string is encrypted (has the IV:encrypted format)
 * @param {string} data - The data to check
 * @returns {boolean} - True if the data appears to be encrypted
 */
function isEncrypted(data) {
  if (!data || typeof data !== 'string') return false;
  return data.includes(':') && data.split(':').length === 2;
}

module.exports = {
  encrypt,
  decrypt,
  isEncrypted
};
