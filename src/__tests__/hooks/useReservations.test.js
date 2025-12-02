import { renderHook, act } from '@testing-library/react'
import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest'
import '@testing-library/jest-dom'
import { useReservations } from '../../hooks/useReservations'
import { useAuth } from '../../hooks/useAuth'
import useReservationsStore from '../../store/reservationsStore'
import { toast } from 'react-hot-toast'
import * as reservationsApi from '../../api/reservationsApi'

// Mock the API (not the store!)
vi.mock('../../api/reservationsApi')

// Mock external dependencies
vi.mock('react-hot-toast')

// Mock useAuth hook since it's another hook dependency
vi.mock('../../hooks/useAuth')

// Mock data
const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  phone: '123456789'
}

const mockReservations = [
  {
    id: '1',
    userId: 'user-1',
    date: '2025-02-15',
    time: '19:00',
    guests: 4,
    status: 'confirmed',
    specialRequests: 'Table by the window'
  },
  {
    id: '2',
    userId: 'user-1',
    date: '2025-01-10',
    time: '20:00',
    guests: 2,
    status: 'confirmed',
    specialRequests: ''
  },
  {
    id: '3',
    userId: 'user-1',
    date: '2024-12-20',
    time: '18:30',
    guests: 6,
    status: 'cancelled',
    specialRequests: 'Birthday'
  },
  {
    id: '4',
    userId: 'other-user',
    date: '2025-02-20',
    time: '19:30',
    guests: 3,
    status: 'confirmed',
    specialRequests: ''
  }
]

