import { describe, it, expect } from 'vitest'
import {
  isItemAvailable,
  getAvailableItems,
  getPopularItems,
  getItemsByCategory,
  getItemById,
  filterItems,
  searchItems,
  sortItems
} from '../../services/menu/menuFilters'

describe('menuFilters', () => {
  const mockMenuItems = [
    {
      id: '1',
      name: 'Margherita Pizza',
      description: 'Classic tomato and mozzarella',
      price: 12.99,
      category: 'pizza',
      cuisine: 'italian',
      isAvailable: true,
      isPopular: true,
      ingredients: ['tomato', 'mozzarella', 'basil'],
      allergens: ['gluten', 'dairy'],
      preparationTime: 15
    },
    {
      id: '2',
      name: 'Caesar Salad',
      description: 'Fresh romaine lettuce with caesar dressing',
      price: 8.99,
      category: 'salad',
      cuisine: 'american',
      isAvailable: true,
      isPopular: false,
      ingredients: ['lettuce', 'parmesan', 'croutons'],
      allergens: ['gluten', 'dairy'],
      preparationTime: 5
    },
    {
      id: '3',
      name: 'Beef Burger',
      description: 'Juicy beef patty with all the toppings',
      price: 14.99,
      category: 'burger',
      cuisine: 'american',
      isAvailable: false,
      isPopular: true,
      ingredients: ['beef', 'bun', 'lettuce', 'tomato'],
      allergens: ['gluten'],
      preparationTime: 20
    },
    {
      id: '4',
      name: 'Spaghetti Carbonara',
      description: 'Traditional Italian pasta',
      price: 13.99,
      category: 'pasta',
      cuisine: 'italian',
      isAvailable: true,
      isPopular: false,
      ingredients: ['pasta', 'eggs', 'bacon', 'parmesan'],
      allergens: ['gluten', 'dairy', 'eggs'],
      preparationTime: 12
    },
    {
      id: '5',
      name: 'Deleted Item',
      description: 'This item is deleted',
      price: 9.99,
      category: 'other',
      cuisine: 'other',
      isAvailable: true,
      isPopular: false,
      deleted: true,
      ingredients: [],
      allergens: [],
      preparationTime: 0
    }
  ]

  describe('isItemAvailable', () => {
    it('should return true for available items', () => {
      const item = { id: '1', isAvailable: true }
      expect(isItemAvailable(item)).toBe(true)
    })

    it('should return false for unavailable items', () => {
      const item = { id: '1', isAvailable: false }
      expect(isItemAvailable(item)).toBe(false)
    })

    it('should return false for deleted items', () => {
      const item = { id: '1', isAvailable: true, deleted: true }
      expect(isItemAvailable(item)).toBe(false)
    })

    it('should return false for null/undefined items', () => {
      expect(isItemAvailable(null)).toBe(false)
      expect(isItemAvailable(undefined)).toBe(false)
    })

    it('should return true if isAvailable is not explicitly false', () => {
      const item = { id: '1' }
      expect(isItemAvailable(item)).toBe(true)
    })
  })

  describe('getAvailableItems', () => {
    it('should return only available items', () => {
      const available = getAvailableItems(mockMenuItems)
      expect(available).toHaveLength(3)
      expect(available.every(item => isItemAvailable(item))).toBe(true)
    })

    it('should exclude unavailable items', () => {
      const available = getAvailableItems(mockMenuItems)
      const unavailableIds = available.map(i => i.id)
      expect(unavailableIds).not.toContain('3') // Unavailable
      expect(unavailableIds).not.toContain('5') // Deleted
    })

    it('should handle empty array', () => {
      expect(getAvailableItems([])).toEqual([])
    })

    it('should handle null/undefined', () => {
      expect(getAvailableItems(null)).toEqual([])
      expect(getAvailableItems(undefined)).toEqual([])
    })
  })

  describe('getPopularItems', () => {
    it('should return only popular and available items', () => {
      const popular = getPopularItems(mockMenuItems)
      expect(popular).toHaveLength(1)
      expect(popular[0].id).toBe('1')
    })

    it('should exclude unavailable popular items', () => {
      const popular = getPopularItems(mockMenuItems)
      const popularIds = popular.map(i => i.id)
      expect(popularIds).not.toContain('3') // Popular but unavailable
    })

    it('should handle empty array', () => {
      expect(getPopularItems([])).toEqual([])
    })

    it('should handle null/undefined', () => {
      expect(getPopularItems(null)).toEqual([])
      expect(getPopularItems(undefined)).toEqual([])
    })
  })

  describe('getItemsByCategory', () => {
    it('should return items in specified category', () => {
      const pizzas = getItemsByCategory(mockMenuItems, 'pizza')
      expect(pizzas).toHaveLength(1)
      expect(pizzas[0].id).toBe('1')
    })

    it('should only return available items', () => {
      const burgers = getItemsByCategory(mockMenuItems, 'burger')
      expect(burgers).toHaveLength(0) // Burger exists but unavailable
    })

    it('should return empty array for non-existent category', () => {
      const result = getItemsByCategory(mockMenuItems, 'sushi')
      expect(result).toEqual([])
    })

    it('should handle empty array', () => {
      expect(getItemsByCategory([], 'pizza')).toEqual([])
    })

    it('should handle null category', () => {
      expect(getItemsByCategory(mockMenuItems, null)).toEqual([])
    })

    it('should handle null items', () => {
      expect(getItemsByCategory(null, 'pizza')).toEqual([])
    })
  })

  describe('getItemById', () => {
    it('should return item with matching id', () => {
      const item = getItemById(mockMenuItems, '1')
      expect(item).toBeDefined()
      expect(item.id).toBe('1')
      expect(item.name).toBe('Margherita Pizza')
    })

    it('should return undefined for non-existent id', () => {
      const item = getItemById(mockMenuItems, '999')
      expect(item).toBeUndefined()
    })

    it('should handle empty array', () => {
      expect(getItemById([], '1')).toBeUndefined()
    })

    it('should handle null items', () => {
      expect(getItemById(null, '1')).toBeUndefined()
    })

    it('should handle null id', () => {
      expect(getItemById(mockMenuItems, null)).toBeUndefined()
    })
  })

  describe('filterItems', () => {
    it('should filter by availability', () => {
      const result = filterItems(mockMenuItems, { isAvailable: true })
      expect(result).toHaveLength(3)
      expect(result.every(item => isItemAvailable(item))).toBe(true)
    })

    it('should filter by unavailability', () => {
      const result = filterItems(mockMenuItems, { isAvailable: false })
      expect(result).toHaveLength(2)
      expect(result.every(item => !isItemAvailable(item))).toBe(true)
    })

    it('should filter by category', () => {
      const result = filterItems(mockMenuItems, { category: 'pizza' })
      expect(result).toHaveLength(1)
      expect(result[0].category).toBe('pizza')
    })

    it('should filter by popular', () => {
      const result = filterItems(mockMenuItems, { isPopular: true })
      expect(result).toHaveLength(2)
      expect(result.every(item => item.isPopular)).toBe(true)
    })

    it('should filter by cuisine', () => {
      const result = filterItems(mockMenuItems, { cuisine: 'italian' })
      expect(result).toHaveLength(2)
      expect(result.every(item => item.cuisine === 'italian')).toBe(true)
    })

    it('should filter by multiple criteria', () => {
      const result = filterItems(mockMenuItems, {
        isAvailable: true,
        cuisine: 'italian'
      })
      expect(result).toHaveLength(2)
      expect(result.every(item => item.cuisine === 'italian' && isItemAvailable(item))).toBe(true)
    })

    it('should return all items with empty filters', () => {
      const result = filterItems(mockMenuItems, {})
      expect(result).toHaveLength(5)
    })

    it('should handle null filters', () => {
      const result = filterItems(mockMenuItems, null)
      expect(result).toHaveLength(5)
    })

    it('should handle empty array', () => {
      expect(filterItems([], { category: 'pizza' })).toEqual([])
    })

    it('should handle null items', () => {
      expect(filterItems(null, { category: 'pizza' })).toEqual([])
    })
  })

  describe('searchItems', () => {
    it('should search by name', () => {
      const result = searchItems(mockMenuItems, 'pizza')
      expect(result).toHaveLength(1)
      expect(result[0].name).toContain('Pizza')
    })

    it('should search case-insensitively', () => {
      const result = searchItems(mockMenuItems, 'PIZZA')
      expect(result).toHaveLength(1)
    })

    it('should search by description', () => {
      const result = searchItems(mockMenuItems, 'classic')
      expect(result).toHaveLength(1)
      expect(result[0].description).toContain('Classic')
    })

    it('should search by ingredients', () => {
      const result = searchItems(mockMenuItems, 'bacon')
      expect(result).toHaveLength(1)
      expect(result[0].ingredients).toContain('bacon')
    })

    it('should search by category', () => {
      const result = searchItems(mockMenuItems, 'salad')
      expect(result).toHaveLength(1)
      expect(result[0].category).toBe('salad')
    })

    it('should return all items for empty search', () => {
      const result = searchItems(mockMenuItems, '')
      expect(result).toHaveLength(5)
    })

    it('should return all items for null search', () => {
      const result = searchItems(mockMenuItems, null)
      expect(result).toHaveLength(5)
    })

    it('should return empty array for no matches', () => {
      const result = searchItems(mockMenuItems, 'sushi')
      expect(result).toEqual([])
    })

    it('should trim whitespace', () => {
      const result = searchItems(mockMenuItems, '  pizza  ')
      expect(result).toHaveLength(1)
    })

    it('should handle empty array', () => {
      expect(searchItems([], 'pizza')).toEqual([])
    })

    it('should handle null items', () => {
      expect(searchItems(null, 'pizza')).toEqual([])
    })

    it('should handle partial matches', () => {
      const result = searchItems(mockMenuItems, 'beef')
      expect(result).toHaveLength(1)
      expect(result[0].name).toContain('Beef')
    })
  })

  describe('sortItems', () => {
    it('should sort by name ascending by default', () => {
      const result = sortItems(mockMenuItems)
      expect(result[0].name).toBe('Beef Burger')
      expect(result[result.length - 1].name).toBe('Spaghetti Carbonara')
    })

    it('should sort by name descending', () => {
      const result = sortItems(mockMenuItems, 'name', 'desc')
      expect(result[0].name).toBe('Spaghetti Carbonara')
      expect(result[result.length - 1].name).toBe('Beef Burger')
    })

    it('should sort by price ascending', () => {
      const result = sortItems(mockMenuItems, 'price', 'asc')
      expect(result[0].price).toBe(8.99)
      expect(result[result.length - 1].price).toBe(14.99)
    })

    it('should sort by price descending', () => {
      const result = sortItems(mockMenuItems, 'price', 'desc')
      expect(result[0].price).toBe(14.99)
      expect(result[result.length - 1].price).toBe(8.99)
    })

    it('should sort by popularity', () => {
      const result = sortItems(mockMenuItems, 'popularity')
      // Popular items first
      expect(result[0].isPopular).toBe(true)
      expect(result[1].isPopular).toBe(true)
    })

    it('should handle empty array', () => {
      expect(sortItems([])).toEqual([])
    })

    it('should handle null items', () => {
      expect(sortItems(null)).toEqual([])
    })

    it('should not mutate original array', () => {
      const original = [...mockMenuItems]
      sortItems(mockMenuItems, 'price', 'desc')
      expect(mockMenuItems).toEqual(original)
    })

    it('should handle items without name', () => {
      const items = [
        { id: '1', price: 10 },
        { id: '2', name: 'Test', price: 20 }
      ]
      const result = sortItems(items, 'name')
      expect(result).toHaveLength(2)
    })

    it('should handle items without price', () => {
      const items = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2', price: 20 }
      ]
      const result = sortItems(items, 'price')
      expect(result).toHaveLength(2)
    })
  })
})
