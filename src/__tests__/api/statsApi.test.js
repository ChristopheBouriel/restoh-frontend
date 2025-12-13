import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as statsApi from '../../api/statsApi'
import apiClient from '../../api/apiClient'

// Mock apiClient
vi.mock('../../api/apiClient', () => ({
  default: {
    get: vi.fn()
  }
}))

describe('Stats API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getDashboardStats', () => {
    const mockStatsData = {
      quickStats: {
        todayRevenue: 125.00,
        todayOrders: 5,
        todayReservations: 3,
        totalActiveUsers: 150
      },
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

    it('should fetch dashboard stats successfully', async () => {
      apiClient.get.mockResolvedValueOnce({ data: mockStatsData })

      const result = await statsApi.getDashboardStats()

      expect(apiClient.get).toHaveBeenCalledWith('/admin/stats')
      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockStatsData)
    })

    it('should return quick stats for dashboard top row', async () => {
      apiClient.get.mockResolvedValueOnce({ data: mockStatsData })

      const result = await statsApi.getDashboardStats()

      expect(result.data.quickStats.todayRevenue).toBe(125.00)
      expect(result.data.quickStats.todayOrders).toBe(5)
      expect(result.data.quickStats.todayReservations).toBe(3)
      expect(result.data.quickStats.totalActiveUsers).toBe(150)
    })

    it('should return menu statistics', async () => {
      apiClient.get.mockResolvedValueOnce({ data: mockStatsData })

      const result = await statsApi.getDashboardStats()

      expect(result.data.totalMenuItems).toBe(15)
      expect(result.data.activeMenuItems).toBe(12)
      expect(result.data.inactiveMenuItems).toBe(3)
    })

    it('should return orders statistics by period', async () => {
      apiClient.get.mockResolvedValueOnce({ data: mockStatsData })

      const result = await statsApi.getDashboardStats()

      // Today's orders
      expect(result.data.orders.today.total).toBe(5)
      expect(result.data.orders.today.revenue).toBe(125.00)
      expect(result.data.orders.today.pickup).toBe(3)
      expect(result.data.orders.today.delivery).toBe(2)

      // This month's orders
      expect(result.data.orders.thisMonth.total).toBe(45)
      expect(result.data.orders.thisMonth.revenue).toBe(1250.00)

      // Same day last week
      expect(result.data.orders.sameDayLastWeek.total).toBe(4)
    })

    it('should return reservations statistics by period', async () => {
      apiClient.get.mockResolvedValueOnce({ data: mockStatsData })

      const result = await statsApi.getDashboardStats()

      // Today's reservations
      expect(result.data.reservations.today.total).toBe(3)
      expect(result.data.reservations.today.totalGuests).toBe(10)

      // This month's reservations
      expect(result.data.reservations.thisMonth.total).toBe(28)
      expect(result.data.reservations.thisMonth.totalGuests).toBe(84)

      // Last month
      expect(result.data.reservations.lastMonth.total).toBe(32)
    })

    it('should return revenue summary', async () => {
      apiClient.get.mockResolvedValueOnce({ data: mockStatsData })

      const result = await statsApi.getDashboardStats()

      expect(result.data.revenue.today).toBe(125.00)
      expect(result.data.revenue.thisMonth).toBe(1250.00)
      expect(result.data.revenue.lastMonth).toBe(1480.00)
      expect(result.data.revenue.sameDayLastWeek).toBe(110.00)
    })

    it('should handle error response', async () => {
      const mockError = { error: 'Unauthorized access' }
      apiClient.get.mockRejectedValueOnce(mockError)

      const result = await statsApi.getDashboardStats()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Unauthorized access')
    })

    it('should handle generic error without message', async () => {
      apiClient.get.mockRejectedValueOnce({})

      const result = await statsApi.getDashboardStats()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Error fetching dashboard statistics')
    })

    it('should handle network error', async () => {
      apiClient.get.mockRejectedValueOnce(new Error('Network error'))

      const result = await statsApi.getDashboardStats()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Error fetching dashboard statistics')
    })
  })
})
