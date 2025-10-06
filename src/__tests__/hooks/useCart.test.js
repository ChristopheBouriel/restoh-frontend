import { renderHook, act } from '@testing-library/react'
import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest'
import { toast } from 'react-hot-toast'
import { useCart } from '../../hooks/useCart'
import useCartStore from '../../store/cartStore'
import useAuthStore from '../../store/authStore'
import { useCartUI } from '../../contexts/CartUIContext'

// Mock dependencies
vi.mock('react-hot-toast')
vi.mock('../../store/cartStore')
vi.mock('../../store/authStore')
vi.mock('../../contexts/CartUIContext')

// Mock console.log to avoid noise in tests
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {})

// Mock data
const mockProduct = {
  id: '1',
  name: 'Pizza Margherita',
  price: 12.50,
  image: 'pizza.jpg'
}

const mockCartItems = [
  { id: '1', name: 'Pizza Margherita', quantity: 2, price: 12.50 },
  { id: '2', name: 'Spaghetti', quantity: 1, price: 14.00 }
]

const mockEnrichedItems = [
  { 
    id: '1', 
    name: 'Pizza Margherita', 
    quantity: 2, 
    currentPrice: 12.50, 
    isAvailable: true, 
    stillExists: true 
  }
]

const mockAvailableItems = mockEnrichedItems
const mockUnavailableItems = []

// Mock functions
const mockAddItem = vi.fn()
const mockRemoveItem = vi.fn()
const mockUpdateQuantity = vi.fn()
const mockIncreaseQuantity = vi.fn()
const mockDecreaseQuantity = vi.fn()
const mockClearCart = vi.fn()
const mockSyncWithMenu = vi.fn()
const mockIsItemInCart = vi.fn()
const mockGetItemQuantity = vi.fn()
const mockOpenCart = vi.fn()
const mockCloseCart = vi.fn()
const mockToggleCart = vi.fn()

