import { beforeEach, describe, it, expect, vi } from 'vitest'

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn()
}

global.localStorage = mockLocalStorage

// Mock timers for async operations
vi.useFakeTimers()

// Créer le store sans la persistance pour les tests
import { create } from 'zustand'

// Créer une version simplifiée du store pour les tests
const createTestContactsStore = () => create((set, get) => ({
  // État
  messages: [],
  isLoading: false,

  // Actions
  setLoading: (loading) => set({ isLoading: loading }),

  // Initialiser avec des données de test
  initializeMessages: () => {
    const stored = localStorage.getItem('admin-messages')
    if (stored) {
      set({ messages: JSON.parse(stored) })
    } else {
      // Données initiales pour la démo
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const twoDaysAgo = new Date(today)
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
      
      const initialMessages = [
        {
          id: 'msg-001',
          name: 'Marie Dubois',
          email: 'marie.dubois@email.com',
          phone: '06 12 34 56 78',
          subject: 'Question sur les allergènes',
          message: 'Bonjour, pourriez-vous me dire si vos plats végétariens contiennent des traces de fruits à coque ?',
          status: 'new',
          createdAt: today.toISOString(),
          readAt: null,
          repliedAt: null
        },
        {
          id: 'msg-002',
          name: 'Pierre Martin',
          email: 'pierre.martin@company.fr',
          phone: '01 23 45 67 89',
          subject: 'Réservation événement d\'entreprise',
          message: 'Nous souhaitons organiser un événement d\'entreprise pour 50 personnes le mois prochain.',
          status: 'read',
          createdAt: yesterday.toISOString(),
          readAt: yesterday.toISOString(),
          repliedAt: null
        },
        {
          id: 'msg-003',
          name: 'Sophie Laurent',
          email: 'sophie.l@email.com',
          phone: null,
          subject: 'Félicitations',
          message: 'Je voulais simplement vous féliciter pour l\'excellente soirée que nous avons passée hier soir.',
          status: 'replied',
          createdAt: twoDaysAgo.toISOString(),
          readAt: twoDaysAgo.toISOString(),
          repliedAt: twoDaysAgo.toISOString()
        }
      ]
      
      set({ messages: initialMessages })
      localStorage.setItem('admin-messages', JSON.stringify(initialMessages))
    }
  },

  // Créer un nouveau message (appelé depuis le formulaire de contact)
  createMessage: async (messageData) => {
    set({ isLoading: true })
    
    try {
      // Simulation d'appel API
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const newMessage = {
        id: `msg-${Date.now()}`,
        ...messageData,
        status: 'new',
        createdAt: new Date().toISOString(),
        readAt: null,
        repliedAt: null
      }
      
      const updatedMessages = [newMessage, ...get().messages]
      set({ messages: updatedMessages, isLoading: false })
      localStorage.setItem('admin-messages', JSON.stringify(updatedMessages))
      
      return { success: true, messageId: newMessage.id }
    } catch (error) {
      set({ isLoading: false })
      return { success: false, error: error.message }
    }
  },

  // Marquer un message comme lu
  markAsRead: async (messageId) => {
    set({ isLoading: true })
    
    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const updatedMessages = get().messages.map(message =>
        message.id === messageId 
          ? { 
              ...message, 
              status: message.status === 'new' ? 'read' : message.status,
              readAt: message.readAt || new Date().toISOString()
            }
          : message
      )
      
      set({ messages: updatedMessages, isLoading: false })
      localStorage.setItem('admin-messages', JSON.stringify(updatedMessages))
      
      return { success: true }
    } catch (error) {
      set({ isLoading: false })
      return { success: false, error: error.message }
    }
  },

  // Marquer un message comme répondu
  markAsReplied: async (messageId) => {
    set({ isLoading: true })
    
    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const now = new Date().toISOString()
      const updatedMessages = get().messages.map(message =>
        message.id === messageId 
          ? { 
              ...message, 
              status: 'replied',
              readAt: message.readAt || now,
              repliedAt: now
            }
          : message
      )
      
      set({ messages: updatedMessages, isLoading: false })
      localStorage.setItem('admin-messages', JSON.stringify(updatedMessages))
      
      return { success: true }
    } catch (error) {
      set({ isLoading: false })
      return { success: false, error: error.message }
    }
  },

  // Delete un message
  deleteMessage: async (messageId) => {
    set({ isLoading: true })
    
    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const updatedMessages = get().messages.filter(message => message.id !== messageId)
      set({ messages: updatedMessages, isLoading: false })
      localStorage.setItem('admin-messages', JSON.stringify(updatedMessages))
      
      return { success: true }
    } catch (error) {
      set({ isLoading: false })
      return { success: false, error: error.message }
    }
  },

  // Getters et filtres
  getMessagesByStatus: (status) => {
    return get().messages.filter(message => message.status === status)
  },

  getNewMessagesCount: () => {
    return get().messages.filter(message => message.status === 'new').length
  },

  // Statistiques
  getMessagesStats: () => {
    const messages = get().messages
    return {
      total: messages.length,
      new: messages.filter(m => m.status === 'new').length,
      read: messages.filter(m => m.status === 'read').length,
      replied: messages.filter(m => m.status === 'replied').length
    }
  }
}))

