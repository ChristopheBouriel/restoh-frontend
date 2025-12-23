import { beforeEach, describe, it, expect, vi } from 'vitest'
import { act } from '@testing-library/react'

// Mock the API module
vi.mock('../../api/menuApi', () => ({
  getMenuItems: vi.fn(),
  createMenuItem: vi.fn(),
  updateMenuItem: vi.fn(),
  deleteMenuItem: vi.fn(),
  getPopularItems: vi.fn(),
  getSuggestedItems: vi.fn(),
  togglePopularOverride: vi.fn(),
  resetAllPopularOverrides: vi.fn(),
  toggleSuggested: vi.fn()
}))

// Mock MenuService
vi.mock('../../services/menu', () => ({
  MenuService: {
    normalizeItems: vi.fn((items) => items),
    extractCategories: vi.fn((items) => [...new Set(items.map(i => i.category).filter(Boolean))]),
    getAvailable: vi.fn((items) => items.filter(i => i.isAvailable)),
    getPopular: vi.fn((items) => items.filter(i => i.isAvailable && i.isPopular)),
    getByCategory: vi.fn((items, cat) => items.filter(i => i.isAvailable && i.category === cat)),
    getById: vi.fn((items, id) => items.find(i => i.id === id))
  }
}))

// Import after mocks are set up
import useMenuStore from '../../store/menuStore'
import * as menuApi from '../../api/menuApi'
import { MenuService } from '../../services/menu'

