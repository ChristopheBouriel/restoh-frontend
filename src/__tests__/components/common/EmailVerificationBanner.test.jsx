import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest'
import EmailVerificationBanner from '../../../components/common/EmailVerificationBanner'
import * as emailApi from '../../../api/emailApi'
import { toast } from 'react-hot-toast'

// Mock dependencies
vi.mock('../../../api/emailApi')
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

describe('EmailVerificationBanner', () => {
  const mockUserUnverified = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    isEmailVerified: false
  }

  const mockUserVerified = {
    id: 'user-456',
    email: 'verified@example.com',
    firstName: 'Jane',
    lastName: 'Smith',
    isEmailVerified: true
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Clear sessionStorage before each test
    sessionStorage.clear()
  })

  afterEach(() => {
    sessionStorage.clear()
  })

  describe('Rendering', () => {
    test('should render banner for unverified user', () => {
      render(<EmailVerificationBanner user={mockUserUnverified} />)

      expect(screen.getByText('Email Verification Required')).toBeInTheDocument()
      expect(screen.getByText(/Your email address has not been verified/)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Resend Verification Email/i })).toBeInTheDocument()
    })

    test('should not render banner for verified user', () => {
      render(<EmailVerificationBanner user={mockUserVerified} />)

      expect(screen.queryByText('Email Verification Required')).not.toBeInTheDocument()
    })

    test('should not render banner when no user provided', () => {
      render(<EmailVerificationBanner user={null} />)

      expect(screen.queryByText('Email Verification Required')).not.toBeInTheDocument()
    })

    test('should not render banner when user is undefined', () => {
      render(<EmailVerificationBanner user={undefined} />)

      expect(screen.queryByText('Email Verification Required')).not.toBeInTheDocument()
    })
  })

  describe('Dismiss Functionality', () => {
    test('should show dismiss button when dismissible is true (default)', () => {
      render(<EmailVerificationBanner user={mockUserUnverified} />)

      expect(screen.getByRole('button', { name: /Dismiss/i })).toBeInTheDocument()
    })

    test('should not show dismiss button when dismissible is false', () => {
      render(<EmailVerificationBanner user={mockUserUnverified} dismissible={false} />)

      expect(screen.queryByRole('button', { name: /Dismiss/i })).not.toBeInTheDocument()
    })

    test('should hide banner when dismiss button is clicked', async () => {
      const user = userEvent.setup()
      render(<EmailVerificationBanner user={mockUserUnverified} />)

      const dismissButton = screen.getByRole('button', { name: /Dismiss/i })
      await user.click(dismissButton)

      expect(screen.queryByText('Email Verification Required')).not.toBeInTheDocument()
    })

    test('should persist dismiss state in sessionStorage', async () => {
      const user = userEvent.setup()
      render(<EmailVerificationBanner user={mockUserUnverified} />)

      const dismissButton = screen.getByRole('button', { name: /Dismiss/i })
      await user.click(dismissButton)

      expect(sessionStorage.getItem('emailVerificationBannerDismissed')).toBe('true')
    })

    test('should not render if previously dismissed in session', () => {
      sessionStorage.setItem('emailVerificationBannerDismissed', 'true')

      render(<EmailVerificationBanner user={mockUserUnverified} />)

      expect(screen.queryByText('Email Verification Required')).not.toBeInTheDocument()
    })
  })

  describe('Resend Verification', () => {
    test('should call resendVerification API when button is clicked', async () => {
      const user = userEvent.setup()
      emailApi.resendVerification.mockResolvedValue({ success: true })

      render(<EmailVerificationBanner user={mockUserUnverified} />)

      const resendButton = screen.getByRole('button', { name: /Resend Verification Email/i })
      await user.click(resendButton)

      expect(emailApi.resendVerification).toHaveBeenCalledWith('test@example.com')
    })

    test('should show loading state while sending', async () => {
      const user = userEvent.setup()
      let resolvePromise
      emailApi.resendVerification.mockImplementation(() => new Promise(resolve => {
        resolvePromise = resolve
      }))

      render(<EmailVerificationBanner user={mockUserUnverified} />)

      const resendButton = screen.getByRole('button', { name: /Resend Verification Email/i })
      await user.click(resendButton)

      expect(screen.getByRole('button', { name: /Sending.../i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Sending.../i })).toBeDisabled()

      // Resolve the promise
      resolvePromise({ success: true })
    })

    test('should show success toast on successful resend', async () => {
      const user = userEvent.setup()
      emailApi.resendVerification.mockResolvedValue({ success: true })

      render(<EmailVerificationBanner user={mockUserUnverified} />)

      const resendButton = screen.getByRole('button', { name: /Resend Verification Email/i })
      await user.click(resendButton)

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Verification email sent! Please check your inbox.')
      })
    })

    test('should show error toast on failed resend', async () => {
      const user = userEvent.setup()
      emailApi.resendVerification.mockResolvedValue({
        success: false,
        error: 'Rate limit exceeded'
      })

      render(<EmailVerificationBanner user={mockUserUnverified} />)

      const resendButton = screen.getByRole('button', { name: /Resend Verification Email/i })
      await user.click(resendButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Rate limit exceeded')
      })
    })

    test('should show generic error toast on exception', async () => {
      const user = userEvent.setup()
      emailApi.resendVerification.mockRejectedValue(new Error('Network error'))

      render(<EmailVerificationBanner user={mockUserUnverified} />)

      const resendButton = screen.getByRole('button', { name: /Resend Verification Email/i })
      await user.click(resendButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to send verification email')
      })
    })

    test('should show error toast if user email is missing', async () => {
      const user = userEvent.setup()
      const userWithoutEmail = { ...mockUserUnverified, email: null }

      render(<EmailVerificationBanner user={userWithoutEmail} />)

      const resendButton = screen.getByRole('button', { name: /Resend Verification Email/i })
      await user.click(resendButton)

      expect(toast.error).toHaveBeenCalledWith('Unable to resend verification email')
      expect(emailApi.resendVerification).not.toHaveBeenCalled()
    })

    test('should re-enable button after resend completes', async () => {
      const user = userEvent.setup()
      emailApi.resendVerification.mockResolvedValue({ success: true })

      render(<EmailVerificationBanner user={mockUserUnverified} />)

      const resendButton = screen.getByRole('button', { name: /Resend Verification Email/i })
      await user.click(resendButton)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Resend Verification Email/i })).not.toBeDisabled()
      })
    })
  })

})
