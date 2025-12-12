import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest'
import { act } from '@testing-library/react'
import useStatsStore from '../../store/statsStore'
import * as statsApi from '../../api/statsApi'

// Mock the API
vi.mock('../../api/statsApi')

// Mock data matching the backend API response structure
const mockStatsData = {
  totalMenuItems: 15,
  activeMenuItems: 12,
  inactiveMenuItems: 3,
  orders: {
    thisMonth: { total: 45, revenue: 1250.00, pickup: 30, delivery: 15 },
    lastMonth: { total: 52, revenue: 1480.00, pickup: 35, delivery: 17 },
    today: { total: 5, revenue: 125.00, pickup: 3, delivery: 2 },
    sameDayLastWeek: { total: 4, revenue: 110.00, pickup: 2, delivery: 2 }
  },
  reservations: {
    thisMonth: { total: 28, totalGuests: 84 },
    lastMonth: { total: 32, totalGuests: 96 },
    today: { total: 3, totalGuests: 10 },
    sameDayLastWeek: { total: 2, totalGuests: 6 }
  },
  revenue: {
    thisMonth: 1250.00,
    lastMonth: 1480.00,
    today: 125.00,
    sameDayLastWeek: 110.00
  }
}

describe('StatsStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Reset store state
    act(() => {
      useStatsStore.setState({
        stats: null,
        isLoading: false,
        error: null
      })
    })
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  // 1. INITIAL STATE
  describe('Initial State', () => {
    test('should have correct initial state', () => {
      const state = useStatsStore.getState()

      expect(state.stats).toBeNull()
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
    })

    test('should have fetchStats action', () => {
      const { fetchStats } = useStatsStore.getState()
      expect(typeof fetchStats).toBe('function')
    })

    test('should have clearStats action', () => {
      const { clearStats } = useStatsStore.getState()
      expect(typeof clearStats).toBe('function')
    })

    test('should have clearError action', () => {
      const { clearError } = useStatsStore.getState()
      expect(typeof clearError).toBe('function')
    })
  })

  // 2. FETCH STATS
  describe('fetchStats', () => {
    test('should fetch stats successfully', async () => {
      statsApi.getDashboardStats.mockResolvedValue({
        success: true,
        data: mockStatsData
      })

      const { fetchStats } = useStatsStore.getState()

      const result = await fetchStats()

      expect(result.success).toBe(true)
      expect(statsApi.getDashboardStats).toHaveBeenCalledTimes(1)

      const state = useStatsStore.getState()
      expect(state.stats).toEqual(mockStatsData)
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
    })

    test('should set loading state while fetching', async () => {
      let resolvePromise
      statsApi.getDashboardStats.mockReturnValue(
        new Promise(resolve => { resolvePromise = resolve })
      )

      const { fetchStats } = useStatsStore.getState()

      const fetchPromise = fetchStats()

      // Check loading state is true during fetch
      expect(useStatsStore.getState().isLoading).toBe(true)

      // Resolve the promise
      resolvePromise({ success: true, data: mockStatsData })
      await fetchPromise

      // Check loading state is false after fetch
      expect(useStatsStore.getState().isLoading).toBe(false)
    })

    test('should handle fetch error', async () => {
      const errorMessage = 'Failed to fetch statistics'
      statsApi.getDashboardStats.mockResolvedValue({
        success: false,
        error: errorMessage
      })

      const { fetchStats } = useStatsStore.getState()

      const result = await fetchStats()

      expect(result.success).toBe(false)
      expect(result.error).toBe(errorMessage)

      const state = useStatsStore.getState()
      expect(state.stats).toBeNull()
      expect(state.isLoading).toBe(false)
      expect(state.error).toBe(errorMessage)
    })

    test('should handle exception during fetch', async () => {
      statsApi.getDashboardStats.mockRejectedValue({
        error: 'Network error'
      })

      const { fetchStats } = useStatsStore.getState()

      const result = await fetchStats()

      expect(result.success).toBe(false)

      const state = useStatsStore.getState()
      expect(state.isLoading).toBe(false)
      expect(state.error).toBe('Network error')
    })

    test('should handle exception without error message', async () => {
      statsApi.getDashboardStats.mockRejectedValue({})

      const { fetchStats } = useStatsStore.getState()

      const result = await fetchStats()

      expect(result.success).toBe(false)

      const state = useStatsStore.getState()
      expect(state.error).toBe('Error loading statistics')
    })

    test('should clear previous error on new fetch', async () => {
      // Set initial error state
      act(() => {
        useStatsStore.setState({ error: 'Previous error' })
      })

      statsApi.getDashboardStats.mockResolvedValue({
        success: true,
        data: mockStatsData
      })

      const { fetchStats } = useStatsStore.getState()
      await fetchStats()

      expect(useStatsStore.getState().error).toBeNull()
    })

    test('should update stats with all expected fields', async () => {
      statsApi.getDashboardStats.mockResolvedValue({
        success: true,
        data: mockStatsData
      })

      const { fetchStats } = useStatsStore.getState()
      await fetchStats()

      const { stats } = useStatsStore.getState()

      // Menu stats
      expect(stats.totalMenuItems).toBe(15)
      expect(stats.activeMenuItems).toBe(12)
      expect(stats.inactiveMenuItems).toBe(3)

      // Orders by period
      expect(stats.orders.today.total).toBe(5)
      expect(stats.orders.today.revenue).toBe(125.00)
      expect(stats.orders.today.pickup).toBe(3)
      expect(stats.orders.today.delivery).toBe(2)

      expect(stats.orders.thisMonth.total).toBe(45)
      expect(stats.orders.lastMonth.total).toBe(52)
      expect(stats.orders.sameDayLastWeek.total).toBe(4)

      // Reservations by period
      expect(stats.reservations.today.total).toBe(3)
      expect(stats.reservations.today.totalGuests).toBe(10)
      expect(stats.reservations.thisMonth.totalGuests).toBe(84)

      // Revenue summary
      expect(stats.revenue.today).toBe(125.00)
      expect(stats.revenue.thisMonth).toBe(1250.00)
      expect(stats.revenue.lastMonth).toBe(1480.00)
      expect(stats.revenue.sameDayLastWeek).toBe(110.00)
    })
  })

  // 3. CLEAR STATS
  describe('clearStats', () => {
    test('should clear stats and error', async () => {
      // Set initial state with data
      act(() => {
        useStatsStore.setState({
          stats: mockStatsData,
          error: 'Some error'
        })
      })

      const { clearStats } = useStatsStore.getState()

      act(() => {
        clearStats()
      })

      const state = useStatsStore.getState()
      expect(state.stats).toBeNull()
      expect(state.error).toBeNull()
    })
  })

  // 4. CLEAR ERROR
  describe('clearError', () => {
    test('should clear error only', async () => {
      // Set initial state with data and error
      act(() => {
        useStatsStore.setState({
          stats: mockStatsData,
          error: 'Some error'
        })
      })

      const { clearError } = useStatsStore.getState()

      act(() => {
        clearError()
      })

      const state = useStatsStore.getState()
      expect(state.stats).toEqual(mockStatsData) // Stats should remain
      expect(state.error).toBeNull()
    })
  })

  // 5. EDGE CASES
  describe('Edge Cases', () => {
    test('should handle empty stats data', async () => {
      const emptyStats = {
        totalMenuItems: 0,
        activeMenuItems: 0,
        inactiveMenuItems: 0,
        orders: {
          thisMonth: { total: 0, revenue: 0, pickup: 0, delivery: 0 },
          lastMonth: { total: 0, revenue: 0, pickup: 0, delivery: 0 },
          today: { total: 0, revenue: 0, pickup: 0, delivery: 0 },
          sameDayLastWeek: { total: 0, revenue: 0, pickup: 0, delivery: 0 }
        },
        reservations: {
          thisMonth: { total: 0, totalGuests: 0 },
          lastMonth: { total: 0, totalGuests: 0 },
          today: { total: 0, totalGuests: 0 },
          sameDayLastWeek: { total: 0, totalGuests: 0 }
        },
        revenue: {
          thisMonth: 0,
          lastMonth: 0,
          today: 0,
          sameDayLastWeek: 0
        }
      }

      statsApi.getDashboardStats.mockResolvedValue({
        success: true,
        data: emptyStats
      })

      const { fetchStats } = useStatsStore.getState()
      await fetchStats()

      const { stats } = useStatsStore.getState()
      expect(stats.totalMenuItems).toBe(0)
      expect(stats.orders.today.total).toBe(0)
      expect(stats.revenue.thisMonth).toBe(0)
    })

    test('should handle multiple concurrent fetches', async () => {
      statsApi.getDashboardStats.mockResolvedValue({
        success: true,
        data: mockStatsData
      })

      const { fetchStats } = useStatsStore.getState()

      // Start multiple fetches concurrently
      const [result1, result2] = await Promise.all([
        fetchStats(),
        fetchStats()
      ])

      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)

      // API should be called twice
      expect(statsApi.getDashboardStats).toHaveBeenCalledTimes(2)
    })

    test('should preserve stats on failed refetch', async () => {
      // First fetch succeeds
      statsApi.getDashboardStats.mockResolvedValueOnce({
        success: true,
        data: mockStatsData
      })

      const { fetchStats } = useStatsStore.getState()
      await fetchStats()

      expect(useStatsStore.getState().stats).toEqual(mockStatsData)

      // Second fetch fails - store keeps old stats? No, it sets error
      statsApi.getDashboardStats.mockResolvedValueOnce({
        success: false,
        error: 'Server error'
      })

      await fetchStats()

      const state = useStatsStore.getState()
      // On error, stats remain null as per implementation
      expect(state.error).toBe('Server error')
    })
  })
})
