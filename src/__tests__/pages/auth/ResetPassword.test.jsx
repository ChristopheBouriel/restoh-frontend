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

  // 1. RENDU INITIAL
  describe('Initial Rendering', () => {
    it('should render reset password form with all elements', () => {
      render(<ResetPassword />)

      expect(screen.getByText('RestOh!')).toBeInTheDocument()
      expect(screen.getByText('Reset Your Password')).toBeInTheDocument()
      expect(screen.getByText('Enter your new password below')).toBeInTheDocument()
      expect(screen.getByLabelText('New Password')).toBeInTheDocument()
      expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Reset Password' })).toBeInTheDocument()
    })

    it('should have link to login page', () => {
      render(<ResetPassword />)

      const loginLink = screen.getByText('← Back to Login')
      expect(loginLink).toBeInTheDocument()
      expect(loginLink.closest('a')).toHaveAttribute('href', '/login')
    })

    it('should have password inputs with lock icons', () => {
      render(<ResetPassword />)

      const passwordInput = screen.getByPlaceholderText(/Enter new password/)
      const confirmInput = screen.getByPlaceholderText('Confirm new password')

      expect(passwordInput).toBeInTheDocument()
      expect(passwordInput).toHaveAttribute('type', 'password')
      expect(passwordInput).toHaveAttribute('required')
      expect(passwordInput).toHaveAttribute('minLength', '6')

      expect(confirmInput).toBeInTheDocument()
      expect(confirmInput).toHaveAttribute('type', 'password')
      expect(confirmInput).toHaveAttribute('required')
    })

    it('should have show/hide password toggles', () => {
      render(<ResetPassword />)

      const toggleButtons = screen.getAllByRole('button', { name: '' })
      expect(toggleButtons.length).toBeGreaterThanOrEqual(2)
    })
  })

  // 2. INTERACTION UTILISATEUR
  describe('User Interaction', () => {
    it('should update password input value when typing', async () => {
      render(<ResetPassword />)

      const passwordInput = screen.getByLabelText('New Password')
      await user.type(passwordInput, 'newPassword123')

      expect(passwordInput).toHaveValue('newPassword123')
    })

    it('should update confirm password input value when typing', async () => {
      render(<ResetPassword />)

      const confirmInput = screen.getByLabelText('Confirm Password')
      await user.type(confirmInput, 'newPassword123')

      expect(confirmInput).toHaveValue('newPassword123')
    })

    it('should toggle password visibility when clicking eye icon', async () => {
      render(<ResetPassword />)

      const passwordInput = screen.getByLabelText('New Password')
      expect(passwordInput).toHaveAttribute('type', 'password')

      // Find the first toggle button (for new password field)
      const toggleButtons = screen.getAllByRole('button', { name: '' })
      await user.click(toggleButtons[0])

      expect(passwordInput).toHaveAttribute('type', 'text')

      // Click again to hide
      await user.click(toggleButtons[0])
      expect(passwordInput).toHaveAttribute('type', 'password')
    })

    it('should toggle confirm password visibility independently', async () => {
      render(<ResetPassword />)

      const confirmInput = screen.getByLabelText('Confirm Password')
      expect(confirmInput).toHaveAttribute('type', 'password')

      // Find the second toggle button (for confirm password field)
      const toggleButtons = screen.getAllByRole('button', { name: '' })
      await user.click(toggleButtons[1])

      expect(confirmInput).toHaveAttribute('type', 'text')
    })

    it('should show loading state during submission', async () => {
      emailApi.resetPassword.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100))
      )

      render(<ResetPassword />)

      const passwordInput = screen.getByLabelText('New Password')
      const confirmInput = screen.getByLabelText('Confirm Password')
      const submitButton = screen.getByRole('button', { name: 'Reset Password' })

      await user.type(passwordInput, 'newPassword123')
      await user.type(confirmInput, 'newPassword123')
      await user.click(submitButton)

      expect(screen.getByText('Resetting...')).toBeInTheDocument()
      expect(submitButton).toBeDisabled()
    })
  })

  // 3. VALIDATION
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

    it('should require both fields to be filled', () => {
      render(<ResetPassword />)

      const passwordInput = screen.getByLabelText('New Password')
      const confirmInput = screen.getByLabelText('Confirm Password')

      expect(passwordInput).toHaveAttribute('required')
      expect(confirmInput).toHaveAttribute('required')
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

  // 6. ACCESSIBILITÉ
  describe('Accessibility', () => {
    it('should have proper labels for form fields', () => {
      render(<ResetPassword />)

      expect(screen.getByLabelText('New Password')).toBeInTheDocument()
      expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument()
    })

    it('should have proper button states', async () => {
      emailApi.resetPassword.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100))
      )

      render(<ResetPassword />)

      const submitButton = screen.getByRole('button', { name: 'Reset Password' })
      expect(submitButton).not.toBeDisabled()

      const passwordInput = screen.getByLabelText('New Password')
      const confirmInput = screen.getByLabelText('Confirm Password')

      await user.type(passwordInput, 'password123')
      await user.type(confirmInput, 'password123')
      await user.click(submitButton)

      // Should be disabled during loading
      await waitFor(() => {
        expect(submitButton).toBeDisabled()
      })
    })

    it('should have descriptive field attributes', () => {
      render(<ResetPassword />)

      const passwordInput = screen.getByLabelText('New Password')
      const confirmInput = screen.getByLabelText('Confirm Password')

      expect(passwordInput).toHaveAttribute('id', 'password')
      expect(passwordInput).toHaveAttribute('name', 'password')
      expect(passwordInput).toHaveAttribute('autoComplete', 'new-password')

      expect(confirmInput).toHaveAttribute('id', 'confirmPassword')
      expect(confirmInput).toHaveAttribute('name', 'confirmPassword')
      expect(confirmInput).toHaveAttribute('autoComplete', 'new-password')
    })
  })
})
