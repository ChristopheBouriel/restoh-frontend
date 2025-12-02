import { vi, describe, test, expect, beforeEach } from 'vitest'
import { act } from '@testing-library/react'
import useUsersStore from '../../store/usersStore'
import * as usersApi from '../../api/usersApi'

// Mock the API
vi.mock('../../api/usersApi')

// Mock data
const mockUsers = [
  {
    id: 'admin-001',
    email: 'admin@restoh.fr',
    name: 'Administrator',
    role: 'admin',
    phone: '01 23 45 67 89',
    isActive: true,
    isEmailVerified: true,
    createdAt: '2024-01-01T10:00:00Z',
    lastLoginAt: '2024-01-20T10:00:00Z'
  },
  {
    id: 'user-001',
    email: 'jean@example.com',
    name: 'Jean Dupont',
    role: 'user',
    phone: '06 12 34 56 78',
    isActive: true,
    isEmailVerified: true,
    createdAt: '2024-01-10T10:00:00Z',
    lastLoginAt: '2024-01-19T10:00:00Z'
  },
  {
    id: 'user-002',
    email: 'marie@example.com',
    name: 'Marie Martin',
    role: 'user',
    phone: '07 98 76 54 32',
    isActive: false,
    isEmailVerified: false,
    createdAt: '2024-01-15T10:00:00Z',
    lastLoginAt: null
  },
  {
    id: 'user-003',
    email: 'pierre@example.com',
    name: 'Pierre Bernard',
    role: 'user',
    phone: '06 55 66 77 88',
    isActive: true,
    isEmailVerified: false,
    createdAt: '2024-01-18T10:00:00Z',
    lastLoginAt: '2024-01-20T08:00:00Z'
  }
]

const mockStats = {
  total: 4,
  active: 3,
  inactive: 1,
  admins: 1,
  regularUsers: 3,
  verified: 2,
  unverified: 2,
  newThisMonth: 3,
  activeThisMonth: 3,
  totalRevenue: 250.75,
  totalOrders: 15,
  totalReservations: 8
}

