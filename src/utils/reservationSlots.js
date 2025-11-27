/**
 * Time slots configuration for reservations
 * Format: { slot: number, label: string }
 * The slot number is sent to the backend
 */

// Lunch slots (11:00 - 13:30)
export const LUNCH_SLOTS = [
  { slot: 1, label: '11:00' },
  { slot: 2, label: '11:30' },
  { slot: 3, label: '12:00' },
  { slot: 4, label: '12:30' },
  { slot: 5, label: '13:00' },
  { slot: 6, label: '13:30' }
]

// Dinner slots (18:00 - 22:00)
export const DINNER_SLOTS = [
  { slot: 7, label: '18:00' },
  { slot: 8, label: '18:30' },
  { slot: 9, label: '19:00' },
  { slot: 10, label: '19:30' },
  { slot: 11, label: '20:00' },
  { slot: 12, label: '20:30' },
  { slot: 13, label: '21:00' },
  { slot: 14, label: '21:30' },
  { slot: 15, label: '22:00' }
]

// All slots combined (lunch first, then dinner)
export const TIME_SLOTS = [...LUNCH_SLOTS, ...DINNER_SLOTS]

/**
 * Get label from slot number
 * @param {number} slotNumber - Slot number
 * @returns {string} Time label or 'N/A' if not found
 */
export const getLabelFromSlot = (slotNumber) => {
  const slot = TIME_SLOTS.find(s => s.slot === slotNumber)
  return slot ? slot.label : 'N/A'
}

/**
 * Get full slot object from slot number
 * @param {number} slotNumber - Slot number
 * @returns {object|null} Slot object or null if not found
 */
export const getSlotByNumber = (slotNumber) => {
  return TIME_SLOTS.find(s => s.slot === slotNumber) || null
}

/**
 * Check if reservation time has passed
 * @param {string} reservationDate - Date in YYYY-MM-DD format
 * @param {number} slotNumber - Slot number
 * @returns {boolean} True if reservation time has passed
 */
export const isReservationTimePassed = (reservationDate, slotNumber) => {
  if (!reservationDate || !slotNumber) return false

  const slot = getSlotByNumber(slotNumber)
  if (!slot) return false

  // Parse the time from slot label (format: "HH:MM")
  const [hours, minutes] = slot.label.split(':').map(Number)

  // Parse date safely in local timezone (avoid UTC conversion)
  const dateParts = reservationDate.split('T')[0].split('-')
  const year = parseInt(dateParts[0], 10)
  const month = parseInt(dateParts[1], 10) - 1 // Month is 0-indexed
  const day = parseInt(dateParts[2], 10)

  // Create reservation datetime in local timezone
  const reservationDateTime = new Date(year, month, day, hours, minutes, 0, 0)

  // Compare with current time
  const now = new Date()
  return now > reservationDateTime
}
