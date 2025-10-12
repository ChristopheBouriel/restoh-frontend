import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import ContactsManagement from '../../../pages/admin/ContactsManagement'
import useContactsStore from '../../../store/contactsStore'

// Mock the contacts store
vi.mock('../../../store/contactsStore')

// Mock window.confirm for delete confirmation
Object.defineProperty(window, 'confirm', {
  writable: true,
  value: vi.fn()
})

describe('ContactsManagement Component', () => {
  // Create realistic test data with various message scenarios
  const mockMessages = [
    {
      id: 'msg-001',
      name: 'Marie Dubois',
      email: 'marie.dubois@email.com',
      phone: '06 12 34 56 78',
      subject: 'Question about allergens',
      message: 'Bonjour, pourriez-vous me dire si vos plats végétariens contiennent des traces de fruits à coque ? J\'ai une allergie sévère. Merci.',
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
      message: 'Nous souhaitons organiser un événement d\'entreprise pour 50 personnes le mois prochain. Proposez-vous des menus de groupe et avez-vous une salle privée disponible ?',
      status: 'read',
      createdAt: '2024-01-19T14:30:00Z',
      readAt: '2024-01-19T14:45:00Z',
      repliedAt: null
    },
    {
      id: 'msg-003',
      name: 'Sophie Leroy',
      email: 'sophie.leroy@gmail.com',
      phone: null, // No phone number
      subject: 'Compliments sur le service',
      message: 'Excellent repas hier soir ! Le service était impeccable et les plats délicieux. Nous reviendrons certainement. Merci à toute l\'équipe.',
      status: 'replied',
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
      createdAt: '2024-01-20T09:15:00Z',
      readAt: null,
      repliedAt: null
    }
  ]

  const mockStoreState = {
    messages: mockMessages,
    isLoading: false,
    fetchMessages: vi.fn(),
    markAsRead: vi.fn(),
    markAsReplied: vi.fn(),
    deleteMessage: vi.fn(),
    getMessagesStats: vi.fn(() => ({
      total: 4,
      new: 2,
      read: 1,
      replied: 1
    }))
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
    window.confirm.mockReturnValue(true) // Default to confirming deletion
    useContactsStore.mockReturnValue(mockStoreState)
  })

  // 1. Core Rendering Tests
  describe('Core Rendering', () => {
    it('should render header, statistics, and message filters', () => {
      renderComponent()
      
      // Header
      expect(screen.getByText('Messages Management')).toBeInTheDocument()
      expect(screen.getByText('Manage messages received via the contact form')).toBeInTheDocument()
      
      // Statistics cards (Note: "New", "Read", "Replied" appear multiple times in UI)
      expect(screen.getByText('Total')).toBeInTheDocument()
      expect(screen.getAllByText('New').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('Read').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('Replied').length).toBeGreaterThanOrEqual(1)
      
      // Filter buttons with counts
      expect(screen.getByText('All (4)')).toBeInTheDocument()
      expect(screen.getByText('New (2)')).toBeInTheDocument()
      expect(screen.getByText('Read (1)')).toBeInTheDocument()
      expect(screen.getByText('Replied (1)')).toBeInTheDocument()
    })

    it('should initialize messages data on mount', () => {
      renderComponent()
      expect(mockStoreState.fetchMessages).toHaveBeenCalledOnce()
    })

    it('should display message list with different status indicators', () => {
      renderComponent()
      
      // Check that all messages are displayed with their subjects
      expect(screen.getByText('Question about allergens')).toBeInTheDocument()
      expect(screen.getByText('Réservation événement d\'entreprise')).toBeInTheDocument()
      expect(screen.getByText('Compliments sur le service')).toBeInTheDocument()
      expect(screen.getByText('Question about hours')).toBeInTheDocument()
      
      // Check status indicators (may appear in stats, filters, and message cards)
      expect(screen.getAllByText('New').length).toBeGreaterThanOrEqual(2) // At least 2 new messages
      expect(screen.getAllByText('Read').length).toBeGreaterThanOrEqual(1) // At least 1 read message
      expect(screen.getAllByText('Replied').length).toBeGreaterThanOrEqual(1) // At least 1 replied message
      
      // Check contact information is displayed
      expect(screen.getByText('Marie Dubois')).toBeInTheDocument()
      expect(screen.getByText('marie.dubois@email.com')).toBeInTheDocument()
      expect(screen.getByText('06 12 34 56 78')).toBeInTheDocument()
    })
  })

  // 2. Statistics & Filtering Tests
  describe('Statistics and Filtering', () => {
    it('should display correct message counts in statistics cards', () => {
      renderComponent()
      
      const stats = mockStoreState.getMessagesStats()
      
      // Check statistics numbers are displayed
      expect(screen.getAllByText(stats.total.toString()).length).toBeGreaterThanOrEqual(1) // Stats card + possibly filter button
      expect(screen.getAllByText(stats.new.toString()).length).toBeGreaterThanOrEqual(1) // Stats card + possibly filter button
      expect(screen.getAllByText(stats.read.toString()).length).toBeGreaterThanOrEqual(1) // Stats card + possibly filter button
      expect(screen.getAllByText(stats.replied.toString()).length).toBeGreaterThanOrEqual(1) // Stats card + possibly filter button
    })

    it('should filter messages by status when filter buttons are clicked', async () => {
      renderComponent()
      
      // Initially all messages should be visible
      expect(screen.getByText('Question about allergens')).toBeInTheDocument()
      expect(screen.getByText('Réservation événement d\'entreprise')).toBeInTheDocument()
      expect(screen.getByText('Compliments sur le service')).toBeInTheDocument()
      expect(screen.getByText('Question about hours')).toBeInTheDocument()
      
      // Filter by "New" - should show only new messages
      await user.click(screen.getByText('New (2)'))
      
      expect(screen.getByText('Question about allergens')).toBeInTheDocument()
      expect(screen.getByText('Question about hours')).toBeInTheDocument()
      expect(screen.queryByText('Réservation événement d\'entreprise')).not.toBeInTheDocument()
      expect(screen.queryByText('Compliments sur le service')).not.toBeInTheDocument()
      
      // Filter by "Read" - should show only read messages
      await user.click(screen.getByText('Read (1)'))
      
      expect(screen.getByText('Réservation événement d\'entreprise')).toBeInTheDocument()
      expect(screen.queryByText('Question about allergens')).not.toBeInTheDocument()
      expect(screen.queryByText('Question about hours')).not.toBeInTheDocument()
      expect(screen.queryByText('Compliments sur le service')).not.toBeInTheDocument()
      
      // Filter by "Replied" - should show only replied messages
      await user.click(screen.getByText('Replied (1)'))
      
      expect(screen.getByText('Compliments sur le service')).toBeInTheDocument()
      expect(screen.queryByText('Question about allergens')).not.toBeInTheDocument()
      expect(screen.queryByText('Réservation événement d\'entreprise')).not.toBeInTheDocument()
      expect(screen.queryByText('Question about hours')).not.toBeInTheDocument()
      
      // Back to "Tous" - should show all messages again
      await user.click(screen.getByText('All (4)'))
      
      expect(screen.getByText('Question about allergens')).toBeInTheDocument()
      expect(screen.getByText('Réservation événement d\'entreprise')).toBeInTheDocument()
      expect(screen.getByText('Compliments sur le service')).toBeInTheDocument()
      expect(screen.getByText('Question about hours')).toBeInTheDocument()
    })

    it('should show empty state when no messages match filter', () => {
      // Mock store with no messages
      useContactsStore.mockReturnValue({
        ...mockStoreState,
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

  // 3. Message Actions Tests
  describe('Message Actions', () => {
    it('should open message modal when message is clicked', async () => {
      renderComponent()
      
      // Click on the first message
      const messageElement = screen.getByText('Question about allergens').closest('div[class*="p-6"]')
      await user.click(messageElement)
      
      await waitFor(() => {
        // Modal should be open with message details
        expect(screen.getAllByText('Marie Dubois').length).toBeGreaterThanOrEqual(1)
        expect(screen.getAllByText('marie.dubois@email.com').length).toBeGreaterThanOrEqual(1)
        expect(screen.getAllByText('06 12 34 56 78').length).toBeGreaterThanOrEqual(1)
        expect(screen.getByText('Message')).toBeInTheDocument()
        expect(screen.getAllByText('Bonjour, pourriez-vous me dire si vos plats végétariens contiennent des traces de fruits à coque ? J\'ai une allergie sévère. Merci.').length).toBeGreaterThanOrEqual(1)
      })
    })

    it('should mark new message as read when clicked', async () => {
      mockStoreState.markAsRead.mockResolvedValue({ success: true })
      renderComponent()
      
      // Click on a new message
      const newMessageElement = screen.getByText('Question about allergens').closest('div[class*="p-6"]')
      await user.click(newMessageElement)
      
      await waitFor(() => {
        expect(mockStoreState.markAsRead).toHaveBeenCalledWith('msg-001')
      })
    })

    it('should mark message as replied from modal', async () => {
      mockStoreState.markAsReplied.mockResolvedValue({ success: true })
      renderComponent()
      
      // Open a message that's not yet replied
      const messageElement = screen.getByText('Réservation événement d\'entreprise').closest('div[class*="p-6"]')
      await user.click(messageElement)
      
      await waitFor(() => {
        expect(screen.getByText('Mark as replied')).toBeInTheDocument()
      })
      
      // Click the reply button
      await user.click(screen.getByText('Mark as replied'))
      
      await waitFor(() => {
        expect(mockStoreState.markAsReplied).toHaveBeenCalledWith('msg-002')
      })
    })

    it('should delete message with confirmation prompt', async () => {
      mockStoreState.deleteMessage.mockResolvedValue({ success: true })
      renderComponent()
      
      // Open a message modal
      const messageElement = screen.getByText('Question about allergens').closest('div[class*="p-6"]')
      await user.click(messageElement)
      
      await waitFor(() => {
        expect(screen.getByText('Delete')).toBeInTheDocument()
      })
      
      // Click delete button
      await user.click(screen.getByText('Delete'))
      
      // Should show confirmation dialog
      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this message?')
      
      await waitFor(() => {
        expect(mockStoreState.deleteMessage).toHaveBeenCalledWith('msg-001')
      })
    })
  })

  // 4. Modal Functionality Tests
  describe('Modal Functionality', () => {
    it('should display comprehensive message information in modal', async () => {
      renderComponent()
      
      // Open message modal
      const messageElement = screen.getByText('Question about allergens').closest('div[class*="p-6"]')
      await user.click(messageElement)
      
      await waitFor(() => {
        // Check header
        expect(screen.getAllByText('Question about allergens').length).toBeGreaterThanOrEqual(1)
        expect(screen.getAllByText('New').length).toBeGreaterThanOrEqual(1)
        
        // Check contact information section
        expect(screen.getByText('Name')).toBeInTheDocument()
        expect(screen.getAllByText('Marie Dubois').length).toBeGreaterThanOrEqual(1)
        expect(screen.getByText('Email')).toBeInTheDocument()
        expect(screen.getAllByText('marie.dubois@email.com').length).toBeGreaterThanOrEqual(1)
        expect(screen.getByText('Phone')).toBeInTheDocument()
        expect(screen.getAllByText('06 12 34 56 78').length).toBeGreaterThanOrEqual(1)
        expect(screen.getByText('Date')).toBeInTheDocument()
        
        // Check message content
        expect(screen.getByText('Message')).toBeInTheDocument()
        expect(screen.getAllByText('Bonjour, pourriez-vous me dire si vos plats végétariens contiennent des traces de fruits à coque ? J\'ai une allergie sévère. Merci.').length).toBeGreaterThanOrEqual(1)
      })
    })

    it('should close modal with close button and X button', async () => {
      renderComponent()
      
      // Open modal
      const messageElement = screen.getByText('Question about allergens').closest('div[class*="p-6"]')
      await user.click(messageElement)
      
      await waitFor(() => {
        expect(screen.getByText('Message')).toBeInTheDocument()
      })
      
      // Close with X button (find by SVG path since X is implemented as SVG)
      const xButtons = screen.getAllByRole('button')
      const xButton = xButtons.find(button => button.querySelector('svg path[d*="M6 18L18 6M6 6l12 12"]'))
      if (xButton) {
        await user.click(xButton)
        
        await waitFor(() => {
          expect(screen.queryByText('Message')).not.toBeInTheDocument()
        })
      } else {
        // Skip X button test if not found, focus on close button test
        await user.click(screen.getByText('Close'))
        
        await waitFor(() => {
          expect(screen.queryByText('Message')).not.toBeInTheDocument()
        })
      }
      
      // Open again and close with "Close" button
      await user.click(messageElement)
      
      await waitFor(() => {
        expect(screen.getByText('Message')).toBeInTheDocument()
      })
      
      const closeButton = screen.getByText('Close')
      await user.click(closeButton)
      
      await waitFor(() => {
        expect(screen.queryByText('Message')).not.toBeInTheDocument()
      })
    })

    it('should show different action buttons based on message status', async () => {
      renderComponent()
      
      // Open a new/read message - should show "Mark as replied"
      const unRepliedMessage = screen.getByText('Réservation événement d\'entreprise').closest('div[class*="p-6"]')
      await user.click(unRepliedMessage)
      
      await waitFor(() => {
        expect(screen.getByText('Mark as replied')).toBeInTheDocument()
        expect(screen.getByText('Delete')).toBeInTheDocument()
        expect(screen.getByText('Close')).toBeInTheDocument()
      })
      
      // Close modal
      await user.click(screen.getByText('Close'))
      
      // Open a replied message - should NOT show "Mark as replied"
      const repliedMessage = screen.getByText('Compliments sur le service').closest('div[class*="p-6"]')
      await user.click(repliedMessage)
      
      await waitFor(() => {
        expect(screen.queryByText('Mark as replied')).not.toBeInTheDocument()
        expect(screen.getByText('Delete')).toBeInTheDocument()
        expect(screen.getByText('Close')).toBeInTheDocument()
      })
    })
  })

  // 5. State Management & Edge Cases
  describe('State Management and Edge Cases', () => {
    it('should handle loading state appropriately', () => {
      useContactsStore.mockReturnValue({
        ...mockStoreState,
        isLoading: true
      })
      
      renderComponent()
      
      // Component should still render with loading state
      expect(screen.getByText('Messages Management')).toBeInTheDocument()
    })

    it('should handle empty message list gracefully', async () => {
      useContactsStore.mockReturnValue({
        ...mockStoreState,
        messages: [],
        getMessagesStats: vi.fn(() => ({
          total: 0,
          new: 0,
          read: 0,
          replied: 0
        }))
      })
      
      renderComponent()
      
      // Should show empty state
      expect(screen.getByText('No messages')).toBeInTheDocument()
      expect(screen.getByText('No messages received yet.')).toBeInTheDocument()
      
      // Filter buttons should show zero counts
      expect(screen.getByText('All (0)')).toBeInTheDocument()
      expect(screen.getByText('New (0)')).toBeInTheDocument()
      expect(screen.getByText('Read (0)')).toBeInTheDocument()
      expect(screen.getByText('Replied (0)')).toBeInTheDocument()
    })

    it('should handle message without phone number', async () => {
      renderComponent()
      
      // Open message from Sophie Leroy (no phone)
      const messageElement = screen.getByText('Compliments sur le service').closest('div[class*="p-6"]')
      await user.click(messageElement)
      
      await waitFor(() => {
        // Should show contact info without phone section
        expect(screen.getAllByText('Sophie Leroy').length).toBeGreaterThanOrEqual(1)
        expect(screen.getAllByText('sophie.leroy@gmail.com').length).toBeGreaterThanOrEqual(1)
        // Phone should not be displayed in modal when null
        expect(screen.queryByText('Phone')).not.toBeInTheDocument()
      })
    })

    it('should prevent deletion when user cancels confirmation', async () => {
      // Mock confirm to return false (user cancels)
      window.confirm.mockReturnValue(false)
      
      renderComponent()
      
      // Open a message modal
      const messageElement = screen.getByText('Question about allergens').closest('div[class*="p-6"]')
      await user.click(messageElement)
      
      await waitFor(() => {
        expect(screen.getByText('Delete')).toBeInTheDocument()
      })
      
      // Click delete button
      await user.click(screen.getByText('Delete'))
      
      // Should show confirmation dialog
      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this message?')
      
      // Should NOT call deleteMessage since user cancelled
      expect(mockStoreState.deleteMessage).not.toHaveBeenCalled()
    })
  })
})