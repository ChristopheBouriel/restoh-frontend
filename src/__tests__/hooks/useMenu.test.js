import { renderHook, act } from '@testing-library/react'
import { beforeEach, describe, it, expect, vi } from 'vitest'
import { useMenu } from '../../hooks/useMenu'
import useMenuStore from '../../store/menuStore'

// Mock du store
vi.mock('../../store/menuStore')

describe('useMenu', () => {
  const mockMenuStore = {
    items: [],
    categories: ['pizza', 'pasta', 'dessert'],
    popularItems: [],
    suggestedItems: [],
    isLoading: false,
    isLoadingPopular: false,
    isLoadingSuggested: false,
    error: null,
    setLoading: vi.fn(),
    fetchMenuItems: vi.fn(),
    fetchCategories: vi.fn(),
    fetchPopularItems: vi.fn(),
    fetchSuggestedItems: vi.fn(),
    getAvailableItems: vi.fn(),
    getPopularItems: vi.fn(),
    getItemsByCategory: vi.fn(),
    getItemById: vi.fn(),
    createItem: vi.fn(),
    updateItem: vi.fn(),
    deleteItem: vi.fn(),
    toggleAvailability: vi.fn(),
    togglePopularOverride: vi.fn(),
    resetAllPopularOverrides: vi.fn(),
    toggleSuggested: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock par défaut du store
    vi.mocked(useMenuStore).mockReturnValue(mockMenuStore)
  })

  describe('Initialisation et État', () => {
    it('should fetch menu automatically when items array is empty', async () => {
      // Setup: items vide pour déclencher l'initialisation
      mockMenuStore.items = []

      renderHook(() => useMenu())

      expect(mockMenuStore.fetchMenuItems).toHaveBeenCalledOnce()
      expect(mockMenuStore.fetchCategories).toHaveBeenCalledOnce()
    })

    it('should not fetch menu when items already exist', async () => {
      // Setup: items non-vide pour éviter l'initialisation
      mockMenuStore.items = [
        { id: '1', name: 'Pizza Margherita', available: true }
      ]

      renderHook(() => useMenu())

      expect(mockMenuStore.fetchMenuItems).not.toHaveBeenCalled()
      expect(mockMenuStore.fetchCategories).not.toHaveBeenCalled()
    })

    it('should return correct state from store', () => {
      const mockItems = [
        { id: '1', name: 'Pizza', category: 'pizza' },
        { id: '2', name: 'Pasta', category: 'pasta' }
      ]
      const mockAvailableItems = [{ id: '1', name: 'Pizza', available: true }]
      const mockPopularItems = [{ id: '1', name: 'Pizza', popular: true }]

      mockMenuStore.items = mockItems
      mockMenuStore.getAvailableItems.mockReturnValue(mockAvailableItems)
      mockMenuStore.getPopularItems.mockReturnValue(mockPopularItems)
      mockMenuStore.isLoading = true

      const { result } = renderHook(() => useMenu())

      expect(result.current.items).toEqual(mockItems)
      expect(result.current.availableItems).toEqual(mockAvailableItems)
      expect(result.current.popularItems).toEqual(mockPopularItems)
      expect(result.current.categories).toEqual(['pizza', 'pasta', 'dessert'])
      expect(result.current.isLoading).toBe(true)
    })
  })

  describe('Méthodes Publiques', () => {
    it('should get public menu through getAvailableItems', () => {
      const mockAvailableItems = [
        { id: '1', name: 'Pizza', available: true },
        { id: '2', name: 'Pasta', available: true }
      ]
      mockMenuStore.getAvailableItems.mockReturnValue(mockAvailableItems)

      const { result } = renderHook(() => useMenu())

      // Clear les appels du render initial
      mockMenuStore.getAvailableItems.mockClear()

      const publicMenu = result.current.getPublicMenu()

      expect(mockMenuStore.getAvailableItems).toHaveBeenCalledOnce()
      expect(publicMenu).toEqual(mockAvailableItems)
    })

    it('should get popular items through getPopularItems', () => {
      const mockPopularItems = [
        { id: '1', name: 'Pizza Margherita', popular: true }
      ]
      mockMenuStore.getPopularItems.mockReturnValue(mockPopularItems)

      const { result } = renderHook(() => useMenu())

      // Clear les appels du render initial
      mockMenuStore.getPopularItems.mockClear()

      const popularItems = result.current.getPublicPopularItems()

      expect(mockMenuStore.getPopularItems).toHaveBeenCalledOnce()
      expect(popularItems).toEqual(mockPopularItems)
    })

    it('should get items by category through getItemsByCategory', () => {
      const mockPizzaItems = [
        { id: '1', name: 'Pizza Margherita', category: 'pizza' },
        { id: '2', name: 'Pizza Pepperoni', category: 'pizza' }
      ]
      mockMenuStore.getItemsByCategory.mockReturnValue(mockPizzaItems)

      const { result } = renderHook(() => useMenu())

      const pizzaItems = result.current.getPublicItemsByCategory('pizza')

      expect(mockMenuStore.getItemsByCategory).toHaveBeenCalledWith('pizza')
      expect(pizzaItems).toEqual(mockPizzaItems)
    })
  })

  describe('Actions Admin CRUD', () => {
    it('should add item successfully', async () => {
      const itemData = { name: 'New Pizza', price: 12.99, category: 'pizza' }
      const newItem = { id: '123', ...itemData }
      mockMenuStore.createItem.mockResolvedValue({ success: true, item: newItem })

      const { result } = renderHook(() => useMenu())

      const response = await result.current.addItem(itemData)

      expect(mockMenuStore.createItem).toHaveBeenCalledWith(itemData)
      expect(response).toEqual({ success: true, item: newItem })
    })

    it('should update item successfully', async () => {
      const itemData = { name: 'Updated Pizza', price: 15.99 }
      mockMenuStore.updateItem.mockResolvedValue({ success: true })

      const { result } = renderHook(() => useMenu())

      const response = await result.current.updateItem('123', itemData)

      expect(mockMenuStore.updateItem).toHaveBeenCalledWith('123', itemData)
      expect(response).toEqual({ success: true })
    })

    it('should delete item successfully', async () => {
      mockMenuStore.deleteItem.mockResolvedValue({ success: true })

      const { result } = renderHook(() => useMenu())

      const response = await result.current.deleteItem('123')

      expect(mockMenuStore.deleteItem).toHaveBeenCalledWith('123')
      expect(response).toEqual({ success: true })
    })

    it('should toggle availability successfully', async () => {
      const updatedItem = { id: '123', name: 'Pizza', available: false }
      mockMenuStore.toggleAvailability.mockResolvedValue({ success: true, item: updatedItem })

      const { result } = renderHook(() => useMenu())

      const response = await result.current.toggleAvailability('123')

      expect(mockMenuStore.toggleAvailability).toHaveBeenCalledWith('123')
      expect(response).toEqual({ success: true, item: updatedItem })
    })
  })

  describe('Error Management', () => {
    it('should handle addItem error gracefully', async () => {
      const errorMessage = 'Invalid item data'
      mockMenuStore.createItem.mockResolvedValue({ success: false, error: errorMessage })

      const { result } = renderHook(() => useMenu())

      const response = await result.current.addItem({ name: 'Bad Item' })

      expect(response).toEqual({ success: false, error: errorMessage })
    })

    it('should handle updateItem error gracefully', async () => {
      const errorMessage = 'Item not found'
      mockMenuStore.updateItem.mockResolvedValue({ success: false, error: errorMessage })

      const { result } = renderHook(() => useMenu())

      const response = await result.current.updateItem('nonexistent', { name: 'Test' })

      expect(response).toEqual({ success: false, error: errorMessage })
    })

    it('should handle deleteItem error gracefully', async () => {
      const errorMessage = 'Cannot delete item'
      mockMenuStore.deleteItem.mockResolvedValue({ success: false, error: errorMessage })

      const { result } = renderHook(() => useMenu())

      const response = await result.current.deleteItem('123')

      expect(response).toEqual({ success: false, error: errorMessage })
    })

    it('should handle toggleAvailability error gracefully', async () => {
      const errorMessage = 'Toggle failed'
      mockMenuStore.toggleAvailability.mockResolvedValue({ success: false, error: errorMessage })

      const { result } = renderHook(() => useMenu())

      const response = await result.current.toggleAvailability('123')

      expect(response).toEqual({ success: false, error: errorMessage })
    })
  })

  describe('Intégration Store', () => {
    it('should expose store utilities correctly', () => {
      const { result } = renderHook(() => useMenu())

      expect(result.current.setLoading).toBe(mockMenuStore.setLoading)
      expect(result.current.fetchMenuItems).toBe(mockMenuStore.fetchMenuItems)
      expect(result.current.getItemById).toBe(mockMenuStore.getItemById)
    })

    it('should call setLoading when exposed', () => {
      const { result } = renderHook(() => useMenu())

      act(() => {
        result.current.setLoading(true)
      })

      expect(mockMenuStore.setLoading).toHaveBeenCalledWith(true)
    })

    it('should call fetchMenuItems when exposed', () => {
      const { result } = renderHook(() => useMenu())

      act(() => {
        result.current.fetchMenuItems()
      })

      expect(mockMenuStore.fetchMenuItems).toHaveBeenCalledOnce()
    })
  })

  describe('Popular Items & Suggestions', () => {
    it('should return backend popular items', () => {
      const mockBackendPopular = [
        { id: '1', name: 'Pizza', orderCount: 100 },
        { id: '2', name: 'Pasta', orderCount: 80 }
      ]
      mockMenuStore.popularItems = mockBackendPopular
      mockMenuStore.items = [{ id: '1' }] // prevent auto-fetch

      const { result } = renderHook(() => useMenu())

      expect(result.current.backendPopularItems).toEqual(mockBackendPopular)
      expect(result.current.getBackendPopularItems()).toEqual(mockBackendPopular)
    })

    it('should return suggested items', () => {
      const mockSuggested = [
        { id: '1', name: 'Chef Special Pizza', isSuggested: true },
        { id: '2', name: 'House Pasta', isSuggested: true }
      ]
      mockMenuStore.suggestedItems = mockSuggested
      mockMenuStore.items = [{ id: '1' }] // prevent auto-fetch

      const { result } = renderHook(() => useMenu())

      expect(result.current.suggestedItems).toEqual(mockSuggested)
      expect(result.current.getSuggestedItems()).toEqual(mockSuggested)
    })

    it('should expose loading states for popular and suggested', () => {
      mockMenuStore.isLoadingPopular = true
      mockMenuStore.isLoadingSuggested = true
      mockMenuStore.items = [{ id: '1' }] // prevent auto-fetch

      const { result } = renderHook(() => useMenu())

      expect(result.current.isLoadingPopular).toBe(true)
      expect(result.current.isLoadingSuggested).toBe(true)
    })

    it('should expose fetchPopularItems', () => {
      mockMenuStore.items = [{ id: '1' }] // prevent auto-fetch

      const { result } = renderHook(() => useMenu())

      expect(result.current.fetchPopularItems).toBe(mockMenuStore.fetchPopularItems)
    })

    it('should expose fetchSuggestedItems', () => {
      mockMenuStore.items = [{ id: '1' }] // prevent auto-fetch

      const { result } = renderHook(() => useMenu())

      expect(result.current.fetchSuggestedItems).toBe(mockMenuStore.fetchSuggestedItems)
    })
  })

  describe('Admin Actions - Popular Override & Suggestions', () => {
    it('should toggle popular override successfully', async () => {
      const updatedItem = { id: '123', name: 'Pizza', isPopularOverride: true }
      mockMenuStore.togglePopularOverride.mockResolvedValue({ success: true, item: updatedItem })
      mockMenuStore.items = [{ id: '1' }] // prevent auto-fetch

      const { result } = renderHook(() => useMenu())

      const response = await result.current.togglePopularOverride('123')

      expect(mockMenuStore.togglePopularOverride).toHaveBeenCalledWith('123')
      expect(response).toEqual({ success: true, item: updatedItem })
    })

    it('should handle toggle popular override error', async () => {
      const errorMessage = 'Toggle failed'
      mockMenuStore.togglePopularOverride.mockResolvedValue({ success: false, error: errorMessage })
      mockMenuStore.items = [{ id: '1' }] // prevent auto-fetch

      const { result } = renderHook(() => useMenu())

      const response = await result.current.togglePopularOverride('123')

      expect(response).toEqual({ success: false, error: errorMessage })
    })

    it('should reset all popular overrides successfully', async () => {
      mockMenuStore.resetAllPopularOverrides.mockResolvedValue({ success: true, count: 5 })
      mockMenuStore.items = [{ id: '1' }] // prevent auto-fetch

      const { result } = renderHook(() => useMenu())

      const response = await result.current.resetAllPopularOverrides()

      expect(mockMenuStore.resetAllPopularOverrides).toHaveBeenCalled()
      expect(response).toEqual({ success: true, count: 5 })
    })

    it('should handle reset all popular overrides error', async () => {
      const errorMessage = 'Reset failed'
      mockMenuStore.resetAllPopularOverrides.mockResolvedValue({ success: false, error: errorMessage })
      mockMenuStore.items = [{ id: '1' }] // prevent auto-fetch

      const { result } = renderHook(() => useMenu())

      const response = await result.current.resetAllPopularOverrides()

      expect(response).toEqual({ success: false, error: errorMessage })
    })

    it('should toggle suggested successfully', async () => {
      const updatedItem = { id: '123', name: 'Pizza', isSuggested: true }
      mockMenuStore.toggleSuggested.mockResolvedValue({ success: true, item: updatedItem })
      mockMenuStore.items = [{ id: '1' }] // prevent auto-fetch

      const { result } = renderHook(() => useMenu())

      const response = await result.current.toggleSuggested('123')

      expect(mockMenuStore.toggleSuggested).toHaveBeenCalledWith('123')
      expect(response).toEqual({ success: true, item: updatedItem })
    })

    it('should handle toggle suggested error', async () => {
      const errorMessage = 'Toggle suggested failed'
      mockMenuStore.toggleSuggested.mockResolvedValue({ success: false, error: errorMessage })
      mockMenuStore.items = [{ id: '1' }] // prevent auto-fetch

      const { result } = renderHook(() => useMenu())

      const response = await result.current.toggleSuggested('123')

      expect(response).toEqual({ success: false, error: errorMessage })
    })
  })
})