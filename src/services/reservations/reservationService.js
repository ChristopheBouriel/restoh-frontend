/**
 * Main reservation service
 * Orchestrates business logic and coordinates with API
 */

import * as reservationsApi from '../../api/reservationsApi'
import {
  validateReservationData,
  canModifyReservation,
  canCancelReservation
} from './reservationValidator'
import {
  filterReservations,
  searchReservations,
  getTodaysReservations,
  getUpcomingReservations,
  getPastReservations
} from './reservationFilters'
import {
  calculateReservationStats,
  calculateCancellationRate,
  getPeakHours,
  calculateTableUtilization
} from './reservationStats'

/**
 * Reservation Service
 * Stateless service for business logic
 */
export class ReservationService {
  /**
   * Validate reservation before creation
   * @param {Object} data - Reservation data
   * @returns {{ isValid: boolean, errors: string[] }}
   */
  static validate(data) {
    return validateReservationData(data)
  }

  /**
   * Prepare reservation data for API
   * Transform and clean data before sending to backend
   * @param {Object} data - Raw reservation data
   * @returns {Object} Cleaned reservation data
   */
  static prepareReservationData(data) {
    return {
      date: data.date?.trim(),
      slot: parseInt(data.slot),
      guests: parseInt(data.guests),
      phone: data.phone?.trim(),
      notes: data.notes?.trim() || '',
      // Tables are optional for user creation, required for admin
      ...(data.tableNumber && { tableNumber: data.tableNumber })
    }
  }

  /**
   * Check if reservation can be modified
   * @param {Object} reservation - Reservation object
   * @returns {{ canModify: boolean, reason?: string }}
   */
  static canModify(reservation) {
    return canModifyReservation(reservation)
  }

  /**
   * Check if reservation can be cancelled
   * @param {Object} reservation - Reservation object
   * @returns {{ canCancel: boolean, reason?: string }}
   */
  static canCancel(reservation) {
    return canCancelReservation(reservation)
  }

  /**
   * Get available status transitions for a reservation
   * Business rules for what statuses can transition to what
   * @param {string} currentStatus - Current reservation status
   * @returns {string[]} Array of allowed next statuses
   */
  static getAvailableStatusTransitions(currentStatus) {
    const transitions = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['seated', 'cancelled', 'no-show'],
      seated: ['completed', 'cancelled'],
      completed: [], // Terminal state
      cancelled: [], // Terminal state
      'no-show': [] // Terminal state
    }

