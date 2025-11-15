import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import VerifyEmail from '../../../pages/auth/VerifyEmail'
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

describe('VerifyEmail Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.clearAllTimers()
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  // 1. ÉTAT DE CHARGEMENT
  describe('Loading State', () => {
    it('should show loading state initially', () => {
      mockUseParams.mockReturnValue({ token: 'valid-token-123' })
      emailApi.verifyEmail.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      render(<VerifyEmail />)

      expect(screen.getByText('Verifying your email...')).toBeInTheDocument()
      expect(screen.getByText(/Please wait while we verify/)).toBeInTheDocument()
    })

    it('should show loading spinner', () => {
      mockUseParams.mockReturnValue({ token: 'valid-token-123' })
      emailApi.verifyEmail.mockImplementation(
        () => new Promise(() => {})
      )

      render(<VerifyEmail />)

      const spinners = document.querySelectorAll('.animate-spin')
      expect(spinners.length).toBeGreaterThan(0)
    })
  })

  // 2. VÉRIFICATION RÉUSSIE
  describe('Successful Verification', () => {
    it('should call verifyEmail API with token from URL', async () => {
      const token = 'valid-token-123'
      mockUseParams.mockReturnValue({ token })
      emailApi.verifyEmail.mockResolvedValueOnce({
        success: true,
        message: 'Email verified successfully!'
      })

      render(<VerifyEmail />)

      await waitFor(() => {
        expect(emailApi.verifyEmail).toHaveBeenCalledWith(token)
      })
    })

    it('should display success message after verification', async () => {
      mockUseParams.mockReturnValue({ token: 'valid-token-123' })
      emailApi.verifyEmail.mockResolvedValueOnce({
        success: true,
        message: 'Email verified successfully!'
      })

      render(<VerifyEmail />)

      await waitFor(() => {
        expect(screen.getByText('Email Verified!')).toBeInTheDocument()
      })

      expect(screen.getByText('Email verified successfully!')).toBeInTheDocument()
      expect(screen.getByText('Redirecting to login page...')).toBeInTheDocument()
    })

    it('should show success icon on verification success', async () => {
      mockUseParams.mockReturnValue({ token: 'valid-token-123' })
      emailApi.verifyEmail.mockResolvedValueOnce({ success: true })

      render(<VerifyEmail />)

      await waitFor(() => {
        expect(screen.getByText('Email Verified!')).toBeInTheDocument()
      })

      // Check for checkmark SVG
      const checkIcon = document.querySelector('svg path[d*="M5 13l4 4L19 7"]')
      expect(checkIcon).toBeInTheDocument()
    })

    it('should redirect to login after 3 seconds on success', async () => {
      mockUseParams.mockReturnValue({ token: 'valid-token-123' })
      emailApi.verifyEmail.mockResolvedValueOnce({ success: true })

      render(<VerifyEmail />)

      await waitFor(() => {
        expect(screen.getByText('Email Verified!')).toBeInTheDocument()
      })

      // Wait for navigation (real 3 second timeout)
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login')
      }, { timeout: 4000 })
    })

    it('should have manual link to login on success', async () => {
      mockUseParams.mockReturnValue({ token: 'valid-token-123' })
      emailApi.verifyEmail.mockResolvedValueOnce({ success: true })

      render(<VerifyEmail />)

      await waitFor(() => {
        expect(screen.getByText('Go to Login Now')).toBeInTheDocument()
      })

      const loginLink = screen.getByText('Go to Login Now')
      expect(loginLink.closest('a')).toHaveAttribute('href', '/login')
    })
  })

  // 3. GESTION D'ERREURS
  describe('Error Handling', () => {
    it('should handle invalid token error', async () => {
      mockUseParams.mockReturnValue({ token: 'invalid-token' })
      emailApi.verifyEmail.mockResolvedValueOnce({
        success: false,
        error: 'Invalid verification link',
        code: 'INVALID_TOKEN'
      })

      render(<VerifyEmail />)

      await waitFor(() => {
        expect(screen.getByText('Verification Failed')).toBeInTheDocument()
      })

      expect(screen.getByText('Invalid verification link')).toBeInTheDocument()
    })

    it('should handle expired token error', async () => {
      mockUseParams.mockReturnValue({ token: 'expired-token' })
      emailApi.verifyEmail.mockResolvedValueOnce({
        success: false,
        error: 'Verification link has expired',
        code: 'TOKEN_EXPIRED',
        details: { message: 'This link expired 24 hours ago' }
      })

      render(<VerifyEmail />)

      await waitFor(() => {
        expect(screen.getByText('Verification Failed')).toBeInTheDocument()
      })

      expect(screen.getByText('Verification link has expired')).toBeInTheDocument()
    })

    it('should show expired token specific message', async () => {
      mockUseParams.mockReturnValue({ token: 'expired-token' })
      emailApi.verifyEmail.mockResolvedValueOnce({
        success: false,
        error: 'Verification link has expired'
      })

      render(<VerifyEmail />)

      await waitFor(() => {
        expect(screen.getByText('Verification Failed')).toBeInTheDocument()
      })

      // Check for the detailed expired message in yellow box
      expect(screen.getByText(/request a new one from your profile/i)).toBeInTheDocument()
    })

    it('should not auto-redirect on error', async () => {
      mockUseParams.mockReturnValue({ token: 'invalid-token' })
      emailApi.verifyEmail.mockResolvedValueOnce({
        success: false,
        error: 'Invalid token'
      })

      render(<VerifyEmail />)

      await waitFor(() => {
        expect(screen.getByText('Verification Failed')).toBeInTheDocument()
      })

      // Wait a bit to ensure no navigation happens
      await new Promise(resolve => setTimeout(resolve, 500))

      // Should NOT navigate
      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('should show action buttons on error', async () => {
      mockUseParams.mockReturnValue({ token: 'invalid-token' })
      emailApi.verifyEmail.mockResolvedValueOnce({
        success: false,
        error: 'Invalid token'
      })

      render(<VerifyEmail />)

      await waitFor(() => {
        expect(screen.getByText('Go to Profile')).toBeInTheDocument()
      })

      expect(screen.getByText('Back to Login')).toBeInTheDocument()

      // Check links
      const profileLink = screen.getByText('Go to Profile')
      const loginLink = screen.getByText('Back to Login')

      expect(profileLink.closest('a')).toHaveAttribute('href', '/profile')
      expect(loginLink).toBeInTheDocument()
    })

    it('should handle missing token', () => {
      mockUseParams.mockReturnValue({ token: null })

      render(<VerifyEmail />)

      expect(screen.getByText('Verification Failed')).toBeInTheDocument()
      expect(screen.getByText('Invalid verification link')).toBeInTheDocument()
    })

    it('should handle server error gracefully', async () => {
      mockUseParams.mockReturnValue({ token: 'valid-token' })
      emailApi.verifyEmail.mockRejectedValueOnce(new Error('Server error'))

      render(<VerifyEmail />)

      await waitFor(() => {
        expect(screen.getByText('Verification Failed')).toBeInTheDocument()
      })

      expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument()
    })
  })

  // 4. PROTECTION CONTRE DOUBLE-CALL (React StrictMode)
  describe('Double Call Protection', () => {
    it('should only call verifyEmail once on mount', async () => {
      mockUseParams.mockReturnValue({ token: 'valid-token' })
      emailApi.verifyEmail.mockResolvedValue({ success: true })

      render(<VerifyEmail />)

      // Wait for the call
      await waitFor(() => {
        expect(emailApi.verifyEmail).toHaveBeenCalledTimes(1)
      })

      // Wait a bit more to ensure no additional calls
      await new Promise(resolve => setTimeout(resolve, 100))

      // Should still be called only once (protected by useRef)
      expect(emailApi.verifyEmail).toHaveBeenCalledTimes(1)
    })
  })

  // 5. ACCESSIBILITÉ
  describe('Accessibility', () => {
    it('should have proper error state with icon', async () => {
      mockUseParams.mockReturnValue({ token: 'invalid' })
      emailApi.verifyEmail.mockResolvedValueOnce({
        success: false,
        error: 'Invalid'
      })

      render(<VerifyEmail />)

      await waitFor(() => {
        expect(screen.getByText('Verification Failed')).toBeInTheDocument()
      })

      // Check for error icon (X icon)
      const errorIcon = document.querySelector('svg path[d*="M6 18L18 6M6 6l12 12"]')
      expect(errorIcon).toBeInTheDocument()
    })

    it('should have link to return home from any state', async () => {
      mockUseParams.mockReturnValue({ token: 'any-token' })
      emailApi.verifyEmail.mockResolvedValueOnce({ success: true })

      render(<VerifyEmail />)

      await waitFor(() => {
        const homeLink = screen.getByText('← Return to home')
        expect(homeLink).toBeInTheDocument()
        expect(homeLink.closest('a')).toHaveAttribute('href', '/')
      })
    })
  })

  // 6. UX MESSAGES
  describe('UX Messages', () => {
    it('should display custom success message from backend', async () => {
      const customMessage = 'Your email has been successfully verified!'
      mockUseParams.mockReturnValue({ token: 'valid-token' })
      emailApi.verifyEmail.mockResolvedValueOnce({
        success: true,
        message: customMessage
      })

      render(<VerifyEmail />)

      await waitFor(() => {
        expect(screen.getByText(customMessage)).toBeInTheDocument()
      })
    })

    it('should use default message if backend does not provide one', async () => {
      mockUseParams.mockReturnValue({ token: 'valid-token' })
      emailApi.verifyEmail.mockResolvedValueOnce({
        success: true
        // No message
      })

      render(<VerifyEmail />)

      await waitFor(() => {
        expect(screen.getByText('Email verified successfully!')).toBeInTheDocument()
      })
    })

    it('should display error details if provided', async () => {
      mockUseParams.mockReturnValue({ token: 'expired' })
      emailApi.verifyEmail.mockResolvedValueOnce({
        success: false,
        error: 'Token expired',
        details: { message: 'Expired 2 days ago' }
      })

      render(<VerifyEmail />)

      await waitFor(() => {
        expect(screen.getByText('Expired 2 days ago')).toBeInTheDocument()
      })
    })
  })
})
