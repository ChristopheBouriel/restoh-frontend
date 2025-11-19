import { create } from 'zustand'
import * as restaurantReviewsApi from '../api/restaurantReviewsApi'

const useRestaurantReviewsStore = create((set, get) => ({
  // State
  reviews: [],
  stats: {
    totalReviews: 0,
    overallRating: 0,
    overallCount: 0,
    ratings: {}
  },
  pagination: {
    currentPage: 1,
    totalPages: 1,
    limit: 10,
    total: 0
  },
  isLoading: false,
  error: null,

  // Actions
  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  clearError: () => set({ error: null }),

  // Fetch restaurant reviews with pagination
  fetchReviews: async (page = 1, limit = 10) => {
    set({ isLoading: true, error: null })

    const result = await restaurantReviewsApi.getRestaurantReviews(page, limit)

    if (result.success) {
      set({
        reviews: result.data.reviews || [],
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(result.data.total / limit),
          limit,
          total: result.data.total,
          next: result.data.pagination?.next || null,
          prev: result.data.pagination?.prev || null
        },
        isLoading: false
      })
      return { success: true, reviews: result.data.reviews }
    } else {
      set({ error: result.error, isLoading: false })
      return { success: false, error: result.error }
    }
  },

  // Fetch restaurant rating stats
  fetchStats: async () => {
    const result = await restaurantReviewsApi.getRestaurantRating()

    if (result.success) {
      set({
        stats: result.data
      })
      return { success: true, stats: result.data }
    } else {
      return { success: false, error: result.error }
    }
  },

  // Create a new restaurant review
  createReview: async (reviewData) => {
    set({ isLoading: true, error: null })

    const result = await restaurantReviewsApi.createRestaurantReview(reviewData)

    if (result.success) {
      // Refresh reviews and stats
      await get().fetchReviews(get().pagination.currentPage, get().pagination.limit)
      await get().fetchStats()

      set({ isLoading: false })
      return { success: true, review: result.data }
    } else {
      set({ error: result.error, isLoading: false })
      return {
        success: false,
        error: result.error,
        code: result.code,
        details: result.details
      }
    }
  },

  // Update a restaurant review
  updateReview: async (reviewId, reviewData) => {
    set({ isLoading: true, error: null })

    const result = await restaurantReviewsApi.updateRestaurantReview(reviewId, reviewData)

    if (result.success) {
      // Update the review in the list
      set((state) => ({
        reviews: state.reviews.map((review) =>
          review.id === reviewId ? result.data : review
        ),
        isLoading: false
      }))

      // Refresh stats
      await get().fetchStats()

      return { success: true, review: result.data }
    } else {
      set({ error: result.error, isLoading: false })
      return { success: false, error: result.error, code: result.code }
    }
  },

  // Delete a restaurant review
  deleteReview: async (reviewId) => {
    set({ isLoading: true, error: null })

    const result = await restaurantReviewsApi.deleteRestaurantReview(reviewId)

    if (result.success) {
      // Remove review from the list
      set((state) => ({
        reviews: state.reviews.filter((review) => review.id !== reviewId),
        isLoading: false
      }))

      // Refresh stats
      await get().fetchStats()

      return { success: true }
    } else {
      set({ error: result.error, isLoading: false })
      return { success: false, error: result.error, code: result.code }
    }
  },

  // Get user's own review (if exists)
  getUserReview: (userId) => {
    return get().reviews.find((review) => review.user?.id === userId)
  }
}))

export default useRestaurantReviewsStore
