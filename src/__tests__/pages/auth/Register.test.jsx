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
      
      // Check main elements
      expect(screen.getByText('RestOh!')).toBeInTheDocument()
      expect(screen.getByText('Create your account')).toBeInTheDocument()

      // Check all required fields
      expect(screen.getByLabelText('Full name')).toBeInTheDocument()
      expect(screen.getByLabelText('Email address')).toBeInTheDocument()
      expect(screen.getByLabelText('Password')).toBeInTheDocument()
      expect(screen.getByLabelText('Confirm password')).toBeInTheDocument()

      // Check terms checkbox
      expect(screen.getByLabelText(/I accept the/)).toBeInTheDocument()

      // Check submit button
      expect(screen.getByRole('button', { name: 'Create my account' })).toBeInTheDocument()
    })

    it('should display navigation links to login and home', () => {
      render(<Register />)
      
      // Lien vers la page d'accueil
      expect(screen.getByRole('link', { name: 'RestOh!' })).toHaveAttribute('href', '/')
      
      // Lien vers la page de connexion
      expect(screen.getByRole('link', { name: 'log in to your existing account' }))
        .toHaveAttribute('href', '/login')
      
      // Liens vers les conditions
      expect(screen.getByRole('link', { name: 'terms of use' }))
        .toHaveAttribute('href', '/terms')
      expect(screen.getByRole('link', { name: 'privacy policy' }))
        .toHaveAttribute('href', '/privacy')
    })
  })

  // 2. VALIDATION DU FORMULAIRE
  describe('Form Validation', () => {
    it('should prevent form submission when required fields are empty', async () => {
      render(<Register />)
      
      // Check that fields are required
      const nameInput = screen.getByLabelText('Full name')
      const emailInput = screen.getByLabelText('Email address')
      const passwordInput = screen.getByLabelText('Password')
      const confirmPasswordInput = screen.getByLabelText('Confirm password')
      const termsCheckbox = screen.getByLabelText(/I accept the/)

      expect(nameInput).toBeRequired()
      expect(emailInput).toBeRequired()
      expect(passwordInput).toBeRequired()
      expect(confirmPasswordInput).toBeRequired()
      expect(termsCheckbox).toBeRequired()

      // Try to click submit - should not call register
      const submitButton = screen.getByRole('button', { name: 'Create my account' })
      await user.click(submitButton)

      // Check that register is not called due to HTML5 validation
      expect(mockRegister).not.toHaveBeenCalled()
    })

    it('should handle form submission with invalid data gracefully', async () => {
      render(<Register />)

      // Fill all fields with invalid data
      await user.type(screen.getByLabelText('Full name'), 'Test User')
      await user.type(screen.getByLabelText('Email address'), 'invalid-email')
      await user.type(screen.getByLabelText('Password'), '123') // Too short
      await user.type(screen.getByLabelText('Confirm password'), 'different') // Different

      // Check terms checkbox
      const termsCheckbox = screen.getByLabelText(/I accept the/)
      await user.click(termsCheckbox)

      const submitButton = screen.getByRole('button', { name: 'Create my account' })

      // Check that fields have correct values
      expect(screen.getByLabelText('Full name')).toHaveValue('Test User')
      expect(screen.getByLabelText('Email address')).toHaveValue('invalid-email')
      expect(screen.getByLabelText('Password')).toHaveValue('123')
      expect(screen.getByLabelText('Confirm password')).toHaveValue('different')

      // Form should not be submitted with invalid data
      // (either by HTML5 validation or JS validation)
      await user.click(submitButton)

      // In any case, register should not be called with invalid data
      expect(mockRegister).not.toHaveBeenCalled()
    })

    it('should validate email format correctly', async () => {
      render(<Register />)
      
      // Test d'un email valide d'abord
      const emailInput = screen.getByLabelText('Email address')
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
      
      // Test that all fields accept input
      const nameInput = screen.getByLabelText('Full name')
      const emailInput = screen.getByLabelText('Email address')
      const passwordInput = screen.getByLabelText('Password')
      const confirmPasswordInput = screen.getByLabelText('Confirm password')
      
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
      
      const passwordInput = screen.getByLabelText('Password')
      const confirmPasswordInput = screen.getByLabelText('Confirm password')

      // Initially, fields should be password type
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
      
      // Click à nouveau pour cacher
      await user.click(passwordToggle)
      expect(passwordInput).toHaveAttribute('type', 'password')
    })

    it('should call register function on form submission with valid data', async () => {
      mockRegister.mockResolvedValue(true)
      render(<Register />)
      
      // Fill le formulaire avec des données valides
      await user.type(screen.getByLabelText('Full name'), 'Jean Dupont')
      await user.type(screen.getByLabelText('Email address'), 'jean@example.com')
      await user.type(screen.getByLabelText('Password'), 'password123')
      await user.type(screen.getByLabelText('Confirm password'), 'password123')
      
      // Check the terms
      const termsCheckbox = screen.getByLabelText(/I accept the/)
      await user.click(termsCheckbox)
      
      // Soumettre le formulaire
      const submitButton = screen.getByRole('button', { name: 'Create my account' })
      await user.click(submitButton)
      
      // Check que register est appelé avec les bonnes données
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
      
      // Check l'état de chargement
      expect(screen.getByText('Creating account...')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Creating account.../ })).toBeDisabled()
      
      // Check l'icône de chargement
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
      
      // Check that error is displayed
      expect(screen.getByText(errorMessage)).toBeInTheDocument()

      // Verify that error has error styling
      const errorContainer = screen.getByText(errorMessage).closest('div')
      expect(errorContainer).toHaveClass('text-red-700')
    })
  })

  // 5. EDGE CASES
  describe('Edge Cases', () => {
    it('should require terms checkbox to be checked', async () => {
      render(<Register />)

      // Fill form without checking terms
      await user.type(screen.getByLabelText('Full name'), 'Jean Dupont')
      await user.type(screen.getByLabelText('Email address'), 'jean@example.com')
      await user.type(screen.getByLabelText('Password'), 'password123')
      await user.type(screen.getByLabelText('Confirm password'), 'password123')

      const submitButton = screen.getByRole('button', { name: 'Create my account' })
      const termsCheckbox = screen.getByLabelText(/I accept the/)

      // Verify that checkbox is required and not checked
      expect(termsCheckbox).toBeRequired()
      expect(termsCheckbox).not.toBeChecked()

      // Try to submit without checking terms
      await user.click(submitButton)

      // HTML5 validation should prevent submission
      expect(mockRegister).not.toHaveBeenCalled()
    })
  })
})