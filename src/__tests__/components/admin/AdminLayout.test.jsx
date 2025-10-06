import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import AdminLayout from '../../../components/admin/AdminLayout'

// Mock external dependencies
const mockLogout = vi.fn()
const mockNavigate = vi.fn()
const mockGetNewMessagesCount = vi.fn()

// Global variables to control mock behavior
let mockCurrentUser = null
let mockCurrentPath = '/admin'

// Mock useAuth hook
vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockCurrentUser,
    logout: mockLogout
  })
}))

// Mock contactsStore
vi.mock('../../../store/contactsStore', () => ({
  default: () => ({
    getNewMessagesCount: mockGetNewMessagesCount
  })
}))

// Mock react-router-dom hooks
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: mockCurrentPath }),
    Outlet: () => <div data-testid="outlet-content">Admin Page Content</div>
  }
})

describe('AdminLayout Component', () => {
  const user = userEvent.setup()

  // Mock data
  const adminUser = {
    name: 'Admin Test',
    email: 'admin@restoh.fr',
    role: 'admin'
  }

  const regularUser = {
    name: 'User Test', 
    email: 'user@test.com',
    role: 'user'
  }

  const expectedNavigationItems = [
    { name: 'Dashboard', href: '/admin' },
    { name: 'Gestion Menu', href: '/admin/menu' },
    { name: 'Commandes', href: '/admin/orders' },
    { name: 'Réservations', href: '/admin/reservations' },
    { name: 'Utilisateurs', href: '/admin/users' },
    { name: 'Messages Contact', href: '/admin/messages' }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetNewMessagesCount.mockReturnValue(0)
    mockCurrentUser = adminUser
    mockCurrentPath = '/admin'
  })

  const renderComponent = (userOverride = null, pathOverride = null) => {
    if (userOverride !== null) {
      mockCurrentUser = userOverride
    }
    if (pathOverride) {
      mockCurrentPath = pathOverride
    }
    
    return render(
      <MemoryRouter initialEntries={[mockCurrentPath]}>
        <AdminLayout />
      </MemoryRouter>
    )
  }

  // 1. Access Control & Authorization Tests
  describe('Access Control and Authorization', () => {
    it('should show access denied when user is not admin', () => {
      renderComponent(regularUser)
      
      expect(screen.getByText('Accès refusé')).toBeInTheDocument()
      expect(screen.getByText('Vous n\'avez pas les permissions pour accéder au panel admin.')).toBeInTheDocument()
    })

    it('should display access denied with home navigation button for non-admin', async () => {
      renderComponent(regularUser)
      
      const homeButton = screen.getByText('Retour à l\'accueil')
      expect(homeButton).toBeInTheDocument()
      
      await user.click(homeButton)
      expect(mockNavigate).toHaveBeenCalledWith('/')
    })

    it('should render admin layout when user is admin', () => {
      renderComponent(adminUser)
      
      expect(screen.getByText('RestOh Admin')).toBeInTheDocument()
      expect(screen.getByTestId('outlet-content')).toBeInTheDocument()
      expect(screen.queryByText('Accès refusé')).not.toBeInTheDocument()
    })
  })

  // 2. Navigation & Routing Tests
  describe('Navigation and Routing', () => {
    it('should display all navigation items with correct links', () => {
      renderComponent(adminUser)
      
      expectedNavigationItems.forEach(item => {
        const navLink = screen.getByRole('link', { name: new RegExp(item.name) })
        expect(navLink).toBeInTheDocument()
        expect(navLink).toHaveAttribute('href', item.href)
      })
    })

    it('should highlight current active navigation item based on location', () => {
      renderComponent(adminUser, '/admin/orders')
      
      const ordersLink = screen.getByRole('link', { name: /Commandes/ })
      expect(ordersLink).toHaveClass('bg-gray-800', 'border-r-2', 'border-primary-500', 'text-white')
      
      const dashboardLink = screen.getByRole('link', { name: /Dashboard/ })
      expect(dashboardLink).toHaveClass('text-gray-300', 'hover:text-white', 'hover:bg-gray-800')
    })

    it('should show correct icons for each navigation section', () => {
      renderComponent(adminUser)
      
      // Verify that navigation items have icons (Lucide React components render as svg)
      const navLinks = screen.getAllByRole('link')
      const adminNavLinks = navLinks.filter(link => 
        expectedNavigationItems.some(item => link.textContent.includes(item.name))
      )
      
      // Each admin nav link should contain an SVG icon
      adminNavLinks.forEach(link => {
        expect(link.querySelector('svg')).toBeInTheDocument()
      })
    })

    it('should navigate to home when clicking "Retour au site" link', () => {
      renderComponent(adminUser)
      
      const homeLink = screen.getByRole('link', { name: /Retour au site/ })
      expect(homeLink).toBeInTheDocument()
      expect(homeLink).toHaveAttribute('href', '/')
    })
  })

  // 3. Mobile Sidebar Interactions Tests
  describe('Mobile Sidebar Interactions', () => {
    it('should open mobile sidebar when hamburger menu clicked', async () => {
      renderComponent(adminUser)
      
      // Find the mobile menu button by its class (Menu icon in top bar)
      const menuButton = document.querySelector('button.text-gray-500.hover\\:text-gray-700')
      expect(menuButton).toBeInTheDocument()
      expect(menuButton.querySelector('svg.lucide-menu')).toBeInTheDocument()
      
      await user.click(menuButton)
      
      // After opening, sidebar should be visible (translate-x-0 instead of -translate-x-full)
      await waitFor(() => {
        const sidebar = document.querySelector('.fixed.inset-y-0.left-0.z-50')
        expect(sidebar).toHaveClass('translate-x-0')
        expect(sidebar).not.toHaveClass('-translate-x-full')
      })
    })

    it('should close mobile sidebar when overlay clicked', async () => {
      renderComponent(adminUser)
      
      // Open sidebar first
      const menuButton = document.querySelector('button.text-gray-500.hover\\:text-gray-700')
      await user.click(menuButton)
      
      await waitFor(() => {
        const overlay = document.querySelector('.fixed.inset-0.z-40.bg-gray-600')
        expect(overlay).toBeInTheDocument()
      })
      
      // Click overlay to close
      const overlay = document.querySelector('.fixed.inset-0.z-40.bg-gray-600')
      await user.click(overlay)
      
      // Sidebar should close (translate back to -translate-x-full)
      await waitFor(() => {
        const sidebar = document.querySelector('.fixed.inset-y-0.left-0.z-50')
        expect(sidebar).toHaveClass('-translate-x-full')
        expect(sidebar).not.toHaveClass('translate-x-0')
      })
    })

    it('should close mobile sidebar when navigation item clicked on mobile', async () => {
      renderComponent(adminUser)
      
      // Open sidebar
      const menuButton = document.querySelector('button.text-gray-500.hover\\:text-gray-700')
      await user.click(menuButton)
      
      // Wait for sidebar to open
      await waitFor(() => {
        const sidebar = document.querySelector('.fixed.inset-y-0.left-0.z-50')
        expect(sidebar).toHaveClass('translate-x-0')
      })
      
      // Click on a navigation item
      const dashboardLink = screen.getByRole('link', { name: /Dashboard/ })
      await user.click(dashboardLink)
      
      // Sidebar should close
      await waitFor(() => {
        const sidebar = document.querySelector('.fixed.inset-y-0.left-0.z-50')
        expect(sidebar).toHaveClass('-translate-x-full')
      })
    })
  })

  // 4. Badge Notifications System Tests
  describe('Badge Notifications System', () => {
    it('should display badge with count when there are new messages', () => {
      mockGetNewMessagesCount.mockReturnValue(3)
      renderComponent(adminUser)
      
      const messagesLink = screen.getByRole('link', { name: /Messages Contact/ })
      expect(messagesLink.textContent).toContain('3')
      
      // Badge should be visible
      const badge = messagesLink.querySelector('.bg-red-600.rounded-full')
      expect(badge).toBeInTheDocument()
      expect(badge.textContent).toBe('3')
    })

    it('should not display badge when no new messages exist', () => {
      mockGetNewMessagesCount.mockReturnValue(0)
      renderComponent(adminUser)
      
      const messagesLink = screen.getByRole('link', { name: /Messages Contact/ })
      
      // Badge should not be visible
      const badge = messagesLink.querySelector('.bg-red-600.rounded-full')
      expect(badge).not.toBeInTheDocument()
    })
  })

  // 5. User Info & Logout Tests
  describe('User Info and Logout', () => {
    it('should display admin user information correctly', () => {
      renderComponent(adminUser)
      
      // Check user avatar initial
      expect(screen.getByText('A')).toBeInTheDocument() // First letter of "Admin Test"
      
      // Check user name and role
      expect(screen.getByText('Admin Test')).toBeInTheDocument()
      expect(screen.getByText('Administrateur')).toBeInTheDocument()
    })

    it('should call logout and navigate home when logout button clicked', async () => {
      renderComponent(adminUser)
      
      const logoutButton = screen.getByRole('button', { name: /Se déconnecter/ })
      expect(logoutButton).toBeInTheDocument()
      
      await user.click(logoutButton)
      
      expect(mockLogout).toHaveBeenCalled()
      expect(mockNavigate).toHaveBeenCalledWith('/')
    })
  })
})