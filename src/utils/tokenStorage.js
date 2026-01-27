/**
 * Token Storage Utility
 *
 * Handles refresh token storage with Safari ITP (Intelligent Tracking Prevention) fallback.
 *
 * Problem: Safari iOS blocks cross-origin cookies even with sameSite='none',
 * which breaks the HttpOnly cookie-based refresh token flow.
 *
 * Solution: Store refresh token in localStorage as a fallback when cookies are blocked.
 * This is less secure than HttpOnly cookies but is the only option for Safari cross-origin.
 *
 * Security considerations:
 * - localStorage is vulnerable to XSS attacks (unlike HttpOnly cookies)
 * - We only use this fallback when necessary (Safari/iOS cross-origin)
 * - The refresh token is still validated server-side and can be revoked
 */

const REFRESH_TOKEN_KEY = 'rt_fallback'

/**
 * Detect if we're running on Safari or iOS
 * Safari and iOS WebKit have ITP that blocks cross-origin cookies
 */
export const isSafariOrIOS = () => {
  if (typeof navigator === 'undefined') return false

  const ua = navigator.userAgent

  // iOS detection (includes Safari, Chrome on iOS, etc. - all use WebKit)
  const isIOS = /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

  // Safari on macOS detection
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua)

  return isIOS || isSafari
}

/**
 * Check if we need to use localStorage fallback
 * Returns true for Safari/iOS in cross-origin context
 */
export const needsLocalStorageFallback = () => {
  // Always use fallback on Safari/iOS for cross-origin requests
  return isSafariOrIOS()
}

/**
 * Store refresh token (for Safari ITP fallback)
 * @param {string} token - The refresh token to store
 */
export const storeRefreshToken = (token) => {
  if (!token) return

  try {
    localStorage.setItem(REFRESH_TOKEN_KEY, token)
  } catch (e) {
    console.warn('Failed to store refresh token in localStorage:', e)
  }
}

/**
 * Get stored refresh token (for Safari ITP fallback)
 * @returns {string|null} The stored refresh token or null
 */
export const getStoredRefreshToken = () => {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  } catch (e) {
    console.warn('Failed to get refresh token from localStorage:', e)
    return null
  }
}

/**
 * Clear stored refresh token (on logout)
 */
export const clearStoredRefreshToken = () => {
  try {
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  } catch (e) {
    console.warn('Failed to clear refresh token from localStorage:', e)
  }
}

export default {
  isSafariOrIOS,
  needsLocalStorageFallback,
  storeRefreshToken,
  getStoredRefreshToken,
  clearStoredRefreshToken,
}
