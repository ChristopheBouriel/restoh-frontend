import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useMenuStore = create(
  persist(
    (set, get) => ({
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
              image: 'coca-cola.jpg', // Pas d'image spécifique, utilisera le placeholder
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
    }),
    {
      name: 'menu-storage',
      partialize: (state) => ({ 
        items: state.items 
      }),
    }
  )
)

export default useMenuStore