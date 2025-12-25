import { describe, it, expect, vi, beforeEach } from 'vitest'
import apiClient from '../../api/apiClient'
import {
  register,
  login,
  logout,
  refreshToken,
  getCurrentUser,
  updateProfile,
  changePassword,
  deleteAccount
} from '../../api/authApi'

vi.mock('../../api/apiClient')

describe('Auth API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('register', () => {
    it('should call correct endpoint with user data', async () => {
      const userData = { email: 'test@example.com', password: 'password123', name: 'John' }
      apiClient.post.mockResolvedValue({ user: { id: '1', email: 'test@example.com' } })

      const result = await register(userData)

      expect(apiClient.post).toHaveBeenCalledWith('/auth/register', userData)
      expect(result.success).toBe(true)
      expect(result.user).toEqual({ id: '1', email: 'test@example.com' })
    })

    it('should return code and details on validation error', async () => {
      apiClient.post.mockRejectedValue({
        error: 'Email already exists',
        code: 'EMAIL_EXISTS',
        details: { field: 'email' }
      })

      const result = await register({ email: 'taken@example.com', password: 'pass' })

      expect(result.success).toBe(false)
      expect(result.code).toBe('EMAIL_EXISTS')
      expect(result.details).toEqual({ field: 'email' })
    })
  })

  describe('login', () => {
    it('should call correct endpoint with credentials', async () => {
      const credentials = { email: 'test@example.com', password: 'password123' }
      apiClient.post.mockResolvedValue({ user: { id: '1' }, accessToken: 'token123' })

      const result = await login(credentials)

      expect(apiClient.post).toHaveBeenCalledWith('/auth/login', credentials)
      expect(result.success).toBe(true)
      expect(result.accessToken).toBe('token123')
    })

    it('should return code and details on error', async () => {
      apiClient.post.mockRejectedValue({
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS',
        details: { attempts: 3 }
      })

      const result = await login({ email: 'wrong@example.com', password: 'wrong' })

      expect(result.success).toBe(false)
      expect(result.code).toBe('INVALID_CREDENTIALS')
      expect(result.details).toEqual({ attempts: 3 })
    })
  })

  describe('logout', () => {
    it('should call logout endpoint', async () => {
      apiClient.post.mockResolvedValue({})

      const result = await logout()

      expect(apiClient.post).toHaveBeenCalledWith('/auth/logout')
      expect(result.success).toBe(true)
    })

    it('should return success even on error (client-side logout)', async () => {
      apiClient.post.mockRejectedValue(new Error('Server error'))

      const result = await logout()

      expect(result.success).toBe(true)
    })
  })

  describe('refreshToken', () => {
    it('should call refresh endpoint', async () => {
      apiClient.post.mockResolvedValue({ accessToken: 'new-token' })

      const result = await refreshToken()

      expect(apiClient.post).toHaveBeenCalledWith('/auth/refresh')
      expect(result.success).toBe(true)
      expect(result.accessToken).toBe('new-token')
    })

    it('should return error code on failure', async () => {
      apiClient.post.mockRejectedValue({
        error: 'Token expired',
        code: 'REFRESH_TOKEN_EXPIRED'
      })

      const result = await refreshToken()

      expect(result.success).toBe(false)
      expect(result.code).toBe('REFRESH_TOKEN_EXPIRED')
    })
  })

  describe('getCurrentUser', () => {
    it('should fetch current user profile', async () => {
      apiClient.get.mockResolvedValue({ user: { id: '1', name: 'John' } })

      const result = await getCurrentUser()

      expect(apiClient.get).toHaveBeenCalledWith('/auth/me')
      expect(result.success).toBe(true)
      expect(result.user).toEqual({ id: '1', name: 'John' })
    })

    it('should handle error', async () => {
      apiClient.get.mockRejectedValue({ error: 'Not authenticated' })

      const result = await getCurrentUser()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Not authenticated')
    })
  })

  describe('updateProfile', () => {
    it('should call update endpoint with profile data', async () => {
      const profileData = { name: 'New Name', phone: '0612345678' }
      apiClient.put.mockResolvedValue({ user: { id: '1', ...profileData } })

      const result = await updateProfile(profileData)

      expect(apiClient.put).toHaveBeenCalledWith('/auth/profile', profileData)
      expect(result.success).toBe(true)
    })

    it('should handle error', async () => {
      apiClient.put.mockRejectedValue({ error: 'Validation failed' })

      const result = await updateProfile({ name: '' })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Validation failed')
    })
  })

  describe('changePassword', () => {
    it('should call endpoint with current and new password', async () => {
      apiClient.put.mockResolvedValue({ message: 'Password changed' })

      const result = await changePassword('oldPass', 'newPass')

      expect(apiClient.put).toHaveBeenCalledWith('/auth/change-password', {
        currentPassword: 'oldPass',
        newPassword: 'newPass'
      })
      expect(result.success).toBe(true)
    })

    it('should handle wrong current password error', async () => {
      apiClient.put.mockRejectedValue({ error: 'Current password is incorrect' })

      const result = await changePassword('wrongPass', 'newPass')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Current password is incorrect')
    })
  })

  describe('deleteAccount', () => {
    it('should call delete endpoint with password', async () => {
      apiClient.delete.mockResolvedValue({ message: 'Account deleted' })

      const result = await deleteAccount('myPassword')

      expect(apiClient.delete).toHaveBeenCalledWith('/auth/delete-account', {
        data: { password: 'myPassword' }
      })
      expect(result.success).toBe(true)
    })

    it('should pass confirmCancelReservations option', async () => {
      apiClient.delete.mockResolvedValue({ message: 'Account deleted' })

      await deleteAccount('myPassword', { confirmCancelReservations: true })

      expect(apiClient.delete).toHaveBeenCalledWith('/auth/delete-account', {
        data: { password: 'myPassword', confirmCancelReservations: true }
      })
    })

    it('should return reservations list on ACTIVE_RESERVATIONS error', async () => {
      const reservations = [{ id: 'res-1', date: '2024-12-20' }]
      apiClient.delete.mockRejectedValue({
        error: 'Active reservations',
        code: 'ACTIVE_RESERVATIONS',
        reservations
      })

      const result = await deleteAccount('myPassword')

      expect(result.success).toBe(false)
      expect(result.code).toBe('ACTIVE_RESERVATIONS')
      expect(result.reservations).toEqual(reservations)
    })

    it('should handle reservations in data.reservations', async () => {
      const reservations = [{ id: 'res-1' }]
      apiClient.delete.mockRejectedValue({
        code: 'ACTIVE_RESERVATIONS',
        data: { reservations }
      })

      const result = await deleteAccount('myPassword')

      expect(result.reservations).toEqual(reservations)
    })
  })
})
