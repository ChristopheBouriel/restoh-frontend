import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useReservationsStore = create(
  persist(
    (set, get) => ({
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
          // Calculer la date de demain
          const tomorrow = new Date()
          tomorrow.setDate(tomorrow.getDate() + 1)
          const tomorrowStr = tomorrow.toISOString().split('T')[0]
          
          // Données initiales pour la démo
          const initialReservations = [
            {
              id: 'reservation-001',
              userId: 'client',
              userEmail: 'client@example.com',
              userName: 'Jean Dupont',
              phone: '06 12 34 56 78',
              date: tomorrowStr,
              time: '19:30',
              guests: 4,
              status: 'confirmed', // pending, confirmed, seated, completed, cancelled
              tableNumber: 12,
              specialRequests: 'Table près de la fenêtre',
              createdAt: '2024-01-20T14:30:00Z',
              updatedAt: '2024-01-20T14:30:00Z'
            },
            {
              id: 'reservation-002',
              userId: 'client2',
              userEmail: 'marie@example.com',
              userName: 'Marie Martin',
              phone: '07 98 76 54 32',
              date: '2024-01-25',
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
              userId: 'client3',
              userEmail: 'paul@example.com',
              userName: 'Paul Leblanc',
              phone: '06 55 44 33 22',
              date: '2024-01-24',
              time: '19:00',
              guests: 6,
              status: 'completed',
              tableNumber: 8,
              specialRequests: 'Anniversaire - décoration table',
              createdAt: '2024-01-19T16:45:00Z',
              updatedAt: '2024-01-24T21:30:00Z'
            },
            {
              id: 'reservation-004',
              userId: 'client4',
              userEmail: 'sophie@example.com',
              userName: 'Sophie Durand',
              phone: '07 11 22 33 44',
              date: '2024-01-26',
              time: '12:30',
              guests: 3,
              status: 'cancelled',
              tableNumber: null,
              specialRequests: '',
              createdAt: '2024-01-22T09:20:00Z',
              updatedAt: '2024-01-23T14:10:00Z'
            },
            {
              id: 'reservation-000',
              userId: 'client',
              userEmail: 'client@example.com',
              userName: 'Jean Dupont',
              phone: '06 12 34 56 78',
              date: '2024-01-24',
              time: '19:30',
              guests: 4,
              status: 'completed',
              tableNumber: 1,
              specialRequests: 'Table au fond de la salle',
              createdAt: '2024-01-20T14:30:00Z',
              updatedAt: '2024-01-20T14:30:00Z'
            },
          ]
          
          set({ reservations: initialReservations })
          localStorage.setItem('admin-reservations', JSON.stringify(initialReservations))
        }
      },

      // Créer une nouvelle réservation
      createReservation: async (reservationData) => {
        set({ isLoading: true })
        
        try {
          // Simulation d'appel API
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

      getReservationsByDate: (date) => {
        return get().reservations.filter(reservation => reservation.date === date)
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
    }),
    {
      name: 'reservations-storage',
      partialize: (state) => ({ 
        reservations: state.reservations 
      }),
    }
  )
)

export default useReservationsStore