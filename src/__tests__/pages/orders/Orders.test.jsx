import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, test, expect, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import Orders from '../../../pages/orders/Orders'
import { useOrders } from '../../../hooks/useOrders'
import useOrdersStore from '../../../store/ordersStore'

// Mock data
const mockOrders = [
  {
    id: '1',
    orderNumber: 'ORD-001',
    status: 'delivered',
    createdAt: '2024-01-15T10:30:00Z',
    totalPrice: 28.50,
    items: [
      { name: 'Pizza Margherita', quantity: 1, price: 12.50 },
      { name: 'Tiramisu', quantity: 2, price: 8.00 }
    ],
    deliveryAddress: {
      street: '123 Rue de la Paix',
      city: 'Paris',
      zipCode: '75001'
    },
    orderType: 'delivery',
    phone: '0123456789',
    paymentMethod: 'card',
    paymentStatus: 'paid',
    specialInstructions: 'Sonnez au 2ème étage'
  },
  {
    id: '2',
    orderNumber: 'ORD-002',
    status: 'preparing',
    createdAt: '2024-01-20T14:15:00Z',
    totalPrice: 45.00,
    items: [
      { name: 'Spaghetti Carbonara', quantity: 2, price: 14.00 },
      { name: 'Salade César', quantity: 1, price: 9.50 },
      { name: 'Panna Cotta', quantity: 1, price: 7.50 }
    ],
    deliveryAddress: {
      street: '456 Avenue des Champs',
      city: 'Lyon',
      zipCode: '69000'
    },
    orderType: 'delivery',
    phone: '0987654321',
    paymentMethod: 'cash',
    paymentStatus: 'pending'
  },
  {
    id: '3',
    orderNumber: 'ORD-003',
    status: 'pending',
    createdAt: '2024-01-22T16:45:00Z',
    totalPrice: 19.50,
    items: [
      { name: 'Pizza Pepperoni', quantity: 1, price: 15.50 },
      { name: 'Coca Cola', quantity: 1, price: 4.00 }
    ],
    deliveryAddress: {
      street: '789 Boulevard Saint-Germain',
      city: 'Paris',
      zipCode: '75006'
    },
    orderType: 'delivery',
    phone: '0147258369',
    paymentMethod: 'cash',
    paymentStatus: 'pending',
    notes: 'Delivery rapide svp'
  },
  {
    id: '4',
    orderNumber: 'ORD-004',
    status: 'cancelled',
    createdAt: '2024-01-18T12:20:00Z',
    totalPrice: 32.00,
    items: [
      { name: 'Lasagnes', quantity: 1, price: 16.50 },
      { name: 'Bruschetta', quantity: 2, price: 7.75 }
    ],
    deliveryAddress: {
      street: '321 Rue de Rivoli',
      city: 'Paris',
      zipCode: '75001'
    },
    orderType: 'delivery',
    paymentMethod: 'cash',
    paymentStatus: 'pending'
  }
]

// Mock hooks
vi.mock('../../../hooks/useOrders')
vi.mock('../../../store/ordersStore')

const mockCancelOrder = vi.fn()
const mockFetchOrders = vi.fn()

// Test wrapper component
const OrdersWrapper = () => (
  <MemoryRouter initialEntries={['/orders']}>
    <Orders />
  </MemoryRouter>
)

