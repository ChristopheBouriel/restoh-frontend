import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import Header from '../../../components/layout/Header'
import { CartUIProvider } from '../../../contexts/CartUIContext'

// Mock external dependencies
const mockLogout = vi.fn()
const mockNavigate = vi.fn()
const mockToggleCart = vi.fn()
const mockCloseCart = vi.fn()

// Global variables to control mock behavior
let mockCurrentUser = null
let mockIsAuthenticated = false
let mockCurrentPath = '/'
let mockCartState = {
  totalItems: 0,
  totalItemsAvailable: 0,
  hasUnavailableItems: false
}

// Mock useAuth hook
vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockCurrentUser,
    isAuthenticated: mockIsAuthenticated,
    logout: mockLogout
  })
}))

// Mock useCart hook
vi.mock('../../../hooks/useCart', () => ({
  useCart: () => mockCartState
}))

// Mock CartUIContext
vi.mock('../../../contexts/CartUIContext', () => ({
  useCartUI: () => ({
    toggleCart: mockToggleCart,
    closeCart: mockCloseCart
  }),
  CartUIProvider: ({ children }) => children
}))

// Mock react-router-dom hooks
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: mockCurrentPath })
  }
})

describe('Header Component', () => {
  const user = userEvent.setup()

  // Mock data
  const regularUser = {
    name: 'John Doe',
    role: 'user'
  }

  const adminUser = {
    name: 'Admin User',
    role: 'admin'
  }

  const expectedNavItems = [
    { label: 'Home', path: '/' },
    { label: 'Menu', path: '/menu' },
    { label: 'Reservations', path: '/reservations' },
    { label: 'Contact', path: '/contact' }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    mockCurrentUser = null
    mockIsAuthenticated = false
    mockCurrentPath = '/'
    mockCartState = {
      totalItems: 0,
      totalItemsAvailable: 0,
      hasUnavailableItems: false
    }
  })

  const renderComponent = (userOverride = null, pathOverride = null, cartOverride = null) => {
    if (userOverride !== null) {
      mockCurrentUser = userOverride
      mockIsAuthenticated = !!userOverride
    }
    if (pathOverride) {
      mockCurrentPath = pathOverride
    }
    if (cartOverride) {
      mockCartState = { ...mockCartState, ...cartOverride }
    }
    
    return render(
      <MemoryRouter initialEntries={[mockCurrentPath]}>
        <CartUIProvider>
          <Header />
        </CartUIProvider>
      </MemoryRouter>
    )
  }

  // 1. Core Rendering & Logo Tests
  describe('Core Rendering and Logo', () => {
    it('should render header with RestOh! logo linking to home', () => {
      renderComponent()
      
      const logo = screen.getByRole('link', { name: /RestOh!/ })
      expect(logo).toBeInTheDocument()
      expect(logo).toHaveAttribute('href', '/')
      expect(screen.getByText('RestOh!')).toBeInTheDocument()
    })

    it('should display all main navigation items with correct links', () => {
      renderComponent()
      
      expectedNavItems.forEach(item => {
        const navLink = screen.getByRole('link', { name: item.label })
        expect(navLink).toBeInTheDocument()
        expect(navLink).toHaveAttribute('href', item.path)
      })
    })
  })

  // 2. Navigation & Active States Tests
  describe('Navigation and Active States', () => {
    it('should highlight active navigation item based on current route', () => {
      renderComponent(null, '/menu')
      
      const menuLink = screen.getByRole('link', { name: 'Menu' })
      expect(menuLink).toHaveClass('text-primary-600', 'border-2', 'border-primary-600')

      const homeLink = screen.getByRole('link', { name: 'Home' })
      expect(homeLink).toHaveClass('text-gray-700', 'hover:text-primary-600')
      expect(homeLink).not.toHaveClass('text-primary-600', 'border-2')
    })

    it('should handle home route highlighting correctly', () => {
      renderComponent(null, '/')

      const homeLink = screen.getByRole('link', { name: 'Home' })
      expect(homeLink).toHaveClass('text-primary-600', 'border-2', 'border-primary-600')

      const menuLink = screen.getByRole('link', { name: 'Menu' })
      expect(menuLink).toHaveClass('text-gray-700', 'hover:text-primary-600')
    })

    it('should highlight menu navigation for menu sub-routes', () => {
      renderComponent(null, '/menu/pizza-margherita')

      const menuLink = screen.getByRole('link', { name: 'Menu' })
      expect(menuLink).toHaveClass('text-primary-600', 'border-2', 'border-primary-600')

      const homeLink = screen.getByRole('link', { name: 'Home' })
      expect(homeLink).not.toHaveClass('text-primary-600')
    })
  })

  // 3. Authentication States Tests
  describe('Authentication States', () => {
    it('should show "Login" button when user is not authenticated', () => {
      renderComponent()

      const loginButton = screen.getByRole('button', { name: /Login/ })
      expect(loginButton).toBeInTheDocument()
      expect(screen.queryByText(/User/)).not.toBeInTheDocument()
    })

    it('should show user menu with name when user is authenticated', () => {
      renderComponent(regularUser)

      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /Login/ })).not.toBeInTheDocument()

      const userButton = screen.getByRole('button', { name: /John Doe/ })
      expect(userButton).toBeInTheDocument()
    })

    it('should display admin panel link for admin users only', async () => {
      renderComponent(adminUser)

      // Open user menu
      const userButton = screen.getByRole('button', { name: /Admin User/ })
      await user.click(userButton)

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /Admin Panel/ })).toBeInTheDocument()
      })
    })

    it('should not display admin panel link for regular users', async () => {
      renderComponent(regularUser)

      // Open user menu
      const userButton = screen.getByRole('button', { name: /John Doe/ })
      await user.click(userButton)

      await waitFor(() => {
        expect(screen.queryByRole('link', { name: /Admin Panel/ })).not.toBeInTheDocument()
      })
    })

    it('should call logout function when logout button clicked', async () => {
      renderComponent(regularUser)

      // Open user menu
      const userButton = screen.getByRole('button', { name: /John Doe/ })
      await user.click(userButton)

      // Click logout button
      const logoutButton = await screen.findByRole('button', { name: /Logout/ })
      await user.click(logoutButton)

      expect(mockLogout).toHaveBeenCalled()
    })
  })

  // 4. User Menu Interactions Tests
  describe('User Menu Interactions', () => {
    it('should open and close user dropdown menu when button clicked', async () => {
      renderComponent(regularUser)
      
      const userButton = screen.getByRole('button', { name: /John Doe/ })
      
      // Initially menu should be closed
      expect(screen.queryByRole('link', { name: /My Profile/ })).not.toBeInTheDocument()

      // Open menu
      await user.click(userButton)

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /My Profile/ })).toBeInTheDocument()
        expect(screen.getByRole('link', { name: /My Orders/ })).toBeInTheDocument()
        expect(screen.getByRole('link', { name: /My Reservations/ })).toBeInTheDocument()
      })

      // Close menu by clicking button again
      await user.click(userButton)

      await waitFor(() => {
        expect(screen.queryByRole('link', { name: /My Profile/ })).not.toBeInTheDocument()
      })
    })

    it('should close user menu when menu items are clicked', async () => {
      renderComponent(regularUser)

      // Open menu
      const userButton = screen.getByRole('button', { name: /John Doe/ })
      await user.click(userButton)

      // Click on a menu item
      const profileLink = await screen.findByRole('link', { name: /My Profile/ })
      await user.click(profileLink)

      // Menu should close
      await waitFor(() => {
        expect(screen.queryByRole('link', { name: /My Orders/ })).not.toBeInTheDocument()
      })
    })

    it('should close user menu when clicking outside', async () => {
      renderComponent(regularUser)

      // Open menu with mousedown (since we changed to onMouseDown)
      const userButton = screen.getByRole('button', { name: /John Doe/ })
      fireEvent.mouseDown(userButton)

      // Verify menu is open
      await waitFor(() => {
        expect(screen.getByRole('link', { name: /My Profile/ })).toBeInTheDocument()
      })

      // Click outside the menu (on the header)
      const header = document.querySelector('header')
      fireEvent.mouseDown(header)

      // Menu should close
      await waitFor(() => {
        expect(screen.queryByRole('link', { name: /My Profile/ })).not.toBeInTheDocument()
      })
    })
  })

  // 5. Cart Integration Tests
  describe('Cart Integration', () => {
    it('should display cart button with item count and correct color', () => {
      renderComponent(null, null, { 
        totalItems: 3, 
        totalItemsAvailable: 3, 
        hasUnavailableItems: false 
      })
      
      const cartButton = document.querySelector('[data-cart-button]')
      expect(cartButton).toBeInTheDocument()
      expect(cartButton.querySelector('svg')).toBeInTheDocument() // ShoppingCart icon
      
      // Should show item count badge
      const badge = cartButton.querySelector('.bg-primary-600')
      expect(badge).toBeInTheDocument()
      expect(badge.textContent).toBe('3')
    })

    it('should show warning indicator when cart has unavailable items', () => {
      renderComponent(null, null, { 
        totalItems: 5, 
        totalItemsAvailable: 3, 
        hasUnavailableItems: true 
      })
      
      const cartButton = document.querySelector('[data-cart-button]')
      expect(cartButton).toBeInTheDocument()
      
      // Should show red badge instead of primary
      const redBadge = cartButton.querySelector('.bg-red-500')
      expect(redBadge).toBeInTheDocument()
      expect(redBadge.textContent).toBe('3')
      
      // Should show warning indicator
      const warningBadge = cartButton.querySelector('.bg-yellow-400')
      expect(warningBadge).toBeInTheDocument()
      expect(warningBadge.textContent).toBe('!')
    })

    it('should call toggleCart when cart button clicked', async () => {
      renderComponent()
      
      const cartButton = document.querySelector('[data-cart-button]')
      await user.click(cartButton)
      
      expect(mockToggleCart).toHaveBeenCalled()
    })

    it('should not show cart badge when no items in cart', () => {
      renderComponent(null, null, { 
        totalItems: 0, 
        totalItemsAvailable: 0, 
        hasUnavailableItems: false 
      })
      
      const cartButton = document.querySelector('[data-cart-button]')
      expect(cartButton).toBeInTheDocument()
      
      // Should not show any badge
      const badge = cartButton.querySelector('.bg-primary-600, .bg-red-500')
      expect(badge).not.toBeInTheDocument()
    })
  })

  // 6. Mobile Responsive Behavior Tests
  describe('Mobile Responsive Behavior', () => {
    it('should open and close mobile menu when hamburger button clicked', async () => {
      renderComponent()
      
      // Find hamburger menu button (Menu icon)
      const menuButton = document.querySelector('button.md\\:hidden')
      expect(menuButton).toBeInTheDocument()

      // Initially mobile menu should not be visible
      expect(screen.queryByText('Cart (0)')).not.toBeInTheDocument()

      // Open mobile menu
      await user.click(menuButton)

      // Mobile menu should be visible
      await waitFor(() => {
        expect(screen.getByText('Cart (0)')).toBeInTheDocument()
        expectedNavItems.forEach(item => {
          expect(screen.getAllByText(item.label)).toHaveLength(2) // Desktop + mobile
        })
      })

      // Close menu by clicking hamburger again
      await user.click(menuButton)

      await waitFor(() => {
        expect(screen.queryByText('Cart (0)')).not.toBeInTheDocument()
      })
    })

    it('should close mobile menu when navigation items clicked', async () => {
      renderComponent()

      // Open mobile menu
      const menuButton = document.querySelector('button.md\\:hidden')
      await user.click(menuButton)

      // Wait for menu to open
      await waitFor(() => {
        expect(screen.getByText('Cart (0)')).toBeInTheDocument()
      })

      // Click on a mobile navigation item (get the second instance - mobile version)
      const mobileMenuLinks = screen.getAllByRole('link', { name: 'Menu' })
      const mobileMenuLink = mobileMenuLinks[1] // Second instance is mobile
      await user.click(mobileMenuLink)

      // Mobile menu should close
      await waitFor(() => {
        expect(screen.queryByText('Cart (0)')).not.toBeInTheDocument()
      })
    })
  })

  // 7. Header Click Behavior Test
  describe('Header Click Behavior', () => {
    it('should call closeCart when clicking header outside cart button', async () => {
      renderComponent()
      
      const header = document.querySelector('header')
      await user.click(header)
      
      expect(mockCloseCart).toHaveBeenCalled()
    })

    it('should not call closeCart when clicking cart button', async () => {
      renderComponent()
      
      vi.clearAllMocks()
      const cartButton = document.querySelector('[data-cart-button]')
      await user.click(cartButton)
      
      expect(mockCloseCart).not.toHaveBeenCalled()
      expect(mockToggleCart).toHaveBeenCalled()
    })
  })
})