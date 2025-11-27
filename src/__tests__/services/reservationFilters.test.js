import { describe, it, expect } from 'vitest'
import {
  filterByStatus,
  filterByDate,
  filterByUser,
  getTodaysReservations,
  getUpcomingReservations,
  getPastReservations,
  filterReservations,
  searchReservations
} from '../../services/reservations/reservationFilters'

describe('reservationFilters', () => {
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]

  const mockReservations = [
    {
      id: '1',
      date: today,
      status: 'confirmed',
      guests: 4,
      userId: 'user1',
      userName: 'John Doe',
      userEmail: 'john@example.com',
      phone: '0612345678'
    },
    {
      id: '2',
      date: tomorrow,
      status: 'confirmed',
      guests: 2,
      userId: 'user2',
      userName: 'Jane Smith',
      userEmail: 'jane@example.com',
      phone: '0623456789'
    },
    {
      id: '3',
      date: yesterday,
      status: 'completed',
      guests: 6,
      userId: 'user1',
      userName: 'John Doe',
      userEmail: 'john@example.com',
      phone: '0612345678'
    },
    {
      id: '4',
      date: today,
      status: 'cancelled',
      guests: 3,
      userId: 'user3',
      userName: 'Bob Wilson',
      userEmail: 'bob@example.com',
      phone: '0634567890'
    }
  ]

  describe('filterByStatus', () => {
    it('should return all reservations if no status provided', () => {
      const result = filterByStatus(mockReservations, null)
      expect(result).toHaveLength(4)
    })

    it('should filter by confirmed status', () => {
      const result = filterByStatus(mockReservations, 'confirmed')
      expect(result).toHaveLength(2)
      expect(result.every(r => r.status === 'confirmed')).toBe(true)
    })

    it('should filter by completed status', () => {
      const result = filterByStatus(mockReservations, 'completed')
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('3')
    })

    it('should filter by cancelled status', () => {
      const result = filterByStatus(mockReservations, 'cancelled')
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('4')
    })

    it('should return empty array for non-existent status', () => {
      const result = filterByStatus(mockReservations, 'no-show')
      expect(result).toHaveLength(0)
    })

    it('should handle empty reservations array', () => {
      const result = filterByStatus([], 'confirmed')
      expect(result).toHaveLength(0)
    })

    it('should handle null reservations', () => {
      const result = filterByStatus(null, 'confirmed')
      expect(result).toHaveLength(0)
    })
  })

  describe('filterByDate', () => {
    it('should filter by specific date', () => {
      const result = filterByDate(mockReservations, today)
      expect(result).toHaveLength(2)
      expect(result.every(r => r.date === today)).toBe(true)
    })

    it('should filter by tomorrow', () => {
      const result = filterByDate(mockReservations, tomorrow)
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('2')
    })

    it('should return empty array for date with no reservations', () => {
      const futureDate = new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0]
      const result = filterByDate(mockReservations, futureDate)
      expect(result).toHaveLength(0)
    })

    it('should return all reservations if no date provided', () => {
      const result = filterByDate(mockReservations, null)
      expect(result).toHaveLength(4)
    })

    it('should handle empty reservations array', () => {
      const result = filterByDate([], today)
      expect(result).toHaveLength(0)
    })
  })

  describe('filterByUser', () => {
    it('should filter by userId', () => {
      const result = filterByUser(mockReservations, 'user1')
      expect(result).toHaveLength(2)
      expect(result.every(r => r.userId === 'user1')).toBe(true)
    })

    it('should filter by different userId', () => {
      const result = filterByUser(mockReservations, 'user2')
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('2')
    })

    it('should return empty array for non-existent user', () => {
      const result = filterByUser(mockReservations, 'user999')
      expect(result).toHaveLength(0)
    })

    it('should return all reservations if no userId provided', () => {
      const result = filterByUser(mockReservations, null)
      expect(result).toHaveLength(4)
    })

    it('should handle empty reservations array', () => {
      const result = filterByUser([], 'user1')
      expect(result).toHaveLength(0)
    })
  })

  describe('getTodaysReservations', () => {
    it('should return only today\'s reservations', () => {
      const result = getTodaysReservations(mockReservations)
      expect(result).toHaveLength(2)
      expect(result.every(r => r.date === today)).toBe(true)
    })

    it('should include all statuses for today', () => {
      const result = getTodaysReservations(mockReservations)
      const statuses = result.map(r => r.status)
      expect(statuses).toContain('confirmed')
      expect(statuses).toContain('cancelled')
    })

    it('should handle empty reservations array', () => {
      const result = getTodaysReservations([])
      expect(result).toHaveLength(0)
    })

    it('should handle null reservations', () => {
      const result = getTodaysReservations(null)
      expect(result).toHaveLength(0)
    })
  })

  describe('getUpcomingReservations', () => {
    it('should return future reservations only', () => {
      const result = getUpcomingReservations(mockReservations)
      expect(result.every(r => new Date(r.date) >= new Date(today))).toBe(true)
    })

    it('should sort by date ascending', () => {
      const result = getUpcomingReservations(mockReservations)
      for (let i = 1; i < result.length; i++) {
        expect(new Date(result[i].date).getTime()).toBeGreaterThanOrEqual(
          new Date(result[i - 1].date).getTime()
        )
      }
    })

    it('should handle empty reservations array', () => {
      const result = getUpcomingReservations([])
      expect(result).toHaveLength(0)
    })

    it('should handle null reservations', () => {
      const result = getUpcomingReservations(null)
      expect(result).toHaveLength(0)
    })
  })

  describe('getPastReservations', () => {
    it('should return past reservations only', () => {
      const result = getPastReservations(mockReservations)
      expect(result.every(r => new Date(r.date) < new Date(today))).toBe(true)
    })

    it('should sort by date descending', () => {
      const morePast = [
        ...mockReservations,
        {
          id: '5',
          date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
          status: 'completed',
          guests: 2,
          userId: 'user1'
        }
      ]
      const result = getPastReservations(morePast)
      for (let i = 1; i < result.length; i++) {
        expect(new Date(result[i].date).getTime()).toBeLessThanOrEqual(
          new Date(result[i - 1].date).getTime()
        )
      }
    })

    it('should handle empty reservations array', () => {
      const result = getPastReservations([])
      expect(result).toHaveLength(0)
    })

    it('should handle null reservations', () => {
      const result = getPastReservations(null)
      expect(result).toHaveLength(0)
    })
  })

  describe('filterReservations', () => {
    it('should filter by single criterion (status)', () => {
      const filters = { status: 'confirmed' }
      const result = filterReservations(mockReservations, filters)
      expect(result).toHaveLength(2)
      expect(result.every(r => r.status === 'confirmed')).toBe(true)
    })

    it('should filter by single criterion (date)', () => {
      const filters = { date: today }
      const result = filterReservations(mockReservations, filters)
      expect(result).toHaveLength(2)
      expect(result.every(r => r.date === today)).toBe(true)
    })

    it('should filter by single criterion (userId)', () => {
      const filters = { userId: 'user1' }
      const result = filterReservations(mockReservations, filters)
      expect(result).toHaveLength(2)
      expect(result.every(r => r.userId === 'user1')).toBe(true)
    })

    it('should filter by multiple criteria (status + date)', () => {
      const filters = { status: 'confirmed', date: today }
      const result = filterReservations(mockReservations, filters)
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('1')
    })

    it('should filter by multiple criteria (status + userId)', () => {
      const filters = { status: 'confirmed', userId: 'user1' }
      const result = filterReservations(mockReservations, filters)
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('1')
    })

    it('should filter by timeRange "upcoming"', () => {
      const filters = { timeRange: 'upcoming' }
      const result = filterReservations(mockReservations, filters)
      expect(result.every(r => new Date(r.date) >= new Date(today))).toBe(true)
    })

    it('should filter by timeRange "past"', () => {
      const filters = { timeRange: 'past' }
      const result = filterReservations(mockReservations, filters)
      expect(result.every(r => new Date(r.date) < new Date(today))).toBe(true)
    })

    it('should filter by timeRange "today"', () => {
      const filters = { timeRange: 'today' }
      const result = filterReservations(mockReservations, filters)
      expect(result.every(r => r.date === today)).toBe(true)
    })

    it('should return all reservations with empty filters', () => {
      const result = filterReservations(mockReservations, {})
      expect(result).toHaveLength(4)
    })

    it('should return all reservations with null filters', () => {
      const result = filterReservations(mockReservations, null)
      expect(result).toHaveLength(4)
    })

    it('should handle empty reservations array', () => {
      const result = filterReservations([], { status: 'confirmed' })
      expect(result).toHaveLength(0)
    })
  })

  describe('searchReservations', () => {
    it('should search by user name', () => {
      const result = searchReservations(mockReservations, 'John')
      expect(result).toHaveLength(2)
      expect(result.every(r => r.userName.includes('John'))).toBe(true)
    })

    it('should search case-insensitively', () => {
      const result = searchReservations(mockReservations, 'JOHN')
      expect(result).toHaveLength(2)
    })

    it('should search by email', () => {
      const result = searchReservations(mockReservations, 'jane@example')
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('2')
    })

    it('should search by phone', () => {
      const result = searchReservations(mockReservations, '062345')
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('2')
    })

    it('should search by partial match', () => {
      const result = searchReservations(mockReservations, 'Doe')
      expect(result).toHaveLength(2)
    })

    it('should return empty array for no matches', () => {
      const result = searchReservations(mockReservations, 'NoMatch12345')
      expect(result).toHaveLength(0)
    })

    it('should return all reservations for empty search', () => {
      const result = searchReservations(mockReservations, '')
      expect(result).toHaveLength(4)
    })

    it('should handle null search text', () => {
      const result = searchReservations(mockReservations, null)
      expect(result).toHaveLength(4)
    })

    it('should handle empty reservations array', () => {
      const result = searchReservations([], 'John')
      expect(result).toHaveLength(0)
    })

    it('should handle reservations with missing fields', () => {
      const incomplete = [
        { id: '1', date: today, status: 'confirmed' },
        { id: '2', date: tomorrow, status: 'confirmed', userName: 'Test User' }
      ]
      const result = searchReservations(incomplete, 'Test')
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('2')
    })

    it('should trim whitespace from search text', () => {
      const result = searchReservations(mockReservations, '  John  ')
      expect(result).toHaveLength(2)
    })
  })
})
