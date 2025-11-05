import apiClient from './apiClient'

/**
 * Orders API
 */

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
