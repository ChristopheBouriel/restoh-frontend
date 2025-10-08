import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import * as reservationsApi from '../api/reservationsApi'

const useReservationsStore = create(
  persist(
    (set, get) => ({
      // État
      reservations: [],
      isLoading: false,
      error: null,

      // Actions
      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      clearError: () => set({ error: null }),

      // Récupérer les réservations selon le rôle
      fetchReservations: async (isAdmin = false) => {
        set({ isLoading: true, error: null })

        try {
          const result = isAdmin
            ? await reservationsApi.getAllReservations()
            : await reservationsApi.getUserReservations()

          if (result.success) {
            set({
              reservations: result.data || [],
              isLoading: false,
              error: null
            })
            return { success: true }
          } else {
            set({
              error: result.error,
              isLoading: false
            })
            return { success: false, error: result.error }
          }
        } catch (error) {
          const errorMessage = error.error || 'Erreur lors du chargement des réservations'
          set({
            error: errorMessage,
            isLoading: false
          })
          return { success: false, error: errorMessage }
        }
      },

      // Récupérer une réservation spécifique
      fetchReservationById: async (reservationId) => {
        set({ isLoading: true, error: null })

        try {
          const result = await reservationsApi.getReservationById(reservationId)

          if (result.success) {
            set({ isLoading: false, error: null })
            return { success: true, reservation: result.data }
          } else {
            set({
              error: result.error,
              isLoading: false
            })
            return { success: false, error: result.error }
          }
        } catch (error) {
          const errorMessage = error.error || 'Erreur lors du chargement de la réservation'
          set({
            error: errorMessage,
            isLoading: false
          })
          return { success: false, error: errorMessage }
        }
      },

      // Créer une nouvelle réservation
      createReservation: async (reservationData) => {
        set({ isLoading: true, error: null })

        try {
          const result = await reservationsApi.createReservation(reservationData)

          if (result.success) {
            // Recharger les réservations après création
            await get().fetchReservations()
            set({ isLoading: false })
            return { success: true, reservationId: result.data._id || result.data.id }
          } else {
            set({
              error: result.error,
              isLoading: false
            })
            return { success: false, error: result.error }
          }
        } catch (error) {
          const errorMessage = error.error || 'Erreur lors de la création de la réservation'
          set({
            error: errorMessage,
            isLoading: false
          })
          return { success: false, error: errorMessage }
        }
      },

      // Mettre à jour le statut d'une réservation (admin)
      updateReservationStatus: async (reservationId, newStatus) => {
        set({ isLoading: true, error: null })

        try {
          const result = await reservationsApi.updateReservationStatus(reservationId, newStatus)

          if (result.success) {
            // Recharger les réservations après mise à jour
            await get().fetchReservations(true) // true = admin
            set({ isLoading: false })
            return { success: true }
          } else {
            set({
              error: result.error,
              isLoading: false
            })
            return { success: false, error: result.error }
          }
        } catch (error) {
          const errorMessage = error.error || 'Erreur lors de la mise à jour du statut'
          set({
            error: errorMessage,
            isLoading: false
          })
          return { success: false, error: errorMessage }
        }
      },

      // Assigner une table à une réservation (admin)
      assignTable: async (reservationId, tableNumber) => {
        set({ isLoading: true, error: null })

        try {
          // Note: La logique d'auto-confirmation (pending -> confirmed) quand on assigne une table
          // est maintenant gérée côté BACKEND
          const result = await reservationsApi.assignTable(reservationId, tableNumber)

          if (result.success) {
            // Recharger les réservations après assignation
            await get().fetchReservations(true) // true = admin
            set({ isLoading: false })
            return { success: true }
          } else {
            set({
              error: result.error,
              isLoading: false
            })
            return { success: false, error: result.error }
          }
        } catch (error) {
          const errorMessage = error.error || 'Erreur lors de l\'assignation de table'
          set({
            error: errorMessage,
            isLoading: false
          })
          return { success: false, error: errorMessage }
        }
      },

      // Getters (calculs locaux sur les données chargées)
      getReservationsByStatus: (status) => {
        return get().reservations.filter(reservation => reservation.status === status)
      },

      getReservationsByDate: (date) => {
        return get().reservations.filter(reservation => reservation.date === date)
      },

      getReservationsByUser: (userId) => {
        return get().reservations.filter(reservation =>
          reservation.userId === userId || reservation.user?._id === userId
        )
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

      // Statistiques (calculées localement)
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