describe('useCart Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    
    // Default auth store mock - authenticated user
    vi.mocked(useAuthStore.getState).mockReturnValue({
      isAuthenticated: true
    })
    
    // Default cart store mock
    vi.mocked(useCartStore).mockReturnValue({
      getCurrentUserCart: vi.fn().mockReturnValue({ items: mockCartItems }),
      getTotalItems: vi.fn().mockReturnValue(3),
      getTotalPrice: vi.fn().mockReturnValue(39.00),
      getEnrichedItems: vi.fn().mockReturnValue(mockEnrichedItems),
      getAvailableItems: vi.fn().mockReturnValue(mockAvailableItems),
      getUnavailableItems: vi.fn().mockReturnValue(mockUnavailableItems),
      getTotalPriceAvailable: vi.fn().mockReturnValue(25.00),
      getTotalItemsAvailable: vi.fn().mockReturnValue(2),
      addItem: mockAddItem,
      removeItem: mockRemoveItem,
      updateQuantity: mockUpdateQuantity,
      increaseQuantity: mockIncreaseQuantity,
      decreaseQuantity: mockDecreaseQuantity,
      clearCart: mockClearCart,
      isItemInCart: mockIsItemInCart,
      getItemQuantity: mockGetItemQuantity,
      syncWithMenu: mockSyncWithMenu
    })
    
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

  // 1. CART STATE AND DATA (3 tests)
  test('should return correct cart state from stores', () => {
    const { result } = renderHook(() => useCart())
    
    expect(result.current.items).toEqual(mockCartItems)
    expect(result.current.totalItems).toBe(3)
    expect(result.current.totalPrice).toBe(39.00)
    expect(result.current.enrichedItems).toEqual(mockEnrichedItems)
    expect(result.current.availableItems).toEqual(mockAvailableItems)
    expect(result.current.unavailableItems).toEqual(mockUnavailableItems)
    expect(result.current.totalItemsAvailable).toBe(2)
    expect(result.current.totalPriceAvailable).toBe(25.00)
    expect(result.current.hasUnavailableItems).toBe(false)
  })

  test('should calculate isEmpty correctly', () => {
    // Test with items
    const { result } = renderHook(() => useCart())
    expect(result.current.isEmpty).toBe(false)
    
    // Test with empty cart
    vi.mocked(useCartStore).mockReturnValue({
      ...vi.mocked(useCartStore)(),
      getCurrentUserCart: vi.fn().mockReturnValue({ items: [] }),
    })
    
    const { result: emptyResult } = renderHook(() => useCart())
    expect(emptyResult.current.isEmpty).toBe(true)
  })

  test('should format prices correctly', () => {
    const { result } = renderHook(() => useCart())
    
    // Test French currency formatting (using regex to handle different space characters)
    expect(result.current.formattedTotalPrice).toMatch(/39,00\s€/)
    expect(result.current.formattedTotalPriceAvailable).toMatch(/25,00\s€/)
    expect(result.current.formatPrice(12.50)).toMatch(/12,50\s€/)
    expect(result.current.formatPrice(0)).toMatch(/0,00\s€/)
  })

  // 2. ADD ITEM FUNCTIONALITY (3 tests)
  test('should prevent unauthenticated users from adding items', () => {
    // Mock unauthenticated user
    vi.mocked(useAuthStore.getState).mockReturnValue({
      isAuthenticated: false
    })
    
    const { result } = renderHook(() => useCart())
    
    act(() => {
      result.current.addItem(mockProduct)
    })
    
    expect(toast.error).toHaveBeenCalledWith('Veuillez vous connecter avant d\'alimenter votre panier')
    expect(mockAddItem).not.toHaveBeenCalled()
  })

  test('should add item successfully when authenticated', () => {
    const { result } = renderHook(() => useCart())
    
    act(() => {
      result.current.addItem(mockProduct)
    })
    
    expect(mockAddItem).toHaveBeenCalledWith(mockProduct)
    expect(toast.success).toHaveBeenCalledWith('Pizza Margherita ajouté au panier')
  })

  test('should open cart briefly after adding item', () => {
    vi.mocked(useCartUI).mockReturnValue({
      isCartOpen: false,
      openCart: mockOpenCart,
      closeCart: mockCloseCart,
      toggleCart: mockToggleCart
    })
    
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

  // 3. CART MODIFICATION ACTIONS (3 tests)
  test('should remove items with confirmation toast', () => {
    const { result } = renderHook(() => useCart())
    
    act(() => {
      result.current.removeItem('1', 'Pizza Margherita')
    })
    
    expect(mockRemoveItem).toHaveBeenCalledWith('1')
    expect(toast.success).toHaveBeenCalledWith('Pizza Margherita retiré du panier')
  })

  test('should update quantity correctly', () => {
    const { result } = renderHook(() => useCart())
    
    // Test positive quantity update
    act(() => {
      result.current.updateQuantity('1', 3)
    })
    expect(mockUpdateQuantity).toHaveBeenCalledWith('1', 3)
    
    // Test zero quantity (should remove item)
    act(() => {
      result.current.updateQuantity('1', 0)
    })
    expect(mockRemoveItem).toHaveBeenCalledWith('1')
    expect(toast.success).toHaveBeenCalledWith('Pizza Margherita retiré du panier')
    
    // Test negative quantity (should also remove item)
    act(() => {
      result.current.updateQuantity('2', -1)
    })
    expect(mockRemoveItem).toHaveBeenCalledWith('2')
  })

  test('should clear entire cart with feedback', () => {
    const { result } = renderHook(() => useCart())
    
    act(() => {
      result.current.clearCart()
    })
    
    expect(mockClearCart).toHaveBeenCalled()
    expect(toast.success).toHaveBeenCalledWith('Panier vidé')
    expect(mockCloseCart).toHaveBeenCalled()
  })

  // 4. UTILITY FUNCTIONS AND INTEGRATION (3 tests)
  test('should sync with menu and log confirmation', () => {
    const { result } = renderHook(() => useCart())
    
    act(() => {
      result.current.syncWithMenu()
    })
    
    expect(mockSyncWithMenu).toHaveBeenCalled()
    expect(mockConsoleLog).toHaveBeenCalledWith('🔄 Panier synchronisé avec le menu')
  })

  test('should pass through store utility functions', () => {
    mockIsItemInCart.mockReturnValue(true)
    mockGetItemQuantity.mockReturnValue(2)
    
    const { result } = renderHook(() => useCart())
    
    // Test utility functions are available
    expect(typeof result.current.isItemInCart).toBe('function')
    expect(typeof result.current.getItemQuantity).toBe('function')
    
    // Test they return expected values
    expect(result.current.isItemInCart).toBe(mockIsItemInCart)
    expect(result.current.getItemQuantity).toBe(mockGetItemQuantity)
    
    // Test store functions are passed through
    expect(result.current.increaseQuantity).toBe(mockIncreaseQuantity)
    expect(result.current.decreaseQuantity).toBe(mockDecreaseQuantity)
  })

  test('should integrate cart UI controls properly', () => {
    vi.mocked(useCartUI).mockReturnValue({
      isCartOpen: true,
      openCart: mockOpenCart,
      closeCart: mockCloseCart,
      toggleCart: mockToggleCart
    })
    
    const { result } = renderHook(() => useCart())
    
    // Test UI state is passed through
    expect(result.current.isOpen).toBe(true)
    
    // Test UI functions are available
    expect(result.current.openCart).toBe(mockOpenCart)
    expect(result.current.closeCart).toBe(mockCloseCart)
    expect(result.current.toggleCart).toBe(mockToggleCart)
  })

  // Additional edge case test
  test('should handle unavailable items correctly', () => {
    const mockUnavailable = [{ id: '3', name: 'Deleted Item', isAvailable: false }]
    
    vi.mocked(useCartStore).mockReturnValue({
      ...vi.mocked(useCartStore)(),
      getUnavailableItems: vi.fn().mockReturnValue(mockUnavailable),
    })
    
    const { result } = renderHook(() => useCart())
    
    expect(result.current.unavailableItems).toEqual(mockUnavailable)
    expect(result.current.hasUnavailableItems).toBe(true)
  })
})