import { useState, useEffect } from 'react'
import { Clock, Package, CheckCircle, XCircle, Eye } from 'lucide-react'
import { useOrders } from '../../hooks/useOrders'
import useOrdersStore from '../../store/ordersStore'
import InlineAlert from '../../components/common/InlineAlert'

const Orders = () => {
  const [filter, setFilter] = useState('all')
  const [showDetails, setShowDetails] = useState(null)
  const [inlineError, setInlineError] = useState(null) // Error with details for InlineAlert

  const { fetchOrders } = useOrdersStore()
  const { orders, cancelOrder, canCancelOrder, formatPrice, formatDate } = useOrders()

  useEffect(() => {
    // Load orders for the logged-in user
    fetchOrders(false) // false = user (not admin)
  }, [fetchOrders])

  const filteredOrders = orders.filter(order => 
    filter === 'all' || order.status === filter
  )

  const handleCancelOrder = async (orderId) => {
    // Clear any previous inline error
    setInlineError(null)

    const result = await cancelOrder(orderId)

    if (result && !result.success) {
      // Check for ORDER_INVALID_STATUS with details
      if (result.code === 'ORDER_INVALID_STATUS' && result.details) {
        setInlineError(result)
        // Scroll to top to show the alert
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
      // Else: error was already shown as toast in the hook
    }
  }

  const getStatusInfo = (status) => {
    switch (status) {
      case 'delivered':
        return {
          label: 'Delivered',
          color: 'text-green-600 bg-green-50',
          icon: CheckCircle
        }
      case 'preparing':
        return {
          label: 'Preparing',
          color: 'text-yellow-600 bg-yellow-50',
          icon: Clock
        }
      case 'ready':
        return {
          label: 'Ready',
          color: 'text-blue-600 bg-blue-50',
          icon: Package
        }
      case 'confirmed':
        return {
          label: 'Confirmed',
          color: 'text-indigo-600 bg-indigo-50',
          icon: CheckCircle
        }
      case 'pending':
        return {
          label: 'Pending',
          color: 'text-orange-600 bg-orange-50',
          icon: Clock
        }
      case 'cancelled':
        return {
          label: 'Cancelled',
          color: 'text-red-600 bg-red-50',
          icon: XCircle
        }
      default:
        return {
          label: 'In progress',
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
          <p className="text-gray-600">Track the status of your orders</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'All orders' },
              { key: 'pending', label: 'Pending' },
              { key: 'confirmed', label: 'Confirmed' },
              { key: 'preparing', label: 'Preparing' },
              { key: 'ready', label: 'Ready' },
              { key: 'delivered', label: 'Delivered' },
              { key: 'cancelled', label: 'Cancelled' }
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

        {/* InlineAlert for ORDER_INVALID_STATUS */}
        {inlineError && inlineError.code === 'ORDER_INVALID_STATUS' && inlineError.details && (
          <InlineAlert
            type="error"
            message={inlineError.error}
            details={inlineError.details.message || 'This order cannot be cancelled at this time due to its current status.'}
            dismissible={false}
          />
        )}

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
                          Command #{order.orderNumber}
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
                        {order.items && order.items.length > 0 ? (
                          order.items.map(item =>
                            `${item.name || 'Unknown item'}${item.quantity > 1 ? ` x${item.quantity}` : ''}`
                          ).join(', ')
                        ) : (
                          'No items'
                        )}
                      </p>

                      <p className="text-lg font-bold text-primary-600">
                        {formatPrice(order.totalPrice)}
                      </p>
                    </div>

                    <div className="mt-4 md:mt-0 flex flex-col space-y-2">
                      <button
                        onClick={() => setShowDetails(showDetails === order.id ? null : order.id)}
                        className="flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        <span>{showDetails === order.id ? 'Hide' : 'View details'}</span>
                      </button>

                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        disabled={!canCancelOrder(order)}
                        className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                          canCancelOrder(order)
                            ? 'bg-red-600 text-white hover:bg-red-700'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </div>

                  {/* Extended details */}
                  {showDetails === order.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Order details</h4>
                          <div className="space-y-1">
                            {order.items && order.items.length > 0 ? (
                              order.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-sm">
                                  <span>{item.name || 'Unknown item'} x{item.quantity || 1}</span>
                                  <span>{formatPrice((item.price || 0) * (item.quantity || 1))}</span>
                                </div>
                              ))
                            ) : (
                              <div className="text-sm text-gray-500">No items</div>
                            )}
                            <div className="border-t pt-1 mt-2">
                              <div className="flex justify-between font-semibold">
                                <span>Total</span>
                                <span>{formatPrice(order.totalPrice)}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Order information</h4>
                          <div className="text-sm text-gray-600 space-y-1">
                            {order.orderType && (
                              <p><strong>Type:</strong> {order.orderType === 'delivery' ? 'Delivery' : 'Pick-up'}</p>
                            )}
                            {order.orderType === 'delivery' && order.deliveryAddress && (
                              <div>
                                <p><strong>Address:</strong></p>
                                <p className="ml-2">{order.deliveryAddress.street}</p>
                                <p className="ml-2">{order.deliveryAddress.zipCode} {order.deliveryAddress.city}</p>
                                {order.deliveryAddress.instructions && (
                                  <p className="ml-2 text-xs text-gray-500 italic">
                                    {order.deliveryAddress.instructions}
                                  </p>
                                )}
                              </div>
                            )}
                            {order.phone && (
                              <p><strong>Phone:</strong> {order.phone}</p>
                            )}
                            {order.paymentMethod && (
                              <p><strong>Payment:</strong> {order.paymentMethod === 'card' ? 'Card' : 'Cash'}</p>
                            )}
                            {order.specialInstructions && (
                              <p><strong>Special instructions:</strong> {order.specialInstructions}</p>
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
                No orders found
              </h3>
              <p className="text-gray-600 mb-6">
                You haven't placed any orders with these filters yet.
              </p>
              <button
                onClick={() => window.location.href = '/menu'}
                className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
              >
                Discover the menu
              </button>
            </div>
          )}
        </div>

        {/* Load More */}
        {filteredOrders.length > 0 && (
          <div className="text-center mt-8">
            <button className="bg-white text-primary-600 border-2 border-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-primary-600 hover:text-white transition-colors">
              Load more...
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Orders