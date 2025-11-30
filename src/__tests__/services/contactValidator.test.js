import { describe, it, expect } from 'vitest'
import {
  validateContactForm,
  isContactFormComplete,
  validateReply
} from '../../services/contacts/contactValidator'

describe('contactValidator', () => {
  describe('validateContactForm', () => {
    const validData = {
      name: 'John Doe',
      email: 'john@example.com',
      subject: 'Question',
      message: 'This is my question about the restaurant'
    }

    // ============ Complete Form Validation ============
    it('should validate complete valid form', () => {
      const result = validateContactForm(validData)
      expect(result.isValid).toBe(true)
      expect(Object.keys(result.errors)).toHaveLength(0)
    })

    it('should return all errors for invalid form', () => {
      const result = validateContactForm({
        name: '',
        email: 'invalid',
        subject: '',
        message: 'short'
      })

      expect(result.isValid).toBe(false)
      expect(result.errors.name).toBe('Name is required')
      expect(result.errors.email).toBeDefined()
      expect(result.errors.subject).toBe('Subject is required')
      expect(result.errors.message).toBe('Message must contain at least 10 characters')
    })

    // ============ Name Validation ============
    it('should reject empty name', () => {
      const result = validateContactForm({ ...validData, name: '' })
      expect(result.isValid).toBe(false)
      expect(result.errors.name).toBe('Name is required')
    })

    it('should reject whitespace-only name', () => {
      const result = validateContactForm({ ...validData, name: '   ' })
      expect(result.isValid).toBe(false)
      expect(result.errors.name).toBe('Name is required')
    })

    it('should reject name too short', () => {
      const result = validateContactForm({ ...validData, name: 'A' })
      expect(result.isValid).toBe(false)
      expect(result.errors.name).toBe('Name must be at least 2 characters')
    })

    it('should accept valid name', () => {
      const result = validateContactForm({ ...validData, name: 'Jo' })
      expect(result.errors.name).toBeUndefined()

      const result2 = validateContactForm({ ...validData, name: 'John Doe' })
      expect(result2.errors.name).toBeUndefined()
    })

    // ============ Email Validation ============
    it('should reject empty email', () => {
      const result = validateContactForm({ ...validData, email: '' })
      expect(result.isValid).toBe(false)
      expect(result.errors.email).toBe('Email is required')
    })

    it('should reject invalid email format', () => {
      const result = validateContactForm({ ...validData, email: 'invalid' })
      expect(result.isValid).toBe(false)
      expect(result.errors.email).toBe('Invalid email format')

      const result2 = validateContactForm({ ...validData, email: 'invalid@' })
      expect(result2.isValid).toBe(false)
    })

    it('should accept valid email', () => {
      const result = validateContactForm({ ...validData, email: 'test@example.com' })
      expect(result.errors.email).toBeUndefined()

      const result2 = validateContactForm({ ...validData, email: 'user.name@domain.co' })
      expect(result2.errors.email).toBeUndefined()
    })

    // ============ Subject Validation ============
    it('should reject empty subject', () => {
      const result = validateContactForm({ ...validData, subject: '' })
      expect(result.isValid).toBe(false)
      expect(result.errors.subject).toBe('Subject is required')
    })

    it('should reject whitespace-only subject', () => {
      const result = validateContactForm({ ...validData, subject: '   ' })
      expect(result.isValid).toBe(false)
      expect(result.errors.subject).toBe('Subject is required')
    })

    it('should accept valid subject', () => {
      const result = validateContactForm({ ...validData, subject: 'Question about reservation' })
      expect(result.errors.subject).toBeUndefined()
    })

    // ============ Message Validation ============
    it('should reject empty message', () => {
      const result = validateContactForm({ ...validData, message: '' })
      expect(result.isValid).toBe(false)
      expect(result.errors.message).toBe('Message is required')
    })

    it('should reject message too short', () => {
      const result = validateContactForm({ ...validData, message: 'Short' })
      expect(result.isValid).toBe(false)
      expect(result.errors.message).toBe('Message must contain at least 10 characters')

      const result2 = validateContactForm({ ...validData, message: '123456789' })
      expect(result2.isValid).toBe(false)
      expect(result2.errors.message).toBe('Message must contain at least 10 characters')
    })

    it('should reject message too long', () => {
      const longMessage = 'a'.repeat(5001)
      const result = validateContactForm({ ...validData, message: longMessage })
      expect(result.isValid).toBe(false)
      expect(result.errors.message).toBe('Message must not exceed 5000 characters')
    })

    it('should accept valid message', () => {
      const result = validateContactForm({ ...validData, message: 'This is a valid message' })
      expect(result.errors.message).toBeUndefined()

      const result2 = validateContactForm({ ...validData, message: '1234567890' })
      expect(result2.errors.message).toBeUndefined()
    })

    // ============ Phone Validation (Optional) ============
    it('should accept empty phone (optional field)', () => {
      const result = validateContactForm({ ...validData, phone: '' })
      expect(result.isValid).toBe(true)
      expect(result.errors.phone).toBeUndefined()

      const result2 = validateContactForm({ ...validData }) // No phone field
      expect(result2.isValid).toBe(true)
    })

    it('should validate phone when provided', () => {
      const result = validateContactForm({ ...validData, phone: '123' })
      expect(result.isValid).toBe(false)
      expect(result.errors.phone).toBeDefined()
    })

    it('should accept valid phone numbers', () => {
      const result = validateContactForm({ ...validData, phone: '06 12 34 56 78' })
      expect(result.errors.phone).toBeUndefined()

      const result2 = validateContactForm({ ...validData, phone: '+33 6 12 34 56 78' })
      expect(result2.errors.phone).toBeUndefined()
    })
  })

  describe('isContactFormComplete', () => {
    it('should return false for incomplete form', () => {
      expect(isContactFormComplete({})).toBe(false)
      expect(isContactFormComplete({ name: 'John' })).toBe(false)
      expect(isContactFormComplete({
        name: 'John',
        email: 'john@example.com',
        subject: 'Test',
        message: 'short' // Too short
      })).toBe(false)
    })

    it('should return false for invalid email', () => {
      expect(isContactFormComplete({
        name: 'John',
        email: 'invalid',
        subject: 'Test',
        message: 'This is a valid message'
      })).toBe(false)
    })

    it('should return true for complete valid form', () => {
      expect(isContactFormComplete({
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Question',
        message: 'This is my question'
      })).toBe(true)
    })

    it('should handle whitespace correctly', () => {
      expect(isContactFormComplete({
        name: '   ',
        email: 'john@example.com',
        subject: 'Test',
        message: 'This is a valid message'
      })).toBe(false)
    })

    it('should require name to be at least 2 characters', () => {
      expect(isContactFormComplete({
        name: 'J',
        email: 'john@example.com',
        subject: 'Test',
        message: 'This is a valid message'
      })).toBe(false)
    })
  })

  describe('validateReply', () => {
    it('should reject empty reply', () => {
      expect(validateReply('')).toEqual({ isValid: false, error: 'Please write a message' })
      expect(validateReply(null)).toEqual({ isValid: false, error: 'Please write a message' })
      expect(validateReply('   ')).toEqual({ isValid: false, error: 'Please write a message' })
    })

    it('should reject reply too long', () => {
      const longReply = 'a'.repeat(1001)
      expect(validateReply(longReply)).toEqual({
        isValid: false,
        error: 'Message is too long (max 1000 characters)'
      })
    })

    it('should accept custom max length', () => {
      const reply = 'a'.repeat(500)
      expect(validateReply(reply, 400)).toEqual({
        isValid: false,
        error: 'Message is too long (max 400 characters)'
      })
      expect(validateReply(reply, 600)).toEqual({ isValid: true, error: null })
    })

    it('should accept valid reply', () => {
      expect(validateReply('This is my reply')).toEqual({ isValid: true, error: null })
      expect(validateReply('OK')).toEqual({ isValid: true, error: null })
    })
  })
})