describe('useReservations Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Mock current date to 2025-01-01
    vi.setSystemTime(new Date('2025-01-01'))

    // Reset store state with user's reservations (backend filters by user)
    act(() => {
      useReservationsStore.setState({
        reservations: mockReservations.filter(r => r.userId === 'user-1'),
        isLoading: false,
        error: null,
        isAdminData: false
      })
    })

    // Default authenticated user mock
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser
    })

    // Default toast mocks
    vi.mocked(toast.success).mockImplementation(() => {})
    vi.mocked(toast.error).mockImplementation(() => {})

    // Default API mocks
    reservationsApi.createReservation.mockResolvedValue({
      success: true,
      data: { id: 'new-1', ...mockReservations[0] }
    })
    reservationsApi.updateReservation.mockResolvedValue({
      success: true,
      data: { ...mockReservations[0], date: '2025-03-20' }
    })
    reservationsApi.cancelReservation.mockResolvedValue({
      success: true,
      data: { ...mockReservations[0], status: 'cancelled' }
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  // 1. ÉTAT INITIAL ET CALCULS (4 tests)
  test('should return empty reservations when user is not authenticated', () => {
    vi.mocked(useAuth).mockReturnValue({ user: null })
    // When not authenticated, store would have empty reservations
    act(() => {
      useReservationsStore.setState({
        reservations: [],
        isLoading: false,
        error: null
      })
    })

    const { result } = renderHook(() => useReservations())

    expect(result.current.reservations).toEqual([])
    expect(result.current.upcomingReservations).toEqual([])
    expect(result.current.totalReservations).toBe(0)
    expect(result.current.confirmedReservations).toBe(0)
    expect(result.current.completedReservations).toBe(0)
  })

  test('should filter reservations for authenticated user only', () => {
    const { result } = renderHook(() => useReservations())

    expect(result.current.reservations).toHaveLength(3)

    // Should only contain user's reservations, not other users
    const userIds = result.current.reservations.map(r => r.userId)
    expect(userIds.every(id => id === 'user-1')).toBe(true)
  })

  test('should calculate upcoming reservations correctly', () => {
    const { result } = renderHook(() => useReservations())

    // Upcoming = future dates + not cancelled, sorted by date
    expect(result.current.upcomingReservations).toHaveLength(2)

    const upcomingDates = result.current.upcomingReservations.map(r => r.date)
    expect(upcomingDates).toEqual(['2025-01-10', '2025-02-15'])

    // Should exclude cancelled and past reservations
    const statuses = result.current.upcomingReservations.map(r => r.status)
    expect(statuses).not.toContain('cancelled')
  })

  test('should calculate reservation statistics correctly', () => {
    const { result } = renderHook(() => useReservations())

    expect(result.current.totalReservations).toBe(3)
    expect(result.current.confirmedReservations).toBe(2) // Both future reservations are confirmed
    expect(result.current.completedReservations).toBe(0)
  })

  // 2. ACTIONS CRÉER/MODIFIER/SUPPRIMER (4 tests)
  test('should create reservation successfully when user is authenticated', async () => {
    const { result } = renderHook(() => useReservations())

    const reservationData = {
      date: '2025-03-15',
      time: '19:00',
      guests: 4,
      requests: 'Quiet table'
    }

    let createResult
    await act(async () => {
      createResult = await result.current.createReservation(reservationData)
    })

    // Only reservation data is sent - user info is attached by backend auth middleware
    expect(reservationsApi.createReservation).toHaveBeenCalledWith({
      date: '2025-03-15',
      time: '19:00',
      guests: 4,
      requests: 'Quiet table'
    })

    expect(toast.success).toHaveBeenCalledWith('Reservation created successfully!')
    expect(createResult.success).toBe(true)
  })

  test('should return error when creating reservation without authentication', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: null })

    const { result } = renderHook(() => useReservations())

    const reservationData = {
      date: '2025-03-15',
      time: '19:00',
      guests: 4
    }

    let createResult
    await act(async () => {
      createResult = await result.current.createReservation(reservationData)
    })

    expect(toast.error).toHaveBeenCalledWith('You must be logged in to create a reservation')
    expect(reservationsApi.createReservation).not.toHaveBeenCalled()
    expect(createResult).toEqual({ success: false, error: 'User not authenticated' })
  })

  test('should update reservation successfully', async () => {
    const { result } = renderHook(() => useReservations())

    const reservationData = {
      date: '2025-03-20',
      slot: 8,
      guests: 6,
      requests: 'Modification'
    }

    await act(async () => {
      await result.current.updateReservation('1', reservationData)
    })

    expect(reservationsApi.updateReservation).toHaveBeenCalledWith('1', reservationData)
    expect(toast.success).toHaveBeenCalledWith('Reservation updated successfully!')
  })

  test('should cancel reservation with confirmation', async () => {
    // Mock window.confirm to return true
    const mockConfirm = vi.fn().mockReturnValue(true)
    vi.stubGlobal('confirm', mockConfirm)

    const { result } = renderHook(() => useReservations())

    let cancelResult
    await act(async () => {
      cancelResult = await result.current.cancelReservation('1')
    })

    expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to cancel this reservation?')
    expect(cancelResult.success).toBe(true)
    expect(reservationsApi.cancelReservation).toHaveBeenCalledWith('1')
    expect(toast.success).toHaveBeenCalledWith('Reservation cancelled successfully')
  })

  // 3. VALIDATION ET GESTION D'ERREURS (4 tests)
  test('should validate reservation data correctly', () => {
    const { result } = renderHook(() => useReservations())

    // Valid data
    const validData = {
      date: '2025-03-15',
      slot: 5, // Time slot number
      guests: 4,
      contactPhone: '0123456789',
      tableNumber: [12] // At least one table must be selected
    }
    expect(result.current.validateReservationData(validData)).toEqual([])

    // Invalid data - missing fields
    const invalidData = {
      date: '',
      slot: null,
      guests: 0,
      contactPhone: '',
      tableNumber: []
    }
    const errors = result.current.validateReservationData(invalidData)
    expect(errors).toContain('Date is required')
    expect(errors).toContain('Time slot is required')
    expect(errors).toContain('Number of guests must be at least 1')
    expect(errors).toContain('Contact phone is required')
    expect(errors).toContain('At least one table must be selected')
  })

  test('should reject past dates in validation', () => {
    const { result } = renderHook(() => useReservations())

    const pastData = {
      date: '2024-12-31',
      time: '19:00',
      guests: 4
    }

    const errors = result.current.validateReservationData(pastData)
    expect(errors).toContain('Cannot book in the past')
  })

  test('should handle store errors gracefully with toast', async () => {
    reservationsApi.createReservation.mockResolvedValue({
      success: false,
      error: 'Store error'
    })

    const { result } = renderHook(() => useReservations())

    const reservationData = {
      date: '2025-03-15',
      time: '19:00',
      guests: 4
    }

    let createResult
    await act(async () => {
      createResult = await result.current.createReservation(reservationData)
    })

    expect(toast.error).toHaveBeenCalledWith('Store error')
    expect(createResult.success).toBe(false)
    expect(createResult.error).toBe('Store error')
  })

  test('should return error with details when backend provides suggestedTables', async () => {
    const errorWithDetails = {
      success: false,
      error: 'Tables 5 and 6 are unavailable',
      details: {
        unavailableTables: [5, 6],
        suggestedTables: [7, 8, 9],
        reason: 'Already reserved'
      }
    }

    reservationsApi.createReservation.mockResolvedValue(errorWithDetails)

    const { result } = renderHook(() => useReservations())

    const reservationData = {
      date: '2025-03-15',
      time: '19:00',
      guests: 4
    }

    let createResult
    await act(async () => {
      createResult = await result.current.createReservation(reservationData)
    })

    // Should NOT show toast when details are present (InlineAlert will handle it)
    expect(toast.error).not.toHaveBeenCalled()
    expect(createResult.details).toEqual(errorWithDetails.details)
  })

  // 4. UTILITAIRES ET FORMATAGE (2 tests)
  test('should format dates correctly', () => {
    const { result } = renderHook(() => useReservations())

    expect(result.current.formatDate('2025-03-15')).toBe('15/03/2025')
    expect(result.current.formatDate('2025-12-25')).toBe('25/12/2025')
  })

  test('should format date and time correctly', () => {
    const { result } = renderHook(() => useReservations())

    expect(result.current.formatDateTime('2025-03-15', '19:00')).toBe('15/03/2025 at 19:00')
    expect(result.current.formatDateTime('2025-12-25', '20:30')).toBe('25/12/2025 at 20:30')
  })

  // 5. CAS LIMITES (2 tests)
  test('should handle window.confirm cancellation', async () => {
    // Mock window.confirm to return false
    const mockConfirm = vi.fn().mockReturnValue(false)
    vi.stubGlobal('confirm', mockConfirm)

    const { result } = renderHook(() => useReservations())

    let cancelResult
    await act(async () => {
      cancelResult = await result.current.cancelReservation('1')
    })

    expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to cancel this reservation?')
    expect(cancelResult.success).toBe(false)
    expect(cancelResult.error).toBe('Cancellation aborted by user')
    expect(reservationsApi.cancelReservation).not.toHaveBeenCalled()
  })

  test('should handle empty reservation data', () => {
    const { result } = renderHook(() => useReservations())

    const errors = result.current.validateReservationData({})
    expect(errors).toContain('Date is required')
    expect(errors).toContain('Time slot is required')
    expect(errors).toContain('Number of guests must be at least 1')
    expect(errors).toContain('Contact phone is required')
  })

  // 6. TESTS D'AUTHENTIFICATION POUR TOUTES LES ACTIONS (1 test additionnel)
  test('should require authentication for all reservation actions', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: null })

    const { result } = renderHook(() => useReservations())

    let updateResult
    // Test update without auth
    await act(async () => {
      updateResult = await result.current.updateReservation('1', {})
    })

    expect(toast.error).toHaveBeenCalledWith('You must be logged in to update a reservation')
    expect(updateResult).toEqual({ success: false, error: 'User not authenticated' })
  })

  // 7. TESTS POUR LES DÉTAILS D'ERREUR (2 tests additionnels)
  test('should return full error with details for update reservation', async () => {
    const errorWithDetails = {
      success: false,
      error: 'Tables unavailable during update',
      details: {
        suggestedTables: [10, 11],
        reason: 'Tables just booked'
      }
    }

    reservationsApi.updateReservation.mockResolvedValue(errorWithDetails)

    const { result } = renderHook(() => useReservations())

    let updateResult
    await act(async () => {
      updateResult = await result.current.updateReservation('1', { date: '2025-03-15' })
    })

    // Should NOT show toast when details are present
    expect(toast.error).not.toHaveBeenCalled()
    expect(toast.success).not.toHaveBeenCalled()
    expect(updateResult.details).toEqual(errorWithDetails.details)
  })

  test('should handle network errors gracefully', async () => {
    reservationsApi.createReservation.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useReservations())

    let createResult
    await act(async () => {
      createResult = await result.current.createReservation({
        date: '2025-03-15',
        time: '19:00',
        guests: 4
      })
    })

    // Store catches network errors and returns formatted error message
    expect(toast.error).toHaveBeenCalledWith('Error creating reservation')
    expect(createResult).toEqual({ success: false, error: 'Error creating reservation' })
  })
})
