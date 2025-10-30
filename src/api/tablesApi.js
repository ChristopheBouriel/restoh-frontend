import apiClient from './apiClient'

/**
 * Get available tables for a given date, time slot, and capacity
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {number} slot - Time slot number (1-9)
 * @param {number} capacity - Minimum table capacity needed
 * @param {string} [excludeReservationId] - Optional: ID of reservation being edited (to exclude from occupied tables)
 * @returns {Promise<{success: boolean, data?: {availableTables: number[], occupiedTables: number[], notEligibleTables: number[]}, error?: string}>}
 */
export const getAvailableTables = async (date, slot, capacity, excludeReservationId = null) => {
  try {
    const params = {
      date,
      slot,
      capacity
    }

    // Only add excludeReservationId if it's provided
    if (excludeReservationId) {
      params.excludeReservationId = excludeReservationId
    }

    const response = await apiClient.get('/tables/available', { params })

    const data = response.data.data || response.data
    const availableTables = data.availableTables || data.available || []
    const occupiedTables = data.occupiedTables || data.occupied || []
    const notEligibleTables = data.notEligibleTables || data.notEligible || []

    return {
      success: true,
      availableTables,
      occupiedTables,
      notEligibleTables
    }
  } catch (error) {
    console.error('❌ API Error:', error)
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Error fetching available tables',
      availableTables: [],
      occupiedTables: [],
      notEligibleTables: []
    }
  }
}
