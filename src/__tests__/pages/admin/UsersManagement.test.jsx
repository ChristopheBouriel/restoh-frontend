import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import UsersManagement from '../../../pages/admin/UsersManagement'
import useUsersStore from '../../../store/usersStore'
import * as ordersApi from '../../../api/ordersApi'
import * as reservationsApi from '../../../api/reservationsApi'

// Mock the users store
vi.mock('../../../store/usersStore')

// Mock the API calls
vi.mock('../../../api/ordersApi')
vi.mock('../../../api/reservationsApi')

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
    stats: {
      totalUsers: 3,
      activeUsers: 2,
      inactiveUsers: 1,
      regularUsers: 2,
      newUsers: 1,
      recentlyLoggedUsers: 2,
      activeCustomersLastMonth: 2
    },
    isLoadingStats: false,
    initializeUsers: vi.fn(),
    fetchUsersStats: vi.fn(),
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

    // Don't set default mocks here - let each test define its own
    // This avoids conflicts between beforeEach mocks and test-specific mocks
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
      // Mock API calls for modal
      vi.mocked(ordersApi.getOrdersByUserId).mockResolvedValue({ success: true, orders: [] })
      vi.mocked(reservationsApi.getReservationsByUserId).mockResolvedValue({ success: true, reservations: [] })

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
      // Mock API calls for modal
      vi.mocked(ordersApi.getOrdersByUserId).mockResolvedValue({ success: true, orders: [] })
      vi.mocked(reservationsApi.getReservationsByUserId).mockResolvedValue({ success: true, reservations: [] })

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
      // Mock API calls for modal
      vi.mocked(ordersApi.getOrdersByUserId).mockResolvedValue({ success: true, orders: [] })
      vi.mocked(reservationsApi.getReservationsByUserId).mockResolvedValue({ success: true, reservations: [] })

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
      // Mock API to return realistic data matching Jean Dupont's statistics
      const mockOrders = Array.from({ length: 12 }, (_, i) => ({
        id: `order-${i + 1}`,
        orderNumber: `ORD-${String(i + 1).padStart(3, '0')}`,
        totalPrice: 26.73, // 12 orders * 26.73 ≈ 320.76 (close to 320.75)
        status: 'delivered',
        createdAt: '2024-01-20T12:00:00.000Z',
        items: []
      }))

      const mockReservations = [
        { id: 'res-1', date: '2024-01-20', slot: '19:00', guests: 4, status: 'confirmed' },
        { id: 'res-2', date: '2024-01-22', slot: '20:00', guests: 2, status: 'completed' }
      ]

      vi.mocked(ordersApi.getOrdersByUserId).mockResolvedValue({
        success: true,
        orders: mockOrders
      })

      vi.mocked(reservationsApi.getReservationsByUserId).mockResolvedValue({
        success: true,
        reservations: mockReservations
      })

      renderComponent()

      // Click on Jean Dupont's modal (second user)
      const viewButtons = screen.getAllByTitle('View details')
      await user.click(viewButtons[1])

      await waitFor(() => {
        expect(screen.getByText('Personal information')).toBeInTheDocument()

        // Check user information is displayed
        expect(screen.getAllByText('Jean Dupont').length).toBeGreaterThanOrEqual(1) // Name in modal
        expect(screen.getAllByText('client@example.com').length).toBeGreaterThanOrEqual(1) // Email in modal
        expect(screen.getByText('123 Rue de la République, 75001 Paris')).toBeInTheDocument() // Address

        // Check dynamic statistics are displayed correctly
        expect(screen.getAllByText('12').length).toBeGreaterThanOrEqual(1) // Total orders count
        expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1) // Total reservations count
        // Total spent should be displayed (12 * 26.73 = 320.76) in French format
        expect(screen.getByText('320,76 €')).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('should show email verification status in modal', async () => {
      // Mock API calls for modal
      vi.mocked(ordersApi.getOrdersByUserId).mockResolvedValue({ success: true, orders: [] })
      vi.mocked(reservationsApi.getReservationsByUserId).mockResolvedValue({ success: true, reservations: [] })

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

  // 6. Orders and Reservations in Modal Tests
  describe('Orders and Reservations in Modal', () => {
    const mockOrdersData = [
      {
        id: 'order-1',
        orderNumber: 'ORD-001',
        totalPrice: 45.50,
        status: 'delivered',
        paymentMethod: 'card',
        isPaid: true,
        createdAt: '2024-01-20T12:00:00.000Z',
        items: [
          { id: 'item-1', name: 'Burger', quantity: 2, price: 12.50 },
          { id: 'item-2', name: 'Fries', quantity: 2, price: 5.00 },
          { id: 'item-3', name: 'Soda', quantity: 2, price: 3.00 }
        ]
      },
      {
        id: 'order-2',
        orderNumber: 'ORD-002',
        totalPrice: 32.00,
        status: 'confirmed',
        paymentMethod: 'cash',
        isPaid: false,
        createdAt: '2024-01-21T14:30:00.000Z',
        items: [
          { id: 'item-4', name: 'Pizza', quantity: 1, price: 15.00 },
          { id: 'item-5', name: 'Salad', quantity: 1, price: 8.00 },
          { id: 'item-6', name: 'Water', quantity: 2, price: 2.00 }
        ]
      }
    ]

    const mockReservationsData = [
      {
        id: 'res-1',
        reservationNumber: 'RES-001',
        date: '2024-02-15',
        slot: '19:00',
        guests: 4,
        status: 'confirmed',
        tableNumber: 5,
        specialRequests: 'Window seat please'
      },
      {
        id: 'res-2',
        reservationNumber: 'RES-002',
        date: '2024-02-20',
        slot: '20:30',
        guests: 2,
        status: 'pending',
        tableNumber: null,
        specialRequests: ''
      }
    ]

    it('should display orders list in modal', async () => {
      vi.mocked(ordersApi.getOrdersByUserId).mockResolvedValue({
        success: true,
        orders: mockOrdersData
      })

      vi.mocked(reservationsApi.getReservationsByUserId).mockResolvedValue({
        success: true,
        reservations: []
      })

      renderComponent()

      // Open modal
      const viewButtons = screen.getAllByTitle('View details')
      await user.click(viewButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Personal information')).toBeInTheDocument()
      })

      // Expand orders section
      const ordersButton = screen.getByText(/View Orders \(2\)/i)
      await user.click(ordersButton)

      await waitFor(() => {
        expect(screen.getByText('#ORD-001')).toBeInTheDocument()
        expect(screen.getByText('#ORD-002')).toBeInTheDocument()
        expect(screen.getByText('45,50 €')).toBeInTheDocument()
        expect(screen.getByText('32,00 €')).toBeInTheDocument()
      })
    })

    it('should display reservations list in modal', async () => {
      vi.mocked(ordersApi.getOrdersByUserId).mockResolvedValue({
        success: true,
        orders: []
      })

      vi.mocked(reservationsApi.getReservationsByUserId).mockResolvedValue({
        success: true,
        reservations: mockReservationsData
      })

      renderComponent()

      // Open modal
      const viewButtons = screen.getAllByTitle('View details')
      await user.click(viewButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Personal information')).toBeInTheDocument()
      })

      // Wait for reservations to load
      await waitFor(() => {
        expect(screen.getByText(/View Reservations \(2\)/i)).toBeInTheDocument()
      }, { timeout: 5000 })

      // Expand reservations section
      const reservationsButton = screen.getByText(/View Reservations \(2\)/i)
      await user.click(reservationsButton)

      await waitFor(() => {
        // Check for reservation content (slots and guests)
        expect(screen.getByText(/4 guests/i)).toBeInTheDocument()
      }, { timeout: 5000 })
    })

    it('should show order details when clicking on an order', async () => {
      vi.mocked(ordersApi.getOrdersByUserId).mockResolvedValue({
        success: true,
        orders: mockOrdersData
      })

      vi.mocked(reservationsApi.getReservationsByUserId).mockResolvedValue({
        success: true,
        reservations: []
      })

      renderComponent()

      // Open modal
      const viewButtons = screen.getAllByTitle('View details')
      await user.click(viewButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Personal information')).toBeInTheDocument()
      })

      // Wait for orders to load
      await waitFor(() => {
        expect(screen.getByText(/View Orders \(2\)/i)).toBeInTheDocument()
      }, { timeout: 5000 })

      // Expand orders section
      const ordersButton = screen.getByText(/View Orders \(2\)/i)
      await user.click(ordersButton)

      await waitFor(() => {
        expect(screen.getByText('#ORD-001')).toBeInTheDocument()
      }, { timeout: 5000 })

      // Click on first order card (find the clickable container)
      const orderCards = screen.getAllByText(/ORD-/i)
      const firstOrderCard = orderCards[0].closest('div')
      await user.click(firstOrderCard)

      await waitFor(() => {
        // Check that order detail modal opened with items
        expect(screen.getByText(/Order details/i)).toBeInTheDocument()
        expect(screen.getByText('Burger')).toBeInTheDocument()
      }, { timeout: 5000 })
    })

    it('should show reservation details when clicking on a reservation', async () => {
      vi.mocked(ordersApi.getOrdersByUserId).mockResolvedValue({
        success: true,
        orders: []
      })

      vi.mocked(reservationsApi.getReservationsByUserId).mockResolvedValue({
        success: true,
        reservations: mockReservationsData
      })

      renderComponent()

      // Open modal
      const viewButtons = screen.getAllByTitle('View details')
      await user.click(viewButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Personal information')).toBeInTheDocument()
      })

      // Wait for reservations to load
      await waitFor(() => {
        expect(screen.getByText(/View Reservations \(2\)/i)).toBeInTheDocument()
      }, { timeout: 5000 })

      // Expand reservations section
      const reservationsButton = screen.getByText(/View Reservations \(2\)/i)
      await user.click(reservationsButton)

      // Wait for "User Reservations" heading to appear, indicating section has expanded
      await waitFor(() => {
        expect(screen.getByText('User Reservations')).toBeInTheDocument()
      }, { timeout: 5000 })

      // Wait for the table number to appear (indicates cards are rendered)
      await waitFor(() => {
        expect(screen.getByText('Table 5')).toBeInTheDocument()
      }, { timeout: 5000 })

      // Get all elements with "Table" text and find the one that says "Table 5"
      // Then traverse up to find the card with the border-gray-200 class
      const table5Element = screen.getByText('Table 5')
      const firstReservationCard = table5Element.closest('.border-gray-200')

      expect(firstReservationCard).toBeTruthy()

      // Click the first reservation card
      await user.click(firstReservationCard)

      // First check if the detail modal title appears (there are multiple "Reservation details" texts)
      await waitFor(() => {
        const reservationDetailsElements = screen.getAllByText('Reservation details')
        expect(reservationDetailsElements.length).toBeGreaterThan(0)
      }, { timeout: 5000 })

      // Then check for specific reservation details
      expect(screen.getByText('Window seat please')).toBeInTheDocument()
      // Check for "Table 5" - there will be multiple instances (in list and in detail modal)
      const table5Elements = screen.getAllByText('Table 5')
      expect(table5Elements.length).toBeGreaterThan(1) // At least 2: one in list, one in modal
    }, { timeout: 10000 })

    it('should close order details when clicking close button', async () => {
      vi.mocked(ordersApi.getOrdersByUserId).mockResolvedValue({
        success: true,
        orders: mockOrdersData
      })

      vi.mocked(reservationsApi.getReservationsByUserId).mockResolvedValue({
        success: true,
        reservations: []
      })

      renderComponent()

      // Open modal and orders section
      const viewButtons = screen.getAllByTitle('View details')
      await user.click(viewButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Personal information')).toBeInTheDocument()
      })

      const ordersButton = screen.getByText(/View Orders \(2\)/i)
      await user.click(ordersButton)

      await waitFor(() => {
        expect(screen.getByText('#ORD-001')).toBeInTheDocument()
      })

      // Click on order to view details
      const orderCard = screen.getByText('#ORD-001').closest('div[class*="cursor-pointer"]')
      await user.click(orderCard)

      await waitFor(() => {
        expect(screen.getByText('Burger')).toBeInTheDocument()
      })

      // Close order details
      const closeButtons = screen.getAllByText('×')
      await user.click(closeButtons[closeButtons.length - 1]) // Last × button is for order detail

      await waitFor(() => {
        expect(screen.queryByText('Burger')).not.toBeInTheDocument()
      })
    })

    it('should show empty state when user has no orders', async () => {
      vi.mocked(ordersApi.getOrdersByUserId).mockResolvedValue({
        success: true,
        orders: []
      })

      vi.mocked(reservationsApi.getReservationsByUserId).mockResolvedValue({
        success: true,
        reservations: []
      })

      renderComponent()

      // Open modal
      const viewButtons = screen.getAllByTitle('View details')
      await user.click(viewButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Personal information')).toBeInTheDocument()
      })

      // Expand orders section
      const ordersButton = screen.getByText(/View Orders/i)
      await user.click(ordersButton)

      await waitFor(() => {
        expect(screen.getByText('No orders found')).toBeInTheDocument()
      })
    })

    it('should show empty state when user has no reservations', async () => {
      vi.mocked(ordersApi.getOrdersByUserId).mockResolvedValue({
        success: true,
        orders: []
      })

      vi.mocked(reservationsApi.getReservationsByUserId).mockResolvedValue({
        success: true,
        reservations: []
      })

      renderComponent()

      // Open modal
      const viewButtons = screen.getAllByTitle('View details')
      await user.click(viewButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Personal information')).toBeInTheDocument()
      })

      // Expand reservations section
      const reservationsButton = screen.getByText(/View Reservations/i)
      await user.click(reservationsButton)

      await waitFor(() => {
        expect(screen.getByText('No reservations found')).toBeInTheDocument()
      })
    })

    it('should show loading state while fetching orders and reservations', async () => {
      // Mock delayed API responses - longer delay to catch loading state
      vi.mocked(ordersApi.getOrdersByUserId).mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({ success: true, orders: [] }), 300))
      )

      vi.mocked(reservationsApi.getReservationsByUserId).mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({ success: true, reservations: [] }), 300))
      )

      renderComponent()

      // Open modal
      const viewButtons = screen.getAllByTitle('View details')
      await user.click(viewButtons[0])

      // Wait for modal to open first
      await waitFor(() => {
        expect(screen.getByText('Personal information')).toBeInTheDocument()
      })

      // Check that loading spinner elements are present using animate-spin class
      await waitFor(() => {
        const spinners = document.querySelectorAll('.animate-spin')
        expect(spinners.length).toBeGreaterThan(0)
      }, { timeout: 500 })

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByText(/View Orders/i)).toBeInTheDocument()
        expect(screen.getByText(/View Reservations/i)).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('should handle API errors gracefully', async () => {
      vi.mocked(ordersApi.getOrdersByUserId).mockResolvedValue({
        success: false,
        error: 'Network error',
        orders: []
      })

      vi.mocked(reservationsApi.getReservationsByUserId).mockResolvedValue({
        success: false,
        error: 'Network error',
        reservations: []
      })

      renderComponent()

      // Open modal
      const viewButtons = screen.getAllByTitle('View details')
      await user.click(viewButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Personal information')).toBeInTheDocument()
        // Should show buttons without counts when API fails
        expect(screen.getByText(/View Orders/i)).toBeInTheDocument()
        expect(screen.getByText(/View Reservations/i)).toBeInTheDocument()
      })
    })
  })
})