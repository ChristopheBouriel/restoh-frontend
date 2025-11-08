import apiClient from './apiClient'
import {
  getRecentOrdersMock,
  getHistoricalOrdersMock,
  updateOrderStatusMock
} from './mocks/ordersMock'

/**
 * Orders API
 *
 * Set VITE_MOCK_API=true in .env to use mock data for development
 */

const MOCK_MODE = import.meta.env.VITE_MOCK_API === 'true'

// Get current user's orders
export const getUserOrders = async () => {
  try {
    const response = await apiClient.get('/orders')
    return { success: true, ...response }
  } catch (error) {
    return { success: false, error: error.error || 'Error fetching orders' }
  }
}

// Get all orders (ADMIN)
export const getAllOrders = async (filters = {}) => {
  try {
    const params = {}
    if (filters.status) params.status = filters.status
    if (filters.userId) params.userId = filters.userId
    if (filters.date) params.date = filters.date

    const response = await apiClient.get('/orders/admin', { params })
    return { success: true, ...response }
  } catch (error) {
    return { success: false, error: error.error || 'Error fetching orders' }
  }
}

// Get order details
export const getOrderById = async (orderId) => {
  try {
    const response = await apiClient.get(`/orders/${orderId}`)
    return { success: true, ...response }
  } catch (error) {
    return { success: false, error: error.error || 'Error fetching order' }
  }
}

// Create a new order
export const createOrder = async (orderData) => {
  try {
    const response = await apiClient.post('/orders', orderData)
    return { success: true, ...response }
  } catch (error) {
    return { success: false, error: error.error || 'Error creating order' }
  }
}

// Update order status (ADMIN)
export const updateOrderStatus = async (orderId, status) => {
  try {
    const response = await apiClient.patch(`/orders/${orderId}/status`, { status })
    return { success: true, ...response }
  } catch (error) {
    return { success: false, error: error.error || 'Error updating status' }
  }
}

// Delete an order (ADMIN)
export const deleteOrder = async (orderId) => {
  try {
    const response = await apiClient.delete(`/orders/${orderId}/delete`)
    return { success: true, ...response }
  } catch (error) {
    return { success: false, error: error.error || 'Error deleting order' }
  }
}

// Get orders for a specific user (ADMIN)
export const getOrdersByUserId = async (userId) => {
  try {
    const response = await apiClient.get(`/admin/users/${userId}/orders`)

    // Handle different possible response structures
    const orders = response.orders || response.data?.orders || response.data || []

    return { success: true, orders: Array.isArray(orders) ? orders : [] }
  } catch (error) {
    return { success: false, error: error.error || 'Error fetching user orders', orders: [] }
  }
}

// ========================================
// NEW API ENDPOINTS (Recent/Historical Split)
// ========================================

/**
 * Get recent orders (last 15 days) - ADMIN
 * Auto-refreshed in the UI
 */
export const getRecentOrders = async (params = {}) => {
  if (MOCK_MODE) {
    return await getRecentOrdersMock(params)
  }

  try {
    const queryParams = {
      limit: params.limit || 50,
      page: params.page || 1
    }
    if (params.status) queryParams.status = params.status

    const response = await apiClient.get('/orders/admin/recent', { params: queryParams })
    return { success: true, ...response }
  } catch (error) {
    return { success: false, error: error.error || 'Error fetching recent orders' }
  }
}

/**
 * Get historical orders (> 15 days) - ADMIN
 * Fetch on demand with date range
 */
export const getHistoricalOrders = async (params = {}) => {
  if (MOCK_MODE) {
    return await getHistoricalOrdersMock(params)
  }

  try {
    const { startDate, endDate, limit = 20, page = 1, status, search } = params

    if (!startDate || !endDate) {
      return { success: false, error: 'Start date and end date are required' }
    }

    const queryParams = { startDate, endDate, limit, page }
    if (status) queryParams.status = status
    if (search) queryParams.search = search

    const response = await apiClient.get('/orders/admin/history', { params: queryParams })
    return { success: true, ...response }
  } catch (error) {
    return { success: false, error: error.error || 'Error fetching historical orders' }
  }
}

/**
 * Update order status - ADMIN (enhanced for mock support)
 */
export const updateOrderStatusEnhanced = async (orderId, status) => {
  if (MOCK_MODE) {
    return await updateOrderStatusMock(orderId, status)
  }

  // Use existing updateOrderStatus
  return await updateOrderStatus(orderId, status)
}
