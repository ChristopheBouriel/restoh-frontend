import apiClient from './apiClient'
import {
  getRecentReservationsMock,
  getHistoricalReservationsMock,
  updateReservationStatusMock
} from './mocks/reservationsMock'

/**
 * Reservations API
 *
 * Set VITE_MOCK_API=true in .env to use mock data for development
 */

const MOCK_MODE = import.meta.env.VITE_MOCK_API === 'true'

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
    const params = {
      limit: 1000, // Get all reservations (no pagination)
      page: 1
    }
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
    return {
      success: false,
      error: error.error || 'Error creating reservation',
      code: error.code,
      details: error.details
    }
  }
}

// Update reservation status (ADMIN)
export const updateReservationStatus = async (reservationId, status) => {
  try {
    const response = await apiClient.patch(`/reservations/admin/${reservationId}/status`, { status })
    return { success: true, ...response }
  } catch (error) {
    return { success: false, error: error.error || 'Error updating status' }
  }
}

// Assign a table to a reservation (ADMIN)
export const assignTable = async (reservationId, tableNumber) => {
  try {
    const response = await apiClient.patch(`/reservations/admin/${reservationId}/table`, { tableNumber })
    return { success: true, ...response }
  } catch (error) {
    return { success: false, error: error.error || 'Error assigning table' }
  }
}

// Update user's own reservation
export const updateReservation = async (reservationId, reservationData) => {
  try {
    const response = await apiClient.put(`/reservations/${reservationId}`, reservationData)
    return { success: true, ...response }
  } catch (error) {
    return {
      success: false,
      error: error.error || 'Error updating reservation',
      code: error.code,
      details: error.details
    }
  }
}

// Cancel user's own reservation
export const cancelReservation = async (reservationId) => {
  try {
    const response = await apiClient.delete(`/reservations/${reservationId}`)
    return { success: true, ...response }
  } catch (error) {
    return {
      success: false,
      error: error.error || 'Error canceling reservation',
      code: error.code,
      details: error.details
    }
  }
}

// Get reservations for a specific user (ADMIN)
export const getReservationsByUserId = async (userId) => {
  try {
    const response = await apiClient.get(`/admin/users/${userId}/reservations`)

    // Handle different possible response structures
    const reservations = response.reservations || response.data?.reservations || response.data || []

    return { success: true, reservations: Array.isArray(reservations) ? reservations : [] }
  } catch (error) {
    return { success: false, error: error.error || 'Error fetching user reservations', reservations: [] }
  }
}

// ========================================
// NEW API ENDPOINTS (Recent/Historical Split)
// ========================================

/**
 * Get recent reservations (last 15 days + upcoming) - ADMIN
 * Auto-refreshed in the UI
 */
export const getRecentReservations = async (params = {}) => {
  if (MOCK_MODE) {
    return await getRecentReservationsMock(params)
  }

  try {
    const queryParams = {
      limit: params.limit || 50,
      page: params.page || 1
    }
    if (params.status) queryParams.status = params.status

    const response = await apiClient.get('/reservations/admin/recent', { params: queryParams })
    return { success: true, ...response }
  } catch (error) {
    return { success: false, error: error.error || 'Error fetching recent reservations' }
  }
}

/**
 * Get historical reservations (> 15 days ago) - ADMIN
 * Fetch on demand with date range
 */
export const getHistoricalReservations = async (params = {}) => {
  if (MOCK_MODE) {
    return await getHistoricalReservationsMock(params)
  }

  try {
    const { startDate, endDate, limit = 20, page = 1, status, search } = params

    if (!startDate || !endDate) {
      return { success: false, error: 'Start date and end date are required' }
    }

    const queryParams = { startDate, endDate, limit, page }
    if (status) queryParams.status = status
    if (search) queryParams.search = search

    const response = await apiClient.get('/reservations/admin/history', { params: queryParams })
    return { success: true, ...response }
  } catch (error) {
    return { success: false, error: error.error || 'Error fetching historical reservations' }
  }
}

/**
 * Update reservation status - ADMIN (enhanced for mock support)
 */
export const updateReservationStatusEnhanced = async (reservationId, status) => {
  if (MOCK_MODE) {
    return await updateReservationStatusMock(reservationId, status)
  }

  // Use existing updateReservationStatus
  return await updateReservationStatus(reservationId, status)
}
