import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as menuApi from '../../api/menuApi'
import apiClient from '../../api/apiClient'

// Mock apiClient
vi.mock('../../api/apiClient', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn()
  }
}))

describe('Menu API - Popular Items & Suggestions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================
  // Public Routes
  // ============================================

  describe('getPopularItems', () => {
    it('should fetch popular items successfully', async () => {
      const mockItems = [
        { id: '1', name: 'Pizza', category: 'main' },
        { id: '2', name: 'Salad', category: 'appetizer' }
      ]
      apiClient.get.mockResolvedValueOnce({ data: mockItems })

      const result = await menuApi.getPopularItems()

      expect(apiClient.get).toHaveBeenCalledWith('/menu/popular')
      expect(result).toEqual({
        success: true,
        data: mockItems
      })
    })

    it('should return empty array when response.data is undefined', async () => {
      apiClient.get.mockResolvedValueOnce({})

      const result = await menuApi.getPopularItems()

      expect(result).toEqual({
        success: true,
        data: []
      })
    })

    it('should handle error with custom message', async () => {
      apiClient.get.mockRejectedValueOnce({ error: 'Server unavailable' })

      const result = await menuApi.getPopularItems()

      expect(result).toEqual({
        success: false,
        error: 'Server unavailable'
      })
    })

    it('should handle generic error', async () => {
      apiClient.get.mockRejectedValueOnce({})

      const result = await menuApi.getPopularItems()

      expect(result).toEqual({
        success: false,
        error: 'Error fetching popular items'
      })
    })
  })

  describe('getSuggestedItems', () => {
    it('should fetch suggested items successfully', async () => {
      const mockItems = [
        { id: '1', name: 'Chef Special', isSuggested: true }
      ]
      apiClient.get.mockResolvedValueOnce({ data: mockItems })

      const result = await menuApi.getSuggestedItems()

      expect(apiClient.get).toHaveBeenCalledWith('/menu/suggestions')
      expect(result).toEqual({
        success: true,
        data: mockItems
      })
    })

    it('should return empty array when response.data is undefined', async () => {
      apiClient.get.mockResolvedValueOnce({})

      const result = await menuApi.getSuggestedItems()

      expect(result).toEqual({
        success: true,
        data: []
      })
    })

    it('should handle error', async () => {
      apiClient.get.mockRejectedValueOnce({ error: 'Not found' })

      const result = await menuApi.getSuggestedItems()

      expect(result).toEqual({
        success: false,
        error: 'Not found'
      })
    })

    it('should handle generic error', async () => {
      apiClient.get.mockRejectedValueOnce({})

      const result = await menuApi.getSuggestedItems()

      expect(result).toEqual({
        success: false,
        error: 'Error fetching suggestions'
      })
    })
  })

  // ============================================
  // Admin Routes
  // ============================================

  describe('togglePopularOverride', () => {
    const itemId = 'item-123'

    it('should toggle popular override successfully', async () => {
      const mockResponse = {
        data: { id: itemId, isPopularOverride: true }
      }
      apiClient.patch.mockResolvedValueOnce(mockResponse)

      const result = await menuApi.togglePopularOverride(itemId)

      expect(apiClient.patch).toHaveBeenCalledWith(`/admin/menu/${itemId}/popular`)
      expect(result).toEqual({
        success: true,
        data: mockResponse.data
      })
    })

    it('should handle error with custom message', async () => {
      apiClient.patch.mockRejectedValueOnce({ error: 'Item not found' })

      const result = await menuApi.togglePopularOverride(itemId)

      expect(result).toEqual({
        success: false,
        error: 'Item not found'
      })
    })

    it('should handle generic error', async () => {
      apiClient.patch.mockRejectedValueOnce({})

      const result = await menuApi.togglePopularOverride(itemId)

      expect(result).toEqual({
        success: false,
        error: 'Error toggling popular override'
      })
    })
  })

  describe('resetAllPopularOverrides', () => {
    it('should reset all popular overrides successfully', async () => {
      const mockResponse = {
        data: { modifiedCount: 5 }
      }
      apiClient.patch.mockResolvedValueOnce(mockResponse)

      const result = await menuApi.resetAllPopularOverrides()

      expect(apiClient.patch).toHaveBeenCalledWith('/admin/menu/popular/reset')
      expect(result).toEqual({
        success: true,
        data: mockResponse.data
      })
    })

    it('should handle error', async () => {
      apiClient.patch.mockRejectedValueOnce({ error: 'Unauthorized' })

      const result = await menuApi.resetAllPopularOverrides()

      expect(result).toEqual({
        success: false,
        error: 'Unauthorized'
      })
    })

    it('should handle generic error', async () => {
      apiClient.patch.mockRejectedValueOnce({})

      const result = await menuApi.resetAllPopularOverrides()

      expect(result).toEqual({
        success: false,
        error: 'Error resetting popular overrides'
      })
    })
  })

  describe('toggleSuggested', () => {
    const itemId = 'item-456'

    it('should toggle suggested status successfully', async () => {
      const mockResponse = {
        data: { id: itemId, isSuggested: true }
      }
      apiClient.patch.mockResolvedValueOnce(mockResponse)

      const result = await menuApi.toggleSuggested(itemId)

      expect(apiClient.patch).toHaveBeenCalledWith(`/admin/menu/${itemId}/suggested`)
      expect(result).toEqual({
        success: true,
        data: mockResponse.data
      })
    })

    it('should handle error with custom message', async () => {
      apiClient.patch.mockRejectedValueOnce({ error: 'Item not found' })

      const result = await menuApi.toggleSuggested(itemId)

      expect(result).toEqual({
        success: false,
        error: 'Item not found'
      })
    })

    it('should handle generic error', async () => {
      apiClient.patch.mockRejectedValueOnce({})

      const result = await menuApi.toggleSuggested(itemId)

      expect(result).toEqual({
        success: false,
        error: 'Error toggling suggested'
      })
    })
  })

  describe('getAdminSuggestedItems', () => {
    it('should fetch admin suggested items successfully', async () => {
      const mockItems = [
        { id: '1', name: 'Special Dish', isSuggested: true, isAvailable: false }
      ]
      apiClient.get.mockResolvedValueOnce({ data: mockItems })

      const result = await menuApi.getAdminSuggestedItems()

      expect(apiClient.get).toHaveBeenCalledWith('/admin/menu/suggested')
      expect(result).toEqual({
        success: true,
        data: mockItems
      })
    })

    it('should return empty array when response.data is undefined', async () => {
      apiClient.get.mockResolvedValueOnce({})

      const result = await menuApi.getAdminSuggestedItems()

      expect(result).toEqual({
        success: true,
        data: []
      })
    })

    it('should handle error', async () => {
      apiClient.get.mockRejectedValueOnce({ error: 'Forbidden' })

      const result = await menuApi.getAdminSuggestedItems()

      expect(result).toEqual({
        success: false,
        error: 'Forbidden'
      })
    })

    it('should handle generic error', async () => {
      apiClient.get.mockRejectedValueOnce({})

      const result = await menuApi.getAdminSuggestedItems()

      expect(result).toEqual({
        success: false,
        error: 'Error fetching admin suggested items'
      })
    })
  })
})
