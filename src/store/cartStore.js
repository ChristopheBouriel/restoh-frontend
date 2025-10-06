import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import useMenuStore from './menuStore'

const useCartStore = create(
  persist(
    (set, get) => ({
      // État - maintenant organisé par utilisateur
      userCarts: {}, // { userId: { items: [] }, ... }
      currentUserId: null,
      
      // Fonctions utilitaires pour la gestion par utilisateur
      setCurrentUser: (userId) => {
        set({ currentUserId: userId })
        // Initialiser le panier de l'utilisateur s'il n'existe pas
        const state = get()
        if (userId && !state.userCarts[userId]) {
          set({
            userCarts: {
              ...state.userCarts,
              [userId]: { items: [] }
            }
          })
        }
      },

      getCurrentUserCart: () => {
        const state = get()
        const userId = state.currentUserId
        if (!userId || !state.userCarts[userId]) {
          return { items: [] }
        }
        return state.userCarts[userId]
      },

      updateCurrentUserCart: (updates) => {
        const state = get()
        const userId = state.currentUserId
        if (!userId) return

        set({
          userCarts: {
            ...state.userCarts,
            [userId]: {
              ...state.userCarts[userId],
              ...updates
            }
          }
        })
      },

      // Computed values - mis à jour pour l'utilisateur courant
      getTotalItems: () => {
        const cart = get().getCurrentUserCart()
        return cart.items.reduce((total, item) => total + item.quantity, 0)
      },
      
      getTotalPrice: () => {
        const cart = get().getCurrentUserCart()
        return cart.items.reduce((total, item) => total + (item.price * item.quantity), 0)
      },

      // Actions - mis à jour pour l'utilisateur courant
      addItem: (product) => {
        const cart = get().getCurrentUserCart()
        const existingItem = cart.items.find(item => item.id === product.id)
        
        if (existingItem) {
          // Si l'item existe, augmenter la quantité
          get().updateCurrentUserCart({
            items: cart.items.map(item =>
              item.id === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            )
          })
        } else {
          // Sinon, ajouter le nouvel item
          get().updateCurrentUserCart({
            items: [...cart.items, { ...product, quantity: 1 }]
          })
        }
      },

      removeItem: (productId) => {
        const cart = get().getCurrentUserCart()
        get().updateCurrentUserCart({
          items: cart.items.filter(item => item.id !== productId)
        })
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }
        
        const cart = get().getCurrentUserCart()
        get().updateCurrentUserCart({
          items: cart.items.map(item =>
            item.id === productId
              ? { ...item, quantity }
              : item
          )
        })
      },

      increaseQuantity: (productId) => {
        const cart = get().getCurrentUserCart()
        const item = cart.items.find(item => item.id === productId)
        if (item) {
          get().updateQuantity(productId, item.quantity + 1)
        }
      },

      decreaseQuantity: (productId) => {
        const cart = get().getCurrentUserCart()
        const item = cart.items.find(item => item.id === productId)
        if (item && item.quantity > 1) {
          get().updateQuantity(productId, item.quantity - 1)
        } else if (item && item.quantity === 1) {
          get().removeItem(productId)
        }
      },

      clearCart: () => {
        get().updateCurrentUserCart({ items: [] })
      },

      // Utilitaires - mis à jour pour l'utilisateur courant
      isItemInCart: (productId) => {
        const cart = get().getCurrentUserCart()
        return cart.items.some(item => item.id === productId)
      },

      getItemQuantity: (productId) => {
        const cart = get().getCurrentUserCart()
        const item = cart.items.find(item => item.id === productId)
        return item ? item.quantity : 0
      },

      // Nouvelles fonctions pour la synchronisation avec le menu
      getEnrichedItems: () => {
        const cart = get().getCurrentUserCart()
        const cartItems = cart.items
        const menuItems = useMenuStore.getState().items
        
        return cartItems.map(cartItem => {
          const menuItem = menuItems.find(menu => menu.id === cartItem.id)
          
          return {
            ...cartItem,
            isAvailable: menuItem ? menuItem.available : false,
            currentPrice: menuItem ? menuItem.price : cartItem.price,
            stillExists: !!menuItem
          }
        })
      },

      getAvailableItems: () => {
        return get().getEnrichedItems().filter(item => item.isAvailable && item.stillExists)
      },

      getUnavailableItems: () => {
        return get().getEnrichedItems().filter(item => !item.isAvailable || !item.stillExists)
      },

      getTotalPriceAvailable: () => {
        return get().getAvailableItems().reduce((total, item) => total + (item.currentPrice * item.quantity), 0)
      },

      getTotalItemsAvailable: () => {
        return get().getAvailableItems().reduce((total, item) => total + item.quantity, 0)
      },

      // Fonction pour synchroniser le panier avec les changements du menu
      syncWithMenu: () => {
        console.log('🔄 Synchronisation du panier avec le menu')
        // Pour l'instant, on ne fait que signaler la synchronisation
        // L'enrichissement se fait à la volée via getEnrichedItems()
      },

      // Fonction de debug pour voir l'état actuel
      debugLogState: () => {
        const state = get()
        console.log('🧽 Debug - Current cart state:', {
          currentUserId: state.currentUserId,
          userCarts: state.userCarts,
          currentCart: state.getCurrentUserCart(),
          enrichedItems: state.getEnrichedItems()
        })
      }
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ 
        userCarts: state.userCarts 
      }),
    }
  )
)

export default useCartStore