import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest'
import { act } from '@testing-library/react'
import useContactsStore from '../../store/contactsStore'
import * as contactsApi from '../../api/contactsApi'

// Mock the API
vi.mock('../../api/contactsApi')

// Mock data
const mockMessages = [
  {
    id: 'msg-001',
    name: 'Marie Dubois',
    email: 'marie.dubois@email.com',
    phone: '06 12 34 56 78',
    subject: 'Question sur les allergènes',
    message: 'Bonjour, pourriez-vous me dire si vos plats végétariens contiennent des traces de fruits à coque ?',
    status: 'new',
    createdAt: '2024-01-20T10:00:00Z',
    readAt: null,
    repliedAt: null
  },
  {
    id: 'msg-002',
    name: 'Pierre Martin',
    email: 'pierre.martin@company.fr',
    phone: '01 23 45 67 89',
    subject: 'Réservation événement d\'entreprise',
    message: 'Nous souhaitons organiser un événement d\'entreprise pour 50 personnes.',
    status: 'read',
    createdAt: '2024-01-19T10:00:00Z',
    readAt: '2024-01-19T14:00:00Z',
    repliedAt: null
  },
  {
    id: 'msg-003',
    name: 'Sophie Laurent',
    email: 'sophie.l@email.com',
    phone: null,
    subject: 'Félicitations',
    message: 'Je voulais simplement vous féliciter pour l\'excellente soirée.',
    status: 'replied',
    createdAt: '2024-01-18T10:00:00Z',
    readAt: '2024-01-18T12:00:00Z',
    repliedAt: '2024-01-18T15:00:00Z'
  },
  {
    id: 'msg-004',
    name: 'Jean Dupont',
    email: 'jean.dupont@email.com',
    phone: '07 11 22 33 44',
    subject: 'Réclamation',
    message: 'Je souhaite signaler un problème...',
    status: 'closed',
    createdAt: '2024-01-17T10:00:00Z',
    readAt: '2024-01-17T12:00:00Z',
    repliedAt: '2024-01-17T14:00:00Z'
  }
]

