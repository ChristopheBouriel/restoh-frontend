import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { CreditCard, MapPin, User, ShoppingBag, Check, MessageSquare } from 'lucide-react'
import { useCart } from '../../hooks/useCart'
import { useAuth } from '../../hooks/useAuth'
import useOrdersStore from '../../store/ordersStore'
import { OrderService } from '../../services/orders'
import ImageWithFallback from '../../components/common/ImageWithFallback'
import InlineAlert from '../../components/common/InlineAlert'
import { toast } from 'react-hot-toast'
import { ROUTES } from '../../constants'
import { validationRules } from '../../utils/formValidators'

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
  const [inlineError, setInlineError] = useState(null) // Error with details for InlineAlert

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors }
  } = useForm({
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      street: '',
      city: '',
      zipCode: '',
      phone: '',
      instructions: '',
      specialRequests: '',
      paymentMethod: 'card',
      type: 'delivery'
    }
  })

  // Watch order type for conditional rendering
  const orderType = watch('type')
  const paymentMethod = watch('paymentMethod')

  // Prefill phone and address from user profile
  useEffect(() => {
    if (user) {
      reset({
        phone: user.phone || '',
        street: user.address?.street || '',
        city: user.address?.city || '',
        zipCode: user.address?.zipCode || '',
        instructions: '',
        specialRequests: '',
        paymentMethod: 'card',
        type: 'delivery'
      })
    }
  }, [user, reset])

  // Auto-switch to card if pickup is selected with cash
  useEffect(() => {
    if (orderType === 'pickup' && paymentMethod === 'cash') {
      setValue('paymentMethod', 'card')
    }
  }, [orderType, paymentMethod, setValue])

  // Redirect if cart is empty or user not logged in
  if (!user) {
    navigate(ROUTES.LOGIN)
    return null
  }

  if (totalItemsAvailable === 0) {
    navigate(ROUTES.MENU)
    return null
  }

  const onSubmit = async (data) => {
    setIsProcessing(true)

    // Clear any previous inline error
    setInlineError(null)

    try {
      // Order processing simulation
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Create order
      // Format items for backend: use menuItem instead of id
      const formattedItems = availableItems.map(item => ({
        menuItem: item.id,
        quantity: item.quantity,
        specialInstructions: item.specialInstructions || null
      }))

      const orderData = {
        userId: user.id,
        items: formattedItems,
        totalPrice: totalPriceAvailable,
        deliveryAddress: data.type === 'delivery' ? {
          street: data.street,
          city: data.city,
          zipCode: data.zipCode,
          instructions: data.instructions || null
        } : null,
        phone: data.phone,
        specialInstructions: data.specialRequests || null,
        paymentMethod: data.paymentMethod,
        paymentStatus: data.paymentMethod === 'card' ? 'paid' : 'pending',
        orderType: data.type
      }

      // Validate order data before sending to API
      const validation = OrderService.validateOrderData(orderData)
      if (!validation.isValid) {
        const firstError = Object.values(validation.errors)[0]
        toast.error(firstError || 'Invalid order data')
        setIsProcessing(false)
        return
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
        // Check for payment errors with details
        if (result.details && (result.code === 'INVALID_AMOUNT' || result.code === 'PAYMENT_INTENT_CREATION_FAILED')) {
          setInlineError(result)
          // Scroll to top to show the alert
          window.scrollTo({ top: 0, behavior: 'smooth' })
        } else {
          // Simple error - show toast
          toast.error(result.error || 'Error processing order')
        }
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
      <div className="min-h-screen bg-brown-200 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg border border-brown-400 p-8 text-center">
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
    <div className="min-h-screen bg-brown-200 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Order form */}
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Complete your order</h1>
              <p className="text-gray-600">Complete your delivery information</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* InlineAlert for payment errors */}
              {/* Case 1: Invalid amount error */}
              {inlineError && inlineError.code === 'INVALID_AMOUNT' && inlineError.details && (
                <InlineAlert
                  type="error"
                  message={inlineError.error}
                  details={inlineError.details.message || 'The order amount is invalid. Please verify your cart and try again.'}
                  onDismiss={() => setInlineError(null)}
                />
              )}

              {/* Case 2: Payment intent creation failed (Stripe error - retryable) */}
              {inlineError && inlineError.code === 'PAYMENT_INTENT_CREATION_FAILED' && inlineError.details && (
                <InlineAlert
                  type="error"
                  message={inlineError.error}
                  details={inlineError.details.message || 'There was a temporary issue processing your payment. Please try again.'}
                  actions={[
                    {
                      label: 'Try again',
                      onClick: () => {
                        setInlineError(null)
                        toast.info('Please resubmit your order')
                      },
                      variant: 'primary'
                    }
                  ]}
                  onDismiss={() => setInlineError(null)}
                />
              )}

              {/* Customer information */}
              <div className="bg-white rounded-lg shadow-sm border border-brown-400 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Customer information
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full name
                    </label>
                    <input
                      type="text"
                      value={user.name}
                      disabled
                      className="w-full px-3 py-2 border-2 border-primary-300 rounded-md bg-gray-50"
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
                      className="w-full px-3 py-2 border-2 border-primary-300 rounded-md bg-gray-50"
                    />
                  </div>
                </div>
              </div>

              {/* Order Type */}
              <div className="bg-white rounded-lg shadow-sm border border-brown-400 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Order Type
                </h2>

                <div className="space-y-3">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      value="delivery"
                      {...register('type')}
                      className="mr-3"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      🚚 Delivery
                    </span>
                  </label>

                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      value="pickup"
                      {...register('type')}
                      className="mr-3"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      🏪 Pickup
                    </span>
                  </label>
                </div>
              </div>

              {/* Special requests */}
              <div className="bg-white rounded-lg shadow-sm border border-brown-400 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Special requests
                </h2>

                <div>
                  <label htmlFor="specialRequests" className="block text-sm font-medium text-gray-700 mb-2">
                    Any special requests for your order? (optional)
                  </label>
                  <textarea
                    id="specialRequests"
                    {...register('specialRequests')}
                    rows={3}
                    placeholder="Allergies, dietary restrictions, preparation preferences..."
                    className="input-primary"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    These requests apply to your entire order
                  </p>
                </div>
              </div>

              {/* Phone for pickup */}
              {orderType === 'pickup' && (
              <div className="bg-white rounded-lg shadow-sm border border-brown-400 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Contact Information
                </h2>

                <div>
                  <label htmlFor="phone-pickup" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone *
                  </label>
                  <input
                    id="phone-pickup"
                    type="tel"
                    {...register('phone', validationRules.phoneRequired)}
                    placeholder="0612345678"
                    className={`input-primary ${errors.phone ? 'border-red-300' : ''}`}
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    We&apos;ll call you when your order is ready for pickup
                  </p>
                </div>
              </div>
              )}

              {/* Delivery address - only if delivery */}
              {orderType === 'delivery' && (
              <div className="bg-white rounded-lg shadow-sm border border-brown-400 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Delivery Address
                </h2>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-2">
                      Street *
                    </label>
                    <input
                      id="street"
                      type="text"
                      {...register('street', validationRules.address)}
                      placeholder="123 Rue de la Paix"
                      className={`input-primary ${errors.street ? 'border-red-300' : ''}`}
                    />
                    {errors.street && (
                      <p className="mt-1 text-sm text-red-600">{errors.street.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                        City *
                      </label>
                      <input
                        id="city"
                        type="text"
                        {...register('city', { required: 'City is required' })}
                        placeholder="Paris"
                        className={`input-primary ${errors.city ? 'border-red-300' : ''}`}
                      />
                      {errors.city && (
                        <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-2">
                        Zip Code *
                      </label>
                      <input
                        id="zipCode"
                        type="text"
                        {...register('zipCode', {
                          required: 'Zip code is required',
                          pattern: {
                            value: /^[0-9]{5}$/,
                            message: 'Invalid zip code (5 digits)'
                          }
                        })}
                        placeholder="75001"
                        maxLength="5"
                        className={`input-primary ${errors.zipCode ? 'border-red-300' : ''}`}
                      />
                      {errors.zipCode && (
                        <p className="mt-1 text-sm text-red-600">{errors.zipCode.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="phone-delivery" className="block text-sm font-medium text-gray-700 mb-2">
                      Phone *
                    </label>
                    <input
                      id="phone-delivery"
                      type="tel"
                      {...register('phone', validationRules.phoneRequired)}
                      placeholder="0612345678"
                      className={`input-primary ${errors.phone ? 'border-red-300' : ''}`}
                    />
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="instructions" className="block text-sm font-medium text-gray-700 mb-2">
                      Delivery instructions
                    </label>
                    <textarea
                      id="instructions"
                      {...register('instructions')}
                      rows={2}
                      placeholder="Floor, access code, special instructions..."
                      className="input-primary"
                    />
                  </div>
                </div>
              </div>
              )}

              {/* Payment */}
              <div className="bg-white rounded-lg shadow-sm border border-brown-400 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Payment
                </h2>

                <div className="space-y-3">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      value="card"
                      {...register('paymentMethod')}
                      className="mr-3"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      💳 Credit card (simulated)
                    </span>
                  </label>

                  <label className={`flex items-center ${orderType === 'pickup' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                    <input
                      type="radio"
                      value="cash"
                      {...register('paymentMethod')}
                      disabled={orderType === 'pickup'}
                      className="mr-3"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      💰 Cash on delivery {orderType === 'pickup' && '(not available for pickup)'}
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
            <div className="bg-white rounded-lg shadow-sm border border-brown-400 p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <ShoppingBag className="w-5 h-5 mr-2" />
                Order summary
              </h2>
              
              <div className="space-y-4">
                {availableItems.map((item) => (
                  <div key={item.id} className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-md overflow-hidden">
                      <ImageWithFallback
                        src={item.image}
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
              
              <div className="border-t-2 border-primary-300 pt-4 mt-4 space-y-2">
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