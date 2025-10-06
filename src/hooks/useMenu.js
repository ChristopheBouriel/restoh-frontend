import { useEffect } from 'react'
import useMenuStore from '../store/menuStore'

export const useMenu = () => {
  const {
    items,
    categories,
    isLoading,
    setLoading,
    initializeMenu,
    getAvailableItems,
    getPopularItems,
    getItemsByCategory,
    getItemById,
    addItem,
    updateItem,
    deleteItem,
    toggleAvailability,
    syncFromLocalStorage
  } = useMenuStore()

  useEffect(() => {
    // Initialiser le menu au premier chargement
    if (items.length === 0) {
      initializeMenu()
    }
  }, [items.length, initializeMenu])

  // Pour les pages publiques
  const getPublicMenu = () => {
    return getAvailableItems()
  }

  const getPublicPopularItems = () => {
    return getPopularItems()
  }

  const getPublicItemsByCategory = (category) => {
    return getItemsByCategory(category)
  }

  // Pour l'admin
  const getAllItems = () => {
    return items
  }

  const handleAddItem = (itemData) => {
    try {
      const newItem = addItem(itemData)
      return { success: true, item: newItem }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const handleUpdateItem = (id, itemData) => {
    try {
      updateItem(id, itemData)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const handleDeleteItem = (id) => {
    try {
      deleteItem(id)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const handleToggleAvailability = (id) => {
    try {
      const updatedItem = toggleAvailability(id)
      return { success: true, item: updatedItem }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  return {
    // État
    items: getAllItems(),
    availableItems: getPublicMenu(),
    popularItems: getPublicPopularItems(),
    categories,
    isLoading,

    // Getters publics
    getPublicMenu,
    getPublicPopularItems,
    getPublicItemsByCategory,
    getItemById,

    // Actions admin
    addItem: handleAddItem,
    updateItem: handleUpdateItem,
    deleteItem: handleDeleteItem,
    toggleAvailability: handleToggleAvailability,

    // Utilitaires
    setLoading,
    syncFromLocalStorage
  }
}