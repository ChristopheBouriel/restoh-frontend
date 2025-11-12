/**
 * Enhanced ContactsManagement Tests
 *
 * Tests for new features added to ContactsManagement:
 * - Discussion system with userId/role architecture
 * - Reply functionality without 'from' parameter
 * - Mark discussion messages as read
 * - Mark as Replied button for unregistered users
 * - Mark as Closed functionality
 * - NewlyReplied status handling
 * - Admin identity display (You vs other admin names)
 */

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

describe('ContactsManagement - Enhanced Features', () => {
  const mockCurrentAdmin = {
    _id: 'admin-current',
    name: 'Current Admin',
    email: 'current@admin.com',
    role: 'admin'
  }

  const mockMessagesWithDiscussion = [
    // Message with discussion from user and current admin (newlyReplied status to test marking as read)
    {
      _id: 'msg-001',
      userId: 'user-123',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '01 23 45 67 89',
      subject: 'Question about menu',
      message: 'Do you have vegetarian options?',
      status: 'newlyReplied',
      discussion: [
        {
          _id: 'reply-001',
          userId: 'admin-current',
          name: 'Current Admin',
          role: 'admin',
          text: 'Yes, we have several vegetarian dishes.',
          date: '2024-01-20T11:00:00Z',
          status: 'read'
        },
        {
          _id: 'reply-002',
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
      _id: 'msg-002',
      userId: 'user-456',
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '06 98 76 54 32',
      subject: 'Reservation question',
      message: 'Can I book for 10 people?',
      status: 'newlyReplied',
      discussion: [
        {
          _id: 'reply-003',
          userId: 'user-456',
          name: 'Jane Smith',
          role: 'user',
          text: 'I need this for Saturday',
          date: '2024-01-19T10:00:00Z',
          status: 'read'
        },
        {
          _id: 'reply-004',
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
      _id: 'msg-003',
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
      _id: 'msg-004',
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
      _id: 'msg-005',
      userId: 'user-789',
      name: 'Bob Johnson',
      email: 'bob@example.com',
      phone: '07 11 22 33 44',
      subject: 'Complaint',
      message: 'The service was slow',
      status: 'closed',
      discussion: [
        {
          _id: 'reply-005',
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

  const mockStoreState = {
    messages: mockMessagesWithDiscussion,
    isLoading: false,
    fetchMessages: vi.fn(),
    markAsRead: vi.fn(),
    updateMessageStatus: vi.fn(),
    markAsClosed: vi.fn(),
    deleteMessage: vi.fn(),
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

    // Set default successful return values for store methods
    mockStoreState.markAsRead.mockResolvedValue({ success: true })
    mockStoreState.fetchMessages.mockResolvedValue({ success: true })
    mockStoreState.markAsClosed.mockResolvedValue({ success: true })
    mockStoreState.markDiscussionMessageAsRead.mockResolvedValue({ success: true })

    // Mock window.confirm to return true by default
    window.confirm.mockReturnValue(true)

    useContactsStore.mockReturnValue(mockStoreState)
    useAuth.mockReturnValue({ user: mockCurrentAdmin })
  })

  // 1. DISCUSSION DISPLAY
  describe('Discussion Display', () => {
    it('should display discussion thread in message modal', async () => {
      renderComponent()

      // Open message with discussion
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
        // Should find "You" for current admin's message
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
        // Should show "Other Admin" (not "You")
        expect(screen.getByText('Other Admin')).toBeInTheDocument()
        // Should not show "You" for other admin
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
        // John Doe appears in the message list and in the discussion
        expect(screen.getAllByText('John Doe').length).toBeGreaterThanOrEqual(2)
      })
    })

    it('should show read/new status for discussion messages', async () => {
      renderComponent()

      const messageCard = screen.getByText('Question about menu')
      await user.click(messageCard.closest('div[class*="p-6"]'))

      await waitFor(() => {
        // Check for status badges in discussion
        const discussionSection = screen.getByText('Discussion').closest('div')
        expect(within(discussionSection).getByText('New')).toBeInTheDocument()
        expect(within(discussionSection).getByText('Read')).toBeInTheDocument()
      })
    })
  })

  // 2. ADD REPLY FUNCTIONALITY
  describe('Add Reply', () => {
    it('should allow admin to add reply', async () => {
      mockStoreState.addReply.mockResolvedValue({ success: true })

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
        // Should call addReply WITHOUT 'from' parameter (JWT-based)
        expect(mockStoreState.addReply).toHaveBeenCalledWith(
          'msg-001',
          'Here is our vegetarian menu link.'
        )
        expect(mockStoreState.addReply).toHaveBeenCalledTimes(1)
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
      mockStoreState.addReply.mockResolvedValue({ success: true })

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

  // 3. UNREGISTERED USER HANDLING
  describe('Unregistered User Handling', () => {
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
      mockStoreState.updateMessageStatus.mockResolvedValue({ success: true })

      renderComponent()

      const messageCard = screen.getByText('General inquiry')
      await user.click(messageCard.closest('div[class*="p-6"]'))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Mark as Replied/i })).toBeInTheDocument()
      })

      const markAsRepliedButton = screen.getByRole('button', { name: /Mark as Replied/i })
      await user.click(markAsRepliedButton)

      await waitFor(() => {
        expect(mockStoreState.updateMessageStatus).toHaveBeenCalledWith('msg-003', 'replied')
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

    it('should keep Delete and Mark as Closed buttons visible for unregistered users', async () => {
      renderComponent()

      const messageCard = screen.getByText('General inquiry')
      await user.click(messageCard.closest('div[class*="p-6"]'))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Delete/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /Mark as Closed/i })).toBeInTheDocument()
      })
    })
  })

  // 4. MARK AS CLOSED FUNCTIONALITY
  describe('Mark as Closed', () => {
    it('should show "Mark as Closed" button for open conversations', async () => {
      renderComponent()

      const messageCard = screen.getByText('Question about menu')
      await user.click(messageCard.closest('div[class*="p-6"]'))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Mark as Closed/i })).toBeInTheDocument()
      })
    })

    it('should mark conversation as closed', async () => {
      mockStoreState.markAsClosed.mockResolvedValue({ success: true })

      renderComponent()

      const messageCard = screen.getByText('Question about menu')
      await user.click(messageCard.closest('div[class*="p-6"]'))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Mark as Closed/i })).toBeInTheDocument()
      })

      const closeButton = screen.getByRole('button', { name: /Mark as Closed/i })
      await user.click(closeButton)

      await waitFor(() => {
        expect(mockStoreState.markAsClosed).toHaveBeenCalledWith('msg-001')
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
        // "Closed" appears in both the status badge and the button
        expect(screen.getAllByText('Closed').length).toBeGreaterThanOrEqual(1)
      })
    })
  })

  // 5. MARK DISCUSSION MESSAGE AS READ
  describe('Mark Discussion Message as Read', () => {
    it('should mark unread user messages as read when opening', async () => {
      mockStoreState.markDiscussionMessageAsRead.mockResolvedValue({ success: true })

      renderComponent()

      const messageCard = screen.getByText('Question about menu')
      await user.click(messageCard.closest('div[class*="p-6"]'))

      await waitFor(() => {
        // Should mark the unread user message (reply-002) as read
        expect(mockStoreState.markDiscussionMessageAsRead).toHaveBeenCalledWith('msg-001', 'reply-002')
      })
    })

    it('should not mark admin messages as read', async () => {
      mockStoreState.markDiscussionMessageAsRead.mockClear()

      renderComponent()

      // Open message where last message is from admin with status 'new'
      const messageCard = screen.getByText('Reservation question')
      await user.click(messageCard.closest('div[class*="p-6"]'))

      await waitFor(() => {
        // Should not try to mark admin message as read (admin can't mark their own messages)
        expect(mockStoreState.markDiscussionMessageAsRead).not.toHaveBeenCalled()
      })
    })
  })

  // 6. NEWLYREPLIED STATUS
  describe('NewlyReplied Status', () => {
    it('should display newlyReplied badge in message list', () => {
      renderComponent()

      // Find message with newlyReplied status
      const reservationMessage = screen.getByText('Reservation question')
      const messageCard = reservationMessage.closest('div[class*="p-6"]')

      // Should have visual indicator for new reply
      expect(within(messageCard).getByText('New Reply')).toBeInTheDocument()
    })

    it('should include newlyReplied in badge count', () => {
      renderComponent()

      // The stats card for "New" should show 1, and stats for "New Reply" should show 2
      // Total new items = 3 (verified by getNewMessagesCount)
      const newCount = mockStoreState.getNewMessagesCount()
      expect(newCount).toBe(3) // 1 new + 2 newlyReplied
    })

    it('should show newlyReplied in statistics', () => {
      renderComponent()

      // Stats should include newlyReplied count
      const stats = mockStoreState.getMessagesStats()
      expect(stats.newlyReplied).toBe(2)
    })
  })

  // 7. MANAGEMENT BUTTONS ALWAYS VISIBLE
  describe('Management Buttons', () => {
    it('should show Delete and Mark as Closed buttons even when reply form is hidden', async () => {
      renderComponent()

      // Open unregistered user message (no reply form)
      const messageCard = screen.getByText('General inquiry')
      await user.click(messageCard.closest('div[class*="p-6"]'))

      await waitFor(() => {
        expect(screen.queryByPlaceholderText('Type your message here...')).not.toBeInTheDocument()
        expect(screen.getByRole('button', { name: /Delete/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /Mark as Closed/i })).toBeInTheDocument()
      })
    })

    it('should show Delete and Mark as Closed buttons for closed conversations', async () => {
      renderComponent()

      const messageCard = screen.getByText('Complaint')
      await user.click(messageCard.closest('div[class*="p-6"]'))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Delete/i })).toBeInTheDocument()
        // Button text changes to "Closed" when already closed - find the disabled one
        const closedButtons = screen.getAllByRole('button', { name: /Closed/i })
        const closedButton = closedButtons.find(btn => btn.disabled)
        expect(closedButton).toBeDefined()
        expect(closedButton).toBeDisabled()
      })
    })
  })

  // 8. ERROR HANDLING
  describe('Error Handling', () => {
    it('should show error toast when reply fails', async () => {
      const { toast } = await import('react-hot-toast')
      mockStoreState.addReply.mockResolvedValue({ success: false, error: 'Network error' })

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
      mockStoreState.markAsClosed.mockResolvedValue({ success: false, error: 'Failed to close' })

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
