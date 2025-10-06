import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Register from '../../../pages/auth/Register'
import { useAuth } from '../../../hooks/useAuth'

// Mocks
vi.mock('../../../hooks/useAuth')
vi.mock('react-router-dom', () => ({
  Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>
}))

describe('Register Component', () => {
  const mockRegister = vi.fn()
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuth).mockReturnValue({
      register: mockRegister,
      isLoading: false,
      error: null
    })
  })

  // 1. RENDU INITIAL
  describe('Initial Rendering', () => {
    it('should render registration form with all required fields', () => {
      render(<Register />)
      
      // Vérifier les éléments principaux
      expect(screen.getByText('RestOh!')).toBeInTheDocument()
      expect(screen.getByText('Créez votre compte')).toBeInTheDocument()
      
      // Vérifier tous les champs requis
      expect(screen.getByLabelText('Nom complet')).toBeInTheDocument()
      expect(screen.getByLabelText('Adresse email')).toBeInTheDocument()
      expect(screen.getByLabelText('Mot de passe')).toBeInTheDocument()
      expect(screen.getByLabelText('Confirmer le mot de passe')).toBeInTheDocument()
      
      // Vérifier la checkbox des termes
      expect(screen.getByLabelText(/J'accepte les/)).toBeInTheDocument()
      
      // Vérifier le bouton de soumission
      expect(screen.getByRole('button', { name: 'Créer mon compte' })).toBeInTheDocument()
    })

    it('should display navigation links to login and home', () => {
      render(<Register />)
      
      // Lien vers la page d'accueil
      expect(screen.getByRole('link', { name: 'RestOh!' })).toHaveAttribute('href', '/')
      
      // Lien vers la page de connexion
      expect(screen.getByRole('link', { name: 'connectez-vous à votre compte existant' }))
        .toHaveAttribute('href', '/login')
      
      // Liens vers les conditions
      expect(screen.getByRole('link', { name: 'conditions d\'utilisation' }))
        .toHaveAttribute('href', '/terms')
      expect(screen.getByRole('link', { name: 'politique de confidentialité' }))
        .toHaveAttribute('href', '/privacy')
    })
  })

  // 2. VALIDATION DU FORMULAIRE
  describe('Form Validation', () => {
    it('should prevent form submission when required fields are empty', async () => {
      render(<Register />)
      
      // Vérifier que les champs sont requis
      const nameInput = screen.getByLabelText('Nom complet')
      const emailInput = screen.getByLabelText('Adresse email')
      const passwordInput = screen.getByLabelText('Mot de passe')
      const confirmPasswordInput = screen.getByLabelText('Confirmer le mot de passe')
      const termsCheckbox = screen.getByLabelText(/J'accepte les/)
      
      expect(nameInput).toBeRequired()
      expect(emailInput).toBeRequired()
      expect(passwordInput).toBeRequired()
      expect(confirmPasswordInput).toBeRequired()
      expect(termsCheckbox).toBeRequired()
      
      // Tenter de cliquer sur submit - ne devrait pas appeler register
      const submitButton = screen.getByRole('button', { name: 'Créer mon compte' })
      await user.click(submitButton)
      
      // Vérifier que register n'est pas appelé à cause de la validation HTML5
      expect(mockRegister).not.toHaveBeenCalled()
    })

    it('should handle form submission with invalid data gracefully', async () => {
      render(<Register />)
      
      // Remplir tous les champs avec des données invalides
      await user.type(screen.getByLabelText('Nom complet'), 'Test User')
      await user.type(screen.getByLabelText('Adresse email'), 'email-invalide')
      await user.type(screen.getByLabelText('Mot de passe'), '123') // Trop court
      await user.type(screen.getByLabelText('Confirmer le mot de passe'), 'different') // Différent
      
      // Cocher les termes
      const termsCheckbox = screen.getByLabelText(/J'accepte les/)
      await user.click(termsCheckbox)
      
      const submitButton = screen.getByRole('button', { name: 'Créer mon compte' })
      
      // Vérifier que les champs ont les bonnes valeurs
      expect(screen.getByLabelText('Nom complet')).toHaveValue('Test User')
      expect(screen.getByLabelText('Adresse email')).toHaveValue('email-invalide')
      expect(screen.getByLabelText('Mot de passe')).toHaveValue('123')
      expect(screen.getByLabelText('Confirmer le mot de passe')).toHaveValue('different')
      
      // Le formulaire ne devrait pas être soumis avec des données invalides
      // (soit par validation HTML5, soit par validation JS)
      await user.click(submitButton)
      
      // Dans tous les cas, register ne devrait pas être appelé avec des données invalides
      expect(mockRegister).not.toHaveBeenCalled()
    })

    it('should validate email format correctly', async () => {
      render(<Register />)
      
      // Test d'un email valide d'abord
      const emailInput = screen.getByLabelText('Adresse email')
      expect(emailInput).toHaveAttribute('type', 'email')
      
      // Le type="email" HTML5 fournit la validation de base
      await user.type(emailInput, 'valid@email.com')
      expect(emailInput).toHaveValue('valid@email.com')
    })
  })

  // 3. INTERACTIONS UTILISATEUR
  describe('User Interactions', () => {
    it('should allow typing in all form fields', async () => {
      render(<Register />)
      
      // Tester que tous les champs acceptent la saisie
      const nameInput = screen.getByLabelText('Nom complet')
      const emailInput = screen.getByLabelText('Adresse email')
      const passwordInput = screen.getByLabelText('Mot de passe')
      const confirmPasswordInput = screen.getByLabelText('Confirmer le mot de passe')
      
      await user.type(nameInput, 'Jean Dupont')
      await user.type(emailInput, 'jean@example.com')
      await user.type(passwordInput, 'password123')
      await user.type(confirmPasswordInput, 'password123')
      
      expect(nameInput).toHaveValue('Jean Dupont')
      expect(emailInput).toHaveValue('jean@example.com')
      expect(passwordInput).toHaveValue('password123')
      expect(confirmPasswordInput).toHaveValue('password123')
    })

    it('should toggle password visibility when eye icon clicked', async () => {
      render(<Register />)
      
      const passwordInput = screen.getByLabelText('Mot de passe')
      const confirmPasswordInput = screen.getByLabelText('Confirmer le mot de passe')
      
      // Initialement, les champs doivent être de type password
      expect(passwordInput).toHaveAttribute('type', 'password')
      expect(confirmPasswordInput).toHaveAttribute('type', 'password')
      
      // Trouver et cliquer sur le bouton œil du mot de passe
      const passwordToggleButtons = screen.getAllByRole('button', { name: '' })
      const passwordToggle = passwordToggleButtons[0] // Premier bouton œil
      const confirmPasswordToggle = passwordToggleButtons[1] // Deuxième bouton œil
      
      await user.click(passwordToggle)
      expect(passwordInput).toHaveAttribute('type', 'text')
      
      await user.click(confirmPasswordToggle)
      expect(confirmPasswordInput).toHaveAttribute('type', 'text')
      
      // Cliquer à nouveau pour cacher
      await user.click(passwordToggle)
      expect(passwordInput).toHaveAttribute('type', 'password')
    })

    it('should call register function on form submission with valid data', async () => {
      mockRegister.mockResolvedValue(true)
      render(<Register />)
      
      // Remplir le formulaire avec des données valides
      await user.type(screen.getByLabelText('Nom complet'), 'Jean Dupont')
      await user.type(screen.getByLabelText('Adresse email'), 'jean@example.com')
      await user.type(screen.getByLabelText('Mot de passe'), 'password123')
      await user.type(screen.getByLabelText('Confirmer le mot de passe'), 'password123')
      
      // Cocher les termes
      const termsCheckbox = screen.getByLabelText(/J'accepte les/)
      await user.click(termsCheckbox)
      
      // Soumettre le formulaire
      const submitButton = screen.getByRole('button', { name: 'Créer mon compte' })
      await user.click(submitButton)
      
      // Vérifier que register est appelé avec les bonnes données
      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith({
          name: 'Jean Dupont',
          email: 'jean@example.com',
          password: 'password123'
        })
      })
    })
  })

  // 4. ÉTATS DE L'APPLICATION
  describe('Application States', () => {
    it('should display loading state during registration', () => {
      vi.mocked(useAuth).mockReturnValue({
        register: mockRegister,
        isLoading: true,
        error: null
      })
      
      render(<Register />)
      
      // Vérifier l'état de chargement
      expect(screen.getByText('Création du compte...')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Création du compte/ })).toBeDisabled()
      
      // Vérifier l'icône de chargement
      const loadingSpinner = document.querySelector('.animate-spin')
      expect(loadingSpinner).toBeInTheDocument()
    })

    it('should display global error message when registration fails', () => {
      const errorMessage = 'Une erreur est survenue lors de la création du compte'
      vi.mocked(useAuth).mockReturnValue({
        register: mockRegister,
        isLoading: false,
        error: errorMessage
      })
      
      render(<Register />)
      
      // Vérifier que l'erreur est affichée
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
      
      // Vérifier que l'erreur a un style d'erreur
      const errorContainer = screen.getByText(errorMessage).closest('div')
      expect(errorContainer).toHaveClass('text-red-700')
    })
  })

  // 5. CAS LIMITE
  describe('Edge Cases', () => {
    it('should require terms checkbox to be checked', async () => {
      render(<Register />)
      
      // Remplir le formulaire sans cocher les termes
      await user.type(screen.getByLabelText('Nom complet'), 'Jean Dupont')
      await user.type(screen.getByLabelText('Adresse email'), 'jean@example.com')
      await user.type(screen.getByLabelText('Mot de passe'), 'password123')
      await user.type(screen.getByLabelText('Confirmer le mot de passe'), 'password123')
      
      const submitButton = screen.getByRole('button', { name: 'Créer mon compte' })
      const termsCheckbox = screen.getByLabelText(/J'accepte les/)
      
      // Vérifier que la checkbox est requise et non cochée
      expect(termsCheckbox).toBeRequired()
      expect(termsCheckbox).not.toBeChecked()
      
      // Tenter de soumettre sans cocher les termes
      await user.click(submitButton)
      
      // La validation HTML5 devrait empêcher la soumission
      expect(mockRegister).not.toHaveBeenCalled()
    })
  })
})