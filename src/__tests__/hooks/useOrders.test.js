import { renderHook, act } from '@testing-library/react'
import { vi, describe, test, expect, beforeEach } from 'vitest'
import { toast } from 'react-hot-toast'
import { useOrders } from '../../hooks/useOrders'
import useOrdersStore from '../../store/ordersStore'
import { useAuth } from '../../hooks/useAuth'

// Mock dependencies
vi.mock('react-hot-toast')
vi.mock('../../store/ordersStore')
vi.mock('../../hooks/useAuth')

// Mock window.confirm
const mockConfirm = vi.fn()
Object.defineProperty(window, 'confirm', {
  value: mockConfirm,
  writable: true
})

// Mock data
const mockUser = {
  id: 'user123',
  name: 'Test User',
  email: 'test@example.com'
}

const mockOrders = [
  {
    id: '1',
    userId: 'user123',
    status: 'delivered',
    totalAmount: 25.50,
    createdAt: '2024-01-20T10:00:00Z',
    items: [{ name: 'Pizza', quantity: 1 }]
  },
  {
    id: '2',
    userId: 'user123',
    status: 'pending',
    totalAmount: 18.00,
    createdAt: '2024-01-25T14:30:00Z',
    items: [{ name: 'Pasta', quantity: 1 }]
  },
  {
    id: '3',
    userId: 'user123',
    status: 'cancelled',
    totalAmount: 32.00,
    createdAt: '2024-01-15T09:15:00Z',
    items: [{ name: 'Burger', quantity: 2 }]
  },
  {
    id: '4',
    userId: 'user123',
    status: 'preparing',
    totalAmount: 42.75,
    createdAt: '2024-01-26T16:45:00Z',
    items: [{ name: 'Salad', quantity: 1 }]
  },
  {
    id: '5',
    userId: 'user123',
    status: 'delivered',
    totalAmount: 15.25,
    createdAt: '2023-11-10T12:00:00Z', // Old order (> 30 days)
    items: [{ name: 'Soup', quantity: 1 }]
  },
  {
    id: '6',
    userId: 'otherUser',
    status: 'delivered',
    totalAmount: 28.00,
    createdAt: '2024-01-22T11:30:00Z',
    items: [{ name: 'Fish', quantity: 1 }]
  }
]

// Mock functions
const mockGetOrdersByUser = vi.fn()
const mockUpdateOrderStatus = vi.fn()
const mockGetOrdersStats = vi.fn()

