/**
 * EXAMPLE: Simplified reservationsStore using service layer
 * This is how the store would look after refactoring
 *
 * Compare this to the current reservationsStore.js (12KB, 360+ lines)
 * This version: ~150 lines, much cleaner, easier to test
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import * as reservationsApi from '../../api/reservationsApi'
import { ReservationService } from './index'

const useReservationsStore = create(
  persist(
    (set, get) => ({
      // ============================================
      // STATE (just data, no logic)
      // ============================================
      reservations: [],
      isLoading: false,
      error: null,

      // ============================================
      // ACTIONS (orchestration only, logic in services)
      // ============================================

      /**
       * Fetch reservations
       * Business logic delegated to API layer
       */
      fetchReservations: async (isAdmin = false, forceRefresh = false) => {
        // Admin always fetches fresh data
        if (isAdmin || forceRefresh) {
          set({ reservations: [], isLoading: true, error: null })

          try {
            const result = isAdmin
              ? await reservationsApi.getRecentReservations({ limit: 1000 })
              : await reservationsApi.getUserReservations()

            // Use service to normalize response
            const normalized = ReservationService.normalizeApiResponse(result)

            if (normalized.success) {
              set({
                reservations: normalized.data || [],
                isLoading: false,
                error: null
              })
              return { success: true }
            } else {
              set({
                error: normalized.error,
                isLoading: false
              })
              return { success: false, error: normalized.error }
            }
          } catch (error) {
            set({
              error: 'Error loading reservations',
              isLoading: false
            })
            return { success: false, error: 'Error loading reservations' }
          }
        }

        // For non-admin, use cache if available
        const cachedReservations = get().reservations
        if (cachedReservations.length > 0) {
          return { success: true }
        }

        // No cache, fetch from API
        return get().fetchReservations(false, true)
      },

      /**
       * Create reservation
       * Validation logic delegated to service
       */
      createReservation: async (reservationData) => {
        // 1. Validate using service (business logic)
        const validation = ReservationService.validate(reservationData)
        if (!validation.valid) {
          return {
            success: false,
            error: validation.errors[0],
            errors: validation.errors
          }
        }

        set({ isLoading: true, error: null })

        try {
          // 2. Prepare data using service
          const preparedData = ReservationService.prepareReservationData(reservationData)

          // 3. Call API
          const result = await reservationsApi.createReservation(preparedData)

          // 4. Normalize response
          const normalized = ReservationService.normalizeApiResponse(result)

          if (normalized.success) {
            // Update state
            set({
              reservations: [...get().reservations, normalized.data],
              isLoading: false
            })
            return { success: true, reservationId: normalized.data.id }
          } else {
            set({
              error: normalized.error,
              isLoading: false
            })
            return {
              success: false,
              error: normalized.error,
              code: normalized.code,
              details: normalized.details
            }
          }
        } catch (error) {
          set({
            error: 'Error creating reservation',
            isLoading: false
          })
          return { success: false, error: 'Error creating reservation' }
        }
      },

      /**
       * Update reservation status
       * Validation logic delegated to service
       */
      updateReservationStatus: async (reservationId, newStatus) => {
        // Find reservation
        const reservation = get().reservations.find(r => r.id === reservationId)

        // Validate status transition using service (business logic)
        const validation = ReservationService.isValidStatusTransition(
          reservation?.status,
          newStatus
        )

        if (!validation.valid) {
          return { success: false, error: validation.error }
        }

        set({ isLoading: true, error: null })

        try {
          const result = await reservationsApi.updateReservationStatus(reservationId, newStatus)
          const normalized = ReservationService.normalizeApiResponse(result)

          if (normalized.success) {
            // Reload reservations
            await get().fetchReservations(true)
            set({ isLoading: false })
            return { success: true }
          } else {
            set({
              error: normalized.error,
              isLoading: false
            })
            return { success: false, error: normalized.error }
          }
        } catch (error) {
          set({
            error: 'Error updating status',
            isLoading: false
          })
          return { success: false, error: 'Error updating status' }
        }
      },

      // ... other async actions (update, cancel, assignTable) follow same pattern

      // ============================================
      // GETTERS (use service layer for business logic)
      // ============================================

      /**
       * Get reservations by status
       * Filtering logic in service
       */
      getReservationsByStatus: (status) => {
        return ReservationService.filter(get().reservations, { status })
      },

      /**
       * Get today's reservations
       * Date logic in service
       */
      getTodaysReservations: () => {
        return ReservationService.getTodaysReservations(get().reservations)
      },

      /**
       * Get upcoming reservations
       * Filtering and sorting logic in service
       */
      getUpcomingReservations: () => {
        return ReservationService.getUpcomingReservations(get().reservations)
      },

      /**
       * Calculate statistics
       * All calculation logic in service
       */
      getReservationsStats: () => {
        return ReservationService.calculateStats(get().reservations)
      },

      /**
       * Search reservations
       * Search logic in service
       */
      searchReservations: (searchText) => {
        return ReservationService.search(get().reservations, searchText)
      },

      /**
       * Get analytics
       * Complex analytics logic in service
       */
      getAnalytics: () => {
        return ReservationService.getAnalytics(get().reservations)
      }
    }),
    {
      name: 'reservations-storage-v3'
    }
  )
)

export default useReservationsStore

/**
 * BENEFITS OF THIS APPROACH:
 *
 * 1. TESTABILITY ✅
 *    - Service functions are pure → easy to unit test
 *    - No need to mock Zustand store
 *    - Can test business logic independently
 *
 * 2. REUSABILITY ✅
 *    - Service logic can be used anywhere (not tied to store)
 *    - Easy to use in React Query hooks later
 *    - Can be used in Node.js scripts, CLIs, etc.
 *
 * 3. MAINTAINABILITY ✅
 *    - Clear separation of concerns
 *    - Each service file has a single responsibility
 *    - Easier to find and modify business logic
 *
 * 4. DOCUMENTATION ✅
 *    - JSDoc in services makes business rules explicit
 *    - New developers can understand logic faster
 *
 * 5. MIGRATION READY ✅
 *    - Easy to migrate to React Query later
 *    - Services can be reused as-is with React Query
 *    - Store becomes even simpler (or removed entirely)
 *
 * NEXT STEPS:
 * - Write tests for service functions (very easy!)
 * - Gradually refactor other stores (orders, menu, etc.)
 * - Consider migrating to React Query for server state
 */
