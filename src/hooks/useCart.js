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
  
  // Obtenir le panier de l'utilisateur courant
  const currentCart = getCurrentUserCart()
  const items = currentCart.items
  
  // Nouvelles données enrichies avec synchronisation menu
  const enrichedItems = getEnrichedItems()
  const availableItems = getAvailableItems()
  const unavailableItems = getUnavailableItems()
  const totalPriceAvailable = getTotalPriceAvailable()
  const totalItemsAvailable = getTotalItemsAvailable()
  
  // État UI du panier depuis le contexte
  const { isCartOpen: isOpen, openCart, closeCart, toggleCart } = useCartUI()

  const totalItems = getTotalItems()
  const totalPrice = getTotalPrice()

  const handleAddItem = (product) => {
    // Vérifier si l'utilisateur est connecté
    const { isAuthenticated } = useAuthStore.getState()
    
    if (!isAuthenticated) {
      // Afficher un message d'erreur si non connecté
      toast.error('Veuillez vous connecter avant d\'alimenter votre panier')
      return
    }
    
    // Ajouter l'article si connecté
    addItem(product)
    toast.success(`${product.name} ajouté au panier`)
    // Ouvrir brièvement le panier pour feedback visuel
    setTimeout(() => {
      if (!isOpen) openCart()
      setTimeout(() => closeCart(), 2000)
    }, 100)
  }

  const handleRemoveItem = (productId, productName) => {
    removeItem(productId)
    toast.success(`${productName} retiré du panier`)
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
    toast.success('Panier vidé')
    closeCart()
  }

  const handleSyncWithMenu = () => {
    syncWithMenu()
    console.log('🔄 Panier synchronisé avec le menu')
  }

  // Formatage du prix
  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price)
  }

  return {
    // État original
    items,
    isOpen,
    totalItems,
    totalPrice: totalPrice,
    formattedTotalPrice: formatPrice(totalPrice),
    isEmpty: items.length === 0,

    // Nouvel état enrichi avec synchronisation menu
    enrichedItems,
    availableItems,
    unavailableItems,
    totalItemsAvailable,
    totalPriceAvailable,
    formattedTotalPriceAvailable: formatPrice(totalPriceAvailable),
    hasUnavailableItems: unavailableItems.length > 0,

    // Actions avec feedback
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
    
    // Utilitaires
    isItemInCart,
    getItemQuantity,
    formatPrice
  }
}