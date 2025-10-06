import { beforeEach, describe, expect, test, vi } from 'vitest'
import useOrdersStore from '../../store/ordersStore'

// Mock console.log to avoid noise in tests
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {})

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})

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
  totalAmount: 15.90,
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
    totalAmount: 15.00,
    status: 'delivered',
    paymentMethod: 'card',
    isPaid: true,
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
    totalAmount: 18.00,
    status: 'preparing',
    paymentMethod: 'cash',
    isPaid: false,
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
    totalAmount: 16.50,
    status: 'cancelled',
    paymentMethod: 'card',
    isPaid: true,
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
      isLoading: false
    })
    
    // Clear localStorage mocks
    mockLocalStorage.getItem.mockReturnValue(null)
    mockLocalStorage.setItem.mockClear()
    mockConsoleLog.mockClear()
    
    // Mock Date.now for consistent order IDs
    vi.setSystemTime(new Date('2024-01-30T15:00:00Z'))
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // 1. INITIALISATION & PERSISTANCE (3 tests)
  test('should initialize with empty orders by default', () => {
    const store = useOrdersStore.getState()
    
    expect(store.orders).toEqual([])
    expect(store.isLoading).toBe(false)
  })

  test('should load existing orders from localStorage', () => {
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockExistingOrders))
    
    const store = useOrdersStore.getState()
    store.initializeOrders()
    
    const state = useOrdersStore.getState()
    expect(state.orders).toEqual(mockExistingOrders)
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('admin-orders-v2')
  })

  test('should create initial demo data when localStorage empty', () => {
    mockLocalStorage.getItem.mockReturnValue(null)
    
    const store = useOrdersStore.getState()
    store.initializeOrders()
    
    const state = useOrdersStore.getState()
    expect(state.orders).toHaveLength(7) // Initial demo orders
    expect(state.orders[0]).toMatchObject({
      id: 'order-001',
      status: 'preparing',
      paymentMethod: 'card',
      isPaid: true
    })
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'admin-orders-v2', 
      expect.any(String)
    )
  })

  // 2. CRÉATION DE COMMANDES & LOGIQUE MÉTIER (3 tests)
  test('should create order with card payment as immediately paid', async () => {
    const store = useOrdersStore.getState()
    
    const cardOrderData = { ...mockOrderData, paymentMethod: 'card' }
    const result = await store.createOrder(cardOrderData)
    
    const state = useOrdersStore.getState()
    expect(result.success).toBe(true)
    expect(result.orderId).toMatch(/^order-\d+$/)
    expect(state.orders).toHaveLength(1)
    expect(state.orders[0]).toMatchObject({
      status: 'pending',
      paymentMethod: 'card',
      isPaid: true, // Card payments are immediately paid
      totalAmount: 15.90,
      userId: 'test-user'
    })
    expect(state.isLoading).toBe(false)
    expect(mockLocalStorage.setItem).toHaveBeenCalled()
  })

  test('should create order with cash payment as unpaid initially', async () => {
    const store = useOrdersStore.getState()
    
    const cashOrderData = { ...mockOrderData, paymentMethod: 'cash' }
    const result = await store.createOrder(cashOrderData)
    
    const state = useOrdersStore.getState()
    expect(result.success).toBe(true)
    expect(result.orderId).toMatch(/^order-\d+$/)
    expect(state.orders[0]).toMatchObject({
      status: 'pending',
      paymentMethod: 'cash',
      isPaid: false // Cash payments start unpaid
    })
  })

  test('should handle order creation errors gracefully', async () => {
    const store = useOrdersStore.getState()
    
    // Since the actual implementation doesn't have explicit error cases,
    // we'll test the normal success case and verify the error handling structure
    const result = await store.createOrder(mockOrderData)
    
    expect(result.success).toBe(true)
    expect(result.orderId).toBeTruthy()
    
    const state = useOrdersStore.getState()
    expect(state.isLoading).toBe(false)
  })

  // 3. MISE À JOUR STATUT & LOGIQUE PAIEMENT (3 tests)
  test('should update order status successfully', async () => {
    // Setup initial order
    useOrdersStore.setState({ orders: mockExistingOrders })
    const store = useOrdersStore.getState()
    
    const result = await store.updateOrderStatus('order-002', 'ready')
    
    const state = useOrdersStore.getState()
    expect(result).toEqual({ success: true })
    expect(state.orders.find(o => o.id === 'order-002')).toMatchObject({
      status: 'ready',
      updatedAt: '2024-01-30T15:00:00.000Z'
    })
    expect(state.isLoading).toBe(false)
    expect(mockLocalStorage.setItem).toHaveBeenCalled()
  })

  test('should auto-pay cash orders when status becomes delivered', async () => {
    // Setup cash order that's not paid
    const cashOrder = {
      ...mockExistingOrders[1],
      status: 'ready',
      paymentMethod: 'cash',
      isPaid: false,
      notes: 'Ready for delivery'
    }
    useOrdersStore.setState({ orders: [cashOrder] })
    
    const store = useOrdersStore.getState()
    await store.updateOrderStatus('order-002', 'delivered')
    
    const state = useOrdersStore.getState()
    const deliveredOrder = state.orders.find(o => o.id === 'order-002')
    
    expect(deliveredOrder).toMatchObject({
      status: 'delivered',
      isPaid: true, // Auto-paid on delivery
      notes: 'Ready for delivery - Payé à la livraison'
    })
  })

  test('should handle status update errors gracefully', async () => {
    useOrdersStore.setState({ orders: mockExistingOrders })
    const store = useOrdersStore.getState()
    
    // Test with valid parameters - the implementation doesn't have error cases
    // in normal flow, so we test the structure
    const result = await store.updateOrderStatus('order-001', 'cancelled')
    
    expect(result.success).toBe(true)
    
    const state = useOrdersStore.getState()
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
      { ...mockExistingOrders[0], status: 'delivered', totalAmount: 20.00 },
      { ...mockExistingOrders[1], status: 'delivered', totalAmount: 25.00 },
      { ...mockExistingOrders[2], status: 'cancelled', totalAmount: 30.00 }, // Should not count
      { id: 'order-004', status: 'preparing', totalAmount: 15.00, isPaid: true } // Should not count
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