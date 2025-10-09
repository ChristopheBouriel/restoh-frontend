import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreditCard, MapPin, User, ShoppingBag, Check } from 'lucide-react'
import { useCart } from '../../hooks/useCart'
import { useAuth } from '../../hooks/useAuth'
import useOrdersStore from '../../store/ordersStore'
import { toast } from 'react-hot-toast'
import { ROUTES } from '../../constants'

const Checkout = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { 
    availableItems, 
    totalItemsAvailable, 
    formattedTotalPriceAvailable, 
    totalPriceAvailable,
    clearCart,
    formatPrice 
  } = useCart()
  const { createOrder } = useOrdersStore()
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [orderCompleted, setOrderCompleted] = useState(false)
  const [completedOrderId, setCompletedOrderId] = useState('')
  
  const [formData, setFormData] = useState({
    deliveryAddress: '',
    phone: '',
    notes: '',
    paymentMethod: 'card',
    type: 'delivery'
  })

  // Auto-switch to card if pickup is selected with cash
  useEffect(() => {
    if (formData.type === 'pickup' && formData.paymentMethod === 'cash') {
      setFormData(prev => ({ ...prev, paymentMethod: 'card' }))
    }
  }, [formData.type, formData.paymentMethod])

  // Redirect if cart is empty or user not logged in
  if (!user) {
    navigate(ROUTES.LOGIN)
    return null
  }

  if (totalItemsAvailable === 0) {
    navigate(ROUTES.MENU)
    return null
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsProcessing(true)

    try {
      // Order processing simulation
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Create order
      const orderData = {
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        items: availableItems,
        totalAmount: totalPriceAvailable,
        deliveryAddress: formData.deliveryAddress,
        phone: formData.phone,
        notes: formData.notes,
        paymentMethod: formData.paymentMethod,
        orderType: formData.type
      }

      const result = await createOrder(orderData)
      
      if (result.success) {
        // Clear cart
        clearCart()

        // Show confirmation
        setCompletedOrderId(result.orderId)
        setOrderCompleted(true)
        toast.success('🎉 Order placed successfully!')
      } else {
        throw new Error(result.error || 'Error creating order')
      }
    } catch (error) {
      toast.error('Error processing order')
      console.error('Checkout error:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  // Order confirmation view
  if (orderCompleted) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Order confirmed!
            </h1>

            <p className="text-gray-600 mb-6">
              Your order <strong>#{completedOrderId}</strong> has been received and is being processed.
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600">
                <strong>Total paid:</strong> {formattedTotalPriceAvailable}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Items:</strong> {totalItemsAvailable}
              </p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => navigate(ROUTES.ORDERS)}
                className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
              >
                View my orders
              </button>

              <button
                onClick={() => navigate(ROUTES.MENU)}
                className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Continue shopping
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Order form */}
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Complete your order</h1>
              <p className="text-gray-600">Complete your delivery information</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Customer information */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Customer information
                </h2>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full name
                    </label>
                    <input
                      type="text"
                      value={user.name}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                  </div>
                </div>
              </div>

              {/* Order Type */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Order Type
                </h2>

                <div className="space-y-3">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="type"
                      value="delivery"
                      checked={formData.type === 'delivery'}
                      onChange={handleInputChange}
                      className="mr-3"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      🚚 Delivery
                    </span>
                  </label>

                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="type"
                      value="pickup"
                      checked={formData.type === 'pickup'}
                      onChange={handleInputChange}
                      className="mr-3"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      🏪 Pickup
                    </span>
                  </label>
                </div>
              </div>

              {/* Delivery address - only if delivery */}
              {formData.type === 'delivery' && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Delivery Address
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Delivery address *
                    </label>
                    <textarea
                      name="deliveryAddress"
                      value={formData.deliveryAddress}
                      onChange={handleInputChange}
                      required
                      rows={3}
                      placeholder="123 Rue de la Paix, 75001 Paris"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      placeholder="06 12 34 56 78"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Delivery instructions
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows={2}
                      placeholder="Floor, access code, special instructions..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>
              )}

              {/* Payment */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Payment
                </h2>
                
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={formData.paymentMethod === 'card'}
                      onChange={handleInputChange}
                      className="mr-3"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      💳 Credit card (simulated)
                    </span>
                  </label>

                  <label className={`flex items-center ${formData.type === 'pickup' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cash"
                      checked={formData.paymentMethod === 'cash'}
                      onChange={handleInputChange}
                      disabled={formData.type === 'pickup'}
                      className="mr-3"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      💰 Cash on delivery {formData.type === 'pickup' && '(not available for pickup)'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Order button */}
              <button
                type="submit"
                disabled={isProcessing}
                className={`w-full py-4 rounded-lg font-medium text-lg transition-colors ${
                  isProcessing
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-primary-600 hover:bg-primary-700'
                } text-white`}
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing...
                  </span>
                ) : (
                  `Order - ${formattedTotalPriceAvailable}`
                )}
              </button>
            </form>
          </div>

          {/* Order summary */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <ShoppingBag className="w-5 h-5 mr-2" />
                Order summary
              </h2>
              
              <div className="space-y-4">
                {availableItems.map((item) => (
                  <div key={item.id} className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-md overflow-hidden">
                      <img
                        src={`/images/menu/${item.image}`}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-500">
                        {formatPrice(item.price)} × {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-4 mt-4 space-y-2">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total ({totalItemsAvailable} items)</span>
                  <span className="text-primary-600">{formattedTotalPriceAvailable}</span>
                </div>

                <div className="text-sm text-gray-500">
                  <p>• Estimated delivery: 30-45 minutes</p>
                  <p>• Secure payment</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Checkout