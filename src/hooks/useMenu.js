import { useEffect } from 'react'
import useMenuStore from '../store/menuStore'

export const useMenu = () => {
  const {
    items,
    categories,
    isLoading,
    error,
    setLoading,
    fetchMenuItems,
    fetchCategories,
    getAvailableItems,
    getPopularItems,
    getItemsByCategory,
    getItemById,
    createItem,
    updateItem,
    deleteItem,
    toggleAvailability
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

  const getPublicPopularItems = () => {
    return getPopularItems()
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

  return {
    // State
    items: getAllItems(),
    availableItems: getPublicMenu(),
    popularItems: getPublicPopularItems(),
    categories,
    isLoading,
    error,

    // Public getters
    getPublicMenu,
    getPublicPopularItems,
    getPublicItemsByCategory,
    getItemById,

    // Admin actions
    addItem: handleAddItem,
    updateItem: handleUpdateItem,
    deleteItem: handleDeleteItem,
    toggleAvailability: handleToggleAvailability,

    // Loading actions
    fetchMenuItems,
    fetchCategories,

    // Utilities
    setLoading
  }
}