import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Profile from '../../../pages/profile/Profile'
import { useAuth } from '../../../hooks/useAuth'
import { toast } from 'react-hot-toast'

// Mocks
vi.mock('../../../hooks/useAuth')
vi.mock('react-hot-toast')
vi.mock('../../../components/profile/DeleteAccountModal', () => ({
  default: ({ isOpen, onClose, onConfirm }) => 
    isOpen ? (
      <div data-testid="delete-account-modal">
        <button onClick={() => onConfirm('password123')}>Confirm deletion</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    ) : null
}))

describe('Profile Component', () => {
  const mockUpdateProfile = vi.fn()
  const mockChangePassword = vi.fn()
  const mockDeleteAccount = vi.fn()
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
      deleteAccount: mockDeleteAccount,
      isLoading: false
    })
    vi.mocked(toast.success).mockImplementation(() => {})
    vi.mocked(toast.error).mockImplementation(() => {})
  })

  // 1. RENDU INITIAL ET NAVIGATION
  describe('Initial Rendering and Navigation', () => {
    it('should render profile header and personal info tab by default', () => {
      render(<Profile />)
      
      // Check le header
      expect(screen.getByText('My Profile')).toBeInTheDocument()
      expect(screen.getByText('Manage your personal information and preferences')).toBeInTheDocument()
      
      // Check que l'onglet personnel est actif par défaut (utiliser role button pour spécificité)
      expect(screen.getByRole('button', { name: /Personal information/ })).toBeInTheDocument()
      expect(screen.getByText('Full name')).toBeInTheDocument()
    })

    it('should display user information in read-only mode initially', () => {
      render(<Profile />)
      
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
      render(<Profile />)
      
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
      render(<Profile />)
      
      expect(screen.getByRole('button', { name: /Personal information/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Security/ })).toBeInTheDocument()
    })
  })

  // 2. ONGLET INFORMATIONS PERSONNELLES - MODE AFFICHAGE
  describe('Personal Information Tab - Display Mode', () => {
    it('should display all user profile fields', () => {
      render(<Profile />)

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
      render(<Profile />)

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
      render(<Profile />)
      
      const editButton = screen.getByRole('button', { name: 'Edit' })
      expect(editButton).toBeInTheDocument()
      expect(editButton).not.toBeDisabled()
    })
  })

  // 3. ONGLET INFORMATIONS PERSONNELLES - MODE ÉDITION
  describe('Personal Information Tab - Edit Mode', () => {
    it('should enable editing when Edit button is clicked', async () => {
      render(<Profile />)
      
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
      render(<Profile />)
      
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
      render(<Profile />)
      
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
      render(<Profile />)
      
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
      render(<Profile />)
      
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
      render(<Profile />)
      
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
      render(<Profile />)
      
      // Aller à l'onglet sécurité
      await user.click(screen.getByRole('button', { name: /Security/ }))
      
      expect(document.querySelector('input[name="currentPassword"]')).toBeInTheDocument()
      expect(document.querySelector('input[name="newPassword"]')).toBeInTheDocument()
      expect(document.querySelector('input[name="confirmPassword"]')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Change password/ })).toBeInTheDocument()
    })

    it('should validate password requirements and show appropriate error messages', async () => {
      render(<Profile />)
      
      await user.click(screen.getByRole('button', { name: /Security/ }))
      
      const changePasswordButton = screen.getByRole('button', { name: /Change password/ })
      
      // Test 1: Champs vides - utiliser fireEvent pour bypasser la validation HTML5
      const form = document.querySelector('form')
      fireEvent.submit(form)
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Current password is required')
      })
      
      // Test 2: New mot de passe manquant
      vi.clearAllMocks()
      const currentPasswordInput = document.querySelector('input[name="currentPassword"]')
      await user.type(currentPasswordInput, 'current123')
      fireEvent.submit(form)
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('New password is required')
      })
      
      // Test 3: New mot de passe trop court
      vi.clearAllMocks()
      const newPasswordInput = document.querySelector('input[name="newPassword"]')
      await user.type(newPasswordInput, '123')
      fireEvent.submit(form)
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('New password must be at least 6 characters')
      })
      
      // Test 4: Mots de passe ne correspondent pas
      vi.clearAllMocks()
      await user.clear(newPasswordInput)
      await user.type(newPasswordInput, 'newpass123')
      const confirmPasswordInput = document.querySelector('input[name="confirmPassword"]')
      await user.type(confirmPasswordInput, 'different123')
      fireEvent.submit(form)
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Passwords do not match')
      })
      
      // Test 5: New mot de passe identique à l'ancien
      vi.clearAllMocks()
      await user.clear(confirmPasswordInput)
      await user.type(confirmPasswordInput, 'current123')
      await user.clear(newPasswordInput)
      await user.type(newPasswordInput, 'current123')
      fireEvent.submit(form)
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('New password must be different from the old one')
      })
    })

    it('should call changePassword function on valid form submission', async () => {
      mockChangePassword.mockResolvedValue({ success: true })
      render(<Profile />)
      
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
      render(<Profile />)
      
      await user.click(screen.getByRole('button', { name: /Security/ }))
      
      expect(screen.getByText('Danger zone')).toBeInTheDocument()
      expect(screen.getByText('This action is irreversible and will permanently delete your account.')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Delete my account' })).toBeInTheDocument()
    })

    it('should open DeleteAccountModal when delete button is clicked', async () => {
      render(<Profile />)
      
      await user.click(screen.getByRole('button', { name: /Security/ }))
      
      const deleteButton = screen.getByRole('button', { name: 'Delete my account' })
      await user.click(deleteButton)
      
      // Check que le modal est ouvert
      expect(screen.getByTestId('delete-account-modal')).toBeInTheDocument()
      
      // Tester la confirmation de suppression
      const confirmButton = screen.getByText('Confirm deletion')
      await user.click(confirmButton)
      
      expect(mockDeleteAccount).toHaveBeenCalledWith('password123')
    })
  })

  // 7. GESTION D'ERREURS ET CAS LIMITES
  describe('Error Handling and Edge Cases', () => {
    it('should handle changePassword errors and display appropriate messages', async () => {
      mockChangePassword.mockResolvedValue({ 
        success: false, 
        error: 'Current password is incorrect' 
      })
      render(<Profile />)
      
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
        deleteAccount: mockDeleteAccount,
        isLoading: true
      })
      
      render(<Profile />)
      
      // Enable edit mode to see save button
      const editButton = screen.getByRole('button', { name: 'Edit' })

      // Edit button should be available even when loading
      expect(editButton).not.toBeDisabled()
    })
  })
})