import { beforeEach, describe, it, expect, vi } from 'vitest'

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn()
}

global.localStorage = mockLocalStorage

// Créer le store sans la persistance pour les tests
import { create } from 'zustand'

// Créer une version simplifiée du store pour les tests
const createTestMenuStore = () => create((set, get) => ({
  // État
  items: [],
  isLoading: false,
  categories: [
    { id: 'entrees', name: 'Entrées', slug: 'entrees' },
    { id: 'plats', name: 'Plats', slug: 'plats' },
    { id: 'desserts', name: 'Desserts', slug: 'desserts' },
    { id: 'boissons', name: 'Boissons', slug: 'boissons' }
  ],

  // Actions
  setLoading: (loading) => set({ isLoading: loading }),

  initializeMenu: () => {
    const stored = localStorage.getItem('admin-menu-items')
    if (stored) {
      set({ items: JSON.parse(stored) })
    } else {
      // Données initiales
      const initialItems = [
        {
          id: 1,
          name: 'Pizza Margherita',
          category: 'plats',
          price: 15.90,
          description: 'Base tomate, mozzarella, basilic frais, huile d\'olive extra vierge',
          image: 'pizza-margherita.jpg',
          available: true,
          preparationTime: 15,
          ingredients: ['Pâte à pizza', 'Sauce tomate', 'Mozzarella', 'Basilic'],
          allergens: ['Gluten', 'Lactose'],
          isPopular: true,
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z'
        },
        {
          id: 2,
          name: 'Salade César',
          category: 'entrees',
          price: 12.50,
          description: 'Salade romaine, croûtons croustillants, copeaux de parmesan, sauce césar maison',
          image: 'salade-cesar.jpg',
          available: true,
          preparationTime: 10,
          ingredients: ['Salade romaine', 'Croûtons', 'Parmesan', 'Sauce césar'],
          allergens: ['Gluten', 'Lactose', 'Œufs'],
          isPopular: true,
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z'
        },
        {
          id: 3,
          name: 'Burger Gourmand',
          category: 'plats',
          price: 18.00,
          description: 'Pain artisanal, steak de bœuf, fromage, légumes frais, frites maison',
          image: 'burger-gourmand.jpg',
          available: true,
          preparationTime: 20,
          ingredients: ['Pain burger', 'Steak de bœuf', 'Fromage cheddar', 'Salade', 'Tomates'],
          allergens: ['Gluten', 'Lactose'],
          isPopular: true,
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z'
        },
        {
          id: 4,
          name: 'Tiramisu',
          category: 'desserts',
          price: 7.50,
          description: 'Dessert italien traditionnel au café et mascarpone, saupoudré de cacao',
          image: 'tiramisu-maison.jpg',
          available: false,
          preparationTime: 5,
          ingredients: ['Mascarpone', 'Café', 'Biscuits à la cuillère', 'Cacao'],
          allergens: ['Lactose', 'Œufs', 'Gluten'],
          isPopular: true,
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-20T15:30:00Z'
        },
        {
          id: 5,
          name: 'Coca-Cola',
          category: 'boissons',
          price: 4.00,
          description: 'Boisson gazeuse rafraîchissante 33cl',
          image: 'coca-cola.jpg',
          available: true,
          preparationTime: 1,
          ingredients: ['Eau gazéifiée', 'Sucre', 'Arômes naturels'],
          allergens: [],
          isPopular: false,
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z'
        },
        {
          id: 6,
          name: 'Frites Maison',
          category: 'plats',
          price: 5.50,
          description: 'Pommes de terre fraîches coupées et frites, servies avec une sauce au choix',
          image: 'frites-maison.jpg',
          available: true,
          preparationTime: 8,
          ingredients: ['Pommes de terre', 'Huile végétale', 'Sel'],
          allergens: [],
          isPopular: false,
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z'
        }
      ]
      
      set({ items: initialItems })
      localStorage.setItem('admin-menu-items', JSON.stringify(initialItems))
    }
  },

  // Getters
  getAvailableItems: () => {
    return get().items.filter(item => item.available)
  },

  getPopularItems: () => {
    return get().items.filter(item => item.available && item.isPopular)
  },

  getItemsByCategory: (category) => {
    return get().items.filter(item => item.available && item.category === category)
  },

  getItemById: (id) => {
    return get().items.find(item => item.id === parseInt(id))
  },

  // Actions CRUD (pour l'admin)
  addItem: (itemData) => {
    const newItem = {
      ...itemData,
      id: Date.now(),
      isPopular: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    const updatedItems = [...get().items, newItem]
    set({ items: updatedItems })
    localStorage.setItem('admin-menu-items', JSON.stringify(updatedItems))
    return newItem
  },

  updateItem: (id, itemData) => {
    const updatedItems = get().items.map(item =>
      item.id === id 
        ? { ...item, ...itemData, updatedAt: new Date().toISOString() }
        : item
    )
    
    set({ items: updatedItems })
    localStorage.setItem('admin-menu-items', JSON.stringify(updatedItems))
  },

  deleteItem: (id) => {
    const updatedItems = get().items.filter(item => item.id !== id)
    set({ items: updatedItems })
    localStorage.setItem('admin-menu-items', JSON.stringify(updatedItems))
  },

  toggleAvailability: (id) => {
    const updatedItems = get().items.map(item =>
      item.id === id 
        ? { ...item, available: !item.available, updatedAt: new Date().toISOString() }
        : item
    )
    
    set({ items: updatedItems })
    localStorage.setItem('admin-menu-items', JSON.stringify(updatedItems))
    
    const updatedItem = updatedItems.find(item => item.id === id)
    return updatedItem
  },

  // Synchronisation
  syncFromLocalStorage: () => {
    const stored = localStorage.getItem('admin-menu-items')
    if (stored) {
      set({ items: JSON.parse(stored) })
    }
  }
}))

describe('menuStore', () => {
  let store

  beforeEach(() => {
    vi.clearAllMocks()
    store = createTestMenuStore()
    
    // Mock localStorage par défaut
    mockLocalStorage.getItem.mockReturnValue(null)
  })

  describe('Initialisation et Données par Défaut', () => {
    it('should initialize menu from localStorage when data exists', () => {
      const existingItems = [
        { id: 1, name: 'Custom Pizza', category: 'plats', available: true }
      ]
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingItems))

      store.getState().initializeMenu()

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('admin-menu-items')
      expect(store.getState().items).toEqual(existingItems)
    })

    it('should initialize menu with default data when localStorage is empty', () => {
      mockLocalStorage.getItem.mockReturnValue(null)

      store.getState().initializeMenu()

      const items = store.getState().items
      expect(items).toHaveLength(6)
      expect(items[0]).toMatchObject({
        id: 1,
        name: 'Pizza Margherita',
        category: 'plats',
        price: 15.90,
        available: true,
        isPopular: true
      })
      expect(items[3]).toMatchObject({
        id: 4,
        name: 'Tiramisu',
        category: 'desserts',
        available: false, // Ce dessert n'est pas disponible par défaut
        isPopular: true
      })
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('admin-menu-items', expect.any(String))
    })

    it('should have correct static categories', () => {
      const categories = store.getState().categories

      expect(categories).toHaveLength(4)
      expect(categories).toEqual([
        { id: 'entrees', name: 'Entrées', slug: 'entrees' },
        { id: 'plats', name: 'Plats', slug: 'plats' },
        { id: 'desserts', name: 'Desserts', slug: 'desserts' },
        { id: 'boissons', name: 'Boissons', slug: 'boissons' }
      ])
    })
  })

  describe('Actions CRUD', () => {
    beforeEach(() => {
      // Initialiser avec des données par défaut
      store.getState().initializeMenu()
      vi.clearAllMocks() // Clear après initialisation
    })

    it('should add new item with auto-generated ID and timestamps', () => {
      const itemData = {
        name: 'New Pizza',
        category: 'plats',
        price: 16.50,
        description: 'Une délicieuse nouvelle pizza',
        available: true
      }

      const result = store.getState().addItem(itemData)

      expect(result).toMatchObject({
        ...itemData,
        id: expect.any(Number),
        isPopular: false,
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      })
      expect(store.getState().items).toHaveLength(7) // 6 + 1
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('admin-menu-items', expect.any(String))
    })

    it('should update existing item with new updatedAt timestamp', () => {
      const updateData = {
        name: 'Pizza Margherita Modifiée',
        price: 17.90
      }

      store.getState().updateItem(1, updateData)

      const updatedItem = store.getState().items.find(item => item.id === 1)
      expect(updatedItem).toMatchObject({
        id: 1,
        name: 'Pizza Margherita Modifiée',
        price: 17.90,
        category: 'plats', // Garde les autres propriétés
        updatedAt: expect.any(String)
      })
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('admin-menu-items', expect.any(String))
    })

    it('should delete item and save to localStorage', () => {
      const initialCount = store.getState().items.length

      store.getState().deleteItem(1)

      expect(store.getState().items).toHaveLength(initialCount - 1)
      expect(store.getState().items.find(item => item.id === 1)).toBeUndefined()
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('admin-menu-items', expect.any(String))
    })

    it('should toggle availability and return updated item', () => {
      const originalItem = store.getState().items.find(item => item.id === 1)
      const originalAvailability = originalItem.available

      const result = store.getState().toggleAvailability(1)

      expect(result.available).toBe(!originalAvailability)
      expect(result.updatedAt).not.toBe(originalItem.updatedAt)
      expect(result.id).toBe(1)
      expect(store.getState().items.find(item => item.id === 1).available).toBe(!originalAvailability)
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('admin-menu-items', expect.any(String))
    })
  })

  describe('Getters et Filtres', () => {
    beforeEach(() => {
      // Setup avec des données de test
      store.setState({
        items: [
          { id: 1, name: 'Pizza', category: 'plats', available: true, isPopular: true },
          { id: 2, name: 'Salade', category: 'entrees', available: true, isPopular: false },
          { id: 3, name: 'Burger', category: 'plats', available: false, isPopular: true },
          { id: 4, name: 'Tiramisu', category: 'desserts', available: true, isPopular: true },
          { id: 5, name: 'Soda', category: 'boissons', available: true, isPopular: false }
        ]
      })
    })

    it('should get only available items', () => {
      const availableItems = store.getState().getAvailableItems()

      expect(availableItems).toHaveLength(4)
      expect(availableItems.every(item => item.available)).toBe(true)
      expect(availableItems.find(item => item.id === 3)).toBeUndefined() // Burger non disponible
    })

    it('should get popular items that are also available', () => {
      const popularItems = store.getState().getPopularItems()

      expect(popularItems).toHaveLength(2) // Pizza et Tiramisu
      expect(popularItems.every(item => item.available && item.isPopular)).toBe(true)
      expect(popularItems.map(item => item.name)).toEqual(['Pizza', 'Tiramisu'])
    })

    it('should get items by category (only available ones)', () => {
      const plats = store.getState().getItemsByCategory('plats')
      const entrees = store.getState().getItemsByCategory('entrees')
      const desserts = store.getState().getItemsByCategory('desserts')

      expect(plats).toHaveLength(1) // Seulement Pizza (Burger non disponible)
      expect(plats[0].name).toBe('Pizza')
      
      expect(entrees).toHaveLength(1) // Salade
      expect(entrees[0].name).toBe('Salade')
      
      expect(desserts).toHaveLength(1) // Tiramisu
      expect(desserts[0].name).toBe('Tiramisu')
    })

    it('should get item by ID with parseInt conversion', () => {
      const item1 = store.getState().getItemById(1)
      const item2 = store.getState().getItemById('2') // String ID
      const nonExistent = store.getState().getItemById(999)

      expect(item1).toMatchObject({ id: 1, name: 'Pizza' })
      expect(item2).toMatchObject({ id: 2, name: 'Salade' })
      expect(nonExistent).toBeUndefined()
    })
  })

  describe('Persistance et Synchronisation', () => {
    it('should sync from localStorage when data exists', () => {
      const storedItems = [
        { id: 1, name: 'Synced Item', category: 'plats', available: true }
      ]
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedItems))

      store.getState().syncFromLocalStorage()

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('admin-menu-items')
      expect(store.getState().items).toEqual(storedItems)
    })

    it('should not change items when localStorage is empty during sync', () => {
      store.setState({ items: [{ id: 1, name: 'Existing' }] })
      mockLocalStorage.getItem.mockReturnValue(null)

      store.getState().syncFromLocalStorage()

      expect(store.getState().items).toEqual([{ id: 1, name: 'Existing' }])
    })

    it('should save to localStorage on all CRUD operations', () => {
      store.getState().initializeMenu()
      vi.clearAllMocks()

      // Test toutes les opérations CRUD
      const newItem = store.getState().addItem({ name: 'Test', category: 'plats', price: 10 })
      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(1)

      store.getState().updateItem(newItem.id, { name: 'Test Updated' })
      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(2)

      store.getState().toggleAvailability(newItem.id)
      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(3)

      store.getState().deleteItem(newItem.id)
      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(4)

      // Check que c'est toujours la bonne clé
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('admin-menu-items', expect.any(String))
    })
  })

  describe('États et Utilitaires', () => {
    it('should set loading state correctly', () => {
      expect(store.getState().isLoading).toBe(false)

      store.getState().setLoading(true)
      expect(store.getState().isLoading).toBe(true)

      store.getState().setLoading(false)
      expect(store.getState().isLoading).toBe(false)
    })

    it('should have correct initial state', () => {
      const initialState = store.getState()

      expect(initialState.items).toEqual([])
      expect(initialState.isLoading).toBe(false)
      expect(initialState.categories).toHaveLength(4)
      expect(initialState.categories[0]).toMatchObject({
        id: 'entrees',
        name: 'Entrées',
        slug: 'entrees'
      })
    })
  })
})