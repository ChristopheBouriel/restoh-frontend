import { create } from 'zustand'
import * as reviewsApi from '../api/reviewsApi'

const useReviewsStore = create((set, get) => ({
  // State
  reviews: {}, // { [menuItemId]: reviews[] }
  stats: {}, // { [menuItemId]: { averageRating, reviewCount } }
  userReviews: [],
  isLoading: false,
  error: null,

  // Actions
  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  clearError: () => set({ error: null }),

  // Fetch reviews for a menu item
  fetchMenuItemReviews: async (menuItemId) => {
    set({ isLoading: true, error: null })

    const result = await reviewsApi.getMenuItemReviews(menuItemId)

    if (result.success) {
      set((state) => ({
        reviews: {
          ...state.reviews,
          [menuItemId]: result.data || []
        },
        isLoading: false
      }))
      return { success: true, reviews: result.data }
    } else {
      set({ error: result.error, isLoading: false })
      return { success: false, error: result.error }
    }
  },

  // Fetch rating stats for a menu item
  fetchMenuItemRatingStats: async (menuItemId) => {
    const result = await reviewsApi.getMenuItemRatingStats(menuItemId)

    if (result.success) {
      set((state) => ({
        stats: {
          ...state.stats,
          [menuItemId]: result.data || { averageRating: 0, reviewCount: 0 }
        }
      }))
      return { success: true, stats: result.data }
    } else {
      return { success: false, error: result.error }
    }
  },

  // Create a new review
  createReview: async (menuItemId, reviewData) => {
    set({ isLoading: true, error: null })

    const result = await reviewsApi.createReview(menuItemId, reviewData)

    if (result.success) {
      // Add new review to the list
      set((state) => ({
        reviews: {
          ...state.reviews,
          [menuItemId]: [result.data, ...(state.reviews[menuItemId] || [])]
        },
        isLoading: false
      }))

      // Refresh stats
      await get().fetchMenuItemRatingStats(menuItemId)

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

  // Update a review
  updateReview: async (reviewId, reviewData) => {
    set({ isLoading: true, error: null })

    const result = await reviewsApi.updateReview(reviewId, reviewData)

    if (result.success) {
      const updatedReview = result.data

      // Update review in all menu items
      set((state) => {
        const newReviews = { ...state.reviews }
        Object.keys(newReviews).forEach((menuItemId) => {
          newReviews[menuItemId] = newReviews[menuItemId].map((review) =>
            review.id === reviewId ? updatedReview : review
          )
        })

        return {
          reviews: newReviews,
          isLoading: false
        }
      })

      // Refresh stats for the menu item
      if (updatedReview.menuItemId) {
        await get().fetchMenuItemRatingStats(updatedReview.menuItemId)
      }

      return { success: true, review: updatedReview }
    } else {
      set({ error: result.error, isLoading: false })
      return { success: false, error: result.error }
    }
  },

  // Delete a review
  deleteReview: async (reviewId, menuItemId) => {
    set({ isLoading: true, error: null })

    const result = await reviewsApi.deleteReview(reviewId)

    if (result.success) {
      // Remove review from the list
      set((state) => ({
        reviews: {
          ...state.reviews,
          [menuItemId]: (state.reviews[menuItemId] || []).filter(
            (review) => review.id !== reviewId
          )
        },
        isLoading: false
      }))

      // Refresh stats
      await get().fetchMenuItemRatingStats(menuItemId)

      return { success: true }
    } else {
      set({ error: result.error, isLoading: false })
      return { success: false, error: result.error }
    }
  },

  // Fetch user's own reviews
  fetchUserReviews: async () => {
    set({ isLoading: true, error: null })

    const result = await reviewsApi.getUserReviews()

    if (result.success) {
      set({
        userReviews: result.data || [],
        isLoading: false
      })
      return { success: true, reviews: result.data }
    } else {
      set({ error: result.error, isLoading: false })
      return { success: false, error: result.error }
    }
  },

  // Getters
  getMenuItemReviews: (menuItemId) => {
    return get().reviews[menuItemId] || []
  },

  getMenuItemStats: (menuItemId) => {
    return get().stats[menuItemId] || { averageRating: 0, reviewCount: 0 }
  },

  getUserReviewForMenuItem: (menuItemId, userId) => {
    const reviews = get().reviews[menuItemId] || []
    return reviews.find((review) => review.userId === userId)
  }
}))

export default useReviewsStore
