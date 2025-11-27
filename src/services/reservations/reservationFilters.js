/**
 * Filtering and querying logic for reservations
 * Pure functions - can be tested independently of state
 */

import { getTodayLocalDate, normalizeDateString } from '../../utils/dateUtils'

/**
 * Filter reservations by status
 * @param {Array} reservations - Array of reservation objects
 * @param {string} status - Status to filter by
 * @returns {Array} Filtered reservations
 */
export const filterByStatus = (reservations, status) => {
  if (!reservations || !Array.isArray(reservations)) {
    return []
  }

  if (!status) {
    return reservations
  }

  return reservations.filter(reservation => reservation.status === status)
}

/**
 * Filter reservations by date
 * @param {Array} reservations - Array of reservation objects
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Array} Filtered reservations
 */
export const filterByDate = (reservations, date) => {
  if (!reservations || !Array.isArray(reservations)) {
    return []
  }

  if (!date) {
    return reservations
  }

  const normalizedSearchDate = normalizeDateString(date)

  return reservations.filter(reservation => {
    if (!reservation.date) return false
    const normalizedReservationDate = normalizeDateString(reservation.date)
    return normalizedReservationDate === normalizedSearchDate
  })
}

/**
 * Filter reservations by user
 * @param {Array} reservations - Array of reservation objects
 * @param {string} userId - User ID to filter by
 * @returns {Array} Filtered reservations
 */
export const filterByUser = (reservations, userId) => {
  if (!reservations || !Array.isArray(reservations)) {
    return []
  }

  if (!userId) {
    return reservations
  }

  return reservations.filter(reservation =>
    reservation.userId === userId || reservation.user?.id === userId
  )
}

/**
 * Get today's reservations
 * @param {Array} reservations - Array of reservation objects
 * @returns {Array} Today's reservations
 */
export const getTodaysReservations = (reservations) => {
  if (!reservations || !Array.isArray(reservations)) {
    return []
  }

  const today = getTodayLocalDate()

  return reservations.filter(reservation => {
    if (!reservation.date) return false
    const reservationDate = normalizeDateString(reservation.date)
    return reservationDate === today
  })
}

/**
 * Get upcoming reservations (today and future, excluding cancelled)
 * @param {Array} reservations - Array of reservation objects
 * @returns {Array} Upcoming reservations sorted by date
 */
export const getUpcomingReservations = (reservations) => {
  if (!reservations || !Array.isArray(reservations)) {
    return []
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return reservations
    .filter(reservation => {
      if (!reservation.date || reservation.status === 'cancelled') {
        return false
      }

      const reservationDate = new Date(reservation.date)
      return reservationDate >= today
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date))
}

/**
 * Get past reservations
 * @param {Array} reservations - Array of reservation objects
 * @returns {Array} Past reservations sorted by date (most recent first)
 */
export const getPastReservations = (reservations) => {
  if (!reservations || !Array.isArray(reservations)) {
    return []
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return reservations
    .filter(reservation => {
      if (!reservation.date) return false
      const reservationDate = new Date(reservation.date)
      return reservationDate < today
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date))
}

/**
 * Filter reservations by multiple criteria
 * @param {Array} reservations - Array of reservation objects
 * @param {Object} filters - Filter criteria
 * @param {string} [filters.status] - Filter by status
 * @param {string} [filters.date] - Filter by date
 * @param {string} [filters.userId] - Filter by user
 * @param {string} [filters.timeRange] - Filter by time range ('today', 'upcoming', 'past')
 * @returns {Array} Filtered reservations
 */
export const filterReservations = (reservations, filters = {}) => {
  if (!reservations || !Array.isArray(reservations)) {
    return []
  }

  // Handle null or undefined filters
  const safeFilters = filters || {}

  let result = [...reservations]

  // Apply time range filter first
  if (safeFilters.timeRange) {
    switch (safeFilters.timeRange) {
      case 'today':
        result = getTodaysReservations(result)
        break
      case 'upcoming':
        result = getUpcomingReservations(result)
        break
      case 'past':
        result = getPastReservations(result)
        break
    }
  }

  // Apply status filter
  if (safeFilters.status) {
    result = filterByStatus(result, safeFilters.status)
  }

  // Apply date filter
  if (safeFilters.date) {
    result = filterByDate(result, safeFilters.date)
  }

  // Apply user filter
  if (safeFilters.userId) {
    result = filterByUser(result, safeFilters.userId)
  }

  return result
}

/**
 * Search reservations by text (name, email, phone, notes)
 * @param {Array} reservations - Array of reservation objects
 * @param {string} searchText - Text to search for
 * @returns {Array} Matching reservations
 */
export const searchReservations = (reservations, searchText) => {
  if (!reservations || !Array.isArray(reservations)) {
    return []
  }

  if (!searchText || searchText.trim() === '') {
    return reservations
  }

  const searchLower = searchText.toLowerCase().trim()

  return reservations.filter(reservation => {
    const userName = reservation.userName?.toLowerCase() || ''
    const userEmail = reservation.userEmail?.toLowerCase() || ''
    const phone = reservation.phone?.toLowerCase() || ''
    const notes = reservation.notes?.toLowerCase() || ''

    return (
      userName.includes(searchLower) ||
      userEmail.includes(searchLower) ||
      phone.includes(searchLower) ||
      notes.includes(searchLower)
    )
  })
}
