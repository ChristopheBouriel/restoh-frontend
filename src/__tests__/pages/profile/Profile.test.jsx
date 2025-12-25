import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import Profile from '../../../pages/profile/Profile'
import { useAuth } from '../../../hooks/useAuth'
import { toast } from 'react-hot-toast'
import * as emailApi from '../../../api/emailApi'
import * as authApi from '../../../api/authApi'

// Mocks
vi.mock('../../../hooks/useAuth')
vi.mock('react-hot-toast')
vi.mock('../../../api/emailApi')
vi.mock('../../../api/authApi', () => ({
  deleteAccount: vi.fn()
}))
vi.mock('../../../store/authStore', () => ({
  default: vi.fn((selector) => {
    const state = { clearAuth: vi.fn() }
    return selector ? selector(state) : state
  })
}))
vi.mock('../../../components/profile/DeleteAccountModal', () => ({
  default: ({ isOpen, onClose, onConfirm }) =>
    isOpen ? (
      <div data-testid="delete-account-modal">
        <button onClick={() => onConfirm('password123', {})}>Confirm deletion</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    ) : null
}))

describe('Profile Component', () => {
  const mockUpdateProfile = vi.fn()
  const mockChangePassword = vi.fn()
  const user = userEvent.setup()

  const mockUser = {
    id: '1',
    name: 'Jean Dupont',
    email: 'jean@example.com',
    phone: '0123456789',
    address: {
      street: '123 Rue de la République',
      city: 'Paris',
      zipCode: '75001',
      state: 'Île-de-France'
    },
    notifications: {
      orderConfirmations: true,
      reservationReminders: true,
      newsletter: false,
      promotions: false
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      updateProfile: mockUpdateProfile,
      changePassword: mockChangePassword,
      isLoading: false
    })
    vi.mocked(toast.success).mockImplementation(() => {})
    vi.mocked(toast.error).mockImplementation(() => {})
  })

  // 1. RENDU INITIAL ET NAVIGATION
  describe('Initial Rendering and Navigation', () => {
    it('should render profile header and personal info tab by default', () => {
      render(<MemoryRouter><Profile /></MemoryRouter>)
      
      // Check le header
      expect(screen.getByText('My Profile')).toBeInTheDocument()
      expect(screen.getByText('Manage your personal information and preferences')).toBeInTheDocument()
      
      // Check que l'onglet personnel est actif par défaut (utiliser role button pour spécificité)
      expect(screen.getByRole('button', { name: /Personal information/ })).toBeInTheDocument()
      expect(screen.getByText('Full name')).toBeInTheDocument()
    })

    it('should display user information in read-only mode initially', () => {
      render(<MemoryRouter><Profile /></MemoryRouter>)
      
      // Check que les champs sont en lecture seule
      const nameInput = screen.getByDisplayValue('Jean Dupont')
      const emailInput = screen.getByDisplayValue('jean@example.com')
      const phoneInput = screen.getByDisplayValue('0123456789')
      
      expect(nameInput).toBeDisabled()
      expect(emailInput).toBeDisabled()
      expect(phoneInput).toBeDisabled()
      
      // Check la présence du bouton Edit
      expect(screen.getByText('Edit')).toBeInTheDocument()
    })

    it('should switch between Personal and Security tabs when clicked', async () => {
      render(<MemoryRouter><Profile /></MemoryRouter>)
      
      // Initialement sur l'onglet personnel
      expect(screen.getByText('Full name')).toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: 'Change password' })).not.toBeInTheDocument()
      
      // Click sur l'onglet Security
      const securityTab = screen.getByRole('button', { name: /Security/ })
      await user.click(securityTab)
      
      // Check que le contenu de l'onglet sécurité est affiché
      expect(screen.getByRole('heading', { name: 'Change password' })).toBeInTheDocument()
      expect(document.querySelector('input[name="currentPassword"]')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Delete my account' })).toBeInTheDocument()
      expect(screen.queryByText('Full name')).not.toBeInTheDocument()
      
      // Revenir à l'onglet personnel
      const personalTab = screen.getByRole('button', { name: /Personal information/ })
      await user.click(personalTab)
      
      expect(screen.getByText('Full name')).toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: 'Change password' })).not.toBeInTheDocument()
    })

    it('should show both tab buttons with correct labels and icons', () => {
      render(<MemoryRouter><Profile /></MemoryRouter>)

      expect(screen.getByRole('button', { name: /Personal information/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Security/ })).toBeInTheDocument()
    })
  })

  // 2. EMAIL VERIFICATION BANNER
  describe('Email Verification Banner', () => {
    it('should show verification banner when user email is not verified', () => {
      const unverifiedUser = {
        ...mockUser,
        isEmailVerified: false
      }

      vi.mocked(useAuth).mockReturnValue({
        user: unverifiedUser,
        updateProfile: mockUpdateProfile,
        changePassword: mockChangePassword,
        isLoading: false
      })

      render(<MemoryRouter><Profile /></MemoryRouter>)

      expect(screen.getByText('Email Not Verified')).toBeInTheDocument()
      expect(screen.getByText(/Your email address has not been verified yet/)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Resend Verification Email' })).toBeInTheDocument()
    })

    it('should NOT show verification banner when user email is verified', () => {
      const verifiedUser = {
        ...mockUser,
        isEmailVerified: true
      }

      vi.mocked(useAuth).mockReturnValue({
        user: verifiedUser,
        updateProfile: mockUpdateProfile,
        changePassword: mockChangePassword,
        isLoading: false
      })

      render(<MemoryRouter><Profile /></MemoryRouter>)

      expect(screen.queryByText('Email Not Verified')).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Resend Verification Email' })).not.toBeInTheDocument()
    })

    it('should NOT show banner when user is null', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        updateProfile: mockUpdateProfile,
        changePassword: mockChangePassword,
        isLoading: false
      })

      render(<MemoryRouter><Profile /></MemoryRouter>)

      expect(screen.queryByText('Email Not Verified')).not.toBeInTheDocument()
    })

    it('should call resendVerification API when clicking resend button', async () => {
      const unverifiedUser = {
        ...mockUser,
        isEmailVerified: false
      }

      vi.mocked(useAuth).mockReturnValue({
        user: unverifiedUser,
        updateProfile: mockUpdateProfile,
        changePassword: mockChangePassword,
        isLoading: false
      })

      vi.mocked(emailApi.resendVerification).mockResolvedValue({ success: true })

      render(<MemoryRouter><Profile /></MemoryRouter>)

      const resendButton = screen.getByRole('button', { name: 'Resend Verification Email' })
      await user.click(resendButton)

      await waitFor(() => {
        expect(emailApi.resendVerification).toHaveBeenCalledWith(unverifiedUser.email)
      })
    })

    it('should show success toast on successful resend', async () => {
      const unverifiedUser = {
        ...mockUser,
        isEmailVerified: false
      }

      vi.mocked(useAuth).mockReturnValue({
        user: unverifiedUser,
        updateProfile: mockUpdateProfile,
        changePassword: mockChangePassword,
        isLoading: false
      })

      vi.mocked(emailApi.resendVerification).mockResolvedValue({
        success: true,
        message: 'Verification email sent'
      })

      render(<MemoryRouter><Profile /></MemoryRouter>)

      const resendButton = screen.getByRole('button', { name: 'Resend Verification Email' })
      await user.click(resendButton)

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Verification email sent! Check your inbox.')
      })
    })

    it('should show error toast on failed resend with error message', async () => {
      const unverifiedUser = {
        ...mockUser,
        isEmailVerified: false
      }

      vi.mocked(useAuth).mockReturnValue({
        user: unverifiedUser,
        updateProfile: mockUpdateProfile,
        changePassword: mockChangePassword,
        isLoading: false
      })

      vi.mocked(emailApi.resendVerification).mockResolvedValue({
        success: false,
        error: 'Rate limit exceeded'
      })

      render(<MemoryRouter><Profile /></MemoryRouter>)

      const resendButton = screen.getByRole('button', { name: 'Resend Verification Email' })
      await user.click(resendButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Rate limit exceeded')
      })
    })

    it('should show error toast on API error', async () => {
      const unverifiedUser = {
        ...mockUser,
        isEmailVerified: false
      }

      vi.mocked(useAuth).mockReturnValue({
        user: unverifiedUser,
        updateProfile: mockUpdateProfile,
        changePassword: mockChangePassword,
        isLoading: false
      })

      vi.mocked(emailApi.resendVerification).mockRejectedValue(new Error('Network error'))

      render(<MemoryRouter><Profile /></MemoryRouter>)

      const resendButton = screen.getByRole('button', { name: 'Resend Verification Email' })
      await user.click(resendButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to resend verification email')
      })
    })

    it('should show loading state when resending verification email', async () => {
      const unverifiedUser = {
        ...mockUser,
        isEmailVerified: false
      }

      vi.mocked(useAuth).mockReturnValue({
        user: unverifiedUser,
        updateProfile: mockUpdateProfile,
        changePassword: mockChangePassword,
        isLoading: false
      })

      // Mock slow API response
      vi.mocked(emailApi.resendVerification).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100))
      )

      render(<MemoryRouter><Profile /></MemoryRouter>)

      const resendButton = screen.getByRole('button', { name: 'Resend Verification Email' })
      await user.click(resendButton)

      // Should show loading text
      expect(screen.getByText('Sending...')).toBeInTheDocument()
      expect(resendButton).toBeDisabled()

      // Wait for completion
      await waitFor(() => {
        expect(screen.queryByText('Sending...')).not.toBeInTheDocument()
      })
    })
  })

  // 3. ONGLET INFORMATIONS PERSONNELLES - MODE AFFICHAGE
  describe('Personal Information Tab - Display Mode', () => {
    it('should display all user profile fields', () => {
      render(<MemoryRouter><Profile /></MemoryRouter>)

      // Check tous les champs du profil
      expect(screen.getByDisplayValue('Jean Dupont')).toBeInTheDocument()
      expect(screen.getByDisplayValue('jean@example.com')).toBeInTheDocument()
      expect(screen.getByDisplayValue('0123456789')).toBeInTheDocument()
      expect(screen.getByDisplayValue('123 Rue de la République')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Paris')).toBeInTheDocument()
      expect(screen.getByDisplayValue('75001')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Île-de-France')).toBeInTheDocument()
    })

    it('should show notification preferences as checkboxes', () => {
      render(<MemoryRouter><Profile /></MemoryRouter>)

      // Check les checkboxes de notification (only newsletter and promotions)
      const newsletter = document.querySelector('input[name="newsletter"]')
      const promotions = document.querySelector('input[name="promotions"]')

      expect(newsletter).not.toBeChecked()
      expect(promotions).not.toBeChecked()

      // Check qu'elles sont désactivées en mode lecture
      expect(newsletter).toBeDisabled()
      expect(promotions).toBeDisabled()
    })

    it('should show Edit button when not editing', () => {
      render(<MemoryRouter><Profile /></MemoryRouter>)
      
      const editButton = screen.getByRole('button', { name: 'Edit' })
      expect(editButton).toBeInTheDocument()
      expect(editButton).not.toBeDisabled()
    })
  })

  // 3. ONGLET INFORMATIONS PERSONNELLES - MODE ÉDITION
  describe('Personal Information Tab - Edit Mode', () => {
    it('should enable editing when Edit button is clicked', async () => {
      render(<MemoryRouter><Profile /></MemoryRouter>)
      
      const editButton = screen.getByRole('button', { name: 'Edit' })
      await user.click(editButton)
      
      // Check que les champs sont maintenant éditables
      const nameInput = screen.getByDisplayValue('Jean Dupont')
      const emailInput = screen.getByDisplayValue('jean@example.com')
      const phoneInput = screen.getByDisplayValue('0123456789')
      
      expect(nameInput).not.toBeDisabled()
      expect(emailInput).not.toBeDisabled()
      expect(phoneInput).not.toBeDisabled()
      
      // Check que les boutons ont changé
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument()
    })

    it('should allow typing in all profile input fields when editing', async () => {
      render(<MemoryRouter><Profile /></MemoryRouter>)
      
      // Activer le mode édition
      await user.click(screen.getByRole('button', { name: 'Edit' }))
      
      // Tester la modification de différents champs
      const nameInput = screen.getByDisplayValue('Jean Dupont')
      await user.clear(nameInput)
      await user.type(nameInput, 'Pierre Martin')
      
      const phoneInput = screen.getByDisplayValue('0123456789')
      await user.clear(phoneInput)
      await user.type(phoneInput, '0987654321')
      
      expect(nameInput).toHaveValue('Pierre Martin')
      expect(phoneInput).toHaveValue('0987654321')
    })

    it('should allow toggling notification checkboxes when editing', async () => {
      render(<MemoryRouter><Profile /></MemoryRouter>)
      
      // Activer le mode édition
      await user.click(screen.getByRole('button', { name: 'Edit' }))
      
      // Tester les checkboxes
      const newsletter = document.querySelector('input[name="newsletter"]')
      const promotions = document.querySelector('input[name="promotions"]')
      
      expect(newsletter).not.toBeChecked()
      expect(promotions).not.toBeChecked()
      expect(newsletter).not.toBeDisabled()
      expect(promotions).not.toBeDisabled()
      
      await user.click(newsletter)
      await user.click(promotions)
      
      expect(newsletter).toBeChecked()
      expect(promotions).toBeChecked()
    })

    it('should show Save and Cancel buttons when editing and handle cancel correctly', async () => {
      render(<MemoryRouter><Profile /></MemoryRouter>)
      
      await user.click(screen.getByRole('button', { name: 'Edit' }))
      
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
      
      // Tester le bouton Cancel
      await user.click(screen.getByRole('button', { name: 'Cancel' }))
      
      // Check retour au mode lecture
      expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument()
    })
  })

  // 4. FONCTIONNALITÉ DE SAUVEGARDE
  describe('Profile Save Functionality', () => {
    it('should call updateProfile and exit edit mode on successful save', async () => {
      mockUpdateProfile.mockResolvedValue(true)
      render(<MemoryRouter><Profile /></MemoryRouter>)
      
      // Activer le mode édition et modifier des données
      await user.click(screen.getByRole('button', { name: 'Edit' }))
      
      const nameInput = screen.getByDisplayValue('Jean Dupont')
      await user.clear(nameInput)
      await user.type(nameInput, 'Pierre Martin')
      
      // Edit une notification
      const newsletter = document.querySelector('input[name="newsletter"]')
      await user.click(newsletter)
      
      // Save
      const saveButton = screen.getByRole('button', { name: 'Save' })
      await user.click(saveButton)
      
      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalledWith({
          name: 'Pierre Martin',
          email: 'jean@example.com',
          phone: '0123456789',
          address: {
            street: '123 Rue de la République',
            city: 'Paris',
            zipCode: '75001',
            state: 'Île-de-France'
          },
          notifications: {
            newsletter: true,
            promotions: false
          }
        })
      })
      
      // Check que le mode édition est quitté
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument()
      })
    })

    it('should handle save errors gracefully', async () => {
      mockUpdateProfile.mockResolvedValue(false)
      render(<MemoryRouter><Profile /></MemoryRouter>)
      
      await user.click(screen.getByRole('button', { name: 'Edit' }))
      await user.click(screen.getByRole('button', { name: 'Save' }))
      
      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalled()
      })
      
      // Check que le mode édition reste actif en cas d'erreur
      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument()
    })
  })

  // 5. ONGLET SÉCURITÉ - CHANGEMENT MOT DE PASSE
  describe('Security Tab - Password Change', () => {
    it('should render password change form with 3 fields', async () => {
      render(<MemoryRouter><Profile /></MemoryRouter>)
      
      // Aller à l'onglet sécurité
      await user.click(screen.getByRole('button', { name: /Security/ }))
      
      expect(document.querySelector('input[name="currentPassword"]')).toBeInTheDocument()
      expect(document.querySelector('input[name="newPassword"]')).toBeInTheDocument()
      expect(document.querySelector('input[name="confirmPassword"]')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Change password/ })).toBeInTheDocument()
    })

    it('should validate password requirements and show appropriate error messages', async () => {
      render(<MemoryRouter><Profile /></MemoryRouter>)

      await user.click(screen.getByRole('button', { name: /Security/ }))

      const changePasswordButton = screen.getByRole('button', { name: /Change password/ })

      // Test 1: Champs vides - React Hook Form shows inline errors
      await user.click(changePasswordButton)

      await waitFor(() => {
        expect(screen.getByText('Current password is required')).toBeInTheDocument()
      })

      // Test 2: Fill current password, but new password missing
      const currentPasswordInput = document.querySelector('input[name="currentPassword"]')
      await user.type(currentPasswordInput, 'current123')
      await user.click(changePasswordButton)

      await waitFor(() => {
        expect(screen.getByText('Password is required')).toBeInTheDocument()
      })

      // Test 3: New mot de passe trop court
      const newPasswordInput = document.querySelector('input[name="newPassword"]')
      await user.type(newPasswordInput, '123')
      await user.tab() // trigger onBlur validation

      await waitFor(() => {
        expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument()
      })

      // Test 4: Mots de passe ne correspondent pas
      await user.clear(newPasswordInput)
      await user.type(newPasswordInput, 'newpass123')
      const confirmPasswordInput = document.querySelector('input[name="confirmPassword"]')
      await user.type(confirmPasswordInput, 'different123')
      await user.click(changePasswordButton)

      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
      })
    })

    it('should call changePassword function on valid form submission', async () => {
      mockChangePassword.mockResolvedValue({ success: true })
      render(<MemoryRouter><Profile /></MemoryRouter>)
      
      await user.click(screen.getByRole('button', { name: /Security/ }))
      
      // Fill le formulaire avec des données valides
      await user.type(document.querySelector('input[name="currentPassword"]'), 'current123')
      await user.type(document.querySelector('input[name="newPassword"]'), 'newpass123')
      await user.type(document.querySelector('input[name="confirmPassword"]'), 'newpass123')
      
      await user.click(screen.getByRole('button', { name: /Change password/ }))
      
      await waitFor(() => {
        expect(mockChangePassword).toHaveBeenCalledWith('current123', 'newpass123')
      })
      
      expect(toast.success).toHaveBeenCalledWith('Password changed successfully')
    })
  })

  // 6. ONGLET SÉCURITÉ - SUPPRESSION COMPTE
  describe('Security Tab - Account Deletion', () => {
    it('should show danger zone with delete account button', async () => {
      render(<MemoryRouter><Profile /></MemoryRouter>)
      
      await user.click(screen.getByRole('button', { name: /Security/ }))
      
      expect(screen.getByText('Danger zone')).toBeInTheDocument()
      expect(screen.getByText('This action is irreversible and will permanently delete your account.')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Delete my account' })).toBeInTheDocument()
    })

    it('should open DeleteAccountModal when delete button is clicked', async () => {
      // Mock the authApi.deleteAccount to return success
      vi.mocked(authApi.deleteAccount).mockResolvedValue({ success: true })

      render(<MemoryRouter><Profile /></MemoryRouter>)

      await user.click(screen.getByRole('button', { name: /Security/ }))

      const deleteButton = screen.getByRole('button', { name: 'Delete my account' })
      await user.click(deleteButton)

      // Check que le modal est ouvert
      expect(screen.getByTestId('delete-account-modal')).toBeInTheDocument()

      // Tester la confirmation de suppression
      const confirmButton = screen.getByText('Confirm deletion')
      await user.click(confirmButton)

      await waitFor(() => {
        expect(authApi.deleteAccount).toHaveBeenCalledWith('password123', {})
      })
    })
  })

  // 7. GESTION D'ERREURS ET CAS LIMITES
  describe('Error Handling and Edge Cases', () => {
    it('should handle changePassword errors and display appropriate messages', async () => {
      mockChangePassword.mockResolvedValue({ 
        success: false, 
        error: 'Current password is incorrect' 
      })
      render(<MemoryRouter><Profile /></MemoryRouter>)
      
      await user.click(screen.getByRole('button', { name: /Security/ }))
      
      // Fill et soumettre le formulaire
      await user.type(document.querySelector('input[name="currentPassword"]'), 'wrong123')
      await user.type(document.querySelector('input[name="newPassword"]'), 'newpass123')
      await user.type(document.querySelector('input[name="confirmPassword"]'), 'newpass123')
      
      await user.click(screen.getByRole('button', { name: /Change password/ }))
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Current password is incorrect')
      })
    })

    it('should handle loading states correctly', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: mockUser,
        updateProfile: mockUpdateProfile,
        changePassword: mockChangePassword,
        isLoading: true
      })
      
      render(<MemoryRouter><Profile /></MemoryRouter>)
      
      // Enable edit mode to see save button
      const editButton = screen.getByRole('button', { name: 'Edit' })

      // Edit button should be available even when loading
      expect(editButton).not.toBeDisabled()
    })
  })
})