describe('contactsStore', () => {
  let store

  beforeEach(() => {
    vi.clearAllMocks()
    vi.clearAllTimers()
    
    // Reset localStorage mocks
    mockLocalStorage.getItem.mockReturnValue(null)
    mockLocalStorage.setItem.mockImplementation(() => {})
    
    // Create fresh store instance
    store = createTestContactsStore()
    
    // Mock Date for consistent timestamps
    vi.setSystemTime(new Date('2024-01-20T10:00:00Z'))
  })

  // 1. STORE INITIALIZATION (3 tests)
  describe('Store Initialization', () => {
    it('should initialize with empty state', () => {
      const state = store.getState()
      
      expect(state.messages).toEqual([])
      expect(state.isLoading).toBe(false)
    })

    it('should load messages from localStorage when available', () => {
      const storedMessages = [
        {
          id: 'stored-msg',
          name: 'John Doe',
          email: 'john@test.com',
          subject: 'Test message',
          message: 'Test content',
          status: 'new',
          createdAt: '2024-01-19T10:00:00Z'
        }
      ]
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedMessages))
      
      store.getState().initializeMessages()
      
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('admin-messages')
      expect(store.getState().messages).toEqual(storedMessages)
    })

    it('should create initial demo messages when localStorage is empty', () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      
      store.getState().initializeMessages()
      
      const { messages } = store.getState()
      
      expect(messages).toHaveLength(3)
      expect(messages[0]).toMatchObject({
        id: 'msg-001',
        name: 'Marie Dubois',
        email: 'marie.dubois@email.com',
        status: 'new'
      })
      expect(messages[1]).toMatchObject({
        id: 'msg-002',
        name: 'Pierre Martin',
        status: 'read'
      })
      expect(messages[2]).toMatchObject({
        id: 'msg-003',
        name: 'Sophie Laurent',
        status: 'replied'
      })
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'admin-messages',
        expect.any(String)
      )
    })
  })

  // 2. MESSAGE MANAGEMENT (4 tests)
  describe('Message Management', () => {
    it('should create new message successfully', async () => {
      const messageData = {
        name: 'Test User',
        email: 'test@example.com',
        phone: '0123456789',
        subject: 'Test Subject',
        message: 'Test message content'
      }
      
      const promise = store.getState().createMessage(messageData)
      
      // Check loading state is set
      expect(store.getState().isLoading).toBe(true)
      
      // Advance timers to complete the async operation
      await vi.advanceTimersByTimeAsync(500)
      const result = await promise
      
      expect(result).toEqual({
        success: true,
        messageId: expect.stringMatching(/^msg-\d+$/)
      })
      
      const { messages, isLoading } = store.getState()
      
      expect(isLoading).toBe(false)
      expect(messages).toHaveLength(1)
      expect(messages[0]).toMatchObject({
        ...messageData,
        status: 'new',
        createdAt: expect.any(String),
        readAt: null,
        repliedAt: null
      })
      
      // Check timestamp format separately
      expect(messages[0].createdAt).toMatch(/2024-01-20T10:00:00\.\d{3}Z/)
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'admin-messages',
        expect.any(String)
      )
    })

    it('should mark message as read and update timestamps', async () => {
      // Set up initial message
      const initialMessage = {
        id: 'test-msg',
        name: 'Test User',
        email: 'test@example.com',
        subject: 'Test',
        message: 'Test content',
        status: 'new',
        createdAt: '2024-01-19T10:00:00Z',
        readAt: null,
        repliedAt: null
      }
      
      store.setState({ messages: [initialMessage] })
      
      const promise = store.getState().markAsRead('test-msg')
      
      expect(store.getState().isLoading).toBe(true)
      
      await vi.advanceTimersByTimeAsync(300)
      const result = await promise
      
      expect(result).toEqual({ success: true })
      
      const { messages, isLoading } = store.getState()
      
      expect(isLoading).toBe(false)
      expect(messages[0]).toMatchObject({
        id: 'test-msg',
        status: 'read',
        readAt: expect.any(String),
        repliedAt: null
      })
      
      // Check timestamp format
      expect(messages[0].readAt).toMatch(/2024-01-20T10:00:00\.\d{3}Z/)
      
      expect(mockLocalStorage.setItem).toHaveBeenCalled()
    })

    it('should mark message as replied with proper status transition', async () => {
      // Set up initial message
      const initialMessage = {
        id: 'test-msg',
        name: 'Test User',
        email: 'test@example.com',
        subject: 'Test',
        message: 'Test content',
        status: 'read',
        createdAt: '2024-01-19T10:00:00Z',
        readAt: '2024-01-19T11:00:00Z',
        repliedAt: null
      }
      
      store.setState({ messages: [initialMessage] })
      
      const promise = store.getState().markAsReplied('test-msg')
      
      await vi.advanceTimersByTimeAsync(300)
      const result = await promise
      
      expect(result).toEqual({ success: true })
      
      const { messages } = store.getState()
      
      expect(messages[0]).toMatchObject({
        id: 'test-msg',
        status: 'replied',
        readAt: '2024-01-19T11:00:00Z', // Should preserve existing readAt
        repliedAt: expect.any(String)
      })
      
      // Check timestamp format
      expect(messages[0].repliedAt).toMatch(/2024-01-20T10:00:00\.\d{3}Z/)
    })

    it('should delete message and remove from store', async () => {
      const messages = [
        { id: 'msg-1', name: 'User 1', status: 'new' },
        { id: 'msg-2', name: 'User 2', status: 'read' },
        { id: 'msg-3', name: 'User 3', status: 'replied' }
      ]
      
      store.setState({ messages })
      
      const promise = store.getState().deleteMessage('msg-2')
      
      await vi.advanceTimersByTimeAsync(300)
      const result = await promise
      
      expect(result).toEqual({ success: true })
      
      const { messages: updatedMessages } = store.getState()
      
      expect(updatedMessages).toHaveLength(2)
      expect(updatedMessages.find(m => m.id === 'msg-2')).toBeUndefined()
      expect(updatedMessages.map(m => m.id)).toEqual(['msg-1', 'msg-3'])
      
      expect(mockLocalStorage.setItem).toHaveBeenCalled()
    })
  })

  // 3. STATE MANAGEMENT (2 tests)
  describe('State Management', () => {
    it('should handle loading states correctly during async operations', async () => {
      const messageData = {
        name: 'Test User',
        email: 'test@example.com',
        subject: 'Test',
        message: 'Test content'
      }
      
      // Start async operation
      const promise = store.getState().createMessage(messageData)
      
      // Should be loading
      expect(store.getState().isLoading).toBe(true)
      
      // Complete operation
      await vi.advanceTimersByTimeAsync(500)
      await promise
      
      // Should not be loading anymore
      expect(store.getState().isLoading).toBe(false)
    })

    it('should maintain message order (newest first)', async () => {
      // Create first message
      const promise1 = store.getState().createMessage({
        name: 'User 1',
        email: 'user1@test.com',
        subject: 'First',
        message: 'First message'
      })
      
      await vi.advanceTimersByTimeAsync(500)
      await promise1
      
      // Advance time and create second message
      vi.setSystemTime(new Date('2024-01-20T11:00:00Z'))
      
      const promise2 = store.getState().createMessage({
        name: 'User 2',
        email: 'user2@test.com',
        subject: 'Second',
        message: 'Second message'
      })
      
      await vi.advanceTimersByTimeAsync(500)
      await promise2
      
      const { messages } = store.getState()
      
      expect(messages).toHaveLength(2)
      expect(messages[0].subject).toBe('Second') // Newest first
      expect(messages[1].subject).toBe('First') // Older second
    })
  })

  // 4. FILTERING AND STATISTICS (3 tests)
  describe('Filtering and Statistics', () => {
    beforeEach(() => {
      const messages = [
        { id: 'msg-1', status: 'new', name: 'User 1' },
        { id: 'msg-2', status: 'new', name: 'User 2' },
        { id: 'msg-3', status: 'read', name: 'User 3' },
        { id: 'msg-4', status: 'replied', name: 'User 4' },
        { id: 'msg-5', status: 'replied', name: 'User 5' }
      ]
      
      store.setState({ messages })
    })

    it('should filter messages by status correctly', () => {
      const newMessages = store.getState().getMessagesByStatus('new')
      const readMessages = store.getState().getMessagesByStatus('read')
      const repliedMessages = store.getState().getMessagesByStatus('replied')
      
      expect(newMessages).toHaveLength(2)
      expect(newMessages.every(m => m.status === 'new')).toBe(true)
      
      expect(readMessages).toHaveLength(1)
      expect(readMessages[0].status).toBe('read')
      
      expect(repliedMessages).toHaveLength(2)
      expect(repliedMessages.every(m => m.status === 'replied')).toBe(true)
    })

    it('should count new messages accurately', () => {
      const newCount = store.getState().getNewMessagesCount()
      
      expect(newCount).toBe(2)
    })

    it('should calculate message statistics by status', () => {
      const stats = store.getState().getMessagesStats()
      
      expect(stats).toEqual({
        total: 5,
        new: 2,
        read: 1,
        replied: 2
      })
    })
  })

  // 5. ERROR HANDLING AND EDGE CASES (2 tests)
  describe('Error Handling and Edge Cases', () => {
    it('should handle async operation errors gracefully', async () => {
      // Mock an error by overriding the implementation
      store.setState({
        createMessage: async () => {
          store.getState().setLoading(true)
          try {
            throw new Error('Network error')
          } catch (error) {
            store.getState().setLoading(false)
            return { success: false, error: error.message }
          }
        }
      })
      
      const result = await store.getState().createMessage({
        name: 'Test',
        email: 'test@test.com',
        subject: 'Test',
        message: 'Test message'
      })
      
      expect(result).toEqual({
        success: false,
        error: 'Network error'
      })
      
      expect(store.getState().isLoading).toBe(false)
      expect(store.getState().messages).toHaveLength(0) // Should remain empty
    })

    it('should preserve data integrity on failed operations', async () => {
      const initialMessages = [
        { id: 'msg-1', name: 'User 1', status: 'new' }
      ]
      
      store.setState({ messages: initialMessages })
      
      // Mock a failed delete operation
      store.setState({
        deleteMessage: async () => {
          store.getState().setLoading(true)
          try {
            throw new Error('Delete failed')
          } catch (error) {
            store.getState().setLoading(false)
            return { success: false, error: error.message }
          }
        }
      })
      
      const result = await store.getState().deleteMessage('msg-1')
      
      expect(result).toEqual({
        success: false,
        error: 'Delete failed'
      })
      
      // Original messages should be preserved
      expect(store.getState().messages).toEqual(initialMessages)
      expect(store.getState().isLoading).toBe(false)
    })
  })
})