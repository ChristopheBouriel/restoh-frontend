import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest'
import { act } from '@testing-library/react'
import useReservationsStore from '../../store/reservationsStore'
import * as reservationsApi from '../../api/reservationsApi'

// Mock the API
vi.mock('../../api/reservationsApi')

// Mock data
const mockReservations = [
  {
    id: 'reservation-001',
    userId: 'client1',
    userEmail: 'client1@example.com',
    userName: 'Jean Dupont',
    phone: '06 12 34 56 78',
    date: '2025-02-15',
    time: '19:30',
    guests: 4,
    status: 'confirmed',
    tableNumber: 12,
    specialRequests: 'Table by the window',
    createdAt: '2024-01-20T14:30:00Z',
    updatedAt: '2024-01-20T14:30:00Z'
  },
  {
    id: 'reservation-002',
    userId: 'client2',
    userEmail: 'client2@example.com',
    userName: 'Marie Martin',
    phone: '07 98 76 54 32',
    date: '2025-01-15',
    time: '20:00',
    guests: 2,
    status: 'confirmed',
    tableNumber: null,
    specialRequests: 'Allergie aux fruits de mer',
    createdAt: '2024-01-21T10:15:00Z',
    updatedAt: '2024-01-21T10:15:00Z'
  },
  {
    id: 'reservation-003',
    userId: 'client1',
    userEmail: 'client1@example.com',
    userName: 'Jean Dupont',
    phone: '06 12 34 56 78',
    date: '2024-12-20',
    time: '19:00',
    guests: 6,
    status: 'completed',
    tableNumber: 8,
    specialRequests: 'Birthday',
    createdAt: '2024-01-19T16:45:00Z',
    updatedAt: '2024-01-24T21:30:00Z'
  },
  {
    id: 'reservation-004',
    userId: 'client3',
    userEmail: 'client3@example.com',
    userName: 'Sophie Durand',
    phone: '07 11 22 33 44',
    date: '2025-01-10',
    time: '12:30',
    guests: 3,
    status: 'cancelled',
    tableNumber: null,
    specialRequests: '',
    createdAt: '2024-01-22T09:20:00Z',
    updatedAt: '2024-01-23T14:10:00Z'
  }
]

