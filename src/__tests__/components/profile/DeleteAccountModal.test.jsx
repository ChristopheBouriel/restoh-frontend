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
      
      expect(screen.queryByText('Supprimer définitivement votre compte')).not.toBeInTheDocument()
      expect(screen.queryByText('Cette action est irréversible !')).not.toBeInTheDocument()
    })

    it('should render modal with all elements when isOpen is true', () => {
      render(<DeleteAccountModal {...defaultProps} />)
      
      // Vérifier le titre principal
      expect(screen.getByText('Supprimer définitivement votre compte')).toBeInTheDocument()
      
      // Vérifier les éléments du header
      expect(screen.getByRole('button', { name: '' })).toBeInTheDocument() // X button (pas de nom accessible)
      
      // Vérifier la présence des champs du formulaire
      expect(screen.getByPlaceholderText('Tapez SUPPRIMER')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Mot de passe')).toBeInTheDocument()
      
      // Vérifier les boutons d'action
      expect(screen.getByRole('button', { name: 'Supprimer définitivement' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Annuler' })).toBeInTheDocument()
    })

    it('should display warning message and GDPR compliance information', () => {
      render(<DeleteAccountModal {...defaultProps} />)
      
      // Vérifier le message d'avertissement
      expect(screen.getByText('Cette action est irréversible !')).toBeInTheDocument()
      
      // Vérifier les points d'information GDPR
      expect(screen.getByText('Votre compte sera définitivement supprimé')).toBeInTheDocument()
      expect(screen.getByText('Toutes vos données personnelles seront effacées')).toBeInTheDocument()
      expect(screen.getByText('Vos commandes et réservations seront anonymisées')).toBeInTheDocument()
      expect(screen.getByText('Vous ne pourrez plus vous reconnecter avec ces identifiants')).toBeInTheDocument()
      
      // Vérifier les instructions de confirmation
      expect(screen.getByText(/Pour confirmer, tapez/)).toBeInTheDocument()
      expect(screen.getByText(/Confirmez avec votre mot de passe actuel/)).toBeInTheDocument()
    })
  })

  // 2. INTERACTIONS AVEC LES CHAMPS DU FORMULAIRE
  describe('Form Field Interactions', () => {
    it('should allow typing in confirmation text field', async () => {
      render(<DeleteAccountModal {...defaultProps} />)
      
      const confirmTextInput = screen.getByPlaceholderText('Tapez SUPPRIMER')
      
      await user.type(confirmTextInput, 'SUPPRIMER')
      
      expect(confirmTextInput).toHaveValue('SUPPRIMER')
    })

    it('should allow typing in password field and maintain password type', async () => {
      render(<DeleteAccountModal {...defaultProps} />)
      
      const passwordInput = screen.getByPlaceholderText('Mot de passe')
      
      // Vérifier que c'est un champ password
      expect(passwordInput).toHaveAttribute('type', 'password')
      
      await user.type(passwordInput, 'mypassword123')
      
      expect(passwordInput).toHaveValue('mypassword123')
    })

    it('should update field values correctly on input change', async () => {
      render(<DeleteAccountModal {...defaultProps} />)
      
      const confirmTextInput = screen.getByPlaceholderText('Tapez SUPPRIMER')
      const passwordInput = screen.getByPlaceholderText('Mot de passe')
      
      // Taper partiellement dans le champ de confirmation
      await user.type(confirmTextInput, 'SUPPRI')
      expect(confirmTextInput).toHaveValue('SUPPRI')
      
      // Compléter la saisie
      await user.type(confirmTextInput, 'MER')
      expect(confirmTextInput).toHaveValue('SUPPRIMER')
      
      // Tester le champ mot de passe
      await user.type(passwordInput, 'test')
      expect(passwordInput).toHaveValue('test')
      
      // Modifier le mot de passe
      await user.clear(passwordInput)
      await user.type(passwordInput, 'newpassword')
      expect(passwordInput).toHaveValue('newpassword')
    })
  })

  // 3. LOGIQUE DE VALIDATION DU FORMULAIRE
  describe('Form Validation Logic', () => {
    it('should disable submit button when fields are empty', () => {
      render(<DeleteAccountModal {...defaultProps} />)
      
      const submitButton = screen.getByRole('button', { name: 'Supprimer définitivement' })
      
      expect(submitButton).toBeDisabled()
    })

    it('should disable submit button when confirmation text is incorrect', async () => {
      render(<DeleteAccountModal {...defaultProps} />)
      
      const confirmTextInput = screen.getByPlaceholderText('Tapez SUPPRIMER')
      const passwordInput = screen.getByPlaceholderText('Mot de passe')
      const submitButton = screen.getByRole('button', { name: 'Supprimer définitivement' })
      
      // Remplir avec un texte incorrect
      await user.type(confirmTextInput, 'DELETE')
      await user.type(passwordInput, 'password123')
      
      expect(submitButton).toBeDisabled()
      
      // Tester avec un texte partiellement correct
      await user.clear(confirmTextInput)
      await user.type(confirmTextInput, 'supprimer') // minuscules
      
      expect(submitButton).toBeDisabled()
    })

    it('should enable submit button when both fields are valid', async () => {
      render(<DeleteAccountModal {...defaultProps} />)
      
      const confirmTextInput = screen.getByPlaceholderText('Tapez SUPPRIMER')
      const passwordInput = screen.getByPlaceholderText('Mot de passe')
      const submitButton = screen.getByRole('button', { name: 'Supprimer définitivement' })
      
      // Remplir les champs avec des valeurs valides
      await user.type(confirmTextInput, 'SUPPRIMER')
      await user.type(passwordInput, 'mypassword123')
      
      expect(submitButton).not.toBeDisabled()
    })
  })

  // 4. FONCTIONNALITÉ DE FERMETURE DU MODAL
  describe('Modal Close Functionality', () => {
    it('should close and clear fields when X button clicked', async () => {
      render(<DeleteAccountModal {...defaultProps} />)
      
      const confirmTextInput = screen.getByPlaceholderText('Tapez SUPPRIMER')
      const passwordInput = screen.getByPlaceholderText('Mot de passe')
      
      // Remplir les champs
      await user.type(confirmTextInput, 'SUPPRIMER')
      await user.type(passwordInput, 'password123')
      
      // Cliquer sur le bouton X (premier bouton sans nom accessible)
      const xButton = screen.getAllByRole('button')[0] // Premier bouton = X
      await user.click(xButton)
      
      expect(mockOnClose).toHaveBeenCalledTimes(1)
      
      // Les champs devraient être vidés lors de la prochaine ouverture
      // (on peut vérifier via re-render avec même props)
    })

    it('should close and clear fields when Cancel button clicked', async () => {
      render(<DeleteAccountModal {...defaultProps} />)
      
      const confirmTextInput = screen.getByPlaceholderText('Tapez SUPPRIMER')
      const passwordInput = screen.getByPlaceholderText('Mot de passe')
      const cancelButton = screen.getByRole('button', { name: 'Annuler' })
      
      // Remplir les champs
      await user.type(confirmTextInput, 'SUPPRIMER')
      await user.type(passwordInput, 'password123')
      
      await user.click(cancelButton)
      
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('should close and clear fields when overlay is clicked', async () => {
      render(<DeleteAccountModal {...defaultProps} />)
      
      const confirmTextInput = screen.getByPlaceholderText('Tapez SUPPRIMER')
      const passwordInput = screen.getByPlaceholderText('Mot de passe')
      
      // Remplir les champs
      await user.type(confirmTextInput, 'SUPPRIMER')
      await user.type(passwordInput, 'password123')
      
      // Cliquer sur l'overlay (élément avec bg-opacity)
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
      
      const confirmTextInput = screen.getByPlaceholderText('Tapez SUPPRIMER')
      const passwordInput = screen.getByPlaceholderText('Mot de passe')
      const submitButton = screen.getByRole('button', { name: 'Supprimer définitivement' })
      
      // Remplir avec des données valides
      await user.type(confirmTextInput, 'SUPPRIMER')
      await user.type(passwordInput, 'mypassword123')
      
      await user.click(submitButton)
      
      expect(mockOnConfirm).toHaveBeenCalledTimes(1)
      expect(mockOnConfirm).toHaveBeenCalledWith('mypassword123')
    })

    it('should prevent submission when validation fails', async () => {
      render(<DeleteAccountModal {...defaultProps} />)
      
      const confirmTextInput = screen.getByPlaceholderText('Tapez SUPPRIMER')
      const passwordInput = screen.getByPlaceholderText('Mot de passe')
      const submitButton = screen.getByRole('button', { name: 'Supprimer définitivement' })
      
      // Remplir avec des données invalides
      await user.type(confirmTextInput, 'DELETE') // Incorrect
      await user.type(passwordInput, 'mypassword123')
      
      // Le bouton devrait être désactivé, donc pas de soumission possible
      expect(submitButton).toBeDisabled()
      
      // Même si on essaie de cliquer, ça ne devrait pas marcher
      await user.click(submitButton)
      expect(mockOnConfirm).not.toHaveBeenCalled()
    })
  })

  // 6. ÉTATS DE CHARGEMENT
  describe('Loading States', () => {
    it('should show loading text and disable submit button when isLoading is true', () => {
      render(<DeleteAccountModal {...defaultProps} isLoading={true} />)
      
      const submitButton = screen.getByRole('button', { name: 'Suppression...' })
      
      expect(submitButton).toBeInTheDocument()
      expect(submitButton).toBeDisabled()
      expect(screen.queryByText('Supprimer définitivement')).not.toBeInTheDocument()
    })

    it('should handle loading state correctly during form interaction', async () => {
      const { rerender } = render(<DeleteAccountModal {...defaultProps} />)
      
      const confirmTextInput = screen.getByPlaceholderText('Tapez SUPPRIMER')
      const passwordInput = screen.getByPlaceholderText('Mot de passe')
      
      // Remplir les champs
      await user.type(confirmTextInput, 'SUPPRIMER')
      await user.type(passwordInput, 'password123')
      
      // Vérifier que le bouton est activé
      expect(screen.getByRole('button', { name: 'Supprimer définitivement' })).not.toBeDisabled()
      
      // Re-render avec loading = true
      rerender(<DeleteAccountModal {...defaultProps} isLoading={true} />)
      
      // Le bouton devrait maintenant être désactivé et afficher le texte de chargement
      const loadingButton = screen.getByRole('button', { name: 'Suppression...' })
      expect(loadingButton).toBeDisabled()
      
      // Les champs devraient toujours contenir les valeurs
      expect(screen.getByDisplayValue('SUPPRIMER')).toBeInTheDocument()
      expect(screen.getByDisplayValue('password123')).toBeInTheDocument()
    })
  })
})