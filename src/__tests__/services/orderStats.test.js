import { describe, it, expect } from 'vitest'
import {
  calculateOrderStats,
  calculateRevenue,
  calculateAverageOrderValue,
  getPopularItems,
  calculateCompletionRate,
  getOrdersByStatusGroups,
  calculateDailyStats
} from '../../services/orders/orderStats'

describe('orderStats', () => {
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  const mockOrders = [
    {
      id: '1',
      status: 'pending',
      paymentStatus: 'pending',
      orderType: 'delivery',
      totalPrice: 25.50,
      createdAt: `${today}T10:00:00Z`,
      items: [{ menuItem: 'item1', name: 'Pizza', quantity: 2 }]
    },
    {
      id: '2',
      status: 'confirmed',
      paymentStatus: 'paid',
      orderType: 'delivery',
      totalPrice: 30.00,
      createdAt: `${today}T12:00:00Z`,
      items: [{ menuItem: 'item2', name: 'Burger', quantity: 1 }]
    },
    {
      id: '3',
      status: 'delivered',
      paymentStatus: 'paid',
      orderType: 'pickup',
      totalPrice: 15.00,
      createdAt: `${yesterday}T14:00:00Z`,
      items: [{ menuItem: 'item1', name: 'Pizza', quantity: 1 }]
    },
    {
      id: '4',
      status: 'cancelled',
      paymentStatus: 'pending',
      orderType: 'delivery',
      totalPrice: 20.00,
      createdAt: `${yesterday}T16:00:00Z`,
      items: [{ menuItem: 'item3', name: 'Salad', quantity: 3 }]
    }
  ]

  describe('calculateOrderStats', () => {
    it('should calculate all stats', () => {
      const stats = calculateOrderStats(mockOrders)
      expect(stats.total).toBe(4)
      expect(stats.pending).toBe(1)
      expect(stats.confirmed).toBe(1)
      expect(stats.delivered).toBe(1)
      expect(stats.cancelled).toBe(1)
      expect(stats.paidOrders).toBe(2)
      expect(stats.unpaidOrders).toBe(2)
      expect(stats.deliveryOrders).toBe(3)
      expect(stats.pickupOrders).toBe(1)
    })

    it('should calculate revenue correctly', () => {
      const stats = calculateOrderStats(mockOrders)
      expect(stats.totalRevenue).toBe(15.00) // Only delivered + paid
    })

    it('should handle empty array', () => {
      const stats = calculateOrderStats([])
      expect(stats.total).toBe(0)
      expect(stats.totalRevenue).toBe(0)
    })
  })

  describe('calculateRevenue', () => {
    it('should calculate revenue for date range', () => {
      const result = calculateRevenue(mockOrders, yesterday, today)
      expect(result.orderCount).toBe(1)
      expect(result.totalRevenue).toBe(15.00)
    })

    it('should separate paid and unpaid', () => {
      const result = calculateRevenue(mockOrders, yesterday, today)
      expect(result.paidRevenue).toBe(15.00)
      expect(result.unpaidRevenue).toBe(0)
    })

    it('should handle empty array', () => {
      const result = calculateRevenue([], yesterday, today)
      expect(result.totalRevenue).toBe(0)
    })
  })

  describe('calculateAverageOrderValue', () => {
    it('should calculate average', () => {
      const avg = calculateAverageOrderValue(mockOrders)
      expect(avg).toBeCloseTo(22.625, 2)
    })

    it('should filter by status', () => {
      const avg = calculateAverageOrderValue(mockOrders, { status: 'delivered' })
      expect(avg).toBe(15.00)
    })

    it('should handle empty array', () => {
      expect(calculateAverageOrderValue([])).toBe(0)
    })
  })

  describe('getPopularItems', () => {
    it('should return popular items', () => {
      const popular = getPopularItems(mockOrders, 2)
      expect(popular).toHaveLength(2)
      expect(popular[0].name).toBe('Pizza')
      expect(popular[0].totalQuantity).toBe(3)
    })

    it('should handle empty array', () => {
      expect(getPopularItems([])).toEqual([])
    })
  })

  describe('calculateCompletionRate', () => {
    it('should calculate rates', () => {
      const result = calculateCompletionRate(mockOrders)
      expect(result.total).toBe(4)
      expect(result.completed).toBe(1)
      expect(result.cancelled).toBe(1)
      expect(result.completionRate).toBe(25)
      expect(result.cancellationRate).toBe(25)
    })

    it('should handle empty array', () => {
      const result = calculateCompletionRate([])
      expect(result.completionRate).toBe(0)
    })
  })

  describe('getOrdersByStatusGroups', () => {
    it('should group by status', () => {
      const groups = getOrdersByStatusGroups(mockOrders)
      expect(groups).toHaveLength(4)
      expect(groups[0].count).toBe(1)
    })

    it('should handle empty array', () => {
      expect(getOrdersByStatusGroups([])).toEqual([])
    })
  })

  describe('calculateDailyStats', () => {
    it('should calculate daily stats', () => {
      const stats = calculateDailyStats(mockOrders)
      expect(stats[today]).toBeDefined()
      expect(stats[today].orderCount).toBe(2)
      expect(stats[yesterday]).toBeDefined()
      expect(stats[yesterday].deliveredCount).toBe(1)
    })

    it('should handle empty array', () => {
      const stats = calculateDailyStats([])
      expect(Object.keys(stats)).toHaveLength(0)
    })
  })
})
