/**
 * Menu Service - Main orchestration for menu business logic
 * Delegates to specialized modules for filtering, validation, etc.
 */

import {
  isItemAvailable,
  getAvailableItems,
  getPopularItems,
  getItemsByCategory,
  getItemById,
  filterItems,
  searchItems,
  sortItems
} from './menuFilters'

/**
 * MenuService - Main service for menu-related operations
 */
class MenuService {
  /**
   * Check if a menu item is available
   * @param {Object} item - Menu item
   * @returns {boolean} True if available
   */
  isAvailable(item) {
    return isItemAvailable(item)
  }

  /**
   * Get all available items
   * @param {Array} items - Array of menu items
   * @returns {Array} Available items
   */
  getAvailable(items) {
    return getAvailableItems(items)
  }

  /**
   * Get popular items
   * @param {Array} items - Array of menu items
   * @returns {Array} Popular and available items
   */
  getPopular(items) {
    return getPopularItems(items)
  }

  /**
   * Get items by category
   * @param {Array} items - Array of menu items
   * @param {string} category - Category to filter by
   * @returns {Array} Items in the category
   */
  getByCategory(items, category) {
    return getItemsByCategory(items, category)
  }

  /**
   * Get item by ID
   * @param {Array} items - Array of menu items
   * @param {string} id - Item ID
   * @returns {Object|undefined} Found item or undefined
   */
  getById(items, id) {
    return getItemById(items, id)
  }

  /**
   * Filter items by multiple criteria
   * @param {Array} items - Array of menu items
   * @param {Object} filters - Filter options
   * @returns {Array} Filtered items
   */
  filter(items, filters) {
    return filterItems(items, filters)
  }

  /**
   * Search items by text
   * @param {Array} items - Array of menu items
   * @param {string} searchText - Text to search for
   * @returns {Array} Matching items
   */
  search(items, searchText) {
    return searchItems(items, searchText)
  }

  /**
   * Sort items
   * @param {Array} items - Array of menu items
   * @param {string} sortBy - Sort criteria
   * @param {string} direction - Sort direction
   * @returns {Array} Sorted items
   */
  sort(items, sortBy, direction) {
    return sortItems(items, sortBy, direction)
  }

  /**
   * Enrich cart items with current menu data
   * CRITICAL: Used by cartStore for cart enrichment
   *
   * @param {Array} cartItems - Items in cart [{id, quantity, price, ...}]
   * @param {Array} menuItems - Current menu items from menuStore
   * @returns {Array} Enriched cart items with availability and current prices
   *
   * Each enriched item includes:
   * - All original cart item properties
   * - isAvailable: boolean (based on current menu state)
   * - currentPrice: number (current price from menu, falls back to cart price)
   * - stillExists: boolean (whether item still exists in menu)
   */
  enrichCartItems(cartItems, menuItems) {
    if (!cartItems || !Array.isArray(cartItems)) {
      return []
    }

    if (!menuItems || !Array.isArray(menuItems)) {
      return []
    }

    const menuIsLoaded = menuItems.length > 0

    return cartItems.map(cartItem => {
      const menuItem = menuItems.find(menu => menu.id === cartItem.id)

      // If menu is loaded and item not found, it doesn't exist
      // If menu is not loaded yet, assume it exists (optimistic)
      const stillExists = menuItem ? true : !menuIsLoaded

      // If menu item found, use its availability
      // If menu not loaded, assume available (optimistic)
      // If loaded but not found, it's not available
      const available = menuItem
        ? isItemAvailable(menuItem)
        : !menuIsLoaded

      return {
        ...cartItem,
        isAvailable: available,
        currentPrice: menuItem ? menuItem.price : cartItem.price,
        stillExists
      }
    })
  }

  /**
   * Get available cart items only
   * @param {Array} cartItems - Items in cart
   * @param {Array} menuItems - Current menu items
   * @returns {Array} Only available and existing cart items
   */
  getAvailableCartItems(cartItems, menuItems) {
    const enriched = this.enrichCartItems(cartItems, menuItems)
    return enriched.filter(item => item.isAvailable && item.stillExists)
  }

  /**
   * Calculate total price for cart items
   * Uses current menu prices for accuracy
   *
   * @param {Array} cartItems - Items in cart
   * @param {Array} menuItems - Current menu items
   * @param {boolean} availableOnly - Only count available items (default: false)
   * @returns {number} Total price
   */
  calculateCartTotal(cartItems, menuItems, availableOnly = false) {
    if (!cartItems || !Array.isArray(cartItems)) {
      return 0
    }

    const items = availableOnly
      ? this.getAvailableCartItems(cartItems, menuItems)
      : this.enrichCartItems(cartItems, menuItems)

    return items.reduce((total, item) => {
      return total + (item.currentPrice * item.quantity)
    }, 0)
  }

  /**
   * Validate if cart items can be ordered
   * Checks availability and existence
   *
   * @param {Array} cartItems - Items in cart
   * @param {Array} menuItems - Current menu items
   * @returns {{ isValid: boolean, error: string|null, unavailableItems: Array, missingItems: Array }}
   */
  validateCartForCheckout(cartItems, menuItems) {
    if (!cartItems || cartItems.length === 0) {
      return {
        isValid: false,
        error: 'Cart is empty',
        unavailableItems: [],
        missingItems: []
      }
    }

    const enriched = this.enrichCartItems(cartItems, menuItems)
    const unavailableItems = enriched.filter(item => !item.isAvailable && item.stillExists)
    const missingItems = enriched.filter(item => !item.stillExists)

    const isValid = unavailableItems.length === 0 && missingItems.length === 0

    return {
      isValid,
      error: isValid ? null : 'Some items are unavailable or no longer exist',
      unavailableItems: unavailableItems.map(i => ({ id: i.id, name: i.name })),
      missingItems: missingItems.map(i => ({ id: i.id, name: i.name })),
      availableCount: enriched.filter(i => i.isAvailable && i.stillExists).length,
      totalCount: enriched.length
    }
  }

  /**
   * Normalize menu items from API
   * Ensures all required fields exist with proper types
   *
   * @param {Array} rawItems - Raw items from API
   * @returns {Array} Normalized items
   */
  normalizeItems(rawItems) {
    if (!rawItems || !Array.isArray(rawItems)) {
      return []
    }

    return rawItems.map(item => ({
      ...item,
      allergens: item.allergens || [],
      ingredients: item.ingredients || [],
      preparationTime: item.preparationTime || 0,
      cuisine: item.cuisine || 'continental',
      isAvailable: Boolean(item.isAvailable),
      isPopular: Boolean(item.isPopular),
      deleted: Boolean(item.deleted)
    }))
  }

  /**
   * Extract unique categories from items
   * @param {Array} items - Array of menu items
   * @returns {Array} Unique categories
   */
  extractCategories(items) {
    if (!items || !Array.isArray(items)) {
      return []
    }

    const categories = items
      .map(item => item.category)
      .filter(Boolean)

    return [...new Set(categories)]
  }

  /**
   * Get menu statistics
   * @param {Array} items - Array of menu items
   * @returns {Object} Menu statistics
   */
  getStats(items) {
    if (!items || !Array.isArray(items)) {
      return {
        total: 0,
        available: 0,
        unavailable: 0,
        popular: 0,
        categories: 0
      }
    }

    const available = this.getAvailable(items)
    const popular = this.getPopular(items)
    const categories = this.extractCategories(items)

    return {
      total: items.length,
      available: available.length,
      unavailable: items.length - available.length,
      popular: popular.length,
      categories: categories.length,
      categoryList: categories
    }
  }
}

// Export singleton instance
export default new MenuService()
