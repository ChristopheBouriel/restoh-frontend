import { toast } from 'react-hot-toast'
import useOrdersStore from '../store/ordersStore'
import { useAuth } from './useAuth'

export const useOrders = () => {
  const { user } = useAuth()
  const {
    orders: allOrders,
    getOrdersByUser,
    updateOrderStatus,
    getOrdersStats
  } = useOrdersStore()

  // Filter orders for logged-in user only
  const userOrders = user ? getOrdersByUser(user.id) : []

  const handleCancelOrder = async (orderId) => {
    if (!user) {
      toast.error('You must be logged in to cancel an order')
      return { success: false, error: 'User not authenticated' }
    }

    try {
      const result = await updateOrderStatus(orderId, 'cancelled')
      if (result.success) {
        toast.success('Order cancelled')
        return result
      } else {
        // If backend returns details (e.g., ORDER_INVALID_STATUS with timing info)
        if (result.details && Object.keys(result.details).length > 0) {
          // Return error with details for InlineAlert
          return result
        } else {
          // Simple error, show toast
          toast.error(result.error || 'Error cancelling order')
          return result
        }
      }
    } catch (error) {
      toast.error('Error cancelling order')
      return { success: false, error: error.message || 'Error cancelling order' }
    }
  }

  const handleConfirmCancellation = async (orderId) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      const result = await handleCancelOrder(orderId)
      return result.success
    }
    return false
  }

  // Price formatting
  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price)
  }

  // Date formatting
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('fr-FR')
  }

  const formatDateTime = (dateStr) => {
    return new Date(dateStr).toLocaleString('fr-FR')
  }

  // Function to determine if an order can be cancelled
  const canCancelOrder = (order) => {
    // Backend rules: only 'pending' or 'confirmed' AND not paid
    const allowedStatuses = ['pending', 'confirmed']
    const isAllowedStatus = allowedStatuses.includes(order.status)
    const isNotPaid = order.paymentStatus !== 'paid'

    return isAllowedStatus && isNotPaid
  }

  // Function to get recent orders (last 15 days)
  const getRecentOrders = () => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 15)
    
    return userOrders.filter(order => {
      const orderDate = new Date(order.createdAt)
      return orderDate >= thirtyDaysAgo
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }

  return {
    // State - logged-in user's orders only
    orders: userOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    recentOrders: getRecentOrders(),

    // Actions with error handling
    cancelOrder: handleConfirmCancellation,

    // Utilities
    formatPrice,
    formatDate,
    formatDateTime,
    canCancelOrder,

    // User statistics
    totalOrders: userOrders.length,
    deliveredOrders: userOrders.filter(o => o.status === 'delivered').length,
    pendingOrders: userOrders.filter(o => o.status === 'pending').length,
    cancelledOrders: userOrders.filter(o => o.status === 'cancelled').length,
    totalSpent: userOrders
      .filter(o => o.status === 'delivered')
      .reduce((sum, order) => sum + order.totalPrice, 0)
  }
}