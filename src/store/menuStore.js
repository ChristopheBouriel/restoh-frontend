import { create } from 'zustand'
import * as menuApi from '../api/menuApi'
import { MenuService } from '../services/menu'

const useMenuStore = create((set, get) => ({
      // State
      items: [],
      categories: [],
      popularItems: [],      // Popular items from backend (with category distribution)
      suggestedItems: [],    // Restaurant suggestions (admin-selected)
      isLoading: false,
      isLoadingPopular: false,
      isLoadingSuggested: false,
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

            // Normalize items using MenuService
            const items = MenuService.normalizeItems(rawItems)

            // Extract unique categories using MenuService
            const uniqueCategories = MenuService.extractCategories(items)
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
          const uniqueCategories = MenuService.extractCategories(items)
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

      // Getters (delegate to MenuService for business logic)
      getAvailableItems: () => {
        return MenuService.getAvailable(get().items)
      },

      getPopularItems: () => {
        return MenuService.getPopular(get().items)
      },

      getItemsByCategory: (category) => {
        return MenuService.getByCategory(get().items, category)
      },

      getItemById: (id) => {
        return MenuService.getById(get().items, id)
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
      },

      // ============================================
      // Popular Items & Suggestions
      // ============================================

      // Fetch popular items from backend (with category distribution)
      fetchPopularItems: async () => {
        set({ isLoadingPopular: true })

        try {
          const result = await menuApi.getPopularItems()

          if (result.success) {
            set({
              popularItems: result.data || [],
              isLoadingPopular: false
            })
            return { success: true }
          } else {
            set({ isLoadingPopular: false })
            return { success: false, error: result.error }
          }
        } catch (error) {
          set({ isLoadingPopular: false })
          return { success: false, error: error.error || 'Error fetching popular items' }
        }
      },

      // Fetch suggested items from backend
      fetchSuggestedItems: async () => {
        set({ isLoadingSuggested: true })

        try {
          const result = await menuApi.getSuggestedItems()

          if (result.success) {
            set({
              suggestedItems: result.data || [],
              isLoadingSuggested: false
            })
            return { success: true }
          } else {
            set({ isLoadingSuggested: false })
            return { success: false, error: result.error }
          }
        } catch (error) {
          set({ isLoadingSuggested: false })
          return { success: false, error: error.error || 'Error fetching suggested items' }
        }
      },

      // Toggle popular override for an item (ADMIN)
      togglePopularOverride: async (id) => {
        try {
          const result = await menuApi.togglePopularOverride(id)

          if (result.success) {
            // Refresh both menu items and popular items
            await get().fetchMenuItems()
            await get().fetchPopularItems()
            return { success: true, data: result.data }
          } else {
            return { success: false, error: result.error }
          }
        } catch (error) {
          return { success: false, error: error.error || 'Error toggling popular override' }
        }
      },

      // Reset all popular overrides (ADMIN)
      resetAllPopularOverrides: async () => {
        try {
          const result = await menuApi.resetAllPopularOverrides()

          if (result.success) {
            // Refresh both menu items and popular items
            await get().fetchMenuItems()
            await get().fetchPopularItems()
            return { success: true, data: result.data }
          } else {
            return { success: false, error: result.error }
          }
        } catch (error) {
          return { success: false, error: error.error || 'Error resetting popular overrides' }
        }
      },

      // Toggle suggested status for an item (ADMIN)
      toggleSuggested: async (id) => {
        try {
          const result = await menuApi.toggleSuggested(id)

          if (result.success) {
            // Refresh both menu items and suggested items
            await get().fetchMenuItems()
            await get().fetchSuggestedItems()
            return { success: true, data: result.data }
          } else {
            return { success: false, error: result.error }
          }
        } catch (error) {
          return { success: false, error: error.error || 'Error toggling suggested' }
        }
      }
    }))

export default useMenuStore
