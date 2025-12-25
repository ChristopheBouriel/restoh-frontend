import { describe, it, expect, vi, beforeEach } from 'vitest'
import apiClient from '../../api/apiClient'
import {
  getUserOrders,
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  deleteOrder,
  getOrdersByUserId,
  getRecentOrders,
  getHistoricalOrders
} from '../../api/ordersApi'

vi.mock('../../api/apiClient')

// Mock import.meta.env
vi.stubGlobal('import', { meta: { env: { VITE_MOCK_API: 'false' } } })

describe('Orders API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getUserOrders', () => {
    it('should fetch user orders', async () => {
      apiClient.get.mockResolvedValue({ orders: [{ id: 'order-1' }] })

      const result = await getUserOrders()

      expect(apiClient.get).toHaveBeenCalledWith('/orders')
      expect(result.success).toBe(true)
      expect(result.orders).toEqual([{ id: 'order-1' }])
    })
  })

  describe('getAllOrders', () => {
    it('should fetch all orders without filters', async () => {
      apiClient.get.mockResolvedValue({ orders: [] })

      await getAllOrders()

      expect(apiClient.get).toHaveBeenCalledWith('/orders/admin', { params: {} })
    })

    it('should pass status, userId, and date filters', async () => {
      apiClient.get.mockResolvedValue({ orders: [] })

      await getAllOrders({ status: 'pending', userId: 'user-1', date: '2024-12-20' })

      expect(apiClient.get).toHaveBeenCalledWith('/orders/admin', {
        params: { status: 'pending', userId: 'user-1', date: '2024-12-20' }
      })
    })
  })

  describe('getOrderById', () => {
    it('should fetch order by id', async () => {
      apiClient.get.mockResolvedValue({ order: { id: 'order-1', items: [] } })

      const result = await getOrderById('order-1')

      expect(apiClient.get).toHaveBeenCalledWith('/orders/order-1')
      expect(result.success).toBe(true)
    })
  })

  describe('createOrder', () => {
    it('should create order with data', async () => {
      const orderData = { items: [{ menuItemId: '1', quantity: 2 }], type: 'pickup' }
      apiClient.post.mockResolvedValue({ order: { id: 'order-1', ...orderData } })

      const result = await createOrder(orderData)

      expect(apiClient.post).toHaveBeenCalledWith('/orders', orderData)
      expect(result.success).toBe(true)
    })
  })

  describe('updateOrderStatus', () => {
    it('should update order status', async () => {
      apiClient.patch.mockResolvedValue({ order: { id: 'order-1', status: 'confirmed' } })

      const result = await updateOrderStatus('order-1', 'confirmed')

      expect(apiClient.patch).toHaveBeenCalledWith('/orders/order-1/status', { status: 'confirmed' })
      expect(result.success).toBe(true)
    })
  })

  describe('deleteOrder', () => {
    it('should delete order', async () => {
      apiClient.delete.mockResolvedValue({})

      const result = await deleteOrder('order-1')

      expect(apiClient.delete).toHaveBeenCalledWith('/orders/order-1/delete')
      expect(result.success).toBe(true)
    })
  })

  describe('getOrdersByUserId', () => {
    it('should fetch orders for specific user', async () => {
      apiClient.get.mockResolvedValue({ orders: [{ id: 'order-1' }] })

      const result = await getOrdersByUserId('user-1')

      expect(apiClient.get).toHaveBeenCalledWith('/admin/users/user-1/orders')
      expect(result.success).toBe(true)
      expect(result.orders).toEqual([{ id: 'order-1' }])
    })

    it('should handle response.data.orders structure', async () => {
      apiClient.get.mockResolvedValue({ data: { orders: [{ id: 'order-1' }] } })

      const result = await getOrdersByUserId('user-1')

      expect(result.orders).toEqual([{ id: 'order-1' }])
    })

    it('should return empty array on error', async () => {
      apiClient.get.mockRejectedValue({ error: 'User not found' })

      const result = await getOrdersByUserId('invalid-user')

      expect(result.success).toBe(false)
      expect(result.orders).toEqual([])
    })
  })

  describe('getRecentOrders', () => {
    it('should fetch recent orders with default params', async () => {
      apiClient.get.mockResolvedValue({ orders: [], pagination: {} })

      await getRecentOrders()

      expect(apiClient.get).toHaveBeenCalledWith('/orders/admin/recent', {
        params: { limit: 50, page: 1 }
      })
    })

    it('should pass custom params including status', async () => {
      apiClient.get.mockResolvedValue({ orders: [] })

      await getRecentOrders({ limit: 20, page: 2, status: 'pending' })

      expect(apiClient.get).toHaveBeenCalledWith('/orders/admin/recent', {
        params: { limit: 20, page: 2, status: 'pending' }
      })
    })
  })

  describe('getHistoricalOrders', () => {
    it('should require startDate and endDate', async () => {
      const result = await getHistoricalOrders({})

      expect(result.success).toBe(false)
      expect(result.error).toBe('Start date and end date are required')
      expect(apiClient.get).not.toHaveBeenCalled()
    })

    it('should fetch historical orders with date range', async () => {
      apiClient.get.mockResolvedValue({ orders: [] })

      await getHistoricalOrders({
        startDate: '2024-01-01',
        endDate: '2024-06-30',
        status: 'delivered',
        search: 'pizza'
      })

      expect(apiClient.get).toHaveBeenCalledWith('/orders/admin/history', {
        params: {
          startDate: '2024-01-01',
          endDate: '2024-06-30',
          limit: 20,
          page: 1,
          status: 'delivered',
          search: 'pizza'
        }
      })
    })
  })
})
