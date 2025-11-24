import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import * as reservationsApi from '../api/reservationsApi'
import { getTodayLocalDate, normalizeDateString } from '../utils/dateUtils'

const useReservationsStore = create(
  persist(
    (set, get) => ({
      // State
      reservations: [],
      isLoading: false,
      error: null,

      // Actions
      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      clearError: () => set({ error: null }),

      // Fetch reservations based on role
      fetchReservations: async (isAdmin = false, forceRefresh = false) => {
        // If admin mode and not forcing refresh, always fetch from API (don't use cache)
        if (isAdmin || forceRefresh) {
          // Clear state first to avoid showing stale data
          set({ reservations: [], isLoading: true, error: null })

          try {
            const result = isAdmin
              ? await reservationsApi.getRecentReservations({ limit: 1000 })
              : await reservationsApi.getUserReservations()

            if (result.success) {
              // Handle multiple possible response structures
              const reservationsData = result.data || result.reservations || []

              set({
                reservations: reservationsData,
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
            const errorMessage = error.error || 'Error loading reservations'
            set({
              error: errorMessage,
              isLoading: false
            })
            return { success: false, error: errorMessage }
          }
        }

        // For non-admin, use cached data if available
        const cachedReservations = get().reservations
        if (cachedReservations.length > 0) {
          return { success: true }
        }

        // If no cache, fetch from API
        set({ isLoading: true, error: null })

        try {
          const result = await reservationsApi.getUserReservations()

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
          const errorMessage = error.error || 'Error loading reservations'
          set({
            error: errorMessage,
            isLoading: false
          })
          return { success: false, error: errorMessage }
        }
      },

      // Fetch specific reservation
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
          const errorMessage = error.error || 'Error loading reservation'
          set({
            error: errorMessage,
            isLoading: false
          })
          return { success: false, error: errorMessage }
        }
      },

      // Create new reservation
      createReservation: async (reservationData) => {
        set({ isLoading: true, error: null })

        try {
          const result = await reservationsApi.createReservation(reservationData)

          if (result.success) {
            // Add new reservation to state directly
            const newReservation = result.data
            set({
              reservations: [...get().reservations, newReservation],
              isLoading: false
            })
            return { success: true, reservationId: newReservation.id }
          } else {
            set({
              error: result.error,
              isLoading: false
            })
            // Return complete error structure including code and details
            return {
              success: false,
              error: result.error,
              code: result.code,
              details: result.details
            }
          }
        } catch (error) {
          const errorMessage = error.error || 'Error creating reservation'
          set({
            error: errorMessage,
            isLoading: false
          })
          return { success: false, error: errorMessage }
        }
      },

      // Update reservation status (admin)
      updateReservationStatus: async (reservationId, newStatus) => {
        set({ isLoading: true, error: null })

        try {
          const result = await reservationsApi.updateReservationStatus(reservationId, newStatus)

          if (result.success) {
            // Reload reservations after update
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
          const errorMessage = error.error || 'Error updating status'
          set({
            error: errorMessage,
            isLoading: false
          })
          return { success: false, error: errorMessage }
        }
      },

      // Assign table to reservation (admin)
      assignTable: async (reservationId, tableNumber) => {
        set({ isLoading: true, error: null })

        try {
          // Note: Auto-confirmation logic (pending -> confirmed) when assigning table
          // is now handled on the BACKEND
          const result = await reservationsApi.assignTable(reservationId, tableNumber)

          if (result.success) {
            // Reload reservations after assignment
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
          const errorMessage = error.error || 'Error assigning table'
          set({
            error: errorMessage,
            isLoading: false
          })
          return { success: false, error: errorMessage }
        }
      },

      // Update user's own reservation
      updateReservation: async (reservationId, reservationData) => {
        set({ isLoading: true, error: null })

        try {
          const result = await reservationsApi.updateReservation(reservationId, reservationData)

          if (result.success) {
            // Update the reservation in state
            const updatedReservation = result.data
            set({
              reservations: get().reservations.map(r =>
                r.id === reservationId ? updatedReservation : r
              ),
              isLoading: false
            })
            return { success: true, reservation: updatedReservation }
          } else {
            set({
              error: result.error,
              isLoading: false
            })
            // Return complete error structure including code and details
            return {
              success: false,
              error: result.error,
              code: result.code,
              details: result.details
            }
          }
        } catch (error) {
          const errorMessage = error.error || 'Error updating reservation'
          set({
            error: errorMessage,
            isLoading: false
          })
          return { success: false, error: errorMessage }
        }
      },

      // Cancel user's own reservation
      cancelReservation: async (reservationId) => {
        set({ isLoading: true, error: null })

        try {
          const result = await reservationsApi.cancelReservation(reservationId)

          if (result.success) {
            // Update the reservation status in state
            const updatedReservation = result.data
            set({
              reservations: get().reservations.map(r =>
                r.id === reservationId ? updatedReservation : r
              ),
              isLoading: false
            })
            return { success: true, reservation: updatedReservation }
          } else {
            set({
              error: result.error,
              isLoading: false
            })
            // Return complete error structure including code and details
            return {
              success: false,
              error: result.error,
              code: result.code,
              details: result.details
            }
          }
        } catch (error) {
          const errorMessage = error.error || 'Error canceling reservation'
          set({
            error: errorMessage,
            isLoading: false
          })
          return { success: false, error: errorMessage }
        }
      },

      // Getters (local computations on loaded data)
      getReservationsByStatus: (status) => {
        return get().reservations.filter(reservation => reservation.status === status)
      },

      getReservationsByDate: (date) => {
        return get().reservations.filter(reservation => reservation.date === date)
      },

      getReservationsByUser: (userId) => {
        return get().reservations.filter(reservation =>
          reservation.userId === userId || reservation.user?.id === userId
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

      // Statistics (computed locally)
      getReservationsStats: () => {
        const reservations = get().reservations
        const today = getTodayLocalDate()

        // Normalize dates before comparison
        const todaysReservations = reservations.filter(r => {
          if (!r.date) return false
          const reservationDate = normalizeDateString(r.date)
          return reservationDate === today
        })

        return {
          total: reservations.length,
          confirmed: reservations.filter(r => r.status === 'confirmed').length,
          seated: reservations.filter(r => r.status === 'seated').length,
          completed: reservations.filter(r => r.status === 'completed').length,
          cancelled: reservations.filter(r => r.status === 'cancelled').length,
          noShow: reservations.filter(r => r.status === 'no-show').length,
          todayTotal: todaysReservations.length,
          todayConfirmed: todaysReservations.filter(r => r.status === 'confirmed').length,
          todaySeated: todaysReservations.filter(r => r.status === 'seated').length,
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
      name: 'reservations-storage-v2', // Changed name to force fresh cache
      partialize: (state) => ({
        reservations: state.reservations // Persist user's reservations only
      }),
    }
  )
)

export default useReservationsStore
