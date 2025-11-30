import { describe, it, expect, vi, beforeEach } from 'vitest'
import ContactService, { CONTACT_STATUSES } from '../../services/contacts/contactService'

describe('ContactService', () => {
  // Sample messages for testing
  const mockMessages = [
    {
      _id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      subject: 'Question',
      message: 'My question here',
      status: 'new',
      createdAt: '2024-01-15T10:00:00Z',
      discussion: []
    },
    {
      _id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      subject: 'Reservation',
      message: 'About my reservation',
      status: 'read',
      createdAt: '2024-01-14T09:00:00Z',
      discussion: [
        { _id: 'd1', role: 'admin', text: 'Response', status: 'read', date: '2024-01-14T10:00:00Z' }
      ]
    },
    {
      _id: '3',
      name: 'Bob Wilson',
      email: 'bob@example.com',
      subject: 'Complaint',
      message: 'Issue with order',
      status: 'replied',
      createdAt: '2024-01-13T08:00:00Z',
      discussion: [
        { _id: 'd2', role: 'admin', text: 'Sorry', status: 'new', date: '2024-01-13T09:00:00Z' }
      ]
    },
    {
      _id: '4',
      name: 'Alice Brown',
      email: 'alice@example.com',
      subject: 'Thanks',
      message: 'Great service',
      status: 'newlyReplied',
      createdAt: '2024-01-12T07:00:00Z',
      discussion: [
        { _id: 'd3', role: 'user', text: 'Thanks again', status: 'new', date: '2024-01-12T08:00:00Z' }
      ]
    },
    {
      _id: '5',
      name: 'Charlie Davis',
      email: 'charlie@example.com',
      subject: 'Closed matter',
      message: 'Resolved issue',
      status: 'closed',
      createdAt: '2024-01-11T06:00:00Z',
      discussion: []
    }
  ]

  describe('CONTACT_STATUSES', () => {
    it('should export valid statuses', () => {
      expect(CONTACT_STATUSES).toEqual(['new', 'read', 'replied', 'newlyReplied', 'closed'])
    })
  })

  describe('getStatusDisplayInfo', () => {
    it('should return admin status config by default', () => {
      const info = ContactService.getStatusDisplayInfo('new')
      expect(info.label).toBe('New')
      expect(info.color).toBe('bg-blue-100 text-blue-800')
      expect(info.icon).toBeDefined()
    })

    it('should return user status config when isUserView is true', () => {
      const info = ContactService.getStatusDisplayInfo('new', true)
      expect(info.label).toBe('Sent')
    })

    it('should return different icons for user view', () => {
      const adminReplied = ContactService.getStatusDisplayInfo('replied', false)
      const userReplied = ContactService.getStatusDisplayInfo('replied', true)
      expect(adminReplied.icon).not.toBe(userReplied.icon)
    })

    it('should handle all statuses', () => {
      CONTACT_STATUSES.forEach(status => {
        const adminInfo = ContactService.getStatusDisplayInfo(status, false)
        const userInfo = ContactService.getStatusDisplayInfo(status, true)
        expect(adminInfo.label).toBeDefined()
        expect(userInfo.label).toBeDefined()
      })
    })

    it('should return default for unknown status', () => {
      const info = ContactService.getStatusDisplayInfo('unknown')
      expect(info.label).toBe('New')
    })
  })

  describe('getStatusConfig', () => {
    it('should return full admin config', () => {
      const config = ContactService.getStatusConfig(false)
      expect(Object.keys(config)).toEqual(['new', 'read', 'replied', 'newlyReplied', 'closed'])
      expect(config.new.label).toBe('New')
    })

    it('should return full user config', () => {
      const config = ContactService.getStatusConfig(true)
      expect(config.new.label).toBe('Sent')
      expect(config.replied.label).toBe('Replied')
    })
  })

  describe('getDisplayStatus', () => {
    it('should return closed for closed messages', () => {
      const message = { status: 'closed', discussion: [] }
      expect(ContactService.getDisplayStatus(message)).toBe('closed')
    })

    it('should return new for new messages without discussion', () => {
      const message = { status: 'new', discussion: [] }
      expect(ContactService.getDisplayStatus(message)).toBe('new')
    })

    it('should return read for read messages without discussion', () => {
      const message = { status: 'read', discussion: [] }
      expect(ContactService.getDisplayStatus(message)).toBe('read')
    })

    it('should return replied when last message is from user with new status', () => {
      const message = {
        status: 'replied',
        discussion: [
          { role: 'user', status: 'new', text: 'User reply' }
        ]
      }
      expect(ContactService.getDisplayStatus(message)).toBe('replied')
    })

    it('should return newlyReplied when last admin message is new and contact is replied', () => {
      const message = {
        status: 'replied',
        discussion: [
          { role: 'admin', status: 'new', text: 'Admin reply' }
        ]
      }
      expect(ContactService.getDisplayStatus(message)).toBe('newlyReplied')
    })

    it('should return read for read admin messages', () => {
      const message = {
        status: 'replied',
        discussion: [
          { role: 'admin', status: 'read', text: 'Admin reply' }
        ]
      }
      expect(ContactService.getDisplayStatus(message)).toBe('read')
    })

    it('should handle undefined discussion', () => {
      const message = { status: 'new' }
      expect(ContactService.getDisplayStatus(message)).toBe('new')
    })
  })

  describe('formatDate', () => {
    it('should format date in French locale', () => {
      const result = ContactService.formatDate('2024-01-15T14:30:00Z')
      // The exact output depends on timezone, but should include basic format
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/)
    })

    it('should include time', () => {
      const result = ContactService.formatDate('2024-01-15T14:30:00Z')
      expect(result).toMatch(/\d{2}:\d{2}/)
    })

    it('should accept custom options', () => {
      const result = ContactService.formatDate('2024-01-15T14:30:00Z', { year: undefined })
      expect(result).toBeDefined()
    })
  })

  describe('formatDateFull', () => {
    it('should include weekday', () => {
      const result = ContactService.formatDateFull('2024-01-15T14:30:00Z')
      // Should include a French weekday
      expect(result.length).toBeGreaterThan(15)
    })
  })

  describe('formatDateShort', () => {
    it('should format short date without year', () => {
      const result = ContactService.formatDateShort('2024-01-15T14:30:00Z')
      expect(result).toMatch(/\d{2}\/\d{2}/)
    })
  })

  describe('filterByStatus', () => {
    it('should return all messages when status is all', () => {
      const result = ContactService.filterByStatus(mockMessages, 'all')
      expect(result).toHaveLength(5)
    })

    it('should filter by specific status', () => {
      expect(ContactService.filterByStatus(mockMessages, 'new')).toHaveLength(1)
      expect(ContactService.filterByStatus(mockMessages, 'read')).toHaveLength(1)
      expect(ContactService.filterByStatus(mockMessages, 'replied')).toHaveLength(1)
      expect(ContactService.filterByStatus(mockMessages, 'closed')).toHaveLength(1)
    })

    it('should return empty array for null/undefined input', () => {
      expect(ContactService.filterByStatus(null, 'new')).toEqual([])
      expect(ContactService.filterByStatus(undefined, 'new')).toEqual([])
    })

    it('should return empty array for non-array input', () => {
      expect(ContactService.filterByStatus('not an array', 'new')).toEqual([])
    })
  })

  describe('calculateStats', () => {
    it('should calculate correct stats', () => {
      const stats = ContactService.calculateStats(mockMessages)
      expect(stats).toEqual({
        total: 5,
        new: 1,
        read: 1,
        replied: 1,
        newlyReplied: 1,
        closed: 1
      })
    })

    it('should return zeros for empty array', () => {
      const stats = ContactService.calculateStats([])
      expect(stats).toEqual({
        total: 0,
        new: 0,
        read: 0,
        replied: 0,
        newlyReplied: 0,
        closed: 0
      })
    })

    it('should handle null/undefined input', () => {
      expect(ContactService.calculateStats(null)).toEqual({
        total: 0,
        new: 0,
        read: 0,
        replied: 0,
        newlyReplied: 0,
        closed: 0
      })
    })
  })

  describe('getNewMessagesCount', () => {
    it('should count new and newlyReplied messages', () => {
      expect(ContactService.getNewMessagesCount(mockMessages)).toBe(2)
    })

    it('should return 0 for empty array', () => {
      expect(ContactService.getNewMessagesCount([])).toBe(0)
    })

    it('should handle null/undefined', () => {
      expect(ContactService.getNewMessagesCount(null)).toBe(0)
    })
  })

  describe('hasUnreadReplies', () => {
    it('should return false for message without discussion', () => {
      expect(ContactService.hasUnreadReplies({ discussion: [] }, 'admin')).toBe(false)
      expect(ContactService.hasUnreadReplies({}, 'admin')).toBe(false)
    })

    it('should detect unread user messages for admin', () => {
      const message = {
        discussion: [
          { role: 'user', status: 'new', text: 'User message' }
        ]
      }
      expect(ContactService.hasUnreadReplies(message, 'admin')).toBe(true)
    })

    it('should detect unread admin messages for user', () => {
      const message = {
        discussion: [
          { role: 'admin', status: 'new', text: 'Admin message' }
        ]
      }
      expect(ContactService.hasUnreadReplies(message, 'user')).toBe(true)
    })

    it('should return false when messages are read', () => {
      const message = {
        discussion: [
          { role: 'admin', status: 'read', text: 'Admin message' }
        ]
      }
      expect(ContactService.hasUnreadReplies(message, 'user')).toBe(false)
    })
  })

  describe('getUnreadReplies', () => {
    it('should return empty array for message without discussion', () => {
      expect(ContactService.getUnreadReplies({}, 'admin')).toEqual([])
      expect(ContactService.getUnreadReplies({ discussion: [] }, 'admin')).toEqual([])
    })

    it('should return unread admin messages', () => {
      const message = {
        discussion: [
          { role: 'admin', status: 'new', text: 'New admin' },
          { role: 'admin', status: 'read', text: 'Read admin' },
          { role: 'user', status: 'new', text: 'New user' }
        ]
      }
      const result = ContactService.getUnreadReplies(message, 'admin')
      expect(result).toHaveLength(1)
      expect(result[0].text).toBe('New admin')
    })

    it('should return unread user messages', () => {
      const message = {
        discussion: [
          { role: 'user', status: 'new', text: 'New user' },
          { role: 'user', status: 'read', text: 'Read user' },
          { role: 'admin', status: 'new', text: 'New admin' }
        ]
      }
      const result = ContactService.getUnreadReplies(message, 'user')
      expect(result).toHaveLength(1)
      expect(result[0].text).toBe('New user')
    })
  })

  describe('canReplyToMessage', () => {
    it('should allow reply for open messages', () => {
      expect(ContactService.canReplyToMessage({ status: 'new' })).toEqual({
        canReply: true,
        reason: null
      })
      expect(ContactService.canReplyToMessage({ status: 'replied' })).toEqual({
        canReply: true,
        reason: null
      })
    })

    it('should disallow reply for closed messages', () => {
      const result = ContactService.canReplyToMessage({ status: 'closed' })
      expect(result.canReply).toBe(false)
      expect(result.reason).toContain('closed')
    })
  })

  describe('canAdminReply', () => {
    it('should allow reply for registered users', () => {
      const result = ContactService.canAdminReply({ status: 'new', userId: 'user123' })
      expect(result).toEqual({ canReply: true, reason: null })
    })

    it('should disallow reply for unregistered users', () => {
      expect(ContactService.canAdminReply({ status: 'new', userId: null }).canReply).toBe(false)
      expect(ContactService.canAdminReply({ status: 'new' }).canReply).toBe(false)
    })

    it('should disallow reply for deleted users', () => {
      const result = ContactService.canAdminReply({ status: 'new', userId: 'deleted-user' })
      expect(result.canReply).toBe(false)
      expect(result.reason).toContain('Unregistered')
    })

    it('should disallow reply for closed messages', () => {
      const result = ContactService.canAdminReply({ status: 'closed', userId: 'user123' })
      expect(result.canReply).toBe(false)
    })
  })

  describe('getReplyCount', () => {
    it('should return discussion length', () => {
      expect(ContactService.getReplyCount({ discussion: [1, 2, 3] })).toBe(3)
    })

    it('should return 0 for undefined discussion', () => {
      expect(ContactService.getReplyCount({})).toBe(0)
    })
  })

  describe('sortByDate', () => {
    it('should sort by date descending by default', () => {
      const sorted = ContactService.sortByDate(mockMessages)
      expect(sorted[0]._id).toBe('1') // Most recent
      expect(sorted[sorted.length - 1]._id).toBe('5') // Oldest
    })

    it('should sort ascending when specified', () => {
      const sorted = ContactService.sortByDate(mockMessages, true)
      expect(sorted[0]._id).toBe('5') // Oldest first
      expect(sorted[sorted.length - 1]._id).toBe('1') // Most recent last
    })

    it('should not mutate original array', () => {
      const original = [...mockMessages]
      ContactService.sortByDate(mockMessages)
      expect(mockMessages).toEqual(original)
    })

    it('should handle null/undefined', () => {
      expect(ContactService.sortByDate(null)).toEqual([])
      expect(ContactService.sortByDate(undefined)).toEqual([])
    })
  })

  describe('validateContactForm (delegation)', () => {
    it('should delegate to validator', () => {
      const result = ContactService.validateContactForm({
        name: 'John',
        email: 'john@example.com',
        subject: 'Test',
        message: 'This is a test message'
      })
      expect(result.isValid).toBe(true)
    })
  })

  describe('validateReply (delegation)', () => {
    it('should delegate to validator', () => {
      expect(ContactService.validateReply('Valid reply').isValid).toBe(true)
      expect(ContactService.validateReply('').isValid).toBe(false)
    })
  })

  describe('isContactFormComplete (delegation)', () => {
    it('should delegate to validator', () => {
      expect(ContactService.isContactFormComplete({
        name: 'John',
        email: 'john@example.com',
        subject: 'Test',
        message: 'This is a test message'
      })).toBe(true)
    })
  })
})
