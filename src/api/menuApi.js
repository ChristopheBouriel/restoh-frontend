import apiClient from './apiClient'

/**
 * Menu API
 */

// Get all menu items
export const getMenuItems = async (category = null) => {
  try {
    const params = category ? { category } : {}
    const response = await apiClient.get('/menu', { params })
    return { success: true, ...response }
  } catch (error) {
    return { success: false, error: error.error || 'Error fetching menu' }
  }
}

// Get all categories
export const getCategories = async () => {
  try {
    const response = await apiClient.get('/menu/categories')
    return { success: true, ...response }
  } catch (error) {
    return { success: false, error: error.error || 'Error fetching categories' }
  }
}

// Create a new item (ADMIN)
export const createMenuItem = async (itemData) => {
  try {
    // If itemData contains an image file, send as FormData
    if (itemData.image && itemData.image instanceof File) {
      const formData = new FormData()

      // Append the image file
      formData.append('image', itemData.image)

      // Append all other fields
      Object.keys(itemData).forEach(key => {
        if (key !== 'image') {
          // Handle arrays (allergens, ingredients) - send each item separately
          if (Array.isArray(itemData[key])) {
            itemData[key].forEach(item => {
              formData.append(`${key}[]`, item)
            })
          } else {
            formData.append(key, itemData[key])
          }
        }
      })

      const response = await apiClient.post('/menu', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        // Ensure cookies are sent with this request too
        withCredentials: true
      })
      return { success: true, ...response }
    } else {
      // No image file, send as JSON
      const response = await apiClient.post('/menu', itemData)
      return { success: true, ...response }
    }
  } catch (error) {
    return { success: false, error: error.error || 'Error creating item' }
  }
}

// Update an item (ADMIN)
export const updateMenuItem = async (itemId, itemData) => {
  try {
    // If itemData contains an image file, send as FormData
    if (itemData.image && itemData.image instanceof File) {
      const formData = new FormData()

      // Append the image file
      formData.append('image', itemData.image)

      // Append all other fields
      Object.keys(itemData).forEach(key => {
        if (key !== 'image') {
          // Handle arrays (allergens, ingredients) - send each item separately
          if (Array.isArray(itemData[key])) {
            itemData[key].forEach(item => {
              formData.append(`${key}[]`, item)
            })
          } else {
            formData.append(key, itemData[key])
          }
        }
      })

      const response = await apiClient.put(`/menu/${itemId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        // Ensure cookies are sent with this request too
        withCredentials: true
      })
      return { success: true, ...response }
    } else {
      // No image file, send as JSON
      const response = await apiClient.put(`/menu/${itemId}`, itemData)
      return { success: true, ...response }
    }
  } catch (error) {
    return { success: false, error: error.error || 'Error updating item' }
  }
}

// Delete an item (ADMIN)
export const deleteMenuItem = async (itemId) => {
  try {
    const response = await apiClient.delete(`/menu/${itemId}`)
    return { success: true, ...response }
  } catch (error) {
    return { success: false, error: error.error || 'Error deleting item' }
  }
}

// ============================================
// Popular Items & Suggestions - Public Routes
// ============================================

/**
 * Get popular items (backend-calculated with category distribution)
 * Returns 8 items: 2 appetizers, 3 mains, 1 dessert, 2 beverages
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export const getPopularItems = async () => {
  try {
    const response = await apiClient.get('/menu/popular')
    return { success: true, data: response.data || [] }
  } catch (error) {
    return { success: false, error: error.error || 'Error fetching popular items' }
  }
}

/**
 * Get restaurant suggestions (admin-selected items)
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export const getSuggestedItems = async () => {
  try {
    const response = await apiClient.get('/menu/suggestions')
    return { success: true, data: response.data || [] }
  } catch (error) {
    return { success: false, error: error.error || 'Error fetching suggestions' }
  }
}

// ============================================
// Popular Items & Suggestions - Admin Routes
// ============================================

/**
 * Toggle popular override for a menu item (ADMIN)
 * When true, item is excluded from automatic popular selection
 * @param {string} itemId - Menu item ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const togglePopularOverride = async (itemId) => {
  try {
    const response = await apiClient.patch(`/admin/menu/${itemId}/popular`)
    return { success: true, data: response.data }
  } catch (error) {
    return { success: false, error: error.error || 'Error toggling popular override' }
  }
}

/**
 * Reset all popular overrides to false (ADMIN)
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const resetAllPopularOverrides = async () => {
  try {
    const response = await apiClient.patch('/admin/menu/popular/reset')
    return { success: true, data: response.data }
  } catch (error) {
    return { success: false, error: error.error || 'Error resetting popular overrides' }
  }
}

/**
 * Toggle suggested status for a menu item (ADMIN)
 * @param {string} itemId - Menu item ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const toggleSuggested = async (itemId) => {
  try {
    const response = await apiClient.patch(`/admin/menu/${itemId}/suggested`)
    return { success: true, data: response.data }
  } catch (error) {
    return { success: false, error: error.error || 'Error toggling suggested' }
  }
}

/**
 * Get all suggested items for admin view (ADMIN)
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export const getAdminSuggestedItems = async () => {
  try {
    const response = await apiClient.get('/admin/menu/suggested')
    return { success: true, data: response.data || [] }
  } catch (error) {
    return { success: false, error: error.error || 'Error fetching admin suggested items' }
  }
}
