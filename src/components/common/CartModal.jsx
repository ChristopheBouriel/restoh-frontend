import React from 'react'
import { X, Plus, Minus, Trash2, ShoppingBag, AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../../hooks/useCart'
import { useCartUI } from '../../contexts/CartUIContext'
import ImageWithFallback from './ImageWithFallback'
import { ROUTES } from '../../constants'

const CartModal = () => {
  const navigate = useNavigate()
  const {
    items,
    totalItems,
    formattedTotalPrice,
    isEmpty,
    enrichedItems,
    availableItems,
    unavailableItems,
    totalItemsAvailable,
    formattedTotalPriceAvailable,
    hasUnavailableItems,
    increaseQuantity,
    decreaseQuantity,
    removeItem,
    clearCart,
    syncWithMenu,
    formatPrice
  } = useCart()
  
  const { isCartOpen: isOpen, closeCart } = useCartUI()
  
  // Sync with menu when opening the cart
  React.useEffect(() => {
    if (isOpen) {
      syncWithMenu()
    }
  }, [isOpen, syncWithMenu])

  if (!isOpen) return null

  const handleCheckout = () => {
    closeCart()
    navigate(ROUTES.CHECKOUT)
  }

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={closeCart}
      />
      
      {/* Modal */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold flex items-center">
            <ShoppingBag className="w-5 h-5 mr-2" />
            My Cart ({totalItems})
          </h2>
          <button
            onClick={closeCart}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <ShoppingBag className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Your cart is empty
              </h3>
              <p className="text-gray-500 mb-6">
                Discover our delicious dishes and add them to your cart!
              </p>
              <button
                onClick={() => {
                  closeCart()
                  navigate(ROUTES.MENU)
                }}
                className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
              >
                View menu
              </button>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {/* Alert for unavailable items */}
              {hasUnavailableItems && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center">
                    <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                    <p className="text-sm text-red-700">
                      {unavailableItems.length} unavailable item(s) in your cart
                    </p>
                  </div>
                </div>
              )}

              {enrichedItems.map((item) => (
                <div 
                  key={item.id} 
                  className={`flex items-center space-x-3 rounded-lg p-3 ${
                    !item.isAvailable || !item.stillExists
                      ? 'bg-red-50 border border-red-200'
                      : 'bg-brown-100'
                  }`}
                >
                  {/* Image */}
                  <div className="w-16 h-16 bg-gray-200 rounded-md overflow-hidden flex-shrink-0 relative">
                    <ImageWithFallback
                      src={item.image}
                      alt={item.name}
                      className={`w-full h-full object-cover ${
                        !item.isAvailable || !item.stillExists ? 'opacity-50 grayscale' : ''
                      }`}
                    />
                    {(!item.isAvailable || !item.stillExists) && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="bg-red-500 text-white text-xs px-1 py-0.5 rounded">
                          {!item.stillExists ? 'DELETED' : 'UNAVAILABLE'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-medium truncate ${
                      !item.isAvailable || !item.stillExists 
                        ? 'text-red-700 line-through' 
                        : 'text-gray-900'
                    }`}>
                      {item.name}
                    </h3>
                    <p className={`text-sm ${
                      !item.isAvailable || !item.stillExists
                        ? 'text-red-500'
                        : 'text-gray-500'
                    }`}>
                      {formatPrice(item.currentPrice)} each
                    </p>
                    {(item.isAvailable && item.stillExists) ? (
                      <p className="text-sm font-medium text-primary-600">
                        {formatPrice(item.currentPrice * item.quantity)}
                      </p>
                    ) : (
                      <p className="text-sm font-medium text-red-500">
                        Not included in total
                      </p>
                    )}
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center space-x-2">
                    <div className={`flex items-center space-x-1 rounded-md border ${
                      !item.isAvailable || !item.stillExists 
                        ? 'bg-red-100 border-red-300' 
                        : 'bg-white'
                    }`}>
                      <button
                        onClick={() => decreaseQuantity(item.id)}
                        disabled={!item.isAvailable || !item.stillExists}
                        className={`p-1 rounded-l-md transition-colors ${
                          !item.isAvailable || !item.stillExists
                            ? 'text-red-400 cursor-not-allowed'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className={`px-2 py-1 text-sm font-medium min-w-[2rem] text-center ${
                        !item.isAvailable || !item.stillExists ? 'text-red-600' : ''
                      }`}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => increaseQuantity(item.id)}
                        disabled={!item.isAvailable || !item.stillExists}
                        className={`p-1 rounded-r-md transition-colors ${
                          !item.isAvailable || !item.stillExists
                            ? 'text-red-400 cursor-not-allowed'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <button
                      onClick={() => removeItem(item.id, item.name)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Clear cart */}
              <button
                onClick={clearCart}
                className="w-full text-sm text-gray-500 hover:text-red-500 transition-colors border-t pt-4 mt-4"
              >
                Empty cart
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {!isEmpty && (
          <div className="border-t p-4 space-y-4">
            {/* Detailed totals */}
            <div className="space-y-2">
              {hasUnavailableItems && (
                <>
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>Original total:</span>
                    <span className="line-through">{formattedTotalPrice}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-green-600">
                    <span>Available total ({totalItemsAvailable} items):</span>
                    <span>{formattedTotalPriceAvailable}</span>
                  </div>
                </>
              )}

              <div className="flex justify-between items-center text-lg font-semibold border-t pt-2">
                <span>Total to pay:</span>
                <span className="text-primary-600">
                  {hasUnavailableItems ? formattedTotalPriceAvailable : formattedTotalPrice}
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <button
                onClick={handleCheckout}
                disabled={totalItemsAvailable === 0}
                className={`w-full py-3 rounded-lg font-medium transition-colors ${
                  totalItemsAvailable === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-primary-600 text-white hover:bg-primary-700'
                }`}
              >
                {totalItemsAvailable === 0
                  ? 'No items available'
                  : `Order - ${hasUnavailableItems ? formattedTotalPriceAvailable : formattedTotalPrice}`
                }
              </button>

              <button
                onClick={() => {
                  closeCart()
                  navigate(ROUTES.MENU)
                }}
                className="w-full bg-white border-2 border-primary-600 text-primary-600 py-2 rounded-lg font-medium hover:border-primary-700 hover:text-primary-700 transition-colors"
              >
                Continue shopping
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default CartModal