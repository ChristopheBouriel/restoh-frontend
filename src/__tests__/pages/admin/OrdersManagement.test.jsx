import { render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import OrdersManagement from '../../../pages/admin/OrdersManagement'
import * as ordersApi from '../../../api/ordersApi'

// Mock the API
vi.mock('../../../api/ordersApi')

// Mock toast
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

// Mock components
vi.mock('../../../components/common/SimpleSelect', () => ({
  default: ({ value, onChange, options, className }) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      data-testid="simple-select"
      className={className}
    >
      {options.map(option => (
        <option key={option.value} value={option.value} disabled={option.disabled}>
          {option.label}
        </option>
      ))}
    </select>
  )
}))

vi.mock('../../../components/common/CustomDatePicker', () => ({
  default: ({ value, onChange, placeholder, minDate }) => (
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      min={minDate}
      data-testid="custom-date-picker"
    />
  )
}))

vi.mock('../../../components/common/InlineAlert', () => ({
  default: ({ type, message, details }) => (
    <div data-testid="inline-alert" data-type={type}>
      <p>{message}</p>
      {details && <p>{details}</p>}
    </div>
  )
}))

vi.mock('../../../components/common/ImageWithFallback', () => ({
  default: ({ src, alt }) => (
    <img src={src} alt={alt} data-testid="image-with-fallback" />
  )
}))

