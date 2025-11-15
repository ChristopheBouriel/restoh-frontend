import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as emailApi from '../../api/emailApi'
import apiClient from '../../api/apiClient'

// Mock apiClient
vi.mock('../../api/apiClient', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn()
  }
}))

describe('Email API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('forgotPassword', () => {
    it('should send forgot password request successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Password reset email sent'
      }
      apiClient.post.mockResolvedValueOnce(mockResponse)

      const result = await emailApi.forgotPassword('user@example.com')

      expect(apiClient.post).toHaveBeenCalledWith('/email/forgot-password', {
        email: 'user@example.com'
      })
      expect(result).toEqual({
        success: true,
        ...mockResponse
      })
    })

    it('should handle forgot password error', async () => {
      const mockError = {
        error: 'Email sending failed',
        code: 'EMAIL_FAILED',
        details: { reason: 'SMTP error' }
      }
      apiClient.post.mockRejectedValueOnce(mockError)

      const result = await emailApi.forgotPassword('user@example.com')

      expect(result).toEqual({
        success: false,
        error: 'Email sending failed',
        code: 'EMAIL_FAILED',
        details: { reason: 'SMTP error' }
      })
    })

    it('should handle generic error without details', async () => {
      apiClient.post.mockRejectedValueOnce({})

      const result = await emailApi.forgotPassword('user@example.com')

      expect(result).toEqual({
        success: false,
        error: 'Failed to send reset email',
        code: undefined,
        details: undefined
      })
    })
  })

  describe('verifyEmail', () => {
    const mockToken = 'abc123token'

    it('should verify email successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Email verified successfully'
      }
      apiClient.get.mockResolvedValueOnce(mockResponse)

      const result = await emailApi.verifyEmail(mockToken)

      expect(apiClient.get).toHaveBeenCalledWith(`/email/verify/${mockToken}`)
      expect(result).toEqual({
        success: true,
        ...mockResponse
      })
    })

    it('should handle verification error - token expired', async () => {
      const mockError = {
        error: 'Verification token has expired',
        code: 'TOKEN_EXPIRED',
        details: { expiredAt: '2025-01-10' }
      }
      apiClient.get.mockRejectedValueOnce(mockError)

      const result = await emailApi.verifyEmail(mockToken)

      expect(result).toEqual({
        success: false,
        error: 'Verification token has expired',
        code: 'TOKEN_EXPIRED',
        details: { expiredAt: '2025-01-10' }
      })
    })

    it('should handle verification error - invalid token', async () => {
      const mockError = {
        error: 'Invalid verification token',
        code: 'INVALID_TOKEN'
      }
      apiClient.get.mockRejectedValueOnce(mockError)

      const result = await emailApi.verifyEmail(mockToken)

      expect(result).toEqual({
        success: false,
        error: 'Invalid verification token',
        code: 'INVALID_TOKEN',
        details: undefined
      })
    })

    it('should handle generic verification error', async () => {
      apiClient.get.mockRejectedValueOnce({})

      const result = await emailApi.verifyEmail(mockToken)

      expect(result).toEqual({
        success: false,
        error: 'Email verification failed',
        code: undefined,
        details: undefined
      })
    })
  })

  describe('resetPassword', () => {
    const mockToken = 'reset123token'
    const newPassword = 'newPassword123'

    it('should reset password successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Password reset successfully'
      }
      apiClient.post.mockResolvedValueOnce(mockResponse)

      const result = await emailApi.resetPassword(mockToken, newPassword)

      expect(apiClient.post).toHaveBeenCalledWith(
        `/email/reset-password/${mockToken}`,
        { password: newPassword }
      )
      expect(result).toEqual({
        success: true,
        ...mockResponse
      })
    })

    it('should handle reset error - token expired', async () => {
      const mockError = {
        error: 'Reset token has expired',
        code: 'TOKEN_EXPIRED',
        details: { validFor: '30 minutes' }
      }
      apiClient.post.mockRejectedValueOnce(mockError)

      const result = await emailApi.resetPassword(mockToken, newPassword)

      expect(result).toEqual({
        success: false,
        error: 'Reset token has expired',
        code: 'TOKEN_EXPIRED',
        details: { validFor: '30 minutes' }
      })
    })

    it('should handle reset error - user not found', async () => {
      const mockError = {
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      }
      apiClient.post.mockRejectedValueOnce(mockError)

      const result = await emailApi.resetPassword(mockToken, newPassword)

      expect(result).toEqual({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND',
        details: undefined
      })
    })

    it('should handle generic reset error', async () => {
      apiClient.post.mockRejectedValueOnce({})

      const result = await emailApi.resetPassword(mockToken, newPassword)

      expect(result).toEqual({
        success: false,
        error: 'Password reset failed',
        code: undefined,
        details: undefined
      })
    })
  })

  describe('resendVerification', () => {
    const email = 'user@example.com'

    it('should resend verification email successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Verification email sent'
      }
      apiClient.post.mockResolvedValueOnce(mockResponse)

      const result = await emailApi.resendVerification(email)

      expect(apiClient.post).toHaveBeenCalledWith('/email/resend-verification', {
        email
      })
      expect(result).toEqual({
        success: true,
        ...mockResponse
      })
    })

    it('should handle resend error - email already verified', async () => {
      const mockError = {
        error: 'Email is already verified',
        code: 'ALREADY_VERIFIED'
      }
      apiClient.post.mockRejectedValueOnce(mockError)

      const result = await emailApi.resendVerification(email)

      expect(result).toEqual({
        success: false,
        error: 'Email is already verified',
        code: 'ALREADY_VERIFIED',
        details: undefined
      })
    })

    it('should handle resend error - rate limit', async () => {
      const mockError = {
        error: 'Too many requests',
        code: 'RATE_LIMIT',
        details: { retryAfter: 60 }
      }
      apiClient.post.mockRejectedValueOnce(mockError)

      const result = await emailApi.resendVerification(email)

      expect(result).toEqual({
        success: false,
        error: 'Too many requests',
        code: 'RATE_LIMIT',
        details: { retryAfter: 60 }
      })
    })

    it('should handle generic resend error', async () => {
      apiClient.post.mockRejectedValueOnce({})

      const result = await emailApi.resendVerification(email)

      expect(result).toEqual({
        success: false,
        error: 'Failed to resend verification email',
        code: undefined,
        details: undefined
      })
    })
  })
})
