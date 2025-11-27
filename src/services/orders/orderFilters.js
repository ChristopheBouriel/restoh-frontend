/**
 * Filtering and querying logic for orders
 * Pure functions - no side effects
 */

/**
 * Filter orders by status
 * @param {Array} orders - Array of order objects
 * @param {string} status - Status to filter by
 * @returns {Array} Filtered orders
 */
export const filterByStatus = (orders, status) => {
  if (!orders || !Array.isArray(orders)) {
    return []
  }

  if (!status) {
    return orders
  }

  return orders.filter(order => order.status === status)
}

/**
 * Filter orders by user
 * @param {Array} orders - Array of order objects
 * @param {string} userId - User ID to filter by
 * @returns {Array} Filtered orders
 */
export const filterByUser = (orders, userId) => {
  if (!orders || !Array.isArray(orders)) {
    return []
  }

  if (!userId) {
    return orders
  }

  return orders.filter(order =>
    order.userId === userId || order.user?.id === userId
  )
}

/**
 * Filter orders by payment status
 * @param {Array} orders - Array of order objects
 * @param {string} paymentStatus - Payment status ('paid' or 'pending')
 * @returns {Array} Filtered orders
 */
export const filterByPaymentStatus = (orders, paymentStatus) => {
  if (!orders || !Array.isArray(orders)) {
    return []
  }

  if (!paymentStatus) {
    return orders
  }

  return orders.filter(order => order.paymentStatus === paymentStatus)
}

/**
 * Filter orders by order type
 * @param {Array} orders - Array of order objects
 * @param {string} orderType - Order type ('delivery' or 'pickup')
 * @returns {Array} Filtered orders
 */
export const filterByOrderType = (orders, orderType) => {
  if (!orders || !Array.isArray(orders)) {
    return []
  }

  if (!orderType) {
    return orders
  }

  return orders.filter(order => order.orderType === orderType)
}

/**
 * Get today's orders
 * @param {Array} orders - Array of order objects
 * @returns {Array} Today's orders
 */
export const getTodaysOrders = (orders) => {
  if (!orders || !Array.isArray(orders)) {
    return []
  }

  const today = new Date().toISOString().split('T')[0]

  return orders.filter(order => {
    if (!order.createdAt) return false
    return order.createdAt.startsWith(today)
  })
}

/**
 * Get orders by date
 * @param {Array} orders - Array of order objects
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Array} Orders for that date
 */
export const getOrdersByDate = (orders, date) => {
  if (!orders || !Array.isArray(orders)) {
    return []
  }

  if (!date) {
    return orders
  }

  return orders.filter(order => {
    if (!order.createdAt) return false
    return order.createdAt.startsWith(date)
  })
}

/**
 * Get recent orders (sorted by date, newest first)
 * @param {Array} orders - Array of order objects
 * @param {number} limit - Maximum number of orders to return
 * @returns {Array} Recent orders
 */
export const getRecentOrders = (orders, limit = 10) => {
  if (!orders || !Array.isArray(orders)) {
    return []
  }

  return [...orders]
    .sort((a, b) => {
      const dateA = new Date(a.createdAt || 0)
      const dateB = new Date(b.createdAt || 0)
      return dateB - dateA // Newest first
    })
    .slice(0, limit)
}

/**
 * Filter orders by multiple criteria
 * @param {Array} orders - Array of order objects
 * @param {Object} filters - Filter options
 * @param {string} [filters.status] - Filter by status
 * @param {string} [filters.userId] - Filter by user
 * @param {string} [filters.paymentStatus] - Filter by payment status
 * @param {string} [filters.orderType] - Filter by order type
 * @param {string} [filters.date] - Filter by date
 * @returns {Array} Filtered orders
 */
export const filterOrders = (orders, filters = {}) => {
  if (!orders || !Array.isArray(orders)) {
    return []
  }

  const safeFilters = filters || {}
  let result = [...orders]

  // Apply status filter
  if (safeFilters.status) {
    result = filterByStatus(result, safeFilters.status)
  }

  // Apply user filter
  if (safeFilters.userId) {
    result = filterByUser(result, safeFilters.userId)
  }

  // Apply payment status filter
  if (safeFilters.paymentStatus) {
    result = filterByPaymentStatus(result, safeFilters.paymentStatus)
  }

  // Apply order type filter
  if (safeFilters.orderType) {
    result = filterByOrderType(result, safeFilters.orderType)
  }

  // Apply date filter
  if (safeFilters.date) {
    result = getOrdersByDate(result, safeFilters.date)
  }

  return result
}

/**
 * Search orders by customer name, email, or order ID
 * @param {Array} orders - Array of order objects
 * @param {string} searchText - Text to search for
 * @returns {Array} Matching orders
 */
export const searchOrders = (orders, searchText) => {
  if (!orders || !Array.isArray(orders)) {
    return []
  }

  if (!searchText || searchText.trim() === '') {
    return orders
  }

  const searchLower = searchText.toLowerCase().trim()

  return orders.filter(order => {
    const orderId = order.id?.toLowerCase() || ''
    const userName = order.user?.name?.toLowerCase() || order.userName?.toLowerCase() || ''
    const userEmail = order.user?.email?.toLowerCase() || order.userEmail?.toLowerCase() || ''
    const phone = order.phone?.toLowerCase() || ''

    return (
      orderId.includes(searchLower) ||
      userName.includes(searchLower) ||
      userEmail.includes(searchLower) ||
      phone.includes(searchLower)
    )
  })
}

/**
 * Sort orders by various criteria
 * @param {Array} orders - Array of order objects
 * @param {string} sortBy - Sort criteria ('date', 'price', 'status')
 * @param {string} direction - Sort direction ('asc' or 'desc')
 * @returns {Array} Sorted orders
 */
export const sortOrders = (orders, sortBy = 'date', direction = 'desc') => {
  if (!orders || !Array.isArray(orders)) {
    return []
  }

  const sorted = [...orders]

  sorted.sort((a, b) => {
    let comparison = 0

    switch (sortBy) {
      case 'date':
        comparison = new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
        break
      case 'price':
        comparison = (a.totalPrice || 0) - (b.totalPrice || 0)
        break
      case 'status':
        comparison = (a.status || '').localeCompare(b.status || '')
        break
      default:
        comparison = 0
    }

    return direction === 'desc' ? -comparison : comparison
  })

  return sorted
}
