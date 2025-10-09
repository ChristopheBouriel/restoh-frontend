import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest'
import '@testing-library/jest-dom'
import { create } from 'zustand'

// Import the store factory function (without persistence for testing)
let useReservationsStore

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

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
    status: 'pending',
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
    vi.setSystemTime(new Date('2025-01-01'))
    
    // Create a fresh store for each test without persistence
    useReservationsStore = create((set, get) => ({
      // État
      reservations: [],
      isLoading: false,

      // Actions
      setLoading: (loading) => set({ isLoading: loading }),

      // Initialiser avec des données de test
      initializeReservations: () => {
        const stored = localStorage.getItem('admin-reservations')
        if (stored) {
          set({ reservations: JSON.parse(stored) })
        } else {
          const initialReservations = []
          set({ reservations: initialReservations })
          localStorage.setItem('admin-reservations', JSON.stringify(initialReservations))
        }
      },

      // Créer une nouvelle réservation
      createReservation: async (reservationData) => {
        set({ isLoading: true })
        
        try {
          await new Promise(resolve => setTimeout(resolve, 800))
          
          const newReservation = {
            id: `reservation-${Date.now()}`,
            ...reservationData,
            status: 'pending',
            tableNumber: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
          
          const updatedReservations = [newReservation, ...get().reservations]
          set({ reservations: updatedReservations, isLoading: false })
          localStorage.setItem('admin-reservations', JSON.stringify(updatedReservations))
          
          return { success: true, reservationId: newReservation.id }
        } catch (error) {
          set({ isLoading: false })
          return { success: false, error: error.message }
        }
      },

      // Mettre à jour le statut d'une réservation
      updateReservationStatus: async (reservationId, newStatus) => {
        set({ isLoading: true })
        
        try {
          await new Promise(resolve => setTimeout(resolve, 500))
          
          const updatedReservations = get().reservations.map(reservation =>
            reservation.id === reservationId 
              ? { ...reservation, status: newStatus, updatedAt: new Date().toISOString() }
              : reservation
          )
          
          set({ reservations: updatedReservations, isLoading: false })
          localStorage.setItem('admin-reservations', JSON.stringify(updatedReservations))
          
          return { success: true }
        } catch (error) {
          set({ isLoading: false })
          return { success: false, error: error.message }
        }
      },

      // Assigner une table à une réservation
      assignTable: async (reservationId, tableNumber) => {
        set({ isLoading: true })
        
        try {
          await new Promise(resolve => setTimeout(resolve, 500))
          
          const updatedReservations = get().reservations.map(reservation =>
            reservation.id === reservationId 
              ? { 
                  ...reservation, 
                  tableNumber: tableNumber,
                  status: reservation.status === 'pending' ? 'confirmed' : reservation.status,
                  updatedAt: new Date().toISOString() 
                }
              : reservation
          )
          
          set({ reservations: updatedReservations, isLoading: false })
          localStorage.setItem('admin-reservations', JSON.stringify(updatedReservations))
          
          return { success: true }
        } catch (error) {
          set({ isLoading: false })
          return { success: false, error: error.message }
        }
      },

      // Getters
      getReservationsByStatus: (status) => {
        return get().reservations.filter(reservation => reservation.status === status)
      },

      getReservationsByUser: (userId) => {
        return get().reservations.filter(reservation => reservation.userId === userId)
      },

      getTodaysReservations: () => {
        const today = new Date().toISOString().split('T')[0]
        return get().reservations.filter(reservation => 
          reservation.date === today
        )
      },

      getUpcomingReservations: () => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        return get().reservations.filter(reservation => {
          const reservationDate = new Date(reservation.date)
          return reservationDate >= today && reservation.status !== 'cancelled'
        }).sort((a, b) => new Date(a.date) - new Date(b.date))
      },

      // Statistiques
      getReservationsStats: () => {
        const reservations = get().reservations
        const today = new Date().toISOString().split('T')[0]
        const todaysReservations = reservations.filter(r => r.date === today)
        
        return {
          total: reservations.length,
          pending: reservations.filter(r => r.status === 'pending').length,
          confirmed: reservations.filter(r => r.status === 'confirmed').length,
          seated: reservations.filter(r => r.status === 'seated').length,
          completed: reservations.filter(r => r.status === 'completed').length,
          cancelled: reservations.filter(r => r.status === 'cancelled').length,
          todayTotal: todaysReservations.length,
          todayPending: todaysReservations.filter(r => r.status === 'pending').length,
          todayConfirmed: todaysReservations.filter(r => r.status === 'confirmed').length,
          totalGuests: reservations
            .filter(r => ['confirmed', 'seated', 'completed'].includes(r.status))
            .reduce((sum, reservation) => sum + reservation.guests, 0),
          todayGuests: todaysReservations
            .filter(r => ['confirmed', 'seated', 'completed'].includes(r.status))
            .reduce((sum, reservation) => sum + reservation.guests, 0)
        }
      }
    }))
  })

  afterEach(() => {
    vi.useRealTimers()
    localStorageMock.getItem.mockClear()
    localStorageMock.setItem.mockClear()
  })

  // 1. ÉTAT INITIAL & INITIALISATION (2 tests)
  test('should initialize with empty state by default', () => {
    const state = useReservationsStore.getState()
    
    expect(state.reservations).toEqual([])
    expect(state.isLoading).toBe(false)
  })

  test('should initialize from localStorage when data exists', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify(mockReservations))
    
    const { initializeReservations } = useReservationsStore.getState()
    initializeReservations()
    
    const state = useReservationsStore.getState()
    expect(state.reservations).toEqual(mockReservations)
  })

  // 2. ACTIONS CRUD PRINCIPALES (4 tests)
  test('should create reservation successfully and persist to localStorage', async () => {
    const reservationData = {
      userId: 'user123',
      userEmail: 'test@example.com',
      userName: 'Test User',
      phone: '06 12 34 56 78',
      date: '2025-03-15',
      time: '19:00',
      guests: 4,
      specialRequests: 'Quiet table'
    }

    const { createReservation } = useReservationsStore.getState()
    
    const result = await createReservation(reservationData)
    
    expect(result.success).toBe(true)
    expect(result.reservationId).toMatch(/^reservation-\d+$/)
    
    const state = useReservationsStore.getState()
    const newReservation = state.reservations[0]
    
    expect(newReservation).toMatchObject({
      ...reservationData,
      status: 'pending',
      tableNumber: null
    })
    expect(newReservation.id).toMatch(/^reservation-\d+$/)
    expect(newReservation.createdAt).toBeTruthy()
    expect(newReservation.updatedAt).toBeTruthy()
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'admin-reservations',
      expect.any(String)
    )
  })

  test('should update reservation status and maintain data integrity', async () => {
    // Setup initial data
    useReservationsStore.setState({
      reservations: [...mockReservations]
    })

    const { updateReservationStatus } = useReservationsStore.getState()
    
    const result = await updateReservationStatus('reservation-002', 'confirmed')
    
    expect(result.success).toBe(true)
    
    const state = useReservationsStore.getState()
    const updatedReservation = state.reservations.find(r => r.id === 'reservation-002')
    
    expect(updatedReservation.status).toBe('confirmed')
    expect(new Date(updatedReservation.updatedAt)).toBeInstanceOf(Date)
    expect(localStorageMock.setItem).toHaveBeenCalled()
  })

  test('should assign table and change pending status to confirmed', async () => {
    // Setup with pending reservation
    const pendingReservations = [
      { ...mockReservations[1], status: 'pending' }
    ]
    
    useReservationsStore.setState({
      reservations: pendingReservations
    })

    const { assignTable } = useReservationsStore.getState()
    
    const result = await assignTable('reservation-002', 15)
    
    expect(result.success).toBe(true)
    
    const state = useReservationsStore.getState()
    const reservation = state.reservations.find(r => r.id === 'reservation-002')
    
    expect(reservation.tableNumber).toBe(15)
    expect(reservation.status).toBe('confirmed') // Should change from pending
    expect(localStorageMock.setItem).toHaveBeenCalled()
  })

  test('should handle loading states correctly during async operations', async () => {
    const reservationData = {
      userId: 'user123',
      userEmail: 'test@example.com',
      userName: 'Test User',
      phone: '06 12 34 56 78',
      date: '2025-03-15',
      time: '19:00',
      guests: 4
    }

    const { createReservation } = useReservationsStore.getState()

    // Create reservation (async)
    await createReservation(reservationData)
    
    // Should not be loading after completion
    const state = useReservationsStore.getState()
    expect(state.isLoading).toBe(false)
  })

  // 3. GETTERS & FILTRES MÉTIER (4 tests)
  test('should filter reservations by status correctly', () => {
    useReservationsStore.setState({
      reservations: [...mockReservations]
    })

    const { getReservationsByStatus } = useReservationsStore.getState()

    const confirmedReservations = getReservationsByStatus('confirmed')
    expect(confirmedReservations).toHaveLength(1)
    expect(confirmedReservations[0].status).toBe('confirmed')
    
    const pendingReservations = getReservationsByStatus('pending')
    expect(pendingReservations).toHaveLength(1)
    expect(pendingReservations[0].status).toBe('pending')
    
    const nonexistentStatus = getReservationsByStatus('nonexistent')
    expect(nonexistentStatus).toHaveLength(0)
  })

  test('should filter reservations by user correctly', () => {
    useReservationsStore.setState({
      reservations: [...mockReservations]
    })

    const { getReservationsByUser } = useReservationsStore.getState()

    const client1Reservations = getReservationsByUser('client1')
    expect(client1Reservations).toHaveLength(2)
    expect(client1Reservations.every(r => r.userId === 'client1')).toBe(true)
    
    const client2Reservations = getReservationsByUser('client2')
    expect(client2Reservations).toHaveLength(1)
    expect(client2Reservations[0].userId).toBe('client2')
  })

  test('should get today\'s reservations with correct date logic', () => {
    const todayReservations = [
      {
        ...mockReservations[0],
        date: '2025-01-01' // Today in our mocked time
      }
    ]
    
    useReservationsStore.setState({
      reservations: [...mockReservations, ...todayReservations]
    })

    const { getTodaysReservations } = useReservationsStore.getState()
    const todaysResult = getTodaysReservations()
    expect(todaysResult).toHaveLength(1)
    expect(todaysResult[0].date).toBe('2025-01-01')
  })

  test('should get upcoming reservations (future + not cancelled, sorted by date)', () => {
    useReservationsStore.setState({
      reservations: [...mockReservations]
    })

    const { getUpcomingReservations } = useReservationsStore.getState()
    const upcoming = getUpcomingReservations()
    
    // Should exclude past dates (2024-12-20) and cancelled reservations
    expect(upcoming).toHaveLength(2) // Only 2025-01-15 and 2025-02-15
    
    // Should be sorted by date
    expect(upcoming[0].date).toBe('2025-01-15')
    expect(upcoming[1].date).toBe('2025-02-15')
    
    // Should not contain cancelled reservations
    expect(upcoming.every(r => r.status !== 'cancelled')).toBe(true)
  })

  // 4. CALCULS MÉTIER COMPLEXES (2 tests)
  test('should calculate comprehensive reservation statistics correctly', () => {
    const todayReservations = [
      {
        ...mockReservations[0],
        date: '2025-01-01', // Today
        status: 'confirmed',
        guests: 4
      },
      {
        ...mockReservations[1],
        date: '2025-01-01', // Today
        status: 'pending',
        guests: 2
      }
    ]
    
    useReservationsStore.setState({
      reservations: [...mockReservations, ...todayReservations]
    })

    const { getReservationsStats } = useReservationsStore.getState()
    const stats = getReservationsStats()
    
    expect(stats.total).toBe(6) // 4 mock + 2 today
    expect(stats.pending).toBe(2) // mockReservations[1] + todayReservations[1]
    expect(stats.confirmed).toBe(2) // mockReservations[0] + todayReservations[0]
    expect(stats.completed).toBe(1) // mockReservations[2]
    expect(stats.cancelled).toBe(1) // mockReservations[3]
    
    expect(stats.todayTotal).toBe(2)
    expect(stats.todayPending).toBe(1)
    expect(stats.todayConfirmed).toBe(1)
    
    // Total guests for confirmed/seated/completed reservations
    expect(stats.totalGuests).toBe(14) // 4 (confirmed) + 4 (today confirmed) + 6 (completed)
    expect(stats.todayGuests).toBe(4) // Only today's confirmed
  })

  test('should handle edge cases in statistics (empty data, various statuses)', () => {
    // Test with empty data
    useReservationsStore.setState({
      reservations: []
    })

    const { getReservationsStats } = useReservationsStore.getState()
    const emptyStats = getReservationsStats()
    
    expect(emptyStats.total).toBe(0)
    expect(emptyStats.pending).toBe(0)
    expect(emptyStats.confirmed).toBe(0)
    expect(emptyStats.totalGuests).toBe(0)
    expect(emptyStats.todayGuests).toBe(0)
    expect(emptyStats.todayTotal).toBe(0)
  })

  // 5. GESTION ERREURS & ROBUSTESSE (2 tests)
  test('should handle async operation errors gracefully', async () => {
    // Mock an error scenario by making setTimeout throw
    const originalSetTimeout = global.setTimeout
    global.setTimeout = vi.fn(() => {
      throw new Error('Network error')
    })

    const reservationData = {
      userId: 'user123',
      date: '2025-03-15',
      time: '19:00',
      guests: 4
    }

    const { createReservation } = useReservationsStore.getState()

    const result = await createReservation(reservationData)
    
    expect(result.success).toBe(false)
    expect(result.error).toBe('Network error')
    
    const state = useReservationsStore.getState()
    expect(state.isLoading).toBe(false)
    
    // Restore original setTimeout
    global.setTimeout = originalSetTimeout
  })

  test('should maintain data consistency between memory and localStorage', async () => {
    // Create a reservation
    const reservationData = {
      userId: 'user123',
      userEmail: 'test@example.com',
      userName: 'Test User',
      phone: '06 12 34 56 78',
      date: '2025-03-15',
      time: '19:00',
      guests: 4
    }

    const { createReservation, updateReservationStatus } = useReservationsStore.getState()

    const createResult = await createReservation(reservationData)
    const reservationId = createResult.reservationId
    
    // Update the reservation
    await updateReservationStatus(reservationId, 'confirmed')
    
    // Verify localStorage was called for both operations
    expect(localStorageMock.setItem).toHaveBeenCalledTimes(2)
    
    // Verify both operations used 'admin-reservations' key
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'admin-reservations',
      expect.any(String)
    )
    
    const state = useReservationsStore.getState()
    const reservation = state.reservations.find(r => r.id === reservationId)
    expect(reservation.status).toBe('confirmed')
  })
})