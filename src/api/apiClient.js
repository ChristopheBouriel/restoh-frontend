import axios from 'axios'
import { toast } from 'react-hot-toast'
import useAuthStore from '../store/authStore'

// API base URL (from environment variables)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds (bcrypt can be slow in development)
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // IMPORTANT: Send cookies with requests
})

// Request interceptor - Add Authorization header with access token
apiClient.interceptors.request.use(
  (config) => {
    // Get access token from auth store (stored in memory, not localStorage)
    const { accessToken } = useAuthStore.getState()

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// ============================================================================
// Token Refresh Logic
// ============================================================================

// Track if a refresh is in progress to avoid multiple simultaneous refresh calls
let isRefreshing = false

// Queue of failed requests waiting for token refresh
let failedQueue = []

/**
 * Process the queue of failed requests after token refresh
 * @param {Error|null} error - Error if refresh failed, null if success
 * @param {string|null} token - New access token if refresh succeeded
 */
const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

/**
 * Handle logout and redirect to login page
 */
const handleAuthFailure = () => {
  useAuthStore.getState().clearAuth()

  // Don't redirect on public auth pages
  const publicAuthPaths = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email']
  const isPublicAuthPage = publicAuthPaths.some(path => window.location.pathname.includes(path))

  if (!isPublicAuthPage) {
    toast.error('Session expired. Please log in again.')
    window.location.href = '/login'
  }
}

// ============================================================================
// Response Interceptor
// ============================================================================

apiClient.interceptors.response.use(
  (response) => {
    // Return data directly to simplify usage
    return response.data
  },
  async (error) => {
    const originalRequest = error.config

    // Handle different HTTP error codes
    if (error.response) {
      const { status, data } = error.response

      // ========================================================================
      // 401 - Handle token expiration with auto-refresh
      // ========================================================================
      if (status === 401) {
        // Check if this is a token expired error (can be refreshed)
        if (data?.code === 'AUTH_TOKEN_EXPIRED' && !originalRequest._retry) {

          // If already refreshing, queue this request
          if (isRefreshing) {
            return new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject })
            }).then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`
              return apiClient(originalRequest)
            }).catch((err) => {
              return Promise.reject(err)
            })
          }

          // Mark as retry to prevent infinite loop
          originalRequest._retry = true
          isRefreshing = true

          try {
            // Call refresh endpoint (refresh token cookie is sent automatically)
            const response = await axios.post(
              `${API_BASE_URL}/auth/refresh`,
              {},
              { withCredentials: true }
            )

            const { accessToken } = response.data

            // Update store with new token
            useAuthStore.getState().setAccessToken(accessToken)

            // Process queued requests with new token
            processQueue(null, accessToken)

            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${accessToken}`
            return apiClient(originalRequest)

          } catch (refreshError) {
            // Refresh failed - process queue with error and logout
            processQueue(refreshError, null)
            handleAuthFailure()
            return Promise.reject(refreshError)

          } finally {
            isRefreshing = false
          }
        }

        // Other 401 errors (no refresh token, invalid refresh token) - logout immediately
        if (['AUTH_NO_REFRESH_TOKEN', 'AUTH_INVALID_REFRESH_TOKEN'].includes(data?.code)) {
          console.error('Auth failed (no valid refresh token):', data)
          handleAuthFailure()
        } else if (!originalRequest._retry) {
          // Generic 401 without specific code - also logout
          console.error('Authentication error:', data)
          handleAuthFailure()
        }
      }

      // ========================================================================
      // Other HTTP errors
      // ========================================================================
      switch (status) {
        case 400:
          // Bad Request - Validation error
          console.error('Validation error:', data)
          break

        case 403:
          // Forbidden - Check if it's email verification issue or permission issue
          if (data?.code === 'AUTH_EMAIL_NOT_VERIFIED') {
            console.error('Email not verified:', data)
            toast.error(
              'Email verification required. Please verify your email to perform this action.',
              { duration: 5000 }
            )
          } else {
            console.error('Permission denied:', data)
            toast.error('You do not have the necessary permissions')
          }
          break

        case 404:
          console.error('Resource not found:', data)
          break

        case 409:
          console.error('Conflict error:', data)
          break

        case 423:
          // Locked - Account temporarily locked (brute force protection)
          console.error('Account locked:', data)
          // Don't show global toast - let the login form handle this
          break

        case 500:
          console.error('Server error:', data)
          toast.error('Server error. Please try again later.')
          break

        default:
          if (status !== 401) { // 401 already handled above
            console.error('API error:', data)
          }
      }

      // Reject with a structured error object
      return Promise.reject({
        success: false,
        error: data?.error || data?.message || 'An error occurred',
        code: data?.code,
        status,
        details: data?.details
      })

    } else if (error.request) {
      // Request was made but no response received
      console.error('Network error:', error.request)
      toast.error('Server connection error')

      return Promise.reject({
        success: false,
        error: 'Unable to contact the server',
        code: 'NETWORK_ERROR'
      })

    } else {
      // Error during request setup
      console.error('Request setup error:', error.message)

      return Promise.reject({
        success: false,
        error: error.message,
        code: 'REQUEST_ERROR'
      })
    }
  }
)

export default apiClient
