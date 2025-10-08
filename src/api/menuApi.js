import apiClient from './apiClient'

/**
 * API du menu
 */

// Récupérer tous les items du menu
export const getMenuItems = async (category = null) => {
  try {
    const params = category ? { category } : {}
    const response = await apiClient.get('/menu', { params })
    return { success: true, ...response }
  } catch (error) {
    return { success: false, error: error.error || 'Erreur lors de la récupération du menu' }
  }
}

// Récupérer toutes les catégories
export const getCategories = async () => {
  try {
    const response = await apiClient.get('/menu/categories')
    return { success: true, ...response }
  } catch (error) {
    return { success: false, error: error.error || 'Erreur lors de la récupération des catégories' }
  }
}

// Créer un nouvel item (ADMIN)
export const createMenuItem = async (itemData) => {
  try {
    const response = await apiClient.post('/menu', itemData)
    return { success: true, ...response }
  } catch (error) {
    return { success: false, error: error.error || 'Erreur lors de la création de l\'item' }
  }
}

// Mettre à jour un item (ADMIN)
export const updateMenuItem = async (itemId, itemData) => {
  try {
    const response = await apiClient.put(`/menu/${itemId}`, itemData)
    return { success: true, ...response }
  } catch (error) {
    return { success: false, error: error.error || 'Erreur lors de la mise à jour de l\'item' }
  }
}

// Supprimer un item (ADMIN)
export const deleteMenuItem = async (itemId) => {
  try {
    const response = await apiClient.delete(`/menu/${itemId}`)
    return { success: true, ...response }
  } catch (error) {
    return { success: false, error: error.error || 'Erreur lors de la suppression de l\'item' }
  }
}
