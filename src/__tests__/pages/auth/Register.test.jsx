import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Register from '../../../pages/auth/Register'
import useAuthStore from '../../../store/authStore'
import * as emailApi from '../../../api/emailApi'

// Mocks
vi.mock('../../../store/authStore')
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

describe('Register Component', () => {
  const mockRegister = vi.fn()
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuthStore).mockReturnValue({
      register: mockRegister,
      isLoading: false,
      error: null
    })

    // Mock window.scrollTo
    window.scrollTo = vi.fn()
  })

  // 1. VALIDATION DU FORMULAIRE
  describe('Form Validation', () => {
    it('should prevent form submission when required fields are empty', async () => {
      render(<Register />)

      const nameInput = screen.getByLabelText('Full name')
      const emailInput = screen.getByLabelText('Email address')
      const passwordInput = screen.getByLabelText('Password')
      const confirmPasswordInput = screen.getByLabelText('Confirm password')
      const termsCheckbox = screen.getByLabelText(/I accept the/)

      // React Hook Form handles validation via JavaScript, not native HTML required attribute
      // Verify inputs exist
      expect(nameInput).toBeInTheDocument()
      expect(emailInput).toBeInTheDocument()
      expect(passwordInput).toBeInTheDocument()
      expect(confirmPasswordInput).toBeInTheDocument()
      expect(termsCheckbox).toBeInTheDocument()

      const submitButton = screen.getByRole('button', { name: 'Create my account' })
      await user.click(submitButton)

      // React Hook Form prevents submission when fields are invalid
      expect(mockRegister).not.toHaveBeenCalled()
    })

    it('should show validation errors for mismatched passwords', async () => {
      render(<Register />)

      // Fill with all fields but mismatched passwords
      await user.type(screen.getByLabelText('Full name'), 'Jean Dupont')
      await user.type(screen.getByLabelText('Email address'), 'jean@example.com')
      await user.type(screen.getByLabelText('Password'), 'password123')
      await user.type(screen.getByLabelText('Confirm password'), 'differentPassword')

      const termsCheckbox = screen.getByLabelText(/I accept the/)
      await user.click(termsCheckbox)

      const submitButton = screen.getByRole('button', { name: 'Create my account' })
      await user.click(submitButton)

      // Should show validation error for password mismatch
      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
      })

      expect(mockRegister).not.toHaveBeenCalled()
    })

    it('should validate email format correctly', async () => {
      render(<Register />)

      const emailInput = screen.getByLabelText('Email address')
      expect(emailInput).toHaveAttribute('type', 'email')

      await user.type(emailInput, 'valid@email.com')
      expect(emailInput).toHaveValue('valid@email.com')
    })
  })

  // 2. FORM SUBMISSION
  describe('Form Submission', () => {
    it('should call register function on form submission with valid data', async () => {
      mockRegister.mockResolvedValue({ success: true })
      render(<Register />)

      await user.type(screen.getByLabelText('Full name'), 'Jean Dupont')
      await user.type(screen.getByLabelText('Email address'), 'jean@example.com')
      await user.type(screen.getByLabelText('Password'), 'password123')
      await user.type(screen.getByLabelText('Confirm password'), 'password123')

      const termsCheckbox = screen.getByLabelText(/I accept the/)
      await user.click(termsCheckbox)

      const submitButton = screen.getByRole('button', { name: 'Create my account' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith({
          name: 'Jean Dupont',
          email: 'jean@example.com',
          password: 'password123'
        })
      })
    })
  })

  // 4. ÉCRAN DE SUCCÈS (EMAIL VERIFICATION)
  describe('Success Screen - Email Verification', () => {
    it('should display success screen after successful registration', async () => {
      mockRegister.mockResolvedValue({ success: true })
      render(<Register />)

      await user.type(screen.getByLabelText('Full name'), 'Jean Dupont')
      await user.type(screen.getByLabelText('Email address'), 'jean@example.com')
      await user.type(screen.getByLabelText('Password'), 'password123')
      await user.type(screen.getByLabelText('Confirm password'), 'password123')

      const termsCheckbox = screen.getByLabelText(/I accept the/)
      await user.click(termsCheckbox)

      const submitButton = screen.getByRole('button', { name: 'Create my account' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Account Created Successfully!')).toBeInTheDocument()
      })

      expect(screen.getByText(/We've sent a verification email to:/)).toBeInTheDocument()
      expect(screen.getByText('jean@example.com')).toBeInTheDocument()
      expect(screen.getByText(/Please check your inbox and click the verification link/)).toBeInTheDocument()
    })

    it('should show success icon on registration success', async () => {
      mockRegister.mockResolvedValue({ success: true })
      render(<Register />)

      await user.type(screen.getByLabelText('Full name'), 'Jean Dupont')
      await user.type(screen.getByLabelText('Email address'), 'jean@example.com')
      await user.type(screen.getByLabelText('Password'), 'password123')
      await user.type(screen.getByLabelText('Confirm password'), 'password123')
      await user.click(screen.getByLabelText(/I accept the/))
      await user.click(screen.getByRole('button', { name: 'Create my account' }))

      await waitFor(() => {
        expect(screen.getByText('Account Created Successfully!')).toBeInTheDocument()
      })

      // Check for checkmark SVG
      const checkIcon = document.querySelector('svg path[d*="M5 13l4 4L19 7"]')
      expect(checkIcon).toBeInTheDocument()
    })

    it('should display spam folder tip on success screen', async () => {
      mockRegister.mockResolvedValue({ success: true })
      render(<Register />)

      await user.type(screen.getByLabelText('Full name'), 'Jean Dupont')
      await user.type(screen.getByLabelText('Email address'), 'jean@example.com')
      await user.type(screen.getByLabelText('Password'), 'password123')
      await user.type(screen.getByLabelText('Confirm password'), 'password123')
      await user.click(screen.getByLabelText(/I accept the/))
      await user.click(screen.getByRole('button', { name: 'Create my account' }))

      await waitFor(() => {
        expect(screen.getByText(/check your spam folder/i)).toBeInTheDocument()
      })
    })

    it('should have resend verification button on success screen', async () => {
      mockRegister.mockResolvedValue({ success: true })
      render(<Register />)

      await user.type(screen.getByLabelText('Full name'), 'Jean Dupont')
      await user.type(screen.getByLabelText('Email address'), 'jean@example.com')
      await user.type(screen.getByLabelText('Password'), 'password123')
      await user.type(screen.getByLabelText('Confirm password'), 'password123')
      await user.click(screen.getByLabelText(/I accept the/))
      await user.click(screen.getByRole('button', { name: 'Create my account' }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Resend Verification Email' })).toBeInTheDocument()
      })

      expect(screen.getByText(/Didn't receive the email?/)).toBeInTheDocument()
    })

    it('should call resendVerification API when clicking resend button', async () => {
      mockRegister.mockResolvedValue({ success: true })
      emailApi.resendVerification.mockResolvedValue({ success: true })

      render(<Register />)

      await user.type(screen.getByLabelText('Full name'), 'Jean Dupont')
      await user.type(screen.getByLabelText('Email address'), 'jean@example.com')
      await user.type(screen.getByLabelText('Password'), 'password123')
      await user.type(screen.getByLabelText('Confirm password'), 'password123')
      await user.click(screen.getByLabelText(/I accept the/))
      await user.click(screen.getByRole('button', { name: 'Create my account' }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Resend Verification Email' })).toBeInTheDocument()
      })

      const resendButton = screen.getByRole('button', { name: 'Resend Verification Email' })
      await user.click(resendButton)

      await waitFor(() => {
        expect(emailApi.resendVerification).toHaveBeenCalledWith('jean@example.com')
      })
    })

    it('should show loading state when resending verification email', async () => {
      mockRegister.mockResolvedValue({ success: true })
      emailApi.resendVerification.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100))
      )

      render(<Register />)

      await user.type(screen.getByLabelText('Full name'), 'Jean Dupont')
      await user.type(screen.getByLabelText('Email address'), 'jean@example.com')
      await user.type(screen.getByLabelText('Password'), 'password123')
      await user.type(screen.getByLabelText('Confirm password'), 'password123')
      await user.click(screen.getByLabelText(/I accept the/))
      await user.click(screen.getByRole('button', { name: 'Create my account' }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Resend Verification Email' })).toBeInTheDocument()
      })

      const resendButton = screen.getByRole('button', { name: 'Resend Verification Email' })
      await user.click(resendButton)

      // Should show loading state
      expect(screen.getByText('Sending...')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Sending.../ })).toBeDisabled()
    })
  })

  // 5. ÉTATS DE L'APPLICATION
  describe('Application States', () => {
    it('should display loading state during registration', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        register: mockRegister,
        isLoading: true,
        error: null
      })

      render(<Register />)

      expect(screen.getByText('Creating account...')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Creating account.../ })).toBeDisabled()

      const loadingSpinner = document.querySelector('.animate-spin')
      expect(loadingSpinner).toBeInTheDocument()
    })

    it('should display global error message when registration fails', () => {
      const errorMessage = 'Une erreur est survenue lors de la création du compte'
      vi.mocked(useAuthStore).mockReturnValue({
        register: mockRegister,
        isLoading: false,
        error: errorMessage
      })

      render(<Register />)

      expect(screen.getByText(errorMessage)).toBeInTheDocument()

      const errorContainer = screen.getByText(errorMessage).closest('div')
      expect(errorContainer).toHaveClass('text-red-700')
    })

    it('should display inline alert for specific field errors', async () => {
      mockRegister.mockResolvedValue({
        success: false,
        error: 'Email is already in use',
        details: {
          field: 'email',
          message: 'This email address is already registered',
          suggestion: 'Try logging in instead'
        }
      })

      render(<Register />)

      await user.type(screen.getByLabelText('Full name'), 'Jean Dupont')
      await user.type(screen.getByLabelText('Email address'), 'existing@example.com')
      await user.type(screen.getByLabelText('Password'), 'password123')
      await user.type(screen.getByLabelText('Confirm password'), 'password123')
      await user.click(screen.getByLabelText(/I accept the/))
      await user.click(screen.getByRole('button', { name: 'Create my account' }))

      await waitFor(() => {
        expect(screen.getByText('Email is already in use')).toBeInTheDocument()
        expect(screen.getByText(/This email address is already registered/)).toBeInTheDocument()
      })
    })
  })

  // 6. EDGE CASES
  describe('Edge Cases', () => {
    it('should require terms checkbox to be checked', async () => {
      render(<Register />)

      await user.type(screen.getByLabelText('Full name'), 'Jean Dupont')
      await user.type(screen.getByLabelText('Email address'), 'jean@example.com')
      await user.type(screen.getByLabelText('Password'), 'password123')
      await user.type(screen.getByLabelText('Confirm password'), 'password123')

      const submitButton = screen.getByRole('button', { name: 'Create my account' })
      const termsCheckbox = screen.getByLabelText(/I accept the/)

      // React Hook Form handles required validation via JavaScript
      expect(termsCheckbox).toBeInTheDocument()
      expect(termsCheckbox).not.toBeChecked()

      await user.click(submitButton)

      // Should show validation error for terms not accepted
      await waitFor(() => {
        expect(screen.getByText('You must accept the terms')).toBeInTheDocument()
      })

      expect(mockRegister).not.toHaveBeenCalled()
    })

    it('should clear password mismatch error when user fixes it', async () => {
      render(<Register />)

      // Fill form with mismatched passwords
      await user.type(screen.getByLabelText('Full name'), 'Jean Dupont')
      await user.type(screen.getByLabelText('Email address'), 'jean@example.com')
      await user.type(screen.getByLabelText('Password'), 'password123')
      await user.type(screen.getByLabelText('Confirm password'), 'wrongPassword')

      const termsCheckbox = screen.getByLabelText(/I accept the/)
      await user.click(termsCheckbox)
      await user.click(screen.getByRole('button', { name: 'Create my account' }))

      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
      })

      // Fix the password mismatch
      const confirmInput = screen.getByLabelText('Confirm password')
      await user.clear(confirmInput)
      await user.type(confirmInput, 'password123')

      // Error should clear when user types
      await waitFor(() => {
        expect(screen.queryByText('Passwords do not match')).not.toBeInTheDocument()
      })
    })
  })
})
