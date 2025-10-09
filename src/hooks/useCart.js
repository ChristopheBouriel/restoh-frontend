import { toast } from 'react-hot-toast'
import useCartStore from '../store/cartStore'
import useAuthStore from '../store/authStore'
import { useCartUI } from '../contexts/CartUIContext'

export const useCart = () => {
  const {
    getCurrentUserCart,
    getTotalItems,
    getTotalPrice,
    getEnrichedItems,
    getAvailableItems,
    getUnavailableItems,
    getTotalPriceAvailable,
    getTotalItemsAvailable,
    addItem,
    removeItem,
    updateQuantity,
    increaseQuantity,
    decreaseQuantity,
    clearCart,
    isItemInCart,
    getItemQuantity,
    syncWithMenu
  } = useCartStore()


  // Get current user's cart
  const currentCart = getCurrentUserCart()
  const items = currentCart.items

  // New enriched data with menu synchronization
  const enrichedItems = getEnrichedItems()
  const availableItems = getAvailableItems()
  const unavailableItems = getUnavailableItems()
  const totalPriceAvailable = getTotalPriceAvailable()
  const totalItemsAvailable = getTotalItemsAvailable()

  // Cart UI state from context
  const { isCartOpen: isOpen, openCart, closeCart, toggleCart } = useCartUI()

  const totalItems = getTotalItems()
  const totalPrice = getTotalPrice()

  const handleAddItem = (product) => {
    // Check if user is logged in
    const { isAuthenticated } = useAuthStore.getState()

    if (!isAuthenticated) {
      // Show error message if not logged in
      toast.error('Please log in before adding items to your cart')
      return
    }

    // Add item if logged in
    addItem(product)
    toast.success(`${product.name} added to cart`)
    // Briefly open cart for visual feedback
    setTimeout(() => {
      if (!isOpen) openCart()
      setTimeout(() => closeCart(), 2000)
    }, 100)
  }

  const handleRemoveItem = (productId, productName) => {
    removeItem(productId)
    toast.success(`${productName} removed from cart`)
  }

  const handleUpdateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      const item = items.find(item => item.id === productId)
      if (item) {
        handleRemoveItem(productId, item.name)
      }
    } else {
      updateQuantity(productId, quantity)
    }
  }

  const handleClearCart = () => {
    clearCart()
    toast.success('Cart cleared')
    closeCart()
  }

  const handleSyncWithMenu = () => {
    syncWithMenu()
    console.log('🔄 Cart synced with menu')
  }

  // Price formatting
  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price)
  }

  return {
    // Original state
    items,
    isOpen,
    totalItems,
    totalPrice: totalPrice,
    formattedTotalPrice: formatPrice(totalPrice),
    isEmpty: items.length === 0,

    // New enriched state with menu synchronization
    enrichedItems,
    availableItems,
    unavailableItems,
    totalItemsAvailable,
    totalPriceAvailable,
    formattedTotalPriceAvailable: formatPrice(totalPriceAvailable),
    hasUnavailableItems: unavailableItems.length > 0,

    // Actions with feedback
    addItem: handleAddItem,
    removeItem: handleRemoveItem,
    updateQuantity: handleUpdateQuantity,
    increaseQuantity,
    decreaseQuantity,
    clearCart: handleClearCart,
    syncWithMenu: handleSyncWithMenu,
    
    // UI
    toggleCart,
    openCart,
    closeCart,

    // Utilities
    isItemInCart,
    getItemQuantity,
    formatPrice
  }
}