import { describe, it, expect } from 'vitest'
import {
  filterByStatus,
  filterByUser,
  filterByPaymentStatus,
  filterByOrderType,
  getTodaysOrders,
  getOrdersByDate,
  getRecentOrders,
  filterOrders,
  searchOrders,
  sortOrders
} from '../../services/orders/orderFilters'

describe('orderFilters', () => {
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  const mockOrders = [
    {
      id: '1',
      userId: 'user1',
      status: 'pending',
      paymentStatus: 'pending',
      orderType: 'delivery',
      totalPrice: 25.50,
      createdAt: `${today}T10:00:00Z`
    },
    {
      id: '2',
      userId: 'user1',
      status: 'confirmed',
      paymentStatus: 'paid',
      orderType: 'delivery',
      totalPrice: 30.00,
      createdAt: `${today}T12:00:00Z`
    },
    {
      id: '3',
      userId: 'user2',
      status: 'delivered',
      paymentStatus: 'paid',
      orderType: 'pickup',
      totalPrice: 15.00,
      createdAt: `${yesterday}T14:00:00Z`,
      user: { name: 'John Doe', email: 'john@example.com' }
    },
    {
      id: '4',
      userId: 'user2',
      status: 'cancelled',
      paymentStatus: 'pending',
      orderType: 'delivery',
      totalPrice: 20.00,
      createdAt: `${yesterday}T16:00:00Z`,
      phone: '0612345678'
    }
  ]

  describe('filterByStatus', () => {
    it('should filter by status', () => {
      const result = filterByStatus(mockOrders, 'pending')
      expect(result).toHaveLength(1)
      expect(result[0].status).toBe('pending')
    })

    it('should return all if no status provided', () => {
      expect(filterByStatus(mockOrders, null)).toHaveLength(4)
    })

    it('should handle empty array', () => {
      expect(filterByStatus([], 'pending')).toEqual([])
    })
  })

  describe('filterByUser', () => {
    it('should filter by userId', () => {
      const result = filterByUser(mockOrders, 'user1')
      expect(result).toHaveLength(2)
      expect(result.every(o => o.userId === 'user1')).toBe(true)
    })

    it('should handle user object', () => {
      const result = filterByUser(mockOrders, 'user2')
      expect(result).toHaveLength(2)
    })

    it('should handle empty array', () => {
      expect(filterByUser([], 'user1')).toEqual([])
    })
  })

  describe('filterByPaymentStatus', () => {
    it('should filter by payment status', () => {
      const result = filterByPaymentStatus(mockOrders, 'paid')
      expect(result).toHaveLength(2)
      expect(result.every(o => o.paymentStatus === 'paid')).toBe(true)
    })

    it('should handle pending', () => {
      const result = filterByPaymentStatus(mockOrders, 'pending')
      expect(result).toHaveLength(2)
    })
  })

  describe('filterByOrderType', () => {
    it('should filter by order type', () => {
      const result = filterByOrderType(mockOrders, 'delivery')
      expect(result).toHaveLength(3)
    })

    it('should handle pickup', () => {
      const result = filterByOrderType(mockOrders, 'pickup')
      expect(result).toHaveLength(1)
    })
  })

  describe('getTodaysOrders', () => {
    it('should return today orders', () => {
      const result = getTodaysOrders(mockOrders)
      expect(result).toHaveLength(2)
      expect(result.every(o => o.createdAt.startsWith(today))).toBe(true)
    })

    it('should handle empty array', () => {
      expect(getTodaysOrders([])).toEqual([])
    })
  })

  describe('getOrdersByDate', () => {
    it('should filter by specific date', () => {
      const result = getOrdersByDate(mockOrders, yesterday)
      expect(result).toHaveLength(2)
    })

    it('should return all if no date', () => {
      expect(getOrdersByDate(mockOrders, null)).toHaveLength(4)
    })
  })

  describe('getRecentOrders', () => {
    it('should return recent orders sorted', () => {
      const result = getRecentOrders(mockOrders, 2)
      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('2') // Most recent
    })

    it('should handle empty array', () => {
      expect(getRecentOrders([])).toEqual([])
    })
  })

  describe('filterOrders', () => {
    it('should filter by multiple criteria', () => {
      const result = filterOrders(mockOrders, {
        status: 'delivered',
        paymentStatus: 'paid'
      })
      expect(result).toHaveLength(1)
    })

    it('should handle empty filters', () => {
      expect(filterOrders(mockOrders, {})).toHaveLength(4)
    })
  })

  describe('searchOrders', () => {
    it('should search by user name', () => {
      const result = searchOrders(mockOrders, 'John')
      expect(result).toHaveLength(1)
    })

    it('should search by phone', () => {
      const result = searchOrders(mockOrders, '0612')
      expect(result).toHaveLength(1)
    })

    it('should return all for empty search', () => {
      expect(searchOrders(mockOrders, '')).toHaveLength(4)
    })
  })

  describe('sortOrders', () => {
    it('should sort by date desc', () => {
      const result = sortOrders(mockOrders, 'date', 'desc')
      expect(result[0].id).toBe('2')
    })

    it('should sort by price asc', () => {
      const result = sortOrders(mockOrders, 'price', 'asc')
      expect(result[0].totalPrice).toBe(15.00)
    })
  })
})
