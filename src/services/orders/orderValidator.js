/**
 * Order validation logic
 * Pure functions for validating order data and status transitions
 */

/**
 * Validate order creation data
 * @param {Object} orderData - Order data to validate
 * @returns {Object} Validation result {valid, errors}
 */
export const validateOrderData = (orderData) => {
  const errors = {}

  // Validate userId
  if (!orderData.userId || orderData.userId.trim() === '') {
    errors.userId = 'User ID is required'
  }

  // Validate items
  if (!orderData.items || !Array.isArray(orderData.items)) {
    errors.items = 'Items must be an array'
  } else if (orderData.items.length === 0) {
    errors.items = 'At least one item is required'
  } else {
    // Validate each item
    const itemErrors = []
    orderData.items.forEach((item, index) => {
      const itemError = {}

      if (!item.menuItem) {
        itemError.menuItem = 'Menu item ID is required'
      }

      if (!item.quantity || item.quantity < 1) {
        itemError.quantity = 'Quantity must be at least 1'
      }

      if (Object.keys(itemError).length > 0) {
        itemErrors[index] = itemError
      }
    })

    if (itemErrors.length > 0) {
      errors.itemValidation = itemErrors
    }
  }

  // Validate totalPrice
  if (orderData.totalPrice === undefined || orderData.totalPrice === null) {
    errors.totalPrice = 'Total price is required'
  } else if (typeof orderData.totalPrice !== 'number') {
    errors.totalPrice = 'Total price must be a number'
  } else if (orderData.totalPrice < 0) {
    errors.totalPrice = 'Total price cannot be negative'
  }

  // Validate phone
  if (!orderData.phone || orderData.phone.trim() === '') {
    errors.phone = 'Phone number is required'
  }

  // Validate paymentMethod
  const validPaymentMethods = ['card', 'cash']
  if (!orderData.paymentMethod || !validPaymentMethods.includes(orderData.paymentMethod)) {
    errors.paymentMethod = 'Payment method must be "card" or "cash"'
  }

  // Validate orderType
  const validOrderTypes = ['delivery', 'pickup']
  if (!orderData.orderType || !validOrderTypes.includes(orderData.orderType)) {
    errors.orderType = 'Order type must be "delivery" or "pickup"'
  }

  // Validate delivery address if orderType is delivery
  if (orderData.orderType === 'delivery') {
    if (!orderData.deliveryAddress) {
      errors.deliveryAddress = 'Delivery address is required for delivery orders'
    } else {
      const addressErrors = {}

      if (!orderData.deliveryAddress.street || orderData.deliveryAddress.street.trim() === '') {
        addressErrors.street = 'Street is required'
      }

      if (!orderData.deliveryAddress.city || orderData.deliveryAddress.city.trim() === '') {
        addressErrors.city = 'City is required'
      }

      if (!orderData.deliveryAddress.zipCode || orderData.deliveryAddress.zipCode.trim() === '') {
        addressErrors.zipCode = 'Zip code is required'
      }

      if (Object.keys(addressErrors).length > 0) {
        errors.addressValidation = addressErrors
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * Validate status transition
 * @param {string} currentStatus - Current order status
 * @param {string} newStatus - New status to transition to
 * @returns {Object} Validation result {valid, error}
 */
export const validateStatusTransition = (currentStatus, newStatus) => {
  // Define valid status transitions
  const validTransitions = {
    'pending': ['confirmed', 'cancelled'],
    'confirmed': ['preparing', 'cancelled'],
    'preparing': ['ready', 'cancelled'],
    'ready': ['delivered', 'cancelled'],
    'delivered': [], // Terminal state - no further transitions
    'cancelled': [] // Terminal state - no further transitions
  }

  if (!currentStatus) {
    return {
      valid: false,
      error: 'Current status is required'
    }
  }

  if (!newStatus) {
    return {
      valid: false,
      error: 'New status is required'
    }
  }

  if (!validTransitions[currentStatus]) {
    return {
      valid: false,
      error: `Invalid current status: ${currentStatus}`
    }
  }

  const allowedTransitions = validTransitions[currentStatus]

  if (allowedTransitions.length === 0) {
    return {
      valid: false,
      error: `Cannot transition from terminal status: ${currentStatus}`
    }
  }

  if (!allowedTransitions.includes(newStatus)) {
    return {
      valid: false,
      error: `Invalid transition from ${currentStatus} to ${newStatus}. Allowed: ${allowedTransitions.join(', ')}`
    }
  }

  return {
    valid: true,
    error: null
  }
}

/**
 * Check if an order can be cancelled
 * @param {Object} order - Order object
 * @returns {Object} Result {canCancel, reason}
 */
export const canCancelOrder = (order) => {
  if (!order) {
    return {
      canCancel: false,
      reason: 'Order not found'
    }
  }

  // Cannot cancel if already delivered or cancelled
  if (order.status === 'delivered') {
    return {
      canCancel: false,
      reason: 'Order has already been delivered'
    }
  }

  if (order.status === 'cancelled') {
    return {
      canCancel: false,
      reason: 'Order is already cancelled'
    }
  }

  // Can cancel in any other status
  return {
    canCancel: true,
    reason: null
  }
}

/**
 * Check if an order can be modified
 * @param {Object} order - Order object
 * @returns {Object} Result {canModify, reason}
 */
export const canModifyOrder = (order) => {
  if (!order) {
    return {
      canModify: false,
      reason: 'Order not found'
    }
  }

  // Can only modify if still pending
  if (order.status !== 'pending') {
    return {
      canModify: false,
      reason: `Cannot modify order with status: ${order.status}`
    }
  }

  return {
    canModify: true,
    reason: null
  }
}

/**
 * Validate payment status update
 * @param {Object} order - Order object
 * @param {string} newPaymentStatus - New payment status
 * @returns {Object} Validation result {valid, error}
 */
export const validatePaymentStatusUpdate = (order, newPaymentStatus) => {
  if (!order) {
    return {
      valid: false,
      error: 'Order not found'
    }
  }

  const validPaymentStatuses = ['paid', 'pending']
  if (!validPaymentStatuses.includes(newPaymentStatus)) {
    return {
      valid: false,
      error: `Invalid payment status: ${newPaymentStatus}`
    }
  }

  // Cannot change payment status to pending if already paid
  if (order.paymentStatus === 'paid' && newPaymentStatus === 'pending') {
    return {
      valid: false,
      error: 'Cannot change payment status from paid to pending'
    }
  }

  return {
    valid: true,
    error: null
  }
}

/**
 * Sanitize order data before sending to API
 * @param {Object} orderData - Raw order data
 * @returns {Object} Sanitized order data
 */
export const sanitizeOrderData = (orderData) => {
  const sanitized = { ...orderData }

  // Trim string fields
  if (sanitized.phone) {
    sanitized.phone = sanitized.phone.trim()
  }

  if (sanitized.specialInstructions) {
    sanitized.specialInstructions = sanitized.specialInstructions.trim()
  }

  // Sanitize delivery address
  if (sanitized.deliveryAddress) {
    sanitized.deliveryAddress = {
      street: sanitized.deliveryAddress.street?.trim() || '',
      city: sanitized.deliveryAddress.city?.trim() || '',
      zipCode: sanitized.deliveryAddress.zipCode?.trim() || '',
      instructions: sanitized.deliveryAddress.instructions?.trim() || null
    }
  }

  // Ensure totalPrice is a number
  if (sanitized.totalPrice !== undefined) {
    sanitized.totalPrice = Number(sanitized.totalPrice)
  }

  // Sanitize items
  if (sanitized.items && Array.isArray(sanitized.items)) {
    sanitized.items = sanitized.items.map(item => ({
      menuItem: item.menuItem,
      quantity: Number(item.quantity),
      specialInstructions: item.specialInstructions?.trim() || null
    }))
  }

  return sanitized
}
