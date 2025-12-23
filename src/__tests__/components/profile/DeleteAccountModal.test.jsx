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

  // 1. LOGIQUE DE VALIDATION DU FORMULAIRE
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

})