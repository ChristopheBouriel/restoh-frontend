import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, test, expect, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import Contact from '../../../pages/contact/Contact'
import useContactsStore from '../../../store/contactsStore'
import { toast } from 'react-hot-toast'

// Mock external dependencies
vi.mock('../../../store/contactsStore')
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
    expect(screen.getByText('Monday - Friday')).toBeInTheDocument()
    expect(screen.getByText(/11h30 - 14h30/)).toBeInTheDocument()
    
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
    
    // Get form fields
    const nameField = screen.getByPlaceholderText('Your name')
    const emailField = screen.getByPlaceholderText('your@email.com')
    const phoneField = screen.getByPlaceholderText('01 23 45 67 89')
    const subjectField = screen.getByPlaceholderText('The subject of your message')
    const messageField = screen.getByPlaceholderText('Your message...')
    
    // Type in fields
    await user.type(nameField, 'Jean Dupont')
    await user.type(emailField, 'jean.dupont@email.com')
    await user.type(phoneField, '0123456789')
    await user.type(subjectField, 'Question about the menu')
    await user.type(messageField, 'J\'aimerais connaître les ingrédients de vos plats.')
    
    // Check values
    expect(nameField).toHaveValue('Jean Dupont')
    expect(emailField).toHaveValue('jean.dupont@email.com')
    expect(phoneField).toHaveValue('0123456789')
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
    
    // Fill form with valid data
    await user.type(screen.getByPlaceholderText('Your name'), 'Jean Dupont')
    await user.type(screen.getByPlaceholderText('your@email.com'), 'jean@email.com')
    await user.type(screen.getByPlaceholderText('The subject of your message'), 'Test subject')
    await user.type(screen.getByPlaceholderText('Your message...'), 'This is a test message with enough characters')
    
    // Submit form
    await user.click(screen.getByRole('button', { name: /Send message/i }))
    
    // Wait for form to be reset
    await vi.waitFor(() => {
      expect(screen.getByPlaceholderText('Your name')).toHaveValue('')
    }, { timeout: 3000 })
    
    expect(screen.getByPlaceholderText('your@email.com')).toHaveValue('')
    expect(screen.getByPlaceholderText('The subject of your message')).toHaveValue('')
    expect(screen.getByPlaceholderText('Your message...')).toHaveValue('')
    expect(screen.getByText('General inquiry')).toBeInTheDocument() // Reset to default
  })

  // 3. FORM VALIDATION (3 tests)
  test('should prevent form submission when required fields are empty', async () => {
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
    
    // Initially, button should be disabled (empty form)
    const submitButton = screen.getByRole('button', { name: /Send message/i })
    expect(submitButton).toBeDisabled()
    
    // Fill form with valid data but message too short
    await user.type(screen.getByPlaceholderText('Your name'), 'Jean Dupont')
    await user.type(screen.getByPlaceholderText('your@email.com'), 'jean@email.com')
    await user.type(screen.getByPlaceholderText('The subject of your message'), 'Test subject')
    await user.type(screen.getByPlaceholderText('Your message...'), 'Court') // Only 5 characters
    
    // Button should still be disabled because message is too short
    expect(submitButton).toBeDisabled()
    
    // Complete the message to make it valid
    await user.type(screen.getByPlaceholderText('Your message...'), ' message valide')
    
    // Now button should be enabled
    expect(submitButton).not.toBeDisabled()
  })

  test('should disable button when email format is invalid', async () => {
    const user = userEvent.setup()
    render(<ContactWrapper />)
    
    const submitButton = screen.getByRole('button', { name: /Send message/i })
    
    // Fill form with invalid email format
    await user.type(screen.getByPlaceholderText('Your name'), 'Jean Dupont')
    await user.type(screen.getByPlaceholderText('your@email.com'), 'invalid-email')
    await user.type(screen.getByPlaceholderText('The subject of your message'), 'Test subject')
    await user.type(screen.getByPlaceholderText('Your message...'), 'Valid message with enough characters')
    
    // Button should be disabled because email format is invalid
    expect(submitButton).toBeDisabled()
    
    // Fix email format
    await user.clear(screen.getByPlaceholderText('your@email.com'))
    await user.type(screen.getByPlaceholderText('your@email.com'), 'jean@email.com')
    
    // Now button should be enabled
    expect(submitButton).not.toBeDisabled()
  })

  // 4. FORM SUBMISSION (3 tests)
  test('should submit form successfully with valid data', async () => {
    const user = userEvent.setup()
    render(<ContactWrapper />)
    
    // Fill form with valid data
    await user.type(screen.getByPlaceholderText('Your name'), 'Jean Dupont')
    await user.type(screen.getByPlaceholderText('your@email.com'), 'jean@email.com')
    await user.type(screen.getByPlaceholderText('01 23 45 67 89'), '0123456789')
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
    
    // Check success message
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
    
    // Fill form with valid data
    await user.type(screen.getByPlaceholderText('Your name'), 'Jean Dupont')
    await user.type(screen.getByPlaceholderText('your@email.com'), 'jean@email.com')
    await user.type(screen.getByPlaceholderText('The subject of your message'), 'Test subject')
    await user.type(screen.getByPlaceholderText('Your message...'), 'Valid message with enough characters')
    
    // Submit form
    await user.click(screen.getByRole('button', { name: /Send message/i }))
    
    // Wait for error handling
    await vi.waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Error sending message. Please try again.')
    }, { timeout: 3000 })
    
    // Form should not be reset on error
    expect(screen.getByPlaceholderText('Your name')).toHaveValue('Jean Dupont')
    expect(screen.getByPlaceholderText('your@email.com')).toHaveValue('jean@email.com')
  })
})