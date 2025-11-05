import axios from 'axios'
import { toast } from 'react-hot-toast'

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

// Request interceptor - NO LONGER NEEDED with cookie-based auth
// The browser automatically sends cookies with each request when withCredentials: true
apiClient.interceptors.request.use(
  (config) => {
    // Authentication is now handled by HTTP-only cookies
    // No need to manually add Authorization header
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - Handle errors globally
apiClient.interceptors.response.use(
  (response) => {
    // Return data directly to simplify usage
    return response.data
  },
  (error) => {
    // Handle different HTTP error codes
    if (error.response) {
      const { status, data } = error.response

      switch (status) {
        case 400:
          // Bad Request - Validation error
          console.error('Validation error:', data)
          break

        case 401:
          // Unauthorized - Invalid or expired token
          console.error('Authentication error:', data)

          // Clear localStorage and redirect to login
          localStorage.removeItem('auth-storage')

          // Toast only if not already on login page
          if (!window.location.pathname.includes('/login')) {
            toast.error('Session expired. Please log in again.')
            window.location.href = '/login'
          }
          break

        case 403:
          // Forbidden - Insufficient permissions
          console.error('Permission denied:', data)
          toast.error('You do not have the necessary permissions')
          break

        case 404:
          // Not Found
          console.error('Resource not found:', data)
          break

        case 409:
          // Conflict - E.g.: email already used
          console.error('Conflict error:', data)
          break

        case 500:
          // Internal Server Error
          console.error('Server error:', data)
          toast.error('Server error. Please try again later.')
          break

        default:
          console.error('API error:', data)
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
