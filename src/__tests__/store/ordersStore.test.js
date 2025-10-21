import { beforeEach, describe, expect, test, vi, beforeAll } from 'vitest'
import useOrdersStore from '../../store/ordersStore'

// Mock ordersApi
vi.mock('../../api/ordersApi', () => ({
  getUserOrders: vi.fn(),
  getAllOrders: vi.fn(),
  getOrderById: vi.fn(),
  createOrder: vi.fn(),
  updateOrderStatus: vi.fn(),
  deleteOrder: vi.fn()
}))

// Get mocked functions via dynamic import
let mockGetUserOrders, mockGetAllOrders, mockGetOrderById, mockCreateOrder, mockUpdateOrderStatus, mockDeleteOrder

beforeAll(async () => {
  const ordersApi = await import('../../api/ordersApi')
  mockGetUserOrders = ordersApi.getUserOrders
  mockGetAllOrders = ordersApi.getAllOrders
  mockGetOrderById = ordersApi.getOrderById
  mockCreateOrder = ordersApi.createOrder
  mockUpdateOrderStatus = ordersApi.updateOrderStatus
  mockDeleteOrder = ordersApi.deleteOrder
})

// Mock console.log to avoid noise in tests
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {})

// Mock data for testing
const mockOrderData = {
  userId: 'test-user',
  userEmail: 'test@example.com',
  userName: 'Test User',
  deliveryAddress: '123 Test Street',
  phone: '06 12 34 56 78',
  items: [
    { id: 1, name: 'Pizza Test', price: 15.90, quantity: 1, image: 'pizza.jpg' }
  ],
  totalPrice: 15.90,
  notes: 'Test order'
}

const mockExistingOrders = [
  {
    id: 'order-001',
    userId: 'user1',
    userEmail: 'user1@test.com',
    userName: 'User 1',
    deliveryAddress: '123 Street',
    phone: '0123456789',
    items: [{ id: 1, name: 'Pizza', price: 15.00, quantity: 1 }],
    totalPrice: 15.00,
    status: 'delivered',
    paymentMethod: 'card',
    paymentStatus: 'paid',
    createdAt: '2024-01-20T10:00:00Z',
    updatedAt: '2024-01-20T12:00:00Z',
    notes: 'Delivered successfully'
  },
  {
    id: 'order-002',
    userId: 'user1',
    userEmail: 'user1@test.com',
    userName: 'User 1',
    deliveryAddress: '123 Street',
    phone: '0123456789',
    items: [{ id: 2, name: 'Burger', price: 18.00, quantity: 1 }],
    totalPrice: 18.00,
    status: 'preparing',
    paymentMethod: 'cash',
    paymentStatus: 'pending',
    createdAt: '2024-01-21T14:30:00Z',
    updatedAt: '2024-01-21T14:30:00Z',
    notes: 'Cash payment pending'
  },
  {
    id: 'order-003',
    userId: 'user2',
    userEmail: 'user2@test.com',
    userName: 'User 2',
    deliveryAddress: '456 Avenue',
    phone: '0987654321',
    items: [{ id: 3, name: 'Pasta', price: 16.50, quantity: 1 }],
    totalPrice: 16.50,
    status: 'cancelled',
    paymentMethod: 'card',
    paymentStatus: 'paid',
    createdAt: '2024-01-19T09:15:00Z',
    updatedAt: '2024-01-19T11:00:00Z',
    notes: 'Cancelled by customer'
  }
]

