import { renderHook, act } from '@testing-library/react'
import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest'
import { toast } from 'react-hot-toast'
import { useCart } from '../../hooks/useCart'
import useCartStore from '../../store/cartStore'
import useAuthStore from '../../store/authStore'
import useMenuStore from '../../store/menuStore'
import { useCartUI } from '../../contexts/CartUIContext'

// Mock external dependencies (toast and CartUI context are side effects)
vi.mock('react-hot-toast')
vi.mock('../../contexts/CartUIContext')

// Mock console.log to avoid noise in tests
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {})

// Mock data
const mockMenuItems = [
  { id: '1', name: 'Pizza Margherita', price: 12.50, isAvailable: true, image: 'pizza.jpg' },
  { id: '2', name: 'Spaghetti', price: 14.00, isAvailable: true, image: 'spaghetti.jpg' },
  { id: '3', name: 'Tiramisu', price: 8.00, isAvailable: false, image: 'tiramisu.jpg' }
]

const mockProduct = {
  id: '1',
  name: 'Pizza Margherita',
  price: 12.50,
  image: 'pizza.jpg'
}

// Mock CartUI functions
const mockOpenCart = vi.fn()
const mockCloseCart = vi.fn()
const mockToggleCart = vi.fn()

describe('useCart Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()

    // Setup real stores with initial state
    act(() => {
      // Reset cart store
      useCartStore.setState({
        userCarts: {},
        currentUserId: 'user-123'
      })

      // Set current user cart
      useCartStore.getState().setCurrentUser('user-123')

      // Reset menu store with mock items
      useMenuStore.setState({
        items: mockMenuItems
      })

      // Reset auth store - authenticated
      useAuthStore.setState({
        user: { id: 'user-123', name: 'Test User', role: 'user' },
        isAuthenticated: true
      })
    })

    // Mock toast
    vi.mocked(toast.success).mockImplementation(() => {})
    vi.mocked(toast.error).mockImplementation(() => {})

    // Default cart UI context mock
    vi.mocked(useCartUI).mockReturnValue({
      isCartOpen: false,
      openCart: mockOpenCart,
      closeCart: mockCloseCart,
      toggleCart: mockToggleCart
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    mockConsoleLog.mockClear()
  })

  // 1. CART STATE AND DATA
  describe('Cart State and Data', () => {
    test('should return correct cart state with empty cart', () => {
      const { result } = renderHook(() => useCart())

      expect(result.current.items).toEqual([])
      expect(result.current.totalItems).toBe(0)
      expect(result.current.totalPrice).toBe(0)
      expect(result.current.isEmpty).toBe(true)
    })

    test('should return correct cart state with items', () => {
      // Add items to cart
      act(() => {
        useCartStore.getState().addItem(mockProduct)
        useCartStore.getState().addItem(mockProduct) // Add same item twice
        useCartStore.getState().addItem({ id: '2', name: 'Spaghetti', price: 14.00 })
      })

      const { result } = renderHook(() => useCart())

      expect(result.current.items).toHaveLength(2)
      expect(result.current.totalItems).toBe(3) // 2 pizzas + 1 spaghetti
      expect(result.current.totalPrice).toBe(39.00) // 2*12.50 + 14.00
      expect(result.current.isEmpty).toBe(false)
    })

    test('should format prices correctly in French format', () => {
      act(() => {
        useCartStore.getState().addItem(mockProduct)
      })

      const { result } = renderHook(() => useCart())

      // Test French currency formatting (using regex to handle different space characters)
      expect(result.current.formattedTotalPrice).toMatch(/12,50\s€/)
      expect(result.current.formatPrice(25.99)).toMatch(/25,99\s€/)
      expect(result.current.formatPrice(0)).toMatch(/0,00\s€/)
    })

    test('should provide enriched items with menu data', () => {
      act(() => {
        useCartStore.getState().addItem(mockProduct)
      })

      const { result } = renderHook(() => useCart())

      expect(result.current.enrichedItems).toHaveLength(1)
      expect(result.current.enrichedItems[0].currentPrice).toBe(12.50)
      expect(result.current.enrichedItems[0].isAvailable).toBe(true)
      expect(result.current.enrichedItems[0].stillExists).toBe(true)
    })

    test('should identify unavailable items', () => {
      // Add an unavailable item directly to cart
      act(() => {
        useCartStore.getState().addItem({ id: '3', name: 'Tiramisu', price: 8.00 })
      })

      const { result } = renderHook(() => useCart())

      expect(result.current.hasUnavailableItems).toBe(true)
      expect(result.current.unavailableItems).toHaveLength(1)
      expect(result.current.unavailableItems[0].id).toBe('3')
    })
  })

  // 2. ADD ITEM FUNCTIONALITY
  describe('Add Item', () => {
    test('should prevent unauthenticated users from adding items', () => {
      // Set unauthenticated state
      act(() => {
        useAuthStore.setState({
          user: null,
          isAuthenticated: false
        })
      })

      const { result } = renderHook(() => useCart())

      act(() => {
        result.current.addItem(mockProduct)
      })

      expect(toast.error).toHaveBeenCalledWith('Please log in before adding items to your cart')
      expect(result.current.items).toEqual([])
    })

    test('should add item successfully when authenticated', () => {
      const { result } = renderHook(() => useCart())

      act(() => {
        result.current.addItem(mockProduct)
      })

      expect(result.current.items).toHaveLength(1)
      expect(result.current.items[0].name).toBe('Pizza Margherita')
      expect(toast.success).toHaveBeenCalledWith('Pizza Margherita added to cart')
    })

    test('should increase quantity when adding existing item', () => {
      const { result } = renderHook(() => useCart())

      act(() => {
        result.current.addItem(mockProduct)
      })

      act(() => {
        result.current.addItem(mockProduct)
      })

      expect(result.current.items).toHaveLength(1)
      expect(result.current.items[0].quantity).toBe(2)
      expect(result.current.totalItems).toBe(2)
    })

    test('should open cart briefly after adding item', () => {
      const { result } = renderHook(() => useCart())

      act(() => {
        result.current.addItem(mockProduct)
      })

      // Fast-forward first timeout (100ms)
      act(() => {
        vi.advanceTimersByTime(100)
      })

      expect(mockOpenCart).toHaveBeenCalled()

      // Fast-forward second timeout (2000ms)
      act(() => {
        vi.advanceTimersByTime(2000)
      })

      expect(mockCloseCart).toHaveBeenCalled()
    })
  })

  // 3. CART MODIFICATION ACTIONS
  describe('Cart Modifications', () => {
    beforeEach(() => {
      // Add items before each test
      act(() => {
        useCartStore.getState().addItem(mockProduct)
        useCartStore.getState().addItem({ id: '2', name: 'Spaghetti', price: 14.00 })
      })
    })

    test('should remove items with confirmation toast', () => {
      const { result } = renderHook(() => useCart())

      expect(result.current.items).toHaveLength(2)

      act(() => {
        result.current.removeItem('1', 'Pizza Margherita')
      })

      expect(result.current.items).toHaveLength(1)
      expect(result.current.items[0].id).toBe('2')
      expect(toast.success).toHaveBeenCalledWith('Pizza Margherita removed from cart')
    })

    test('should update quantity correctly', () => {
      const { result } = renderHook(() => useCart())

      act(() => {
        result.current.updateQuantity('1', 5)
      })

      expect(result.current.items.find(i => i.id === '1').quantity).toBe(5)
      expect(result.current.totalItems).toBe(6) // 5 pizzas + 1 spaghetti
    })

    test('should remove item when quantity set to zero', () => {
      const { result } = renderHook(() => useCart())

      act(() => {
        result.current.updateQuantity('1', 0)
      })

      expect(result.current.items).toHaveLength(1)
      expect(result.current.items[0].id).toBe('2')
      expect(toast.success).toHaveBeenCalledWith('Pizza Margherita removed from cart')
    })

    test('should increase and decrease quantity', () => {
      const { result } = renderHook(() => useCart())

      // Increase quantity
      act(() => {
        result.current.increaseQuantity('1')
      })
      expect(result.current.items.find(i => i.id === '1').quantity).toBe(2)

      // Decrease quantity
      act(() => {
        result.current.decreaseQuantity('1')
      })
      expect(result.current.items.find(i => i.id === '1').quantity).toBe(1)
    })

    test('should remove item when decreasing quantity from 1', () => {
      const { result } = renderHook(() => useCart())

      act(() => {
        result.current.decreaseQuantity('1') // quantity 1 -> remove
      })

      expect(result.current.items).toHaveLength(1)
      expect(result.current.items[0].id).toBe('2')
    })

    test('should clear entire cart with feedback', () => {
      const { result } = renderHook(() => useCart())

      expect(result.current.items).toHaveLength(2)

      act(() => {
        result.current.clearCart()
      })

      expect(result.current.items).toHaveLength(0)
      expect(result.current.isEmpty).toBe(true)
      expect(toast.success).toHaveBeenCalledWith('Cart cleared')
      expect(mockCloseCart).toHaveBeenCalled()
    })
  })

  // 4. UTILITY FUNCTIONS
  describe('Utility Functions', () => {
    test('should check if item is in cart', () => {
      const { result } = renderHook(() => useCart())

      expect(result.current.isItemInCart('1')).toBe(false)

      act(() => {
        result.current.addItem(mockProduct)
      })

      expect(result.current.isItemInCart('1')).toBe(true)
      expect(result.current.isItemInCart('999')).toBe(false)
    })

    test('should get item quantity', () => {
      const { result } = renderHook(() => useCart())

      expect(result.current.getItemQuantity('1')).toBe(0)

      act(() => {
        result.current.addItem(mockProduct)
        result.current.addItem(mockProduct)
      })

      expect(result.current.getItemQuantity('1')).toBe(2)
    })

    test('should sync with menu and log confirmation', () => {
      const { result } = renderHook(() => useCart())

      act(() => {
        result.current.syncWithMenu()
      })

      expect(mockConsoleLog).toHaveBeenCalledWith('🔄 Cart synced with menu')
    })
  })

  // 5. CART UI INTEGRATION
  describe('Cart UI Integration', () => {
    test('should expose cart UI state and controls', () => {
      vi.mocked(useCartUI).mockReturnValue({
        isCartOpen: true,
        openCart: mockOpenCart,
        closeCart: mockCloseCart,
        toggleCart: mockToggleCart
      })

      const { result } = renderHook(() => useCart())

      expect(result.current.isOpen).toBe(true)
      expect(result.current.openCart).toBe(mockOpenCart)
      expect(result.current.closeCart).toBe(mockCloseCart)
      expect(result.current.toggleCart).toBe(mockToggleCart)
    })
  })

  // 6. MULTI-USER CART ISOLATION
  describe('Multi-User Cart Isolation', () => {
    test('should keep carts separate per user', () => {
      // Add items for user-123
      act(() => {
        useCartStore.getState().addItem(mockProduct)
      })

      const { result: result1 } = renderHook(() => useCart())
      expect(result1.current.items).toHaveLength(1)

      // Switch to different user
      act(() => {
        useCartStore.getState().setCurrentUser('user-456')
      })

      const { result: result2 } = renderHook(() => useCart())
      expect(result2.current.items).toHaveLength(0) // New user has empty cart

      // Switch back to original user
      act(() => {
        useCartStore.getState().setCurrentUser('user-123')
      })

      const { result: result3 } = renderHook(() => useCart())
      expect(result3.current.items).toHaveLength(1) // Original user's cart preserved
    })
  })
})
