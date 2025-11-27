/**
 * Order Service - Main orchestration for order business logic
 * Delegates to specialized modules for filtering, stats, validation
 */

import {
  filterByStatus,
  filterByUser,
  filterByPaymentStatus,
  filterByOrderType,
  getTodaysOrders,
  getOrdersByDate,
  getRecentOrders,
  filterOrders,
  searchOrders,
  sortOrders
} from './orderFilters'

import {
  calculateOrderStats,
  calculateRevenue,
  calculateAverageOrderValue,
  getPopularItems,
  calculateCompletionRate,
  getOrdersByStatusGroups,
  calculateDailyStats
} from './orderStats'

import {
  validateOrderData,
  validateStatusTransition,
  canCancelOrder,
  canModifyOrder,
  validatePaymentStatusUpdate,
  sanitizeOrderData
} from './orderValidator'

/**
 * OrderService - Main service for order-related operations
 */
class OrderService {
  // ============ Filtering Methods ============

  /**
   * Filter orders by status
   */
  filterByStatus(orders, status) {
    return filterByStatus(orders, status)
  }

  /**
   * Filter orders by user
   */
  filterByUser(orders, userId) {
    return filterByUser(orders, userId)
  }

  /**
   * Filter orders by payment status
   */
  filterByPaymentStatus(orders, paymentStatus) {
    return filterByPaymentStatus(orders, paymentStatus)
  }

  /**
   * Filter orders by order type
   */
  filterByOrderType(orders, orderType) {
    return filterByOrderType(orders, orderType)
  }

  /**
   * Get today's orders
   */
  getTodaysOrders(orders) {
    return getTodaysOrders(orders)
  }

  /**
   * Get orders by date
   */
  getOrdersByDate(orders, date) {
    return getOrdersByDate(orders, date)
  }

  /**
   * Get recent orders
   */
  getRecentOrders(orders, limit) {
    return getRecentOrders(orders, limit)
  }

  /**
   * Filter orders by multiple criteria
   */
  filter(orders, filters) {
    return filterOrders(orders, filters)
  }

  /**
   * Search orders
   */
  search(orders, searchText) {
    return searchOrders(orders, searchText)
  }

  /**
   * Sort orders
   */
  sort(orders, sortBy, direction) {
    return sortOrders(orders, sortBy, direction)
  }

  // ============ Statistics Methods ============

  /**
   * Calculate order statistics
   */
  calculateStats(orders) {
    return calculateOrderStats(orders)
  }

  /**
   * Calculate revenue
   */
  calculateRevenue(orders, startDate, endDate) {
    return calculateRevenue(orders, startDate, endDate)
  }

  /**
   * Calculate average order value
   */
  calculateAverageOrderValue(orders, filters) {
    return calculateAverageOrderValue(orders, filters)
  }

  /**
   * Get popular items
   */
  getPopularItems(orders, limit) {
    return getPopularItems(orders, limit)
  }

  /**
   * Calculate completion rate
   */
  calculateCompletionRate(orders) {
    return calculateCompletionRate(orders)
  }

  /**
   * Get orders grouped by status
   */
  getOrdersByStatusGroups(orders) {
    return getOrdersByStatusGroups(orders)
  }

  /**
   * Calculate daily statistics
   */
  calculateDailyStats(orders) {
    return calculateDailyStats(orders)
  }

  // ============ Validation Methods ============

  /**
   * Validate order data
   */
  validateOrderData(orderData) {
    return validateOrderData(orderData)
  }

  /**
   * Validate status transition
   */
  validateStatusTransition(currentStatus, newStatus) {
    return validateStatusTransition(currentStatus, newStatus)
  }

  /**
   * Check if order can be cancelled
   */
  canCancelOrder(order) {
    return canCancelOrder(order)
  }

  /**
   * Check if order can be modified
   */
  canModifyOrder(order) {
    return canModifyOrder(order)
  }

  /**
   * Validate payment status update
   */
  validatePaymentStatusUpdate(order, newPaymentStatus) {
    return validatePaymentStatusUpdate(order, newPaymentStatus)
  }

  /**
   * Sanitize order data
   */
  sanitizeOrderData(orderData) {
    return sanitizeOrderData(orderData)
  }

  // ============ Helper Methods ============

  /**
   * Get order by ID
   * @param {Array} orders - Array of orders
   * @param {string} orderId - Order ID
   * @returns {Object|undefined} Found order or undefined
   */
  getById(orders, orderId) {
    if (!orders || !Array.isArray(orders) || !orderId) {
      return undefined
    }
    return orders.find(order => order.id === orderId)
  }

  /**
   * Check if order is active (not delivered or cancelled)
   * @param {Object} order - Order object
   * @returns {boolean} True if active
   */
  isActive(order) {
    if (!order) return false
    return !['delivered', 'cancelled'].includes(order.status)
  }

  /**
   * Check if order is completed
   * @param {Object} order - Order object
   * @returns {boolean} True if completed
   */
  isCompleted(order) {
    if (!order) return false
    return order.status === 'delivered'
  }

  /**
   * Check if order is cancelled
   * @param {Object} order - Order object
   * @returns {boolean} True if cancelled
   */
  isCancelled(order) {
    if (!order) return false
    return order.status === 'cancelled'
  }

  /**
   * Get active orders (not delivered or cancelled)
   * @param {Array} orders - Array of orders
   * @returns {Array} Active orders
   */
  getActiveOrders(orders) {
    if (!orders || !Array.isArray(orders)) {
      return []
    }
    return orders.filter(order => this.isActive(order))
  }

  /**
   * Format order status for display
   * @param {string} status - Order status
   * @returns {Object} Display info {label, color}
   */
  getStatusDisplayInfo(status) {
    const statusMap = {
      'pending': { label: 'Pending', color: 'yellow' },
      'confirmed': { label: 'Confirmed', color: 'blue' },
      'preparing': { label: 'Preparing', color: 'purple' },
      'ready': { label: 'Ready', color: 'green' },
      'delivered': { label: 'Delivered', color: 'gray' },
      'cancelled': { label: 'Cancelled', color: 'red' }
    }

    return statusMap[status] || { label: status, color: 'gray' }
  }

  /**
   * Calculate order total from items (validation helper)
   * @param {Array} items - Order items with price and quantity
   * @returns {number} Total price
   */
  calculateOrderTotal(items) {
    if (!items || !Array.isArray(items)) {
      return 0
    }

    return items.reduce((total, item) => {
      const price = item.price || 0
      const quantity = item.quantity || 0
      return total + (price * quantity)
    }, 0)
  }
}

// Export singleton instance
export default new OrderService()
