/**
 * EXAMPLE: Unit tests for reservation services
 * Shows how easy it is to test pure business logic
 *
 * No mocking needed! Just input → output testing
 * Compare this to testing the store which requires:
 * - Mocking Zustand
 * - Mocking API calls
 * - Testing async state changes
 */

import { describe, test, expect } from 'vitest'
import {
  validateReservationData,
  validateGuests,
  validateReservationDate,
  canModifyReservation,
  canCancelReservation
} from './reservationValidator'
import {
  filterByStatus,
  getTodaysReservations,
  getUpcomingReservations,
  searchReservations
} from './reservationFilters'
import {
  calculateReservationStats,
  calculateCancellationRate,
  getPeakHours
} from './reservationStats'
import { ReservationService } from './reservationService'

// ============================================
// VALIDATION TESTS (Pure functions)
// ============================================

describe('Reservation Validator', () => {
  describe('validateGuests', () => {
    test('should accept valid guest count', () => {
      const result = validateGuests(4)
      expect(result.valid).toBe(true)
    })

    test('should reject zero guests', () => {
      const result = validateGuests(0)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('At least 1 guest is required')
    })

    test('should reject too many guests', () => {
      const result = validateGuests(15)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Maximum')
    })
  })

  describe('validateReservationDate', () => {
    test('should reject past dates', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const dateString = yesterday.toISOString().split('T')[0]

      const result = validateReservationDate(dateString)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Cannot book in the past')
    })

    test('should accept today', () => {
      const today = new Date().toISOString().split('T')[0]
      const result = validateReservationDate(today)
      expect(result.valid).toBe(true)
    })

    test('should reject dates too far in future', () => {
      const farFuture = new Date()
      farFuture.setMonth(farFuture.getMonth() + 6)
      const dateString = farFuture.toISOString().split('T')[0]

      const result = validateReservationDate(dateString)
      expect(result.valid).toBe(false)
    })
  })

  describe('validateReservationData', () => {
    test('should validate complete valid data', () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      const data = {
        date: tomorrow.toISOString().split('T')[0],
        guests: 4,
        slot: 7,
        phone: '06 12 34 56 78'
      }

      const result = validateReservationData(data)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('should collect all validation errors', () => {
      const data = {
        date: '', // Invalid
        guests: 0, // Invalid
        slot: 999, // Invalid
        phone: 'invalid' // Invalid
      }

      const result = validateReservationData(data)
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe('canModifyReservation', () => {
    test('should allow modifying pending reservations', () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      const reservation = {
        status: 'pending',
        date: tomorrow.toISOString().split('T')[0]
      }

      const result = canModifyReservation(reservation)
      expect(result.canModify).toBe(true)
    })

    test('should prevent modifying completed reservations', () => {
      const reservation = {
        status: 'completed',
        date: new Date().toISOString().split('T')[0]
      }

      const result = canModifyReservation(reservation)
      expect(result.canModify).toBe(false)
      expect(result.reason).toContain('completed')
    })

    test('should prevent modifying past reservations', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      const reservation = {
        status: 'confirmed',
        date: yesterday.toISOString().split('T')[0]
      }

      const result = canModifyReservation(reservation)
      expect(result.canModify).toBe(false)
      expect(result.reason).toBe('Cannot modify past reservations')
    })
  })
})

// ============================================
// FILTER TESTS (Pure functions)
// ============================================

describe('Reservation Filters', () => {
  const mockReservations = [
    { id: '1', status: 'confirmed', date: '2025-01-15', userName: 'John Doe', slot: 7 },
    { id: '2', status: 'pending', date: '2025-01-15', userName: 'Jane Smith', slot: 8 },
    { id: '3', status: 'cancelled', date: '2025-01-16', userName: 'Bob Wilson', slot: 7 },
    { id: '4', status: 'confirmed', date: '2025-01-20', userName: 'Alice Brown', slot: 12 }
  ]

  describe('filterByStatus', () => {
    test('should filter by status', () => {
      const confirmed = filterByStatus(mockReservations, 'confirmed')
      expect(confirmed).toHaveLength(2)
      expect(confirmed.every(r => r.status === 'confirmed')).toBe(true)
    })

    test('should return all if no status provided', () => {
      const all = filterByStatus(mockReservations, null)
      expect(all).toHaveLength(4)
    })

    test('should handle empty array', () => {
      const result = filterByStatus([], 'confirmed')
      expect(result).toHaveLength(0)
    })
  })

  describe('searchReservations', () => {
    test('should search by user name', () => {
      const results = searchReservations(mockReservations, 'john')
      expect(results).toHaveLength(1)
      expect(results[0].userName).toBe('John Doe')
    })

    test('should be case insensitive', () => {
      const results = searchReservations(mockReservations, 'JANE')
      expect(results).toHaveLength(1)
    })

    test('should return all if search is empty', () => {
      const results = searchReservations(mockReservations, '')
      expect(results).toHaveLength(4)
    })
  })
})

// ============================================
// STATS TESTS (Pure functions)
// ============================================

describe('Reservation Stats', () => {
  const mockReservations = [
    { id: '1', status: 'confirmed', guests: 4, slot: 7 },
    { id: '2', status: 'confirmed', guests: 2, slot: 8 },
    { id: '3', status: 'cancelled', guests: 6, slot: 7 },
    { id: '4', status: 'completed', guests: 3, slot: 12 }
  ]

  describe('calculateReservationStats', () => {
    test('should calculate correct totals', () => {
      const stats = calculateReservationStats(mockReservations)

      expect(stats.total).toBe(4)
      expect(stats.confirmed).toBe(2)
      expect(stats.cancelled).toBe(1)
      expect(stats.completed).toBe(1)
    })

    test('should calculate total guests for active reservations only', () => {
      const stats = calculateReservationStats(mockReservations)

      // Only confirmed (4+2) and completed (3) count
      expect(stats.totalGuests).toBe(9)
    })

    test('should handle empty array', () => {
      const stats = calculateReservationStats([])

      expect(stats.total).toBe(0)
      expect(stats.totalGuests).toBe(0)
    })
  })

  describe('calculateCancellationRate', () => {
    test('should calculate cancellation rate', () => {
      const stats = calculateCancellationRate(mockReservations)

      // 1 cancelled out of 4 = 25%
      expect(stats.cancellationRate).toBe(25.0)
      expect(stats.totalCancelled).toBe(1)
    })

    test('should handle no cancellations', () => {
      const noCancellations = mockReservations.filter(r => r.status !== 'cancelled')
      const stats = calculateCancellationRate(noCancellations)

      expect(stats.cancellationRate).toBe(0)
    })
  })

  describe('getPeakHours', () => {
    test('should identify peak slots', () => {
      const peaks = getPeakHours(mockReservations)

      // Slot 7 appears twice
      expect(peaks[0].slot).toBe(7)
      expect(peaks[0].count).toBe(2)
    })

    test('should sort by count descending', () => {
      const peaks = getPeakHours(mockReservations)

      for (let i = 0; i < peaks.length - 1; i++) {
        expect(peaks[i].count).toBeGreaterThanOrEqual(peaks[i + 1].count)
      }
    })
  })
})

// ============================================
// SERVICE ORCHESTRATION TESTS
// ============================================

describe('ReservationService', () => {
  describe('getAvailableStatusTransitions', () => {
    test('should return correct transitions for pending', () => {
      const transitions = ReservationService.getAvailableStatusTransitions('pending')
      expect(transitions).toEqual(['confirmed', 'cancelled'])
    })

    test('should return empty for completed (terminal state)', () => {
      const transitions = ReservationService.getAvailableStatusTransitions('completed')
      expect(transitions).toEqual([])
    })
  })

  describe('isValidStatusTransition', () => {
    test('should allow valid transitions', () => {
      const result = ReservationService.isValidStatusTransition('pending', 'confirmed')
      expect(result.valid).toBe(true)
    })

    test('should reject invalid transitions', () => {
      const result = ReservationService.isValidStatusTransition('completed', 'confirmed')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Cannot change status')
    })
  })

  describe('formatReservation', () => {
    test('should add computed properties', () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      const reservation = {
        id: '1',
        status: 'confirmed',
        date: tomorrow.toISOString().split('T')[0],
        guests: 4
      }

      const formatted = ReservationService.formatReservation(reservation)

      expect(formatted.displayDate).toBeDefined()
      expect(formatted.isPast).toBe(false)
      expect(formatted.isCancellable).toBe(true)
      expect(formatted.isModifiable).toBe(true)
      expect(formatted.availableTransitions).toBeDefined()
    })
  })

  describe('suggestTables', () => {
    const availableTables = [
      { number: 1, capacity: 2 },
      { number: 2, capacity: 2 },
      { number: 3, capacity: 4 },
      { number: 4, capacity: 6 },
      { number: 5, capacity: 8 }
    ]

    test('should suggest smallest fitting table', () => {
      const suggested = ReservationService.suggestTables(3, availableTables)
      expect(suggested).toEqual([3]) // Table 3 has capacity 4
    })

    test('should suggest perfect fit when available', () => {
      const suggested = ReservationService.suggestTables(2, availableTables)
      expect(suggested).toEqual([1]) // Table 1 has capacity 2
    })

    test('should suggest multiple tables for large groups', () => {
      const suggested = ReservationService.suggestTables(10, availableTables)
      expect(suggested.length).toBeGreaterThan(1)
    })
  })
})

/**
 * TESTING SUMMARY:
 *
 * ✅ Pure functions are EASY to test
 * ✅ No mocking required
 * ✅ Fast tests (no async operations)
 * ✅ 100% code coverage achievable
 * ✅ Tests document business rules
 *
 * Compare this to testing the current store:
 * ❌ Must mock Zustand
 * ❌ Must mock API calls
 * ❌ Must test async state changes
 * ❌ Harder to achieve coverage
 * ❌ Tests are slower
 */