describe('ReservationsStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-01T12:00:00Z'))

    // Reset store state
    act(() => {
      useReservationsStore.setState({
        reservations: [],
        isAdminData: false,
        isLoading: false,
        error: null
      })
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // 1. INITIAL STATE
  describe('Initial State', () => {
    test('should have correct initial state', () => {
      const state = useReservationsStore.getState()

      expect(state.reservations).toEqual([])
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
      expect(state.isAdminData).toBe(false)
    })
  })

  // 2. FETCH RESERVATIONS
  describe('fetchReservations', () => {
    test('should fetch admin reservations successfully', async () => {
      reservationsApi.getRecentReservations.mockResolvedValue({
        success: true,
        data: mockReservations
      })

      const { fetchReservations } = useReservationsStore.getState()

      const result = await fetchReservations(true) // admin mode

      expect(result.success).toBe(true)
      expect(reservationsApi.getRecentReservations).toHaveBeenCalledWith({ limit: 1000 })

      const state = useReservationsStore.getState()
      expect(state.reservations).toEqual(mockReservations)
      expect(state.isAdminData).toBe(true)
      expect(state.isLoading).toBe(false)
    })

    test('should fetch user reservations successfully', async () => {
      const userReservations = [mockReservations[0]]
      reservationsApi.getUserReservations.mockResolvedValue({
        success: true,
        data: userReservations
      })

      const { fetchReservations } = useReservationsStore.getState()

      const result = await fetchReservations(false) // user mode

      expect(result.success).toBe(true)
      expect(reservationsApi.getUserReservations).toHaveBeenCalled()

      const state = useReservationsStore.getState()
      expect(state.reservations).toEqual(userReservations)
      expect(state.isAdminData).toBe(false)
    })

    test('should handle fetch error', async () => {
      reservationsApi.getRecentReservations.mockResolvedValue({
        success: false,
        error: 'Network error'
      })

      const { fetchReservations } = useReservationsStore.getState()

      const result = await fetchReservations(true)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Network error')

      const state = useReservationsStore.getState()
      expect(state.error).toBe('Network error')
      expect(state.isLoading).toBe(false)
    })

    test('should handle API exception', async () => {
      reservationsApi.getUserReservations.mockRejectedValue({
        error: 'Server unavailable'
      })

      const { fetchReservations } = useReservationsStore.getState()

      const result = await fetchReservations(false)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Server unavailable')
    })
  })

  // 3. FETCH RESERVATION BY ID
  describe('fetchReservationById', () => {
    test('should fetch single reservation successfully', async () => {
      const reservation = mockReservations[0]
      reservationsApi.getReservationById.mockResolvedValue({
        success: true,
        data: reservation
      })

      const { fetchReservationById } = useReservationsStore.getState()

      const result = await fetchReservationById('reservation-001')

      expect(result.success).toBe(true)
      expect(result.reservation).toEqual(reservation)
      expect(reservationsApi.getReservationById).toHaveBeenCalledWith('reservation-001')
    })

    test('should handle not found error', async () => {
      reservationsApi.getReservationById.mockResolvedValue({
        success: false,
        error: 'Reservation not found'
      })

      const { fetchReservationById } = useReservationsStore.getState()

      const result = await fetchReservationById('nonexistent')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Reservation not found')
    })
  })

  // 4. CREATE RESERVATION
  describe('createReservation', () => {
    test('should create reservation successfully', async () => {
      const newReservation = {
        id: 'reservation-new',
        userId: 'user123',
        userEmail: 'test@example.com',
        userName: 'Test User',
        phone: '06 12 34 56 78',
        date: '2025-03-15',
        time: '19:00',
        guests: 4,
        status: 'confirmed',
        specialRequests: 'Quiet table'
      }

      reservationsApi.createReservation.mockResolvedValue({
        success: true,
        data: newReservation
      })

      const { createReservation } = useReservationsStore.getState()

      const result = await createReservation({
        date: '2025-03-15',
        time: '19:00',
        guests: 4,
        specialRequests: 'Quiet table'
      })

      expect(result.success).toBe(true)
      expect(result.reservationId).toBe('reservation-new')

      const state = useReservationsStore.getState()
      expect(state.reservations).toContainEqual(newReservation)
      expect(state.isLoading).toBe(false)
    })

    test('should handle creation error with details', async () => {
      reservationsApi.createReservation.mockResolvedValue({
        success: false,
        error: 'Slot not available',
        code: 'SLOT_UNAVAILABLE',
        details: { suggestedTimes: ['18:00', '20:00'] }
      })

      const { createReservation } = useReservationsStore.getState()

      const result = await createReservation({
        date: '2025-03-15',
        time: '19:00',
        guests: 4
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Slot not available')
      expect(result.code).toBe('SLOT_UNAVAILABLE')
      expect(result.details).toEqual({ suggestedTimes: ['18:00', '20:00'] })
    })
  })

  // 5. UPDATE RESERVATION STATUS (Admin)
  describe('updateReservationStatus', () => {
    test('should update status successfully', async () => {
      reservationsApi.updateReservationStatus.mockResolvedValue({
        success: true
      })
      reservationsApi.getRecentReservations.mockResolvedValue({
        success: true,
        data: mockReservations.map(r =>
          r.id === 'reservation-002' ? { ...r, status: 'confirmed' } : r
        )
      })

      const { updateReservationStatus } = useReservationsStore.getState()

      const result = await updateReservationStatus('reservation-002', 'confirmed')

      expect(result.success).toBe(true)
      expect(reservationsApi.updateReservationStatus).toHaveBeenCalledWith('reservation-002', 'confirmed')
      // Should refetch reservations after update
      expect(reservationsApi.getRecentReservations).toHaveBeenCalled()
    })

    test('should handle update error', async () => {
      reservationsApi.updateReservationStatus.mockResolvedValue({
        success: false,
        error: 'Invalid status transition'
      })

      const { updateReservationStatus } = useReservationsStore.getState()

      const result = await updateReservationStatus('reservation-001', 'invalid')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid status transition')
    })
  })

  // 6. ASSIGN TABLE
  describe('assignTable', () => {
    test('should assign table successfully', async () => {
      reservationsApi.assignTable.mockResolvedValue({
        success: true
      })
      reservationsApi.getRecentReservations.mockResolvedValue({
        success: true,
        data: mockReservations.map(r =>
          r.id === 'reservation-002' ? { ...r, tableNumber: 15, status: 'confirmed' } : r
        )
      })

      const { assignTable } = useReservationsStore.getState()

      const result = await assignTable('reservation-002', 15)

      expect(result.success).toBe(true)
      expect(reservationsApi.assignTable).toHaveBeenCalledWith('reservation-002', 15)
    })

    test('should handle assign table error', async () => {
      reservationsApi.assignTable.mockResolvedValue({
        success: false,
        error: 'Table already occupied'
      })

      const { assignTable } = useReservationsStore.getState()

      const result = await assignTable('reservation-002', 5)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Table already occupied')
    })
  })

  // 7. UPDATE RESERVATION (User)
  describe('updateReservation', () => {
    test('should update reservation successfully', async () => {
      const updatedReservation = {
        ...mockReservations[0],
        guests: 6,
        specialRequests: 'Updated request'
      }

      // Setup initial state
      act(() => {
        useReservationsStore.setState({ reservations: [mockReservations[0]] })
      })

      reservationsApi.updateReservation.mockResolvedValue({
        success: true,
        data: updatedReservation
      })

      const { updateReservation } = useReservationsStore.getState()

      const result = await updateReservation('reservation-001', {
        guests: 6,
        specialRequests: 'Updated request'
      })

      expect(result.success).toBe(true)
      expect(result.reservation).toEqual(updatedReservation)

      const state = useReservationsStore.getState()
      expect(state.reservations[0].guests).toBe(6)
    })
  })

  // 8. CANCEL RESERVATION
  describe('cancelReservation', () => {
    test('should cancel reservation successfully', async () => {
      const cancelledReservation = { ...mockReservations[0], status: 'cancelled' }

      act(() => {
        useReservationsStore.setState({ reservations: [mockReservations[0]] })
      })

      reservationsApi.cancelReservation.mockResolvedValue({
        success: true,
        data: cancelledReservation
      })

      const { cancelReservation } = useReservationsStore.getState()

      const result = await cancelReservation('reservation-001')

      expect(result.success).toBe(true)

      const state = useReservationsStore.getState()
      expect(state.reservations[0].status).toBe('cancelled')
    })

    test('should handle cancel error', async () => {
      reservationsApi.cancelReservation.mockResolvedValue({
        success: false,
        error: 'Cannot cancel past reservation',
        code: 'PAST_RESERVATION'
      })

      const { cancelReservation } = useReservationsStore.getState()

      const result = await cancelReservation('reservation-003')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Cannot cancel past reservation')
      expect(result.code).toBe('PAST_RESERVATION')
    })
  })

  // 9. GETTERS (using ReservationService)
  describe('Getters', () => {
    beforeEach(() => {
      act(() => {
        useReservationsStore.setState({ reservations: mockReservations })
      })
    })

    test('should filter reservations by status', () => {
      const { getReservationsByStatus } = useReservationsStore.getState()

      const confirmed = getReservationsByStatus('confirmed')
      expect(confirmed).toHaveLength(2)
      expect(confirmed.every(r => r.status === 'confirmed')).toBe(true)

      const completed = getReservationsByStatus('completed')
      expect(completed).toHaveLength(1)
      expect(completed[0].status).toBe('completed')
    })

    test('should filter reservations by user', () => {
      const { getReservationsByUser } = useReservationsStore.getState()

      const client1Reservations = getReservationsByUser('client1')
      expect(client1Reservations).toHaveLength(2)
      expect(client1Reservations.every(r => r.userId === 'client1')).toBe(true)
    })

    test('should get today\'s reservations', () => {
      // Add a reservation for today (2025-01-01)
      const todayReservation = {
        ...mockReservations[0],
        id: 'today-res',
        date: '2025-01-01'
      }

      act(() => {
        useReservationsStore.setState({
          reservations: [...mockReservations, todayReservation]
        })
      })

      const { getTodaysReservations } = useReservationsStore.getState()
      const todaysResult = getTodaysReservations()

      expect(todaysResult).toHaveLength(1)
      expect(todaysResult[0].date).toBe('2025-01-01')
    })

    test('should get upcoming reservations (future + not cancelled, sorted)', () => {
      const { getUpcomingReservations } = useReservationsStore.getState()
      const upcoming = getUpcomingReservations()

      // Should exclude past dates (2024-12-20) and cancelled reservations
      // reservation-001 (2025-02-15, confirmed)
      // reservation-002 (2025-01-15, confirmed)
      // reservation-004 (2025-01-10, cancelled) - excluded
      expect(upcoming).toHaveLength(2)

      // Should be sorted by date
      expect(upcoming[0].date).toBe('2025-01-15')
      expect(upcoming[1].date).toBe('2025-02-15')

      // Should not contain cancelled reservations
      expect(upcoming.every(r => r.status !== 'cancelled')).toBe(true)
    })
  })

  // 10. STATISTICS
  describe('Statistics', () => {
    test('should calculate reservation statistics correctly', () => {
      // Add today's reservations
      const todayReservations = [
        { ...mockReservations[0], id: 'today-1', date: '2025-01-01', status: 'confirmed', guests: 4 },
        { ...mockReservations[1], id: 'today-2', date: '2025-01-01', status: 'seated', guests: 2 }
      ]

      act(() => {
        useReservationsStore.setState({
          reservations: [...mockReservations, ...todayReservations]
        })
      })

      const { getReservationsStats } = useReservationsStore.getState()
      const stats = getReservationsStats()

      // Total: 4 mockReservations + 2 today = 6
      expect(stats.total).toBe(6)
      // confirmed: reservation-001, reservation-002, today-1 = 3
      expect(stats.confirmed).toBe(3)
      // seated: today-2 = 1
      expect(stats.seated).toBe(1)
      // completed: reservation-003 = 1
      expect(stats.completed).toBe(1)
      // cancelled: reservation-004 = 1
      expect(stats.cancelled).toBe(1)
      // Today: today-1, today-2 = 2
      expect(stats.todayTotal).toBe(2)
      expect(stats.todayConfirmed).toBe(1)
      expect(stats.todaySeated).toBe(1)
    })

    test('should handle empty reservations for statistics', () => {
      act(() => {
        useReservationsStore.setState({ reservations: [] })
      })

      const { getReservationsStats } = useReservationsStore.getState()
      const stats = getReservationsStats()

      expect(stats.total).toBe(0)
      expect(stats.confirmed).toBe(0)
      expect(stats.seated).toBe(0)
      expect(stats.todayTotal).toBe(0)
    })
  })

  // 11. LOADING STATES
  describe('Loading States', () => {
    test('should set loading state during fetch', async () => {
      let resolvePromise
      reservationsApi.getRecentReservations.mockImplementation(() =>
        new Promise(resolve => { resolvePromise = resolve })
      )

      const { fetchReservations } = useReservationsStore.getState()

      const fetchPromise = fetchReservations(true)

      // Should be loading while waiting
      expect(useReservationsStore.getState().isLoading).toBe(true)

      // Resolve the promise
      resolvePromise({ success: true, data: [] })
      await fetchPromise

      // Should not be loading after completion
      expect(useReservationsStore.getState().isLoading).toBe(false)
    })
  })

  // 12. ERROR HANDLING
  describe('Error Handling', () => {
    test('should set and clear errors', () => {
      const { setError, clearError } = useReservationsStore.getState()

      act(() => {
        setError('Test error')
      })
      expect(useReservationsStore.getState().error).toBe('Test error')

      act(() => {
        clearError()
      })
      expect(useReservationsStore.getState().error).toBeNull()
    })
  })
})
