import { renderHook, act, waitFor } from '@testing-library/react'
import { beforeEach, describe, it, expect, vi } from 'vitest'
import { useMenu } from '../../hooks/useMenu'
import useMenuStore from '../../store/menuStore'
import * as menuApi from '../../api/menuApi'

// Mock the API (not the store!)
vi.mock('../../api/menuApi')

// Mock data
const mockMenuItems = [
  { id: '1', name: 'Pizza Margherita', price: 12.50, category: 'pizza', isAvailable: true },
  { id: '2', name: 'Spaghetti Carbonara', price: 14.00, category: 'pasta', isAvailable: true },
  { id: '3', name: 'Tiramisu', price: 8.00, category: 'dessert', isAvailable: false },
  { id: '4', name: 'Pizza Pepperoni', price: 14.50, category: 'pizza', isAvailable: true, isPopular: true },
  { id: '5', name: 'Risotto', price: 16.00, category: 'pasta', isAvailable: true, isSuggested: true }
]

const mockCategories = ['pizza', 'pasta', 'dessert']

const mockPopularItems = [
  { id: '4', name: 'Pizza Pepperoni', price: 14.50, category: 'pizza', isAvailable: true, isPopular: true }
]

const mockSuggestedItems = [
  { id: '5', name: 'Risotto', price: 16.00, category: 'pasta', isAvailable: true, isSuggested: true }
]