describe('menuStore', () => {
  // Reset store and mocks before each test
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset store to initial state
    useMenuStore.setState({
      items: [],
      categories: [],
      popularItems: [],
      suggestedItems: [],
      isLoading: false,
      isLoadingPopular: false,
      isLoadingSuggested: false,
      error: null
    })
  })

  describe('fetchMenuItems', () => {
    const mockItems = [
      { id: '1', name: 'Pizza', category: 'main', isAvailable: true },
      { id: '2', name: 'Salad', category: 'appetizer', isAvailable: true }
    ]

    it('should fetch menu items successfully', async () => {
      menuApi.getMenuItems.mockResolvedValueOnce({ success: true, data: mockItems })
      MenuService.normalizeItems.mockReturnValueOnce(mockItems)
      MenuService.extractCategories.mockReturnValueOnce(['main', 'appetizer'])

      const { fetchMenuItems } = useMenuStore.getState()
      const result = await fetchMenuItems()

      expect(menuApi.getMenuItems).toHaveBeenCalledTimes(1)
      expect(MenuService.normalizeItems).toHaveBeenCalledWith(mockItems)
      expect(result).toEqual({ success: true })

      const state = useMenuStore.getState()
      expect(state.items).toEqual(mockItems)
      expect(state.categories).toHaveLength(2)
    })

    it('should handle API error', async () => {
      menuApi.getMenuItems.mockResolvedValueOnce({ success: false, error: 'API Error' })

      const { fetchMenuItems } = useMenuStore.getState()
      const result = await fetchMenuItems()

      expect(result).toEqual({ success: false, error: 'API Error' })
      expect(useMenuStore.getState().error).toBe('API Error')
    })

    it('should handle exception', async () => {
      menuApi.getMenuItems.mockRejectedValueOnce({ error: 'Network error' })

      const { fetchMenuItems } = useMenuStore.getState()
      const result = await fetchMenuItems()

      expect(result).toEqual({ success: false, error: 'Network error' })
      expect(useMenuStore.getState().error).toBe('Network error')
    })
  })

  describe('Getters', () => {
    const mockItems = [
      { id: '1', name: 'Pizza', category: 'main', isAvailable: true, isPopular: true },
      { id: '2', name: 'Salad', category: 'appetizer', isAvailable: true, isPopular: false },
      { id: '3', name: 'Burger', category: 'main', isAvailable: false, isPopular: true }
    ]

    beforeEach(() => {
      useMenuStore.setState({ items: mockItems })
    })

    it('should get available items via MenuService', () => {
      MenuService.getAvailable.mockReturnValueOnce([mockItems[0], mockItems[1]])

      const { getAvailableItems } = useMenuStore.getState()
      const result = getAvailableItems()

      expect(MenuService.getAvailable).toHaveBeenCalledWith(mockItems)
      expect(result).toHaveLength(2)
    })

    it('should get popular items via MenuService', () => {
      MenuService.getPopular.mockReturnValueOnce([mockItems[0]])

      const { getPopularItems } = useMenuStore.getState()
      const result = getPopularItems()

      expect(MenuService.getPopular).toHaveBeenCalledWith(mockItems)
      expect(result).toHaveLength(1)
    })

    it('should get items by category via MenuService', () => {
      MenuService.getByCategory.mockReturnValueOnce([mockItems[0]])

      const { getItemsByCategory } = useMenuStore.getState()
      const result = getItemsByCategory('main')

      expect(MenuService.getByCategory).toHaveBeenCalledWith(mockItems, 'main')
      expect(result).toHaveLength(1)
    })

    it('should get item by ID via MenuService', () => {
      MenuService.getById.mockReturnValueOnce(mockItems[0])

      const { getItemById } = useMenuStore.getState()
      const result = getItemById('1')

      expect(MenuService.getById).toHaveBeenCalledWith(mockItems, '1')
      expect(result).toEqual(mockItems[0])
    })
  })

  describe('CRUD Operations', () => {
    describe('createItem', () => {
      it('should create item and refresh menu', async () => {
        const newItem = { id: '1', name: 'New Pizza', category: 'main' }
        menuApi.createMenuItem.mockResolvedValueOnce({ success: true, data: newItem })
        menuApi.getMenuItems.mockResolvedValueOnce({ success: true, data: [newItem] })

        const { createItem } = useMenuStore.getState()
        const result = await createItem({ name: 'New Pizza', category: 'main' })

        expect(menuApi.createMenuItem).toHaveBeenCalledWith({ name: 'New Pizza', category: 'main' })
        expect(menuApi.getMenuItems).toHaveBeenCalled() // Refresh
        expect(result).toEqual({ success: true, item: newItem })
      })

      it('should handle create error', async () => {
        menuApi.createMenuItem.mockResolvedValueOnce({ success: false, error: 'Create failed' })

        const { createItem } = useMenuStore.getState()
        const result = await createItem({ name: 'Test' })

        expect(result).toEqual({ success: false, error: 'Create failed' })
        expect(useMenuStore.getState().error).toBe('Create failed')
      })
    })

    describe('updateItem', () => {
      it('should update item and refresh menu', async () => {
        const updatedItem = { id: '1', name: 'Updated Pizza' }
        menuApi.updateMenuItem.mockResolvedValueOnce({ success: true, data: updatedItem })
        menuApi.getMenuItems.mockResolvedValueOnce({ success: true, data: [updatedItem] })

        const { updateItem } = useMenuStore.getState()
        const result = await updateItem('1', { name: 'Updated Pizza' })

        expect(menuApi.updateMenuItem).toHaveBeenCalledWith('1', { name: 'Updated Pizza' })
        expect(result).toEqual({ success: true, item: updatedItem })
      })

      it('should handle update error', async () => {
        menuApi.updateMenuItem.mockResolvedValueOnce({ success: false, error: 'Update failed' })

        const { updateItem } = useMenuStore.getState()
        const result = await updateItem('1', { name: 'Test' })

        expect(result).toEqual({ success: false, error: 'Update failed' })
      })
    })

    describe('deleteItem', () => {
      it('should delete item and refresh menu', async () => {
        menuApi.deleteMenuItem.mockResolvedValueOnce({ success: true })
        menuApi.getMenuItems.mockResolvedValueOnce({ success: true, data: [] })

        const { deleteItem } = useMenuStore.getState()
        const result = await deleteItem('1')

        expect(menuApi.deleteMenuItem).toHaveBeenCalledWith('1')
        expect(menuApi.getMenuItems).toHaveBeenCalled()
        expect(result).toEqual({ success: true })
      })

      it('should handle delete error', async () => {
        menuApi.deleteMenuItem.mockResolvedValueOnce({ success: false, error: 'Delete failed' })

        const { deleteItem } = useMenuStore.getState()
        const result = await deleteItem('1')

        expect(result).toEqual({ success: false, error: 'Delete failed' })
      })
    })

    describe('toggleAvailability', () => {
      it('should toggle availability for existing item', async () => {
        const mockItem = { id: '1', name: 'Pizza', isAvailable: true }
        useMenuStore.setState({ items: [mockItem] })
        MenuService.getById.mockReturnValueOnce(mockItem)
        menuApi.updateMenuItem.mockResolvedValueOnce({ success: true, data: { ...mockItem, isAvailable: false } })
        menuApi.getMenuItems.mockResolvedValueOnce({ success: true, data: [] })

        const { toggleAvailability } = useMenuStore.getState()
        const result = await toggleAvailability('1')

        expect(menuApi.updateMenuItem).toHaveBeenCalledWith('1', { isAvailable: false })
        expect(result.success).toBe(true)
      })

      it('should return error for non-existent item', async () => {
        MenuService.getById.mockReturnValueOnce(undefined)

        const { toggleAvailability } = useMenuStore.getState()
        const result = await toggleAvailability('999')

        expect(result).toEqual({ success: false, error: 'Item not found' })
        expect(menuApi.updateMenuItem).not.toHaveBeenCalled()
      })
    })
  })

  // ============================================
  // Popular Items & Suggestions Tests
  // ============================================

  describe('fetchPopularItems', () => {
    const mockPopularItems = [
      { id: '1', name: 'Popular Pizza', category: 'main' },
      { id: '2', name: 'Popular Salad', category: 'appetizer' }
    ]

    it('should fetch popular items successfully', async () => {
      menuApi.getPopularItems.mockResolvedValueOnce({ success: true, data: mockPopularItems })

      const { fetchPopularItems } = useMenuStore.getState()
      const result = await fetchPopularItems()

      expect(menuApi.getPopularItems).toHaveBeenCalledTimes(1)
      expect(result).toEqual({ success: true })
      expect(useMenuStore.getState().popularItems).toEqual(mockPopularItems)
    })

    it('should handle API error', async () => {
      menuApi.getPopularItems.mockResolvedValueOnce({ success: false, error: 'API Error' })

      const { fetchPopularItems } = useMenuStore.getState()
      const result = await fetchPopularItems()

      expect(result).toEqual({ success: false, error: 'API Error' })
    })

    it('should handle exception', async () => {
      menuApi.getPopularItems.mockRejectedValueOnce({ error: 'Network error' })

      const { fetchPopularItems } = useMenuStore.getState()
      const result = await fetchPopularItems()

      expect(result).toEqual({ success: false, error: 'Network error' })
    })
  })

  describe('fetchSuggestedItems', () => {
    const mockSuggestedItems = [
      { id: '1', name: 'Chef Special', isSuggested: true }
    ]

    it('should fetch suggested items successfully', async () => {
      menuApi.getSuggestedItems.mockResolvedValueOnce({ success: true, data: mockSuggestedItems })

      const { fetchSuggestedItems } = useMenuStore.getState()
      const result = await fetchSuggestedItems()

      expect(menuApi.getSuggestedItems).toHaveBeenCalledTimes(1)
      expect(result).toEqual({ success: true })
      expect(useMenuStore.getState().suggestedItems).toEqual(mockSuggestedItems)
    })

    it('should handle API error', async () => {
      menuApi.getSuggestedItems.mockResolvedValueOnce({ success: false, error: 'API Error' })

      const { fetchSuggestedItems } = useMenuStore.getState()
      const result = await fetchSuggestedItems()

      expect(result).toEqual({ success: false, error: 'API Error' })
    })

    it('should handle exception', async () => {
      menuApi.getSuggestedItems.mockRejectedValueOnce({ error: 'Network error' })

      const { fetchSuggestedItems } = useMenuStore.getState()
      const result = await fetchSuggestedItems()

      expect(result).toEqual({ success: false, error: 'Network error' })
    })
  })

  describe('togglePopularOverride', () => {
    it('should toggle popular override and refresh data', async () => {
      const itemId = 'item-123'
      const toggledItem = { id: itemId, isPopularOverride: true }
      const popularItems = [{ id: 'item-456', name: 'Popular Item' }]

      // Setup initial state with the item
      useMenuStore.setState({
        items: [{ id: itemId, name: 'Test Item', isPopular: false, isPopularOverride: false }]
      })

      menuApi.togglePopularOverride.mockResolvedValueOnce({
        success: true,
        data: { toggledItem, popularItems }
      })

      const { togglePopularOverride } = useMenuStore.getState()
      const result = await togglePopularOverride(itemId)

      expect(menuApi.togglePopularOverride).toHaveBeenCalledWith(itemId)
      // No longer calls getMenuItems/getPopularItems - uses response data directly
      expect(result).toEqual({ success: true, item: toggledItem })

      // Check that state was updated
      const state = useMenuStore.getState()
      expect(state.popularItems).toEqual(popularItems)
    })

    it('should handle API error', async () => {
      menuApi.togglePopularOverride.mockResolvedValueOnce({ success: false, error: 'Not found' })

      const { togglePopularOverride } = useMenuStore.getState()
      const result = await togglePopularOverride('item-123')

      expect(result).toEqual({ success: false, error: 'Not found' })
      expect(menuApi.getMenuItems).not.toHaveBeenCalled()
    })

    it('should handle exception', async () => {
      menuApi.togglePopularOverride.mockRejectedValueOnce({ error: 'Network error' })

      const { togglePopularOverride } = useMenuStore.getState()
      const result = await togglePopularOverride('item-123')

      expect(result).toEqual({ success: false, error: 'Network error' })
    })
  })

  describe('resetAllPopularOverrides', () => {
    it('should reset all overrides and refresh data', async () => {
      const popularItems = [{ id: 'item-456', name: 'Popular Item' }]
      const mockResponse = { modifiedCount: 5, popularItems }

      // Setup initial state with items
      useMenuStore.setState({
        items: [
          { id: 'item-123', name: 'Test Item', isPopular: true, isPopularOverride: true }
        ]
      })

      menuApi.resetAllPopularOverrides.mockResolvedValueOnce({ success: true, data: mockResponse })

      const { resetAllPopularOverrides } = useMenuStore.getState()
      const result = await resetAllPopularOverrides()

      expect(menuApi.resetAllPopularOverrides).toHaveBeenCalledTimes(1)
      // No longer calls getMenuItems/getPopularItems - uses response data directly
      expect(result).toEqual({ success: true, data: mockResponse })

      // Check that state was updated
      const state = useMenuStore.getState()
      expect(state.popularItems).toEqual(popularItems)
    })

    it('should handle API error', async () => {
      menuApi.resetAllPopularOverrides.mockResolvedValueOnce({ success: false, error: 'Unauthorized' })

      const { resetAllPopularOverrides } = useMenuStore.getState()
      const result = await resetAllPopularOverrides()

      expect(result).toEqual({ success: false, error: 'Unauthorized' })
    })

    it('should handle exception', async () => {
      menuApi.resetAllPopularOverrides.mockRejectedValueOnce({ error: 'Server error' })

      const { resetAllPopularOverrides } = useMenuStore.getState()
      const result = await resetAllPopularOverrides()

      expect(result).toEqual({ success: false, error: 'Server error' })
    })
  })

  describe('toggleSuggested', () => {
    it('should toggle suggested status and refresh data', async () => {
      const itemId = 'item-456'
      const mockResponse = { id: itemId, isSuggested: true }

      menuApi.toggleSuggested.mockResolvedValueOnce({ success: true, data: mockResponse })
      menuApi.getMenuItems.mockResolvedValueOnce({ success: true, data: [] })
      menuApi.getSuggestedItems.mockResolvedValueOnce({ success: true, data: [] })

      const { toggleSuggested } = useMenuStore.getState()
      const result = await toggleSuggested(itemId)

      expect(menuApi.toggleSuggested).toHaveBeenCalledWith(itemId)
      expect(menuApi.getMenuItems).toHaveBeenCalled()
      expect(menuApi.getSuggestedItems).toHaveBeenCalled()
      expect(result).toEqual({ success: true, data: mockResponse })
    })

    it('should handle API error', async () => {
      menuApi.toggleSuggested.mockResolvedValueOnce({ success: false, error: 'Item not found' })

      const { toggleSuggested } = useMenuStore.getState()
      const result = await toggleSuggested('item-456')

      expect(result).toEqual({ success: false, error: 'Item not found' })
      expect(menuApi.getMenuItems).not.toHaveBeenCalled()
    })

    it('should handle exception', async () => {
      menuApi.toggleSuggested.mockRejectedValueOnce({ error: 'Network error' })

      const { toggleSuggested } = useMenuStore.getState()
      const result = await toggleSuggested('item-456')

      expect(result).toEqual({ success: false, error: 'Network error' })
    })
  })
})
