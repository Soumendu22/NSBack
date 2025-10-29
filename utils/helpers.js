// utils/helpers.js

// Helper: NX-username generator
function getNxUsername() {
  return `NX-${Math.floor(100000 + Math.random() * 900000)}`;
}

module.exports = { getNxUsername };
