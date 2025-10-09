// Cryptographic utilities for demo
// In a real application, this would be done server-side with bcrypt

/**
 * Hash a password with SHA-256
 * @param {string} password - The password in plain text
 * @returns {Promise<string>} - The hash in hexadecimal
 */
export const hashPassword = async (password) => {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('')
  return hashHex
}

/**
 * Verify if a password matches the hash
 * @param {string} password - The password in plain text
 * @param {string} hash - The stored hash
 * @returns {Promise<boolean>} - True if password is correct
 */
export const verifyPassword = async (password, hash) => {
  const passwordHash = await hashPassword(password)
  return passwordHash === hash
}