describe('useMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Reset store state
    act(() => {
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

    // Default API mocks
    menuApi.getMenuItems.mockResolvedValue({
      success: true,
      data: mockMenuItems
    })
    menuApi.getPopularItems.mockResolvedValue({
      success: true,
      data: mockPopularItems
    })
    menuApi.getSuggestedItems.mockResolvedValue({
      success: true,
      data: mockSuggestedItems
    })
  })

  describe('Initialization and State', () => {
    it('should fetch menu automatically when items array is empty', async () => {
      renderHook(() => useMenu())

      await waitFor(() => {
        expect(menuApi.getMenuItems).toHaveBeenCalled()
      })
    })

    it('should not fetch menu when items already exist', async () => {
      // Pre-populate store with items
      act(() => {
        useMenuStore.setState({
          items: mockMenuItems,
          categories: mockCategories
        })
      })

      renderHook(() => useMenu())

      // Should not call fetch API when items already exist
      expect(menuApi.getMenuItems).not.toHaveBeenCalled()
    })

    it('should return correct state from store', async () => {
      // Pre-populate store
      act(() => {
        useMenuStore.setState({
          items: mockMenuItems,
          categories: mockCategories,
          popularItems: mockPopularItems,
          suggestedItems: mockSuggestedItems,
          isLoading: false
        })
      })

      const { result } = renderHook(() => useMenu())

      expect(result.current.items).toEqual(mockMenuItems)
      expect(result.current.categories).toEqual(mockCategories)
      expect(result.current.popularItems).toEqual(mockPopularItems)
      expect(result.current.suggestedItems).toEqual(mockSuggestedItems)
      expect(result.current.isLoading).toBe(false)
    })

    it('should return available items only via getPublicMenu', () => {
      act(() => {
        useMenuStore.setState({
          items: mockMenuItems,
          categories: mockCategories
        })
      })

      const { result } = renderHook(() => useMenu())

      const publicMenu = result.current.getPublicMenu()

      // Should only include available items
      expect(publicMenu.every(item => item.isAvailable !== false)).toBe(true)
      expect(publicMenu.find(item => item.id === '3')).toBeUndefined() // Tiramisu is unavailable
    })
  })

  describe('Public Methods', () => {
    beforeEach(() => {
      act(() => {
        useMenuStore.setState({
          items: mockMenuItems,
          categories: mockCategories,
          suggestedItems: mockSuggestedItems
        })
      })
    })

    it('should get items by category through getPublicItemsByCategory', () => {
      const { result } = renderHook(() => useMenu())

      const pizzaItems = result.current.getPublicItemsByCategory('pizza')

      expect(pizzaItems.length).toBeGreaterThan(0)
      expect(pizzaItems.every(item => item.category === 'pizza')).toBe(true)
    })

    it('should get suggested items', () => {
      const { result } = renderHook(() => useMenu())

      const suggested = result.current.getSuggestedItems()

      expect(suggested).toEqual(mockSuggestedItems)
    })

    it('should get item by id', () => {
      const { result } = renderHook(() => useMenu())

      const item = result.current.getItemById('1')

      expect(item).toBeDefined()
      expect(item.name).toBe('Pizza Margherita')
    })
  })

  describe('Admin CRUD Actions', () => {
    beforeEach(() => {
      act(() => {
        useMenuStore.setState({
          items: mockMenuItems,
          categories: mockCategories
        })
      })
    })

    it('should add item successfully', async () => {
      const newItem = { id: '6', name: 'New Pizza', price: 12.99, category: 'pizza' }

      menuApi.createMenuItem.mockResolvedValue({
        success: true,
        data: newItem
      })

      const { result } = renderHook(() => useMenu())

      let response
      await act(async () => {
        response = await result.current.addItem({ name: 'New Pizza', price: 12.99, category: 'pizza' })
      })

      expect(menuApi.createMenuItem).toHaveBeenCalledWith({ name: 'New Pizza', price: 12.99, category: 'pizza' })
      expect(response.success).toBe(true)
    })

    it('should update item successfully', async () => {
      menuApi.updateMenuItem.mockResolvedValue({
        success: true,
        data: { ...mockMenuItems[0], name: 'Updated Pizza' }
      })

      const { result } = renderHook(() => useMenu())

      let response
      await act(async () => {
        response = await result.current.updateItem('1', { name: 'Updated Pizza' })
      })

      expect(menuApi.updateMenuItem).toHaveBeenCalledWith('1', { name: 'Updated Pizza' })
      expect(response.success).toBe(true)
    })

    it('should delete item successfully', async () => {
      menuApi.deleteMenuItem.mockResolvedValue({
        success: true
      })

      const { result } = renderHook(() => useMenu())

      let response
      await act(async () => {
        response = await result.current.deleteItem('1')
      })

      expect(menuApi.deleteMenuItem).toHaveBeenCalledWith('1')
      expect(response.success).toBe(true)
    })

    it('should toggle availability successfully', async () => {
      // toggleAvailability internally calls updateItem with toggled isAvailable
      menuApi.updateMenuItem.mockResolvedValue({
        success: true,
        data: { ...mockMenuItems[0], isAvailable: false }
      })

      const { result } = renderHook(() => useMenu())

      let response
      await act(async () => {
        response = await result.current.toggleAvailability('1')
      })

      // toggleAvailability uses updateMenuItem under the hood
      expect(menuApi.updateMenuItem).toHaveBeenCalledWith('1', { isAvailable: false })
      expect(response.success).toBe(true)
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      act(() => {
        useMenuStore.setState({
          items: mockMenuItems,
          categories: mockCategories
        })
      })
    })

    it('should handle addItem error gracefully', async () => {
      menuApi.createMenuItem.mockResolvedValue({
        success: false,
        error: 'Invalid item data'
      })

      const { result } = renderHook(() => useMenu())

      let response
      await act(async () => {
        response = await result.current.addItem({ name: 'Bad Item' })
      })

      expect(response.success).toBe(false)
      expect(response.error).toBe('Invalid item data')
    })

    it('should handle updateItem error gracefully', async () => {
      menuApi.updateMenuItem.mockResolvedValue({
        success: false,
        error: 'Item not found'
      })

      const { result } = renderHook(() => useMenu())

      let response
      await act(async () => {
        response = await result.current.updateItem('nonexistent', { name: 'Test' })
      })

      expect(response.success).toBe(false)
      expect(response.error).toBe('Item not found')
    })

    it('should handle deleteItem error gracefully', async () => {
      menuApi.deleteMenuItem.mockResolvedValue({
        success: false,
        error: 'Cannot delete item'
      })

      const { result } = renderHook(() => useMenu())

      let response
      await act(async () => {
        response = await result.current.deleteItem('1')
      })

      expect(response.success).toBe(false)
      expect(response.error).toBe('Cannot delete item')
    })

    it('should handle toggleAvailability error gracefully', async () => {
      // toggleAvailability uses updateMenuItem
      menuApi.updateMenuItem.mockResolvedValue({
        success: false,
        error: 'Toggle failed'
      })

      const { result } = renderHook(() => useMenu())

      let response
      await act(async () => {
        response = await result.current.toggleAvailability('1')
      })

      expect(response.success).toBe(false)
      expect(response.error).toBe('Toggle failed')
    })
  })

  describe('Store Utilities', () => {
    it('should expose setLoading function', () => {
      act(() => {
        useMenuStore.setState({ items: mockMenuItems })
      })

      const { result } = renderHook(() => useMenu())

      expect(typeof result.current.setLoading).toBe('function')

      act(() => {
        result.current.setLoading(true)
      })

      expect(useMenuStore.getState().isLoading).toBe(true)
    })

    it('should expose fetchMenuItems function', async () => {
      act(() => {
        useMenuStore.setState({ items: mockMenuItems })
      })

      const { result } = renderHook(() => useMenu())

      expect(typeof result.current.fetchMenuItems).toBe('function')

      await act(async () => {
        await result.current.fetchMenuItems()
      })

      expect(menuApi.getMenuItems).toHaveBeenCalled()
    })
  })

  describe('Popular Items & Suggestions', () => {
    it('should return popular items from store', () => {
      act(() => {
        useMenuStore.setState({
          items: mockMenuItems,
          popularItems: mockPopularItems
        })
      })

      const { result } = renderHook(() => useMenu())

      expect(result.current.popularItems).toEqual(mockPopularItems)
    })

    it('should return suggested items from store', () => {
      act(() => {
        useMenuStore.setState({
          items: mockMenuItems,
          suggestedItems: mockSuggestedItems
        })
      })

      const { result } = renderHook(() => useMenu())

      expect(result.current.suggestedItems).toEqual(mockSuggestedItems)
    })

    it('should expose loading states for popular and suggested', () => {
      act(() => {
        useMenuStore.setState({
          items: mockMenuItems,
          isLoadingPopular: true,
          isLoadingSuggested: true
        })
      })

      const { result } = renderHook(() => useMenu())

      expect(result.current.isLoadingPopular).toBe(true)
      expect(result.current.isLoadingSuggested).toBe(true)
    })

    it('should expose fetchPopularItems function', async () => {
      act(() => {
        useMenuStore.setState({ items: mockMenuItems })
      })

      const { result } = renderHook(() => useMenu())

      await act(async () => {
        await result.current.fetchPopularItems()
      })

      expect(menuApi.getPopularItems).toHaveBeenCalled()
    })

    it('should expose fetchSuggestedItems function', async () => {
      act(() => {
        useMenuStore.setState({ items: mockMenuItems })
      })

      const { result } = renderHook(() => useMenu())

      await act(async () => {
        await result.current.fetchSuggestedItems()
      })

      expect(menuApi.getSuggestedItems).toHaveBeenCalled()
    })
  })

  describe('Admin Actions - Popular Override & Suggestions', () => {
    beforeEach(() => {
      act(() => {
        useMenuStore.setState({
          items: mockMenuItems,
          categories: mockCategories
        })
      })
    })

    it('should toggle popular override successfully', async () => {
      menuApi.togglePopularOverride.mockResolvedValue({
        success: true,
        data: { id: '1', isPopularOverride: true }
      })

      const { result } = renderHook(() => useMenu())

      let response
      await act(async () => {
        response = await result.current.togglePopularOverride('1')
      })

      expect(menuApi.togglePopularOverride).toHaveBeenCalledWith('1')
      expect(response.success).toBe(true)
    })

    it('should handle toggle popular override error', async () => {
      menuApi.togglePopularOverride.mockResolvedValue({
        success: false,
        error: 'Toggle failed'
      })

      const { result } = renderHook(() => useMenu())

      let response
      await act(async () => {
        response = await result.current.togglePopularOverride('1')
      })

      expect(response.success).toBe(false)
      expect(response.error).toBe('Toggle failed')
    })

    it('should reset all popular overrides successfully', async () => {
      menuApi.resetAllPopularOverrides.mockResolvedValue({
        success: true,
        count: 5
      })

      const { result } = renderHook(() => useMenu())

      let response
      await act(async () => {
        response = await result.current.resetAllPopularOverrides()
      })

      expect(menuApi.resetAllPopularOverrides).toHaveBeenCalled()
      expect(response.success).toBe(true)
    })

    it('should handle reset all popular overrides error', async () => {
      menuApi.resetAllPopularOverrides.mockResolvedValue({
        success: false,
        error: 'Reset failed'
      })

      const { result } = renderHook(() => useMenu())

      let response
      await act(async () => {
        response = await result.current.resetAllPopularOverrides()
      })

      expect(response.success).toBe(false)
      expect(response.error).toBe('Reset failed')
    })

    it('should toggle suggested successfully', async () => {
      menuApi.toggleSuggested.mockResolvedValue({
        success: true,
        data: { id: '1', isSuggested: true }
      })

      const { result } = renderHook(() => useMenu())

      let response
      await act(async () => {
        response = await result.current.toggleSuggested('1')
      })

      expect(menuApi.toggleSuggested).toHaveBeenCalledWith('1')
      expect(response.success).toBe(true)
    })

    it('should handle toggle suggested error', async () => {
      menuApi.toggleSuggested.mockResolvedValue({
        success: false,
        error: 'Toggle suggested failed'
      })

      const { result } = renderHook(() => useMenu())

      let response
      await act(async () => {
        response = await result.current.toggleSuggested('1')
      })

      expect(response.success).toBe(false)
      expect(response.error).toBe('Toggle suggested failed')
    })
  })
})
