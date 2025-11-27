/**
 * Menu Item Validator
 * Validation logic for menu items (used for admin CRUD operations)
 */

/**
 * Validate menu item data
 * @param {Object} itemData - Menu item data to validate
 * @returns {Object} Validation result {valid, errors}
 */
export const validateMenuItem = (itemData) => {
  const errors = {}

  // Required fields
  if (!itemData.name || itemData.name.trim() === '') {
    errors.name = 'Name is required'
  } else if (itemData.name.length < 2) {
    errors.name = 'Name must be at least 2 characters'
  } else if (itemData.name.length > 100) {
    errors.name = 'Name must not exceed 100 characters'
  }

  if (!itemData.category || itemData.category.trim() === '') {
    errors.category = 'Category is required'
  }

  if (itemData.price === undefined || itemData.price === null || itemData.price === '') {
    errors.price = 'Price is required'
  } else {
    const price = Number(itemData.price)
    if (isNaN(price)) {
      errors.price = 'Price must be a valid number'
    } else if (price < 0) {
      errors.price = 'Price cannot be negative'
    } else if (price > 10000) {
      errors.price = 'Price seems unreasonably high (max: 10000)'
    }
  }

  // Optional but validated if provided
  if (itemData.description && itemData.description.length > 500) {
    errors.description = 'Description must not exceed 500 characters'
  }

  if (itemData.preparationTime !== undefined && itemData.preparationTime !== null && itemData.preparationTime !== '') {
    const prepTime = Number(itemData.preparationTime)
    if (isNaN(prepTime)) {
      errors.preparationTime = 'Preparation time must be a valid number'
    } else if (prepTime < 0) {
      errors.preparationTime = 'Preparation time cannot be negative'
    } else if (prepTime > 240) {
      errors.preparationTime = 'Preparation time seems too long (max: 240 minutes)'
    }
  }

  // Array validations
  if (itemData.ingredients && !Array.isArray(itemData.ingredients)) {
    errors.ingredients = 'Ingredients must be an array'
  }

  if (itemData.allergens && !Array.isArray(itemData.allergens)) {
    errors.allergens = 'Allergens must be an array'
  }

  // Cuisine validation
  const validCuisines = [
    'continental',
    'french',
    'italian',
    'asian',
    'mediterranean',
    'american',
    'mexican',
    'indian',
    'japanese',
    'chinese',
    'thai',
    'other'
  ]

  if (itemData.cuisine && !validCuisines.includes(itemData.cuisine)) {
    errors.cuisine = `Cuisine must be one of: ${validCuisines.join(', ')}`
  }

  // Boolean validations
  if (itemData.isAvailable !== undefined && typeof itemData.isAvailable !== 'boolean') {
    errors.isAvailable = 'isAvailable must be a boolean'
  }

  if (itemData.isPopular !== undefined && typeof itemData.isPopular !== 'boolean') {
    errors.isPopular = 'isPopular must be a boolean'
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * Validate menu item update data
 * Same as create but allows partial updates
 * @param {Object} itemData - Menu item data to validate
 * @returns {Object} Validation result {valid, errors}
 */
export const validateMenuItemUpdate = (itemData) => {
  const errors = {}

  // Name validation (if provided)
  if (itemData.name !== undefined) {
    if (itemData.name.trim() === '') {
      errors.name = 'Name cannot be empty'
    } else if (itemData.name.length < 2) {
      errors.name = 'Name must be at least 2 characters'
    } else if (itemData.name.length > 100) {
      errors.name = 'Name must not exceed 100 characters'
    }
  }

  // Price validation (if provided)
  if (itemData.price !== undefined) {
    const price = Number(itemData.price)
    if (isNaN(price)) {
      errors.price = 'Price must be a valid number'
    } else if (price < 0) {
      errors.price = 'Price cannot be negative'
    } else if (price > 10000) {
      errors.price = 'Price seems unreasonably high (max: 10000)'
    }
  }

  // Description validation (if provided)
  if (itemData.description !== undefined && itemData.description.length > 500) {
    errors.description = 'Description must not exceed 500 characters'
  }

  // Preparation time validation (if provided)
  if (itemData.preparationTime !== undefined) {
    const prepTime = Number(itemData.preparationTime)
    if (isNaN(prepTime)) {
      errors.preparationTime = 'Preparation time must be a valid number'
    } else if (prepTime < 0) {
      errors.preparationTime = 'Preparation time cannot be negative'
    } else if (prepTime > 240) {
      errors.preparationTime = 'Preparation time seems too long (max: 240 minutes)'
    }
  }

  // Array validations (if provided)
  if (itemData.ingredients !== undefined && !Array.isArray(itemData.ingredients)) {
    errors.ingredients = 'Ingredients must be an array'
  }

  if (itemData.allergens !== undefined && !Array.isArray(itemData.allergens)) {
    errors.allergens = 'Allergens must be an array'
  }

  // Cuisine validation (if provided)
  const validCuisines = [
    'continental',
    'french',
    'italian',
    'asian',
    'mediterranean',
    'american',
    'mexican',
    'indian',
    'japanese',
    'chinese',
    'thai',
    'other'
  ]

  if (itemData.cuisine !== undefined && !validCuisines.includes(itemData.cuisine)) {
    errors.cuisine = `Cuisine must be one of: ${validCuisines.join(', ')}`
  }

  // Boolean validations (if provided)
  if (itemData.isAvailable !== undefined && typeof itemData.isAvailable !== 'boolean') {
    errors.isAvailable = 'isAvailable must be a boolean'
  }

  if (itemData.isPopular !== undefined && typeof itemData.isPopular !== 'boolean') {
    errors.isPopular = 'isPopular must be a boolean'
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * Sanitize menu item data before sending to API
 * Removes empty strings, trims strings, ensures correct types
 * @param {Object} itemData - Menu item data
 * @returns {Object} Sanitized data
 */
export const sanitizeMenuItem = (itemData) => {
  const sanitized = { ...itemData }

  // Trim strings
  if (sanitized.name) {
    sanitized.name = sanitized.name.trim()
  }

  if (sanitized.description) {
    sanitized.description = sanitized.description.trim()
  }

  if (sanitized.category) {
    sanitized.category = sanitized.category.trim()
  }

  // Convert to numbers
  if (sanitized.price !== undefined && sanitized.price !== null) {
    sanitized.price = Number(sanitized.price)
  }

  if (sanitized.preparationTime !== undefined && sanitized.preparationTime !== null) {
    sanitized.preparationTime = Number(sanitized.preparationTime)
  }

  // Ensure arrays
  if (sanitized.ingredients && !Array.isArray(sanitized.ingredients)) {
    sanitized.ingredients = []
  }

  if (sanitized.allergens && !Array.isArray(sanitized.allergens)) {
    sanitized.allergens = []
  }

  // Filter out empty ingredients/allergens
  if (sanitized.ingredients) {
    sanitized.ingredients = sanitized.ingredients
      .map(i => i.trim())
      .filter(i => i.length > 0)
  }

  if (sanitized.allergens) {
    sanitized.allergens = sanitized.allergens
      .map(a => a.trim())
      .filter(a => a.length > 0)
  }

  // Ensure booleans
  if (sanitized.isAvailable !== undefined) {
    sanitized.isAvailable = Boolean(sanitized.isAvailable)
  }

  if (sanitized.isPopular !== undefined) {
    sanitized.isPopular = Boolean(sanitized.isPopular)
  }

  return sanitized
}
