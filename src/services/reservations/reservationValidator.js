/**
 * Validation logic for reservations
 * Pure functions - no side effects, easy to test
 */

import { RESTAURANT_INFO } from '../../constants'

/**
 * Validate reservation date
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {{ valid: boolean, error?: string }}
 */
export const validateReservationDate = (date) => {
  if (!date) {
    return { valid: false, error: 'Date is required' }
  }

  const reservationDate = new Date(date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (reservationDate < today) {
    return { valid: false, error: 'Cannot book in the past' }
  }

  // Check if date is too far in the future (e.g., 3 months)
  const maxDate = new Date()
  maxDate.setMonth(maxDate.getMonth() + 3)

  if (reservationDate > maxDate) {
    return { valid: false, error: 'Cannot book more than 3 months in advance' }
  }

  return { valid: true }
}

/**
 * Validate number of guests
 * @param {number} guests - Number of guests
 * @returns {{ valid: boolean, error?: string }}
 */
export const validateGuests = (guests) => {
  if (!guests || guests < 1) {
    return { valid: false, error: 'At least 1 guest is required' }
  }

  const maxGuests = RESTAURANT_INFO?.maxGuestsPerReservation || 12

  if (guests > maxGuests) {
    return { valid: false, error: `Maximum ${maxGuests} guests per reservation` }
  }

  return { valid: true }
}

/**
 * Validate time slot
 * @param {number} slot - Slot number
 * @returns {{ valid: boolean, error?: string }}
 */
export const validateTimeSlot = (slot) => {
  if (!slot) {
    return { valid: false, error: 'Time slot is required' }
  }

  // Slots are numbered 1-15 (lunch 1-6, dinner 7-15)
  if (slot < 1 || slot > 15) {
    return { valid: false, error: 'Invalid time slot' }
  }

  return { valid: true }
}

/**
 * Validate phone number format
 * @param {string} phone - Phone number
 * @returns {{ valid: boolean, error?: string }}
 */
export const validatePhone = (phone) => {
  if (!phone) {
    return { valid: false, error: 'Phone number is required' }
  }

  // French phone format: 06/07 XX XX XX XX or 01-09 XX XX XX XX
  const phoneRegex = /^0[1-9][\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}$/

  if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
    return { valid: false, error: 'Invalid phone format (e.g., 06 12 34 56 78)' }
  }

  return { valid: true }
}

/**
 * Validate complete reservation data
 * @param {Object} data - Reservation data
 * @returns {{ valid: boolean, errors: string[] }}
 */
export const validateReservationData = (data) => {
  const errors = []

  // Validate date
  const dateValidation = validateReservationDate(data.date)
  if (!dateValidation.valid) {
    errors.push(dateValidation.error)
  }

  // Validate guests
  const guestsValidation = validateGuests(data.guests)
  if (!guestsValidation.valid) {
    errors.push(guestsValidation.error)
  }

  // Validate time slot
  const slotValidation = validateTimeSlot(data.slot)
  if (!slotValidation.valid) {
    errors.push(slotValidation.error)
  }

  // Validate phone (accept both 'phone' and 'contactPhone' fields)
  const phoneValue = data.phone || data.contactPhone
  const phoneValidation = validatePhone(phoneValue)
  if (!phoneValidation.valid) {
    errors.push(phoneValidation.error)
  }

  // Validate tables (if provided)
  if (data.tableNumber !== undefined) {
    if (!Array.isArray(data.tableNumber) || data.tableNumber.length === 0) {
      errors.push('At least one table must be selected')
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Check if reservation can be modified
 * Business rule: Only pending/confirmed reservations can be modified
 * And only if the reservation time hasn't passed
 * @param {Object} reservation - Reservation object
 * @returns {{ canModify: boolean, reason?: string }}
 */
export const canModifyReservation = (reservation) => {
  if (!reservation) {
    return { canModify: false, reason: 'Reservation not found' }
  }

  // Cannot modify completed, cancelled, or no-show reservations
  const nonModifiableStatuses = ['completed', 'cancelled', 'no-show']
  if (nonModifiableStatuses.includes(reservation.status)) {
    return { canModify: false, reason: `Cannot modify ${reservation.status} reservations` }
  }

  // Check if reservation time has passed
  const reservationDate = new Date(reservation.date)
  const now = new Date()

  if (reservationDate < now) {
    return { canModify: false, reason: 'Cannot modify past reservations' }
  }

  return { canModify: true }
}

/**
 * Check if reservation can be cancelled
 * Business rule: Only pending/confirmed reservations can be cancelled
 * @param {Object} reservation - Reservation object
 * @returns {{ canCancel: boolean, reason?: string }}
 */
export const canCancelReservation = (reservation) => {
  if (!reservation) {
    return { canCancel: false, reason: 'Reservation not found' }
  }

  // Cannot cancel already cancelled, completed, or no-show reservations
  const nonCancellableStatuses = ['cancelled', 'completed', 'no-show']
  if (nonCancellableStatuses.includes(reservation.status)) {
    return { canCancel: false, reason: `Cannot cancel ${reservation.status} reservations` }
  }

  // Check if reservation time has passed
  const reservationDate = new Date(reservation.date)
  const now = new Date()

  if (reservationDate < now) {
    return { canCancel: false, reason: 'Cannot cancel past reservations' }
  }

  return { canCancel: true }
}
