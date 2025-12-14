import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import ContactsManagement from '../../../pages/admin/ContactsManagement'
import useContactsStore from '../../../store/contactsStore'
import { useAuth } from '../../../hooks/useAuth'

// Mock dependencies
vi.mock('../../../store/contactsStore')
vi.mock('../../../hooks/useAuth')
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn()

// Mock window.confirm
Object.defineProperty(window, 'confirm', {
  writable: true,
  value: vi.fn()
})

describe('ContactsManagement Component', () => {
  const mockCurrentAdmin = {
    id: 'admin-current',
    name: 'Current Admin',
    email: 'current@admin.com',
    role: 'admin'
  }

  // Test data for basic features
  const mockMessagesBasic = [
    {
      id: 'msg-001',
      name: 'Marie Dubois',
      email: 'marie.dubois@email.com',
      phone: '06 12 34 56 78',
      subject: 'Question about allergens',
      message: 'Bonjour, pourriez-vous me dire si vos plats végétariens contiennent des traces de fruits à coque ? J\'ai une allergie sévère. Merci.',
      status: 'new',
      discussion: [],
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
      message: 'Nous souhaitons organiser un événement d\'entreprise pour 50 personnes le mois prochain. Proposez-vous des menus de groupe et avez-vous une salle privée disponible ?',
      status: 'read',
      discussion: [],
      createdAt: '2024-01-19T14:30:00Z',
      readAt: '2024-01-19T14:45:00Z',
      repliedAt: null
    },
    {
      id: 'msg-003',
      name: 'Sophie Leroy',
      email: 'sophie.leroy@gmail.com',
      phone: null,
      subject: 'Compliments sur le service',
      message: 'Excellent repas hier soir ! Le service était impeccable et les plats délicieux. Nous reviendrons certainement. Merci à toute l\'équipe.',
      status: 'replied',
      discussion: [],
      createdAt: '2024-01-18T19:15:00Z',
      readAt: '2024-01-18T19:30:00Z',
      repliedAt: '2024-01-18T20:00:00Z'
    },
    {
      id: 'msg-004',
      name: 'Jean Dupont',
      email: 'jean.dupont@hotmail.com',
      phone: '07 98 76 54 32',
      subject: 'Question about hours',
      message: 'Hello, are you open on Sunday at noon? Thank you.',
      status: 'new',
      discussion: [],
      createdAt: '2024-01-20T09:15:00Z',
      readAt: null,
      repliedAt: null
    }
  ]

  // Test data for enhanced features (discussion, newlyReplied, closed)
  const mockMessagesEnhanced = [
    // Message with discussion from user and current admin (newlyReplied status to test marking as read)
    {
      id: 'msg-001',
      userId: 'user-123',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '01 23 45 67 89',
      subject: 'Question about menu',
      message: 'Do you have vegetarian options?',
      status: 'newlyReplied',
      discussion: [
        {
          id: 'reply-001',
          userId: 'admin-current',
          name: 'Current Admin',
          role: 'admin',
          text: 'Yes, we have several vegetarian dishes.',
          date: '2024-01-20T11:00:00Z',
          status: 'read'
        },
        {
          id: 'reply-002',
          userId: 'user-123',
          name: 'John Doe',
          role: 'user',
          text: 'Thank you! Can I see the menu?',
          date: '2024-01-20T12:00:00Z',
          status: 'new'
        }
      ],
      createdAt: '2024-01-20T10:00:00Z'
    },
    // Message with newlyReplied status
    {
      id: 'msg-002',
      userId: 'user-456',
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '06 98 76 54 32',
      subject: 'Reservation question',
      message: 'Can I book for 10 people?',
      status: 'newlyReplied',
      discussion: [
        {
          id: 'reply-003',
          userId: 'user-456',
          name: 'Jane Smith',
          role: 'user',
          text: 'I need this for Saturday',
          date: '2024-01-19T10:00:00Z',
          status: 'read'
        },
        {
          id: 'reply-004',
          userId: 'admin-other',
          name: 'Other Admin',
          role: 'admin',
          text: 'Yes, we can accommodate that.',
          date: '2024-01-19T11:00:00Z',
          status: 'new'
        }
      ],
      createdAt: '2024-01-19T09:00:00Z'
    },
    // Message from unregistered user (no userId)
    {
      id: 'msg-003',
      userId: null,
      name: 'Anonymous User',
      email: 'anonymous@example.com',
      phone: null,
      subject: 'General inquiry',
      message: 'What are your opening hours?',
      status: 'new',
      discussion: [],
      createdAt: '2024-01-18T14:00:00Z'
    },
    // Message from deleted user
    {
      id: 'msg-004',
      userId: 'deleted-user',
      name: 'Deleted User',
      email: 'deleted@account.com',
      phone: null,
      subject: 'Old question',
      message: 'This is from a deleted account',
      status: 'read',
      discussion: [],
      createdAt: '2024-01-17T10:00:00Z'
    },
    // Closed conversation
    {
      id: 'msg-005',
      userId: 'user-789',
      name: 'Bob Johnson',
      email: 'bob@example.com',
      phone: '07 11 22 33 44',
      subject: 'Complaint',
      message: 'The service was slow',
      status: 'closed',
      discussion: [
        {
          id: 'reply-005',
          userId: 'admin-current',
          name: 'Current Admin',
          role: 'admin',
          text: 'We apologize for the inconvenience.',
          date: '2024-01-16T15:00:00Z',
          status: 'read'
        }
      ],
      createdAt: '2024-01-16T14:00:00Z'
    }
  ]

  const mockStoreStateBasic = {
    messages: mockMessagesBasic,
    deletedMessages: [],
    isLoading: false,
    fetchMessages: vi.fn(),
    fetchDeletedMessages: vi.fn(),
    markAsRead: vi.fn(),
    markAsClosed: vi.fn(),
    archiveMessage: vi.fn(),
    restoreMessage: vi.fn(),
    addReply: vi.fn(),
    markDiscussionMessageAsRead: vi.fn(),
    updateMessageStatus: vi.fn(),
    getMessagesStats: vi.fn(() => ({
      total: 4,
      new: 2,
      read: 1,
      replied: 1
    }))
  }

  const mockStoreStateEnhanced = {
    messages: mockMessagesEnhanced,
    deletedMessages: [],
    isLoading: false,
    fetchMessages: vi.fn(),
    fetchDeletedMessages: vi.fn(),
    markAsRead: vi.fn(),
    updateMessageStatus: vi.fn(),
    markAsClosed: vi.fn(),
    archiveMessage: vi.fn(),
    restoreMessage: vi.fn(),
    addReply: vi.fn(),
    markDiscussionMessageAsRead: vi.fn(),
    getMessagesStats: vi.fn(() => ({
      total: 5,
      new: 1,
      read: 1,
      replied: 0,
      newlyReplied: 2,
      closed: 1
    })),
    getNewMessagesCount: vi.fn(() => 3) // 1 new + 2 newlyReplied
  }

  const user = userEvent.setup()

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <ContactsManagement />
      </MemoryRouter>
    )
  }

  beforeEach(() => {
    vi.clearAllMocks()
    window.confirm.mockReturnValue(true)
  })

  // ========================================
  // BASIC FEATURES TESTS
  // ========================================

  describe('Core Rendering', () => {
    beforeEach(() => {
      mockStoreStateBasic.markAsRead.mockResolvedValue({ success: true })
      mockStoreStateBasic.fetchMessages.mockResolvedValue({ success: true })
      mockStoreStateBasic.markDiscussionMessageAsRead.mockResolvedValue({ success: true })

      useContactsStore.mockReturnValue(mockStoreStateBasic)
      useAuth.mockReturnValue({
        user: mockCurrentAdmin
      })
    })

    it('should render header, statistics, and message filters', () => {
      renderComponent()

      expect(screen.getByText('Messages Management')).toBeInTheDocument()
      expect(screen.getByText('Manage messages received via the contact form')).toBeInTheDocument()

      expect(screen.getByText('Total')).toBeInTheDocument()
      expect(screen.getAllByText('New').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('Read').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('Replied').length).toBeGreaterThanOrEqual(1)

      expect(screen.getByText('All (4)')).toBeInTheDocument()
      expect(screen.getByText('New (2)')).toBeInTheDocument()
      expect(screen.getByText('Read (1)')).toBeInTheDocument()
      expect(screen.getByText('Replied (1)')).toBeInTheDocument()
    })

    it('should initialize messages data on mount', () => {
      renderComponent()
      expect(mockStoreStateBasic.fetchMessages).toHaveBeenCalledOnce()
    })

    it('should display message list with different status indicators', () => {
      renderComponent()

      expect(screen.getByText('Question about allergens')).toBeInTheDocument()
      expect(screen.getByText('Réservation événement d\'entreprise')).toBeInTheDocument()
      expect(screen.getByText('Compliments sur le service')).toBeInTheDocument()
      expect(screen.getByText('Question about hours')).toBeInTheDocument()

      expect(screen.getAllByText('New').length).toBeGreaterThanOrEqual(2)
      expect(screen.getAllByText('Read').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('Replied').length).toBeGreaterThanOrEqual(1)

      expect(screen.getByText('Marie Dubois')).toBeInTheDocument()
      expect(screen.getByText('marie.dubois@email.com')).toBeInTheDocument()
      expect(screen.getByText('06 12 34 56 78')).toBeInTheDocument()
    })
  })

  describe('Statistics and Filtering', () => {
    beforeEach(() => {
      mockStoreStateBasic.markAsRead.mockResolvedValue({ success: true })
      mockStoreStateBasic.fetchMessages.mockResolvedValue({ success: true })
      mockStoreStateBasic.markDiscussionMessageAsRead.mockResolvedValue({ success: true })

      useContactsStore.mockReturnValue(mockStoreStateBasic)
      useAuth.mockReturnValue({
        user: mockCurrentAdmin
      })
    })

    it('should display correct message counts in statistics cards', () => {
      renderComponent()

      const stats = mockStoreStateBasic.getMessagesStats()

      expect(screen.getAllByText(stats.total.toString()).length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText(stats.new.toString()).length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText(stats.read.toString()).length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText(stats.replied.toString()).length).toBeGreaterThanOrEqual(1)
    })

    it('should filter messages by status when filter buttons are clicked', async () => {
      renderComponent()

      expect(screen.getByText('Question about allergens')).toBeInTheDocument()
      expect(screen.getByText('Réservation événement d\'entreprise')).toBeInTheDocument()
      expect(screen.getByText('Compliments sur le service')).toBeInTheDocument()
      expect(screen.getByText('Question about hours')).toBeInTheDocument()

      await user.click(screen.getByText('New (2)'))

      expect(screen.getByText('Question about allergens')).toBeInTheDocument()
      expect(screen.getByText('Question about hours')).toBeInTheDocument()
      expect(screen.queryByText('Réservation événement d\'entreprise')).not.toBeInTheDocument()
      expect(screen.queryByText('Compliments sur le service')).not.toBeInTheDocument()

      await user.click(screen.getByText('Read (1)'))

      expect(screen.getByText('Réservation événement d\'entreprise')).toBeInTheDocument()
      expect(screen.queryByText('Question about allergens')).not.toBeInTheDocument()
      expect(screen.queryByText('Question about hours')).not.toBeInTheDocument()
      expect(screen.queryByText('Compliments sur le service')).not.toBeInTheDocument()

      await user.click(screen.getByText('Replied (1)'))

      expect(screen.getByText('Compliments sur le service')).toBeInTheDocument()
      expect(screen.queryByText('Question about allergens')).not.toBeInTheDocument()
      expect(screen.queryByText('Réservation événement d\'entreprise')).not.toBeInTheDocument()
      expect(screen.queryByText('Question about hours')).not.toBeInTheDocument()

      await user.click(screen.getByText('All (4)'))

      expect(screen.getByText('Question about allergens')).toBeInTheDocument()
      expect(screen.getByText('Réservation événement d\'entreprise')).toBeInTheDocument()
      expect(screen.getByText('Compliments sur le service')).toBeInTheDocument()
      expect(screen.getByText('Question about hours')).toBeInTheDocument()
    })

    it('should show empty state when no messages match filter', () => {
      useContactsStore.mockReturnValue({
        ...mockStoreStateBasic,
        messages: [],
        getMessagesStats: vi.fn(() => ({
          total: 0,
          new: 0,
          read: 0,
          replied: 0
        }))
      })

      renderComponent()

      expect(screen.getByText('No messages')).toBeInTheDocument()
      expect(screen.getByText('No messages received yet.')).toBeInTheDocument()
    })
  })

  describe('Message Actions', () => {
    beforeEach(() => {
      mockStoreStateBasic.markAsRead.mockResolvedValue({ success: true })
      mockStoreStateBasic.fetchMessages.mockResolvedValue({ success: true })
      mockStoreStateBasic.markDiscussionMessageAsRead.mockResolvedValue({ success: true })
      mockStoreStateBasic.archiveMessage.mockResolvedValue({ success: true })

      useContactsStore.mockReturnValue(mockStoreStateBasic)
      useAuth.mockReturnValue({
        user: mockCurrentAdmin
      })
    })

    it('should open message modal when message is clicked', async () => {
      renderComponent()

      const messageElement = screen.getByText('Question about allergens').closest('div[class*="p-6"]')
      await user.click(messageElement)

      await waitFor(() => {
        expect(screen.getAllByText('Marie Dubois').length).toBeGreaterThanOrEqual(2)
        expect(screen.getAllByText('marie.dubois@email.com').length).toBeGreaterThanOrEqual(2)
        expect(screen.getAllByText('06 12 34 56 78').length).toBeGreaterThanOrEqual(2)
        expect(screen.getByText('Name')).toBeInTheDocument()
        expect(screen.getByText('Email')).toBeInTheDocument()
        expect(screen.getAllByText('Bonjour, pourriez-vous me dire si vos plats végétariens contiennent des traces de fruits à coque ? J\'ai une allergie sévère. Merci.').length).toBeGreaterThanOrEqual(1)
      })
    })

    it('should mark new message as read when clicked', async () => {
      renderComponent()

      const newMessageElement = screen.getByText('Question about allergens').closest('div[class*="p-6"]')
      await user.click(newMessageElement)

      await waitFor(() => {
        expect(mockStoreStateBasic.markAsRead).toHaveBeenCalledWith('msg-001')
      })
    })

    it('should archive message with confirmation prompt', async () => {
      renderComponent()

      const messageElement = screen.getByText('Question about allergens').closest('div[class*="p-6"]')
      await user.click(messageElement)

      await waitFor(() => {
        expect(screen.getByText('Archive')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Archive'))

      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to archive this message?')

      await waitFor(() => {
        expect(mockStoreStateBasic.archiveMessage).toHaveBeenCalledWith('msg-001')
      })
    })
  })

  describe('Modal Functionality', () => {
    beforeEach(() => {
      mockStoreStateBasic.markAsRead.mockResolvedValue({ success: true })
      mockStoreStateBasic.fetchMessages.mockResolvedValue({ success: true })
      mockStoreStateBasic.markDiscussionMessageAsRead.mockResolvedValue({ success: true })

      useContactsStore.mockReturnValue(mockStoreStateBasic)
      useAuth.mockReturnValue({
        user: mockCurrentAdmin
      })
    })

    it('should display comprehensive message information in modal', async () => {
      renderComponent()

      const messageElement = screen.getByText('Question about allergens').closest('div[class*="p-6"]')
      await user.click(messageElement)

      await waitFor(() => {
        expect(screen.getAllByText('Question about allergens').length).toBeGreaterThanOrEqual(1)
        expect(screen.getAllByText('New').length).toBeGreaterThanOrEqual(1)

        expect(screen.getByText('Name')).toBeInTheDocument()
        expect(screen.getAllByText('Marie Dubois').length).toBeGreaterThanOrEqual(2)
        expect(screen.getByText('Email')).toBeInTheDocument()
        expect(screen.getAllByText('marie.dubois@email.com').length).toBeGreaterThanOrEqual(2)
        expect(screen.getByText('Phone')).toBeInTheDocument()
        expect(screen.getAllByText('06 12 34 56 78').length).toBeGreaterThanOrEqual(2)
        expect(screen.getByText('Date')).toBeInTheDocument()

        expect(screen.getAllByText('Bonjour, pourriez-vous me dire si vos plats végétariens contiennent des traces de fruits à coque ? J\'ai une allergie sévère. Merci.').length).toBeGreaterThanOrEqual(1)
      })
    })

    it('should close modal with X button', async () => {
      renderComponent()

      const messageElement = screen.getByText('Question about allergens').closest('div[class*="p-6"]')
      await user.click(messageElement)

      await waitFor(() => {
        expect(screen.getByText('Name')).toBeInTheDocument()
        expect(screen.getByText('Email')).toBeInTheDocument()
      })

      const xButtons = screen.getAllByRole('button')
      const xButton = xButtons.find(button => button.querySelector('svg path[d*="M6 18L18 6M6 6l12 12"]'))

      expect(xButton).toBeDefined()
      await user.click(xButton)

      await waitFor(() => {
        expect(screen.queryByText('Date')).not.toBeInTheDocument()
      })
    })
  })

  describe('State Management and Edge Cases', () => {
    beforeEach(() => {
      mockStoreStateBasic.markAsRead.mockResolvedValue({ success: true })
      mockStoreStateBasic.fetchMessages.mockResolvedValue({ success: true })
      mockStoreStateBasic.markDiscussionMessageAsRead.mockResolvedValue({ success: true })

      useContactsStore.mockReturnValue(mockStoreStateBasic)
      useAuth.mockReturnValue({
        user: mockCurrentAdmin
      })
    })

    it('should handle loading state appropriately', () => {
      useContactsStore.mockReturnValue({
        ...mockStoreStateBasic,
        isLoading: true
      })

      renderComponent()

      expect(screen.getByText('Messages Management')).toBeInTheDocument()
    })

    it('should handle empty message list gracefully', async () => {
      useContactsStore.mockReturnValue({
        ...mockStoreStateBasic,
        messages: [],
        getMessagesStats: vi.fn(() => ({
          total: 0,
          new: 0,
          read: 0,
          replied: 0
        }))
      })

      renderComponent()

      expect(screen.getByText('No messages')).toBeInTheDocument()
      expect(screen.getByText('No messages received yet.')).toBeInTheDocument()

      expect(screen.getByText('All (0)')).toBeInTheDocument()
      expect(screen.getByText('New (0)')).toBeInTheDocument()
      expect(screen.getByText('Read (0)')).toBeInTheDocument()
      expect(screen.getByText('Replied (0)')).toBeInTheDocument()
    })

    it('should handle message without phone number', async () => {
      renderComponent()

      const messageElement = screen.getByText('Compliments sur le service').closest('div[class*="p-6"]')
      await user.click(messageElement)

      await waitFor(() => {
        expect(screen.getAllByText('Sophie Leroy').length).toBeGreaterThanOrEqual(1)
        expect(screen.getAllByText('sophie.leroy@gmail.com').length).toBeGreaterThanOrEqual(1)
        expect(screen.queryByText('Phone')).not.toBeInTheDocument()
      })
    })

    it('should prevent archiving when user cancels confirmation', async () => {
      window.confirm.mockReturnValue(false)

      renderComponent()

      const messageElement = screen.getByText('Question about allergens').closest('div[class*="p-6"]')
      await user.click(messageElement)

      await waitFor(() => {
        expect(screen.getByText('Archive')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Archive'))

      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to archive this message?')

      expect(mockStoreStateBasic.archiveMessage).not.toHaveBeenCalled()
    })
  })

  // ========================================
  // ENHANCED FEATURES TESTS
  // ========================================

  describe('Discussion Display', () => {
    beforeEach(() => {
      mockStoreStateEnhanced.markAsRead.mockResolvedValue({ success: true })
      mockStoreStateEnhanced.fetchMessages.mockResolvedValue({ success: true })
      mockStoreStateEnhanced.markDiscussionMessageAsRead.mockResolvedValue({ success: true })

      useContactsStore.mockReturnValue(mockStoreStateEnhanced)
      useAuth.mockReturnValue({ user: mockCurrentAdmin })
    })

    it('should display discussion thread in message modal', async () => {
      renderComponent()

      const messageElement = screen.getByText('Question about menu').closest('div[class*="p-6"]')
      await user.click(messageElement)

      await waitFor(() => {
        expect(screen.getByText('Discussion')).toBeInTheDocument()
        expect(screen.getByText('Yes, we have several vegetarian dishes.')).toBeInTheDocument()
        expect(screen.getByText('Thank you! Can I see the menu?')).toBeInTheDocument()
      })
    })

    it('should show "You" for current admin messages', async () => {
      renderComponent()

      const messageCard = screen.getByText('Question about menu')
      await user.click(messageCard.closest('div[class*="p-6"]'))

      await waitFor(() => {
        const discussionSection = screen.getByText('Discussion').closest('div')
        const youLabels = within(discussionSection).getAllByText('You')
        expect(youLabels.length).toBeGreaterThan(0)
      })
    })

    it('should show other admin names (not "You")', async () => {
      renderComponent()

      const messageCard = screen.getByText('Reservation question')
      await user.click(messageCard.closest('div[class*="p-6"]'))

      await waitFor(() => {
        expect(screen.getByText('Other Admin')).toBeInTheDocument()
        const discussionSection = screen.getByText('Discussion').closest('div')
        const otherAdminMessages = within(discussionSection).getAllByText('Other Admin')
        expect(otherAdminMessages.length).toBeGreaterThan(0)
      })
    })

    it('should show user names for user messages', async () => {
      renderComponent()

      const messageCard = screen.getByText('Question about menu')
      await user.click(messageCard.closest('div[class*="p-6"]'))

      await waitFor(() => {
        expect(screen.getAllByText('John Doe').length).toBeGreaterThanOrEqual(2)
      })
    })

    it('should show read/new status for discussion messages', async () => {
      renderComponent()

      const messageCard = screen.getByText('Question about menu')
      await user.click(messageCard.closest('div[class*="p-6"]'))

      await waitFor(() => {
        const discussionSection = screen.getByText('Discussion').closest('div')
        expect(within(discussionSection).getByText('New')).toBeInTheDocument()
        expect(within(discussionSection).getByText('Read')).toBeInTheDocument()
      })
    })
  })

  describe('Add Reply', () => {
    beforeEach(() => {
      mockStoreStateEnhanced.markAsRead.mockResolvedValue({ success: true })
      mockStoreStateEnhanced.fetchMessages.mockResolvedValue({ success: true })
      mockStoreStateEnhanced.markDiscussionMessageAsRead.mockResolvedValue({ success: true })
      mockStoreStateEnhanced.addReply.mockResolvedValue({ success: true })

      useContactsStore.mockReturnValue(mockStoreStateEnhanced)
      useAuth.mockReturnValue({ user: mockCurrentAdmin })
    })

    it('should allow admin to add reply', async () => {
      renderComponent()

      const messageCard = screen.getByText('Question about menu')
      await user.click(messageCard.closest('div[class*="p-6"]'))

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Type your message here...')).toBeInTheDocument()
      })

      const textarea = screen.getByPlaceholderText('Type your message here...')
      await user.type(textarea, 'Here is our vegetarian menu link.')

      const sendButton = screen.getByRole('button', { name: /Send Reply/i })
      await user.click(sendButton)

      await waitFor(() => {
        expect(mockStoreStateEnhanced.addReply).toHaveBeenCalledWith(
          'msg-001',
          'Here is our vegetarian menu link.'
        )
        expect(mockStoreStateEnhanced.addReply).toHaveBeenCalledTimes(1)
      })
    })

    it('should show character count while typing', async () => {
      renderComponent()

      const messageCard = screen.getByText('Question about menu')
      await user.click(messageCard.closest('div[class*="p-6"]'))

      await waitFor(() => {
        expect(screen.getByText('0 / 1000 characters')).toBeInTheDocument()
      })

      const textarea = screen.getByPlaceholderText('Type your message here...')
      await user.type(textarea, 'Test message')

      expect(screen.getByText('12 / 1000 characters')).toBeInTheDocument()
    })

    it('should enforce 1000 character limit', async () => {
      renderComponent()

      const messageCard = screen.getByText('Question about menu')
      await user.click(messageCard.closest('div[class*="p-6"]'))

      await waitFor(() => {
        const textarea = screen.getByPlaceholderText('Type your message here...')
        expect(textarea).toHaveAttribute('maxLength', '1000')
      })
    })

    it('should show success toast after reply sent', async () => {
      const { toast } = await import('react-hot-toast')

      renderComponent()

      const messageCard = screen.getByText('Question about menu')
      await user.click(messageCard.closest('div[class*="p-6"]'))

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Type your message here...')).toBeInTheDocument()
      })

      const textarea = screen.getByPlaceholderText('Type your message here...')
      await user.type(textarea, 'Thank you for your inquiry')

      const sendButton = screen.getByRole('button', { name: /Send Reply/i })
      await user.click(sendButton)

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Reply sent successfully')
      })
    })
  })

  describe('Unregistered User Handling', () => {
    beforeEach(() => {
      mockStoreStateEnhanced.markAsRead.mockResolvedValue({ success: true })
      mockStoreStateEnhanced.fetchMessages.mockResolvedValue({ success: true })
      mockStoreStateEnhanced.markDiscussionMessageAsRead.mockResolvedValue({ success: true })
      mockStoreStateEnhanced.updateMessageStatus.mockResolvedValue({ success: true })

      useContactsStore.mockReturnValue(mockStoreStateEnhanced)
      useAuth.mockReturnValue({ user: mockCurrentAdmin })
    })

    it('should hide reply form for unregistered users', async () => {
      renderComponent()

      const messageCard = screen.getByText('General inquiry')
      await user.click(messageCard.closest('div[class*="p-6"]'))

      await waitFor(() => {
        expect(screen.getByText('Unregistered user.', { exact: false })).toBeInTheDocument()
        expect(screen.queryByPlaceholderText('Type your message here...')).not.toBeInTheDocument()
      })
    })

    it('should show "Mark as Replied" button for unregistered users', async () => {
      renderComponent()

      const messageCard = screen.getByText('General inquiry')
      await user.click(messageCard.closest('div[class*="p-6"]'))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Mark as Replied/i })).toBeInTheDocument()
      })
    })

    it('should mark unregistered user message as replied', async () => {
      renderComponent()

      const messageCard = screen.getByText('General inquiry')
      await user.click(messageCard.closest('div[class*="p-6"]'))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Mark as Replied/i })).toBeInTheDocument()
      })

      const markAsRepliedButton = screen.getByRole('button', { name: /Mark as Replied/i })
      await user.click(markAsRepliedButton)

      await waitFor(() => {
        expect(mockStoreStateEnhanced.updateMessageStatus).toHaveBeenCalledWith('msg-003', 'replied')
      })
    })

    it('should hide reply form for deleted users', async () => {
      renderComponent()

      const messageCard = screen.getByText('Old question')
      await user.click(messageCard.closest('div[class*="p-6"]'))

      await waitFor(() => {
        expect(screen.getByText('Unregistered user.', { exact: false })).toBeInTheDocument()
        expect(screen.queryByPlaceholderText('Type your message here...')).not.toBeInTheDocument()
      })
    })

    it('should keep Archive and Mark as Closed buttons visible for unregistered users', async () => {
      renderComponent()

      const messageCard = screen.getByText('General inquiry')
      await user.click(messageCard.closest('div[class*="p-6"]'))

      await waitFor(() => {
        // Find the Archive button in the modal (not the tab)
        const archiveButtons = screen.getAllByRole('button', { name: /Archive/i })
        const modalArchiveButton = archiveButtons.find(btn => btn.className.includes('text-red'))
        expect(modalArchiveButton).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /Mark as Closed/i })).toBeInTheDocument()
      })
    })
  })

  describe('Mark as Closed', () => {
    beforeEach(() => {
      mockStoreStateEnhanced.markAsRead.mockResolvedValue({ success: true })
      mockStoreStateEnhanced.fetchMessages.mockResolvedValue({ success: true })
      mockStoreStateEnhanced.markDiscussionMessageAsRead.mockResolvedValue({ success: true })
      mockStoreStateEnhanced.markAsClosed.mockResolvedValue({ success: true })

      useContactsStore.mockReturnValue(mockStoreStateEnhanced)
      useAuth.mockReturnValue({ user: mockCurrentAdmin })
    })

    it('should show "Mark as Closed" button for open conversations', async () => {
      renderComponent()

      const messageCard = screen.getByText('Question about menu')
      await user.click(messageCard.closest('div[class*="p-6"]'))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Mark as Closed/i })).toBeInTheDocument()
      })
    })

    it('should mark conversation as closed', async () => {
      renderComponent()

      const messageCard = screen.getByText('Question about menu')
      await user.click(messageCard.closest('div[class*="p-6"]'))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Mark as Closed/i })).toBeInTheDocument()
      })

      const closeButton = screen.getByRole('button', { name: /Mark as Closed/i })
      await user.click(closeButton)

      await waitFor(() => {
        expect(mockStoreStateEnhanced.markAsClosed).toHaveBeenCalledWith('msg-001')
      })
    })

    it('should disable reply form for closed conversations', async () => {
      renderComponent()

      const messageCard = screen.getByText('Complaint')
      await user.click(messageCard.closest('div[class*="p-6"]'))

      await waitFor(() => {
        expect(screen.getByText('This conversation is closed. No more replies can be added.')).toBeInTheDocument()
        expect(screen.queryByPlaceholderText('Type your message here...')).not.toBeInTheDocument()
      })
    })

    it('should show "Closed" status badge for closed messages', async () => {
      renderComponent()

      const messageCard = screen.getByText('Complaint')
      await user.click(messageCard.closest('div[class*="p-6"]'))

      await waitFor(() => {
        expect(screen.getAllByText('Closed').length).toBeGreaterThanOrEqual(1)
      })
    })
  })

  describe('Mark Discussion Message as Read', () => {
    beforeEach(() => {
      mockStoreStateEnhanced.markAsRead.mockResolvedValue({ success: true })
      mockStoreStateEnhanced.fetchMessages.mockResolvedValue({ success: true })
      mockStoreStateEnhanced.markDiscussionMessageAsRead.mockResolvedValue({ success: true })

      useContactsStore.mockReturnValue(mockStoreStateEnhanced)
      useAuth.mockReturnValue({ user: mockCurrentAdmin })
    })

    it('should mark unread user messages as read when opening', async () => {
      renderComponent()

      const messageCard = screen.getByText('Question about menu')
      await user.click(messageCard.closest('div[class*="p-6"]'))

      await waitFor(() => {
        expect(mockStoreStateEnhanced.markDiscussionMessageAsRead).toHaveBeenCalledWith('msg-001', 'reply-002')
      })
    })

    it('should not mark admin messages as read', async () => {
      mockStoreStateEnhanced.markDiscussionMessageAsRead.mockClear()

      renderComponent()

      const messageCard = screen.getByText('Reservation question')
      await user.click(messageCard.closest('div[class*="p-6"]'))

      await waitFor(() => {
        expect(mockStoreStateEnhanced.markDiscussionMessageAsRead).not.toHaveBeenCalled()
      })
    })
  })

  describe('NewlyReplied Status', () => {
    beforeEach(() => {
      mockStoreStateEnhanced.markAsRead.mockResolvedValue({ success: true })
      mockStoreStateEnhanced.fetchMessages.mockResolvedValue({ success: true })
      mockStoreStateEnhanced.markDiscussionMessageAsRead.mockResolvedValue({ success: true })

      useContactsStore.mockReturnValue(mockStoreStateEnhanced)
      useAuth.mockReturnValue({ user: mockCurrentAdmin })
    })

    it('should display newlyReplied badge in message list', () => {
      renderComponent()

      const reservationMessage = screen.getByText('Reservation question')
      const messageCard = reservationMessage.closest('div[class*="p-6"]')

      expect(within(messageCard).getByText('New Reply')).toBeInTheDocument()
    })

    it('should include newlyReplied in badge count', () => {
      renderComponent()

      const newCount = mockStoreStateEnhanced.getNewMessagesCount()
      expect(newCount).toBe(3)
    })

    it('should show newlyReplied in statistics', () => {
      renderComponent()

      const stats = mockStoreStateEnhanced.getMessagesStats()
      expect(stats.newlyReplied).toBe(2)
    })
  })

  describe('Management Buttons', () => {
    beforeEach(() => {
      mockStoreStateEnhanced.markAsRead.mockResolvedValue({ success: true })
      mockStoreStateEnhanced.fetchMessages.mockResolvedValue({ success: true })
      mockStoreStateEnhanced.markDiscussionMessageAsRead.mockResolvedValue({ success: true })

      useContactsStore.mockReturnValue(mockStoreStateEnhanced)
      useAuth.mockReturnValue({ user: mockCurrentAdmin })
    })

    it('should show Archive and Mark as Closed buttons even when reply form is hidden', async () => {
      renderComponent()

      const messageCard = screen.getByText('General inquiry')
      await user.click(messageCard.closest('div[class*="p-6"]'))

      await waitFor(() => {
        expect(screen.queryByPlaceholderText('Type your message here...')).not.toBeInTheDocument()
        // Find the Archive button in the modal (not the tab)
        const archiveButtons = screen.getAllByRole('button', { name: /Archive/i })
        const modalArchiveButton = archiveButtons.find(btn => btn.className.includes('text-red'))
        expect(modalArchiveButton).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /Mark as Closed/i })).toBeInTheDocument()
      })
    })

    it('should show Archive and Mark as Closed buttons for closed conversations', async () => {
      renderComponent()

      const messageCard = screen.getByText('Complaint')
      await user.click(messageCard.closest('div[class*="p-6"]'))

      await waitFor(() => {
        // Find the Archive button in the modal (not the tab)
        const archiveButtons = screen.getAllByRole('button', { name: /Archive/i })
        const modalArchiveButton = archiveButtons.find(btn => btn.className.includes('text-red'))
        expect(modalArchiveButton).toBeInTheDocument()
        const closedButtons = screen.getAllByRole('button', { name: /Closed/i })
        const closedButton = closedButtons.find(btn => btn.disabled)
        expect(closedButton).toBeDefined()
        expect(closedButton).toBeDisabled()
      })
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      mockStoreStateEnhanced.markAsRead.mockResolvedValue({ success: true })
      mockStoreStateEnhanced.fetchMessages.mockResolvedValue({ success: true })
      mockStoreStateEnhanced.markDiscussionMessageAsRead.mockResolvedValue({ success: true })

      useContactsStore.mockReturnValue(mockStoreStateEnhanced)
      useAuth.mockReturnValue({ user: mockCurrentAdmin })
    })

    it('should show error toast when reply fails', async () => {
      const { toast } = await import('react-hot-toast')
      mockStoreStateEnhanced.addReply.mockResolvedValue({ success: false, error: 'Network error' })

      renderComponent()

      const messageCard = screen.getByText('Question about menu')
      await user.click(messageCard.closest('div[class*="p-6"]'))

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Type your message here...')).toBeInTheDocument()
      })

      const textarea = screen.getByPlaceholderText('Type your message here...')
      await user.type(textarea, 'Test reply')

      const sendButton = screen.getByRole('button', { name: /Send Reply/i })
      await user.click(sendButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Network error')
      })
    })

    it('should show error toast when marking as closed fails', async () => {
      const { toast } = await import('react-hot-toast')
      mockStoreStateEnhanced.markAsClosed.mockResolvedValue({ success: false, error: 'Failed to close' })

      renderComponent()

      const messageCard = screen.getByText('Question about menu')
      await user.click(messageCard.closest('div[class*="p-6"]'))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Mark as Closed/i })).toBeInTheDocument()
      })

      const closeButton = screen.getByRole('button', { name: /Mark as Closed/i })
      await user.click(closeButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to close')
      })
    })
  })
})
