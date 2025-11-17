import apiClient from './apiClient'

/**
 * Get all reviews for a specific menu item
 * @param {string} menuItemId - Menu item ID
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export const getMenuItemReviews = async (menuItemId) => {
  try {
    const response = await apiClient.get(`/menu/${menuItemId}/review`)
    return {
      success: true,
      data: response.data.data || response.data
    }
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to fetch reviews'
    }
  }
}

/**
 * Get review statistics for a menu item (average rating, count)
 * @param {string} menuItemId - Menu item ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const getMenuItemRatingStats = async (menuItemId) => {
  try {
    const response = await apiClient.get(`/menu/${menuItemId}/rating`)
    return {
      success: true,
      data: response.data.data || response.data
    }
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to fetch rating stats'
    }
  }
}

/**
 * Create a new review for a menu item
 * @param {string} menuItemId - Menu item ID
 * @param {Object} reviewData - Review data {rating, comment}
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const createReview = async (menuItemId, reviewData) => {
  try {
    const response = await apiClient.post(`/menu/${menuItemId}/review`, reviewData)
    return {
      success: true,
      data: response.data.data || response.data
    }
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to create review',
      code: error.response?.data?.code,
      details: error.response?.data?.details
    }
  }
}

/**
 * Update user's own review
 * @param {string} reviewId - Review ID
 * @param {Object} reviewData - Updated review data {rating, comment}
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const updateReview = async (reviewId, reviewData) => {
  try {
    const response = await apiClient.put(`/review/${reviewId}`, reviewData)
    return {
      success: true,
      data: response.data.data || response.data
    }
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to update review'
    }
  }
}

/**
 * Delete user's own review
 * @param {string} reviewId - Review ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteReview = async (reviewId) => {
  try {
    await apiClient.delete(`/review/${reviewId}`)
    return {
      success: true
    }
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to delete review'
    }
  }
}
