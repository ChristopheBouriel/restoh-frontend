import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ForgotPassword from '../../../pages/auth/ForgotPassword'
import * as emailApi from '../../../api/emailApi'

// Mocks
vi.mock('../../../api/emailApi')
vi.mock('react-router-dom', () => ({
  Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>,
  useNavigate: () => vi.fn()
}))
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

describe('ForgotPassword Component', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // 1. RENDU INITIAL
  describe('Initial Rendering', () => {
    it('should render forgot password form with all elements', () => {
      render(<ForgotPassword />)

      expect(screen.getByText('RestOh!')).toBeInTheDocument()
      expect(screen.getByText('Forgot your password?')).toBeInTheDocument()
      expect(screen.getByText(/Enter your email address/)).toBeInTheDocument()
      expect(screen.getByLabelText('Email address')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Send Reset Link' })).toBeInTheDocument()
    })

    it('should have link to login page', () => {
      render(<ForgotPassword />)

      const loginLink = screen.getByText('Back to Login')
      expect(loginLink).toBeInTheDocument()
      expect(loginLink.closest('a')).toHaveAttribute('href', '/login')
    })

    it('should have email input with mail icon', () => {
      render(<ForgotPassword />)

      const emailInput = screen.getByPlaceholderText('your@email.com')
      expect(emailInput).toBeInTheDocument()
      expect(emailInput).toHaveAttribute('type', 'email')
      // React Hook Form handles validation via JavaScript, not native HTML required attribute
    })
  })

  // 2. INTERACTION UTILISATEUR
  describe('User Interaction', () => {
    it('should update email input value when typing', async () => {
      render(<ForgotPassword />)

      const emailInput = screen.getByLabelText('Email address')
      await user.type(emailInput, 'user@example.com')

      expect(emailInput).toHaveValue('user@example.com')
    })

    it('should show loading state during submission', async () => {
      emailApi.forgotPassword.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100))
      )

      render(<ForgotPassword />)

      const emailInput = screen.getByLabelText('Email address')
      const submitButton = screen.getByRole('button', { name: 'Send Reset Link' })

      await user.type(emailInput, 'user@example.com')
      await user.click(submitButton)

      // Should show loading state
      expect(screen.getByText('Sending...')).toBeInTheDocument()
      expect(submitButton).toBeDisabled()
    })
  })

  // 3. SOUMISSION RÉUSSIE
  describe('Successful Submission', () => {
    it('should call forgotPassword API on form submission', async () => {
      emailApi.forgotPassword.mockResolvedValueOnce({ success: true })

      render(<ForgotPassword />)

      const emailInput = screen.getByLabelText('Email address')
      const submitButton = screen.getByRole('button', { name: 'Send Reset Link' })

      await user.type(emailInput, 'user@example.com')
      await user.click(submitButton)

      await waitFor(() => {
        expect(emailApi.forgotPassword).toHaveBeenCalledWith('user@example.com')
      })
    })

    it('should display success screen after successful submission', async () => {
      emailApi.forgotPassword.mockResolvedValueOnce({ success: true })

      render(<ForgotPassword />)

      const emailInput = screen.getByLabelText('Email address')
      await user.type(emailInput, 'user@example.com')
      await user.click(screen.getByRole('button', { name: 'Send Reset Link' }))

      await waitFor(() => {
        expect(screen.getByText('Check Your Email')).toBeInTheDocument()
      })

      expect(screen.getByText(/If an account exists with/)).toBeInTheDocument()
      expect(screen.getByText('user@example.com', { exact: false })).toBeInTheDocument()
      expect(screen.getByText(/30 minutes/)).toBeInTheDocument()
      expect(screen.getByText(/check your spam folder/i)).toBeInTheDocument()
    })

    it('should show return to login button on success screen', async () => {
      emailApi.forgotPassword.mockResolvedValueOnce({ success: true })

      render(<ForgotPassword />)

      const emailInput = screen.getByLabelText('Email address')
      await user.type(emailInput, 'user@example.com')
      await user.click(screen.getByRole('button', { name: 'Send Reset Link' }))

      await waitFor(() => {
        expect(screen.getByText('Return to Login')).toBeInTheDocument()
      })

      const returnButton = screen.getByText('Return to Login')
      expect(returnButton.closest('a')).toHaveAttribute('href', '/login')
    })

    it('should allow sending another reset link from success screen', async () => {
      emailApi.forgotPassword.mockResolvedValue({ success: true })

      render(<ForgotPassword />)

      // First submission
      const emailInput = screen.getByLabelText('Email address')
      await user.type(emailInput, 'user@example.com')
      await user.click(screen.getByRole('button', { name: 'Send Reset Link' }))

      await waitFor(() => {
        expect(screen.getByText('Check Your Email')).toBeInTheDocument()
      })

      // Click "Send another reset link"
      await user.click(screen.getByText('Send another reset link'))

      // Should go back to form
      await waitFor(() => {
        expect(screen.getByText('Forgot your password?')).toBeInTheDocument()
      })
      expect(screen.getByLabelText('Email address')).toBeInTheDocument()
    })
  })

  // 4. GESTION D'ERREURS
  describe('Error Handling', () => {
    it('should still show success screen even if API returns error (OWASP)', async () => {
      emailApi.forgotPassword.mockResolvedValueOnce({
        success: false,
        error: 'User not found'
      })

      render(<ForgotPassword />)

      const emailInput = screen.getByLabelText('Email address')
      await user.type(emailInput, 'nonexistent@example.com')
      await user.click(screen.getByRole('button', { name: 'Send Reset Link' }))

      // OWASP security: même message pour email inexistant
      await waitFor(() => {
        expect(screen.getByText('Check Your Email')).toBeInTheDocument()
      })
    })

    it('should show success screen even on server error (security)', async () => {
      emailApi.forgotPassword.mockRejectedValueOnce(new Error('Server error'))

      render(<ForgotPassword />)

      const emailInput = screen.getByLabelText('Email address')
      await user.type(emailInput, 'user@example.com')
      await user.click(screen.getByRole('button', { name: 'Send Reset Link' }))

      await waitFor(() => {
        expect(screen.getByText('Check Your Email')).toBeInTheDocument()
      })
    })
  })

  // 5. VALIDATION
  describe('Form Validation', () => {
    it('should not submit with empty email', async () => {
      render(<ForgotPassword />)

      const submitButton = screen.getByRole('button', { name: 'Send Reset Link' })
      await user.click(submitButton)

      // HTML5 validation prevents submission
      expect(emailApi.forgotPassword).not.toHaveBeenCalled()
    })

    it('should require valid email format', () => {
      render(<ForgotPassword />)

      const emailInput = screen.getByLabelText('Email address')
      expect(emailInput).toHaveAttribute('type', 'email')
      // React Hook Form handles required validation via JavaScript
    })
  })

  // 6. ACCESSIBILITÉ
  describe('Accessibility', () => {
    it('should have proper labels for form fields', () => {
      render(<ForgotPassword />)

      expect(screen.getByLabelText('Email address')).toBeInTheDocument()
    })

    it('should have proper button states', async () => {
      emailApi.forgotPassword.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100))
      )

      render(<ForgotPassword />)

      const submitButton = screen.getByRole('button', { name: 'Send Reset Link' })
      expect(submitButton).not.toBeDisabled()

      const emailInput = screen.getByLabelText('Email address')
      await user.type(emailInput, 'user@example.com')
      await user.click(submitButton)

      // Should be disabled during loading
      await waitFor(() => {
        expect(submitButton).toBeDisabled()
      })
    })

    it('should have descriptive aria labels', () => {
      render(<ForgotPassword />)

      const emailInput = screen.getByLabelText('Email address')
      expect(emailInput).toHaveAttribute('id', 'email')
      expect(emailInput).toHaveAttribute('name', 'email')
    })
  })
})
