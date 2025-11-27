/**
 * Statistics calculation logic for reservations
 * Pure functions - business logic for metrics and analytics
 */

import { getTodayLocalDate, normalizeDateString } from '../../utils/dateUtils'
import { getTodaysReservations } from './reservationFilters'

/**
 * Calculate reservation statistics
 * @param {Array} reservations - Array of reservation objects
 * @returns {Object} Statistics object
 */
export const calculateReservationStats = (reservations) => {
  if (!reservations || !Array.isArray(reservations)) {
    return {
      total: 0,
      confirmed: 0,
      seated: 0,
      completed: 0,
      cancelled: 0,
      noShow: 0,
      todayTotal: 0,
      todayConfirmed: 0,
      todaySeated: 0,
      totalGuests: 0,
      todayGuests: 0
    }
  }

  // Get today's reservations
  const todaysReservations = getTodaysReservations(reservations)

  // Active statuses for guest count
  const activeStatuses = ['confirmed', 'seated', 'completed']

  return {
    // Total counts by status
    total: reservations.length,
    confirmed: reservations.filter(r => r.status === 'confirmed').length,
    seated: reservations.filter(r => r.status === 'seated').length,
    completed: reservations.filter(r => r.status === 'completed').length,
    cancelled: reservations.filter(r => r.status === 'cancelled').length,
    noShow: reservations.filter(r => r.status === 'no-show').length,

    // Today's counts
    todayTotal: todaysReservations.length,
    todayConfirmed: todaysReservations.filter(r => r.status === 'confirmed').length,
    todaySeated: todaysReservations.filter(r => r.status === 'seated').length,

    // Guest counts (only active reservations)
    totalGuests: reservations
      .filter(r => activeStatuses.includes(r.status))
      .reduce((sum, reservation) => sum + (reservation.guests || 0), 0),

    todayGuests: todaysReservations
      .filter(r => activeStatuses.includes(r.status))
      .reduce((sum, reservation) => sum + (reservation.guests || 0), 0)
  }
}

/**
 * Calculate statistics by date range
 * @param {Array} reservations - Array of reservation objects
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Object} Statistics for the date range
 */
export const calculateDateRangeStats = (reservations, startDate, endDate) => {
  if (!reservations || !Array.isArray(reservations) || !startDate || !endDate) {
    return {
      total: 0,
      totalGuests: 0,
      averageGuests: 0,
      byStatus: {}
    }
  }

  const start = new Date(startDate)
  const end = new Date(endDate)

  const filtered = reservations.filter(r => {
    if (!r.date) return false
    const date = new Date(r.date)
    return date >= start && date <= end
  })

  const totalGuests = filtered.reduce((sum, r) => sum + (r.guests || 0), 0)
  const averageGuests = filtered.length > 0 ? totalGuests / filtered.length : 0

  // Count by status
  const byStatus = {
    confirmed: filtered.filter(r => r.status === 'confirmed').length,
    seated: filtered.filter(r => r.status === 'seated').length,
    completed: filtered.filter(r => r.status === 'completed').length,
    cancelled: filtered.filter(r => r.status === 'cancelled').length,
    noShow: filtered.filter(r => r.status === 'no-show').length
  }

  return {
    total: filtered.length,
    totalGuests,
    averageGuests: Math.round(averageGuests * 10) / 10, // Round to 1 decimal
    byStatus
  }
}

/**
 * Get peak hours based on reservations
 * @param {Array} reservations - Array of reservation objects
 * @returns {Array} Array of {slot, count} objects sorted by count
 */
export const getPeakHours = (reservations) => {
  if (!reservations || !Array.isArray(reservations)) {
    return []
  }

  // Count reservations by slot
  const slotCounts = {}

  reservations.forEach(r => {
    if (r.slot) {
      slotCounts[r.slot] = (slotCounts[r.slot] || 0) + 1
    }
  })

  // Convert to array and sort by count
  return Object.entries(slotCounts)
    .map(([slot, count]) => ({ slot: parseInt(slot), count }))
    .sort((a, b) => b.count - a.count)
}

/**
 * Calculate table utilization rate
 * @param {Array} reservations - Array of reservation objects
 * @param {number} totalTables - Total number of tables in restaurant
 * @returns {Object} Utilization statistics
 */
export const calculateTableUtilization = (reservations, totalTables) => {
  if (!reservations || !Array.isArray(reservations) || !totalTables) {
    return {
      utilizationRate: 0,
      totalSlots: 0,
      usedSlots: 0,
      averageTablesPerSlot: 0
    }
  }

  // Count reservations with assigned tables
  const withTables = reservations.filter(r =>
    r.tableNumber &&
    ['confirmed', 'seated', 'completed'].includes(r.status)
  )

  // Calculate slots (15 slots per day typically)
  const uniqueDates = [...new Set(reservations.map(r => r.date))]
  const totalSlots = uniqueDates.length * 15 // 15 time slots per day
  const usedSlots = withTables.length

  const utilizationRate = totalSlots > 0 ? (usedSlots / (totalSlots * totalTables)) * 100 : 0
  const averageTablesPerSlot = usedSlots > 0 ? usedSlots / uniqueDates.length : 0

  return {
    utilizationRate: Math.round(utilizationRate * 10) / 10,
    totalSlots,
    usedSlots,
    averageTablesPerSlot: Math.round(averageTablesPerSlot * 10) / 10
  }
}

/**
 * Calculate cancellation rate
 * @param {Array} reservations - Array of reservation objects
 * @returns {Object} Cancellation statistics
 */
export const calculateCancellationRate = (reservations) => {
  if (!reservations || !Array.isArray(reservations) || reservations.length === 0) {
    return {
      cancellationRate: 0,
      noShowRate: 0,
      completionRate: 0,
      totalCancelled: 0,
      totalNoShow: 0,
      totalCompleted: 0
    }
  }

  const totalCancelled = reservations.filter(r => r.status === 'cancelled').length
  const totalNoShow = reservations.filter(r => r.status === 'no-show').length
  const totalCompleted = reservations.filter(r => r.status === 'completed').length

  const total = reservations.length

  return {
    cancellationRate: Math.round((totalCancelled / total) * 100 * 10) / 10,
    noShowRate: Math.round((totalNoShow / total) * 100 * 10) / 10,
    completionRate: Math.round((totalCompleted / total) * 100 * 10) / 10,
    totalCancelled,
    totalNoShow,
    totalCompleted
  }
}

/**
 * Calculate average party size
 * @param {Array} reservations - Array of reservation objects
 * @param {Object} options - Filter options
 * @param {string} [options.status] - Filter by status
 * @param {string} [options.startDate] - Start date for range
 * @param {string} [options.endDate] - End date for range
 * @returns {number} Average party size
 */
export const calculateAveragePartySize = (reservations, options = {}) => {
  if (!reservations || !Array.isArray(reservations)) {
    return 0
  }

  let filtered = [...reservations]

  // Filter by status if provided
  if (options.status) {
    filtered = filtered.filter(r => r.status === options.status)
  }

  // Filter by date range if provided
  if (options.startDate && options.endDate) {
    const start = new Date(options.startDate)
    const end = new Date(options.endDate)
    filtered = filtered.filter(r => {
      if (!r.date) return false
      const date = new Date(r.date)
      return date >= start && date <= end
    })
  }

  if (filtered.length === 0) {
    return 0
  }

  const totalGuests = filtered.reduce((sum, r) => sum + (r.guests || 0), 0)
  return Math.round((totalGuests / filtered.length) * 10) / 10
}
