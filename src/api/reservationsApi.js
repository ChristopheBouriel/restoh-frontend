import apiClient from './apiClient'

/**
 * Reservations API
 */

// Get current user's reservations
export const getUserReservations = async () => {
  try {
    const response = await apiClient.get('/reservations')
    return { success: true, ...response }
  } catch (error) {
    return { success: false, error: error.error || 'Error fetching reservations' }
  }
}

// Get all reservations (ADMIN)
export const getAllReservations = async (filters = {}) => {
  try {
    const params = {}
    if (filters.status) params.status = filters.status
    if (filters.date) params.date = filters.date

    const response = await apiClient.get('/reservations/admin', { params })
    return { success: true, ...response }
  } catch (error) {
    return { success: false, error: error.error || 'Error fetching reservations' }
  }
}

// Get reservation details
export const getReservationById = async (reservationId) => {
  try {
    const response = await apiClient.get(`/reservations/${reservationId}`)
    return { success: true, ...response }
  } catch (error) {
    return { success: false, error: error.error || 'Error fetching reservation' }
  }
}

// Create a new reservation
export const createReservation = async (reservationData) => {
  try {
    const response = await apiClient.post('/reservations', reservationData)
    return { success: true, ...response }
  } catch (error) {
    return { success: false, error: error.error || 'Error creating reservation' }
  }
}

// Update reservation status (ADMIN)
export const updateReservationStatus = async (reservationId, status) => {
  try {
    const response = await apiClient.patch(`/reservations/${reservationId}/status`, { status })
    return { success: true, ...response }
  } catch (error) {
    return { success: false, error: error.error || 'Error updating status' }
  }
}

// Assign a table to a reservation (ADMIN)
export const assignTable = async (reservationId, tableNumber) => {
  try {
    const response = await apiClient.patch(`/reservations/${reservationId}/table`, { tableNumber })
    return { success: true, ...response }
  } catch (error) {
    return { success: false, error: error.error || 'Error assigning table' }
  }
}
