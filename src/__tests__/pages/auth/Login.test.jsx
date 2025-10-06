import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, test, expect, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import Login from '../../../pages/auth/Login'

// Mock useAuth hook - create a mutable mock that can be updated
const mockLogin = vi.fn()
let mockUseAuth = {
  login: mockLogin,
  isLoading: false,
  error: null
}

vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth
}))

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

// Test wrapper component
const LoginWrapper = ({ initialEntries = ['/login'] }) => (
  <MemoryRouter initialEntries={initialEntries}>
    <Login />
  </MemoryRouter>
)

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mock to default state
    mockUseAuth = {
      login: mockLogin,
      isLoading: false,
      error: null
    }
  })

  describe('Basic Rendering', () => {
    test('should render login form with all required elements', () => {
      render(<LoginWrapper />)
      
      // Header elements
      expect(screen.getByText('RestOh!')).toBeInTheDocument()
      expect(screen.getByText('Connectez-vous à votre compte')).toBeInTheDocument()
      expect(screen.getByText('créez un nouveau compte')).toBeInTheDocument()
      
      // Form fields
      expect(screen.getByLabelText('Adresse email')).toBeInTheDocument()
      expect(screen.getByLabelText('Mot de passe')).toBeInTheDocument()
      expect(screen.getByLabelText('Se souvenir de moi')).toBeInTheDocument()
      
      // Submit button
      expect(screen.getByRole('button', { name: 'Se connecter' })).toBeInTheDocument()
      
      // Links
      expect(screen.getByText('Mot de passe oublié ?')).toBeInTheDocument()
      
      // Demo credentials
      expect(screen.getByText('Comptes de démonstration :')).toBeInTheDocument()
      expect(screen.getByText('🔐 Admin : admin@restoh.fr / admin123')).toBeInTheDocument()
      expect(screen.getByText('👤 Client : client@example.com / client123')).toBeInTheDocument()
    })

    test('should have proper form structure and attributes', () => {
      render(<LoginWrapper />)
      
      const emailInput = screen.getByLabelText('Adresse email')
      const passwordInput = screen.getByLabelText('Mot de passe')
      const submitButton = screen.getByRole('button', { name: 'Se connecter' })
      
      // Input attributes
      expect(emailInput).toHaveAttribute('type', 'email')
      expect(emailInput).toHaveAttribute('name', 'email')
      expect(emailInput).toHaveAttribute('required')
      expect(emailInput).toHaveAttribute('autoComplete', 'email')
      expect(emailInput).toHaveAttribute('placeholder', 'Entrez votre email')
      
      expect(passwordInput).toHaveAttribute('type', 'password')
      expect(passwordInput).toHaveAttribute('name', 'password')
      expect(passwordInput).toHaveAttribute('required')
      expect(passwordInput).toHaveAttribute('autoComplete', 'current-password')
      expect(passwordInput).toHaveAttribute('placeholder', 'Entrez votre mot de passe')
      
      // Submit button
      expect(submitButton).toHaveAttribute('type', 'submit')
      expect(submitButton).not.toBeDisabled()
    })
  })

  describe('Form Input Handling', () => {
    test('should allow typing in email field', async () => {
      const user = userEvent.setup()
      render(<LoginWrapper />)
      
      const emailInput = screen.getByLabelText('Adresse email')
      
      await user.type(emailInput, 'test@example.com')
      
      expect(emailInput).toHaveValue('test@example.com')
    })

    test('should allow typing in password field', async () => {
      const user = userEvent.setup()
      render(<LoginWrapper />)
      
      const passwordInput = screen.getByLabelText('Mot de passe')
      
      await user.type(passwordInput, 'password123')
      
      expect(passwordInput).toHaveValue('password123')
    })

    test('should handle form data correctly when typing in multiple fields', async () => {
      const user = userEvent.setup()
      render(<LoginWrapper />)
      
      const emailInput = screen.getByLabelText('Adresse email')
      const passwordInput = screen.getByLabelText('Mot de passe')
      
      await user.type(emailInput, 'user@test.com')
      await user.type(passwordInput, 'mypassword')
      
      expect(emailInput).toHaveValue('user@test.com')
      expect(passwordInput).toHaveValue('mypassword')
    })
  })

  describe('Password Visibility Toggle', () => {
    test('should toggle password visibility when eye icon is clicked', async () => {
      const user = userEvent.setup()
      render(<LoginWrapper />)
      
      const passwordInput = screen.getByLabelText('Mot de passe')
      const toggleButton = screen.getByRole('button', { name: '' }) // Eye toggle button has no accessible name
      
      // Initially password should be hidden
      expect(passwordInput).toHaveAttribute('type', 'password')
      
      // Click to show password
      await user.click(toggleButton)
      expect(passwordInput).toHaveAttribute('type', 'text')
      
      // Click again to hide password
      await user.click(toggleButton)
      expect(passwordInput).toHaveAttribute('type', 'password')
    })

    test('should display correct icon based on password visibility state', async () => {
      const user = userEvent.setup()
      render(<LoginWrapper />)
      
      const toggleButton = screen.getByRole('button', { name: '' })
      
      // Should show Eye icon initially (password hidden)
      expect(toggleButton.querySelector('svg')).toBeInTheDocument()
      
      // Click to toggle
      await user.click(toggleButton)
      
      // Icon should change (EyeOff when password is visible)
      expect(toggleButton.querySelector('svg')).toBeInTheDocument()
    })
  })

  describe('Form Submission', () => {
    test('should call login function with correct data when form is submitted', async () => {
      const user = userEvent.setup()
      render(<LoginWrapper />)
      
      const emailInput = screen.getByLabelText('Adresse email')
      const passwordInput = screen.getByLabelText('Mot de passe')
      const submitButton = screen.getByRole('button', { name: 'Se connecter' })
      
      // Fill form
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      
      // Submit form
      await user.click(submitButton)
      
      expect(mockLogin).toHaveBeenCalledTimes(1)
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      })
    })

    test('should prevent default form submission behavior', async () => {
      const user = userEvent.setup()
      render(<LoginWrapper />)
      
      const form = screen.getByText('Se connecter').closest('form')
      const emailInput = screen.getByLabelText('Adresse email')
      const passwordInput = screen.getByLabelText('Mot de passe')
      
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      
      // Test that form submission calls login
      fireEvent.submit(form)
      
      expect(mockLogin).toHaveBeenCalled()
    })

    test('should handle empty form submission', async () => {
      const user = userEvent.setup()
      render(<LoginWrapper />)
      
      const submitButton = screen.getByRole('button', { name: 'Se connecter' })
      
      await user.click(submitButton)
      
      // HTML5 validation prevents submission with empty required fields
      // The form should not be submitted and mockLogin should not be called
      expect(mockLogin).not.toHaveBeenCalled()
    })
  })

  describe('Loading State', () => {
    test('should disable submit button and show loading state when isLoading is true', () => {
      // Update mock to return loading state
      mockUseAuth = {
        login: mockLogin,
        isLoading: true,
        error: null
      }
      
      render(<LoginWrapper />)
      
      const submitButton = screen.getByRole('button', { name: /connexion en cours/i })
      
      expect(submitButton).toBeDisabled()
      expect(screen.getByText('Connexion en cours...')).toBeInTheDocument()
      expect(screen.queryByText('Se connecter')).not.toBeInTheDocument()
      
      // Should show loading spinner
      expect(submitButton).toContainHTML('animate-spin')
    })

    test('should show normal submit button when not loading', () => {
      // Reset mock to normal state
      mockUseAuth = {
        login: mockLogin,
        isLoading: false,
        error: null
      }
      
      render(<LoginWrapper />)
      
      const submitButton = screen.getByRole('button', { name: 'Se connecter' })
      
      expect(submitButton).not.toBeDisabled()
      expect(screen.getByText('Se connecter')).toBeInTheDocument()
      expect(screen.queryByText('Connexion en cours...')).not.toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    test('should display error message when error exists', () => {
      // Update mock to return error state
      mockUseAuth = {
        login: mockLogin,
        isLoading: false,
        error: 'Email ou mot de passe incorrect'
      }
      
      render(<LoginWrapper />)
      
      expect(screen.getByText('Email ou mot de passe incorrect')).toBeInTheDocument()
    })

    test('should not display error message when error is null', () => {
      // Update mock to return no error
      mockUseAuth = {
        login: mockLogin,
        isLoading: false,
        error: null
      }
      
      render(<LoginWrapper />)
      
      // Error container should not be present
      expect(screen.queryByText(/incorrect/)).not.toBeInTheDocument()
    })

    test('should have proper error styling', () => {
      // Update mock to return error state
      mockUseAuth = {
        login: mockLogin,
        isLoading: false,
        error: 'Test error message'
      }
      
      render(<LoginWrapper />)
      
      const errorElement = screen.getByText('Test error message')
      expect(errorElement).toHaveClass('text-sm', 'text-red-700')
      expect(errorElement.parentElement).toHaveClass('rounded-md', 'bg-red-50', 'p-4')
    })
  })

  describe('Navigation Links', () => {
    test('should have correct link to register page', () => {
      render(<LoginWrapper />)
      
      const registerLink = screen.getByText('créez un nouveau compte')
      expect(registerLink).toHaveAttribute('href', '/register')
    })

    test('should have correct link to home page', () => {
      render(<LoginWrapper />)
      
      const homeLink = screen.getByText('RestOh!')
      expect(homeLink.closest('a')).toHaveAttribute('href', '/')
    })

    test('should have correct link to forgot password page', () => {
      render(<LoginWrapper />)
      
      const forgotPasswordLink = screen.getByText('Mot de passe oublié ?')
      expect(forgotPasswordLink).toHaveAttribute('href', '/forgot-password')
    })

    test('should have proper styling for navigation links', () => {
      render(<LoginWrapper />)
      
      const registerLink = screen.getByText('créez un nouveau compte')
      expect(registerLink).toHaveClass('font-medium', 'text-primary-600', 'hover:text-primary-500')
      
      const homeLink = screen.getByText('RestOh!')
      expect(homeLink).toHaveClass('text-4xl', 'font-bold', 'text-primary-600')
    })
  })

  describe('Accessibility', () => {
    test('should have proper form labels and associations', () => {
      render(<LoginWrapper />)
      
      // Email field
      const emailLabel = screen.getByText('Adresse email')
      const emailInput = screen.getByLabelText('Adresse email')
      expect(emailLabel).toHaveAttribute('for', 'email')
      expect(emailInput).toHaveAttribute('id', 'email')
      
      // Password field
      const passwordLabel = screen.getByText('Mot de passe')
      const passwordInput = screen.getByLabelText('Mot de passe')
      expect(passwordLabel).toHaveAttribute('for', 'password')
      expect(passwordInput).toHaveAttribute('id', 'password')
      
      // Remember me checkbox
      const checkboxLabel = screen.getByText('Se souvenir de moi')
      const checkbox = screen.getByLabelText('Se souvenir de moi')
      expect(checkboxLabel).toHaveAttribute('for', 'remember-me')
      expect(checkbox).toHaveAttribute('id', 'remember-me')
    })

    test('should have proper button types', () => {
      render(<LoginWrapper />)
      
      const submitButton = screen.getByRole('button', { name: /se connecter|connexion en cours/i })
      const toggleButton = screen.getByRole('button', { name: '' })
      
      expect(submitButton).toHaveAttribute('type', 'submit')
      expect(toggleButton).toHaveAttribute('type', 'button')
    })
  })

  describe('Demo Credentials Section', () => {
    test('should display demo credentials with correct formatting', () => {
      render(<LoginWrapper />)
      
      expect(screen.getByText('Comptes de démonstration :')).toBeInTheDocument()
      expect(screen.getByText('🔐 Admin : admin@restoh.fr / admin123')).toBeInTheDocument()
      expect(screen.getByText('👤 Client : client@example.com / client123')).toBeInTheDocument()
    })

    test('should have proper styling for demo credentials section', () => {
      render(<LoginWrapper />)
      
      const demoSection = screen.getByText('Comptes de démonstration :').closest('div')
      expect(demoSection).toHaveClass('mt-6', 'p-4', 'bg-gray-50', 'rounded-md')
    })
  })
})