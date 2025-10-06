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
    isLoading: false,
    setLoading: vi.fn(),
    initializeMenu: vi.fn(),
    getAvailableItems: vi.fn(),
    getPopularItems: vi.fn(),
    getItemsByCategory: vi.fn(),
    getItemById: vi.fn(),
    addItem: vi.fn(),
    updateItem: vi.fn(),
    deleteItem: vi.fn(),
    toggleAvailability: vi.fn(),
    syncFromLocalStorage: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock par défaut du store
    vi.mocked(useMenuStore).mockReturnValue(mockMenuStore)
  })

  describe('Initialisation et État', () => {
    it('should initialize menu automatically when items array is empty', async () => {
      // Setup: items vide pour déclencher l'initialisation
      mockMenuStore.items = []
      
      renderHook(() => useMenu())

      expect(mockMenuStore.initializeMenu).toHaveBeenCalledOnce()
    })

    it('should not initialize menu when items already exist', async () => {
      // Setup: items non-vide pour éviter l'initialisation
      mockMenuStore.items = [
        { id: '1', name: 'Pizza Margherita', available: true }
      ]
      
      renderHook(() => useMenu())

      expect(mockMenuStore.initializeMenu).not.toHaveBeenCalled()
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
    it('should add item successfully', () => {
      const itemData = { name: 'New Pizza', price: 12.99, category: 'pizza' }
      const newItem = { id: '123', ...itemData }
      mockMenuStore.addItem.mockReturnValue(newItem)

      const { result } = renderHook(() => useMenu())

      const response = result.current.addItem(itemData)

      expect(mockMenuStore.addItem).toHaveBeenCalledWith(itemData)
      expect(response).toEqual({ success: true, item: newItem })
    })

    it('should update item successfully', () => {
      const itemData = { name: 'Updated Pizza', price: 15.99 }
      mockMenuStore.updateItem.mockImplementation(() => {}) // Void function

      const { result } = renderHook(() => useMenu())

      const response = result.current.updateItem('123', itemData)

      expect(mockMenuStore.updateItem).toHaveBeenCalledWith('123', itemData)
      expect(response).toEqual({ success: true })
    })

    it('should delete item successfully', () => {
      mockMenuStore.deleteItem.mockImplementation(() => {}) // Void function

      const { result } = renderHook(() => useMenu())

      const response = result.current.deleteItem('123')

      expect(mockMenuStore.deleteItem).toHaveBeenCalledWith('123')
      expect(response).toEqual({ success: true })
    })

    it('should toggle availability successfully', () => {
      const updatedItem = { id: '123', name: 'Pizza', available: false }
      mockMenuStore.toggleAvailability.mockReturnValue(updatedItem)

      const { result } = renderHook(() => useMenu())

      const response = result.current.toggleAvailability('123')

      expect(mockMenuStore.toggleAvailability).toHaveBeenCalledWith('123')
      expect(response).toEqual({ success: true, item: updatedItem })
    })
  })

  describe('Gestion d\'Erreurs', () => {
    it('should handle addItem error gracefully', () => {
      const errorMessage = 'Invalid item data'
      mockMenuStore.addItem.mockImplementation(() => {
        throw new Error(errorMessage)
      })

      const { result } = renderHook(() => useMenu())

      const response = result.current.addItem({ name: 'Bad Item' })

      expect(response).toEqual({ success: false, error: errorMessage })
    })

    it('should handle updateItem error gracefully', () => {
      const errorMessage = 'Item not found'
      mockMenuStore.updateItem.mockImplementation(() => {
        throw new Error(errorMessage)
      })

      const { result } = renderHook(() => useMenu())

      const response = result.current.updateItem('nonexistent', { name: 'Test' })

      expect(response).toEqual({ success: false, error: errorMessage })
    })

    it('should handle deleteItem error gracefully', () => {
      const errorMessage = 'Cannot delete item'
      mockMenuStore.deleteItem.mockImplementation(() => {
        throw new Error(errorMessage)
      })

      const { result } = renderHook(() => useMenu())

      const response = result.current.deleteItem('123')

      expect(response).toEqual({ success: false, error: errorMessage })
    })

    it('should handle toggleAvailability error gracefully', () => {
      const errorMessage = 'Toggle failed'
      mockMenuStore.toggleAvailability.mockImplementation(() => {
        throw new Error(errorMessage)
      })

      const { result } = renderHook(() => useMenu())

      const response = result.current.toggleAvailability('123')

      expect(response).toEqual({ success: false, error: errorMessage })
    })
  })

  describe('Intégration Store', () => {
    it('should expose store utilities correctly', () => {
      const { result } = renderHook(() => useMenu())

      expect(result.current.setLoading).toBe(mockMenuStore.setLoading)
      expect(result.current.syncFromLocalStorage).toBe(mockMenuStore.syncFromLocalStorage)
      expect(result.current.getItemById).toBe(mockMenuStore.getItemById)
    })

    it('should call setLoading when exposed', () => {
      const { result } = renderHook(() => useMenu())

      act(() => {
        result.current.setLoading(true)
      })

      expect(mockMenuStore.setLoading).toHaveBeenCalledWith(true)
    })

    it('should call syncFromLocalStorage when exposed', () => {
      const { result } = renderHook(() => useMenu())

      act(() => {
        result.current.syncFromLocalStorage()
      })

      expect(mockMenuStore.syncFromLocalStorage).toHaveBeenCalledOnce()
    })
  })
})