/**
 * Filtering and querying logic for menu items
 * Pure functions - no side effects
 */

/**
 * Check if an item is available
 * @param {Object} item - Menu item
 * @returns {boolean} True if available
 */
export const isItemAvailable = (item) => {
  if (!item) return false
  return item.isAvailable !== false && !item.deleted
}

/**
 * Get available items from a list
 * @param {Array} items - Array of menu items
 * @returns {Array} Available items
 */
export const getAvailableItems = (items) => {
  if (!items || !Array.isArray(items)) {
    return []
  }
  return items.filter(item => isItemAvailable(item))
}

/**
 * Get popular items (local fallback)
 * NOTE: The real popular items are calculated by the backend with category distribution.
 * This function is a local fallback that excludes overridden items.
 * @param {Array} items - Array of menu items
 * @returns {Array} Popular and available items (excluding overridden)
 */
export const getPopularItems = (items) => {
  if (!items || !Array.isArray(items)) {
    return []
  }
  return items.filter(item =>
    isItemAvailable(item) &&
    item.isPopular &&
    !item.isPopularOverride
  )
}

/**
 * Get suggested items (restaurant recommendations)
 * @param {Array} items - Array of menu items
 * @returns {Array} Suggested and available items
 */
export const getSuggestedItems = (items) => {
  if (!items || !Array.isArray(items)) {
    return []
  }
  return items.filter(item => isItemAvailable(item) && item.isSuggested)
}

/**
 * Get items by category
 * @param {Array} items - Array of menu items
 * @param {string} category - Category to filter by
 * @returns {Array} Items in the category
 */
export const getItemsByCategory = (items, category) => {
  if (!items || !Array.isArray(items) || !category) {
    return []
  }
  return items.filter(item => isItemAvailable(item) && item.category === category)
}

/**
 * Get item by ID
 * @param {Array} items - Array of menu items
 * @param {string} id - Item ID
 * @returns {Object|undefined} Found item or undefined
 */
export const getItemById = (items, id) => {
  if (!items || !Array.isArray(items) || !id) {
    return undefined
  }
  return items.find(item => item.id === id)
}

/**
 * Filter items by multiple criteria
 * @param {Array} items - Array of menu items
 * @param {Object} filters - Filter options
 * @param {string} [filters.category] - Filter by category
 * @param {boolean} [filters.isPopular] - Filter by popular
 * @param {boolean} [filters.isAvailable] - Filter by availability
 * @param {string} [filters.cuisine] - Filter by cuisine type
 * @param {boolean} [filters.isPopularOverride] - Filter by popular override status
 * @param {boolean} [filters.isSuggested] - Filter by suggested status
 * @returns {Array} Filtered items
 */
export const filterItems = (items, filters = {}) => {
  if (!items || !Array.isArray(items)) {
    return []
  }

  const safeFilters = filters || {}
  let result = [...items]

  // Apply availability filter
  if (safeFilters.isAvailable !== undefined) {
    if (safeFilters.isAvailable) {
      result = result.filter(item => isItemAvailable(item))
    } else {
      result = result.filter(item => !isItemAvailable(item))
    }
  }

  // Apply category filter
  if (safeFilters.category) {
    result = result.filter(item => item.category === safeFilters.category)
  }

  // Apply popular filter
  if (safeFilters.isPopular !== undefined) {
    result = result.filter(item => item.isPopular === safeFilters.isPopular)
  }

  // Apply cuisine filter
  if (safeFilters.cuisine) {
    result = result.filter(item => item.cuisine === safeFilters.cuisine)
  }

  // Apply popular override filter
  if (safeFilters.isPopularOverride !== undefined) {
    result = result.filter(item => item.isPopularOverride === safeFilters.isPopularOverride)
  }

  // Apply suggested filter
  if (safeFilters.isSuggested !== undefined) {
    result = result.filter(item => item.isSuggested === safeFilters.isSuggested)
  }

  return result
}

/**
 * Search items by text (name, description, ingredients)
 * @param {Array} items - Array of menu items
 * @param {string} searchText - Text to search for
 * @returns {Array} Matching items
 */
export const searchItems = (items, searchText) => {
  if (!items || !Array.isArray(items)) {
    return []
  }

  if (!searchText || searchText.trim() === '') {
    return items
  }

  const searchLower = searchText.toLowerCase().trim()

  return items.filter(item => {
    const name = item.name?.toLowerCase() || ''
    const description = item.description?.toLowerCase() || ''
    const ingredients = item.ingredients?.join(' ').toLowerCase() || ''
    const category = item.category?.toLowerCase() || ''

    return name.includes(searchLower) ||
           description.includes(searchLower) ||
           ingredients.includes(searchLower) ||
           category.includes(searchLower)
  })
}

/**
 * Sort items by various criteria
 * @param {Array} items - Array of menu items
 * @param {string} sortBy - Sort criteria ('name', 'price', 'popularity')
 * @param {string} direction - Sort direction ('asc' or 'desc')
 * @returns {Array} Sorted items
 */
export const sortItems = (items, sortBy = 'name', direction = 'asc') => {
  if (!items || !Array.isArray(items)) {
    return []
  }

  const sorted = [...items]

  sorted.sort((a, b) => {
    let comparison = 0

    switch (sortBy) {
      case 'name':
        comparison = (a.name || '').localeCompare(b.name || '')
        break
      case 'price':
        comparison = (a.price || 0) - (b.price || 0)
        break
      case 'popularity':
        // Popular items first
        if (a.isPopular && !b.isPopular) comparison = -1
        else if (!a.isPopular && b.isPopular) comparison = 1
        else comparison = 0
        break
      default:
        comparison = 0
    }

    return direction === 'desc' ? -comparison : comparison
  })

  return sorted
}
