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

          // Don't redirect on public auth pages (login, register, reset-password, etc.)
          const publicAuthPaths = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email']
          const isPublicAuthPage = publicAuthPaths.some(path => window.location.pathname.includes(path))

          if (!isPublicAuthPage) {
            toast.error('Session expired. Please log in again.')
            window.location.href = '/login'
          }
          break

        case 403:
          // Forbidden - Check if it's email verification issue or permission issue
          if (data?.code === 'AUTH_EMAIL_NOT_VERIFIED') {
            console.error('Email not verified:', data)
            // Show specific toast with action suggestion
            toast.error(
              'Email verification required. Please verify your email to perform this action.',
              { duration: 5000 }
            )
          } else {
            // Generic permission denied
            console.error('Permission denied:', data)
            toast.error('You do not have the necessary permissions')
          }
          break

        case 404:
          // Not Found
          console.error('Resource not found:', data)
          break

        case 409:
          // Conflict - E.g.: email already used
          console.error('Conflict error:', data)
          break

        case 423:
          // Locked - Account temporarily locked (brute force protection)
          console.error('Account locked:', data)
          // Don't show global toast - let the login form handle this with InlineAlert
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
