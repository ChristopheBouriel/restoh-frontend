import { useState, useEffect } from 'react'
import { Clock, Package, CheckCircle, XCircle, Eye, Star, MapPin } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useOrders } from '../../hooks/useOrders'
import useOrdersStore from '../../store/ordersStore'

const Orders = () => {
  const [filter, setFilter] = useState('all')
  const [showDetails, setShowDetails] = useState(null)
  
  const { initializeOrders } = useOrdersStore()
  const { orders, cancelOrder, canCancelOrder, formatPrice, formatDate } = useOrders()

  useEffect(() => {
    initializeOrders()
  }, [initializeOrders])

  const handleLeaveReview = () => {
    toast.success('Fonctionnalité d\'avis en cours de développement')
  }

  const filteredOrders = orders.filter(order => 
    filter === 'all' || order.status === filter
  )

  const getStatusInfo = (status) => {
    switch (status) {
      case 'delivered':
        return { 
          label: 'Livrée', 
          color: 'text-green-600 bg-green-50',
          icon: CheckCircle
        }
      case 'preparing':
        return { 
          label: 'En préparation', 
          color: 'text-yellow-600 bg-yellow-50',
          icon: Clock
        }
      case 'ready':
        return { 
          label: 'Prête', 
          color: 'text-blue-600 bg-blue-50',
          icon: Package
        }
      case 'confirmed':
        return { 
          label: 'Confirmée', 
          color: 'text-indigo-600 bg-indigo-50',
          icon: CheckCircle
        }
      case 'pending':
        return { 
          label: 'En attente', 
          color: 'text-orange-600 bg-orange-50',
          icon: Clock
        }
      case 'cancelled':
        return { 
          label: 'Annulée', 
          color: 'text-red-600 bg-red-50',
          icon: XCircle
        }
      default:
        return { 
          label: 'En cours', 
          color: 'text-blue-600 bg-blue-50',
          icon: Package
        }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mes Commandes</h1>
          <p className="text-gray-600">Suivez l'état de vos commandes</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'Toutes les commandes' },
              { key: 'pending', label: 'En attente' },
              { key: 'confirmed', label: 'Confirmées' },
              { key: 'preparing', label: 'En préparation' },
              { key: 'ready', label: 'Prêtes' },
              { key: 'delivered', label: 'Livrées' },
              { key: 'cancelled', label: 'Annulées' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === key
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => {
              const statusInfo = getStatusInfo(order.status)
              const StatusIcon = statusInfo.icon

              return (
                <div key={order.id} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Commande #{order.id}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusInfo.label}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">
                        {formatDate(order.createdAt)}
                      </p>
                      
                      <p className="text-sm text-gray-700 mb-2">
                        {order.items.map(item => 
                          `${item.name}${item.quantity > 1 ? ` x${item.quantity}` : ''}`
                        ).join(', ')}
                      </p>
                      
                      <p className="text-lg font-bold text-primary-600">
                        {formatPrice(order.totalAmount)}
                      </p>
                    </div>

                    <div className="mt-4 md:mt-0 flex flex-col space-y-2">
                      <button 
                        onClick={() => setShowDetails(showDetails === order.id ? null : order.id)}
                        className="flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        <span>{showDetails === order.id ? 'Masquer' : 'Voir détails'}</span>
                      </button>
                      
                      {order.status === 'delivered' && (
                        <button 
                          onClick={handleLeaveReview}
                          className="flex items-center justify-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                        >
                          <Star className="w-4 h-4" />
                          <span>Laisser un avis</span>
                        </button>
                      )}
                      
                      {['preparing', 'ready'].includes(order.status) && (
                        <button className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
                          <MapPin className="w-4 h-4" />
                          <span>Suivre</span>
                        </button>
                      )}

                      {canCancelOrder(order) && (
                        <button 
                          onClick={() => cancelOrder(order.id)}
                          className="flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Annuler</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Détails étendus */}
                  {showDetails === order.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Détails de la commande</h4>
                          <div className="space-y-1">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-sm">
                                <span>{item.name} x{item.quantity}</span>
                                <span>{formatPrice(item.price * item.quantity)}</span>
                              </div>
                            ))}
                            <div className="border-t pt-1 mt-2">
                              <div className="flex justify-between font-semibold">
                                <span>Total</span>
                                <span>{formatPrice(order.totalAmount)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Informations de livraison</h4>
                          <div className="text-sm text-gray-600 space-y-1">
                            {order.deliveryAddress && (
                              <p><strong>Adresse:</strong> {order.deliveryAddress}</p>
                            )}
                            {order.phone && (
                              <p><strong>Téléphone:</strong> {order.phone}</p>
                            )}
                            {order.paymentMethod && (
                              <p><strong>Paiement:</strong> {order.paymentMethod === 'card' ? 'Carte bancaire' : 'Espèces'}</p>
                            )}
                            {order.notes && (
                              <p><strong>Notes:</strong> {order.notes}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucune commande trouvée
              </h3>
              <p className="text-gray-600 mb-6">
                Vous n'avez pas encore passé de commande avec ces filtres.
              </p>
              <button
                onClick={() => window.location.href = '/menu'}
                className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
              >
                Découvrir le menu
              </button>
            </div>
          )}
        </div>

        {/* Load More */}
        {filteredOrders.length > 0 && (
          <div className="text-center mt-8">
            <button className="bg-white text-primary-600 border-2 border-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-primary-600 hover:text-white transition-colors">
              Charger plus...
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Orders