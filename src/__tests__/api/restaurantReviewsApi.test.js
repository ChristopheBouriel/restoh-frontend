import { describe, it, expect, vi, beforeEach } from 'vitest'
import apiClient from '../../api/apiClient'
import {
  getRestaurantReviews,
  getRestaurantRating,
  createRestaurantReview,
  updateRestaurantReview,
  deleteRestaurantReview
} from '../../api/restaurantReviewsApi'

vi.mock('../../api/apiClient')

describe('Restaurant Reviews API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getRestaurantReviews', () => {
    it('should fetch restaurant reviews with default pagination', async () => {
      const mockResponse = {
        data: [
          { id: '1', ratings: { overall: 5 }, comment: 'Great restaurant!' },
          { id: '2', ratings: { overall: 4 }, comment: 'Very nice' }
        ],
        count: 2,
        total: 50,
        pagination: { page: 1, limit: 10, totalPages: 5 }
      }
      apiClient.get.mockResolvedValue(mockResponse)

      const result = await getRestaurantReviews()

      expect(apiClient.get).toHaveBeenCalledWith('/restaurant/reviews?page=1&limit=10')
      expect(result.success).toBe(true)
      expect(result.data.reviews).toHaveLength(2)
      expect(result.data.total).toBe(50)
    })

    it('should fetch restaurant reviews with custom pagination', async () => {
      apiClient.get.mockResolvedValue({ data: [], count: 0, total: 0 })

      await getRestaurantReviews(3, 20)

      expect(apiClient.get).toHaveBeenCalledWith('/restaurant/reviews?page=3&limit=20')
    })

    it('should handle empty response with defaults', async () => {
      apiClient.get.mockResolvedValue({})

      const result = await getRestaurantReviews()

      expect(result.success).toBe(true)
      expect(result.data.reviews).toEqual([])
      expect(result.data.count).toBe(0)
      expect(result.data.total).toBe(0)
      expect(result.data.pagination).toBeNull()
    })

    it('should handle error with custom message', async () => {
      apiClient.get.mockRejectedValue({
        response: { data: { error: 'Service unavailable' } }
      })

      const result = await getRestaurantReviews()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Service unavailable')
    })

    it('should handle generic error', async () => {
      apiClient.get.mockRejectedValue(new Error('Network error'))

      const result = await getRestaurantReviews()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to fetch restaurant reviews')
    })
  })

  describe('getRestaurantRating', () => {
    it('should fetch restaurant rating and round to nearest 0.5', async () => {
      apiClient.get.mockResolvedValue({
        data: {
          totalReviews: 150,
          ratings: {
            overall: { average: 4.3, count: 150 },
            food: { average: 4.5, count: 100 },
            service: { average: 4.1, count: 80 }
          }
        }
      })

      const result = await getRestaurantRating()

      expect(apiClient.get).toHaveBeenCalledWith('/restaurant/rating')
      expect(result.success).toBe(true)
      expect(result.data.totalReviews).toBe(150)
      expect(result.data.overallRating).toBe(4.5) // 4.3 rounds to 4.5
      expect(result.data.overallCount).toBe(150)
      expect(result.data.ratings).toBeDefined()
    })

    it('should round 3.2 to 3.0', async () => {
      apiClient.get.mockResolvedValue({
        data: {
          totalReviews: 10,
          ratings: { overall: { average: 3.2, count: 10 } }
        }
      })

      const result = await getRestaurantRating()

      expect(result.data.overallRating).toBe(3.0)
    })

    it('should round 4.75 to 5.0', async () => {
      apiClient.get.mockResolvedValue({
        data: {
          totalReviews: 5,
          ratings: { overall: { average: 4.75, count: 5 } }
        }
      })

      const result = await getRestaurantRating()

      expect(result.data.overallRating).toBe(5.0)
    })

    it('should handle missing data with defaults', async () => {
      apiClient.get.mockResolvedValue({ data: {} })

      const result = await getRestaurantRating()

      expect(result.success).toBe(true)
      expect(result.data.totalReviews).toBe(0)
      expect(result.data.overallRating).toBe(0)
      expect(result.data.overallCount).toBe(0)
    })

    it('should handle missing ratings object', async () => {
      apiClient.get.mockResolvedValue({
        data: { totalReviews: 0 }
      })

      const result = await getRestaurantRating()

      expect(result.data.overallRating).toBe(0)
      expect(result.data.ratings).toEqual({})
    })

    it('should handle error with custom message', async () => {
      apiClient.get.mockRejectedValue({
        response: { data: { error: 'Rating service down' } }
      })

      const result = await getRestaurantRating()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Rating service down')
    })

    it('should handle generic error', async () => {
      apiClient.get.mockRejectedValue(new Error('Network error'))

      const result = await getRestaurantRating()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to fetch restaurant rating')
    })
  })

  describe('createRestaurantReview', () => {
    it('should create a restaurant review successfully', async () => {
      const reviewData = {
        ratings: { overall: 5 },
        comment: 'Fantastic experience!',
        visitDate: '2024-12-20'
      }
      const mockResponse = { id: 'review-123', ...reviewData, userName: 'John' }
      apiClient.post.mockResolvedValue({ data: mockResponse })

      const result = await createRestaurantReview(reviewData)

      expect(apiClient.post).toHaveBeenCalledWith('/restaurant/review', reviewData)
      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockResponse)
    })

    it('should handle error with code and details', async () => {
      apiClient.post.mockRejectedValue({
        response: {
          data: {
            error: 'Already reviewed this month',
            code: 'REVIEW_LIMIT_REACHED',
            details: { nextAvailableDate: '2025-01-01' }
          }
        }
      })

      const result = await createRestaurantReview({ ratings: { overall: 5 } })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Already reviewed this month')
      expect(result.code).toBe('REVIEW_LIMIT_REACHED')
      expect(result.details).toEqual({ nextAvailableDate: '2025-01-01' })
    })

    it('should handle generic error', async () => {
      apiClient.post.mockRejectedValue(new Error('Network error'))

      const result = await createRestaurantReview({ ratings: { overall: 5 } })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to create restaurant review')
    })
  })

  describe('updateRestaurantReview', () => {
    it('should update a restaurant review successfully', async () => {
      const reviewData = {
        ratings: { overall: 4 },
        comment: 'Updated: Still great but minor issues'
      }
      const mockResponse = { id: 'review-123', ...reviewData }
      apiClient.put.mockResolvedValue({ data: mockResponse })

      const result = await updateRestaurantReview('review-123', reviewData)

      expect(apiClient.put).toHaveBeenCalledWith('/restaurant/review/review-123', reviewData)
      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockResponse)
    })

    it('should handle error with code', async () => {
      apiClient.put.mockRejectedValue({
        response: {
          data: {
            error: 'Review not found',
            code: 'REVIEW_NOT_FOUND'
          }
        }
      })

      const result = await updateRestaurantReview('invalid-id', { ratings: { overall: 5 } })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Review not found')
      expect(result.code).toBe('REVIEW_NOT_FOUND')
    })

    it('should handle generic error', async () => {
      apiClient.put.mockRejectedValue(new Error('Network error'))

      const result = await updateRestaurantReview('review-123', { ratings: { overall: 5 } })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to update restaurant review')
    })
  })

  describe('deleteRestaurantReview', () => {
    it('should delete a restaurant review successfully', async () => {
      apiClient.delete.mockResolvedValue({})

      const result = await deleteRestaurantReview('review-123')

      expect(apiClient.delete).toHaveBeenCalledWith('/restaurant/review/review-123')
      expect(result.success).toBe(true)
    })

    it('should handle error with code', async () => {
      apiClient.delete.mockRejectedValue({
        response: {
          data: {
            error: 'Not authorized',
            code: 'UNAUTHORIZED'
          }
        }
      })

      const result = await deleteRestaurantReview('review-123')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Not authorized')
      expect(result.code).toBe('UNAUTHORIZED')
    })

    it('should handle generic error', async () => {
      apiClient.delete.mockRejectedValue(new Error('Network error'))

      const result = await deleteRestaurantReview('review-123')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to delete restaurant review')
    })
  })
})
