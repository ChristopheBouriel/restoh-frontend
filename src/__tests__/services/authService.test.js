import { describe, it, expect } from 'vitest'
import { AuthService } from '../../services/auth'

describe('AuthService', () => {
  // ============ Validation Delegation ============
  describe('validation methods', () => {
    it('should validate email', () => {
      expect(AuthService.validateEmail('test@example.com').isValid).toBe(true)
      expect(AuthService.validateEmail('invalid').isValid).toBe(false)
    })

    it('should validate password', () => {
      expect(AuthService.validatePassword('password123').isValid).toBe(true)
      expect(AuthService.validatePassword('123').isValid).toBe(false)
    })

    it('should validate name', () => {
      expect(AuthService.validateName('John').isValid).toBe(true)
      expect(AuthService.validateName('').isValid).toBe(false)
    })

    it('should validate registration data', () => {
      const result = AuthService.validateRegistrationData({
        name: 'John',
        email: 'john@test.com',
        password: 'password123',
        confirmPassword: 'password123'
      })
      expect(result.isValid).toBe(true)
    })

    it('should validate login data', () => {
      const result = AuthService.validateLoginData({
        email: 'john@test.com',
        password: 'password123'
      })
      expect(result.isValid).toBe(true)
    })
  })

  // ============ Helper Methods ============
  describe('isAdmin', () => {
    it('should return true for admin user', () => {
      expect(AuthService.isAdmin({ role: 'admin' })).toBe(true)
    })

    it('should return false for regular user', () => {
      expect(AuthService.isAdmin({ role: 'user' })).toBe(false)
    })

    it('should return false for null user', () => {
      expect(AuthService.isAdmin(null)).toBe(false)
    })

    it('should return false for undefined user', () => {
      expect(AuthService.isAdmin(undefined)).toBe(false)
    })
  })

  describe('isUser', () => {
    it('should return true for regular user', () => {
      expect(AuthService.isUser({ role: 'user' })).toBe(true)
    })

    it('should return false for admin', () => {
      expect(AuthService.isUser({ role: 'admin' })).toBe(false)
    })

    it('should return false for null user', () => {
      expect(AuthService.isUser(null)).toBe(false)
    })
  })

  describe('getUserDisplayName', () => {
    it('should return name if available', () => {
      const user = { name: 'John Doe', email: 'john@test.com' }
      expect(AuthService.getUserDisplayName(user)).toBe('John Doe')
    })

    it('should return email prefix if no name', () => {
      const user = { email: 'john@test.com' }
      expect(AuthService.getUserDisplayName(user)).toBe('john')
    })

    it('should return "Guest" for null user', () => {
      expect(AuthService.getUserDisplayName(null)).toBe('Guest')
    })

    it('should return "User" if no name and no email', () => {
      expect(AuthService.getUserDisplayName({})).toBe('User')
    })
  })

  describe('getUserInitials', () => {
    it('should return two initials for full name', () => {
      const user = { name: 'John Doe' }
      expect(AuthService.getUserInitials(user)).toBe('JD')
    })

    it('should return one initial for single name', () => {
      const user = { name: 'John' }
      expect(AuthService.getUserInitials(user)).toBe('J')
    })

    it('should use email if no name', () => {
      const user = { email: 'john@test.com' }
      expect(AuthService.getUserInitials(user)).toBe('JT')
    })

    it('should return "?" for null user', () => {
      expect(AuthService.getUserInitials(null)).toBe('?')
    })

    it('should return uppercase initials', () => {
      const user = { name: 'john doe' }
      expect(AuthService.getUserInitials(user)).toBe('JD')
    })
  })
})
