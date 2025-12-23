import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, test, expect, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import Login from '../../../pages/auth/Login'

// Mock useAuth hook - create a mutable mock that can be updated
const mockLogin = vi.fn()
let mockUseAuth = {
  login: mockLogin,
  isLoading: false,
  error: null
}

vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth
}))

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

// Test wrapper component
const LoginWrapper = ({ initialEntries = ['/login'] }) => (
  <MemoryRouter initialEntries={initialEntries}>
    <Login />
  </MemoryRouter>
)

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mock to default state
    mockUseAuth = {
      login: mockLogin,
      isLoading: false,
      error: null
    }
  })

  describe('Form Submission', () => {
    test('should call login function with correct data when form is submitted', async () => {
      const user = userEvent.setup()
      render(<LoginWrapper />)

      const emailInput = screen.getByLabelText('Email address')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: 'Login' })

      // Fill form
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')

      // Submit form
      await user.click(submitButton)

      expect(mockLogin).toHaveBeenCalledTimes(1)
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        rememberMe: false
      })
    })

    test('should call login function with rememberMe: true when checkbox is checked', async () => {
      const user = userEvent.setup()
      render(<LoginWrapper />)

      const emailInput = screen.getByLabelText('Email address')
      const passwordInput = screen.getByLabelText('Password')
      const rememberMeCheckbox = screen.getByLabelText('Remember me')
      const submitButton = screen.getByRole('button', { name: 'Login' })

      // Fill form and check remember me
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(rememberMeCheckbox)

      // Submit form
      await user.click(submitButton)

      expect(mockLogin).toHaveBeenCalledTimes(1)
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        rememberMe: true
      })
    })

  })

  describe('Account Locked (Brute Force Protection)', () => {
    test('should display locked account message with remaining time', async () => {
      const user = userEvent.setup()

      // Mock login to return account locked error
      mockLogin.mockResolvedValue({
        success: false,
        error: 'Account temporarily locked',
        code: 'AUTH_ACCOUNT_LOCKED',
        details: {
          remainingMinutes: 28,
          suggestion: 'Please try again in 28 minutes.'
        }
      })

      render(<LoginWrapper />)

      const emailInput = screen.getByLabelText('Email address')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: 'Login' })

      await user.type(emailInput, 'locked@example.com')
      await user.type(passwordInput, 'wrongpassword')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Account temporarily locked')).toBeInTheDocument()
        expect(screen.getByText('Please try again in 28 minutes.')).toBeInTheDocument()
      })
    })

    test('should display locked account with custom remaining minutes', async () => {
      const user = userEvent.setup()

      mockLogin.mockResolvedValue({
        success: false,
        error: 'Account temporarily locked',
        code: 'AUTH_ACCOUNT_LOCKED',
        details: {
          remainingMinutes: 5
        }
      })

      render(<LoginWrapper />)

      const emailInput = screen.getByLabelText('Email address')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: 'Login' })

      await user.type(emailInput, 'locked@example.com')
      await user.type(passwordInput, 'wrongpassword')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Account temporarily locked')).toBeInTheDocument()
        // Fallback message with remainingMinutes
        expect(screen.getByText('Please try again in 5 minutes.')).toBeInTheDocument()
      })
    })

    test('should have proper styling for locked account alert', async () => {
      const user = userEvent.setup()

      mockLogin.mockResolvedValue({
        success: false,
        error: 'Account temporarily locked',
        code: 'AUTH_ACCOUNT_LOCKED',
        details: {
          remainingMinutes: 15,
          suggestion: 'Please try again in 15 minutes.'
        }
      })

      render(<LoginWrapper />)

      const emailInput = screen.getByLabelText('Email address')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: 'Login' })

      await user.type(emailInput, 'locked@example.com')
      await user.type(passwordInput, 'wrongpassword')
      await user.click(submitButton)

      await waitFor(() => {
        const alertContainer = screen.getByText('Account temporarily locked').closest('div.rounded-md')
        expect(alertContainer).toHaveClass('bg-amber-50', 'border', 'border-amber-200')
      })
    })

    test('should not show generic error alert for locked account', async () => {
      const user = userEvent.setup()

      mockLogin.mockResolvedValue({
        success: false,
        error: 'Account temporarily locked',
        code: 'AUTH_ACCOUNT_LOCKED',
        details: {
          remainingMinutes: 28,
          suggestion: 'Please try again in 28 minutes.'
        }
      })

      render(<LoginWrapper />)

      const emailInput = screen.getByLabelText('Email address')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: 'Login' })

      await user.type(emailInput, 'locked@example.com')
      await user.type(passwordInput, 'wrongpassword')
      await user.click(submitButton)

      await waitFor(() => {
        // Should show only ONE instance of the error message (in the custom alert)
        const errorMessages = screen.getAllByText('Account temporarily locked')
        expect(errorMessages).toHaveLength(1)
      })
    })
  })
})