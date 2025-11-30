import { describe, it, expect } from 'vitest'
import {
  validateOrderData,
  validateStatusTransition,
  canCancelOrder,
  canModifyOrder,
  validatePaymentStatusUpdate,
  sanitizeOrderData
} from '../../services/orders/orderValidator'

describe('orderValidator', () => {
  const validOrderData = {
    userId: 'user123',
    items: [
      { menuItem: 'item1', quantity: 2 },
      { menuItem: 'item2', quantity: 1 }
    ],
    totalPrice: 35.50,
    phone: '0612345678',
    paymentMethod: 'card',
    orderType: 'delivery',
    deliveryAddress: {
      street: '123 Main St',
      city: 'Paris',
      zipCode: '75001'
    }
  }

  describe('validateOrderData', () => {
    it('should validate complete valid order', () => {
      const result = validateOrderData(validOrderData)
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual({})
    })

    it('should require userId', () => {
      const data = { ...validOrderData, userId: '' }
      const result = validateOrderData(data)
      expect(result.isValid).toBe(false)
      expect(result.errors.userId).toBeDefined()
    })

    it('should require items array', () => {
      const data = { ...validOrderData, items: [] }
      const result = validateOrderData(data)
      expect(result.isValid).toBe(false)
      expect(result.errors.items).toBeDefined()
    })

    it('should validate item structure', () => {
      const data = {
        ...validOrderData,
        items: [{ menuItem: 'item1' }] // Missing quantity
      }
      const result = validateOrderData(data)
      expect(result.isValid).toBe(false)
      expect(result.errors.itemValidation).toBeDefined()
    })

    it('should require totalPrice', () => {
      const data = { ...validOrderData }
      delete data.totalPrice
      const result = validateOrderData(data)
      expect(result.isValid).toBe(false)
      expect(result.errors.totalPrice).toBeDefined()
    })

    it('should reject negative totalPrice', () => {
      const data = { ...validOrderData, totalPrice: -10 }
      const result = validateOrderData(data)
      expect(result.isValid).toBe(false)
      expect(result.errors.totalPrice).toContain('negative')
    })

    it('should require phone', () => {
      const data = { ...validOrderData, phone: '' }
      const result = validateOrderData(data)
      expect(result.isValid).toBe(false)
      expect(result.errors.phone).toBeDefined()
    })

    it('should validate paymentMethod', () => {
      const data = { ...validOrderData, paymentMethod: 'invalid' }
      const result = validateOrderData(data)
      expect(result.isValid).toBe(false)
      expect(result.errors.paymentMethod).toBeDefined()
    })

    it('should validate orderType', () => {
      const data = { ...validOrderData, orderType: 'invalid' }
      const result = validateOrderData(data)
      expect(result.isValid).toBe(false)
      expect(result.errors.orderType).toBeDefined()
    })

    it('should require delivery address for delivery orders', () => {
      const data = { ...validOrderData }
      delete data.deliveryAddress
      const result = validateOrderData(data)
      expect(result.isValid).toBe(false)
      expect(result.errors.deliveryAddress).toBeDefined()
    })

    it('should validate delivery address fields', () => {
      const data = {
        ...validOrderData,
        deliveryAddress: { street: '', city: '', zipCode: '' }
      }
      const result = validateOrderData(data)
      expect(result.isValid).toBe(false)
      expect(result.errors.addressValidation).toBeDefined()
    })

    it('should not require delivery address for pickup', () => {
      const data = {
        ...validOrderData,
        orderType: 'pickup'
      }
      delete data.deliveryAddress
      const result = validateOrderData(data)
      expect(result.isValid).toBe(true)
    })
  })

  describe('validateStatusTransition', () => {
    it('should allow pending -> confirmed', () => {
      const result = validateStatusTransition('pending', 'confirmed')
      expect(result.isValid).toBe(true)
    })

    it('should allow confirmed -> preparing', () => {
      const result = validateStatusTransition('confirmed', 'preparing')
      expect(result.isValid).toBe(true)
    })

    it('should allow preparing -> ready', () => {
      const result = validateStatusTransition('preparing', 'ready')
      expect(result.isValid).toBe(true)
    })

    it('should allow ready -> delivered', () => {
      const result = validateStatusTransition('ready', 'delivered')
      expect(result.isValid).toBe(true)
    })

    it('should allow any -> cancelled', () => {
      expect(validateStatusTransition('pending', 'cancelled').isValid).toBe(true)
      expect(validateStatusTransition('confirmed', 'cancelled').isValid).toBe(true)
      expect(validateStatusTransition('preparing', 'cancelled').isValid).toBe(true)
    })

    it('should reject invalid transition', () => {
      const result = validateStatusTransition('pending', 'delivered')
      expect(result.isValid).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should reject transition from delivered', () => {
      const result = validateStatusTransition('delivered', 'confirmed')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('terminal')
    })

    it('should reject transition from cancelled', () => {
      const result = validateStatusTransition('cancelled', 'confirmed')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('terminal')
    })
  })

  describe('canCancelOrder', () => {
    it('should allow cancelling pending order', () => {
      const order = { status: 'pending' }
      const result = canCancelOrder(order)
      expect(result.canCancel).toBe(true)
    })

    it('should allow cancelling confirmed order', () => {
      const order = { status: 'confirmed' }
      const result = canCancelOrder(order)
      expect(result.canCancel).toBe(true)
    })

    it('should not allow cancelling delivered order', () => {
      const order = { status: 'delivered' }
      const result = canCancelOrder(order)
      expect(result.canCancel).toBe(false)
      expect(result.reason).toContain('delivered')
    })

    it('should not allow cancelling already cancelled order', () => {
      const order = { status: 'cancelled' }
      const result = canCancelOrder(order)
      expect(result.canCancel).toBe(false)
      expect(result.reason).toContain('cancelled')
    })

    it('should handle null order', () => {
      const result = canCancelOrder(null)
      expect(result.canCancel).toBe(false)
    })
  })

  describe('canModifyOrder', () => {
    it('should allow modifying pending order', () => {
      const order = { status: 'pending' }
      const result = canModifyOrder(order)
      expect(result.canModify).toBe(true)
    })

    it('should not allow modifying confirmed order', () => {
      const order = { status: 'confirmed' }
      const result = canModifyOrder(order)
      expect(result.canModify).toBe(false)
    })

    it('should handle null order', () => {
      const result = canModifyOrder(null)
      expect(result.canModify).toBe(false)
    })
  })

  describe('validatePaymentStatusUpdate', () => {
    it('should allow pending -> paid', () => {
      const order = { paymentStatus: 'pending' }
      const result = validatePaymentStatusUpdate(order, 'paid')
      expect(result.isValid).toBe(true)
    })

    it('should not allow paid -> pending', () => {
      const order = { paymentStatus: 'paid' }
      const result = validatePaymentStatusUpdate(order, 'pending')
      expect(result.isValid).toBe(false)
    })

    it('should reject invalid payment status', () => {
      const order = { paymentStatus: 'pending' }
      const result = validatePaymentStatusUpdate(order, 'invalid')
      expect(result.isValid).toBe(false)
    })

    it('should handle null order', () => {
      const result = validatePaymentStatusUpdate(null, 'paid')
      expect(result.isValid).toBe(false)
    })
  })

  describe('sanitizeOrderData', () => {
    it('should trim string fields', () => {
      const data = {
        phone: '  0612345678  ',
        specialInstructions: '  Please ring bell  '
      }
      const result = sanitizeOrderData(data)
      expect(result.phone).toBe('0612345678')
      expect(result.specialInstructions).toBe('Please ring bell')
    })

    it('should sanitize delivery address', () => {
      const data = {
        deliveryAddress: {
          street: '  123 Main St  ',
          city: '  Paris  ',
          zipCode: '  75001  ',
          instructions: '  Ring twice  '
        }
      }
      const result = sanitizeOrderData(data)
      expect(result.deliveryAddress.street).toBe('123 Main St')
      expect(result.deliveryAddress.city).toBe('Paris')
      expect(result.deliveryAddress.zipCode).toBe('75001')
      expect(result.deliveryAddress.instructions).toBe('Ring twice')
    })

    it('should convert totalPrice to number', () => {
      const data = { totalPrice: '35.50' }
      const result = sanitizeOrderData(data)
      expect(result.totalPrice).toBe(35.50)
      expect(typeof result.totalPrice).toBe('number')
    })

    it('should sanitize items', () => {
      const data = {
        items: [
          {
            menuItem: 'item1',
            quantity: '2',
            specialInstructions: '  No onions  '
          }
        ]
      }
      const result = sanitizeOrderData(data)
      expect(result.items[0].quantity).toBe(2)
      expect(result.items[0].specialInstructions).toBe('No onions')
    })

    it('should not mutate original object', () => {
      const data = { phone: '  0612345678  ' }
      const original = JSON.parse(JSON.stringify(data))
      sanitizeOrderData(data)
      expect(data).toEqual(original)
    })
  })
})
