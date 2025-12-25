import { describe, it, expect, vi, beforeEach } from 'vitest'
import apiClient from '../../api/apiClient'
import {
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem
} from '../../api/menuApi'

vi.mock('../../api/apiClient')

describe('Menu API - CRUD Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getMenuItems', () => {
    it('should fetch all menu items without category filter', async () => {
      apiClient.get.mockResolvedValue({ items: [{ id: '1', name: 'Pizza' }] })

      const result = await getMenuItems()

      expect(apiClient.get).toHaveBeenCalledWith('/menu', { params: {} })
      expect(result.success).toBe(true)
      expect(result.items).toEqual([{ id: '1', name: 'Pizza' }])
    })

    it('should pass category filter when provided', async () => {
      apiClient.get.mockResolvedValue({ items: [] })

      await getMenuItems('appetizer')

      expect(apiClient.get).toHaveBeenCalledWith('/menu', { params: { category: 'appetizer' } })
    })

    it('should handle error', async () => {
      apiClient.get.mockRejectedValue({ error: 'Server error' })

      const result = await getMenuItems()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Server error')
    })
  })

  describe('createMenuItem', () => {
    it('should create item with JSON when no image file', async () => {
      const itemData = { name: 'New Pizza', price: 12.99, category: 'main' }
      apiClient.post.mockResolvedValue({ item: { id: '1', ...itemData } })

      const result = await createMenuItem(itemData)

      expect(apiClient.post).toHaveBeenCalledWith('/menu', itemData)
      expect(result.success).toBe(true)
    })

    it('should create item with FormData when image file is provided', async () => {
      const imageFile = new File([''], 'pizza.jpg', { type: 'image/jpeg' })
      const itemData = {
        name: 'Pizza',
        price: 12.99,
        image: imageFile,
        allergens: ['gluten', 'dairy']
      }
      apiClient.post.mockResolvedValue({ item: { id: '1' } })

      await createMenuItem(itemData)

      // Verify FormData was used
      expect(apiClient.post).toHaveBeenCalledWith(
        '/menu',
        expect.any(FormData),
        expect.objectContaining({
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: true
        })
      )
    })

    it('should handle error', async () => {
      apiClient.post.mockRejectedValue({ error: 'Validation failed' })

      const result = await createMenuItem({ name: '' })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Validation failed')
    })
  })

  describe('updateMenuItem', () => {
    it('should update item with JSON when no image file', async () => {
      const itemData = { name: 'Updated Pizza', price: 14.99 }
      apiClient.put.mockResolvedValue({ item: { id: '1', ...itemData } })

      const result = await updateMenuItem('item-1', itemData)

      expect(apiClient.put).toHaveBeenCalledWith('/menu/item-1', itemData)
      expect(result.success).toBe(true)
    })

    it('should update item with FormData when image file is provided', async () => {
      const imageFile = new File([''], 'new-pizza.jpg', { type: 'image/jpeg' })
      const itemData = {
        name: 'Pizza',
        image: imageFile,
        ingredients: ['tomato', 'cheese']
      }
      apiClient.put.mockResolvedValue({ item: { id: '1' } })

      await updateMenuItem('item-1', itemData)

      expect(apiClient.put).toHaveBeenCalledWith(
        '/menu/item-1',
        expect.any(FormData),
        expect.objectContaining({
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: true
        })
      )
    })

    it('should handle error', async () => {
      apiClient.put.mockRejectedValue({ error: 'Item not found' })

      const result = await updateMenuItem('invalid-id', { name: 'Test' })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Item not found')
    })
  })

  describe('deleteMenuItem', () => {
    it('should delete item', async () => {
      apiClient.delete.mockResolvedValue({})

      const result = await deleteMenuItem('item-1')

      expect(apiClient.delete).toHaveBeenCalledWith('/menu/item-1')
      expect(result.success).toBe(true)
    })

    it('should handle error', async () => {
      apiClient.delete.mockRejectedValue({ error: 'Cannot delete active item' })

      const result = await deleteMenuItem('item-1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Cannot delete active item')
    })
  })
})