    return transitions[currentStatus] || []
  }

  /**
   * Check if a status transition is valid
   * @param {string} currentStatus - Current status
   * @param {string} newStatus - Desired new status
   * @returns {{ isValid: boolean, error: string|null }}
   */
  static isValidStatusTransition(currentStatus, newStatus) {
    const allowedTransitions = this.getAvailableStatusTransitions(currentStatus)

    if (!allowedTransitions.includes(newStatus)) {
      return {
        isValid: false,
        error: `Cannot change status from ${currentStatus} to ${newStatus}`
      }
    }

    return { isValid: true, error: null }
  }

  /**
   * Filter reservations by multiple criteria
   * @param {Array} reservations - Array of reservations
   * @param {Object} filters - Filter criteria
   * @returns {Array} Filtered reservations
   */
  static filter(reservations, filters) {
    return filterReservations(reservations, filters)
  }

  /**
   * Search reservations by text
   * @param {Array} reservations - Array of reservations
   * @param {string} searchText - Search query
   * @returns {Array} Matching reservations
   */
  static search(reservations, searchText) {
    return searchReservations(reservations, searchText)
  }

  /**
   * Get today's reservations
   * @param {Array} reservations - Array of reservations
   * @returns {Array} Today's reservations
   */
  static getTodaysReservations(reservations) {
    return getTodaysReservations(reservations)
  }

  /**
   * Get upcoming reservations
   * @param {Array} reservations - Array of reservations
   * @returns {Array} Upcoming reservations
   */
  static getUpcomingReservations(reservations) {
    return getUpcomingReservations(reservations)
  }

  /**
   * Get past reservations
   * @param {Array} reservations - Array of reservations
   * @returns {Array} Past reservations
   */
  static getPastReservations(reservations) {
    return getPastReservations(reservations)
  }

  /**
   * Calculate statistics
   * @param {Array} reservations - Array of reservations
   * @returns {Object} Statistics object
   */
  static calculateStats(reservations) {
    return calculateReservationStats(reservations)
  }

  /**
   * Get analytics data
   * @param {Array} reservations - Array of reservations
   * @param {number} totalTables - Total tables in restaurant
   * @returns {Object} Analytics data
   */
  static getAnalytics(reservations, totalTables = 15) {
    return {
      stats: calculateReservationStats(reservations),
      cancellations: calculateCancellationRate(reservations),
      peakHours: getPeakHours(reservations),
      utilization: calculateTableUtilization(reservations, totalTables)
    }
  }

  /**
   * Handle API response and normalize errors
   * Consistent error handling across all operations
   * @param {Object} result - API response
   * @returns {Object} Normalized response
   */
  static normalizeApiResponse(result) {
    if (result.success) {
      return {
        success: true,
        data: result.data
      }
    }

    return {
      success: false,
      error: result.error || 'An error occurred',
      code: result.code,
      details: result.details
    }
  }

  /**
   * Format reservation for display
   * Add computed properties and format data
   * @param {Object} reservation - Raw reservation object
   * @returns {Object} Formatted reservation
   */
  static formatReservation(reservation) {
    if (!reservation) return null

    return {
      ...reservation,
      // Add computed display properties
      displayDate: new Date(reservation.date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      isPast: new Date(reservation.date) < new Date(),
      isCancellable: canCancelReservation(reservation).canCancel,
      isModifiable: canModifyReservation(reservation).canModify,
      availableTransitions: this.getAvailableStatusTransitions(reservation.status)
    }
  }

  /**
   * Bulk format reservations
   * @param {Array} reservations - Array of reservations
   * @returns {Array} Formatted reservations
   */
  static formatReservations(reservations) {
    if (!reservations || !Array.isArray(reservations)) {
      return []
    }

    return reservations.map(r => this.formatReservation(r))
  }

  /**
   * Get reservation conflicts
   * Check if a reservation conflicts with existing ones
   * @param {Object} newReservation - New reservation data
   * @param {Array} existingReservations - Existing reservations
   * @returns {Array} Conflicting reservations
   */
  static getConflicts(newReservation, existingReservations) {
    if (!newReservation || !existingReservations || !Array.isArray(existingReservations)) {
      return []
    }

    const { date, slot, tableNumber } = newReservation

    return existingReservations.filter(r =>
      r.date === date &&
      r.slot === slot &&
      r.tableNumber === tableNumber &&
      ['confirmed', 'seated'].includes(r.status)
    )
  }

  /**
   * Calculate suggested tables for reservation
   * Business logic to suggest appropriate tables based on party size
   * @param {number} guests - Number of guests
   * @param {Array} availableTables - Available tables
   * @returns {Array} Suggested table numbers
   */
  static suggestTables(guests, availableTables) {
    if (!guests || !availableTables || !Array.isArray(availableTables)) {
      return []
    }

    // Sort tables by capacity (smallest first)
    const sortedTables = [...availableTables].sort((a, b) => a.capacity - b.capacity)

    // Find smallest table that fits the party
    const perfectFit = sortedTables.find(t => t.capacity >= guests)
    if (perfectFit) {
      return [perfectFit.number]
    }

    // If no single table fits, suggest combination of tables
    // (Simplified logic - could be more sophisticated)
    const suggested = []
    let remainingGuests = guests

    for (const table of sortedTables) {
      if (remainingGuests <= 0) break
      suggested.push(table.number)
      remainingGuests -= table.capacity
    }

    return suggested
  }
}

export default ReservationService
