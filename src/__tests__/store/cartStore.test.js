import { beforeEach, describe, expect, test, vi } from 'vitest'
import useCartStore from '../../store/cartStore'
import useMenuStore from '../../store/menuStore'

// Mock useMenuStore
vi.mock('../../store/menuStore')

// Mock console.log to avoid noise in tests
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {})

// Mock menu items for testing menu integration
const mockMenuItems = [
  { id: '1', name: 'Pizza Margherita', price: 12.50, isAvailable: true },
  { id: '2', name: 'Spaghetti Carbonara', price: 14.00, isAvailable: true },
  { id: '3', name: 'Tiramisu', price: 6.50, isAvailable: false },
  { id: '4', name: 'Deleted Item', price: 8.00, isAvailable: true } // Will be "deleted" by not existing in menu
]

// Mock products for cart operations
const mockProducts = [
  { id: '1', name: 'Pizza Margherita', price: 12.50, image: 'pizza.jpg' },
  { id: '2', name: 'Spaghetti Carbonara', price: 14.00, image: 'pasta.jpg' },
  { id: '3', name: 'Tiramisu', price: 6.50, image: 'dessert.jpg' }
]

describe('cartStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useCartStore.setState({
      userCarts: {},
      currentUserId: null
    })
    
    // Mock useMenuStore.getState to return our mock menu items
    vi.mocked(useMenuStore.getState).mockReturnValue({
      items: mockMenuItems
    })
    
    vi.clearAllMocks()
    mockConsoleLog.mockClear()
  })

  // 1. USER MANAGEMENT (3 tests)
  test('should initialize user cart when setting current user', () => {
    const store = useCartStore.getState()
    
    // Set current user
    store.setCurrentUser('user1')
    
    const state = useCartStore.getState()
    expect(state.currentUserId).toBe('user1')
    expect(state.userCarts['user1']).toEqual({ items: [] })
    
    // Get current user cart should return the initialized cart
    const currentCart = store.getCurrentUserCart()
    expect(currentCart).toEqual({ items: [] })
  })

  test('should switch between users correctly', () => {
    const store = useCartStore.getState()
    
    // Setup first user with items
    store.setCurrentUser('user1')
    store.addItem(mockProducts[0])
    expect(store.getCurrentUserCart().items).toHaveLength(1)
    
    // Switch to second user
    store.setCurrentUser('user2')
    expect(store.getCurrentUserCart().items).toHaveLength(0) // Empty cart for new user
    store.addItem(mockProducts[1])
    expect(store.getCurrentUserCart().items).toHaveLength(1)
    
    // Switch back to first user
    store.setCurrentUser('user1')
    const user1Cart = store.getCurrentUserCart()
    expect(user1Cart.items).toHaveLength(1)
    expect(user1Cart.items[0].name).toBe('Pizza Margherita')
    
    // Verify isolation - user2's item shouldn't be in user1's cart
    expect(user1Cart.items.find(item => item.name === 'Spaghetti Carbonara')).toBeUndefined()
  })

  test('should return empty cart for non-existent user', () => {
    const store = useCartStore.getState()
    
    // Don't set any current user
    const cart = store.getCurrentUserCart()
    expect(cart).toEqual({ items: [] })
    
    // Set current user to null explicitly
    store.setCurrentUser(null)
    const cartNull = store.getCurrentUserCart()
    expect(cartNull).toEqual({ items: [] })
  })

  // 2. BASIC CART OPERATIONS (4 tests)
  test('should add new items to cart', () => {
    const store = useCartStore.getState()
    store.setCurrentUser('user1')
    
    // Add first item
    store.addItem(mockProducts[0])
    let cart = store.getCurrentUserCart()
    expect(cart.items).toHaveLength(1)
    expect(cart.items[0]).toEqual({ ...mockProducts[0], quantity: 1 })
    
    // Add different item
    store.addItem(mockProducts[1])
    cart = store.getCurrentUserCart()
    expect(cart.items).toHaveLength(2)
    expect(cart.items[1]).toEqual({ ...mockProducts[1], quantity: 1 })
  })

  test('should increase quantity for existing items', () => {
    const store = useCartStore.getState()
    store.setCurrentUser('user1')
    
    // Add item first time
    store.addItem(mockProducts[0])
    let cart = store.getCurrentUserCart()
    expect(cart.items[0].quantity).toBe(1)
    
    // Add same item again - should increase quantity
    store.addItem(mockProducts[0])
    cart = store.getCurrentUserCart()
    expect(cart.items).toHaveLength(1) // Still one unique item
    expect(cart.items[0].quantity).toBe(2) // But quantity increased
  })

  test('should remove items from cart', () => {
    const store = useCartStore.getState()
    store.setCurrentUser('user1')
    
    // Add multiple items
    store.addItem(mockProducts[0])
    store.addItem(mockProducts[1])
    expect(store.getCurrentUserCart().items).toHaveLength(2)
    
    // Remove one item
    store.removeItem('1')
    const cart = store.getCurrentUserCart()
    expect(cart.items).toHaveLength(1)
    expect(cart.items[0].id).toBe('2') // Only second item remains
    expect(cart.items.find(item => item.id === '1')).toBeUndefined()
  })

  test('should clear entire cart', () => {
    const store = useCartStore.getState()
    store.setCurrentUser('user1')
    
    // Add multiple items
    store.addItem(mockProducts[0])
    store.addItem(mockProducts[1])
    expect(store.getCurrentUserCart().items).toHaveLength(2)
    
    // Clear cart
    store.clearCart()
    expect(store.getCurrentUserCart().items).toHaveLength(0)
  })

  // 3. QUANTITY MANAGEMENT (3 tests)
  test('should update item quantities correctly', () => {
    const store = useCartStore.getState()
    store.setCurrentUser('user1')
    
    // Add item and test quantity updates
    store.addItem(mockProducts[0])
    
    // Update to specific quantity
    store.updateQuantity('1', 5)
    expect(store.getCurrentUserCart().items[0].quantity).toBe(5)
    
    // Update to zero should remove item
    store.updateQuantity('1', 0)
    expect(store.getCurrentUserCart().items).toHaveLength(0)
    
    // Add item again and test negative quantity
    store.addItem(mockProducts[0])
    store.updateQuantity('1', -1)
    expect(store.getCurrentUserCart().items).toHaveLength(0) // Should be removed
  })

  test('should increase quantity by one', () => {
    const store = useCartStore.getState()
    store.setCurrentUser('user1')
    
    store.addItem(mockProducts[0]) // quantity = 1
    
    // Increase quantity
    store.increaseQuantity('1')
    expect(store.getCurrentUserCart().items[0].quantity).toBe(2)
    
    // Increase again
    store.increaseQuantity('1')
    expect(store.getCurrentUserCart().items[0].quantity).toBe(3)
    
    // Try to increase non-existent item (should do nothing)
    store.increaseQuantity('nonexistent')
    expect(store.getCurrentUserCart().items).toHaveLength(1) // No change
  })

  test('should decrease quantity with removal logic', () => {
    const store = useCartStore.getState()
    store.setCurrentUser('user1')
    
    store.addItem(mockProducts[0])
    store.updateQuantity('1', 3) // Set to 3
    
    // Decrease quantity
    store.decreaseQuantity('1')
    expect(store.getCurrentUserCart().items[0].quantity).toBe(2)
    
    // Decrease to 1
    store.decreaseQuantity('1')
    expect(store.getCurrentUserCart().items[0].quantity).toBe(1)
    
    // Decrease from 1 should remove item
    store.decreaseQuantity('1')
    expect(store.getCurrentUserCart().items).toHaveLength(0)
    
    // Try to decrease non-existent item (should do nothing)
    store.decreaseQuantity('nonexistent')
    expect(store.getCurrentUserCart().items).toHaveLength(0)
  })

  // 4. CALCULATIONS AND UTILITIES (2 tests)
  test('should calculate totals correctly', () => {
    const store = useCartStore.getState()
    store.setCurrentUser('user1')
    
    // Empty cart
    expect(store.getTotalItems()).toBe(0)
    expect(store.getTotalPrice()).toBe(0)
    
    // Add items with different quantities
    store.addItem(mockProducts[0]) // Pizza: 12.50 x 1 = 12.50
    store.addItem(mockProducts[1]) // Pasta: 14.00 x 1 = 14.00
    store.addItem(mockProducts[0]) // Pizza: 12.50 x 2 = 25.00 (total)
    
    expect(store.getTotalItems()).toBe(3) // 2 pizza + 1 pasta
    expect(store.getTotalPrice()).toBe(39.00) // 25.00 + 14.00
    
    // Update quantity and verify recalculation
    store.updateQuantity('2', 2) // Pasta: 14.00 x 2 = 28.00
    expect(store.getTotalItems()).toBe(4) // 2 pizza + 2 pasta
    expect(store.getTotalPrice()).toBe(53.00) // 25.00 + 28.00
  })

  test('should provide utility functions', () => {
    const store = useCartStore.getState()
    store.setCurrentUser('user1')
    
    // Test with empty cart
    expect(store.isItemInCart('1')).toBe(false)
    expect(store.getItemQuantity('1')).toBe(0)
    
    // Add item and test utilities
    store.addItem(mockProducts[0])
    store.updateQuantity('1', 3)
    
    expect(store.isItemInCart('1')).toBe(true)
    expect(store.isItemInCart('2')).toBe(false)
    expect(store.getItemQuantity('1')).toBe(3)
    expect(store.getItemQuantity('2')).toBe(0)
  })

  // 5. MENU INTEGRATION (2 tests)
  test('should enrich items with menu data', () => {
    const store = useCartStore.getState()
    store.setCurrentUser('user1')
    
    // Add items to cart
    store.addItem({ id: '1', name: 'Pizza Margherita', price: 10.00 }) // Old price
    store.addItem({ id: '3', name: 'Tiramisu', price: 6.50 })
    store.addItem({ id: '5', name: 'Deleted Item', price: 8.00 }) // Not in menu
    
    const enrichedItems = store.getEnrichedItems()
    
    // Check first item (available in menu)
    expect(enrichedItems[0]).toEqual({
      id: '1',
      name: 'Pizza Margherita',
      price: 10.00, // Original cart price
      quantity: 1,
      isAvailable: true,
      currentPrice: 12.50, // Updated menu price
      stillExists: true
    })
    
    // Check second item (unavailable in menu)
    expect(enrichedItems[1]).toEqual({
      id: '3',
      name: 'Tiramisu',
      price: 6.50,
      quantity: 1,
      isAvailable: false, // Not available
      currentPrice: 6.50,
      stillExists: true
    })
    
    // Check third item (deleted from menu)
    expect(enrichedItems[2]).toEqual({
      id: '5',
      name: 'Deleted Item',
      price: 8.00,
      quantity: 1,
      isAvailable: false,
      currentPrice: 8.00, // Fallback to cart price
      stillExists: false // Not in menu
    })
  })

  test('should filter available vs unavailable items', () => {
    const store = useCartStore.getState()
    store.setCurrentUser('user1')
    
    // Add items with different availability
    store.addItem({ id: '1', name: 'Pizza Margherita', price: 12.50 }) // Available
    store.addItem({ id: '3', name: 'Tiramisu', price: 6.50 }) // Unavailable
    store.addItem({ id: '5', name: 'Deleted Item', price: 8.00 }) // Deleted
    
    const availableItems = store.getAvailableItems()
    const unavailableItems = store.getUnavailableItems()
    
    // Available items (both available and stillExists)
    expect(availableItems).toHaveLength(1)
    expect(availableItems[0].id).toBe('1')
    expect(availableItems[0].isAvailable).toBe(true)
    expect(availableItems[0].stillExists).toBe(true)
    
    // Unavailable items (not available OR not existing)
    expect(unavailableItems).toHaveLength(2)
    expect(unavailableItems.find(item => item.id === '3')).toBeTruthy() // Unavailable
    expect(unavailableItems.find(item => item.id === '5')).toBeTruthy() // Deleted
    
    // Test calculations for available items
    expect(store.getTotalItemsAvailable()).toBe(1)
    expect(store.getTotalPriceAvailable()).toBe(12.50)
  })

  // Additional edge case test
  test('should handle sync with menu correctly', () => {
    const store = useCartStore.getState()

    store.syncWithMenu()
    expect(mockConsoleLog).toHaveBeenCalledWith('🔄 Syncing cart with menu')
  })

  test('should handle operations without current user gracefully', () => {
    const store = useCartStore.getState()
    // Don't set current user
    
    // Operations should not crash
    store.addItem(mockProducts[0])
    store.removeItem('1')
    store.updateQuantity('1', 2)
    store.clearCart()
    
    // Cart should remain empty
    expect(store.getCurrentUserCart().items).toHaveLength(0)
  })
})