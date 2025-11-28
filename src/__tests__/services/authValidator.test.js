import { describe, it, expect } from 'vitest'
import {
  validateEmail,
  validatePassword,
  validateName,
  validatePasswordMatch,
  validateRegistrationData,
  validateLoginData,
  validateProfileData,
  validatePasswordChange,
  PASSWORD_MIN_LENGTH
} from '../../services/auth/authValidator'

describe('AuthValidator', () => {
  // ============ Email Validation ============
  describe('validateEmail', () => {
    it('should accept valid email', () => {
      const result = validateEmail('test@example.com')
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should accept email with subdomain', () => {
      const result = validateEmail('user@mail.example.com')
      expect(result.valid).toBe(true)
    })

    it('should accept email with plus sign', () => {
      const result = validateEmail('user+tag@example.com')
      expect(result.valid).toBe(true)
    })

    it('should reject empty email', () => {
      const result = validateEmail('')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Email is required')
    })

    it('should reject null email', () => {
      const result = validateEmail(null)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Email is required')
    })

    it('should reject undefined email', () => {
      const result = validateEmail(undefined)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Email is required')
    })

    it('should reject whitespace-only email', () => {
      const result = validateEmail('   ')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Email is required')
    })

    it('should reject email without @', () => {
      const result = validateEmail('testexample.com')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Invalid email format')
    })

    it('should reject email without domain', () => {
      const result = validateEmail('test@')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Invalid email format')
    })

    it('should reject email without TLD', () => {
      const result = validateEmail('test@example')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Invalid email format')
    })

    it('should reject email with spaces', () => {
      const result = validateEmail('test @example.com')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Invalid email format')
    })
  })

  // ============ Password Validation ============
  describe('validatePassword', () => {
    it('should accept valid password', () => {
      const result = validatePassword('password123')
      expect(result.valid).toBe(true)
    })

    it('should accept password at minimum length', () => {
      const result = validatePassword('a'.repeat(PASSWORD_MIN_LENGTH))
      expect(result.valid).toBe(true)
    })

    it('should reject empty password', () => {
      const result = validatePassword('')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Password is required')
    })

    it('should reject null password', () => {
      const result = validatePassword(null)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Password is required')
    })

    it('should reject password below minimum length', () => {
      const result = validatePassword('a'.repeat(PASSWORD_MIN_LENGTH - 1))
      expect(result.valid).toBe(false)
      expect(result.error).toContain('at least')
    })
  })

  // ============ Name Validation ============
  describe('validateName', () => {
    it('should accept valid name', () => {
      const result = validateName('John Doe')
      expect(result.valid).toBe(true)
    })

    it('should accept single character name', () => {
      const result = validateName('J')
      expect(result.valid).toBe(true)
    })

    it('should reject empty name', () => {
      const result = validateName('')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Name is required')
    })

    it('should reject null name', () => {
      const result = validateName(null)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Name is required')
    })

    it('should reject whitespace-only name', () => {
      const result = validateName('   ')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Name is required')
    })
  })

  // ============ Password Match Validation ============
  describe('validatePasswordMatch', () => {
    it('should accept matching passwords', () => {
      const result = validatePasswordMatch('password123', 'password123')
      expect(result.valid).toBe(true)
    })

    it('should reject non-matching passwords', () => {
      const result = validatePasswordMatch('password123', 'password456')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Passwords do not match')
    })

    it('should reject empty confirmation', () => {
      const result = validatePasswordMatch('password123', '')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Please confirm your password')
    })

    it('should reject null confirmation', () => {
      const result = validatePasswordMatch('password123', null)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Please confirm your password')
    })
  })

  // ============ Registration Data Validation ============
  describe('validateRegistrationData', () => {
    const validData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      confirmPassword: 'password123'
    }

    it('should accept valid registration data', () => {
      const result = validateRegistrationData(validData)
      expect(result.valid).toBe(true)
      expect(Object.keys(result.errors)).toHaveLength(0)
    })

    it('should reject missing name', () => {
      const result = validateRegistrationData({ ...validData, name: '' })
      expect(result.valid).toBe(false)
      expect(result.errors.name).toBeDefined()
    })

    it('should reject invalid email', () => {
      const result = validateRegistrationData({ ...validData, email: 'invalid' })
      expect(result.valid).toBe(false)
      expect(result.errors.email).toBeDefined()
    })

    it('should reject short password', () => {
      const result = validateRegistrationData({
        ...validData,
        password: '12345',
        confirmPassword: '12345'
      })
      expect(result.valid).toBe(false)
      expect(result.errors.password).toBeDefined()
    })

    it('should reject mismatched passwords', () => {
      const result = validateRegistrationData({
        ...validData,
        confirmPassword: 'different'
      })
      expect(result.valid).toBe(false)
      expect(result.errors.confirmPassword).toBeDefined()
    })

    it('should return multiple errors for multiple invalid fields', () => {
      const result = validateRegistrationData({
        name: '',
        email: 'invalid',
        password: '123',
        confirmPassword: '456'
      })
      expect(result.valid).toBe(false)
      expect(Object.keys(result.errors).length).toBeGreaterThan(1)
    })
  })

  // ============ Login Data Validation ============
  describe('validateLoginData', () => {
    it('should accept valid login credentials', () => {
      const result = validateLoginData({
        email: 'test@example.com',
        password: 'password123'
      })
      expect(result.valid).toBe(true)
    })

    it('should reject invalid email', () => {
      const result = validateLoginData({
        email: 'invalid',
        password: 'password123'
      })
      expect(result.valid).toBe(false)
      expect(result.errors.email).toBeDefined()
    })

    it('should reject empty password', () => {
      const result = validateLoginData({
        email: 'test@example.com',
        password: ''
      })
      expect(result.valid).toBe(false)
      expect(result.errors.password).toBeDefined()
    })

    it('should reject both invalid', () => {
      const result = validateLoginData({
        email: '',
        password: ''
      })
      expect(result.valid).toBe(false)
      expect(result.errors.email).toBeDefined()
      expect(result.errors.password).toBeDefined()
    })
  })

  // ============ Profile Data Validation ============
  describe('validateProfileData', () => {
    it('should accept valid profile data', () => {
      const result = validateProfileData({
        name: 'John Doe',
        phone: '0123456789'
      })
      expect(result.valid).toBe(true)
    })

    it('should accept empty optional fields', () => {
      const result = validateProfileData({
        name: 'John Doe'
      })
      expect(result.valid).toBe(true)
    })

    it('should reject invalid name', () => {
      const result = validateProfileData({
        name: ''
      })
      expect(result.valid).toBe(false)
      expect(result.errors.name).toBeDefined()
    })

    it('should accept valid phone formats', () => {
      const validPhones = ['0123456789', '+33 1 23 45 67 89', '(01) 23-45-67-89']
      validPhones.forEach(phone => {
        const result = validateProfileData({ phone })
        expect(result.valid).toBe(true)
      })
    })

    it('should reject invalid phone', () => {
      const result = validateProfileData({
        phone: 'abc'
      })
      expect(result.valid).toBe(false)
      expect(result.errors.phone).toBeDefined()
    })
  })

  // ============ Password Change Validation ============
  describe('validatePasswordChange', () => {
    it('should accept valid password change', () => {
      const result = validatePasswordChange('oldpassword', 'newpassword')
      expect(result.valid).toBe(true)
    })

    it('should reject empty current password', () => {
      const result = validatePasswordChange('', 'newpassword')
      expect(result.valid).toBe(false)
      expect(result.errors.currentPassword).toBeDefined()
    })

    it('should reject short new password', () => {
      const result = validatePasswordChange('oldpassword', '123')
      expect(result.valid).toBe(false)
      expect(result.errors.newPassword).toBeDefined()
    })

    it('should reject same old and new password', () => {
      const result = validatePasswordChange('samepassword', 'samepassword')
      expect(result.valid).toBe(false)
      expect(result.errors.newPassword).toContain('different')
    })
  })
})
