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

  // Filtrer les commandes pour l'utilisateur connecté uniquement
  const userOrders = user ? getOrdersByUser(user.id) : []

  const handleCancelOrder = async (orderId) => {
    if (!user) {
      toast.error('Vous devez être connecté pour annuler une commande')
      throw new Error('User not authenticated')
    }

    try {
      const result = await updateOrderStatus(orderId, 'cancelled')
      if (result.success) {
        toast.success('Commande annulée')
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast.error('Erreur lors de l\'annulation de la commande')
      throw error
    }
  }

  const handleConfirmCancellation = (orderId) => {
    if (window.confirm('Êtes-vous sûr de vouloir annuler cette commande ?')) {
      handleCancelOrder(orderId).catch(error => {
        // Error already handled in handleCancelOrder with toast
        console.error('Order cancellation failed:', error)
      })
      return true
    }
    return false
  }

  // Formatage des prix
  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price)
  }

  // Formatage des dates
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('fr-FR')
  }

  const formatDateTime = (dateStr) => {
    return new Date(dateStr).toLocaleString('fr-FR')
  }

  // Fonction pour déterminer si une commande peut être annulée
  const canCancelOrder = (order) => {
    const cancelableStatuses = ['pending', 'confirmed', 'preparing']
    return cancelableStatuses.includes(order.status)
  }

  // Fonction pour obtenir les commandes récentes (30 derniers jours)
  const getRecentOrders = () => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    return userOrders.filter(order => {
      const orderDate = new Date(order.createdAt)
      return orderDate >= thirtyDaysAgo
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }

  return {
    // État - seulement les commandes de l'utilisateur connecté
    orders: userOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    recentOrders: getRecentOrders(),
    
    // Actions avec gestion d'erreurs
    cancelOrder: handleConfirmCancellation,
    
    // Utilitaires
    formatPrice,
    formatDate,
    formatDateTime,
    canCancelOrder,
    
    // Statistiques pour l'utilisateur
    totalOrders: userOrders.length,
    deliveredOrders: userOrders.filter(o => o.status === 'delivered').length,
    pendingOrders: userOrders.filter(o => o.status === 'pending').length,
    cancelledOrders: userOrders.filter(o => o.status === 'cancelled').length,
    totalSpent: userOrders
      .filter(o => o.status === 'delivered')
      .reduce((sum, order) => sum + order.totalAmount, 0)
  }
}