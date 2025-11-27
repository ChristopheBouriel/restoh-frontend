/**
 * Statistics and metrics calculation for orders
 * Pure functions - no side effects
 */

/**
 * Calculate order statistics
 * @param {Array} orders - Array of order objects
 * @returns {Object} Statistics object
 */
export const calculateOrderStats = (orders) => {
  if (!orders || !Array.isArray(orders)) {
    return {
      total: 0,
      pending: 0,
      confirmed: 0,
      preparing: 0,
      ready: 0,
      delivered: 0,
      cancelled: 0,
      totalRevenue: 0,
      paidOrders: 0,
      unpaidOrders: 0,
      deliveryOrders: 0,
      pickupOrders: 0
    }
  }

  const stats = {
    total: orders.length,
    pending: 0,
    confirmed: 0,
    preparing: 0,
    ready: 0,
    delivered: 0,
    cancelled: 0,
    totalRevenue: 0,
    paidOrders: 0,
    unpaidOrders: 0,
    deliveryOrders: 0,
    pickupOrders: 0
  }

  orders.forEach(order => {
    // Count by status
    switch (order.status) {
      case 'pending':
        stats.pending++
        break
      case 'confirmed':
        stats.confirmed++
        break
      case 'preparing':
        stats.preparing++
        break
      case 'ready':
        stats.ready++
        break
      case 'delivered':
        stats.delivered++
        break
      case 'cancelled':
        stats.cancelled++
        break
    }

    // Calculate revenue (only delivered and paid orders)
    if (order.status === 'delivered' && order.paymentStatus === 'paid') {
      stats.totalRevenue += order.totalPrice || 0
    }

    // Count by payment status
    if (order.paymentStatus === 'paid') {
      stats.paidOrders++
    } else {
      stats.unpaidOrders++
    }

    // Count by order type
    if (order.orderType === 'delivery') {
      stats.deliveryOrders++
    } else if (order.orderType === 'pickup') {
      stats.pickupOrders++
    }
  })

  return stats
}

/**
 * Calculate revenue for a date range
 * @param {Array} orders - Array of order objects
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Object} Revenue statistics
 */
export const calculateRevenue = (orders, startDate, endDate) => {
  if (!orders || !Array.isArray(orders)) {
    return {
      totalRevenue: 0,
      paidRevenue: 0,
      unpaidRevenue: 0,
      orderCount: 0
    }
  }

  const start = startDate ? new Date(startDate) : new Date(0)
  const end = endDate ? new Date(endDate) : new Date()
  end.setHours(23, 59, 59, 999) // Include entire end date

  const filteredOrders = orders.filter(order => {
    if (!order.createdAt) return false
    const orderDate = new Date(order.createdAt)
    return orderDate >= start && orderDate <= end && order.status === 'delivered'
  })

  const paidOrders = filteredOrders.filter(o => o.paymentStatus === 'paid')
  const unpaidOrders = filteredOrders.filter(o => o.paymentStatus === 'pending')

  return {
    totalRevenue: filteredOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0),
    paidRevenue: paidOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0),
    unpaidRevenue: unpaidOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0),
    orderCount: filteredOrders.length
  }
}

/**
 * Calculate average order value
 * @param {Array} orders - Array of order objects
 * @param {Object} filters - Optional filters (status, paymentStatus, etc.)
 * @returns {number} Average order value
 */
export const calculateAverageOrderValue = (orders, filters = {}) => {
  if (!orders || !Array.isArray(orders)) {
    return 0
  }

  let filteredOrders = orders

  // Apply filters if provided
  if (filters.status) {
    filteredOrders = filteredOrders.filter(o => o.status === filters.status)
  }

  if (filters.paymentStatus) {
    filteredOrders = filteredOrders.filter(o => o.paymentStatus === filters.paymentStatus)
  }

  if (filteredOrders.length === 0) {
    return 0
  }

  const totalValue = filteredOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0)
  return Math.round((totalValue / filteredOrders.length) * 100) / 100
}

/**
 * Get popular items from orders
 * @param {Array} orders - Array of order objects
 * @param {number} limit - Maximum number of items to return
 * @returns {Array} Popular items with counts
 */
export const getPopularItems = (orders, limit = 10) => {
  if (!orders || !Array.isArray(orders)) {
    return []
  }

  const itemCounts = {}

  orders.forEach(order => {
    if (!order.items || !Array.isArray(order.items)) return

    order.items.forEach(item => {
      const itemId = item.menuItem || item.id
      const itemName = item.name || 'Unknown Item'

      if (!itemCounts[itemId]) {
        itemCounts[itemId] = {
          id: itemId,
          name: itemName,
          count: 0,
          totalQuantity: 0
        }
      }

      itemCounts[itemId].count++
      itemCounts[itemId].totalQuantity += item.quantity || 0
    })
  })

  return Object.values(itemCounts)
    .sort((a, b) => b.totalQuantity - a.totalQuantity)
    .slice(0, limit)
}

/**
 * Calculate order completion rate
 * @param {Array} orders - Array of order objects
 * @returns {Object} Completion rate statistics
 */
export const calculateCompletionRate = (orders) => {
  if (!orders || !Array.isArray(orders) || orders.length === 0) {
    return {
      total: 0,
      completed: 0,
      cancelled: 0,
      completionRate: 0,
      cancellationRate: 0
    }
  }

  const completed = orders.filter(o => o.status === 'delivered').length
  const cancelled = orders.filter(o => o.status === 'cancelled').length

  return {
    total: orders.length,
    completed,
    cancelled,
    completionRate: Math.round((completed / orders.length) * 10000) / 100,
    cancellationRate: Math.round((cancelled / orders.length) * 10000) / 100
  }
}

/**
 * Get orders grouped by status with counts
 * @param {Array} orders - Array of order objects
 * @returns {Array} Status groups with counts
 */
export const getOrdersByStatusGroups = (orders) => {
  if (!orders || !Array.isArray(orders)) {
    return []
  }

  const statusGroups = {}

  orders.forEach(order => {
    const status = order.status || 'unknown'
    if (!statusGroups[status]) {
      statusGroups[status] = {
        status,
        count: 0,
        orders: []
      }
    }
    statusGroups[status].count++
    statusGroups[status].orders.push(order)
  })

  return Object.values(statusGroups).sort((a, b) => b.count - a.count)
}

/**
 * Calculate daily statistics
 * @param {Array} orders - Array of order objects
 * @returns {Object} Daily statistics grouped by date
 */
export const calculateDailyStats = (orders) => {
  if (!orders || !Array.isArray(orders)) {
    return {}
  }

  const dailyStats = {}

  orders.forEach(order => {
    if (!order.createdAt) return

    const date = order.createdAt.split('T')[0]

    if (!dailyStats[date]) {
      dailyStats[date] = {
        date,
        orderCount: 0,
        revenue: 0,
        deliveredCount: 0,
        cancelledCount: 0
      }
    }

    dailyStats[date].orderCount++

    if (order.status === 'delivered' && order.paymentStatus === 'paid') {
      dailyStats[date].revenue += order.totalPrice || 0
      dailyStats[date].deliveredCount++
    }

    if (order.status === 'cancelled') {
      dailyStats[date].cancelledCount++
    }
  })

  return dailyStats
}
