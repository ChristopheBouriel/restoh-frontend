import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ResetPassword from '../../../pages/auth/ResetPassword'
import * as emailApi from '../../../api/emailApi'

// Mocks
vi.mock('../../../api/emailApi')

const mockNavigate = vi.fn()
const mockUseParams = vi.fn()

vi.mock('react-router-dom', () => ({
  Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>,
  useNavigate: () => mockNavigate,
  useParams: () => mockUseParams()
}))

vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

describe('ResetPassword Component', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseParams.mockReturnValue({ token: 'valid-reset-token' })
  })

  // 1. VALIDATION
  describe('Form Validation', () => {
    it('should show error if password is less than 6 characters', async () => {
      render(<ResetPassword />)

      const passwordInput = screen.getByLabelText('New Password')
      const confirmInput = screen.getByLabelText('Confirm Password')
      const submitButton = screen.getByRole('button', { name: 'Reset Password' })

      await user.type(passwordInput, 'short')
      await user.type(confirmInput, 'short')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument()
      })

      expect(emailApi.resetPassword).not.toHaveBeenCalled()
    })

    it('should show error if passwords do not match', async () => {
      render(<ResetPassword />)

      const passwordInput = screen.getByLabelText('New Password')
      const confirmInput = screen.getByLabelText('Confirm Password')
      const submitButton = screen.getByRole('button', { name: 'Reset Password' })

      await user.type(passwordInput, 'password123')
      await user.type(confirmInput, 'differentPassword')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
      })

      expect(emailApi.resetPassword).not.toHaveBeenCalled()
    })

    it('should require both fields to be filled', async () => {
      render(<ResetPassword />)

      const passwordInput = screen.getByLabelText('New Password')
      const confirmInput = screen.getByLabelText('Confirm Password')
      const submitButton = screen.getByRole('button', { name: 'Reset Password' })

      // React Hook Form handles validation via JS, not native HTML attributes
      expect(passwordInput).toBeInTheDocument()
      expect(confirmInput).toBeInTheDocument()

      // Try to submit empty form - should show validation errors
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Password is required')).toBeInTheDocument()
      })

      expect(emailApi.resetPassword).not.toHaveBeenCalled()
    })
  })

  // 4. SOUMISSION RÉUSSIE
  describe('Successful Submission', () => {
    it('should call resetPassword API with token and new password', async () => {
      const token = 'valid-reset-token'
      mockUseParams.mockReturnValue({ token })
      emailApi.resetPassword.mockResolvedValueOnce({ success: true })

      render(<ResetPassword />)

      const passwordInput = screen.getByLabelText('New Password')
      const confirmInput = screen.getByLabelText('Confirm Password')
      const submitButton = screen.getByRole('button', { name: 'Reset Password' })

      await user.type(passwordInput, 'newPassword123')
      await user.type(confirmInput, 'newPassword123')
      await user.click(submitButton)

      await waitFor(() => {
        expect(emailApi.resetPassword).toHaveBeenCalledWith(token, 'newPassword123')
      })
    })

    it('should display success screen after successful reset', async () => {
      emailApi.resetPassword.mockResolvedValueOnce({ success: true })

      render(<ResetPassword />)

      const passwordInput = screen.getByLabelText('New Password')
      const confirmInput = screen.getByLabelText('Confirm Password')

      await user.type(passwordInput, 'newPassword123')
      await user.type(confirmInput, 'newPassword123')
      await user.click(screen.getByRole('button', { name: 'Reset Password' }))

      await waitFor(() => {
        expect(screen.getByText('Password Reset Successfully!')).toBeInTheDocument()
      })

      expect(screen.getByText('You can now log in with your new password.')).toBeInTheDocument()
      expect(screen.getByText('Redirecting to login page...')).toBeInTheDocument()
    })

    it('should show success icon on successful reset', async () => {
      emailApi.resetPassword.mockResolvedValueOnce({ success: true })

      render(<ResetPassword />)

      const passwordInput = screen.getByLabelText('New Password')
      const confirmInput = screen.getByLabelText('Confirm Password')

      await user.type(passwordInput, 'newPassword123')
      await user.type(confirmInput, 'newPassword123')
      await user.click(screen.getByRole('button', { name: 'Reset Password' }))

      await waitFor(() => {
        expect(screen.getByText('Password Reset Successfully!')).toBeInTheDocument()
      })

      // Check for checkmark SVG
      const checkIcon = document.querySelector('svg path[d*="M5 13l4 4L19 7"]')
      expect(checkIcon).toBeInTheDocument()
    })

    it('should redirect to login after 2 seconds on success', async () => {
      emailApi.resetPassword.mockResolvedValueOnce({ success: true })

      render(<ResetPassword />)

      const passwordInput = screen.getByLabelText('New Password')
      const confirmInput = screen.getByLabelText('Confirm Password')

      await user.type(passwordInput, 'newPassword123')
      await user.type(confirmInput, 'newPassword123')
      await user.click(screen.getByRole('button', { name: 'Reset Password' }))

      await waitFor(() => {
        expect(screen.getByText('Password Reset Successfully!')).toBeInTheDocument()
      })

      // Wait for navigation (real 2 second timeout)
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login')
      }, { timeout: 3000 })
    })

    it('should have manual link to login on success screen', async () => {
      emailApi.resetPassword.mockResolvedValueOnce({ success: true })

      render(<ResetPassword />)

      const passwordInput = screen.getByLabelText('New Password')
      const confirmInput = screen.getByLabelText('Confirm Password')

      await user.type(passwordInput, 'newPassword123')
      await user.type(confirmInput, 'newPassword123')
      await user.click(screen.getByRole('button', { name: 'Reset Password' }))

      await waitFor(() => {
        expect(screen.getByText('Go to Login Now')).toBeInTheDocument()
      })

      const loginLink = screen.getByText('Go to Login Now')
      expect(loginLink.closest('a')).toHaveAttribute('href', '/login')
    })
  })

  // 5. GESTION D'ERREURS
  describe('Error Handling', () => {
    it('should display error message from API', async () => {
      emailApi.resetPassword.mockResolvedValueOnce({
        success: false,
        error: 'Invalid or expired reset token'
      })

      render(<ResetPassword />)

      const passwordInput = screen.getByLabelText('New Password')
      const confirmInput = screen.getByLabelText('Confirm Password')

      await user.type(passwordInput, 'newPassword123')
      await user.type(confirmInput, 'newPassword123')
      await user.click(screen.getByRole('button', { name: 'Reset Password' }))

      await waitFor(() => {
        expect(screen.getByText('Invalid or expired reset token')).toBeInTheDocument()
      })
    })

    it('should show expired token warning with helpful message', async () => {
      emailApi.resetPassword.mockResolvedValueOnce({
        success: false,
        error: 'Reset token has expired'
      })

      render(<ResetPassword />)

      const passwordInput = screen.getByLabelText('New Password')
      const confirmInput = screen.getByLabelText('Confirm Password')

      await user.type(passwordInput, 'newPassword123')
      await user.type(confirmInput, 'newPassword123')
      await user.click(screen.getByRole('button', { name: 'Reset Password' }))

      await waitFor(() => {
        expect(screen.getByText('This reset link has expired')).toBeInTheDocument()
      })

      expect(screen.getByText(/Reset links are valid for 30 minutes/)).toBeInTheDocument()
      expect(screen.getByText('Request a new reset link')).toBeInTheDocument()
    })

    it('should have link to forgot password page on expired token', async () => {
      emailApi.resetPassword.mockResolvedValueOnce({
        success: false,
        error: 'Reset token has expired'
      })

      render(<ResetPassword />)

      const passwordInput = screen.getByLabelText('New Password')
      const confirmInput = screen.getByLabelText('Confirm Password')

      await user.type(passwordInput, 'newPassword123')
      await user.type(confirmInput, 'newPassword123')
      await user.click(screen.getByRole('button', { name: 'Reset Password' }))

      await waitFor(() => {
        const forgotPasswordLink = screen.getByText('Request a new reset link')
        expect(forgotPasswordLink.closest('a')).toHaveAttribute('href', '/forgot-password')
      })
    })

    it('should handle server error gracefully', async () => {
      emailApi.resetPassword.mockRejectedValueOnce(new Error('Server error'))

      render(<ResetPassword />)

      const passwordInput = screen.getByLabelText('New Password')
      const confirmInput = screen.getByLabelText('Confirm Password')

      await user.type(passwordInput, 'newPassword123')
      await user.type(confirmInput, 'newPassword123')
      await user.click(screen.getByRole('button', { name: 'Reset Password' }))

      await waitFor(() => {
        expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument()
      })
    })

    it('should not redirect on error', async () => {
      // Wait for any previous timers to complete (from previous test's 2s redirect)
      await new Promise(resolve => setTimeout(resolve, 2500))

      // Clear the mock from previous tests
      mockNavigate.mockClear()

      emailApi.resetPassword.mockResolvedValueOnce({
        success: false,
        error: 'Invalid token'
      })

      render(<ResetPassword />)

      const passwordInput = screen.getByLabelText('New Password')
      const confirmInput = screen.getByLabelText('Confirm Password')

      await user.type(passwordInput, 'newPassword123')
      await user.type(confirmInput, 'newPassword123')
      await user.click(screen.getByRole('button', { name: 'Reset Password' }))

      await waitFor(() => {
        expect(screen.getByText('Invalid token')).toBeInTheDocument()
      })

      // Wait a bit to ensure no navigation happens
      await new Promise(resolve => setTimeout(resolve, 500))

      // Should not have been called after error
      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('should clear error when resubmitting', async () => {
      emailApi.resetPassword
        .mockResolvedValueOnce({
          success: false,
          error: 'Invalid token'
        })
        .mockResolvedValueOnce({ success: true })

      render(<ResetPassword />)

      const passwordInput = screen.getByLabelText('New Password')
      const confirmInput = screen.getByLabelText('Confirm Password')
      const submitButton = screen.getByRole('button', { name: 'Reset Password' })

      // First submission - error
      await user.type(passwordInput, 'password123')
      await user.type(confirmInput, 'password123')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Invalid token')).toBeInTheDocument()
      })

      // Clear and retry
      await user.clear(passwordInput)
      await user.clear(confirmInput)
      await user.type(passwordInput, 'newPassword456')
      await user.type(confirmInput, 'newPassword456')
      await user.click(submitButton)

      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText('Invalid token')).not.toBeInTheDocument()
      })
    })
  })

})
