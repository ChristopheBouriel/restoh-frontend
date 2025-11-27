import { describe, it, expect } from 'vitest'
import {
  validateReservationDate,
  validateGuests,
  validateTimeSlot,
  validatePhone,
  validateReservationData,
  canModifyReservation,
  canCancelReservation
} from '../../services/reservations/reservationValidator'

describe('reservationValidator', () => {
  describe('validateReservationDate', () => {
    it('should reject missing date', () => {
      const result = validateReservationDate(null)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Date is required')
    })

    it('should reject past date', () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1)
      const dateStr = pastDate.toISOString().split('T')[0]

      const result = validateReservationDate(dateStr)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Cannot book in the past')
    })

    it('should accept today', () => {
      const today = new Date().toISOString().split('T')[0]
      const result = validateReservationDate(today)
      expect(result.valid).toBe(true)
    })

    it('should accept future date within 3 months', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 30)
      const dateStr = futureDate.toISOString().split('T')[0]

      const result = validateReservationDate(dateStr)
      expect(result.valid).toBe(true)
    })

    it('should reject date more than 3 months in the future', () => {
      const farFutureDate = new Date()
      farFutureDate.setMonth(farFutureDate.getMonth() + 4)
      const dateStr = farFutureDate.toISOString().split('T')[0]

      const result = validateReservationDate(dateStr)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Cannot book more than 3 months in advance')
    })
  })

  describe('validateGuests', () => {
    it('should reject zero guests', () => {
      const result = validateGuests(0)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('At least 1 guest is required')
    })

    it('should reject negative guests', () => {
      const result = validateGuests(-1)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('At least 1 guest is required')
    })

    it('should accept 1 guest', () => {
      const result = validateGuests(1)
      expect(result.valid).toBe(true)
    })

    it('should accept valid number of guests', () => {
      const result = validateGuests(4)
      expect(result.valid).toBe(true)
    })

    it('should accept maximum number of guests (12)', () => {
      const result = validateGuests(12)
      expect(result.valid).toBe(true)
    })

    it('should reject more than maximum guests', () => {
      const result = validateGuests(15)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Maximum')
    })
  })

  describe('validateTimeSlot', () => {
    it('should reject missing slot', () => {
      const result = validateTimeSlot(null)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Time slot is required')
    })

    it('should reject slot 0', () => {
      const result = validateTimeSlot(0)
      expect(result.valid).toBe(false)
    })

    it('should accept slot 1 (lunch)', () => {
      const result = validateTimeSlot(1)
      expect(result.valid).toBe(true)
    })

    it('should accept slot 7 (dinner)', () => {
      const result = validateTimeSlot(7)
      expect(result.valid).toBe(true)
    })

    it('should accept slot 15 (last dinner slot)', () => {
      const result = validateTimeSlot(15)
      expect(result.valid).toBe(true)
    })

    it('should reject slot 16 (out of range)', () => {
      const result = validateTimeSlot(16)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Invalid time slot')
    })
  })

  describe('validatePhone', () => {
    it('should reject missing phone', () => {
      const result = validatePhone(null)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Phone number is required')
    })

    it('should reject empty phone', () => {
      const result = validatePhone('')
      expect(result.valid).toBe(false)
    })

    it('should accept valid French mobile phone with spaces', () => {
      const result = validatePhone('06 12 34 56 78')
      expect(result.valid).toBe(true)
    })

    it('should accept valid French mobile phone without spaces', () => {
      const result = validatePhone('0612345678')
      expect(result.valid).toBe(true)
    })

    it('should accept valid French landline', () => {
      const result = validatePhone('01 23 45 67 89')
      expect(result.valid).toBe(true)
    })

    it('should reject invalid phone format', () => {
      const result = validatePhone('123456')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Invalid phone format')
    })

    it('should reject phone with invalid first digit', () => {
      const result = validatePhone('10 12 34 56 78')
      expect(result.valid).toBe(false)
    })
  })

  describe('validateReservationData', () => {
    const validData = {
      date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
      guests: 4,
      slot: 7,
      contactPhone: '06 12 34 56 78',
      tableNumber: [1, 2]
    }

    it('should validate complete valid data', () => {
      const result = validateReservationData(validData)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should accept phone field', () => {
      const dataWithPhone = { ...validData, phone: '06 12 34 56 78' }
      delete dataWithPhone.contactPhone
      const result = validateReservationData(dataWithPhone)
      expect(result.valid).toBe(true)
    })

    it('should accept contactPhone field', () => {
      const result = validateReservationData(validData)
      expect(result.valid).toBe(true)
    })

    it('should collect multiple errors', () => {
      const invalidData = {
        date: null,
        guests: 0,
        slot: null,
        contactPhone: null
      }

      const result = validateReservationData(invalidData)
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(1)
    })

    it('should reject missing date', () => {
      const data = { ...validData, date: null }
      const result = validateReservationData(data)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Date is required')
    })

    it('should reject invalid guests', () => {
      const data = { ...validData, guests: 0 }
      const result = validateReservationData(data)
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('guest'))).toBe(true)
    })

    it('should reject invalid slot', () => {
      const data = { ...validData, slot: null }
      const result = validateReservationData(data)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Time slot is required')
    })

    it('should reject invalid phone', () => {
      const data = { ...validData, contactPhone: '123' }
      const result = validateReservationData(data)
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('phone'))).toBe(true)
    })

    it('should reject empty tableNumber array', () => {
      const data = { ...validData, tableNumber: [] }
      const result = validateReservationData(data)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('At least one table must be selected')
    })

    it('should accept missing tableNumber (optional)', () => {
      const data = { ...validData }
      delete data.tableNumber
      const result = validateReservationData(data)
      expect(result.valid).toBe(true)
    })
  })

  describe('canModifyReservation', () => {
    it('should reject null reservation', () => {
      const result = canModifyReservation(null)
      expect(result.canModify).toBe(false)
      expect(result.reason).toBe('Reservation not found')
    })

    it('should reject completed reservation', () => {
      const reservation = {
        status: 'completed',
        date: new Date(Date.now() + 86400000).toISOString().split('T')[0]
      }
      const result = canModifyReservation(reservation)
      expect(result.canModify).toBe(false)
      expect(result.reason).toContain('Cannot modify completed')
    })

    it('should reject cancelled reservation', () => {
      const reservation = {
        status: 'cancelled',
        date: new Date(Date.now() + 86400000).toISOString().split('T')[0]
      }
      const result = canModifyReservation(reservation)
      expect(result.canModify).toBe(false)
    })

    it('should reject no-show reservation', () => {
      const reservation = {
        status: 'no-show',
        date: new Date(Date.now() + 86400000).toISOString().split('T')[0]
      }
      const result = canModifyReservation(reservation)
      expect(result.canModify).toBe(false)
    })

    it('should reject past reservation', () => {
      const pastDate = new Date(Date.now() - 86400000).toISOString().split('T')[0]
      const reservation = {
        status: 'confirmed',
        date: pastDate
      }
      const result = canModifyReservation(reservation)
      expect(result.canModify).toBe(false)
      expect(result.reason).toBe('Cannot modify past reservations')
    })

    it('should allow modifying confirmed future reservation', () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString().split('T')[0]
      const reservation = {
        status: 'confirmed',
        date: futureDate
      }
      const result = canModifyReservation(reservation)
      expect(result.canModify).toBe(true)
    })

    it('should allow modifying seated reservation', () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString().split('T')[0]
      const reservation = {
        status: 'seated',
        date: futureDate
      }
      const result = canModifyReservation(reservation)
      expect(result.canModify).toBe(true)
    })
  })

  describe('canCancelReservation', () => {
    it('should reject null reservation', () => {
      const result = canCancelReservation(null)
      expect(result.canCancel).toBe(false)
      expect(result.reason).toBe('Reservation not found')
    })

    it('should reject already cancelled reservation', () => {
      const reservation = {
        status: 'cancelled',
        date: new Date(Date.now() + 86400000).toISOString().split('T')[0]
      }
      const result = canCancelReservation(reservation)
      expect(result.canCancel).toBe(false)
      expect(result.reason).toContain('Cannot cancel cancelled')
    })

    it('should reject completed reservation', () => {
      const reservation = {
        status: 'completed',
        date: new Date(Date.now() + 86400000).toISOString().split('T')[0]
      }
      const result = canCancelReservation(reservation)
      expect(result.canCancel).toBe(false)
    })

    it('should reject no-show reservation', () => {
      const reservation = {
        status: 'no-show',
        date: new Date(Date.now() + 86400000).toISOString().split('T')[0]
      }
      const result = canCancelReservation(reservation)
      expect(result.canCancel).toBe(false)
    })

    it('should reject past reservation', () => {
      const pastDate = new Date(Date.now() - 86400000).toISOString().split('T')[0]
      const reservation = {
        status: 'confirmed',
        date: pastDate
      }
      const result = canCancelReservation(reservation)
      expect(result.canCancel).toBe(false)
      expect(result.reason).toBe('Cannot cancel past reservations')
    })

    it('should allow cancelling confirmed future reservation', () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString().split('T')[0]
      const reservation = {
        status: 'confirmed',
        date: futureDate
      }
      const result = canCancelReservation(reservation)
      expect(result.canCancel).toBe(true)
    })

    it('should allow cancelling seated reservation', () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString().split('T')[0]
      const reservation = {
        status: 'seated',
        date: futureDate
      }
      const result = canCancelReservation(reservation)
      expect(result.canCancel).toBe(true)
    })
  })
})
