import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import * as menuApi from '../api/menuApi'

const useMenuStore = create(
  persist(
    (set, get) => ({
      // État
      items: [],
      categories: [],
      isLoading: false,
      error: null,

      // Actions
      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      clearError: () => set({ error: null }),

      // Initialiser le menu depuis l'API
      fetchMenuItems: async () => {
        set({ isLoading: true, error: null })

        try {
          const result = await menuApi.getMenuItems()

          if (result.success) {
            const items = result.data || []

            // Extraire automatiquement les catégories uniques depuis les items
            const uniqueCategories = [...new Set(items.map(item => item.category).filter(Boolean))]
            const categoriesWithLabels = uniqueCategories.map(cat => ({
              id: cat,
              name: cat.charAt(0).toUpperCase() + cat.slice(1), // Capitaliser
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
          const errorMessage = error.error || 'Erreur lors du chargement du menu'
          set({
            error: errorMessage,
            isLoading: false
          })
          return { success: false, error: errorMessage }
        }
      },

      // Récupérer les catégories (maintenant extrait depuis les items)
      fetchCategories: async () => {
        // Les catégories sont maintenant chargées automatiquement avec fetchMenuItems
        // Cette fonction est conservée pour la compatibilité mais ne fait plus d'appel API
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

      // Getters (calculs locaux sur les données)
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

      // Actions CRUD (pour l'admin) - Appels API
      createItem: async (itemData) => {
        set({ isLoading: true, error: null })

        try {
          const result = await menuApi.createMenuItem(itemData)

          if (result.success) {
            // Recharger le menu après création
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
          const errorMessage = error.error || 'Erreur lors de la création de l\'item'
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
            // Recharger le menu après mise à jour
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
          const errorMessage = error.error || 'Erreur lors de la mise à jour de l\'item'
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
            // Recharger le menu après suppression
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
          const errorMessage = error.error || 'Erreur lors de la suppression de l\'item'
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
          return { success: false, error: 'Item non trouvé' }
        }

        // Toggle la disponibilité
        const newAvailability = !item.isAvailable

        return await get().updateItem(id, { isAvailable: newAvailability })
      }
    }),
    {
      name: 'menu-storage',
      partialize: (state) => ({
        items: state.items,
        categories: state.categories
      }),
    }
  )
)

export default useMenuStore
