/**
 * Simple input validation helpers for authentication.
 */

/**
 * Validates if the input is a valid email format.
 * @param {string} email 
 * @returns {boolean}
 */
const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return false;
  }
  // Standard email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Validates if the input password meets length requirements.
 * @param {string} password 
 * @returns {boolean}
 */
const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return false;
  }
  // Simple validation: password must be at least 6 characters
  return password.length >= 6;
};

module.exports = {
  validateEmail,
  validatePassword
};
