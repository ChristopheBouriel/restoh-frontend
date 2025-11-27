import { describe, it, expect } from 'vitest'
import MenuService from '../../services/menu/menuService'

describe('MenuService', () => {
  const mockMenuItems = [
    {
      id: '1',
      name: 'Pizza',
      price: 12.99,
      category: 'pizza',
      cuisine: 'italian',
      isAvailable: true,
      isPopular: true,
      ingredients: ['tomato', 'cheese'],
      allergens: ['gluten', 'dairy'],
      preparationTime: 15
    },
    {
      id: '2',
      name: 'Salad',
      price: 8.99,
      category: 'salad',
      cuisine: 'american',
      isAvailable: true,
      isPopular: false,
      ingredients: ['lettuce'],
      allergens: [],
      preparationTime: 5
    },
    {
      id: '3',
      name: 'Burger',
      price: 14.99,
      category: 'burger',
      cuisine: 'american',
      isAvailable: false,
      isPopular: true,
      ingredients: ['beef', 'bun'],
      allergens: ['gluten'],
      preparationTime: 20
    }
  ]

  describe('Basic delegation methods', () => {
    it('should check if item is available', () => {
      expect(MenuService.isAvailable(mockMenuItems[0])).toBe(true)
      expect(MenuService.isAvailable(mockMenuItems[2])).toBe(false)
    })

    it('should get available items', () => {
      const result = MenuService.getAvailable(mockMenuItems)
      expect(result).toHaveLength(2)
      expect(result.every(item => item.isAvailable)).toBe(true)
    })

    it('should get popular items', () => {
      const result = MenuService.getPopular(mockMenuItems)
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('1')
    })

    it('should get items by category', () => {
      const result = MenuService.getByCategory(mockMenuItems, 'pizza')
      expect(result).toHaveLength(1)
      expect(result[0].category).toBe('pizza')
    })

    it('should get item by id', () => {
      const result = MenuService.getById(mockMenuItems, '1')
      expect(result.id).toBe('1')
      expect(result.name).toBe('Pizza')
    })

    it('should filter items', () => {
      const result = MenuService.filter(mockMenuItems, { cuisine: 'american' })
      expect(result).toHaveLength(2)
    })

    it('should search items', () => {
      const result = MenuService.search(mockMenuItems, 'pizza')
      expect(result).toHaveLength(1)
    })

    it('should sort items', () => {
      const result = MenuService.sort(mockMenuItems, 'price', 'asc')
      expect(result[0].price).toBe(8.99)
      expect(result[2].price).toBe(14.99)
    })
  })

  describe('enrichCartItems', () => {
    const cartItems = [
      { id: '1', quantity: 2, price: 12.99 },
      { id: '2', quantity: 1, price: 8.99 },
      { id: '3', quantity: 1, price: 14.99 },
      { id: '999', quantity: 1, price: 9.99 } // Non-existent item
    ]

    it('should enrich cart items with menu data', () => {
      const result = MenuService.enrichCartItems(cartItems, mockMenuItems)
      expect(result).toHaveLength(4)
      expect(result[0].isAvailable).toBeDefined()
      expect(result[0].currentPrice).toBeDefined()
      expect(result[0].stillExists).toBeDefined()
    })

    it('should mark available items correctly', () => {
      const result = MenuService.enrichCartItems(cartItems, mockMenuItems)
      expect(result[0].isAvailable).toBe(true) // Pizza is available
      expect(result[1].isAvailable).toBe(true) // Salad is available
      expect(result[2].isAvailable).toBe(false) // Burger is unavailable
    })

    it('should mark non-existent items correctly', () => {
      const result = MenuService.enrichCartItems(cartItems, mockMenuItems)
      expect(result[0].stillExists).toBe(true) // Pizza exists
      expect(result[3].stillExists).toBe(false) // ID 999 does not exist
    })

    it('should update current prices', () => {
      const cartWithOldPrices = [
        { id: '1', quantity: 2, price: 10.00 } // Old price
      ]
      const result = MenuService.enrichCartItems(cartWithOldPrices, mockMenuItems)
      expect(result[0].currentPrice).toBe(12.99) // Updated to current menu price
    })

    it('should fallback to cart price if item not in menu', () => {
      const result = MenuService.enrichCartItems(cartItems, mockMenuItems)
      const deletedItem = result.find(item => item.id === '999')
      expect(deletedItem.currentPrice).toBe(9.99) // Falls back to cart price
    })

    it('should be optimistic when menu is not loaded', () => {
      const result = MenuService.enrichCartItems(cartItems, [])
      expect(result.every(item => item.isAvailable)).toBe(true)
      expect(result.every(item => item.stillExists)).toBe(true)
    })

    it('should handle empty cart items', () => {
      const result = MenuService.enrichCartItems([], mockMenuItems)
      expect(result).toEqual([])
    })

    it('should handle null cart items', () => {
      const result = MenuService.enrichCartItems(null, mockMenuItems)
      expect(result).toEqual([])
    })

    it('should handle null menu items', () => {
      const result = MenuService.enrichCartItems(cartItems, null)
      expect(result).toEqual([])
    })

    it('should preserve original cart item properties', () => {
      const result = MenuService.enrichCartItems(cartItems, mockMenuItems)
      expect(result[0].id).toBe('1')
      expect(result[0].quantity).toBe(2)
      expect(result[0].price).toBe(12.99)
    })
  })

  describe('getAvailableCartItems', () => {
    const cartItems = [
      { id: '1', quantity: 2, price: 12.99 },
      { id: '2', quantity: 1, price: 8.99 },
      { id: '3', quantity: 1, price: 14.99 },
      { id: '999', quantity: 1, price: 9.99 }
    ]

    it('should return only available cart items', () => {
      const result = MenuService.getAvailableCartItems(cartItems, mockMenuItems)
      expect(result).toHaveLength(2)
      expect(result.every(item => item.isAvailable && item.stillExists)).toBe(true)
    })

    it('should exclude unavailable items', () => {
      const result = MenuService.getAvailableCartItems(cartItems, mockMenuItems)
      const ids = result.map(item => item.id)
      expect(ids).not.toContain('3') // Burger is unavailable
    })

    it('should exclude non-existent items', () => {
      const result = MenuService.getAvailableCartItems(cartItems, mockMenuItems)
      const ids = result.map(item => item.id)
      expect(ids).not.toContain('999') // Doesn't exist
    })

    it('should handle empty cart', () => {
      const result = MenuService.getAvailableCartItems([], mockMenuItems)
      expect(result).toEqual([])
    })
  })

  describe('calculateCartTotal', () => {
    const cartItems = [
      { id: '1', quantity: 2, price: 12.99 },
      { id: '2', quantity: 1, price: 8.99 },
      { id: '3', quantity: 1, price: 14.99 }
    ]

    it('should calculate total for all items', () => {
      const result = MenuService.calculateCartTotal(cartItems, mockMenuItems, false)
      // 2 * 12.99 + 1 * 8.99 + 1 * 14.99 = 25.98 + 8.99 + 14.99 = 49.96
      expect(result).toBeCloseTo(49.96, 2)
    })

    it('should calculate total for available items only', () => {
      const result = MenuService.calculateCartTotal(cartItems, mockMenuItems, true)
      // Only items 1 and 2 are available
      // 2 * 12.99 + 1 * 8.99 = 25.98 + 8.99 = 34.97
      expect(result).toBeCloseTo(34.97, 2)
    })

    it('should use current menu prices', () => {
      const cartWithOldPrices = [
        { id: '1', quantity: 1, price: 10.00 } // Old price
      ]
      const result = MenuService.calculateCartTotal(cartWithOldPrices, mockMenuItems, false)
      expect(result).toBe(12.99) // Uses current menu price
    })

    it('should handle empty cart', () => {
      const result = MenuService.calculateCartTotal([], mockMenuItems, false)
      expect(result).toBe(0)
    })

    it('should handle null cart', () => {
      const result = MenuService.calculateCartTotal(null, mockMenuItems, false)
      expect(result).toBe(0)
    })

    it('should handle items with different quantities', () => {
      const cart = [
        { id: '1', quantity: 3, price: 12.99 },
        { id: '2', quantity: 5, price: 8.99 }
      ]
      const result = MenuService.calculateCartTotal(cart, mockMenuItems, false)
      // 3 * 12.99 + 5 * 8.99 = 38.97 + 44.95 = 83.92
      expect(result).toBeCloseTo(83.92, 2)
    })
  })

  describe('validateCartForCheckout', () => {
    it('should validate cart with all available items', () => {
      const cartItems = [
        { id: '1', quantity: 2, price: 12.99, name: 'Pizza' },
        { id: '2', quantity: 1, price: 8.99, name: 'Salad' }
      ]
      const result = MenuService.validateCartForCheckout(cartItems, mockMenuItems)
      expect(result.valid).toBe(true)
      expect(result.error).toBeNull()
      expect(result.unavailableItems).toHaveLength(0)
      expect(result.missingItems).toHaveLength(0)
    })

    it('should invalidate cart with unavailable items', () => {
      const cartItems = [
        { id: '1', quantity: 2, price: 12.99, name: 'Pizza' },
        { id: '3', quantity: 1, price: 14.99, name: 'Burger' } // Unavailable
      ]
      const result = MenuService.validateCartForCheckout(cartItems, mockMenuItems)
      expect(result.valid).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.unavailableItems).toHaveLength(1)
      expect(result.unavailableItems[0].id).toBe('3')
    })

    it('should invalidate cart with missing items', () => {
      const cartItems = [
        { id: '1', quantity: 2, price: 12.99, name: 'Pizza' },
        { id: '999', quantity: 1, price: 9.99, name: 'Deleted Item' }
      ]
      const result = MenuService.validateCartForCheckout(cartItems, mockMenuItems)
      expect(result.valid).toBe(false)
      expect(result.missingItems).toHaveLength(1)
      expect(result.missingItems[0].id).toBe('999')
    })

    it('should invalidate empty cart', () => {
      const result = MenuService.validateCartForCheckout([], mockMenuItems)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('empty')
    })

    it('should invalidate null cart', () => {
      const result = MenuService.validateCartForCheckout(null, mockMenuItems)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('empty')
    })

    it('should provide counts', () => {
      const cartItems = [
        { id: '1', quantity: 2, price: 12.99, name: 'Pizza' },
        { id: '2', quantity: 1, price: 8.99, name: 'Salad' },
        { id: '3', quantity: 1, price: 14.99, name: 'Burger' }
      ]
      const result = MenuService.validateCartForCheckout(cartItems, mockMenuItems)
      expect(result.availableCount).toBe(2)
      expect(result.totalCount).toBe(3)
    })
  })

  describe('normalizeItems', () => {
    it('should normalize items with missing fields', () => {
      const rawItems = [
        { id: '1', name: 'Pizza', price: 12.99, category: 'pizza' }
      ]
      const result = MenuService.normalizeItems(rawItems)
      expect(result[0].allergens).toEqual([])
      expect(result[0].ingredients).toEqual([])
      expect(result[0].preparationTime).toBe(0)
      expect(result[0].cuisine).toBe('continental')
      expect(result[0].isAvailable).toBe(false)
      expect(result[0].isPopular).toBe(false)
    })

    it('should ensure booleans for availability', () => {
      const rawItems = [
        { id: '1', name: 'Pizza', price: 12.99, isAvailable: 'yes' }
      ]
      const result = MenuService.normalizeItems(rawItems)
      expect(result[0].isAvailable).toBe(true)
      expect(typeof result[0].isAvailable).toBe('boolean')
    })

    it('should preserve existing values', () => {
      const rawItems = [
        {
          id: '1',
          name: 'Pizza',
          price: 12.99,
          allergens: ['gluten'],
          ingredients: ['tomato'],
          preparationTime: 15,
          cuisine: 'italian',
          isAvailable: true,
          isPopular: true
        }
      ]
      const result = MenuService.normalizeItems(rawItems)
      expect(result[0].allergens).toEqual(['gluten'])
      expect(result[0].ingredients).toEqual(['tomato'])
      expect(result[0].preparationTime).toBe(15)
      expect(result[0].cuisine).toBe('italian')
      expect(result[0].isAvailable).toBe(true)
      expect(result[0].isPopular).toBe(true)
    })

    it('should handle empty array', () => {
      const result = MenuService.normalizeItems([])
      expect(result).toEqual([])
    })

    it('should handle null', () => {
      const result = MenuService.normalizeItems(null)
      expect(result).toEqual([])
    })
  })

  describe('extractCategories', () => {
    it('should extract unique categories', () => {
      const result = MenuService.extractCategories(mockMenuItems)
      expect(result).toHaveLength(3)
      expect(result).toContain('pizza')
      expect(result).toContain('salad')
      expect(result).toContain('burger')
    })

    it('should handle duplicate categories', () => {
      const items = [
        { id: '1', category: 'pizza' },
        { id: '2', category: 'pizza' },
        { id: '3', category: 'burger' }
      ]
      const result = MenuService.extractCategories(items)
      expect(result).toHaveLength(2)
      expect(result).toContain('pizza')
      expect(result).toContain('burger')
    })

    it('should filter out null/undefined categories', () => {
      const items = [
        { id: '1', category: 'pizza' },
        { id: '2', category: null },
        { id: '3', category: undefined },
        { id: '4' }
      ]
      const result = MenuService.extractCategories(items)
      expect(result).toHaveLength(1)
      expect(result).toContain('pizza')
    })

    it('should handle empty array', () => {
      const result = MenuService.extractCategories([])
      expect(result).toEqual([])
    })

    it('should handle null', () => {
      const result = MenuService.extractCategories(null)
      expect(result).toEqual([])
    })
  })

  describe('getStats', () => {
    it('should calculate menu statistics', () => {
      const result = MenuService.getStats(mockMenuItems)
      expect(result.total).toBe(3)
      expect(result.available).toBe(2)
      expect(result.unavailable).toBe(1)
      expect(result.popular).toBe(1)
      expect(result.categories).toBe(3)
      expect(result.categoryList).toHaveLength(3)
    })

    it('should handle empty items', () => {
      const result = MenuService.getStats([])
      expect(result.total).toBe(0)
      expect(result.available).toBe(0)
      expect(result.unavailable).toBe(0)
      expect(result.popular).toBe(0)
      expect(result.categories).toBe(0)
    })

    it('should handle null items', () => {
      const result = MenuService.getStats(null)
      expect(result.total).toBe(0)
    })
  })
})
