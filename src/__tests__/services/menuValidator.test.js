import { describe, it, expect } from 'vitest'
import {
  validateMenuItem,
  validateMenuItemUpdate,
  sanitizeMenuItem
} from '../../services/menu/menuValidator'

describe('menuValidator', () => {
  describe('validateMenuItem', () => {
    const validItem = {
      name: 'Test Pizza',
      category: 'pizza',
      price: 12.99,
      description: 'A delicious test pizza',
      preparationTime: 15,
      ingredients: ['tomato', 'cheese'],
      allergens: ['gluten', 'dairy'],
      cuisine: 'italian',
      isAvailable: true,
      isPopular: false
    }

    it('should validate a complete valid item', () => {
      const result = validateMenuItem(validItem)
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual({})
    })

    describe('name validation', () => {
      it('should require name', () => {
        const item = { ...validItem, name: '' }
        const result = validateMenuItem(item)
        expect(result.isValid).toBe(false)
        expect(result.errors.name).toBeDefined()
      })

      it('should require name to be at least 2 characters', () => {
        const item = { ...validItem, name: 'A' }
        const result = validateMenuItem(item)
        expect(result.isValid).toBe(false)
        expect(result.errors.name).toContain('at least 2 characters')
      })

      it('should limit name to 100 characters', () => {
        const item = { ...validItem, name: 'A'.repeat(101) }
        const result = validateMenuItem(item)
        expect(result.isValid).toBe(false)
        expect(result.errors.name).toContain('not exceed 100 characters')
      })

      it('should accept valid name', () => {
        const item = { ...validItem, name: 'Valid Pizza Name' }
        const result = validateMenuItem(item)
        expect(result.errors.name).toBeUndefined()
      })
    })

    describe('category validation', () => {
      it('should require category', () => {
        const item = { ...validItem, category: '' }
        const result = validateMenuItem(item)
        expect(result.isValid).toBe(false)
        expect(result.errors.category).toBeDefined()
      })

      it('should accept valid category', () => {
        const item = { ...validItem, category: 'burger' }
        const result = validateMenuItem(item)
        expect(result.errors.category).toBeUndefined()
      })
    })

    describe('price validation', () => {
      it('should require price', () => {
        const item = { ...validItem }
        delete item.price
        const result = validateMenuItem(item)
        expect(result.isValid).toBe(false)
        expect(result.errors.price).toBeDefined()
      })

      it('should reject negative price', () => {
        const item = { ...validItem, price: -5 }
        const result = validateMenuItem(item)
        expect(result.isValid).toBe(false)
        expect(result.errors.price).toContain('cannot be negative')
      })

      it('should reject non-numeric price', () => {
        const item = { ...validItem, price: 'invalid' }
        const result = validateMenuItem(item)
        expect(result.isValid).toBe(false)
        expect(result.errors.price).toContain('valid number')
      })

      it('should reject unreasonably high price', () => {
        const item = { ...validItem, price: 10001 }
        const result = validateMenuItem(item)
        expect(result.isValid).toBe(false)
        expect(result.errors.price).toContain('unreasonably high')
      })

      it('should accept valid price', () => {
        const item = { ...validItem, price: 15.99 }
        const result = validateMenuItem(item)
        expect(result.errors.price).toBeUndefined()
      })

      it('should accept zero price', () => {
        const item = { ...validItem, price: 0 }
        const result = validateMenuItem(item)
        expect(result.errors.price).toBeUndefined()
      })
    })

    describe('description validation', () => {
      it('should limit description to 500 characters', () => {
        const item = { ...validItem, description: 'A'.repeat(501) }
        const result = validateMenuItem(item)
        expect(result.isValid).toBe(false)
        expect(result.errors.description).toContain('not exceed 500 characters')
      })

      it('should accept valid description', () => {
        const item = { ...validItem, description: 'A nice description' }
        const result = validateMenuItem(item)
        expect(result.errors.description).toBeUndefined()
      })

      it('should accept empty description', () => {
        const item = { ...validItem, description: undefined }
        const result = validateMenuItem(item)
        expect(result.errors.description).toBeUndefined()
      })
    })

    describe('preparationTime validation', () => {
      it('should reject negative preparation time', () => {
        const item = { ...validItem, preparationTime: -5 }
        const result = validateMenuItem(item)
        expect(result.isValid).toBe(false)
        expect(result.errors.preparationTime).toContain('cannot be negative')
      })

      it('should reject non-numeric preparation time', () => {
        const item = { ...validItem, preparationTime: 'invalid' }
        const result = validateMenuItem(item)
        expect(result.isValid).toBe(false)
        expect(result.errors.preparationTime).toContain('valid number')
      })

      it('should reject unreasonably long preparation time', () => {
        const item = { ...validItem, preparationTime: 241 }
        const result = validateMenuItem(item)
        expect(result.isValid).toBe(false)
        expect(result.errors.preparationTime).toContain('too long')
      })

      it('should accept valid preparation time', () => {
        const item = { ...validItem, preparationTime: 20 }
        const result = validateMenuItem(item)
        expect(result.errors.preparationTime).toBeUndefined()
      })
    })

    describe('array validations', () => {
      it('should require ingredients to be array', () => {
        const item = { ...validItem, ingredients: 'not-array' }
        const result = validateMenuItem(item)
        expect(result.isValid).toBe(false)
        expect(result.errors.ingredients).toContain('must be an array')
      })

      it('should require allergens to be array', () => {
        const item = { ...validItem, allergens: 'not-array' }
        const result = validateMenuItem(item)
        expect(result.isValid).toBe(false)
        expect(result.errors.allergens).toContain('must be an array')
      })

      it('should accept valid arrays', () => {
        const item = {
          ...validItem,
          ingredients: ['tomato', 'cheese'],
          allergens: ['gluten']
        }
        const result = validateMenuItem(item)
        expect(result.errors.ingredients).toBeUndefined()
        expect(result.errors.allergens).toBeUndefined()
      })
    })

    describe('cuisine validation', () => {
      it('should accept valid cuisines', () => {
        const validCuisines = [
          'continental', 'french', 'italian', 'asian',
          'mediterranean', 'american', 'mexican', 'indian',
          'japanese', 'chinese', 'thai', 'other'
        ]

        validCuisines.forEach(cuisine => {
          const item = { ...validItem, cuisine }
          const result = validateMenuItem(item)
          expect(result.errors.cuisine).toBeUndefined()
        })
      })

      it('should reject invalid cuisine', () => {
        const item = { ...validItem, cuisine: 'invalid-cuisine' }
        const result = validateMenuItem(item)
        expect(result.isValid).toBe(false)
        expect(result.errors.cuisine).toContain('must be one of')
      })
    })

    describe('boolean validations', () => {
      it('should require isAvailable to be boolean if provided', () => {
        const item = { ...validItem, isAvailable: 'yes' }
        const result = validateMenuItem(item)
        expect(result.isValid).toBe(false)
        expect(result.errors.isAvailable).toContain('must be a boolean')
      })

      it('should require isPopular to be boolean if provided', () => {
        const item = { ...validItem, isPopular: 'yes' }
        const result = validateMenuItem(item)
        expect(result.isValid).toBe(false)
        expect(result.errors.isPopular).toContain('must be a boolean')
      })

      it('should accept boolean values', () => {
        const item = { ...validItem, isAvailable: true, isPopular: false }
        const result = validateMenuItem(item)
        expect(result.errors.isAvailable).toBeUndefined()
        expect(result.errors.isPopular).toBeUndefined()
      })
    })
  })

  describe('validateMenuItemUpdate', () => {
    it('should allow partial updates', () => {
      const update = { price: 15.99 }
      const result = validateMenuItemUpdate(update)
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual({})
    })

    it('should validate provided fields', () => {
      const update = { price: -5 }
      const result = validateMenuItemUpdate(update)
      expect(result.isValid).toBe(false)
      expect(result.errors.price).toBeDefined()
    })

    it('should not require all fields', () => {
      const update = { name: 'New Name' }
      const result = validateMenuItemUpdate(update)
      expect(result.isValid).toBe(true)
    })

    it('should reject empty name if provided', () => {
      const update = { name: '' }
      const result = validateMenuItemUpdate(update)
      expect(result.isValid).toBe(false)
      expect(result.errors.name).toBeDefined()
    })

    it('should validate name length if provided', () => {
      const update = { name: 'A' }
      const result = validateMenuItemUpdate(update)
      expect(result.isValid).toBe(false)
      expect(result.errors.name).toContain('at least 2 characters')
    })

    it('should validate price if provided', () => {
      const update = { price: 'invalid' }
      const result = validateMenuItemUpdate(update)
      expect(result.isValid).toBe(false)
      expect(result.errors.price).toBeDefined()
    })

    it('should validate cuisine if provided', () => {
      const update = { cuisine: 'invalid' }
      const result = validateMenuItemUpdate(update)
      expect(result.isValid).toBe(false)
      expect(result.errors.cuisine).toBeDefined()
    })

    it('should accept multiple valid updates', () => {
      const update = {
        name: 'Updated Name',
        price: 19.99,
        isAvailable: false
      }
      const result = validateMenuItemUpdate(update)
      expect(result.isValid).toBe(true)
    })
  })

  describe('sanitizeMenuItem', () => {
    it('should trim string fields', () => {
      const item = {
        name: '  Test Pizza  ',
        description: '  A nice pizza  ',
        category: '  pizza  '
      }
      const result = sanitizeMenuItem(item)
      expect(result.name).toBe('Test Pizza')
      expect(result.description).toBe('A nice pizza')
      expect(result.category).toBe('pizza')
    })

    it('should convert price to number', () => {
      const item = { price: '12.99' }
      const result = sanitizeMenuItem(item)
      expect(result.price).toBe(12.99)
      expect(typeof result.price).toBe('number')
    })

    it('should convert preparationTime to number', () => {
      const item = { preparationTime: '15' }
      const result = sanitizeMenuItem(item)
      expect(result.preparationTime).toBe(15)
      expect(typeof result.preparationTime).toBe('number')
    })

    it('should ensure ingredients is array', () => {
      const item = { ingredients: 'not-array' }
      const result = sanitizeMenuItem(item)
      expect(Array.isArray(result.ingredients)).toBe(true)
      expect(result.ingredients).toEqual([])
    })

    it('should ensure allergens is array', () => {
      const item = { allergens: 'not-array' }
      const result = sanitizeMenuItem(item)
      expect(Array.isArray(result.allergens)).toBe(true)
      expect(result.allergens).toEqual([])
    })

    it('should filter empty strings from ingredients', () => {
      const item = { ingredients: ['tomato', '', '  ', 'cheese'] }
      const result = sanitizeMenuItem(item)
      expect(result.ingredients).toEqual(['tomato', 'cheese'])
    })

    it('should filter empty strings from allergens', () => {
      const item = { allergens: ['gluten', '', '  ', 'dairy'] }
      const result = sanitizeMenuItem(item)
      expect(result.allergens).toEqual(['gluten', 'dairy'])
    })

    it('should trim ingredients', () => {
      const item = { ingredients: ['  tomato  ', '  cheese  '] }
      const result = sanitizeMenuItem(item)
      expect(result.ingredients).toEqual(['tomato', 'cheese'])
    })

    it('should ensure booleans', () => {
      const item = { isAvailable: 'yes', isPopular: 1 }
      const result = sanitizeMenuItem(item)
      expect(result.isAvailable).toBe(true)
      expect(result.isPopular).toBe(true)
      expect(typeof result.isAvailable).toBe('boolean')
      expect(typeof result.isPopular).toBe('boolean')
    })

    it('should not mutate original object', () => {
      const item = { name: '  Test  ', price: '12.99' }
      const original = JSON.parse(JSON.stringify(item))
      sanitizeMenuItem(item)
      expect(item).toEqual(original)
    })

    it('should handle complete item', () => {
      const item = {
        name: '  Test Pizza  ',
        price: '12.99',
        preparationTime: '15',
        description: '  Nice pizza  ',
        category: '  pizza  ',
        ingredients: ['  tomato  ', '', '  cheese  '],
        allergens: ['  gluten  ', '  dairy  '],
        isAvailable: 'yes',
        isPopular: 0
      }
      const result = sanitizeMenuItem(item)
      expect(result.name).toBe('Test Pizza')
      expect(result.price).toBe(12.99)
      expect(result.preparationTime).toBe(15)
      expect(result.description).toBe('Nice pizza')
      expect(result.category).toBe('pizza')
      expect(result.ingredients).toEqual(['tomato', 'cheese'])
      expect(result.allergens).toEqual(['gluten', 'dairy'])
      expect(result.isAvailable).toBe(true)
      expect(result.isPopular).toBe(false)
    })
  })
})
