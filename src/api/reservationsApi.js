import apiClient from './apiClient'

/**
 * API des réservations
 */

// Récupérer les réservations de l'utilisateur connecté
export const getUserReservations = async () => {
  try {
    const response = await apiClient.get('/reservations')
    return { success: true, ...response }
  } catch (error) {
    return { success: false, error: error.error || 'Erreur lors de la récupération des réservations' }
  }
}

// Récupérer toutes les réservations (ADMIN)
export const getAllReservations = async (filters = {}) => {
  try {
    const params = {}
    if (filters.status) params.status = filters.status
    if (filters.date) params.date = filters.date

    const response = await apiClient.get('/reservations/admin', { params })
    return { success: true, ...response }
  } catch (error) {
    return { success: false, error: error.error || 'Erreur lors de la récupération des réservations' }
  }
}

// Récupérer les détails d'une réservation
export const getReservationById = async (reservationId) => {
  try {
    const response = await apiClient.get(`/reservations/${reservationId}`)
    return { success: true, ...response }
  } catch (error) {
    return { success: false, error: error.error || 'Erreur lors de la récupération de la réservation' }
  }
}

// Créer une nouvelle réservation
export const createReservation = async (reservationData) => {
  try {
    const response = await apiClient.post('/reservations', reservationData)
    return { success: true, ...response }
  } catch (error) {
    return { success: false, error: error.error || 'Erreur lors de la création de la réservation' }
  }
}

// Mettre à jour le statut d'une réservation (ADMIN)
export const updateReservationStatus = async (reservationId, status) => {
  try {
    const response = await apiClient.patch(`/reservations/${reservationId}/status`, { status })
    return { success: true, ...response }
  } catch (error) {
    return { success: false, error: error.error || 'Erreur lors de la mise à jour du statut' }
  }
}

// Assigner une table à une réservation (ADMIN)
export const assignTable = async (reservationId, tableNumber) => {
  try {
    const response = await apiClient.patch(`/reservations/${reservationId}/table`, { tableNumber })
    return { success: true, ...response }
  } catch (error) {
    return { success: false, error: error.error || 'Erreur lors de l\'assignation de la table' }
  }
}
