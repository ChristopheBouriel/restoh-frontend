import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, test, expect, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import Contact from '../../../pages/contact/Contact'
import useContactsStore from '../../../store/contactsStore'
import { useAuth } from '../../../hooks/useAuth'
import { toast } from 'react-hot-toast'

// Mock external dependencies
vi.mock('../../../store/contactsStore')
vi.mock('../../../hooks/useAuth')
vi.mock('react-hot-toast')

const mockCreateMessage = vi.fn()

// Test wrapper component
const ContactWrapper = () => (
  <MemoryRouter initialEntries={['/contact']}>
    <Contact />
  </MemoryRouter>
)

describe('Contact Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default successful mock setup
    vi.mocked(useContactsStore).mockReturnValue({
      createMessage: mockCreateMessage,
      isLoading: false
    })

    mockCreateMessage.mockResolvedValue({
      success: true,
      messageId: 'msg-123'
    })

    // Mock authenticated user by default
    vi.mocked(useAuth).mockReturnValue({
      user: {
        _id: 'user-123',
        name: 'Jean Dupont',
        email: 'jean@email.com',
        phone: '0123456789',
        role: 'user'
      }
    })
  })

  // 1. BASIC RENDERING (3 tests)
  test('should render contact page with all main sections', () => {
    render(<ContactWrapper />)
    
    // Main heading and description
    expect(screen.getByText('Contact us')).toBeInTheDocument()
    expect(screen.getByText(/A question\? A suggestion\?/)).toBeInTheDocument()
    
    // Contact information section
    expect(screen.getByText('Address')).toBeInTheDocument()
    
    // Contact form section
    expect(screen.getByText('Send us a message')).toBeInTheDocument()
    expect(screen.getByRole('form')).toBeInTheDocument()
    
    // FAQ section
    expect(screen.getByText('Frequently asked questions')).toBeInTheDocument()
  })

  test('should display restaurant contact information correctly', () => {
    render(<ContactWrapper />)
    
    // Address information
    expect(screen.getByText('Address')).toBeInTheDocument()
    expect(screen.getByText(/123 Rue de la Gastronomie/)).toBeInTheDocument()
    expect(screen.getByText(/75001 Paris, France/)).toBeInTheDocument()
    
    // Phone and email
    expect(screen.getByText('Phone')).toBeInTheDocument()
    expect(screen.getByText('01 42 34 56 78')).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByText('contact@restoh.fr')).toBeInTheDocument()
  })

  test('should show opening hours and FAQ section', () => {
    render(<ContactWrapper />)

    // Opening hours
    expect(screen.getByText('Opening hours')).toBeInTheDocument()
    expect(screen.getByText('Monday - Friday:')).toBeInTheDocument()
    expect(screen.getByText(/11h00 - 14h30/)).toBeInTheDocument()
    
    // FAQ questions
    expect(screen.getByText('How to book a table?')).toBeInTheDocument()
    expect(screen.getByText('Do you offer delivery?')).toBeInTheDocument()
    expect(screen.getByText('Do you have vegetarian options?')).toBeInTheDocument()
    expect(screen.getByText('Can I cancel my order?')).toBeInTheDocument()
  })

  // 2. FORM MANAGEMENT (4 tests)
  test('should update form fields when user types input', async () => {
    const user = userEvent.setup()
    render(<ContactWrapper />)

    // Wait for form to be pre-filled with user data
    await vi.waitFor(() => {
      expect(screen.getByPlaceholderText('Your name')).toHaveValue('Jean Dupont')
    })

    // Get form fields
    const nameField = screen.getByPlaceholderText('Your name')
    const emailField = screen.getByPlaceholderText('your@email.com')
    const phoneField = screen.getByPlaceholderText('0612345678')
    const subjectField = screen.getByPlaceholderText('The subject of your message')
    const messageField = screen.getByPlaceholderText('Your message...')

    // Clear pre-filled fields and type new values
    await user.clear(nameField)
    await user.type(nameField, 'Marie Martin')
    await user.clear(emailField)
    await user.type(emailField, 'marie.martin@email.com')
    await user.clear(phoneField)
    await user.type(phoneField, '9876543210')
    await user.type(subjectField, 'Question about the menu')
    await user.type(messageField, 'J\'aimerais connaître les ingrédients de vos plats.')

    // Check values were updated correctly
    expect(nameField).toHaveValue('Marie Martin')
    expect(emailField).toHaveValue('marie.martin@email.com')
    expect(phoneField).toHaveValue('9876543210')
    expect(subjectField).toHaveValue('Question about the menu')
    expect(messageField).toHaveValue('J\'aimerais connaître les ingrédients de vos plats.')
  })

  test('should change contact reason when user selects different option', async () => {
    const user = userEvent.setup()
    render(<ContactWrapper />)

    // SimpleSelect shows selected option text
    expect(screen.getByText('General inquiry')).toBeInTheDocument()

    // Click to open dropdown
    await user.click(screen.getByText('General inquiry'))

    // Select reservation option
    await user.click(screen.getByText('Reservation'))
    expect(screen.getByText('Reservation')).toBeInTheDocument()

    // Click to open dropdown again
    await user.click(screen.getByText('Reservation'))

    // Select complaint
    await user.click(screen.getByText('Complaint'))
    expect(screen.getByText('Complaint')).toBeInTheDocument()
  })

  test('should display character count for message field', async () => {
    const user = userEvent.setup()
    render(<ContactWrapper />)
    
    const messageField = screen.getByPlaceholderText('Your message...')
    
    // Initially shows 0 characters
    expect(screen.getByText('0 characters (minimum 10)')).toBeInTheDocument()
    
    // Type message and check counter updates
    await user.type(messageField, 'Test message')
    expect(screen.getByText('12 characters (minimum 10)')).toBeInTheDocument()
  })

  test('should reset form after successful submission', async () => {
    const user = userEvent.setup()
    render(<ContactWrapper />)

    // Wait for form to be pre-filled with user data
    await vi.waitFor(() => {
      expect(screen.getByPlaceholderText('Your name')).toHaveValue('Jean Dupont')
    })

    // Fill subject and message (name, email, phone are pre-filled)
    const subjectField = screen.getByPlaceholderText('The subject of your message')
    const messageField = screen.getByPlaceholderText('Your message...')

    await user.type(subjectField, 'Test subject')
    await user.tab()
    await user.type(messageField, 'This is a test message with enough characters')
    await user.tab()

    // Wait for button to be enabled
    const submitButton = screen.getByRole('button', { name: /Send message/i })
    await vi.waitFor(() => {
      expect(submitButton).not.toBeDisabled()
    })

    // Submit form
    await user.click(submitButton)

    // Wait for form to be reset
    // For authenticated users, form is reset to user's data (not empty)
    await vi.waitFor(() => {
      expect(screen.getByPlaceholderText('The subject of your message')).toHaveValue('')
      expect(screen.getByPlaceholderText('Your message...')).toHaveValue('')
    }, { timeout: 3000 })

    // Name, email, phone should be reset to user data
    expect(screen.getByPlaceholderText('Your name')).toHaveValue('Jean Dupont')
    expect(screen.getByPlaceholderText('your@email.com')).toHaveValue('jean@email.com')
    expect(screen.getByPlaceholderText('0612345678')).toHaveValue('0123456789')
    expect(screen.getByText('General inquiry')).toBeInTheDocument() // Reset to default
  })

  // 3. FORM VALIDATION (3 tests)
  test('should prevent form submission when required fields are empty', async () => {
    // Use non-authenticated user for this test
    vi.mocked(useAuth).mockReturnValue({ user: null })

    const user = userEvent.setup()
    render(<ContactWrapper />)

    // Try to submit empty form (HTML5 validation should prevent submission)
    await user.click(screen.getByRole('button', { name: /Send message/i }))

    // createMessage should not be called because HTML5 validation prevents submission
    expect(mockCreateMessage).not.toHaveBeenCalled()

    // The form fields should still be empty (form wasn't submitted)
    expect(screen.getByPlaceholderText('Your name')).toHaveValue('')
    expect(screen.getByPlaceholderText('your@email.com')).toHaveValue('')
  })

  test('should disable submit button when form is invalid', async () => {
    const user = userEvent.setup()
    render(<ContactWrapper />)

    // Wait for form to be pre-filled with user data
    await vi.waitFor(() => {
      expect(screen.getByPlaceholderText('Your name')).toHaveValue('Jean Dupont')
    })

    // Initially, button should be disabled (subject and message are empty)
    const submitButton = screen.getByRole('button', { name: /Send message/i })
    expect(submitButton).toBeDisabled()

    // Fill subject but message too short
    const subjectField = screen.getByPlaceholderText('The subject of your message')
    const messageField = screen.getByPlaceholderText('Your message...')

    await user.type(subjectField, 'Test subject')
    await user.tab()
    await user.type(messageField, 'Court') // Only 5 characters
    await user.tab() // Trigger blur for validation

    // Button should still be disabled because message is too short
    await vi.waitFor(() => {
      expect(submitButton).toBeDisabled()
    })

    // Complete the message to make it valid (clear and retype)
    await user.clear(messageField)
    await user.type(messageField, 'This is a valid message with enough characters')
    await user.tab() // Trigger blur for validation

    // Now button should be enabled
    await vi.waitFor(() => {
      expect(submitButton).not.toBeDisabled()
    })
  })

  test('should disable button when email format is invalid', async () => {
    const user = userEvent.setup()
    render(<ContactWrapper />)

    // Wait for form to be pre-filled with user data
    await vi.waitFor(() => {
      expect(screen.getByPlaceholderText('Your name')).toHaveValue('Jean Dupont')
    })

    const submitButton = screen.getByRole('button', { name: /Send message/i })
    const emailField = screen.getByPlaceholderText('your@email.com')
    const subjectField = screen.getByPlaceholderText('The subject of your message')
    const messageField = screen.getByPlaceholderText('Your message...')

    // Fill subject and message (name is already pre-filled)
    await user.type(subjectField, 'Test subject')
    await user.tab()
    await user.type(messageField, 'Valid message with enough characters')
    await user.tab()

    // Clear email and type invalid format
    await user.clear(emailField)
    await user.type(emailField, 'invalid-email')
    await user.tab() // Trigger blur for validation

    // Button should be disabled because email format is invalid
    await vi.waitFor(() => {
      expect(submitButton).toBeDisabled()
    })

    // Fix email format
    await user.clear(emailField)
    await user.type(emailField, 'jean@email.com')
    await user.tab() // Trigger blur for validation

    // Now button should be enabled
    await vi.waitFor(() => {
      expect(submitButton).not.toBeDisabled()
    })
  })

  // 4. FORM SUBMISSION (3 tests)
  test('should submit form successfully with valid data', async () => {
    const user = userEvent.setup()
    render(<ContactWrapper />)

    // Wait for form to be pre-filled with user data
    await vi.waitFor(() => {
      expect(screen.getByPlaceholderText('Your name')).toHaveValue('Jean Dupont')
    })

    // Name, email, and phone are already pre-filled for authenticated users
    // Only need to fill subject and message
    await user.type(screen.getByPlaceholderText('The subject of your message'), 'Important question')
    await user.type(screen.getByPlaceholderText('Your message...'), 'This is a test message avec suffisamment de caractères')

    // Change contact reason with SimpleSelect
    await user.click(screen.getByText('General inquiry'))
    await user.click(screen.getByText('Reservation'))

    // Submit form
    await user.click(screen.getByRole('button', { name: /Send message/i }))

    // Wait for submission
    await vi.waitFor(() => {
      expect(mockCreateMessage).toHaveBeenCalled()
    }, { timeout: 3000 })

    // Check createMessage was called with correct data
    expect(mockCreateMessage).toHaveBeenCalledWith({
      name: 'Jean Dupont',
      email: 'jean@email.com',
      phone: '0123456789',
      subject: 'Reservation - Important question',
      message: 'This is a test message avec suffisamment de caractères'
    })

    // Check success message for authenticated user
    expect(toast.success).toHaveBeenCalledWith('Message sent successfully! We will respond quickly.')
  })

  test('should show loading state during form submission', async () => {
    const user = userEvent.setup()

    // Mock loading state
    vi.mocked(useContactsStore).mockReturnValue({
      createMessage: mockCreateMessage,
      isLoading: true
    })

    render(<ContactWrapper />)

    // Should show loading button (use more specific query to get submit button)
    const submitButton = screen.getByRole('button', { name: /Sending/i })
    expect(submitButton).toBeDisabled()
    expect(screen.getByText('Sending...')).toBeInTheDocument()

    // Should show loading spinner
    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  test('should handle submission errors gracefully', async () => {
    const user = userEvent.setup()

    // Mock submission failure
    mockCreateMessage.mockResolvedValue({
      success: false,
      error: 'Network error'
    })

    render(<ContactWrapper />)

    // Wait for form to be pre-filled with user data
    await vi.waitFor(() => {
      expect(screen.getByPlaceholderText('Your name')).toHaveValue('Jean Dupont')
    })

    // Name, email, phone are already pre-filled - only fill subject and message
    const subjectField = screen.getByPlaceholderText('The subject of your message')
    const messageField = screen.getByPlaceholderText('Your message...')

    await user.type(subjectField, 'Test subject')
    await user.tab()
    await user.type(messageField, 'Valid message with enough characters')
    await user.tab()

    // Wait for button to be enabled
    const submitButton = screen.getByRole('button', { name: /Send message/i })
    await vi.waitFor(() => {
      expect(submitButton).not.toBeDisabled()
    })

    // Submit form
    await user.click(submitButton)

    // Wait for error handling
    await vi.waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Error sending message. Please try again.')
    }, { timeout: 3000 })

    // Form should not be reset on error - still has pre-filled and typed values
    expect(screen.getByPlaceholderText('Your name')).toHaveValue('Jean Dupont')
    expect(screen.getByPlaceholderText('your@email.com')).toHaveValue('jean@email.com')
    expect(screen.getByPlaceholderText('The subject of your message')).toHaveValue('Test subject')
  })
})