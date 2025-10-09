import { renderHook, act } from '@testing-library/react'
import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest'
import '@testing-library/jest-dom'
import { useReservations } from '../../hooks/useReservations'
import { useAuth } from '../../hooks/useAuth'
import useReservationsStore from '../../store/reservationsStore'
import { toast } from 'react-hot-toast'

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
    status: 'pending',
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

// Mock hooks and dependencies
vi.mock('../../hooks/useAuth')
vi.mock('../../store/reservationsStore')
vi.mock('react-hot-toast', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn()
  }
}))

const mockCreateReservation = vi.fn()
const mockUpdateReservationStatus = vi.fn()
const mockGetReservationsByUser = vi.fn()

describe('useReservations Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock current date to 2025-01-01
    vi.setSystemTime(new Date('2025-01-01'))
    
    // Default mock setup
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser
    })

    vi.mocked(useReservationsStore).mockReturnValue({
      reservations: mockReservations,
      createReservation: mockCreateReservation,
      updateReservationStatus: mockUpdateReservationStatus,
      getReservationsByUser: mockGetReservationsByUser,
      getUpcomingReservations: vi.fn()
    })

    // Mock getReservationsByUser to return user's reservations
    mockGetReservationsByUser.mockImplementation((userId) => 
      mockReservations.filter(r => r.userId === userId)
    )

    // Mock successful operations by default
    mockCreateReservation.mockResolvedValue({ success: true })
    mockUpdateReservationStatus.mockResolvedValue({ success: true })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  // 1. ÉTAT INITIAL ET CALCULS (4 tests)
  test('should return empty reservations when user is not authenticated', () => {
    vi.mocked(useAuth).mockReturnValue({ user: null })

    const { result } = renderHook(() => useReservations())

    expect(result.current.reservations).toEqual([])
    expect(result.current.upcomingReservations).toEqual([])
    expect(result.current.totalReservations).toBe(0)
    expect(result.current.confirmedReservations).toBe(0)
    expect(result.current.pendingReservations).toBe(0)
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
    expect(result.current.confirmedReservations).toBe(1)
    expect(result.current.pendingReservations).toBe(1)
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

    expect(mockCreateReservation).toHaveBeenCalledWith({
      date: '2025-03-15',
      time: '19:00',
      guests: 4,
      requests: 'Quiet table',
      specialRequests: 'Quiet table',
      userId: 'user-1',
      userEmail: 'test@example.com',
      userName: 'Test User',
      phone: '123456789'
    })

    expect(toast.success).toHaveBeenCalledWith('Reservation created successfully!')
    expect(createResult).toEqual({ success: true })
  })

  test('should throw error when creating reservation without authentication', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: null })
    
    const { result } = renderHook(() => useReservations())

    const reservationData = {
      date: '2025-03-15',
      time: '19:00', 
      guests: 4
    }

    await act(async () => {
      await expect(result.current.createReservation(reservationData))
        .rejects.toThrow('User not authenticated')
    })

    expect(toast.error).toHaveBeenCalledWith('You must be logged in to create a reservation')
    expect(mockCreateReservation).not.toHaveBeenCalled()
  })

  test('should update reservation successfully', async () => {
    const { result } = renderHook(() => useReservations())

    const reservationData = {
      date: '2025-03-20',
      time: '20:00',
      guests: 6,
      requests: 'Modification'
    }

    await act(async () => {
      await result.current.updateReservation('1', reservationData)
    })

    expect(mockUpdateReservationStatus).toHaveBeenCalledWith('1', 'pending')
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
    expect(cancelResult).toBe(true)
    expect(mockUpdateReservationStatus).toHaveBeenCalledWith('1', 'cancelled')
    expect(toast.success).toHaveBeenCalledWith('Reservation cancelled')
  })

  // 3. VALIDATION ET GESTION D'ERREURS (3 tests) 
  test('should validate reservation data correctly', () => {
    const { result } = renderHook(() => useReservations())

    // Valid data
    const validData = {
      date: '2025-03-15',
      time: '19:00',
      guests: 4
    }
    expect(result.current.validateReservationData(validData)).toEqual([])

    // Invalid data - missing fields
    const invalidData = {
      date: '',
      time: '',
      guests: 0
    }
    const errors = result.current.validateReservationData(invalidData)
    expect(errors).toContain('Date is required')
    expect(errors).toContain('Time is required')
    expect(errors).toContain('Number of guests must be at least 1')
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

  test('should handle store errors gracefully', async () => {
    mockCreateReservation.mockResolvedValue({ success: false, error: 'Store error' })
    
    const { result } = renderHook(() => useReservations())

    const reservationData = {
      date: '2025-03-15',
      time: '19:00',
      guests: 4
    }

    await act(async () => {
      await expect(result.current.createReservation(reservationData))
        .rejects.toThrow('Store error')
    })

    expect(toast.error).toHaveBeenCalledWith('Error creating reservation')
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
    expect(cancelResult).toBe(false)
    expect(mockUpdateReservationStatus).not.toHaveBeenCalled()
  })

  test('should handle empty reservation data', () => {
    const { result } = renderHook(() => useReservations())

    const errors = result.current.validateReservationData({})
    expect(errors).toContain('Date is required')
    expect(errors).toContain('Time is required')
    expect(errors).toContain('Number of guests must be at least 1')
  })

  // 6. TESTS D'AUTHENTIFICATION POUR TOUTES LES ACTIONS (1 test additionnel)
  test('should require authentication for all reservation actions', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: null })
    
    const { result } = renderHook(() => useReservations())

    // Test update without auth
    await act(async () => {
      await expect(result.current.updateReservation('1', {}))
        .rejects.toThrow('User not authenticated')
    })

    expect(toast.error).toHaveBeenCalledWith('You must be logged in to update a reservation')
  })
})