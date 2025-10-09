import { create } from 'zustand'
import * as menuApi from '../api/menuApi'

const useMenuStore = create((set, get) => ({
      // State
      items: [],
      categories: [],
      isLoading: false,
      error: null,

      // Actions
      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      clearError: () => set({ error: null }),

      // Initialize menu from API
      fetchMenuItems: async () => {
        set({ isLoading: true, error: null })

        try {
          const result = await menuApi.getMenuItems()

          if (result.success) {
            const rawItems = result.data || []

            // Normalize items to ensure all required fields exist
            const items = rawItems.map(item => ({
              ...item,
              id: item._id || item.id, // Normalize MongoDB _id to id
              allergens: item.allergens || [],
              ingredients: item.ingredients || [],
              preparationTime: item.preparationTime || 0,
              // Ensure isAvailable is a proper boolean
              isAvailable: Boolean(item.isAvailable)
            }))

            // Automatically extract unique categories from items
            const uniqueCategories = [...new Set(items.map(item => item.category).filter(Boolean))]
            const categoriesWithLabels = uniqueCategories.map(cat => ({
              id: cat,
              name: cat.charAt(0).toUpperCase() + cat.slice(1), // Capitalize
              slug: cat
            }))

            set({
              items: items,
              categories: categoriesWithLabels,
              isLoading: false,
              error: null
            })
            return { success: true }
          } else {
            set({
              error: result.error,
              isLoading: false
            })
            return { success: false, error: result.error }
          }
        } catch (error) {
          const errorMessage = error.error || 'Error loading menu'
          set({
            error: errorMessage,
            isLoading: false
          })
          return { success: false, error: errorMessage }
        }
      },

      // Fetch categories (now extracted from items)
      fetchCategories: async () => {
        // Categories are now loaded automatically with fetchMenuItems
        // This function is kept for compatibility but no longer makes API calls
        const items = get().items
        if (items.length > 0) {
          const uniqueCategories = [...new Set(items.map(item => item.category).filter(Boolean))]
          const categoriesWithLabels = uniqueCategories.map(cat => ({
            id: cat,
            name: cat.charAt(0).toUpperCase() + cat.slice(1),
            slug: cat
          }))
          set({ categories: categoriesWithLabels })
          return { success: true }
        }
        return { success: true }
      },

      // Getters (local computations on data)
      getAvailableItems: () => {
        return get().items.filter(item => item.isAvailable !== false)
      },

      getPopularItems: () => {
        return get().items.filter(item => item.isAvailable && item.isPopular)
      },

      getItemsByCategory: (category) => {
        return get().items.filter(item => item.isAvailable && item.category === category)
      },

      getItemById: (id) => {
        return get().items.find(item => item._id === id || item.id === id)
      },

      // CRUD Actions (for admin) - API Calls
      createItem: async (itemData) => {
        set({ isLoading: true, error: null })

        try {
          const result = await menuApi.createMenuItem(itemData)

          if (result.success) {
            // Reload menu after creation
            await get().fetchMenuItems()
            set({ isLoading: false })
            return { success: true, item: result.data }
          } else {
            set({
              error: result.error,
              isLoading: false
            })
            return { success: false, error: result.error }
          }
        } catch (error) {
          const errorMessage = error.error || 'Error creating item'
          set({
            error: errorMessage,
            isLoading: false
          })
          return { success: false, error: errorMessage }
        }
      },

      updateItem: async (id, itemData) => {
        set({ isLoading: true, error: null })

        try {
          const result = await menuApi.updateMenuItem(id, itemData)

          if (result.success) {
            // Reload menu after update
            await get().fetchMenuItems()
            set({ isLoading: false })
            return { success: true, item: result.data }
          } else {
            set({
              error: result.error,
              isLoading: false
            })
            return { success: false, error: result.error }
          }
        } catch (error) {
          const errorMessage = error.error || 'Error updating item'
          set({
            error: errorMessage,
            isLoading: false
          })
          return { success: false, error: errorMessage }
        }
      },

      deleteItem: async (id) => {
        set({ isLoading: true, error: null })

        try {
          const result = await menuApi.deleteMenuItem(id)

          if (result.success) {
            // Reload menu after deletion
            await get().fetchMenuItems()
            set({ isLoading: false })
            return { success: true }
          } else {
            set({
              error: result.error,
              isLoading: false
            })
            return { success: false, error: result.error }
          }
        } catch (error) {
          const errorMessage = error.error || 'Error deleting item'
          set({
            error: errorMessage,
            isLoading: false
          })
          return { success: false, error: errorMessage }
        }
      },

      toggleAvailability: async (id) => {
        const item = get().getItemById(id)
        if (!item) {
          return { success: false, error: 'Item not found' }
        }

        // Toggle availability
        const newAvailability = !item.isAvailable

        return await get().updateItem(id, { isAvailable: newAvailability })
      }
    }))

export default useMenuStore
