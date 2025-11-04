import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import UsersManagement from '../../../pages/admin/UsersManagement'
import useUsersStore from '../../../store/usersStore'

// Mock the users store
vi.mock('../../../store/usersStore')

describe('UsersManagement Component', () => {
  const mockUsers = [
    {
      id: 'admin',
      email: 'admin@restoh.fr',
      name: 'Administrator',
      role: 'admin',
      phone: '01 23 45 67 89',
      address: '456 Avenue de l\'Administration, 75008 Paris',
      isActive: true,
      emailVerified: true,
      createdAt: '2024-01-01T10:00:00.000Z',
      lastLogin: '2024-01-30T10:00:00.000Z',
      totalOrders: 5,
      totalSpent: 150.50,
      totalReservations: 3
    },
    {
      id: 'client',
      email: 'client@example.com',
      name: 'Jean Dupont',
      role: 'user',
      phone: '06 12 34 56 78',
      address: '123 Rue de la République, 75001 Paris',
      isActive: true,
      emailVerified: false,
      createdAt: '2024-01-15T14:30:00.000Z',
      lastLogin: '2024-01-25T16:45:00.000Z',
      totalOrders: 12,
      totalSpent: 320.75,
      totalReservations: 2
    },
    {
      id: 'user3',
      email: 'inactive@test.com',
      name: 'User Inactive',
      role: 'user',
      phone: '07 98 76 54 32',
      address: '789 Rue Inactive, 75003 Paris',
      isActive: false,
      emailVerified: true,
      createdAt: '2024-01-10T09:15:00.000Z',
      lastLogin: '2024-01-20T11:30:00.000Z',
      totalOrders: 2,
      totalSpent: 45.20,
      totalReservations: 1
    }
  ]

  const mockStoreState = {
    users: mockUsers,
    isLoading: false,
    initializeUsers: vi.fn(),
    toggleUserStatus: vi.fn(),
    updateUserRole: vi.fn(),
    getUsersStats: vi.fn(() => ({
      total: 3,
      active: 2,
      inactive: 1,
      admins: 1,
      regularUsers: 2,
      verified: 2,
      unverified: 1,
      newThisMonth: 1,
      activeThisMonth: 2
    })),
    searchUsers: vi.fn(),
    getActiveUsers: vi.fn(),
    getInactiveUsers: vi.fn(),
    getUsersByRole: vi.fn()
  }

  const user = userEvent.setup()

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <UsersManagement />
      </MemoryRouter>
    )
  }

  beforeEach(() => {
    vi.clearAllMocks()
    useUsersStore.mockReturnValue(mockStoreState)
  })

  // 1. Core Rendering Tests
  describe('Core Rendering', () => {
    it('should render header, stats, and user list', () => {
      renderComponent()
      
      // Header
      expect(screen.getByText('Users Management')).toBeInTheDocument()
      expect(screen.getByText('Manage all platform users')).toBeInTheDocument()

      // Statistics
      expect(screen.getByText('Total')).toBeInTheDocument()
      expect(screen.getAllByText('Active').length).toBeGreaterThanOrEqual(1)

      // User list with count
      expect(screen.getByText('Users (3)')).toBeInTheDocument()
    })

    it('should initialize users data on mount', () => {
      renderComponent()
      expect(mockStoreState.initializeUsers).toHaveBeenCalledOnce()
    })

    it('should display user information in both desktop and mobile views', () => {
      renderComponent()
      
      // Check that all users are displayed
      expect(screen.getAllByText('admin@restoh.fr')).toHaveLength(2) // Desktop + mobile
      expect(screen.getAllByText('client@example.com')).toHaveLength(2) // Desktop + mobile
      expect(screen.getAllByText('inactive@test.com')).toHaveLength(2) // Desktop + mobile
    })
  })

  // 2. Search Functionality Tests
  describe('Search Functionality', () => {
    it('should filter users by search query (name)', async () => {
      renderComponent()
      
      const searchInput = screen.getByPlaceholderText('Name, email, phone...')
      
      // Search by name - should filter out other users visually
      await user.type(searchInput, 'Jean')
      
      await waitFor(() => {
        // Jean Dupont should be visible (2 instances for desktop + mobile)
        expect(screen.getAllByText('Jean Dupont')).toHaveLength(2)
        // Others should be filtered out (not visible)
        expect(screen.queryByText('Administrator')).not.toBeInTheDocument()
        expect(screen.queryByText('User Inactive')).not.toBeInTheDocument()
      })
    })

    it('should filter users by search query (email)', async () => {
      renderComponent()
      
      const searchInput = screen.getByPlaceholderText('Name, email, phone...')
      
      await user.type(searchInput, 'admin@restoh')
      
      await waitFor(() => {
        expect(screen.getAllByText('admin@restoh.fr')).toHaveLength(2)
        expect(screen.queryByText('client@example.com')).not.toBeInTheDocument()
        expect(screen.queryByText('inactive@test.com')).not.toBeInTheDocument()
      })
    })

    it('should filter users by search query (phone)', async () => {
      renderComponent()
      
      const searchInput = screen.getByPlaceholderText('Name, email, phone...')
      
      await user.type(searchInput, '06 12 34')
      
      await waitFor(() => {
        expect(screen.getAllByText('06 12 34 56 78')).toHaveLength(2)
        expect(screen.queryByText('01 23 45 67 89')).not.toBeInTheDocument()
      })
    })

    it('should show empty state when search returns no results', async () => {
      renderComponent()
      
      const searchInput = screen.getByPlaceholderText('Name, email, phone...')
      await user.type(searchInput, 'nonexistentuser')
      
      await waitFor(() => {
        expect(screen.getByText('No users found with these criteria.')).toBeInTheDocument()
      })
    })

    it('should clear search and show all users when input is cleared', async () => {
      renderComponent()
      
      const searchInput = screen.getByPlaceholderText('Name, email, phone...')
      
      // Search first
      await user.type(searchInput, 'Jean')
      await waitFor(() => {
        expect(screen.getAllByText('Jean Dupont')).toHaveLength(2)
      })
      
      // Clear search
      await user.clear(searchInput)
      
      await waitFor(() => {
        // All users should be visible again
        expect(screen.getAllByText('Jean Dupont').length).toBeGreaterThanOrEqual(2)
        expect(screen.getAllByText('Administrator').length).toBeGreaterThanOrEqual(2) 
        expect(screen.getAllByText('User Inactive').length).toBeGreaterThanOrEqual(2)
      })
    })
  })

  // 3. User Actions Tests
  describe('User Actions', () => {
    it('should toggle user status when action button clicked', async () => {
      mockStoreState.toggleUserStatus.mockResolvedValue({ success: true })
      renderComponent()
      
      // Find toggle button for active admin user (should be "Deactivate" since user is active)
      const toggleButtons = screen.getAllByTitle('Deactivate')
      await user.click(toggleButtons[0])
      
      await waitFor(() => {
        expect(mockStoreState.toggleUserStatus).toHaveBeenCalledWith('admin')
      })
    })

    it('should have role change functionality available', () => {
      renderComponent()
      
      // Verify that role dropdowns exist for users
      const roleDropdowns = screen.getAllByRole('button').filter(button => 
        button.textContent?.includes('Admin') || button.textContent?.includes('User')
      )
      expect(roleDropdowns.length).toBeGreaterThan(0)
      
      // Verify updateUserRole function is available
      expect(mockStoreState.updateUserRole).toBeDefined()
    })

    it('should open user details modal when eye icon is clicked', async () => {
      renderComponent()
      
      // Click on first "View details" button
      const viewButtons = screen.getAllByTitle('View details')
      await user.click(viewButtons[0])
      
      await waitFor(() => {
        expect(screen.getByText('Personal information')).toBeInTheDocument()
        expect(screen.getByText('Personal information')).toBeInTheDocument()
      })
    })

    it('should close modal with close button', async () => {
      renderComponent()
      
      // Open modal first
      const viewButton = screen.getAllByTitle('View details')[0]
      await user.click(viewButton)
      
      await waitFor(() => {
        expect(screen.getByText('Personal information')).toBeInTheDocument()
      })
      
      // Close with "Close" button
      const closeButton = screen.getByText('Close')
      await user.click(closeButton)
      
      await waitFor(() => {
        expect(screen.queryByText('Personal information')).not.toBeInTheDocument()
      })
    })

    it('should close modal with X button', async () => {
      renderComponent()
      
      // Open modal first
      const viewButton = screen.getAllByTitle('View details')[0]
      await user.click(viewButton)
      
      await waitFor(() => {
        expect(screen.getByText('Personal information')).toBeInTheDocument()
      })
      
      // Close with X button
      const xButton = screen.getByText('×')
      await user.click(xButton)
      
      await waitFor(() => {
        expect(screen.queryByText('Personal information')).not.toBeInTheDocument()
      })
    })
  })

  // 4. Modal Content Tests
  describe('Modal Content', () => {
    it('should display comprehensive user information in modal', async () => {
      renderComponent()
      
      // Click on Jean Dupont's modal (second user)
      const viewButtons = screen.getAllByTitle('View details')
      await user.click(viewButtons[1])
      
      await waitFor(() => {
        expect(screen.getByText('Personal information')).toBeInTheDocument()

        // Check user information is displayed
        expect(screen.getAllByText('Jean Dupont').length).toBeGreaterThanOrEqual(2) // Name in table + modal
        expect(screen.getAllByText('client@example.com').length).toBeGreaterThanOrEqual(2) // Email in table + modal
        expect(screen.getByText('123 Rue de la République, 75001 Paris')).toBeInTheDocument() // Address
        expect(screen.getByText('320.75€')).toBeInTheDocument() // Total spent
        // Check statistics are displayed (might appear multiple times)
        expect(screen.getAllByText('12').length).toBeGreaterThanOrEqual(1) // Total orders
        expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1) // Total reservations
      })
    })

    it('should show email verification status in modal', async () => {
      renderComponent()
      
      // Open modal for Jean Dupont (emailVerified: false)
      const viewButtons = screen.getAllByTitle('View details')
      await user.click(viewButtons[1])
      
      await waitFor(() => {
        expect(screen.getByText('Personal information')).toBeInTheDocument()
        expect(screen.getByText('✗ No')).toBeInTheDocument() // Email not verified
      })
    })
  })

  // 5. Edge Cases & State Management
  describe('Edge Cases and State Management', () => {
    it('should handle loading state', () => {
      useUsersStore.mockReturnValue({
        ...mockStoreState,
        isLoading: true
      })
      
      renderComponent()
      
      // Component should still render with loading state
      expect(screen.getByText('Users Management')).toBeInTheDocument()
    })

    it('should handle empty user list', () => {
      useUsersStore.mockReturnValue({
        ...mockStoreState,
        users: [],
        getUsersStats: vi.fn(() => ({
          total: 0,
          active: 0,
          inactive: 0,
          admins: 0,
          regularUsers: 0,
          verified: 0,
          unverified: 0,
          newThisMonth: 0,
          activeThisMonth: 0
        }))
      })
      
      renderComponent()
      
      expect(screen.getByText('Users (0)')).toBeInTheDocument()
      expect(screen.getByText('No users found with these criteria.')).toBeInTheDocument()
    })

    it('should handle toggle status errors gracefully', async () => {
      mockStoreState.toggleUserStatus.mockResolvedValue({ 
        success: false, 
        error: 'Network error' 
      })
      
      renderComponent()
      
      const toggleButton = screen.getAllByTitle('Deactivate')[0]
      await user.click(toggleButton)
      
      // Should still call the function even if it fails
      await waitFor(() => {
        expect(mockStoreState.toggleUserStatus).toHaveBeenCalled()
      })
    })

    it('should display correct user counts and statistics', () => {
      renderComponent()
      
      // Check statistics display
      expect(screen.getByText('3')).toBeInTheDocument() // Total
      expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1) // Active count 
      expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(1) // Admins count
      
      // Check user count in header
      expect(screen.getByText(`Users (${mockUsers.length})`)).toBeInTheDocument()
    })
  })
})