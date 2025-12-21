import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import * as reservationsApi from '../api/reservationsApi'
import { ReservationService } from '../services/reservations'

// Compare two arrays of reservations by their IDs and updatedAt timestamps
const reservationsChanged = (oldReservations, newReservations) => {
  if (oldReservations.length !== newReservations.length) return true

  const oldMap = new Map(oldReservations.map(r => [r.id, r.updatedAt]))
  for (const reservation of newReservations) {
    if (oldMap.get(reservation.id) !== reservation.updatedAt) return true
  }
  return false
}

const useReservationsStore = create(
  persist(
    (set, get) => ({
      // State
      reservations: [],
      isAdminData: false, // Track if current data is admin data (should not be persisted)
      isLoading: false,
      error: null,

      // Actions
      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      clearError: () => set({ error: null }),

      // Fetch reservations based on role
      fetchReservations: async (isAdmin = false) => {
        // If admin mode, always fetch from API (don't use cache)
        if (isAdmin) {
          set({ isAdminData: true, isLoading: true, error: null })

          try {
            const result = await reservationsApi.getRecentReservations({ limit: 1000 })

            if (result.success) {
              // Handle multiple possible response structures
              const newReservations = result.data || result.reservations || []
              const currentReservations = get().reservations

              // Only update if data actually changed
              if (reservationsChanged(currentReservations, newReservations)) {
                set({
                  reservations: newReservations,
                  isAdminData: true,
                  isLoading: false,
                  error: null
                })
              } else {
                set({ isLoading: false, error: null })
              }
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

        // For non-admin users: always fetch fresh data
        set({ isAdminData: false, isLoading: true, error: null })

        try {
          const result = await reservationsApi.getUserReservations()

          if (result.success) {
            const newReservations = result.data || []
            const currentReservations = get().reservations

            // Only update if data actually changed
            if (reservationsChanged(currentReservations, newReservations)) {
              set({
                reservations: newReservations,
                isAdminData: false,
                isLoading: false,
                error: null
              })
            } else {
              set({ isLoading: false, error: null })
            }
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

      // Getters (delegate to ReservationService for business logic)
      getReservationsByStatus: (status) => {
        return ReservationService.filter(get().reservations, { status })
      },

      getReservationsByDate: (date) => {
        return ReservationService.filter(get().reservations, { date })
      },

      getReservationsByUser: (userId) => {
        return ReservationService.filter(get().reservations, { userId })
      },

      getTodaysReservations: () => {
        return ReservationService.getTodaysReservations(get().reservations)
      },

      getUpcomingReservations: () => {
        return ReservationService.getUpcomingReservations(get().reservations)
      },

      // Statistics (delegate to ReservationService)
      getReservationsStats: () => {
        return ReservationService.calculateStats(get().reservations)
      }
    }),
    {
      name: 'reservations-storage-v3',
      partialize: (state) => ({
        // Only persist user data, never admin data (security)
        reservations: state.isAdminData ? [] : state.reservations,
        isAdminData: false // Always reset to false on persist
      }),
    }
  )
)

export default useReservationsStore
