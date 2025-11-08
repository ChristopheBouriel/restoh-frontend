/**
 * Mock data for Orders API
 * Used for development until backend endpoints are ready
 */

// Generate mock order
const generateMockOrder = (id, daysAgo = 0) => {
  const statuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled']
  const paymentMethods = ['card', 'cash']

  const date = new Date()
  date.setDate(date.getDate() - daysAgo)

  const status = statuses[Math.floor(Math.random() * statuses.length)]
  const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)]

  return {
    _id: `mock-order-${id}`,
    id: `mock-order-${id}`,
    orderNumber: 1000 + id,
    userId: daysAgo > 30 ? 'deleted-user' : `user-${Math.floor(Math.random() * 100)}`,
    userEmail: daysAgo > 30 ? 'deleted-abc123@account.com' : `user${Math.floor(Math.random() * 100)}@example.com`,
    items: [
      {
        menuItemId: 'item-1',
        name: 'Burger Classic',
        price: 12.50,
        quantity: Math.floor(Math.random() * 3) + 1,
        image: '/images/burger.jpg'
      },
      {
        menuItemId: 'item-2',
        name: 'Fries',
        price: 4.50,
        quantity: Math.floor(Math.random() * 2) + 1,
        image: '/images/fries.jpg'
      }
    ],
    total: Math.floor(Math.random() * 50) + 20,
    status,
    paymentMethod,
    paymentStatus: paymentMethod === 'card' ? 'paid' : (status === 'delivered' ? 'paid' : 'pending'),
    deliveryAddress: '123 Main St, Paris 75001',
    specialInstructions: Math.random() > 0.7 ? 'No onions please' : null,
    createdAt: date.toISOString(),
    updatedAt: date.toISOString()
  }
}

// Generate recent orders (last 15 days)
export const generateRecentOrders = (count = 50) => {
  const orders = []
  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(Math.random() * 15) // 0-14 days ago
    orders.push(generateMockOrder(i, daysAgo))
  }
  // Sort by date DESC (newest first)
  return orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

// Generate historical orders (16-365 days ago)
export const generateHistoricalOrders = (count = 200) => {
  const orders = []
  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(Math.random() * 350) + 15 // 15-365 days ago
    orders.push(generateMockOrder(i + 1000, daysAgo))
  }
  // Sort by date DESC (newest first)
  return orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

// Mock recent orders data (regenerated each time)
let mockRecentOrders = []
let mockHistoricalOrders = []

// Initialize mock data
const initializeMockData = () => {
  mockRecentOrders = generateRecentOrders(50)
  mockHistoricalOrders = generateHistoricalOrders(200)
}

// Initialize on load
initializeMockData()

/**
 * Mock: Get recent orders (last 15 days)
 */
export const getRecentOrdersMock = async (params = {}) => {
  const { limit = 50, page = 1, status } = params

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300))

  // Filter by status if provided
  let filteredOrders = status
    ? mockRecentOrders.filter(order => order.status === status)
    : mockRecentOrders

  // Pagination
  const startIndex = (page - 1) * limit
  const endIndex = startIndex + limit
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex)

  return {
    success: true,
    data: paginatedOrders,
    pagination: {
      total: filteredOrders.length,
      page,
      limit,
      totalPages: Math.ceil(filteredOrders.length / limit),
      hasMore: endIndex < filteredOrders.length
    }
  }
}

/**
 * Mock: Get historical orders (> 15 days)
 */
export const getHistoricalOrdersMock = async (params = {}) => {
  const { startDate, endDate, limit = 20, page = 1, status, search } = params

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500))

  let filteredOrders = [...mockHistoricalOrders]

  // Filter by date range
  if (startDate && endDate) {
    const start = new Date(startDate)
    const end = new Date(endDate)
    filteredOrders = filteredOrders.filter(order => {
      const orderDate = new Date(order.createdAt)
      return orderDate >= start && orderDate <= end
    })
  }

  // Filter by status
  if (status) {
    filteredOrders = filteredOrders.filter(order => order.status === status)
  }

  // Filter by search (order number or email)
  if (search) {
    const searchLower = search.toLowerCase()
    filteredOrders = filteredOrders.filter(order =>
      order.orderNumber.toString().includes(searchLower) ||
      order.userEmail.toLowerCase().includes(searchLower)
    )
  }

  // Pagination
  const startIndex = (page - 1) * limit
  const endIndex = startIndex + limit
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex)

  return {
    success: true,
    data: paginatedOrders,
    pagination: {
      total: filteredOrders.length,
      page,
      limit,
      totalPages: Math.ceil(filteredOrders.length / limit),
      hasMore: endIndex < filteredOrders.length
    }
  }
}

/**
 * Mock: Update order status
 */
export const updateOrderStatusMock = async (orderId, newStatus) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 200))

  // Find and update order in recent
  let order = mockRecentOrders.find(o => o.id === orderId || o._id === orderId)
  if (order) {
    order.status = newStatus
    order.updatedAt = new Date().toISOString()

    // Auto-update payment status for cash when delivered
    if (newStatus === 'delivered' && order.paymentMethod === 'cash') {
      order.paymentStatus = 'paid'
    }

    return { success: true, data: order }
  }

  // Find and update order in historical
  order = mockHistoricalOrders.find(o => o.id === orderId || o._id === orderId)
  if (order) {
    order.status = newStatus
    order.updatedAt = new Date().toISOString()

    if (newStatus === 'delivered' && order.paymentMethod === 'cash') {
      order.paymentStatus = 'paid'
    }

    return { success: true, data: order }
  }

  return { success: false, error: 'Order not found' }
}

/**
 * Refresh mock data (simulate new orders coming in)
 */
export const refreshMockOrders = () => {
  // Add 1-3 new orders to recent
  const newOrdersCount = Math.floor(Math.random() * 3) + 1
  for (let i = 0; i < newOrdersCount; i++) {
    const newOrder = generateMockOrder(Date.now() + i, 0) // Today
    mockRecentOrders.unshift(newOrder)
  }

  // Keep only last 100 recent orders
  if (mockRecentOrders.length > 100) {
    mockRecentOrders = mockRecentOrders.slice(0, 100)
  }
}
