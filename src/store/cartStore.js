import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import useMenuStore from './menuStore'

const useCartStore = create(
  persist(
    (set, get) => ({
      // State - now organized per user
      userCarts: {}, // { userId: { items: [] }, ... }
      currentUserId: null,

      // Utility functions for per-user management
      setCurrentUser: (userId) => {
        set({ currentUserId: userId })
        // Initialize user cart if it doesn't exist
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

      // Computed values - updated for current user
      getTotalItems: () => {
        const cart = get().getCurrentUserCart()
        return cart.items.reduce((total, item) => total + item.quantity, 0)
      },
      
      getTotalPrice: () => {
        const cart = get().getCurrentUserCart()
        return cart.items.reduce((total, item) => total + (item.price * item.quantity), 0)
      },

      // Actions - updated for current user
      addItem: (product) => {
        const cart = get().getCurrentUserCart()
        const existingItem = cart.items.find(item => item.id === product.id)
        
        if (existingItem) {
          // If item exists, increase quantity
          get().updateCurrentUserCart({
            items: cart.items.map(item =>
              item.id === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            )
          })
        } else {
          // Otherwise, add new item
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

      // Utilities - updated for current user
      isItemInCart: (productId) => {
        const cart = get().getCurrentUserCart()
        return cart.items.some(item => item.id === productId)
      },

      getItemQuantity: (productId) => {
        const cart = get().getCurrentUserCart()
        const item = cart.items.find(item => item.id === productId)
        return item ? item.quantity : 0
      },

      // New functions for menu synchronization
      getEnrichedItems: () => {
        const cart = get().getCurrentUserCart()
        const cartItems = cart.items
        const menuItems = useMenuStore.getState().items
        
        return cartItems.map(cartItem => {
          const menuItem = menuItems.find(menu => menu.id === cartItem.id)

          // Optimistic approach: assume everything is available
          // This will work properly once backend is connected with real IDs
          return {
            ...cartItem,
            isAvailable: menuItem ? menuItem.available : true,
            currentPrice: menuItem ? menuItem.price : cartItem.price,
            stillExists: menuItem ? true : true // Always true for now
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

      // Function to sync cart with menu changes
      syncWithMenu: () => {
        console.log('🔄 Syncing cart with menu')
        // For now, only signals synchronization
        // Enrichment is done on-the-fly via getEnrichedItems()
      },

      // Debug function to view current state
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