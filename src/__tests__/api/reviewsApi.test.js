import { describe, it, expect, vi, beforeEach } from 'vitest'
import apiClient from '../../api/apiClient'
import {
  getMenuItemReviews,
  getMenuItemRatingStats,
  createReview,
  updateReview,
  deleteReview
} from '../../api/reviewsApi'

vi.mock('../../api/apiClient')

describe('Reviews API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getMenuItemReviews', () => {
    it('should fetch reviews for a menu item successfully', async () => {
      const mockReviews = [
        { id: '1', rating: 5, comment: 'Excellent!', userName: 'John' },
        { id: '2', rating: 4, comment: 'Very good', userName: 'Jane' }
      ]
      apiClient.get.mockResolvedValue({ data: { data: mockReviews } })

      const result = await getMenuItemReviews('menu-item-123')

      expect(apiClient.get).toHaveBeenCalledWith('/menu/menu-item-123/review')
      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockReviews)
    })

    it('should handle response.data directly when data.data is undefined', async () => {
      const mockReviews = [{ id: '1', rating: 5 }]
      apiClient.get.mockResolvedValue({ data: mockReviews })

      const result = await getMenuItemReviews('menu-item-123')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockReviews)
    })

    it('should handle error with custom message', async () => {
      apiClient.get.mockRejectedValue({
        response: { data: { error: 'Menu item not found' } }
      })

      const result = await getMenuItemReviews('invalid-id')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Menu item not found')
    })

    it('should handle generic error', async () => {
      apiClient.get.mockRejectedValue(new Error('Network error'))

      const result = await getMenuItemReviews('menu-item-123')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to fetch reviews')
    })
  })

  describe('getMenuItemRatingStats', () => {
    it('should fetch rating stats and round to nearest 0.5', async () => {
      apiClient.get.mockResolvedValue({
        data: { data: { average: 4.3, count: 15 } }
      })

      const result = await getMenuItemRatingStats('menu-item-123')

      expect(apiClient.get).toHaveBeenCalledWith('/menu/menu-item-123/rating')
      expect(result.success).toBe(true)
      expect(result.data.averageRating).toBe(4.5) // 4.3 rounds to 4.5
      expect(result.data.reviewCount).toBe(15)
    })

    it('should round 4.2 to 4.0', async () => {
      apiClient.get.mockResolvedValue({
        data: { data: { average: 4.2, count: 10 } }
      })

      const result = await getMenuItemRatingStats('menu-item-123')

      expect(result.data.averageRating).toBe(4.0)
    })

    it('should round 4.75 to 5.0', async () => {
      apiClient.get.mockResolvedValue({
        data: { data: { average: 4.75, count: 5 } }
      })

      const result = await getMenuItemRatingStats('menu-item-123')

      expect(result.data.averageRating).toBe(5.0)
    })

    it('should handle missing data with defaults', async () => {
      apiClient.get.mockResolvedValue({ data: { data: {} } })

      const result = await getMenuItemRatingStats('menu-item-123')

      expect(result.success).toBe(true)
      expect(result.data.averageRating).toBe(0)
      expect(result.data.reviewCount).toBe(0)
    })

    it('should handle response.data directly', async () => {
      apiClient.get.mockResolvedValue({
        data: { average: 3.7, count: 8 }
      })

      const result = await getMenuItemRatingStats('menu-item-123')

      expect(result.data.averageRating).toBe(3.5) // 3.7 rounds to 3.5
      expect(result.data.reviewCount).toBe(8)
    })

    it('should handle error', async () => {
      apiClient.get.mockRejectedValue({
        response: { data: { error: 'Stats not available' } }
      })

      const result = await getMenuItemRatingStats('menu-item-123')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Stats not available')
    })

    it('should handle generic error', async () => {
      apiClient.get.mockRejectedValue(new Error('Network error'))

      const result = await getMenuItemRatingStats('menu-item-123')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to fetch rating stats')
    })
  })

  describe('createReview', () => {
    it('should create a review successfully', async () => {
      const reviewData = { rating: 5, comment: 'Amazing dish!' }
      const mockResponse = { id: 'review-123', ...reviewData, userName: 'John' }
      apiClient.post.mockResolvedValue({ data: { data: mockResponse } })

      const result = await createReview('menu-item-123', reviewData)

      expect(apiClient.post).toHaveBeenCalledWith('/menu/menu-item-123/review', reviewData)
      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockResponse)
    })

    it('should handle response.data directly', async () => {
      const reviewData = { rating: 4, comment: 'Good' }
      const mockResponse = { id: 'review-456', ...reviewData }
      apiClient.post.mockResolvedValue({ data: mockResponse })

      const result = await createReview('menu-item-123', reviewData)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockResponse)
    })

    it('should handle error with code and details', async () => {
      apiClient.post.mockRejectedValue({
        response: {
          data: {
            error: 'Already reviewed',
            code: 'ALREADY_REVIEWED',
            details: { existingReviewId: 'review-789' }
          }
        }
      })

      const result = await createReview('menu-item-123', { rating: 5 })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Already reviewed')
      expect(result.code).toBe('ALREADY_REVIEWED')
      expect(result.details).toEqual({ existingReviewId: 'review-789' })
    })

    it('should handle generic error', async () => {
      apiClient.post.mockRejectedValue(new Error('Network error'))

      const result = await createReview('menu-item-123', { rating: 5 })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to create review')
    })
  })

  describe('updateReview', () => {
    it('should update a review successfully', async () => {
      const reviewData = { rating: 4, comment: 'Updated comment' }
      const mockResponse = { id: 'review-123', ...reviewData }
      apiClient.put.mockResolvedValue({ data: { data: mockResponse } })

      const result = await updateReview('review-123', reviewData)

      expect(apiClient.put).toHaveBeenCalledWith('/review/review-123', reviewData)
      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockResponse)
    })

    it('should handle response.data directly', async () => {
      const reviewData = { rating: 3, comment: 'Changed my mind' }
      const mockResponse = { id: 'review-123', ...reviewData }
      apiClient.put.mockResolvedValue({ data: mockResponse })

      const result = await updateReview('review-123', reviewData)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockResponse)
    })

    it('should handle error with custom message', async () => {
      apiClient.put.mockRejectedValue({
        response: { data: { error: 'Review not found' } }
      })

      const result = await updateReview('invalid-id', { rating: 5 })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Review not found')
    })

    it('should handle generic error', async () => {
      apiClient.put.mockRejectedValue(new Error('Network error'))

      const result = await updateReview('review-123', { rating: 5 })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to update review')
    })
  })

  describe('deleteReview', () => {
    it('should delete a review successfully', async () => {
      apiClient.delete.mockResolvedValue({})

      const result = await deleteReview('review-123')

      expect(apiClient.delete).toHaveBeenCalledWith('/review/review-123')
      expect(result.success).toBe(true)
    })

    it('should handle error with custom message', async () => {
      apiClient.delete.mockRejectedValue({
        response: { data: { error: 'Not authorized to delete' } }
      })

      const result = await deleteReview('review-123')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Not authorized to delete')
    })

    it('should handle generic error', async () => {
      apiClient.delete.mockRejectedValue(new Error('Network error'))

      const result = await deleteReview('review-123')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to delete review')
    })
  })
})
