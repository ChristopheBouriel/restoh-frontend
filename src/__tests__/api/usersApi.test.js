import { describe, it, expect, vi, beforeEach } from 'vitest'
import apiClient from '../../api/apiClient'
import {
  getAllUsers,
  updateUser,
  deleteUser,
  getUsersStats
} from '../../api/usersApi'

vi.mock('../../api/apiClient')

describe('Users API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAllUsers', () => {
    it('should fetch all users', async () => {
      apiClient.get.mockResolvedValue({ users: [{ id: '1', email: 'test@example.com' }] })

      const result = await getAllUsers()

      expect(apiClient.get).toHaveBeenCalledWith('/users')
      expect(result.success).toBe(true)
      expect(result.users).toEqual([{ id: '1', email: 'test@example.com' }])
    })

    it('should handle error', async () => {
      apiClient.get.mockRejectedValue({ error: 'Unauthorized' })

      const result = await getAllUsers()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Unauthorized')
    })
  })

  describe('updateUser', () => {
    it('should update user at correct endpoint', async () => {
      const userData = { role: 'admin', isActive: true }
      apiClient.put.mockResolvedValue({ user: { id: '1', ...userData } })

      const result = await updateUser('user-1', userData)

      expect(apiClient.put).toHaveBeenCalledWith('/users/user-1', userData)
      expect(result.success).toBe(true)
    })

    it('should return full error object with code and details', async () => {
      apiClient.put.mockRejectedValue({
        success: false,
        error: 'Cannot change own role',
        code: 'SELF_ROLE_CHANGE',
        details: { userId: 'user-1' }
      })

      const result = await updateUser('user-1', { role: 'user' })

      expect(result.code).toBe('SELF_ROLE_CHANGE')
      expect(result.details).toEqual({ userId: 'user-1' })
    })

    it('should wrap simple errors', async () => {
      apiClient.put.mockRejectedValue({ error: 'User not found' })

      const result = await updateUser('invalid', { role: 'admin' })

      expect(result.success).toBe(false)
      expect(result.error).toBe('User not found')
    })
  })

  describe('deleteUser', () => {
    it('should delete user', async () => {
      apiClient.delete.mockResolvedValue({})

      const result = await deleteUser('user-1')

      expect(apiClient.delete).toHaveBeenCalledWith('/users/user-1')
      expect(result.success).toBe(true)
    })

    it('should return full error object with code and details', async () => {
      apiClient.delete.mockRejectedValue({
        success: false,
        error: 'Cannot delete self',
        code: 'SELF_DELETE',
        details: { userId: 'user-1' }
      })

      const result = await deleteUser('user-1')

      expect(result.code).toBe('SELF_DELETE')
      expect(result.details).toEqual({ userId: 'user-1' })
    })
  })

  describe('getUsersStats', () => {
    it('should fetch users statistics', async () => {
      const stats = { totalUsers: 100, activeUsers: 80, admins: 5 }
      apiClient.get.mockResolvedValue({ data: stats })

      const result = await getUsersStats()

      expect(apiClient.get).toHaveBeenCalledWith('/users/stats')
      expect(result.success).toBe(true)
      expect(result.data).toEqual(stats)
    })

    it('should handle error', async () => {
      apiClient.get.mockRejectedValue({ error: 'Stats unavailable' })

      const result = await getUsersStats()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Stats unavailable')
    })
  })
})