describe('useOrders Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Reset date to a consistent point for testing (2024-01-30)
    vi.setSystemTime(new Date('2024-01-30T10:00:00Z'))
    
    // Default authenticated user mock
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser
    })
    
    // Default orders store mock
    vi.mocked(useOrdersStore).mockReturnValue({
      orders: mockOrders,
      getOrdersByUser: mockGetOrdersByUser,
      updateOrderStatus: mockUpdateOrderStatus,
      getOrdersStats: mockGetOrdersStats
    })
    
    // Mock getOrdersByUser to return user's orders
    mockGetOrdersByUser.mockImplementation((userId) => 
      mockOrders.filter(order => order.userId === userId)
    )
  })

  // 1. USER AUTHENTICATION AND ORDER FILTERING (3 tests)
  test('should return empty orders when user not authenticated', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null
    })
    
    const { result } = renderHook(() => useOrders())
    
    expect(result.current.orders).toEqual([])
    expect(result.current.recentOrders).toEqual([])
    expect(result.current.totalOrders).toBe(0)
    expect(result.current.totalSpent).toBe(0)
  })

  test('should filter orders by current user ID', () => {
    const { result } = renderHook(() => useOrders())
    
    expect(mockGetOrdersByUser).toHaveBeenCalledWith('user123')
    
    // Should only contain orders for user123, not otherUser
    const userOrderIds = result.current.orders.map(order => order.id)
    expect(userOrderIds).toEqual(['4', '2', '1', '3', '5']) // Sorted by date desc
    expect(userOrderIds).not.toContain('6') // otherUser's order
  })

  test('should sort user orders by creation date (newest first)', () => {
    const { result } = renderHook(() => useOrders())
    
    const orderDates = result.current.orders.map(order => order.createdAt)
    expect(orderDates).toEqual([
      '2024-01-26T16:45:00Z', // Most recent
      '2024-01-25T14:30:00Z',
      '2024-01-20T10:00:00Z',
      '2024-01-15T09:15:00Z',
      '2023-11-10T12:00:00Z'  // Oldest
    ])
  })

  // 2. ORDER CANCELLATION WORKFLOW (3 tests)
  test('should prevent order cancellation when user not authenticated', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null
    })
    
    mockConfirm.mockReturnValue(true) // User confirms, but should still fail
    
    const { result } = renderHook(() => useOrders())
    
    // The cancelOrder function should show confirmation but then fail due to no user
    const cancelResult = result.current.cancelOrder('1')
    expect(cancelResult).toBe(true) // Confirmation happened
    
    // Wait a bit for the async operation to complete
    await new Promise(resolve => setTimeout(resolve, 10))
    
    expect(toast.error).toHaveBeenCalledWith('Vous devez être connecté pour annuler une commande')
    expect(mockUpdateOrderStatus).not.toHaveBeenCalled()
  })

  test('should cancel order successfully with confirmation', async () => {
    mockConfirm.mockReturnValue(true) // User confirms
    mockUpdateOrderStatus.mockResolvedValue({ success: true })
    
    const { result } = renderHook(() => useOrders())
    
    const cancelResult = await act(async () => {
      return result.current.cancelOrder('2')
    })
    
    expect(mockConfirm).toHaveBeenCalledWith('Êtes-vous sûr de vouloir annuler cette commande ?')
    expect(mockUpdateOrderStatus).toHaveBeenCalledWith('2', 'cancelled')
    expect(toast.success).toHaveBeenCalledWith('Commande annulée')
    expect(cancelResult).toBe(true)
  })

  test('should handle cancellation errors gracefully', async () => {
    mockConfirm.mockReturnValue(true)
    mockUpdateOrderStatus.mockResolvedValue({ success: false, error: 'Update failed' })
    
    const { result } = renderHook(() => useOrders())
    
    // The function handles errors internally, we test the toast notification
    result.current.cancelOrder('2')
    
    // Wait for the async operation to complete
    await new Promise(resolve => setTimeout(resolve, 10))
    
    expect(toast.error).toHaveBeenCalledWith('Erreur lors de l\'annulation de la commande')
  })

  test('should not cancel order when user rejects confirmation', () => {
    mockConfirm.mockReturnValue(false) // User cancels confirmation
    
    const { result } = renderHook(() => useOrders())
    
    const cancelResult = result.current.cancelOrder('2')
    
    expect(mockConfirm).toHaveBeenCalledWith('Êtes-vous sûr de vouloir annuler cette commande ?')
    expect(mockUpdateOrderStatus).not.toHaveBeenCalled()
    expect(cancelResult).toBe(false)
  })

  // 3. FORMATTING UTILITIES (2 tests)
  test('should format prices correctly with French locale', () => {
    const { result } = renderHook(() => useOrders())
    
    expect(result.current.formatPrice(25.50)).toMatch(/25,50\s?€/)
    expect(result.current.formatPrice(0)).toMatch(/0,00\s?€/)
    expect(result.current.formatPrice(999.99)).toMatch(/999,99\s?€/)
  })

  test('should format dates correctly with French locale', () => {
    const { result } = renderHook(() => useOrders())
    
    const testDate = '2024-01-20T10:30:00Z'
    
    // Test date formatting (DD/MM/YYYY)
    const formattedDate = result.current.formatDate(testDate)
    expect(formattedDate).toMatch(/20\/01\/2024/)
    
    // Test datetime formatting (includes time) - timezone may affect the time
    const formattedDateTime = result.current.formatDateTime(testDate)
    expect(formattedDateTime).toMatch(/20\/01\/2024/)
  })

  // 4. BUSINESS LOGIC AND VALIDATION (2 tests)
  test('should determine order cancellation eligibility correctly', () => {
    const { result } = renderHook(() => useOrders())
    
    // Cancelable statuses
    expect(result.current.canCancelOrder({ status: 'pending' })).toBe(true)
    expect(result.current.canCancelOrder({ status: 'confirmed' })).toBe(true)
    expect(result.current.canCancelOrder({ status: 'preparing' })).toBe(true)
    
    // Non-cancelable statuses
    expect(result.current.canCancelOrder({ status: 'ready' })).toBe(false)
    expect(result.current.canCancelOrder({ status: 'delivered' })).toBe(false)
    expect(result.current.canCancelOrder({ status: 'cancelled' })).toBe(false)
  })

  test('should filter recent orders within 30 days', () => {
    const { result } = renderHook(() => useOrders())
    
    const recentOrders = result.current.recentOrders
    
    // Should include orders from 2024-01 (within 30 days of 2024-01-30)
    const recentIds = recentOrders.map(order => order.id)
    expect(recentIds).toContain('1') // 2024-01-20
    expect(recentIds).toContain('2') // 2024-01-25
    expect(recentIds).toContain('3') // 2024-01-15
    expect(recentIds).toContain('4') // 2024-01-26
    
    // Should not include old order from 2023-11
    expect(recentIds).not.toContain('5') // 2023-11-10
    
    // Should be sorted newest first
    expect(recentOrders[0].id).toBe('4') // 2024-01-26 (newest)
  })

  // 5. STATISTICS CALCULATIONS (2 tests)
  test('should calculate order statistics correctly', () => {
    const { result } = renderHook(() => useOrders())
    
    expect(result.current.totalOrders).toBe(5) // All user orders
    expect(result.current.deliveredOrders).toBe(2) // Orders 1 and 5
    expect(result.current.pendingOrders).toBe(1) // Order 2
    expect(result.current.cancelledOrders).toBe(1) // Order 3
    
    // Total spent should be sum of delivered orders only
    expect(result.current.totalSpent).toBe(40.75) // 25.50 + 15.25
  })

  test('should handle empty order scenarios', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'emptyUser', name: 'Empty User' }
    })
    
    mockGetOrdersByUser.mockReturnValue([]) // No orders
    
    const { result } = renderHook(() => useOrders())
    
    expect(result.current.orders).toEqual([])
    expect(result.current.recentOrders).toEqual([])
    expect(result.current.totalOrders).toBe(0)
    expect(result.current.deliveredOrders).toBe(0)
    expect(result.current.pendingOrders).toBe(0)
    expect(result.current.cancelledOrders).toBe(0)
    expect(result.current.totalSpent).toBe(0)
  })

  // Additional edge case test
  test('should handle network error during order cancellation', async () => {
    mockConfirm.mockReturnValue(true)
    mockUpdateOrderStatus.mockRejectedValue(new Error('Network error'))
    
    const { result } = renderHook(() => useOrders())
    
    // Handle the error internally
    result.current.cancelOrder('2')
    
    // Wait for the async operation to complete
    await new Promise(resolve => setTimeout(resolve, 10))
    
    expect(toast.error).toHaveBeenCalledWith('Erreur lors de l\'annulation de la commande')
  })
})