/**
 * Reservation validation functions
 * Compact style - main validation function with inline field validation
 *
 * Convention: All validators return { isValid: boolean, error: string|null }
 * For multiple errors: { isValid: boolean, errors: string[] }
 */

import { RESTAURANT_INFO } from '../../constants'
import { validatePhoneFrench } from '../common/validators'

/**
 * Validate complete reservation data
 * @param {Object} data - Reservation data
 * @param {string} data.date - Date in YYYY-MM-DD format
 * @param {number} data.guests - Number of guests
 * @param {number} data.slot - Time slot number (1-15)
 * @param {string} [data.phone] - Phone number
 * @param {string} [data.contactPhone] - Alternative phone field
 * @param {number[]} [data.tableNumber] - Array of table numbers (optional)
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export const validateReservationData = (data) => {
  const errors = []

  // Date validation
  if (!data.date) {
    errors.push('Date is required')
  } else {
    const reservationDate = new Date(data.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (reservationDate < today) {
      errors.push('Cannot book in the past')
    } else {
      const maxDate = new Date()
      maxDate.setMonth(maxDate.getMonth() + 3)
      if (reservationDate > maxDate) {
        errors.push('Cannot book more than 3 months in advance')
      }
    }
  }

  // Guests validation
  if (!data.guests || data.guests < 1) {
    errors.push('At least 1 guest is required')
  } else {
    const maxGuests = RESTAURANT_INFO?.maxGuestsPerReservation || 12
    if (data.guests > maxGuests) {
      errors.push(`Maximum ${maxGuests} guests per reservation`)
    }
  }

  // Time slot validation
  if (!data.slot) {
    errors.push('Time slot is required')
  } else if (data.slot < 1 || data.slot > 15) {
    errors.push('Invalid time slot')
  }

  // Phone validation (using common validator)
  const phoneValue = data.phone || data.contactPhone
  const phoneResult = validatePhoneFrench(phoneValue, true)
  if (!phoneResult.isValid) {
    errors.push(phoneResult.error)
  }

  // Tables validation (if provided)
  if (data.tableNumber !== undefined) {
    if (!Array.isArray(data.tableNumber) || data.tableNumber.length === 0) {
      errors.push('At least one table must be selected')
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validate reservation date only
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {{ isValid: boolean, error: string|null }}
 */
export const validateReservationDate = (date) => {
  if (!date) {
    return { isValid: false, error: 'Date is required' }
  }

  const reservationDate = new Date(date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (reservationDate < today) {
    return { isValid: false, error: 'Cannot book in the past' }
  }

  const maxDate = new Date()
  maxDate.setMonth(maxDate.getMonth() + 3)

  if (reservationDate > maxDate) {
    return { isValid: false, error: 'Cannot book more than 3 months in advance' }
  }

  return { isValid: true, error: null }
}

/**
 * Validate number of guests
 * @param {number} guests - Number of guests
 * @returns {{ isValid: boolean, error: string|null }}
 */
export const validateGuests = (guests) => {
  if (!guests || guests < 1) {
    return { isValid: false, error: 'At least 1 guest is required' }
  }

  const maxGuests = RESTAURANT_INFO?.maxGuestsPerReservation || 12

  if (guests > maxGuests) {
    return { isValid: false, error: `Maximum ${maxGuests} guests per reservation` }
  }

  return { isValid: true, error: null }
}

/**
 * Validate time slot
 * @param {number} slot - Slot number (1-15)
 * @returns {{ isValid: boolean, error: string|null }}
 */
export const validateTimeSlot = (slot) => {
  if (!slot) {
    return { isValid: false, error: 'Time slot is required' }
  }

  if (slot < 1 || slot > 15) {
    return { isValid: false, error: 'Invalid time slot' }
  }

  return { isValid: true, error: null }
}

/**
 * Check if reservation can be modified
 * Business rule: Only pending/confirmed/seated reservations can be modified
 * And only if the reservation time hasn't passed
 * @param {Object} reservation - Reservation object
 * @returns {{ canModify: boolean, reason: string|null }}
 */
export const canModifyReservation = (reservation) => {
  if (!reservation) {
    return { canModify: false, reason: 'Reservation not found' }
  }

  const nonModifiableStatuses = ['completed', 'cancelled', 'no-show']
  if (nonModifiableStatuses.includes(reservation.status)) {
    return { canModify: false, reason: `Cannot modify ${reservation.status} reservations` }
  }

  const reservationDate = new Date(reservation.date)
  const now = new Date()

  if (reservationDate < now) {
    return { canModify: false, reason: 'Cannot modify past reservations' }
  }

  return { canModify: true, reason: null }
}

/**
 * Check if reservation can be cancelled
 * Business rule: Only pending/confirmed/seated reservations can be cancelled
 * And only if the reservation time hasn't passed
 * @param {Object} reservation - Reservation object
 * @returns {{ canCancel: boolean, reason: string|null }}
 */
export const canCancelReservation = (reservation) => {
  if (!reservation) {
    return { canCancel: false, reason: 'Reservation not found' }
  }

  const nonCancellableStatuses = ['cancelled', 'completed', 'no-show']
  if (nonCancellableStatuses.includes(reservation.status)) {
    return { canCancel: false, reason: `Cannot cancel ${reservation.status} reservations` }
  }

  const reservationDate = new Date(reservation.date)
  const now = new Date()

  if (reservationDate < now) {
    return { canCancel: false, reason: 'Cannot cancel past reservations' }
  }

  return { canCancel: true, reason: null }
}
