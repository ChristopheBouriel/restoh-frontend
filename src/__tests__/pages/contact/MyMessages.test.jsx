/**
 * MyMessages Component Tests
 *
 * Tests the user-facing messages interface including:
 * - Message listing and status display
 * - Discussion thread viewing
 * - Reply functionality with userId/role system
 * - Admin redirect
 * - Character limits
 *
 * NOTE: Some interaction tests require DOM selectors adjustment.
 * Tests marked with TODO may need updates after backend integration.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import MyMessages from '../../../pages/contact/MyMessages'
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

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

// Mock scrollIntoView which is not available in JSDOM
window.HTMLElement.prototype.scrollIntoView = vi.fn()

describe('MyMessages', () => {
  const mockUser = {
    _id: 'user-123',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'user'
  }

  const mockAdmin = {
    _id: 'admin-123',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin'
  }

  const mockMyMessages = [
    {
      _id: 'msg-001',
      subject: 'General inquiry - Question about menu',
      message: 'Do you have vegetarian options?',
      createdAt: '2024-01-20T10:00:00Z',
      status: 'new',
      discussion: []
    },
    {
      _id: 'msg-002',
      subject: 'Reservation - Birthday party',
      message: 'I would like to reserve a table for 8 people',
      createdAt: '2024-01-19T15:00:00Z',
      status: 'replied',
      discussion: [
        {
          _id: 'reply-001',
          userId: 'user-123',
          name: 'John Doe',
          role: 'user',
          text: 'I forgot to mention, we need it for Saturday',
          date: '2024-01-19T16:00:00Z',
          status: 'new'
        }
      ]
    },
    {
      _id: 'msg-003',
      subject: 'Complaint - Cold food',
      message: 'My order arrived cold yesterday',
      createdAt: '2024-01-18T12:00:00Z',
      status: 'replied',
      discussion: [
        {
          _id: 'reply-002',
          userId: 'admin-123',
          name: 'Admin User',
          role: 'admin',
          text: 'We apologize for this issue. We will contact you shortly.',
          date: '2024-01-18T13:00:00Z',
          status: 'new'
        }
      ]
    }
  ]

  const mockFetchMyMessages = vi.fn()
  const mockAddReply = vi.fn()
  const mockMarkDiscussionMessageAsRead = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigate.mockClear()

    useAuth.mockReturnValue({
      user: mockUser
    })

    useContactsStore.mockReturnValue({
      myMessages: mockMyMessages,
      isLoading: false,
      fetchMyMessages: mockFetchMyMessages,
      addReply: mockAddReply,
      markDiscussionMessageAsRead: mockMarkDiscussionMessageAsRead
    })
  })

  // 1. RENDERING AND INITIAL STATE
  describe('Rendering and Initial State', () => {
    it('should render page header correctly', () => {
      render(
        <BrowserRouter>
          <MyMessages />
        </BrowserRouter>
      )

      expect(screen.getByText('My Messages')).toBeInTheDocument()
      expect(screen.getByText('View and reply to your contact messages')).toBeInTheDocument()
    })

    it('should fetch messages on mount', () => {
      render(
        <BrowserRouter>
          <MyMessages />
        </BrowserRouter>
      )

      expect(mockFetchMyMessages).toHaveBeenCalledTimes(1)
    })

    it('should show loading spinner when loading', () => {
      useContactsStore.mockReturnValue({
        myMessages: [],
        isLoading: true,
        fetchMyMessages: mockFetchMyMessages,
        addReply: mockAddReply,
        markDiscussionMessageAsRead: mockMarkDiscussionMessageAsRead
      })

      render(
        <BrowserRouter>
          <MyMessages />
        </BrowserRouter>
      )

      expect(screen.getByText((content, element) => {
        return element.classList.contains('animate-spin')
      })).toBeInTheDocument()
    })

    it('should show empty state when no messages', () => {
      useContactsStore.mockReturnValue({
        myMessages: [],
        isLoading: false,
        fetchMyMessages: mockFetchMyMessages,
        addReply: mockAddReply,
        markDiscussionMessageAsRead: mockMarkDiscussionMessageAsRead
      })

      render(
        <BrowserRouter>
          <MyMessages />
        </BrowserRouter>
      )

      expect(screen.getByText('No messages yet')).toBeInTheDocument()
      expect(screen.getByText("You haven't sent any contact messages yet.")).toBeInTheDocument()
    })

    it('should display list of messages', () => {
      render(
        <BrowserRouter>
          <MyMessages />
        </BrowserRouter>
      )

      expect(screen.getByText(/Question about menu/)).toBeInTheDocument()
      expect(screen.getByText(/Birthday party/)).toBeInTheDocument()
      expect(screen.getByText(/Cold food/)).toBeInTheDocument()
    })
  })

  // 2. ADMIN REDIRECT
  describe('Admin Redirect', () => {
    it('should redirect admins to contacts management', async () => {
      useAuth.mockReturnValue({
        user: mockAdmin
      })

      render(
        <BrowserRouter>
          <MyMessages />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/admin/contacts')
      })
    })

    it('should not fetch messages for admins', () => {
      useAuth.mockReturnValue({
        user: mockAdmin
      })

      render(
        <BrowserRouter>
          <MyMessages />
        </BrowserRouter>
      )

      // Admin redirection happens before fetch, so no calls should be made
      expect(mockFetchMyMessages).not.toHaveBeenCalled()
    })
  })

  // 3. MESSAGE STATUS DISPLAY
  describe('Message Status Display', () => {
    it('should show "Sent" status for new messages', () => {
      render(
        <BrowserRouter>
          <MyMessages />
        </BrowserRouter>
      )

      const statusBadges = screen.getAllByText('Sent')
      expect(statusBadges.length).toBeGreaterThan(0)
    })

    it('should show "Replied" status when user replied', () => {
      render(
        <BrowserRouter>
          <MyMessages />
        </BrowserRouter>
      )

      expect(screen.getByText('Replied')).toBeInTheDocument()
    })

    it('should show "New Reply" status for unread admin replies', () => {
      render(
        <BrowserRouter>
          <MyMessages />
        </BrowserRouter>
      )

      expect(screen.getByText('New Reply')).toBeInTheDocument()
    })

    it('should show reply count', () => {
      render(
        <BrowserRouter>
          <MyMessages />
        </BrowserRouter>
      )

      const replyElements = screen.getAllByText((content, element) => {
        return content.includes('1') && content.includes('reply')
      })

      // Should find at least one "1 reply" text
      expect(replyElements.length).toBeGreaterThan(0)
    })
  })

  // 4. MESSAGE INTERACTION
  describe('Message Interaction', () => {
    it('should open message detail view when clicking on message', async () => {
      render(
        <BrowserRouter>
          <MyMessages />
        </BrowserRouter>
      )

      // Click on the first message
      const messageCard = screen.getByText(/Question about menu/).closest('div[class*="cursor-pointer"]')
      expect(messageCard).toBeInTheDocument()

      fireEvent.click(messageCard)

      // Should show detail view
      await waitFor(() => {
        expect(screen.getByText('Back to messages')).toBeInTheDocument()
        expect(screen.getByText('Do you have vegetarian options?')).toBeInTheDocument()
      })
    })

    it('should mark unread admin messages as read when opening', async () => {
      render(
        <BrowserRouter>
          <MyMessages />
        </BrowserRouter>
      )

      // Click on the message with unread admin reply (msg-003)
      const messageCard = screen.getByText(/Cold food/).closest('div[class*="cursor-pointer"]')
      fireEvent.click(messageCard)

      // Should call markDiscussionMessageAsRead for unread admin messages
      await waitFor(() => {
        expect(mockMarkDiscussionMessageAsRead).toHaveBeenCalledWith('msg-003', 'reply-002')
        expect(mockFetchMyMessages).toHaveBeenCalledTimes(2) // Initial + refresh after marking
      })
    })

    it('should go back to list view when clicking back button', async () => {
      render(
        <BrowserRouter>
          <MyMessages />
        </BrowserRouter>
      )

      // Open a message
      const messageCard = screen.getByText(/Question about menu/).closest('div[class*="cursor-pointer"]')
      fireEvent.click(messageCard)

      await waitFor(() => {
        expect(screen.getByText('Back to messages')).toBeInTheDocument()
      })

      // Click back button
      const backButton = screen.getByText('Back to messages')
      fireEvent.click(backButton)

      // Should show list view again
      await waitFor(() => {
        expect(screen.getByText(/Question about menu/)).toBeInTheDocument()
        expect(screen.getByText(/Birthday party/)).toBeInTheDocument()
        expect(screen.queryByText('Back to messages')).not.toBeInTheDocument()
      })
    })
  })

  // 5. REPLY FUNCTIONALITY
  describe('Reply Functionality', () => {
    it('should display reply form in message detail view', async () => {
      render(
        <BrowserRouter>
          <MyMessages />
        </BrowserRouter>
      )

      // Open a message
      const messageCard = screen.getByText(/Question about menu/).closest('div[class*="cursor-pointer"]')
      fireEvent.click(messageCard)

      await waitFor(() => {
        expect(screen.getByText('Add a reply')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Type your message here...')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /Send Reply/i })).toBeInTheDocument()
      })
    })

    it('should enable submit button when text is entered', async () => {
      render(
        <BrowserRouter>
          <MyMessages />
        </BrowserRouter>
      )

      // Open a message
      const messageCard = screen.getByText(/Question about menu/).closest('div[class*="cursor-pointer"]')
      fireEvent.click(messageCard)

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Type your message here...')).toBeInTheDocument()
      })

      const textarea = screen.getByPlaceholderText('Type your message here...')
      const submitButton = screen.getByRole('button', { name: /Send Reply/i })

      // Button should be disabled initially
      expect(submitButton).toBeDisabled()

      // Type some text
      fireEvent.change(textarea, { target: { value: 'This is my reply' } })

      // Button should be enabled
      expect(submitButton).not.toBeDisabled()
    })

    it('should submit reply successfully', async () => {
      mockAddReply.mockResolvedValue({ success: true })

      render(
        <BrowserRouter>
          <MyMessages />
        </BrowserRouter>
      )

      // Open a message
      const messageCard = screen.getByText(/Question about menu/).closest('div[class*="cursor-pointer"]')
      fireEvent.click(messageCard)

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Type your message here...')).toBeInTheDocument()
      })

      const textarea = screen.getByPlaceholderText('Type your message here...')
      const submitButton = screen.getByRole('button', { name: /Send Reply/i })

      // Type and submit reply
      fireEvent.change(textarea, { target: { value: 'This is my reply' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockAddReply).toHaveBeenCalledWith('msg-001', 'This is my reply')
        expect(mockFetchMyMessages).toHaveBeenCalledTimes(2) // Initial + refresh after reply
      })
    })

    it('should show error when reply fails', async () => {
      mockAddReply.mockResolvedValue({ success: false, error: 'Failed to send reply' })

      render(
        <BrowserRouter>
          <MyMessages />
        </BrowserRouter>
      )

      // Open a message
      const messageCard = screen.getByText(/Question about menu/).closest('div[class*="cursor-pointer"]')
      fireEvent.click(messageCard)

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Type your message here...')).toBeInTheDocument()
      })

      const textarea = screen.getByPlaceholderText('Type your message here...')
      const submitButton = screen.getByRole('button', { name: /Send Reply/i })

      // Type and submit reply
      fireEvent.change(textarea, { target: { value: 'This is my reply' } })
      fireEvent.click(submitButton)

      const { toast } = await import('react-hot-toast')
      await waitFor(() => {
        expect(mockAddReply).toHaveBeenCalled()
        expect(toast.error).toHaveBeenCalledWith('Failed to send reply')
      })
    })

    it('should disable reply form for closed conversations', async () => {
      const closedMessage = {
        _id: 'msg-closed',
        subject: 'Closed conversation',
        message: 'This conversation is closed',
        createdAt: '2024-01-15T10:00:00Z',
        status: 'closed',
        discussion: []
      }

      useContactsStore.mockReturnValue({
        myMessages: [closedMessage],
        isLoading: false,
        fetchMyMessages: mockFetchMyMessages,
        addReply: mockAddReply,
        markDiscussionMessageAsRead: mockMarkDiscussionMessageAsRead
      })

      render(
        <BrowserRouter>
          <MyMessages />
        </BrowserRouter>
      )

      // Open the closed message
      const messageCard = screen.getByText(/Closed conversation/).closest('div[class*="cursor-pointer"]')
      fireEvent.click(messageCard)

      await waitFor(() => {
        expect(screen.getByText('This conversation is closed. No more replies can be added.')).toBeInTheDocument()
        expect(screen.queryByPlaceholderText('Type your message here...')).not.toBeInTheDocument()
      })
    })
  })

  // 6. DISCUSSION DISPLAY
  describe('Discussion Display', () => {
    it('should display original message', async () => {
      render(
        <BrowserRouter>
          <MyMessages />
        </BrowserRouter>
      )

      // Open a message
      const messageCard = screen.getByText(/Question about menu/).closest('div[class*="cursor-pointer"]')
      fireEvent.click(messageCard)

      await waitFor(() => {
        // Should display original message with "You" label
        expect(screen.getByText('Do you have vegetarian options?')).toBeInTheDocument()
        const youLabels = screen.getAllByText('You')
        expect(youLabels.length).toBeGreaterThan(0)
      })
    })

    it('should display discussion replies', async () => {
      render(
        <BrowserRouter>
          <MyMessages />
        </BrowserRouter>
      )

      // Open message with replies (msg-002)
      const messageCard = screen.getByText(/Birthday party/).closest('div[class*="cursor-pointer"]')
      fireEvent.click(messageCard)

      await waitFor(() => {
        expect(screen.getByText('Discussion')).toBeInTheDocument()
        expect(screen.getByText('I forgot to mention, we need it for Saturday')).toBeInTheDocument()
      })
    })

    it('should show "You" for user messages and "Admin" for admin messages', async () => {
      render(
        <BrowserRouter>
          <MyMessages />
        </BrowserRouter>
      )

      // Open message with admin reply (msg-003)
      const messageCard = screen.getByText(/Cold food/).closest('div[class*="cursor-pointer"]')
      fireEvent.click(messageCard)

      await waitFor(() => {
        // Should show "You" for original message
        const youLabels = screen.getAllByText('You')
        expect(youLabels.length).toBeGreaterThan(0)

        // Should show "Admin" for admin reply
        expect(screen.getByText('Admin')).toBeInTheDocument()
        expect(screen.getByText('We apologize for this issue. We will contact you shortly.')).toBeInTheDocument()
      })
    })

    it('should show read status for discussion messages', async () => {
      render(
        <BrowserRouter>
          <MyMessages />
        </BrowserRouter>
      )

      // Open message with replies (msg-002 has a 'new' reply, msg-003 has a 'new' reply)
      const messageCard = screen.getByText(/Birthday party/).closest('div[class*="cursor-pointer"]')
      fireEvent.click(messageCard)

      await waitFor(() => {
        // Should show status badge for discussion message
        const statusBadges = screen.getAllByText(/New|Read/)
        expect(statusBadges.length).toBeGreaterThan(0)
      })
    })
  })

  // 7. CHARACTER LIMIT
  describe('Character Limit', () => {
    it('should show character count', async () => {
      render(
        <BrowserRouter>
          <MyMessages />
        </BrowserRouter>
      )

      // Open a message
      const messageCard = screen.getByText(/Question about menu/).closest('div[class*="cursor-pointer"]')
      fireEvent.click(messageCard)

      await waitFor(() => {
        expect(screen.getByText('0 / 1000 characters')).toBeInTheDocument()
      })
    })

    it('should update character count as user types', async () => {
      render(
        <BrowserRouter>
          <MyMessages />
        </BrowserRouter>
      )

      // Open a message
      const messageCard = screen.getByText(/Question about menu/).closest('div[class*="cursor-pointer"]')
      fireEvent.click(messageCard)

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Type your message here...')).toBeInTheDocument()
      })

      const textarea = screen.getByPlaceholderText('Type your message here...')

      // Type some text
      fireEvent.change(textarea, { target: { value: 'Hello' } })
      expect(screen.getByText('5 / 1000 characters')).toBeInTheDocument()

      // Type more text
      fireEvent.change(textarea, { target: { value: 'Hello World!' } })
      expect(screen.getByText('12 / 1000 characters')).toBeInTheDocument()
    })

    it('should enforce 1000 character limit', async () => {
      render(
        <BrowserRouter>
          <MyMessages />
        </BrowserRouter>
      )

      // Open a message
      const messageCard = screen.getByText(/Question about menu/).closest('div[class*="cursor-pointer"]')
      fireEvent.click(messageCard)

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Type your message here...')).toBeInTheDocument()
      })

      const textarea = screen.getByPlaceholderText('Type your message here...')

      // Verify the textarea has maxLength attribute set to 1000
      expect(textarea).toHaveAttribute('maxLength', '1000')

      // Type exactly 1000 characters
      const exactText = 'a'.repeat(1000)
      fireEvent.change(textarea, { target: { value: exactText } })

      // Verify the character count shows 1000
      await waitFor(() => {
        expect(screen.getByText('1000 / 1000 characters')).toBeInTheDocument()
      })
    })
  })
})
