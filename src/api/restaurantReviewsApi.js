import apiClient from './apiClient'

/**
 * Round a number to the nearest 0.5
 * @param {number} value - Number to round
 * @returns {number} Rounded value (e.g., 4.3 → 4.5, 4.2 → 4.0)
 */
const roundToHalf = (value) => Math.round(value * 2) / 2

/**
 * Get restaurant reviews with pagination
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Number of reviews per page (default: 10)
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const getRestaurantReviews = async (page = 1, limit = 10) => {
  try {
    const response = await apiClient.get(`/restaurant/reviews?page=${page}&limit=${limit}`)
    return {
      success: true,
      data: {
        reviews: response.data || [],
        count: response.count || 0,
        total: response.total || 0,
        pagination: response.pagination || null
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to fetch restaurant reviews'
    }
  }
}

/**
 * Get restaurant rating statistics
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const getRestaurantRating = async () => {
  try {
    const response = await apiClient.get('/restaurant/rating')
    const backendData = response.data || {}

    // Map backend format to frontend format
    // Round overallRating to nearest 0.5 for half-star display
    return {
      success: true,
      data: {
        totalReviews: backendData.totalReviews || 0,
        overallRating: roundToHalf(backendData.ratings?.overall?.average || 0),
        overallCount: backendData.ratings?.overall?.count || 0,
        // Keep full ratings object for future Phase 2
        ratings: backendData.ratings || {}
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to fetch restaurant rating'
    }
  }
}

/**
 * Create a new restaurant review
 * @param {Object} reviewData - Review data {ratings: {overall}, comment, visitDate}
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const createRestaurantReview = async (reviewData) => {
  try {
    const response = await apiClient.post('/restaurant/review', reviewData)
    return {
      success: true,
      data: response.data
    }
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to create restaurant review',
      code: error.response?.data?.code,
      details: error.response?.data?.details
    }
  }
}

/**
 * Update user's own restaurant review
 * @param {string} reviewId - Review ID
 * @param {Object} reviewData - Updated review data
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const updateRestaurantReview = async (reviewId, reviewData) => {
  try {
    const response = await apiClient.put(`/restaurant/review/${reviewId}`, reviewData)
    return {
      success: true,
      data: response.data
    }
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to update restaurant review',
      code: error.response?.data?.code
    }
  }
}

/**
 * Delete user's own restaurant review
 * @param {string} reviewId - Review ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteRestaurantReview = async (reviewId) => {
  try {
    await apiClient.delete(`/restaurant/review/${reviewId}`)
    return {
      success: true
    }
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to delete restaurant review',
      code: error.response?.data?.code
    }
  }
}
