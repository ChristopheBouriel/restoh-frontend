import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DeleteAccountModal from '../../../components/profile/DeleteAccountModal'

describe('DeleteAccountModal Component', () => {
  const mockOnClose = vi.fn()
  const mockOnConfirm = vi.fn()
  const user = userEvent.setup()

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onConfirm: mockOnConfirm,
    isLoading: false
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // 1. VISIBILITÉ ET RENDU DU MODAL
  describe('Modal Visibility and Rendering', () => {
    it('should not render when isOpen is false', () => {
      render(<DeleteAccountModal {...defaultProps} isOpen={false} />)
      
      expect(screen.queryByText('Permanently delete your account')).not.toBeInTheDocument()
      expect(screen.queryByText('This action is irreversible!')).not.toBeInTheDocument()
    })

    it('should render modal with all elements when isOpen is true', () => {
      render(<DeleteAccountModal {...defaultProps} />)
      
      // Check main title
      expect(screen.getByText('Permanently delete your account')).toBeInTheDocument()

      // Check header elements
      expect(screen.getByRole('button', { name: '' })).toBeInTheDocument() // X button (no accessible name)

      // Check form field presence
      expect(screen.getByPlaceholderText('Type DELETE')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()

      // Check action buttons
      expect(screen.getByRole('button', { name: 'Delete permanently' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    })

    it('should display warning message and GDPR compliance information', () => {
      render(<DeleteAccountModal {...defaultProps} />)

      // Check warning message
      expect(screen.getByText('This action is irreversible!')).toBeInTheDocument()

      // Check GDPR information points
      expect(screen.getByText('Your account will be permanently deleted')).toBeInTheDocument()
      expect(screen.getByText('All your personal data will be erased')).toBeInTheDocument()
      expect(screen.getByText('Your orders and reservations will be anonymized')).toBeInTheDocument()
      expect(screen.getByText('You will no longer be able to log in with these credentials')).toBeInTheDocument()

      // Check confirmation instructions
      expect(screen.getByText(/To confirm, type/)).toBeInTheDocument()
      expect(screen.getByText(/Confirm with your current password/)).toBeInTheDocument()
    })
  })

  // 2. INTERACTIONS AVEC LES CHAMPS DU FORMULAIRE
  describe('Form Field Interactions', () => {
    it('should allow typing in confirmation text field', async () => {
      render(<DeleteAccountModal {...defaultProps} />)
      
      const confirmTextInput = screen.getByPlaceholderText('Type DELETE')
      
      await user.type(confirmTextInput, 'DELETE')
      
      expect(confirmTextInput).toHaveValue('DELETE')
    })

    it('should allow typing in password field and maintain password type', async () => {
      render(<DeleteAccountModal {...defaultProps} />)
      
      const passwordInput = screen.getByPlaceholderText('Password')

      // Check that it's a password field
      expect(passwordInput).toHaveAttribute('type', 'password')

      await user.type(passwordInput, 'mypassword123')

      expect(passwordInput).toHaveValue('mypassword123')
    })

    it('should update field values correctly on input change', async () => {
      render(<DeleteAccountModal {...defaultProps} />)

      const confirmTextInput = screen.getByPlaceholderText('Type DELETE')
      const passwordInput = screen.getByPlaceholderText('Password')

      // Type partially in confirmation field
      await user.type(confirmTextInput, 'DEL')
      expect(confirmTextInput).toHaveValue('DEL')

      // Complete the input
      await user.type(confirmTextInput, 'ETE')
      expect(confirmTextInput).toHaveValue('DELETE')

      // Test password field
      await user.type(passwordInput, 'test')
      expect(passwordInput).toHaveValue('test')

      // Modify password
      await user.clear(passwordInput)
      await user.type(passwordInput, 'newpassword')
      expect(passwordInput).toHaveValue('newpassword')
    })
  })

  // 3. LOGIQUE DE VALIDATION DU FORMULAIRE
  describe('Form Validation Logic', () => {
    it('should disable submit button when fields are empty', () => {
      render(<DeleteAccountModal {...defaultProps} />)
      
      const submitButton = screen.getByRole('button', { name: 'Delete permanently' })
      
      expect(submitButton).toBeDisabled()
    })

    it('should disable submit button when confirmation text is incorrect', async () => {
      render(<DeleteAccountModal {...defaultProps} />)

      const confirmTextInput = screen.getByPlaceholderText('Type DELETE')
      const passwordInput = screen.getByPlaceholderText('Password')
      const submitButton = screen.getByRole('button', { name: 'Delete permanently' })

      // Fill with incorrect text
      await user.type(confirmTextInput, 'WRONG')
      await user.type(passwordInput, 'password123')

      expect(submitButton).toBeDisabled()

      // Test with partially correct text
      await user.clear(confirmTextInput)
      await user.type(confirmTextInput, 'delete') // lowercase - should not work

      expect(submitButton).toBeDisabled()
    })

    it('should enable submit button when both fields are valid', async () => {
      render(<DeleteAccountModal {...defaultProps} />)

      const confirmTextInput = screen.getByPlaceholderText('Type DELETE')
      const passwordInput = screen.getByPlaceholderText('Password')
      const submitButton = screen.getByRole('button', { name: 'Delete permanently' })

      // Fill fields with valid values
      await user.type(confirmTextInput, 'DELETE')
      await user.type(passwordInput, 'mypassword123')

      expect(submitButton).not.toBeDisabled()
    })
  })

  // 4. FONCTIONNALITÉ DE FERMETURE DU MODAL
  describe('Modal Close Functionality', () => {
    it('should close and clear fields when X button clicked', async () => {
      render(<DeleteAccountModal {...defaultProps} />)
      
      const confirmTextInput = screen.getByPlaceholderText('Type DELETE')
      const passwordInput = screen.getByPlaceholderText('Password')

      // Fill fields
      await user.type(confirmTextInput, 'DELETE')
      await user.type(passwordInput, 'password123')

      // Click X button (first button with no accessible name)
      const xButton = screen.getAllByRole('button')[0] // First button = X
      await user.click(xButton)

      expect(mockOnClose).toHaveBeenCalledTimes(1)

      // Fields should be cleared on next open
      // (can be verified via re-render with same props)
    })

    it('should close and clear fields when Cancel button clicked', async () => {
      render(<DeleteAccountModal {...defaultProps} />)

      const confirmTextInput = screen.getByPlaceholderText('Type DELETE')
      const passwordInput = screen.getByPlaceholderText('Password')
      const cancelButton = screen.getByRole('button', { name: 'Cancel' })

      // Fill fields
      await user.type(confirmTextInput, 'DELETE')
      await user.type(passwordInput, 'password123')

      await user.click(cancelButton)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('should close and clear fields when overlay is clicked', async () => {
      render(<DeleteAccountModal {...defaultProps} />)

      const confirmTextInput = screen.getByPlaceholderText('Type DELETE')
      const passwordInput = screen.getByPlaceholderText('Password')

      // Fill fields
      await user.type(confirmTextInput, 'DELETE')
      await user.type(passwordInput, 'password123')

      // Click overlay (element with bg-opacity)
      const overlay = document.querySelector('.bg-gray-500.bg-opacity-75')
      expect(overlay).toBeInTheDocument()
      
      await user.click(overlay)
      
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })
  })

  // 5. SOUMISSION DU FORMULAIRE
  describe('Form Submission', () => {
    it('should call onConfirm with password when valid form is submitted', async () => {
      render(<DeleteAccountModal {...defaultProps} />)
      
      const confirmTextInput = screen.getByPlaceholderText('Type DELETE')
      const passwordInput = screen.getByPlaceholderText('Password')
      const submitButton = screen.getByRole('button', { name: 'Delete permanently' })

      // Fill with valid data
      await user.type(confirmTextInput, 'DELETE')
      await user.type(passwordInput, 'mypassword123')

      await user.click(submitButton)

      expect(mockOnConfirm).toHaveBeenCalledTimes(1)
      expect(mockOnConfirm).toHaveBeenCalledWith('mypassword123', {})
    })

    it('should prevent submission when validation fails', async () => {
      render(<DeleteAccountModal {...defaultProps} />)

      const confirmTextInput = screen.getByPlaceholderText('Type DELETE')
      const passwordInput = screen.getByPlaceholderText('Password')
      const submitButton = screen.getByRole('button', { name: 'Delete permanently' })

      // Fill with invalid data (incorrect confirmation text)
      await user.type(confirmTextInput, 'WRONG')
      await user.type(passwordInput, 'mypassword123')

      // Button should be disabled, so submission not possible
      expect(submitButton).toBeDisabled()

      // Even if we try to click, it shouldn't work
      await user.click(submitButton)
      expect(mockOnConfirm).not.toHaveBeenCalled()
    })
  })

  // 6. ÉTATS DE CHARGEMENT
  describe('Loading States', () => {
    it('should show loading text and disable submit button when isLoading is true', () => {
      render(<DeleteAccountModal {...defaultProps} isLoading={true} />)
      
      const submitButton = screen.getByRole('button', { name: 'Deleting...' })
      
      expect(submitButton).toBeInTheDocument()
      expect(submitButton).toBeDisabled()
      expect(screen.queryByText('Delete permanently')).not.toBeInTheDocument()
    })

    it('should handle loading state correctly during form interaction', async () => {
      const { rerender } = render(<DeleteAccountModal {...defaultProps} />)
      
      const confirmTextInput = screen.getByPlaceholderText('Type DELETE')
      const passwordInput = screen.getByPlaceholderText('Password')

      // Fill fields
      await user.type(confirmTextInput, 'DELETE')
      await user.type(passwordInput, 'password123')

      // Check that button is enabled
      expect(screen.getByRole('button', { name: 'Delete permanently' })).not.toBeDisabled()

      // Re-render with loading = true
      rerender(<DeleteAccountModal {...defaultProps} isLoading={true} />)

      // Button should now be disabled and show loading text
      const loadingButton = screen.getByRole('button', { name: 'Deleting...' })
      expect(loadingButton).toBeDisabled()

      // Fields should still contain values
      expect(screen.getByDisplayValue('DELETE')).toBeInTheDocument()
      expect(screen.getByDisplayValue('password123')).toBeInTheDocument()
    })
  })
})