describe('ordersStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Reset store state
    useOrdersStore.setState({
      orders: [],
      isLoading: false,
      error: null
    })

    mockConsoleLog.mockClear()

    // Reset API mocks with default success responses
    mockGetUserOrders.mockResolvedValue({
      success: true,
      data: []
    })
    mockGetAllOrders.mockResolvedValue({
      success: true,
      data: mockExistingOrders
    })
    mockGetOrderById.mockResolvedValue({
      success: true,
      data: mockExistingOrders[0]
    })
    mockCreateOrder.mockResolvedValue({
      success: true,
      data: { _id: 'order-123', id: 'order-123', status: 'pending', isPaid: false }
    })
    mockUpdateOrderStatus.mockResolvedValue({
      success: true,
      data: { id: 'order-123', status: 'confirmed' }
    })

    // Mock Date.now for consistent order IDs
    vi.setSystemTime(new Date('2024-01-30T15:00:00Z'))
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // 1. INITIAL STATE & FETCH ORDERS (3 tests)
  test('should initialize with empty orders by default', () => {
    const store = useOrdersStore.getState()

    expect(store.orders).toEqual([])
    expect(store.isLoading).toBe(false)
    expect(store.error).toBeNull()
  })

  test('should fetch user orders successfully', async () => {
    mockGetUserOrders.mockResolvedValue({
      success: true,
      data: [mockExistingOrders[0]]
    })

    const store = useOrdersStore.getState()
    const result = await store.fetchOrders(false) // false = not admin

    const state = useOrdersStore.getState()
    expect(mockGetUserOrders).toHaveBeenCalled()
    expect(result.success).toBe(true)
    expect(state.orders).toHaveLength(1)
    expect(state.orders[0].id).toBe('order-001')
  })

  test('should fetch all orders as admin successfully', async () => {
    const store = useOrdersStore.getState()
    const result = await store.fetchOrders(true) // true = admin

    const state = useOrdersStore.getState()
    expect(mockGetAllOrders).toHaveBeenCalled()
    expect(result.success).toBe(true)
    expect(state.orders).toHaveLength(3)
    expect(state.orders).toEqual(mockExistingOrders)
  })

  // 2. CREATE ORDERS & BUSINESS LOGIC (3 tests)
  test('should create order successfully and add to store', async () => {
    const newOrder = { _id: 'order-new', status: 'pending', isPaid: true, totalPrice: 25.50 }
    mockCreateOrder.mockResolvedValue({
      success: true,
      data: newOrder
    })

    const store = useOrdersStore.getState()
    const cardOrderData = { ...mockOrderData, paymentMethod: 'card' }
    const result = await store.createOrder(cardOrderData)

    expect(mockCreateOrder).toHaveBeenCalledWith(cardOrderData)
    expect(result.success).toBe(true)
    expect(result.orderId).toBe('order-new')

    const state = useOrdersStore.getState()
    expect(state.isLoading).toBe(false)
    expect(state.orders).toHaveLength(1)
    // Check normalized fields (_id should be removed, id should be set)
    expect(state.orders[0]).toMatchObject({
      id: 'order-new',
      status: 'pending',
      isPaid: true,
      totalPrice: 25.50
    })
    // Ensure _id is removed from normalized data
    expect(state.orders[0]._id).toBeUndefined()
  })

  test('should handle order creation errors gracefully', async () => {
    mockCreateOrder.mockResolvedValue({
      success: false,
      error: 'Order creation failed'
    })

    const store = useOrdersStore.getState()
    const result = await store.createOrder(mockOrderData)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Order creation failed')

    const state = useOrdersStore.getState()
    expect(state.error).toBe('Order creation failed')
    expect(state.isLoading).toBe(false)
  })

  test('should handle network errors during order creation', async () => {
    mockCreateOrder.mockRejectedValue(new Error('Network error'))

    const store = useOrdersStore.getState()
    const result = await store.createOrder(mockOrderData)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Error creating order')

    const state = useOrdersStore.getState()
    expect(state.error).toBe('Error creating order')
    expect(state.isLoading).toBe(false)
  })

  // 3. UPDATE ORDER STATUS (3 tests)
  test('should update order status successfully and reload orders', async () => {
    // Mock successful update
    mockUpdateOrderStatus.mockResolvedValue({
      success: true,
      data: { id: 'order-002', status: 'ready' }
    })

    // Mock fetchOrders to return updated orders
    mockGetAllOrders.mockResolvedValue({
      success: true,
      data: mockExistingOrders.map(o =>
        o.id === 'order-002' ? { ...o, status: 'ready' } : o
      )
    })

    const store = useOrdersStore.getState()
    const result = await store.updateOrderStatus('order-002', 'ready')

    expect(mockUpdateOrderStatus).toHaveBeenCalledWith('order-002', 'ready')
    expect(mockGetAllOrders).toHaveBeenCalled() // fetchOrders(true) called after update
    expect(result.success).toBe(true)

    const state = useOrdersStore.getState()
    expect(state.isLoading).toBe(false)
  })

  test('should handle status update errors gracefully', async () => {
    mockUpdateOrderStatus.mockResolvedValue({
      success: false,
      error: 'Update failed'
    })

    const store = useOrdersStore.getState()
    const result = await store.updateOrderStatus('order-001', 'cancelled')

    expect(result.success).toBe(false)
    expect(result.error).toBe('Update failed')

    const state = useOrdersStore.getState()
    expect(state.error).toBe('Update failed')
    expect(state.isLoading).toBe(false)
  })

  test('should handle network errors during status update', async () => {
    mockUpdateOrderStatus.mockRejectedValue(new Error('Network error'))

    const store = useOrdersStore.getState()
    const result = await store.updateOrderStatus('order-001', 'confirmed')

    expect(result.success).toBe(false)
    expect(result.error).toBe('Error updating status')

    const state = useOrdersStore.getState()
    expect(state.error).toBe('Error updating status')
    expect(state.isLoading).toBe(false)
  })

  // 3bis. DELETE ORDER (3 tests)
  test('should delete order successfully and remove from state', async () => {
    // Set initial orders
    useOrdersStore.setState({ orders: mockExistingOrders })

    // Mock successful deletion
    mockDeleteOrder.mockResolvedValue({
      success: true,
      message: 'Order deleted'
    })

    const store = useOrdersStore.getState()
    const result = await store.deleteOrder('order-002')

    expect(mockDeleteOrder).toHaveBeenCalledWith('order-002')
    expect(result.success).toBe(true)

    const state = useOrdersStore.getState()
    expect(state.orders).toHaveLength(2)
    expect(state.orders.find(o => o.id === 'order-002')).toBeUndefined()
    expect(state.isLoading).toBe(false)
  })

  test('should handle delete errors gracefully', async () => {
    mockDeleteOrder.mockResolvedValue({
      success: false,
      error: 'Delete failed'
    })

    const store = useOrdersStore.getState()
    const result = await store.deleteOrder('order-001')

    expect(result.success).toBe(false)
    expect(result.error).toBe('Delete failed')

    const state = useOrdersStore.getState()
    expect(state.error).toBe('Delete failed')
    expect(state.isLoading).toBe(false)
  })

  test('should handle network errors during order deletion', async () => {
    mockDeleteOrder.mockRejectedValue(new Error('Network error'))

    const store = useOrdersStore.getState()
    const result = await store.deleteOrder('order-001')

    expect(result.success).toBe(false)
    expect(result.error).toBe('Error deleting order')

    const state = useOrdersStore.getState()
    expect(state.error).toBe('Error deleting order')
    expect(state.isLoading).toBe(false)
  })

  // 4. GETTERS & FILTRES MÉTIER (3 tests)
  test('should filter orders by status, user, and date correctly', () => {
    useOrdersStore.setState({ orders: mockExistingOrders })
    const store = useOrdersStore.getState()
    
    // Test filtering by status
    const deliveredOrders = store.getOrdersByStatus('delivered')
    expect(deliveredOrders).toHaveLength(1)
    expect(deliveredOrders[0].id).toBe('order-001')
    
    const preparingOrders = store.getOrdersByStatus('preparing')
    expect(preparingOrders).toHaveLength(1)
    expect(preparingOrders[0].id).toBe('order-002')
    
    // Test filtering by user
    const user1Orders = store.getOrdersByUser('user1')
    expect(user1Orders).toHaveLength(2)
    expect(user1Orders.map(o => o.id)).toEqual(['order-001', 'order-002'])
    
    const user2Orders = store.getOrdersByUser('user2')
    expect(user2Orders).toHaveLength(1)
    expect(user2Orders[0].id).toBe('order-003')
    
    // Test filtering by today's date
    vi.setSystemTime(new Date('2024-01-21T10:00:00Z'))
    const todaysOrders = store.getTodaysOrders()
    expect(todaysOrders).toHaveLength(1)
    expect(todaysOrders[0].id).toBe('order-002')
  })

  test('should calculate order statistics correctly', () => {
    useOrdersStore.setState({ orders: mockExistingOrders })
    const store = useOrdersStore.getState()
    
    const stats = store.getOrdersStats()
    
    expect(stats).toEqual({
      total: 3,
      pending: 0,
      confirmed: 0,
      preparing: 1, // order-002
      ready: 0,
      delivered: 1, // order-001
      cancelled: 1, // order-003
      totalRevenue: 15.00 // Only delivered orders count (order-001)
    })
  })

  test('should return correct revenue from delivered orders only', () => {
    const ordersWithMixedStatus = [
      { ...mockExistingOrders[0], status: 'delivered', totalPrice: 20.00, paymentStatus: 'paid' },
      { ...mockExistingOrders[1], status: 'delivered', totalPrice: 25.00, paymentStatus: 'paid' },
      { ...mockExistingOrders[2], status: 'cancelled', totalPrice: 30.00, paymentStatus: 'paid' }, // Should not count
      { id: 'order-004', status: 'preparing', totalPrice: 15.00, paymentStatus: 'paid' } // Should not count
    ]

    useOrdersStore.setState({ orders: ordersWithMixedStatus })
    const store = useOrdersStore.getState()

    const stats = store.getOrdersStats()

    expect(stats.totalRevenue).toBe(45.00) // Only 20.00 + 25.00 from delivered orders
    expect(stats.delivered).toBe(2)
    expect(stats.cancelled).toBe(1)
    expect(stats.preparing).toBe(1)
  })
})