describe('ContactsStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Reset store state
    act(() => {
      useContactsStore.setState({
        messages: [],
        deletedMessages: [],
        myMessages: [],
        isLoading: false,
        error: null
      })
    })
  })

  // 1. FETCH MESSAGES (ADMIN)
  describe('fetchMessages', () => {
    test('should fetch all messages successfully (admin)', async () => {
      contactsApi.getAllContacts.mockResolvedValue({
        success: true,
        data: mockMessages
      })

      const { fetchMessages } = useContactsStore.getState()

      const result = await fetchMessages()

      expect(result.success).toBe(true)
      expect(contactsApi.getAllContacts).toHaveBeenCalled()

      const state = useContactsStore.getState()
      expect(state.messages).toEqual(mockMessages)
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
    })

    test('should handle fetch error', async () => {
      contactsApi.getAllContacts.mockResolvedValue({
        success: false,
        error: 'Access denied'
      })

      const { fetchMessages } = useContactsStore.getState()

      const result = await fetchMessages()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Access denied')

      const state = useContactsStore.getState()
      expect(state.error).toBe('Access denied')
      expect(state.isLoading).toBe(false)
    })

    test('should handle API exception', async () => {
      contactsApi.getAllContacts.mockRejectedValue({
        error: 'Server unavailable'
      })

      const { fetchMessages } = useContactsStore.getState()

      const result = await fetchMessages()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Server unavailable')
    })
  })

  // 3. FETCH MY MESSAGES (USER)
  describe('fetchMyMessages', () => {
    test('should fetch user\'s own messages successfully', async () => {
      const myMessages = [mockMessages[0], mockMessages[1]]
      contactsApi.getMyContactMessages.mockResolvedValue({
        success: true,
        data: myMessages
      })

      const { fetchMyMessages } = useContactsStore.getState()

      const result = await fetchMyMessages()

      expect(result.success).toBe(true)
      expect(contactsApi.getMyContactMessages).toHaveBeenCalled()

      const state = useContactsStore.getState()
      expect(state.myMessages).toEqual(myMessages)
      expect(state.isLoading).toBe(false)
    })

    test('should handle fetch my messages error', async () => {
      contactsApi.getMyContactMessages.mockResolvedValue({
        success: false,
        error: 'Not authenticated'
      })

      const { fetchMyMessages } = useContactsStore.getState()

      const result = await fetchMyMessages()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Not authenticated')
    })
  })

  // 4. CREATE MESSAGE
  describe('createMessage', () => {
    test('should create message successfully', async () => {
      const newMessage = {
        id: 'msg-new',
        name: 'Test User',
        email: 'test@example.com',
        subject: 'Test Subject',
        message: 'Test message content',
        status: 'new'
      }

      contactsApi.sendContactMessage.mockResolvedValue({
        success: true,
        data: newMessage
      })

      const { createMessage } = useContactsStore.getState()

      const result = await createMessage({
        name: 'Test User',
        email: 'test@example.com',
        subject: 'Test Subject',
        message: 'Test message content'
      })

      expect(result.success).toBe(true)
      expect(result.messageId).toBe('msg-new')
      expect(contactsApi.sendContactMessage).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@example.com',
        subject: 'Test Subject',
        message: 'Test message content'
      })

      const state = useContactsStore.getState()
      expect(state.isLoading).toBe(false)
    })

    test('should handle create message error', async () => {
      contactsApi.sendContactMessage.mockResolvedValue({
        success: false,
        error: 'Invalid email format'
      })

      const { createMessage } = useContactsStore.getState()

      const result = await createMessage({
        name: 'Test',
        email: 'invalid-email',
        subject: 'Test',
        message: 'Test'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid email format')
    })
  })

  // 5. UPDATE MESSAGE STATUS (ADMIN)
  describe('updateMessageStatus', () => {
    test('should update message status successfully', async () => {
      contactsApi.updateContactStatus.mockResolvedValue({
        success: true
      })
      contactsApi.getAllContacts.mockResolvedValue({
        success: true,
        data: mockMessages.map(m =>
          m.id === 'msg-001' ? { ...m, status: 'read' } : m
        )
      })

      const { updateMessageStatus } = useContactsStore.getState()

      const result = await updateMessageStatus('msg-001', 'read')

      expect(result.success).toBe(true)
      expect(contactsApi.updateContactStatus).toHaveBeenCalledWith('msg-001', 'read')
      // Should refetch messages after update
      expect(contactsApi.getAllContacts).toHaveBeenCalled()
    })

    test('should handle update status error', async () => {
      contactsApi.updateContactStatus.mockResolvedValue({
        success: false,
        error: 'Message not found'
      })

      const { updateMessageStatus } = useContactsStore.getState()

      const result = await updateMessageStatus('nonexistent', 'read')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Message not found')
    })
  })

  // 6. MARK AS READ (helper)
  describe('markAsRead', () => {
    test('should mark message as read', async () => {
      contactsApi.updateContactStatus.mockResolvedValue({
        success: true
      })
      contactsApi.getAllContacts.mockResolvedValue({
        success: true,
        data: mockMessages
      })

      const { markAsRead } = useContactsStore.getState()

      const result = await markAsRead('msg-001')

      expect(result.success).toBe(true)
      expect(contactsApi.updateContactStatus).toHaveBeenCalledWith('msg-001', 'read')
    })
  })

  // 7. MARK AS CLOSED (helper)
  describe('markAsClosed', () => {
    test('should mark message as closed', async () => {
      contactsApi.updateContactStatus.mockResolvedValue({
        success: true
      })
      contactsApi.getAllContacts.mockResolvedValue({
        success: true,
        data: mockMessages
      })

      const { markAsClosed } = useContactsStore.getState()

      const result = await markAsClosed('msg-002')

      expect(result.success).toBe(true)
      expect(contactsApi.updateContactStatus).toHaveBeenCalledWith('msg-002', 'closed')
    })
  })

  // 8. ADD REPLY
  describe('addReply', () => {
    test('should add reply successfully', async () => {
      contactsApi.addReplyToDiscussion.mockResolvedValue({
        success: true
      })

      const { addReply } = useContactsStore.getState()

      const result = await addReply('msg-001', 'Thank you for your message!')

      expect(result.success).toBe(true)
      expect(contactsApi.addReplyToDiscussion).toHaveBeenCalledWith('msg-001', 'Thank you for your message!')
    })

    test('should handle add reply error', async () => {
      contactsApi.addReplyToDiscussion.mockResolvedValue({
        success: false,
        error: 'Reply cannot be empty'
      })

      const { addReply } = useContactsStore.getState()

      const result = await addReply('msg-001', '')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Reply cannot be empty')
    })
  })

  // 9. MARK DISCUSSION MESSAGE AS READ
  describe('markDiscussionMessageAsRead', () => {
    test('should mark discussion message as read', async () => {
      contactsApi.markDiscussionMessageAsRead.mockResolvedValue({
        success: true
      })

      const { markDiscussionMessageAsRead } = useContactsStore.getState()

      const result = await markDiscussionMessageAsRead('msg-001', 'disc-001')

      expect(result.success).toBe(true)
      expect(contactsApi.markDiscussionMessageAsRead).toHaveBeenCalledWith('msg-001', 'disc-001')
    })

    test('should handle mark discussion error', async () => {
      contactsApi.markDiscussionMessageAsRead.mockResolvedValue({
        success: false,
        error: 'Discussion not found'
      })

      const { markDiscussionMessageAsRead } = useContactsStore.getState()

      const result = await markDiscussionMessageAsRead('msg-001', 'invalid')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Discussion not found')
    })
  })

  // 10. ARCHIVE MESSAGE (soft delete)
  describe('archiveMessage', () => {
    test('should archive message successfully', async () => {
      contactsApi.deleteContact.mockResolvedValue({
        success: true
      })
      contactsApi.getAllContacts.mockResolvedValue({
        success: true,
        data: mockMessages.filter(m => m.id !== 'msg-001')
      })

      const { archiveMessage } = useContactsStore.getState()

      const result = await archiveMessage('msg-001')

      expect(result.success).toBe(true)
      expect(contactsApi.deleteContact).toHaveBeenCalledWith('msg-001')
      // Should refetch after archiving
      expect(contactsApi.getAllContacts).toHaveBeenCalled()
    })

    test('should handle archive error', async () => {
      contactsApi.deleteContact.mockResolvedValue({
        success: false,
        error: 'Cannot archive this message'
      })

      const { archiveMessage } = useContactsStore.getState()

      const result = await archiveMessage('msg-001')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Cannot archive this message')
    })

    test('should handle archive exception', async () => {
      contactsApi.deleteContact.mockRejectedValue({
        error: 'Server error'
      })

      const { archiveMessage } = useContactsStore.getState()

      const result = await archiveMessage('msg-001')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Server error')
    })
  })

  // 11. FETCH DELETED MESSAGES
  describe('fetchDeletedMessages', () => {
    const mockDeletedMessages = [
      {
        id: 'msg-deleted-001',
        name: 'Archived User',
        email: 'archived@email.com',
        subject: 'Archived message',
        message: 'This message was archived',
        status: 'closed',
        isDeleted: true,
        deletedBy: { firstName: 'Admin', lastName: 'User' },
        deletedAt: '2024-01-20T10:00:00Z'
      }
    ]

    test('should fetch deleted messages successfully', async () => {
      contactsApi.getDeletedContacts.mockResolvedValue({
        success: true,
        data: mockDeletedMessages
      })

      const { fetchDeletedMessages } = useContactsStore.getState()

      const result = await fetchDeletedMessages()

      expect(result.success).toBe(true)
      expect(contactsApi.getDeletedContacts).toHaveBeenCalledWith({})

      const state = useContactsStore.getState()
      expect(state.deletedMessages).toEqual(mockDeletedMessages)
      expect(state.isLoading).toBe(false)
    })

    test('should pass params to API', async () => {
      contactsApi.getDeletedContacts.mockResolvedValue({
        success: true,
        data: []
      })

      const { fetchDeletedMessages } = useContactsStore.getState()

      await fetchDeletedMessages({ page: 2, limit: 10 })

      expect(contactsApi.getDeletedContacts).toHaveBeenCalledWith({ page: 2, limit: 10 })
    })

    test('should handle fetch deleted messages error', async () => {
      contactsApi.getDeletedContacts.mockResolvedValue({
        success: false,
        error: 'Access denied'
      })

      const { fetchDeletedMessages } = useContactsStore.getState()

      const result = await fetchDeletedMessages()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Access denied')
    })
  })

  // 12. RESTORE MESSAGE
  describe('restoreMessage', () => {
    test('should restore message successfully', async () => {
      contactsApi.restoreContact.mockResolvedValue({
        success: true,
        data: { ...mockMessages[0], isDeleted: false }
      })
      contactsApi.getAllContacts.mockResolvedValue({
        success: true,
        data: mockMessages
      })
      contactsApi.getDeletedContacts.mockResolvedValue({
        success: true,
        data: []
      })

      const { restoreMessage } = useContactsStore.getState()

      const result = await restoreMessage('msg-001')

      expect(result.success).toBe(true)
      expect(contactsApi.restoreContact).toHaveBeenCalledWith('msg-001')
      // Should refetch both lists
      expect(contactsApi.getAllContacts).toHaveBeenCalled()
      expect(contactsApi.getDeletedContacts).toHaveBeenCalled()
    })

    test('should handle restore error', async () => {
      contactsApi.restoreContact.mockResolvedValue({
        success: false,
        error: 'Message not found'
      })

      const { restoreMessage } = useContactsStore.getState()

      const result = await restoreMessage('nonexistent')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Message not found')
    })

    test('should handle restore exception', async () => {
      contactsApi.restoreContact.mockRejectedValue({
        error: 'Server error'
      })

      const { restoreMessage } = useContactsStore.getState()

      const result = await restoreMessage('msg-001')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Server error')
    })
  })

  // 13. GETTERS (local computations)
  describe('Getters', () => {
    beforeEach(() => {
      act(() => {
        useContactsStore.setState({ messages: mockMessages })
      })
    })

    test('should filter messages by status', () => {
      const { getMessagesByStatus } = useContactsStore.getState()

      const newMessages = getMessagesByStatus('new')
      expect(newMessages).toHaveLength(1)
      expect(newMessages[0].status).toBe('new')

      const readMessages = getMessagesByStatus('read')
      expect(readMessages).toHaveLength(1)
      expect(readMessages[0].status).toBe('read')

      const repliedMessages = getMessagesByStatus('replied')
      expect(repliedMessages).toHaveLength(1)
      expect(repliedMessages[0].status).toBe('replied')
    })

    test('should count new messages', () => {
      const { getNewMessagesCount } = useContactsStore.getState()

      const count = getNewMessagesCount()
      expect(count).toBe(1) // Only msg-001 has status 'new'
    })

    test('should count new and newlyReplied messages together', () => {
      // Add a newlyReplied message
      act(() => {
        useContactsStore.setState({
          messages: [
            ...mockMessages,
            { id: 'msg-005', status: 'newlyReplied', name: 'Test' }
          ]
        })
      })

      const { getNewMessagesCount } = useContactsStore.getState()

      const count = getNewMessagesCount()
      expect(count).toBe(2) // 1 new + 1 newlyReplied
    })
  })

  // 14. STATISTICS
  describe('Statistics', () => {
    test('should calculate message statistics correctly', () => {
      act(() => {
        useContactsStore.setState({
          messages: [
            { id: '1', status: 'new' },
            { id: '2', status: 'new' },
            { id: '3', status: 'read' },
            { id: '4', status: 'replied' },
            { id: '5', status: 'newlyReplied' },
            { id: '6', status: 'closed' }
          ]
        })
      })

      const { getMessagesStats } = useContactsStore.getState()
      const stats = getMessagesStats()

      expect(stats).toEqual({
        total: 6,
        new: 2,
        read: 1,
        replied: 1,
        newlyReplied: 1,
        closed: 1
      })
    })

    test('should handle empty messages for statistics', () => {
      act(() => {
        useContactsStore.setState({ messages: [] })
      })

      const { getMessagesStats } = useContactsStore.getState()
      const stats = getMessagesStats()

      expect(stats).toEqual({
        total: 0,
        new: 0,
        read: 0,
        replied: 0,
        newlyReplied: 0,
        closed: 0
      })
    })
  })

})
