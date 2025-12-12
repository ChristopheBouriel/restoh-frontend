import { create } from 'zustand'
import * as statsApi from '../api/statsApi'

/**
 * Dashboard Statistics Store
 *
 * Fetches and stores aggregated statistics from the backend
 * for the admin dashboard.
 */
const useStatsStore = create((set) => ({
  // State
  stats: null,
  isLoading: false,
  error: null,

  // Actions
  fetchStats: async () => {
    set({ isLoading: true, error: null })

    try {
      const result = await statsApi.getDashboardStats()

      if (result.success) {
        set({
          stats: result.data,
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
      const errorMessage = error.error || 'Error loading statistics'
      set({
        error: errorMessage,
        isLoading: false
      })
      return { success: false, error: errorMessage }
    }
  },

  clearStats: () => set({ stats: null, error: null }),

  clearError: () => set({ error: null })
}))

export default useStatsStore