describe('UsersStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Reset store state
    act(() => {
      useUsersStore.setState({
        users: [],
        stats: null,
        isLoading: false,
        isLoadingStats: false
      })
    })
  })

  // 1. INITIAL STATE
  describe('Initial State', () => {
    test('should have correct initial state', () => {
      const state = useUsersStore.getState()

      expect(state.users).toEqual([])
      expect(state.stats).toBeNull()
      expect(state.isLoading).toBe(false)
      expect(state.isLoadingStats).toBe(false)
    })
  })

  // 2. INITIALIZE USERS
  describe('initializeUsers', () => {
    test('should fetch all users successfully', async () => {
      usersApi.getAllUsers.mockResolvedValue({
        success: true,
        data: mockUsers
      })

      const { initializeUsers } = useUsersStore.getState()

      await initializeUsers()

      expect(usersApi.getAllUsers).toHaveBeenCalled()

      const state = useUsersStore.getState()
      expect(state.users).toEqual(mockUsers)
      expect(state.isLoading).toBe(false)
    })

    test('should handle fetch error', async () => {
      usersApi.getAllUsers.mockResolvedValue({
        success: false,
        error: 'Access denied'
      })

      const { initializeUsers } = useUsersStore.getState()

      await initializeUsers()

      const state = useUsersStore.getState()
      expect(state.users).toEqual([])
      expect(state.isLoading).toBe(false)
    })

    test('should handle API exception', async () => {
      usersApi.getAllUsers.mockRejectedValue(new Error('Server error'))

      const { initializeUsers } = useUsersStore.getState()

      await initializeUsers()

      const state = useUsersStore.getState()
      expect(state.users).toEqual([])
      expect(state.isLoading).toBe(false)
    })
  })

  // 3. TOGGLE USER STATUS
  describe('toggleUserStatus', () => {
    test('should toggle user status successfully', async () => {
      // Setup initial state with users
      act(() => {
        useUsersStore.setState({ users: mockUsers })
      })

      usersApi.updateUser.mockResolvedValue({
        success: true
      })

      const { toggleUserStatus } = useUsersStore.getState()

      const result = await toggleUserStatus('user-001')

      expect(result.success).toBe(true)
      expect(usersApi.updateUser).toHaveBeenCalledWith('user-001', { isActive: false })

      const state = useUsersStore.getState()
      const updatedUser = state.users.find(u => u.id === 'user-001')
      expect(updatedUser.isActive).toBe(false)
      expect(state.isLoading).toBe(false)
    })

    test('should handle toggle error', async () => {
      act(() => {
        useUsersStore.setState({ users: mockUsers })
      })

      usersApi.updateUser.mockResolvedValue({
        success: false,
        error: 'Cannot deactivate admin',
        code: 'ADMIN_DEACTIVATION_FORBIDDEN'
      })

      const { toggleUserStatus } = useUsersStore.getState()

      const result = await toggleUserStatus('admin-001')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Cannot deactivate admin')
      expect(result.code).toBe('ADMIN_DEACTIVATION_FORBIDDEN')
    })

    test('should handle user not found', async () => {
      act(() => {
        useUsersStore.setState({ users: mockUsers })
      })

      const { toggleUserStatus } = useUsersStore.getState()

      const result = await toggleUserStatus('nonexistent')

      expect(result.success).toBe(false)
      expect(result.error).toBe('User not found')
    })
  })

  // 4. UPDATE USER ROLE
  describe('updateUserRole', () => {
    test('should update user role successfully', async () => {
      act(() => {
        useUsersStore.setState({ users: mockUsers })
      })

      usersApi.updateUser.mockResolvedValue({
        success: true
      })

      const { updateUserRole } = useUsersStore.getState()

      const result = await updateUserRole('user-001', 'admin')

      expect(result.success).toBe(true)
      expect(usersApi.updateUser).toHaveBeenCalledWith('user-001', { role: 'admin' })

      const state = useUsersStore.getState()
      const updatedUser = state.users.find(u => u.id === 'user-001')
      expect(updatedUser.role).toBe('admin')
      expect(state.isLoading).toBe(false)
    })

    test('should handle update role error', async () => {
      act(() => {
        useUsersStore.setState({ users: mockUsers })
      })

      usersApi.updateUser.mockResolvedValue({
        success: false,
        error: 'Invalid role',
        code: 'INVALID_ROLE'
      })

      const { updateUserRole } = useUsersStore.getState()

      const result = await updateUserRole('user-001', 'superadmin')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid role')
    })
  })

  // 5. DELETE USER
  describe('deleteUser', () => {
    test('should delete user successfully', async () => {
      act(() => {
        useUsersStore.setState({ users: mockUsers })
      })

      usersApi.deleteUser.mockResolvedValue({
        success: true
      })
      usersApi.getUsersStats.mockResolvedValue({
        success: true,
        data: { ...mockStats, total: 3 }
      })

      const { deleteUser } = useUsersStore.getState()

      const result = await deleteUser('user-002')

      expect(result.success).toBe(true)
      expect(usersApi.deleteUser).toHaveBeenCalledWith('user-002')

      const state = useUsersStore.getState()
      expect(state.users.find(u => u.id === 'user-002')).toBeUndefined()
      expect(state.users).toHaveLength(3)

      // Should refresh stats after deletion
      expect(usersApi.getUsersStats).toHaveBeenCalled()
    })

    test('should handle delete error', async () => {
      act(() => {
        useUsersStore.setState({ users: mockUsers })
      })

      usersApi.deleteUser.mockResolvedValue({
        success: false,
        error: 'User has pending orders',
        code: 'USER_HAS_ORDERS',
        details: { orderCount: 5 }
      })

      const { deleteUser } = useUsersStore.getState()

      const result = await deleteUser('user-001')

      expect(result.success).toBe(false)
      expect(result.error).toBe('User has pending orders')
      expect(result.code).toBe('USER_HAS_ORDERS')

      // User should still be in the list
      const state = useUsersStore.getState()
      expect(state.users.find(u => u.id === 'user-001')).toBeDefined()
    })
  })

  // 6. UPDATE LAST LOGIN
  describe('updateLastLogin', () => {
    test('should update last login timestamp', () => {
      act(() => {
        useUsersStore.setState({ users: mockUsers })
      })

      const originalLastLogin = mockUsers.find(u => u.id === 'user-001').lastLoginAt

      // Set a specific time
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-01-25T15:00:00Z'))

      const { updateLastLogin } = useUsersStore.getState()

      act(() => {
        updateLastLogin('user-001')
      })

      const state = useUsersStore.getState()
      const updatedUser = state.users.find(u => u.id === 'user-001')
      expect(updatedUser.lastLoginAt).toBe('2024-01-25T15:00:00.000Z')
      expect(updatedUser.lastLoginAt).not.toBe(originalLastLogin)

      vi.useRealTimers()
    })
  })

  // 7. FETCH USERS STATS
  describe('fetchUsersStats', () => {
    test('should fetch users stats successfully', async () => {
      usersApi.getUsersStats.mockResolvedValue({
        success: true,
        data: mockStats
      })

      const { fetchUsersStats } = useUsersStore.getState()

      await fetchUsersStats()

      expect(usersApi.getUsersStats).toHaveBeenCalled()

      const state = useUsersStore.getState()
      expect(state.stats).toEqual(mockStats)
      expect(state.isLoadingStats).toBe(false)
    })

    test('should handle stats fetch error', async () => {
      usersApi.getUsersStats.mockResolvedValue({
        success: false,
        error: 'Stats not available'
      })

      const { fetchUsersStats } = useUsersStore.getState()

      await fetchUsersStats()

      const state = useUsersStore.getState()
      expect(state.stats).toBeNull()
      expect(state.isLoadingStats).toBe(false)
    })
  })

  // 8. REFRESH USER STATS
  describe('refreshUserStats', () => {
    test('should call fetchUsersStats', async () => {
      usersApi.getUsersStats.mockResolvedValue({
        success: true,
        data: mockStats
      })

      const { refreshUserStats } = useUsersStore.getState()

      refreshUserStats()

      expect(usersApi.getUsersStats).toHaveBeenCalled()
    })
  })

  // 9. GETTERS
  describe('Getters', () => {
    beforeEach(() => {
      act(() => {
        useUsersStore.setState({ users: mockUsers })
      })
    })

    test('should get user by id', () => {
      const { getUserById } = useUsersStore.getState()

      const user = getUserById('user-001')
      expect(user.name).toBe('Jean Dupont')
      expect(user.email).toBe('jean@example.com')
    })

    test('should return undefined for non-existent user', () => {
      const { getUserById } = useUsersStore.getState()

      const user = getUserById('nonexistent')
      expect(user).toBeUndefined()
    })

    test('should filter users by role', () => {
      const { getUsersByRole } = useUsersStore.getState()

      const admins = getUsersByRole('admin')
      expect(admins).toHaveLength(1)
      expect(admins[0].role).toBe('admin')

      const users = getUsersByRole('user')
      expect(users).toHaveLength(3)
      expect(users.every(u => u.role === 'user')).toBe(true)
    })

    test('should get active users', () => {
      const { getActiveUsers } = useUsersStore.getState()

      const active = getActiveUsers()
      expect(active).toHaveLength(3)
      expect(active.every(u => u.isActive)).toBe(true)
    })

    test('should get inactive users', () => {
      const { getInactiveUsers } = useUsersStore.getState()

      const inactive = getInactiveUsers()
      expect(inactive).toHaveLength(1)
      expect(inactive[0].name).toBe('Marie Martin')
      expect(inactive.every(u => !u.isActive)).toBe(true)
    })

    test('should get unverified users', () => {
      const { getUnverifiedUsers } = useUsersStore.getState()

      const unverified = getUnverifiedUsers()
      expect(unverified).toHaveLength(2)
      expect(unverified.map(u => u.name)).toContain('Marie Martin')
      expect(unverified.map(u => u.name)).toContain('Pierre Bernard')
    })

    test('should search users by name', () => {
      const { searchUsers } = useUsersStore.getState()

      const results = searchUsers('jean')
      expect(results).toHaveLength(1)
      expect(results[0].name).toBe('Jean Dupont')
    })

    test('should search users by email', () => {
      const { searchUsers } = useUsersStore.getState()

      const results = searchUsers('marie@')
      expect(results).toHaveLength(1)
      expect(results[0].name).toBe('Marie Martin')
    })

    test('should search users by phone', () => {
      const { searchUsers } = useUsersStore.getState()

      const results = searchUsers('06 55')
      expect(results).toHaveLength(1)
      expect(results[0].name).toBe('Pierre Bernard')
    })

    test('should return empty array for no search results', () => {
      const { searchUsers } = useUsersStore.getState()

      const results = searchUsers('nonexistent')
      expect(results).toHaveLength(0)
    })
  })

  // 10. LOADING STATES
  describe('Loading States', () => {
    test('should set loading state during fetch', async () => {
      let resolvePromise
      usersApi.getAllUsers.mockImplementation(() =>
        new Promise(resolve => { resolvePromise = resolve })
      )

      const { initializeUsers } = useUsersStore.getState()

      const fetchPromise = initializeUsers()

      // Should be loading while waiting
      expect(useUsersStore.getState().isLoading).toBe(true)

      // Resolve the promise
      resolvePromise({ success: true, data: [] })
      await fetchPromise

      // Should not be loading after completion
      expect(useUsersStore.getState().isLoading).toBe(false)
    })

    test('should set loading stats state during stats fetch', async () => {
      let resolvePromise
      usersApi.getUsersStats.mockImplementation(() =>
        new Promise(resolve => { resolvePromise = resolve })
      )

      const { fetchUsersStats } = useUsersStore.getState()

      const fetchPromise = fetchUsersStats()

      // Should be loading while waiting
      expect(useUsersStore.getState().isLoadingStats).toBe(true)

      // Resolve the promise
      resolvePromise({ success: true, data: mockStats })
      await fetchPromise

      // Should not be loading after completion
      expect(useUsersStore.getState().isLoadingStats).toBe(false)
    })
  })

  // 11. SET LOADING
  describe('setLoading', () => {
    test('should set loading state manually', () => {
      const { setLoading } = useUsersStore.getState()

      act(() => {
        setLoading(true)
      })
      expect(useUsersStore.getState().isLoading).toBe(true)

      act(() => {
        setLoading(false)
      })
      expect(useUsersStore.getState().isLoading).toBe(false)
    })
  })
})
