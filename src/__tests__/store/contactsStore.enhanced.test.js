import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import useContactsStore from '../../store/contactsStore'
import * as contactsApi from '../../api/contactsApi'

// Mock the API module
vi.mock('../../api/contactsApi')

describe('contactsStore - Enhanced Features', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Reset store to initial state
    const { result } = renderHook(() => useContactsStore())
    act(() => {
      result.current.messages = []
      result.current.myMessages = []
      result.current.isLoading = false
      result.current.error = null
    })
  })

  // 1. FETCH MESSAGES (ADMIN)
  describe('fetchMessages (Admin)', () => {
    it('should fetch all messages successfully', async () => {
      const mockMessages = [
        {
          _id: 'msg-001',
          userId: 'user-123',
          userName: 'John Doe',
          userEmail: 'john@example.com',
          subject: 'Question',
          message: 'Test message',
          status: 'new',
          discussion: [],
          createdAt: '2024-01-20T10:00:00Z'
        }
      ]

      contactsApi.getAllContacts.mockResolvedValue({
        success: true,
        data: mockMessages
      })

      const { result } = renderHook(() => useContactsStore())

      await act(async () => {
        await result.current.fetchMessages()
      })

      expect(contactsApi.getAllContacts).toHaveBeenCalled()
      expect(result.current.messages).toEqual(mockMessages)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should handle fetch error', async () => {
      contactsApi.getAllContacts.mockResolvedValue({
        success: false,
        error: 'Network error'
      })

      const { result } = renderHook(() => useContactsStore())

      await act(async () => {
        await result.current.fetchMessages()
      })

      expect(result.current.error).toBe('Network error')
      expect(result.current.isLoading).toBe(false)
    })
  })

  // 2. FETCH MY MESSAGES (USER)
  describe('fetchMyMessages (User)', () => {
    it('should fetch user messages successfully', async () => {
      const mockMyMessages = [
        {
          _id: 'msg-001',
          subject: 'My question',
          message: 'Test message',
          status: 'replied',
          discussion: [
            {
              _id: 'reply-001',
              userId: 'admin-123',
              name: 'Admin User',
              role: 'admin',
              text: 'Response',
              date: '2024-01-20T11:00:00Z',
              status: 'new'
            }
          ],
          createdAt: '2024-01-20T10:00:00Z'
        }
      ]

      contactsApi.getMyContactMessages.mockResolvedValue({
        success: true,
        data: mockMyMessages
      })

      const { result } = renderHook(() => useContactsStore())

      await act(async () => {
        await result.current.fetchMyMessages()
      })

      expect(contactsApi.getMyContactMessages).toHaveBeenCalled()
      expect(result.current.myMessages).toEqual(mockMyMessages)
      expect(result.current.isLoading).toBe(false)
    })
  })

  // 3. UPDATE MESSAGE STATUS
  describe('updateMessageStatus', () => {
    it('should update message status to replied', async () => {
      contactsApi.updateContactStatus.mockResolvedValue({
        success: true
      })

      contactsApi.getAllContacts.mockResolvedValue({
        success: true,
        data: [{
          _id: 'msg-001',
          status: 'replied'
        }]
      })

      const { result } = renderHook(() => useContactsStore())

      await act(async () => {
        const updateResult = await result.current.updateMessageStatus('msg-001', 'replied')
        expect(updateResult.success).toBe(true)
      })

      expect(contactsApi.updateContactStatus).toHaveBeenCalledWith('msg-001', 'replied')
    })

    it('should update message status to closed', async () => {
      contactsApi.updateContactStatus.mockResolvedValue({
        success: true
      })

      contactsApi.getAllContacts.mockResolvedValue({
        success: true,
        data: [{
          _id: 'msg-001',
          status: 'closed'
        }]
      })

      const { result } = renderHook(() => useContactsStore())

      await act(async () => {
        await result.current.markAsClosed('msg-001')
      })

      expect(contactsApi.updateContactStatus).toHaveBeenCalledWith('msg-001', 'closed')
    })
  })

  // 4. ADD REPLY TO DISCUSSION
  describe('addReply', () => {
    it('should add reply without from parameter', async () => {
      contactsApi.addReplyToDiscussion.mockResolvedValue({
        success: true
      })

      const { result } = renderHook(() => useContactsStore())

      await act(async () => {
        const addResult = await result.current.addReply('msg-001', 'This is my reply')
        expect(addResult.success).toBe(true)
      })

      // Should NOT include 'from' parameter
      expect(contactsApi.addReplyToDiscussion).toHaveBeenCalledWith('msg-001', 'This is my reply')
    })

    it('should handle reply error', async () => {
      contactsApi.addReplyToDiscussion.mockResolvedValue({
        success: false,
        error: 'Failed to add reply'
      })

      const { result } = renderHook(() => useContactsStore())

      await act(async () => {
        const addResult = await result.current.addReply('msg-001', 'This is my reply')
        expect(addResult.success).toBe(false)
        expect(addResult.error).toBe('Failed to add reply')
      })
    })
  })

  // 5. MARK DISCUSSION MESSAGE AS READ
  describe('markDiscussionMessageAsRead', () => {
    it('should mark discussion message as read', async () => {
      contactsApi.markDiscussionMessageAsRead.mockResolvedValue({
        success: true
      })

      const { result } = renderHook(() => useContactsStore())

      await act(async () => {
        const markResult = await result.current.markDiscussionMessageAsRead('msg-001', 'reply-001')
        expect(markResult.success).toBe(true)
      })

      expect(contactsApi.markDiscussionMessageAsRead).toHaveBeenCalledWith('msg-001', 'reply-001')
    })

    it('should handle mark as read error', async () => {
      contactsApi.markDiscussionMessageAsRead.mockResolvedValue({
        success: false,
        error: 'Permission denied'
      })

      const { result } = renderHook(() => useContactsStore())

      await act(async () => {
        const markResult = await result.current.markDiscussionMessageAsRead('msg-001', 'reply-001')
        expect(markResult.success).toBe(false)
      })

      expect(result.current.error).toBe('Permission denied')
    })
  })

  // 6. STATISTICS AND FILTERING
  describe('Statistics and Filtering', () => {
    beforeEach(async () => {
      const mockMessages = [
        { _id: 'msg-001', status: 'new' },
        { _id: 'msg-002', status: 'new' },
        { _id: 'msg-003', status: 'read' },
        { _id: 'msg-004', status: 'replied' },
        { _id: 'msg-005', status: 'newlyReplied' },
        { _id: 'msg-006', status: 'closed' }
      ]

      contactsApi.getAllContacts.mockResolvedValue({
        success: true,
        data: mockMessages
      })

      const { result } = renderHook(() => useContactsStore())

      await act(async () => {
        await result.current.fetchMessages()
      })
    })

    it('should calculate correct statistics', () => {
      const { result } = renderHook(() => useContactsStore())

      const stats = result.current.getMessagesStats()

      expect(stats).toEqual({
        total: 6,
        new: 2,
        read: 1,
        replied: 1,
        newlyReplied: 1,
        closed: 1
      })
    })

    it('should count new messages including newlyReplied', () => {
      const { result } = renderHook(() => useContactsStore())

      const newCount = result.current.getNewMessagesCount()

      expect(newCount).toBe(3) // 2 new + 1 newlyReplied
    })

    it('should filter messages by status', () => {
      const { result } = renderHook(() => useContactsStore())

      const newMessages = result.current.getMessagesByStatus('new')
      const repliedMessages = result.current.getMessagesByStatus('replied')

      expect(newMessages).toHaveLength(2)
      expect(repliedMessages).toHaveLength(1)
    })
  })

  // 7. DELETE MESSAGE
  describe('deleteMessage', () => {
    it('should delete message successfully', async () => {
      contactsApi.deleteContact.mockResolvedValue({
        success: true
      })

      contactsApi.getAllContacts.mockResolvedValue({
        success: true,
        data: []
      })

      const { result } = renderHook(() => useContactsStore())

      await act(async () => {
        const deleteResult = await result.current.deleteMessage('msg-001')
        expect(deleteResult.success).toBe(true)
      })

      expect(contactsApi.deleteContact).toHaveBeenCalledWith('msg-001')
    })

    it('should handle deletion error', async () => {
      contactsApi.deleteContact.mockResolvedValue({
        success: false,
        error: 'Cannot delete message'
      })

      const { result } = renderHook(() => useContactsStore())

      await act(async () => {
        const deleteResult = await result.current.deleteMessage('msg-001')
        expect(deleteResult.success).toBe(false)
        expect(deleteResult.error).toBe('Cannot delete message')
      })
    })
  })

  // 8. CREATE MESSAGE
  describe('createMessage', () => {
    it('should create message with userId for registered users', async () => {
      const messageData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '0123456789',
        subject: 'Test - Question',
        message: 'This is a test message'
      }

      contactsApi.sendContactMessage.mockResolvedValue({
        success: true,
        data: {
          _id: 'msg-new-001',
          ...messageData
        }
      })

      const { result } = renderHook(() => useContactsStore())

      await act(async () => {
        const createResult = await result.current.createMessage(messageData)
        expect(createResult.success).toBe(true)
        expect(createResult.messageId).toBe('msg-new-001')
      })

      expect(contactsApi.sendContactMessage).toHaveBeenCalledWith(messageData)
    })

    it('should handle creation error', async () => {
      contactsApi.sendContactMessage.mockResolvedValue({
        success: false,
        error: 'Validation failed'
      })

      const { result } = renderHook(() => useContactsStore())

      await act(async () => {
        const createResult = await result.current.createMessage({
          name: 'Test',
          email: 'test@test.com',
          subject: 'Test',
          message: 'Test'
        })

        expect(createResult.success).toBe(false)
        expect(createResult.error).toBe('Validation failed')
      })
    })
  })

  // 9. ERROR HANDLING
  describe('Error Handling', () => {
    it('should set error state on API failure', async () => {
      contactsApi.getAllContacts.mockResolvedValue({
        success: false,
        error: 'Server error'
      })

      const { result } = renderHook(() => useContactsStore())

      await act(async () => {
        await result.current.fetchMessages()
      })

      expect(result.current.error).toBe('Server error')
      expect(result.current.isLoading).toBe(false)
    })

    it('should clear error on successful operation', async () => {
      const { result } = renderHook(() => useContactsStore())

      // Set error
      act(() => {
        result.current.error = 'Previous error'
      })

      // Successful operation
      contactsApi.getAllContacts.mockResolvedValue({
        success: true,
        data: []
      })

      await act(async () => {
        await result.current.fetchMessages()
      })

      expect(result.current.error).toBeNull()
    })

    it('should clear error manually', () => {
      const { result } = renderHook(() => useContactsStore())

      act(() => {
        result.current.error = 'Some error'
      })

      expect(result.current.error).toBe('Some error')

      act(() => {
        result.current.clearError()
      })

      expect(result.current.error).toBeNull()
    })
  })

  // 10. LOADING STATES
  describe('Loading States', () => {
    it('should set loading to true during fetch', async () => {
      let resolvePromise
      const promise = new Promise(resolve => {
        resolvePromise = resolve
      })

      contactsApi.getAllContacts.mockReturnValue(promise)

      const { result } = renderHook(() => useContactsStore())

      act(() => {
        result.current.fetchMessages()
      })

      // Check loading is true
      expect(result.current.isLoading).toBe(true)

      // Resolve promise
      await act(async () => {
        resolvePromise({ success: true, data: [] })
        await promise
      })

      // Loading should be false after completion
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })

    it('should reset loading on error', async () => {
      contactsApi.getAllContacts.mockResolvedValue({
        success: false,
        error: 'Failed'
      })

      const { result } = renderHook(() => useContactsStore())

      await act(async () => {
        await result.current.fetchMessages()
      })

      expect(result.current.isLoading).toBe(false)
    })
  })
})
