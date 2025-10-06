// Utilitaires cryptographiques pour la démo
// Dans une vraie application, cela serait fait côté serveur avec bcrypt

/**
 * Hash un mot de passe avec SHA-256
 * @param {string} password - Le mot de passe en texte clair
 * @returns {Promise<string>} - Le hash en hexadécimal
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
 * Vérifie si un mot de passe correspond au hash
 * @param {string} password - Le mot de passe en texte clair
 * @param {string} hash - Le hash stocké
 * @returns {Promise<boolean>} - True si le mot de passe est correct
 */
export const verifyPassword = async (password, hash) => {
  const passwordHash = await hashPassword(password)
  return passwordHash === hash
}