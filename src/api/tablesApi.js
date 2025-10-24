import apiClient from './apiClient'

/**
 * Get available tables for a given date, time slot, and capacity
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {number} slot - Time slot number (1-9)
 * @param {number} capacity - Minimum table capacity needed
 * @returns {Promise<{success: boolean, data?: {availableTables: number[], occupiedTables: number[]}, error?: string}>}
 */
export const getAvailableTables = async (date, slot, capacity) => {
  try {
    const response = await apiClient.get('/tables/available', {
      params: {
        date,
        slot,
        capacity
      }
    })

    return {
      success: true,
      availableTables: response.data.availableTables || [],
      occupiedTables: response.data.occupiedTables || []
    }
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Error fetching available tables',
      availableTables: [],
      occupiedTables: []
    }
  }
}
