import { describe, it, expect } from 'vitest'
import {
  calculateReservationStats,
  calculateDateRangeStats,
  getPeakHours,
  calculateTableUtilization,
  calculateCancellationRate,
  calculateAveragePartySize
} from '../../services/reservations/reservationStats'

describe('reservationStats', () => {
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]

  const mockReservations = [
    {
      id: '1',
      date: today,
      slot: 7,
      status: 'confirmed',
      guests: 4,
      tableNumber: [1, 2]
    },
    {
      id: '2',
      date: today,
      slot: 8,
      status: 'confirmed',
      guests: 2,
      tableNumber: [3]
    },
    {
      id: '3',
      date: tomorrow,
      slot: 7,
      status: 'confirmed',
      guests: 6,
      tableNumber: [4, 5]
    },
    {
      id: '4',
      date: yesterday,
      slot: 7,
      status: 'completed',
      guests: 4,
      tableNumber: [6]
    },
    {
      id: '5',
      date: yesterday,
      slot: 7,
      status: 'cancelled',
      guests: 3,
      tableNumber: [7]
    },
    {
      id: '6',
      date: today,
      slot: 8,
      status: 'no-show',
      guests: 2,
      tableNumber: [8]
    }
  ]

  describe('calculateReservationStats', () => {
    it('should calculate total count', () => {
      const stats = calculateReservationStats(mockReservations)
      expect(stats.total).toBe(6)
    })

    it('should calculate today\'s count', () => {
      const stats = calculateReservationStats(mockReservations)
      expect(stats.todayTotal).toBe(3)
    })

    it('should calculate today\'s guests', () => {
      const stats = calculateReservationStats(mockReservations)
      // Confirmed: 4 + 2, no-show is excluded
      expect(stats.todayGuests).toBe(6)
    })

    it('should calculate total guests (active only)', () => {
      const stats = calculateReservationStats(mockReservations)
      // confirmed: 4+2+6 + completed: 4 = 16
      expect(stats.totalGuests).toBe(16)
    })

    it('should count confirmed reservations', () => {
      const stats = calculateReservationStats(mockReservations)
      expect(stats.confirmed).toBe(3)
    })

    it('should count seated reservations', () => {
      const stats = calculateReservationStats(mockReservations)
      expect(stats.seated).toBe(0)
    })

    it('should count completed reservations', () => {
      const stats = calculateReservationStats(mockReservations)
      expect(stats.completed).toBe(1)
    })

    it('should count cancelled reservations', () => {
      const stats = calculateReservationStats(mockReservations)
      expect(stats.cancelled).toBe(1)
    })

    it('should count no-show reservations', () => {
      const stats = calculateReservationStats(mockReservations)
      expect(stats.noShow).toBe(1)
    })

    it('should handle empty reservations array', () => {
      const stats = calculateReservationStats([])
      expect(stats.total).toBe(0)
      expect(stats.todayTotal).toBe(0)
      expect(stats.confirmed).toBe(0)
    })

    it('should handle null reservations', () => {
      const stats = calculateReservationStats(null)
      expect(stats.total).toBe(0)
      expect(stats.todayTotal).toBe(0)
    })

    it('should exclude cancelled and no-show from active guest count', () => {
      const stats = calculateReservationStats(mockReservations)
      // Should not include cancelled (3) or no-show (2) guests
      expect(stats.totalGuests).toBe(16)
      expect(stats.todayGuests).toBe(6)
    })
  })

  describe('calculateDateRangeStats', () => {
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
    const weekFromNow = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]

    it('should calculate stats for date range', () => {
      const stats = calculateDateRangeStats(mockReservations, weekAgo, weekFromNow)
      expect(stats.total).toBeGreaterThan(0)
    })

    it('should filter by date range', () => {
      const stats = calculateDateRangeStats(mockReservations, today, today)
      expect(stats.total).toBe(3)
    })

    it('should calculate guests in range', () => {
      const stats = calculateDateRangeStats(mockReservations, today, today)
      expect(stats.totalGuests).toBe(8) // All reservations today: 4 + 2 + 2 (no-show)
    })

    it('should handle no reservations in range', () => {
      const futureStart = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
      const futureEnd = new Date(Date.now() + 35 * 86400000).toISOString().split('T')[0]
      const stats = calculateDateRangeStats(mockReservations, futureStart, futureEnd)
      expect(stats.total).toBe(0)
    })

    it('should handle empty reservations', () => {
      const stats = calculateDateRangeStats([], today, tomorrow)
      expect(stats.total).toBe(0)
    })
  })

  describe('getPeakHours', () => {
    it('should identify peak hours', () => {
      const peaks = getPeakHours(mockReservations)
      expect(Array.isArray(peaks)).toBe(true)
      expect(peaks.length).toBeGreaterThan(0)
    })

    it('should return slots with counts', () => {
      const peaks = getPeakHours(mockReservations)
      peaks.forEach(peak => {
        expect(peak).toHaveProperty('slot')
        expect(peak).toHaveProperty('count')
        expect(typeof peak.slot).toBe('number')
        expect(typeof peak.count).toBe('number')
      })
    })

    it('should sort by count descending', () => {
      const peaks = getPeakHours(mockReservations)
      for (let i = 1; i < peaks.length; i++) {
        expect(peaks[i].count).toBeLessThanOrEqual(peaks[i - 1].count)
      }
    })

    it('should show slot 7 as peak (4 reservations)', () => {
      const peaks = getPeakHours(mockReservations)
      const slot7 = peaks.find(p => p.slot === 7)
      expect(slot7).toBeDefined()
      expect(slot7.count).toBe(4) // 3 confirmed + 1 completed = 4
    })

    it('should handle empty reservations', () => {
      const peaks = getPeakHours([])
      expect(peaks).toHaveLength(0)
    })

    it('should handle null reservations', () => {
      const peaks = getPeakHours(null)
      expect(peaks).toHaveLength(0)
    })

    it('should exclude reservations without slot', () => {
      const noSlot = [{ id: '1', date: today, status: 'confirmed', guests: 4 }]
      const peaks = getPeakHours(noSlot)
      expect(peaks).toHaveLength(0)
    })
  })

  describe('calculateTableUtilization', () => {
    it('should calculate utilization rate', () => {
      const totalTables = 15
      const result = calculateTableUtilization(mockReservations, totalTables)

      expect(result).toHaveProperty('totalSlots')
      expect(result).toHaveProperty('usedSlots')
      expect(result).toHaveProperty('utilizationRate')
    })

    it('should calculate correct used slots', () => {
      const totalTables = 15
      const result = calculateTableUtilization(mockReservations, totalTables)
      // 4 active reservations with tableNumber: 3 confirmed + 1 completed
      expect(result.usedSlots).toBe(4)
    })

    it('should calculate utilization percentage', () => {
      const totalTables = 15
      const result = calculateTableUtilization(mockReservations, totalTables)
      expect(result.utilizationRate).toBeGreaterThanOrEqual(0)
      expect(result.utilizationRate).toBeLessThanOrEqual(100)
    })

    it('should handle zero tables', () => {
      const result = calculateTableUtilization(mockReservations, 0)
      expect(result.totalSlots).toBe(0)
      expect(result.usedSlots).toBe(0)
      expect(result.utilizationRate).toBe(0)
    })

    it('should handle empty reservations', () => {
      const result = calculateTableUtilization([], 15)
      expect(result.usedSlots).toBe(0)
      expect(result.utilizationRate).toBe(0)
    })

    it('should handle null reservations', () => {
      const result = calculateTableUtilization(null, 15)
      expect(result.usedSlots).toBe(0)
      expect(result.utilizationRate).toBe(0)
    })

    it('should only count active reservations', () => {
      const activeOnly = [
        { id: '1', date: today, slot: 7, status: 'confirmed', guests: 4, tableNumber: [1] },
        { id: '2', date: today, slot: 8, status: 'confirmed', guests: 2, tableNumber: [2] },
        { id: '3', date: today, slot: 9, status: 'cancelled', guests: 3, tableNumber: [3] }
      ]
      const result = calculateTableUtilization(activeOnly, 15)
      // Only 2 active (confirmed), cancelled excluded
      expect(result.usedSlots).toBe(2)
    })
  })

  describe('calculateCancellationRate', () => {
    it('should calculate cancellation rate', () => {
      const rate = calculateCancellationRate(mockReservations)
      expect(rate).toHaveProperty('totalCancelled')
      expect(rate).toHaveProperty('totalNoShow')
      expect(rate).toHaveProperty('totalCompleted')
      expect(rate).toHaveProperty('cancellationRate')
      expect(rate).toHaveProperty('noShowRate')
      expect(rate).toHaveProperty('completionRate')
    })

    it('should count cancelled reservations correctly', () => {
      const rate = calculateCancellationRate(mockReservations)
      expect(rate.totalCancelled).toBe(1)
    })

    it('should calculate correct percentage', () => {
      const rate = calculateCancellationRate(mockReservations)
      expect(rate.cancellationRate).toBeCloseTo(16.7, 1) // 1/6 * 100 = 16.7
    })

    it('should handle no cancellations', () => {
      const noCancelled = mockReservations.filter(r => r.status !== 'cancelled')
      const rate = calculateCancellationRate(noCancelled)
      expect(rate.totalCancelled).toBe(0)
      expect(rate.cancellationRate).toBe(0)
    })

    it('should handle empty reservations', () => {
      const rate = calculateCancellationRate([])
      expect(rate.totalCancelled).toBe(0)
      expect(rate.cancellationRate).toBe(0)
    })

    it('should handle null reservations', () => {
      const rate = calculateCancellationRate(null)
      expect(rate.totalCancelled).toBe(0)
      expect(rate.cancellationRate).toBe(0)
    })

    it('should round to 2 decimal places', () => {
      const rate = calculateCancellationRate(mockReservations)
      const decimalPlaces = rate.cancellationRate.toString().split('.')[1]?.length || 0
      expect(decimalPlaces).toBeLessThanOrEqual(2)
    })
  })

  describe('calculateAveragePartySize', () => {
    it('should calculate average party size', () => {
      const avg = calculateAveragePartySize(mockReservations)
      expect(typeof avg).toBe('number')
      expect(avg).toBeGreaterThan(0)
    })

    it('should calculate correct average (all reservations)', () => {
      // Total guests: 4+2+6+4+3+2 = 21
      // Total reservations: 6
      // Average: 21/6 = 3.5
      const avg = calculateAveragePartySize(mockReservations)
      expect(avg).toBeCloseTo(3.5, 1)
    })

    it('should calculate average for specific status', () => {
      const avg = calculateAveragePartySize(mockReservations, { status: 'confirmed' })
      // Confirmed: 4+2+6 = 12
      // Count: 3
      // Average: 12/3 = 4
      expect(avg).toBeCloseTo(4, 1)
    })

    it('should filter by status', () => {
      const avg = calculateAveragePartySize(mockReservations, { status: 'confirmed' })
      // Confirmed: 4+2+6 = 12
      // Count: 3
      // Average: 12/3 = 4
      expect(avg).toBeCloseTo(4, 1)
    })

    it('should handle empty reservations', () => {
      const avg = calculateAveragePartySize([])
      expect(avg).toBe(0)
    })

    it('should handle null reservations', () => {
      const avg = calculateAveragePartySize(null)
      expect(avg).toBe(0)
    })

    it('should handle reservations without guests', () => {
      const noGuests = [{ id: '1', date: today, status: 'confirmed' }]
      const avg = calculateAveragePartySize(noGuests)
      expect(avg).toBe(0)
    })

    it('should round to 1 decimal place', () => {
      const avg = calculateAveragePartySize(mockReservations)
      const decimalPlaces = avg.toString().split('.')[1]?.length || 0
      expect(decimalPlaces).toBeLessThanOrEqual(1)
    })
  })
})
