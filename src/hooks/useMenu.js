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
    // Charger le menu au premier chargement si vide
    if (items.length === 0) {
      fetchMenuItems()
      fetchCategories()
    }
  }, [items.length, fetchMenuItems, fetchCategories])

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

  // Les fonctions CRUD retournent déjà des promesses avec { success, ... }
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
    // État
    items: getAllItems(),
    availableItems: getPublicMenu(),
    popularItems: getPublicPopularItems(),
    categories,
    isLoading,
    error,

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

    // Actions de chargement
    fetchMenuItems,
    fetchCategories,

    // Utilitaires
    setLoading
  }
}