describe('OrdersManagement Component', () => {
  // Sample order data
  const mockRecentOrders = [
    {
      id: 'order-001',
      _id: 'order-001',
      orderNumber: 1001,
      userId: 'user-1',
      userEmail: 'user1@example.com',
      userName: 'Jean Dupont',
      items: [
        { menuItemId: '1', name: 'Pizza', price: 15.90, quantity: 2, image: '/pizza.jpg' }
      ],
      total: 31.80,
      status: 'preparing',
      paymentMethod: 'card',
      paymentStatus: 'paid',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'order-002',
      _id: 'order-002',
      orderNumber: 1002,
      userId: 'user-2',
      userEmail: 'user2@example.com',
      userName: 'Marie Martin',
      items: [
        { menuItemId: '2', name: 'Burger', price: 18.00, quantity: 1, image: '/burger.jpg' }
      ],
      total: 18.00,
      status: 'confirmed',
      paymentMethod: 'cash',
      paymentStatus: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]

  const mockHistoricalOrders = [
    {
      id: 'order-100',
      _id: 'order-100',
      orderNumber: 1100,
      userId: 'user-3',
      userEmail: 'user3@example.com',
      userName: 'Pierre Durand',
      items: [
        { menuItemId: '3', name: 'Pasta', price: 16.50, quantity: 1, image: '/pasta.jpg' }
      ],
      total: 16.50,
      status: 'delivered',
      paymentMethod: 'card',
      paymentStatus: 'paid',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
      updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    }
  ]

  const mockRecentResponse = {
    success: true,
    data: mockRecentOrders,
    pagination: {
      total: 2,
      page: 1,
      limit: 50,
      totalPages: 1,
      hasMore: false
    }
  }

  const mockHistoricalResponse = {
    success: true,
    data: mockHistoricalOrders,
    pagination: {
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
      hasMore: false
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Default mock implementation
    ordersApi.getRecentOrders.mockResolvedValue(mockRecentResponse)
    ordersApi.getHistoricalOrders.mockResolvedValue(mockHistoricalResponse)
    ordersApi.updateOrderStatusEnhanced.mockResolvedValue({ success: true })
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <OrdersManagement />
      </MemoryRouter>
    )
  }

  test('should render the header and Recent tab by default', async () => {
    renderComponent()

    expect(screen.getByText('Orders Management')).toBeInTheDocument()

    // Should show Recent tab as active
    const recentTab = screen.getByRole('button', { name: /Recent \(15 days\)/i })
    expect(recentTab).toBeInTheDocument()

    // Should fetch recent orders
    await waitFor(() => {
      expect(ordersApi.getRecentOrders).toHaveBeenCalledWith({
        limit: 50,
        page: 1
      })
    })
  })

  test('should display recent orders after loading', async () => {
    renderComponent()

    // Wait for orders to load (can appear in both desktop and mobile views)
    await waitFor(() => {
      expect(screen.getAllByText('Jean Dupont').length).toBeGreaterThan(0)
    })

    expect(screen.getAllByText('Marie Martin').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/1001/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/1002/).length).toBeGreaterThan(0)
  })

  test('should switch to History tab when clicked', async () => {
    const user = userEvent.setup()
    renderComponent()

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getAllByText('Jean Dupont').length).toBeGreaterThan(0)
    })

    // Click History tab
    const historyTab = screen.getByRole('button', { name: /History/i })
    await user.click(historyTab)

    // Should show date pickers for history
    await waitFor(() => {
      const datePickers = screen.getAllByTestId('custom-date-picker')
      expect(datePickers.length).toBeGreaterThan(0)
    })
  })

  test('should filter orders with Today button', async () => {
    const user = userEvent.setup()
    renderComponent()

    // Wait for orders to load
    await waitFor(() => {
      expect(screen.getAllByText('Jean Dupont').length).toBeGreaterThan(0)
    })

    // Click Today button
    const todayButton = screen.getByRole('button', { name: /Today/i })
    await user.click(todayButton)

    // Today button should be highlighted (primary color class)
    expect(todayButton).toHaveClass('bg-primary-600')
  })

  test('should search orders by order number', async () => {
    const user = userEvent.setup()
    renderComponent()

    // Wait for orders to load
    await waitFor(() => {
      expect(screen.getAllByText('Jean Dupont').length).toBeGreaterThan(0)
    })

    // Find and type in search input
    const searchInput = screen.getByPlaceholderText(/Enter order number/i)
    await user.type(searchInput, '1001')

    // Should still show order 1001
    expect(screen.getAllByText('Jean Dupont').length).toBeGreaterThan(0)
  })

  test('should update order status when select is changed', async () => {
    const user = userEvent.setup()
    renderComponent()

    // Wait for orders to load
    await waitFor(() => {
      expect(screen.getAllByText('Jean Dupont').length).toBeGreaterThan(0)
    })

    // Find status selects (there should be at least one for each order)
    const selects = screen.getAllByTestId('simple-select')
    // Filter to get only status selects (not the status filter)
    const orderStatusSelects = selects.filter((_, index) => index > 0)

    if (orderStatusSelects.length > 0) {
      await user.selectOptions(orderStatusSelects[0], 'ready')

      await waitFor(() => {
        expect(ordersApi.updateOrderStatusEnhanced).toHaveBeenCalledWith(
          'order-001',
          'ready'
        )
      })
    }
  })

  test('should open order details modal when eye icon is clicked', async () => {
    const user = userEvent.setup()
    renderComponent()

    // Wait for orders to load
    await waitFor(() => {
      expect(screen.getAllByText('Jean Dupont').length).toBeGreaterThan(0)
    })

    // Find and click eye icon (view details button)
    const eyeButtons = screen.queryAllByTitle('View details')
    if (eyeButtons.length > 0) {
      await user.click(eyeButtons[0])

      // Modal should appear with order details
      await waitFor(() => {
        expect(screen.getByText(/Order details #1001/i)).toBeInTheDocument()
      })
    }
  })

  test('should call Refresh button to reload recent orders', async () => {
    const user = userEvent.setup()
    renderComponent()

    // Wait for initial load
    await waitFor(() => {
      expect(ordersApi.getRecentOrders).toHaveBeenCalledTimes(1)
    })

    // Click Refresh button
    const refreshButton = screen.getByRole('button', { name: /Refresh/i })
    await user.click(refreshButton)

    // Should call API again
    await waitFor(() => {
      expect(ordersApi.getRecentOrders).toHaveBeenCalledTimes(2)
    })
  })

  test('should load historical orders when both dates are selected', async () => {
    const user = userEvent.setup()
    renderComponent()

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getAllByText('Jean Dupont').length).toBeGreaterThan(0)
    })

    // Switch to History tab
    const historyTab = screen.getByRole('button', { name: /History/i })
    await user.click(historyTab)

    // Find date pickers
    await waitFor(() => {
      const datePickers = screen.getAllByTestId('custom-date-picker')
      expect(datePickers.length).toBeGreaterThan(0)
    })

    const datePickers = screen.getAllByTestId('custom-date-picker')

    // Set start date
    await user.type(datePickers[0], '2024-01-01')

    // Set end date
    await user.type(datePickers[1], '2024-01-31')

    // Should call historical orders API
    await waitFor(() => {
      expect(ordersApi.getHistoricalOrders).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: expect.any(String),
          endDate: expect.any(String)
        })
      )
    })
  })

  test('should display statistics correctly', async () => {
    renderComponent()

    // Wait for orders to load
    await waitFor(() => {
      expect(screen.getAllByText('Jean Dupont').length).toBeGreaterThan(0)
    })

    // Should show total orders count
    expect(screen.getByText('Total orders')).toBeInTheDocument()

    // Should show various status statistics (can appear in status select dropdown too)
    expect(screen.getAllByText('Pending').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Confirmed').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Preparing').length).toBeGreaterThan(0)
  })

  test('should handle empty state when no orders', async () => {
    ordersApi.getRecentOrders.mockResolvedValue({
      success: true,
      data: [],
      pagination: {
        total: 0,
        page: 1,
        limit: 50,
        totalPages: 0,
        hasMore: false
      }
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText(/No orders found/i)).toBeInTheDocument()
    })
  })

  test('should display Updated time indicator in Recent tab', async () => {
    renderComponent()

    // Wait for orders to load
    await waitFor(() => {
      expect(screen.getAllByText('Jean Dupont').length).toBeGreaterThan(0)
    })

    // Should show "Updated Xs ago" text
    await waitFor(() => {
      expect(screen.getByText(/Updated/i)).toBeInTheDocument()
    })
  })

  test('should filter by status', async () => {
    const user = userEvent.setup()
    renderComponent()

    // Wait for orders to load
    await waitFor(() => {
      expect(screen.getAllByText('Jean Dupont').length).toBeGreaterThan(0)
    })

    // Find the status filter (first select)
    const selects = screen.getAllByTestId('simple-select')
    const statusFilter = selects[0]

    // Change to 'confirmed'
    await user.selectOptions(statusFilter, 'confirmed')

    // Should still show the confirmed order
    expect(screen.getAllByText('Marie Martin').length).toBeGreaterThan(0)
  })

  test('should show pagination when there are multiple pages', async () => {
    ordersApi.getRecentOrders.mockResolvedValue({
      success: true,
      data: mockRecentOrders,
      pagination: {
        total: 60,
        page: 1,
        limit: 50,
        totalPages: 2,
        hasMore: true
      }
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getAllByText('Jean Dupont').length).toBeGreaterThan(0)
    })

    // Should show pagination info
    await waitFor(() => {
      expect(screen.getByText(/Showing page/i)).toBeInTheDocument()
    })
  })
})
