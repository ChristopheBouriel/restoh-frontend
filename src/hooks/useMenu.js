import { useEffect } from 'react'
import useMenuStore from '../store/menuStore'

export const useMenu = () => {
  const {
    items,
    categories,
    popularItems,
    suggestedItems,
    isLoading,
    isLoadingPopular,
    isLoadingSuggested,
    error,
    setLoading,
    fetchMenuItems,
    fetchCategories,
    fetchPopularItems,
    fetchSuggestedItems,
    getAvailableItems,
    getItemsByCategory,
    getItemById,
    createItem,
    updateItem,
    deleteItem,
    toggleAvailability,
    togglePopularOverride,
    resetAllPopularOverrides,
    toggleSuggested
  } = useMenuStore()

  useEffect(() => {
    // Load menu on first load if empty
    if (items.length === 0) {
      fetchMenuItems()
      fetchCategories()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length])

  // For public pages
  const getPublicMenu = () => {
    return getAvailableItems()
  }

  // Returns suggested items (chef's recommendations)
  const getSuggestedItems = () => {
    return suggestedItems
  }

  const getPublicItemsByCategory = (category) => {
    return getItemsByCategory(category)
  }

  // For admin
  const getAllItems = () => {
    return items
  }

  // CRUD functions already return promises with { success, ... }
  const handleAddItem = async (itemData) => {
    return await createItem(itemData)
  }

  const handleUpdateItem = async (id, itemData) => {
    return await updateItem(id, itemData)
  }

  const handleDeleteItem = async (id) => {
    return await deleteItem(id)
  }

  const handleToggleAvailability = async (id) => {
    return await toggleAvailability(id)
  }

  const handleTogglePopularOverride = async (id) => {
    return await togglePopularOverride(id)
  }

  const handleResetAllPopularOverrides = async () => {
    return await resetAllPopularOverrides()
  }

  const handleToggleSuggested = async (id) => {
    return await toggleSuggested(id)
  }

  return {
    // State
    items: getAllItems(),
    availableItems: getPublicMenu(),
    popularItems,
    suggestedItems: getSuggestedItems(),
    categories,
    isLoading,
    isLoadingPopular,
    isLoadingSuggested,
    error,

    // Public getters
    getPublicMenu,
    getSuggestedItems,
    getPublicItemsByCategory,
    getItemById,

    // Admin actions
    addItem: handleAddItem,
    updateItem: handleUpdateItem,
    deleteItem: handleDeleteItem,
    toggleAvailability: handleToggleAvailability,
    togglePopularOverride: handleTogglePopularOverride,
    resetAllPopularOverrides: handleResetAllPopularOverrides,
    toggleSuggested: handleToggleSuggested,

    // Loading actions
    fetchMenuItems,
    fetchCategories,
    fetchPopularItems,
    fetchSuggestedItems,

    // Utilities
    setLoading
  }
}