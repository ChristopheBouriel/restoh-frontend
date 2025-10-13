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
          // Handle arrays (allergens, ingredients)
          if (Array.isArray(itemData[key])) {
            formData.append(key, JSON.stringify(itemData[key]))
          } else {
            formData.append(key, itemData[key])
          }
        }
      })

      const response = await apiClient.post('/menu', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
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
          // Handle arrays (allergens, ingredients)
          if (Array.isArray(itemData[key])) {
            formData.append(key, JSON.stringify(itemData[key]))
          } else {
            formData.append(key, itemData[key])
          }
        }
      })

      const response = await apiClient.put(`/menu/${itemId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
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
