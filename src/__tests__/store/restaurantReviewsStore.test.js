import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act } from '@testing-library/react'
import useRestaurantReviewsStore from '../../store/restaurantReviewsStore'
import * as restaurantReviewsApi from '../../api/restaurantReviewsApi'

vi.mock('../../api/restaurantReviewsApi')

describe('Restaurant Reviews Store', () => {
  const mockReviews = [
    { id: 'review-1', ratings: { overall: 5 }, comment: 'Great restaurant!', user: { id: 'user-1' } },
    { id: 'review-2', ratings: { overall: 4 }, comment: 'Very nice', user: { id: 'user-2' } }
  ]

  const mockStats = {
    totalReviews: 150,
    overallRating: 4.5,
    overallCount: 150,
    ratings: { overall: { average: 4.5, count: 150 } }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    act(() => {
      useRestaurantReviewsStore.setState({
        reviews: [],
        stats: { totalReviews: 0, overallRating: 0, overallCount: 0, ratings: {} },
        pagination: { currentPage: 1, totalPages: 1, limit: 10, total: 0 },
        isLoading: false,
        error: null
      })
    })
  })

  describe('fetchReviews', () => {
    it('should fetch reviews with pagination and update store', async () => {
      restaurantReviewsApi.getRestaurantReviews.mockResolvedValue({
        success: true,
        data: { reviews: mockReviews, total: 50, pagination: { next: 2 } }
      })

      let result
      await act(async () => {
        result = await useRestaurantReviewsStore.getState().fetchReviews(1, 10)
      })

      expect(restaurantReviewsApi.getRestaurantReviews).toHaveBeenCalledWith(1, 10)
      expect(result.reviews).toEqual(mockReviews)
      expect(useRestaurantReviewsStore.getState().reviews).toEqual(mockReviews)
      expect(useRestaurantReviewsStore.getState().pagination.totalPages).toBe(5) // ceil(50/10)
    })

    it('should handle error', async () => {
      restaurantReviewsApi.getRestaurantReviews.mockResolvedValue({
        success: false,
        error: 'Service unavailable'
      })

      let result
      await act(async () => {
        result = await useRestaurantReviewsStore.getState().fetchReviews()
      })

      expect(result.success).toBe(false)
      expect(useRestaurantReviewsStore.getState().error).toBe('Service unavailable')
    })
  })

  describe('fetchStats', () => {
    it('should fetch stats and update store', async () => {
      restaurantReviewsApi.getRestaurantRating.mockResolvedValue({
        success: true,
        data: mockStats
      })

      let result
      await act(async () => {
        result = await useRestaurantReviewsStore.getState().fetchStats()
      })

      expect(result.stats).toEqual(mockStats)
      expect(useRestaurantReviewsStore.getState().stats).toEqual(mockStats)
    })
  })

  describe('createReview', () => {
    it('should create review and refresh both reviews and stats', async () => {
      const newReview = { id: 'review-new', ratings: { overall: 5 } }
      restaurantReviewsApi.createRestaurantReview.mockResolvedValue({ success: true, data: newReview })
      restaurantReviewsApi.getRestaurantReviews.mockResolvedValue({
        success: true,
        data: { reviews: [newReview, ...mockReviews], total: 51 }
      })
      restaurantReviewsApi.getRestaurantRating.mockResolvedValue({ success: true, data: mockStats })

      let result
      await act(async () => {
        result = await useRestaurantReviewsStore.getState().createReview({ ratings: { overall: 5 } })
      })

      expect(restaurantReviewsApi.createRestaurantReview).toHaveBeenCalledWith({ ratings: { overall: 5 } })
      expect(result.success).toBe(true)
      expect(restaurantReviewsApi.getRestaurantReviews).toHaveBeenCalled()
      expect(restaurantReviewsApi.getRestaurantRating).toHaveBeenCalled()
    })

    it('should return error code and details on failure', async () => {
      restaurantReviewsApi.createRestaurantReview.mockResolvedValue({
        success: false,
        error: 'Already reviewed',
        code: 'REVIEW_LIMIT_REACHED',
        details: { nextAvailableDate: '2025-01-01' }
      })

      let result
      await act(async () => {
        result = await useRestaurantReviewsStore.getState().createReview({ ratings: { overall: 5 } })
      })

      expect(result.code).toBe('REVIEW_LIMIT_REACHED')
      expect(result.details).toEqual({ nextAvailableDate: '2025-01-01' })
    })
  })

  describe('updateReview', () => {
    beforeEach(() => {
      act(() => {
        useRestaurantReviewsStore.setState({ reviews: mockReviews })
      })
    })

    it('should update review in store and refresh stats', async () => {
      const updatedReview = { ...mockReviews[0], comment: 'Updated!' }
      restaurantReviewsApi.updateRestaurantReview.mockResolvedValue({ success: true, data: updatedReview })
      restaurantReviewsApi.getRestaurantRating.mockResolvedValue({ success: true, data: mockStats })

      let result
      await act(async () => {
        result = await useRestaurantReviewsStore.getState().updateReview('review-1', { comment: 'Updated!' })
      })

      expect(result.success).toBe(true)
      expect(useRestaurantReviewsStore.getState().reviews[0].comment).toBe('Updated!')
      expect(restaurantReviewsApi.getRestaurantRating).toHaveBeenCalled()
    })
  })

  describe('deleteReview', () => {
    beforeEach(() => {
      act(() => {
        useRestaurantReviewsStore.setState({ reviews: mockReviews })
      })
    })

    it('should delete review from store and refresh stats', async () => {
      restaurantReviewsApi.deleteRestaurantReview.mockResolvedValue({ success: true })
      restaurantReviewsApi.getRestaurantRating.mockResolvedValue({ success: true, data: mockStats })

      await act(async () => {
        await useRestaurantReviewsStore.getState().deleteReview('review-1')
      })

      expect(useRestaurantReviewsStore.getState().reviews).toHaveLength(1)
      expect(useRestaurantReviewsStore.getState().reviews.find(r => r.id === 'review-1')).toBeUndefined()
    })

    it('should not modify store on error', async () => {
      restaurantReviewsApi.deleteRestaurantReview.mockResolvedValue({ success: false, error: 'Not authorized' })

      await act(async () => {
        await useRestaurantReviewsStore.getState().deleteReview('review-1')
      })

      expect(useRestaurantReviewsStore.getState().reviews).toHaveLength(2)
    })
  })

  describe('getUserReview', () => {
    it('should find user review by user id', () => {
      act(() => {
        useRestaurantReviewsStore.setState({ reviews: mockReviews })
      })

      const review = useRestaurantReviewsStore.getState().getUserReview('user-1')
      expect(review).toEqual(mockReviews[0])
    })

    it('should return undefined if not found', () => {
      act(() => {
        useRestaurantReviewsStore.setState({ reviews: mockReviews })
      })

      const review = useRestaurantReviewsStore.getState().getUserReview('user-999')
      expect(review).toBeUndefined()
    })
  })
})
