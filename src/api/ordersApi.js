import apiClient from './apiClient'

/**
 * API des commandes
 */

// Récupérer les commandes de l'utilisateur connecté
export const getUserOrders = async () => {
  try {
    const response = await apiClient.get('/orders')
    return { success: true, ...response }
  } catch (error) {
    return { success: false, error: error.error || 'Erreur lors de la récupération des commandes' }
  }
}

// Récupérer toutes les commandes (ADMIN)
export const getAllOrders = async (filters = {}) => {
  try {
    const params = {}
    if (filters.status) params.status = filters.status
    if (filters.userId) params.userId = filters.userId
    if (filters.date) params.date = filters.date

    const response = await apiClient.get('/orders/admin', { params })
    return { success: true, ...response }
  } catch (error) {
    return { success: false, error: error.error || 'Erreur lors de la récupération des commandes' }
  }
}

// Récupérer les détails d'une commande
export const getOrderById = async (orderId) => {
  try {
    const response = await apiClient.get(`/orders/${orderId}`)
    return { success: true, ...response }
  } catch (error) {
    return { success: false, error: error.error || 'Erreur lors de la récupération de la commande' }
  }
}

// Créer une nouvelle commande
export const createOrder = async (orderData) => {
  try {
    const response = await apiClient.post('/orders', orderData)
    return { success: true, ...response }
  } catch (error) {
    return { success: false, error: error.error || 'Erreur lors de la création de la commande' }
  }
}

// Mettre à jour le statut d'une commande (ADMIN)
export const updateOrderStatus = async (orderId, status) => {
  try {
    const response = await apiClient.patch(`/orders/${orderId}/status`, { status })
    return { success: true, ...response }
  } catch (error) {
    return { success: false, error: error.error || 'Erreur lors de la mise à jour du statut' }
  }
}