describe('Orders Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default mock setup
    vi.mocked(useOrders).mockReturnValue({
      orders: mockOrders,
      cancelOrder: mockCancelOrder,
      canCancelOrder: (order) => {
        const allowedStatuses = ['pending', 'confirmed']
        const isAllowedStatus = allowedStatuses.includes(order.status)
        const isNotPaid = order.paymentStatus !== 'paid'
        return isAllowedStatus && isNotPaid
      },
      formatPrice: (price) => `${price.toFixed(2)}€`,
      formatDate: (dateStr) => new Date(dateStr).toLocaleDateString('fr-FR')
    })
    
    vi.mocked(useOrdersStore).mockReturnValue({
      fetchOrders: mockFetchOrders
    })
  })

  // 1. BASIC RENDERING (3 tests)
  test('should render header and description', () => {
    render(<OrdersWrapper />)

    expect(screen.getByText('My Orders')).toBeInTheDocument()
    expect(screen.getByText('Track the status of your orders')).toBeInTheDocument()
  })

  test('should render all filter buttons for order statuses', () => {
    render(<OrdersWrapper />)
    
    expect(screen.getByRole('button', { name: 'All orders' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pending' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirmed' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Preparing' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ready' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delivered' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancelled' })).toBeInTheDocument()
  })

  test('should call fetchOrders on component mount', () => {
    render(<OrdersWrapper />)
    
    expect(mockFetchOrders).toHaveBeenCalledTimes(1)
  })

  // 2. ORDER DISPLAY (3 tests)
  test('should display order cards with essential information', () => {
    render(<OrdersWrapper />)
    
    // Check order IDs
    expect(screen.getByText('Command #ORD-001')).toBeInTheDocument()
    expect(screen.getByText('Command #ORD-002')).toBeInTheDocument()
    expect(screen.getByText('Command #ORD-003')).toBeInTheDocument()
    
    // Check order totals
    expect(screen.getByText('28.50€')).toBeInTheDocument()
    expect(screen.getByText('45.00€')).toBeInTheDocument()
    expect(screen.getByText('19.50€')).toBeInTheDocument()
    
    // Check order items display
    expect(screen.getByText(/Pizza Margherita, Tiramisu x2/)).toBeInTheDocument()
    expect(screen.getByText(/Spaghetti Carbonara x2, Salade César, Panna Cotta/)).toBeInTheDocument()
  })

  test('should show correct status badges with proper styling', () => {
    render(<OrdersWrapper />)
    
    // Check that status badges exist by looking for specific CSS classes
    expect(document.querySelector('.text-green-600.bg-green-50')).toBeInTheDocument()
    expect(document.querySelector('.text-yellow-600.bg-yellow-50')).toBeInTheDocument()
    expect(document.querySelector('.text-orange-600.bg-orange-50')).toBeInTheDocument()
    expect(document.querySelector('.text-red-600.bg-red-50')).toBeInTheDocument()
    
    // Check that the badges contain the expected text
    const deliveredBadge = document.querySelector('.text-green-600.bg-green-50')
    expect(deliveredBadge).toHaveTextContent('Delivered')
    
    const preparingBadge = document.querySelector('.text-yellow-600.bg-yellow-50')
    expect(preparingBadge).toHaveTextContent('Preparing')
  })

  test('should format prices and dates correctly', () => {
    render(<OrdersWrapper />)
    
    // Check formatted dates (mocked to return French locale)
    const formattedDates = screen.getAllByText(/\d{2}\/\d{2}\/\d{4}/)
    expect(formattedDates.length).toBeGreaterThan(0)
    
    // Check formatted prices with euro symbol
    expect(screen.getByText('28.50€')).toBeInTheDocument()
    expect(screen.getByText('45.00€')).toBeInTheDocument()
    expect(screen.getByText('19.50€')).toBeInTheDocument()
  })

  // 3. STATUS FILTERING (3 tests)
  test('should filter orders by status when filter buttons are clicked', async () => {
    const user = userEvent.setup()
    render(<OrdersWrapper />)
    
    // Click on "Delivered" filter
    await user.click(screen.getByRole('button', { name: 'Delivered' }))
    
    // Should only show delivered orders
    expect(screen.getByText('Command #ORD-001')).toBeInTheDocument()
    expect(screen.queryByText('Command #ORD-002')).not.toBeInTheDocument()
    expect(screen.queryByText('Command #ORD-003')).not.toBeInTheDocument()
  })

  test('should show all orders when "All orders" is selected', async () => {
    const user = userEvent.setup()
    render(<OrdersWrapper />)
    
    // First filter by delivered orders
    await user.click(screen.getByRole('button', { name: 'Delivered' }))
    expect(screen.queryByText('Command #ORD-002')).not.toBeInTheDocument()

    // Then click "All orders"
    await user.click(screen.getByRole('button', { name: 'All orders' }))

    // Should show all orders again
    expect(screen.getByText('Command #ORD-001')).toBeInTheDocument()
    expect(screen.getByText('Command #ORD-002')).toBeInTheDocument()
    expect(screen.getByText('Command #ORD-003')).toBeInTheDocument()
  })

  test('should update active filter button styling correctly', async () => {
    const user = userEvent.setup()
    render(<OrdersWrapper />)

    const allOrdersButton = screen.getByRole('button', { name: 'All orders' })
    const deliveredButton = screen.getByRole('button', { name: 'Delivered' })

    // Initially "All orders" should be active
    expect(allOrdersButton).toHaveClass('bg-primary-600', 'text-white')
    expect(deliveredButton).toHaveClass('bg-primary-400', 'text-white')

    // Click delivered filter
    await user.click(deliveredButton)

    // Styling should switch
    expect(deliveredButton).toHaveClass('bg-primary-600', 'text-white')
    expect(allOrdersButton).toHaveClass('bg-primary-400', 'text-white')
  })

  // 4. ORDER DETAILS EXPANSION (2 tests)
  test('should toggle order details when "View details" button is clicked', async () => {
    const user = userEvent.setup()
    render(<OrdersWrapper />)

    const detailsButtons = screen.getAllByText('View details')

    // Initially, details should not be visible
    expect(screen.queryByText('Order details')).not.toBeInTheDocument()

    // Click to show details
    await user.click(detailsButtons[0])
    expect(screen.getByText('Order details')).toBeInTheDocument()
    expect(screen.getByText('Hide')).toBeInTheDocument()

    // Click to hide details
    await user.click(screen.getByText('Hide'))
    expect(screen.queryByText('Order details')).not.toBeInTheDocument()
  })

  test('should show detailed order breakdown when expanded', async () => {
    const user = userEvent.setup()
    render(<OrdersWrapper />)

    const detailsButtons = screen.getAllByText('View details')
    await user.click(detailsButtons[0])

    // Should show order items breakdown
    expect(screen.getByText('Pizza Margherita x1')).toBeInTheDocument()
    expect(screen.getByText('Tiramisu x2')).toBeInTheDocument()

    // Should show delivery information with new address format
    expect(screen.getByText('Address:')).toBeInTheDocument()
    expect(screen.getByText('123 Rue de la Paix')).toBeInTheDocument()
    expect(screen.getByText('75001 Paris')).toBeInTheDocument()
    expect(screen.getByText('Phone:')).toBeInTheDocument()
    expect(screen.getByText('0123456789')).toBeInTheDocument()
    expect(screen.getByText(/Card/)).toBeInTheDocument()
    expect(screen.getByText('Sonnez au 2ème étage')).toBeInTheDocument()
  })

  // 5. ORDER ACTIONS (3 tests)
  test('should show cancel button for all orders but disabled for non-cancelable ones', () => {
    render(<OrdersWrapper />)

    // Check that cancel button appears for all orders (4 total)
    const cancelButtons = screen.getAllByText('Cancel')
    expect(cancelButtons).toHaveLength(4)

    // Check that only order 3 (pending + not paid) has an enabled cancel button
    const enabledButtons = cancelButtons.filter(btn => !btn.closest('button').disabled)
    expect(enabledButtons).toHaveLength(1) // Only order 3 (pending + not paid)
  })

  test('should call cancelOrder function when cancel button is clicked', async () => {
    const user = userEvent.setup()
    render(<OrdersWrapper />)

    // Find the enabled cancel button (order 3 - pending + not paid)
    const cancelButtons = screen.getAllByText('Cancel')
    const enabledButton = cancelButtons.find(btn => !btn.closest('button').disabled)

    await user.click(enabledButton)

    expect(mockCancelOrder).toHaveBeenCalledTimes(1)
    expect(mockCancelOrder).toHaveBeenCalledWith('3') // order 3 ID
  })

  // 6. EMPTY STATE (1 test)
  test('should show empty state when no orders match filters', async () => {
    const user = userEvent.setup()
    
    // Mock empty orders
    vi.mocked(useOrders).mockReturnValue({
      orders: [],
      cancelOrder: mockCancelOrder,
      canCancelOrder: () => false,
      formatPrice: (price) => `${price.toFixed(2)}€`,
      formatDate: (dateStr) => new Date(dateStr).toLocaleDateString('fr-FR')
    })
    
    render(<OrdersWrapper />)
    
    // Should show empty state
    expect(screen.getByText('No orders found')).toBeInTheDocument()
    expect(screen.getByText('You haven\'t placed any orders with these filters yet.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Discover the menu' })).toBeInTheDocument()
  })

  // 7. LOADING STATE (1 test)  
  test('should handle orders data properly when provided', () => {
    render(<OrdersWrapper />)
    
    // Should display all orders when data is available
    expect(screen.getByText('Command #ORD-001')).toBeInTheDocument()
    expect(screen.getByText('Command #ORD-002')).toBeInTheDocument()
    expect(screen.getByText('Command #ORD-003')).toBeInTheDocument()
    expect(screen.getByText('Command #ORD-004')).toBeInTheDocument()
    
    // Should not show empty state
    expect(screen.queryByText('No orders found')).not.toBeInTheDocument()
  })
})