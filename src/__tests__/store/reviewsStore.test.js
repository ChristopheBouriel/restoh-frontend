import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act } from '@testing-library/react'
import useReviewsStore from '../../store/reviewsStore'
import * as reviewsApi from '../../api/reviewsApi'

vi.mock('../../api/reviewsApi')

describe('Reviews Store', () => {
  const mockReviews = [
    { id: 'review-1', rating: 5, comment: 'Excellent!', userId: 'user-1', menuItemId: 'item-1' },
    { id: 'review-2', rating: 4, comment: 'Very good', userId: 'user-2', menuItemId: 'item-1' }
  ]

  const mockStats = { averageRating: 4.5, reviewCount: 15 }

  beforeEach(() => {
    vi.clearAllMocks()
    act(() => {
      useReviewsStore.setState({
        reviews: {},
        stats: {},
        isLoading: false,
        error: null
      })
    })
  })

  describe('fetchMenuItemReviews', () => {
    it('should fetch reviews and update store', async () => {
      reviewsApi.getMenuItemReviews.mockResolvedValue({
        success: true,
        data: mockReviews
      })

      let result
      await act(async () => {
        result = await useReviewsStore.getState().fetchMenuItemReviews('item-1')
      })

      expect(reviewsApi.getMenuItemReviews).toHaveBeenCalledWith('item-1')
      expect(result.success).toBe(true)
      expect(useReviewsStore.getState().reviews['item-1']).toEqual(mockReviews)
    })

    it('should handle null data with empty array default', async () => {
      reviewsApi.getMenuItemReviews.mockResolvedValue({ success: true, data: null })

      await act(async () => {
        await useReviewsStore.getState().fetchMenuItemReviews('item-1')
      })

      expect(useReviewsStore.getState().reviews['item-1']).toEqual([])
    })

    it('should handle error and update store error state', async () => {
      reviewsApi.getMenuItemReviews.mockResolvedValue({
        success: false,
        error: 'Menu item not found'
      })

      let result
      await act(async () => {
        result = await useReviewsStore.getState().fetchMenuItemReviews('invalid-id')
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Menu item not found')
      expect(useReviewsStore.getState().error).toBe('Menu item not found')
    })
  })

  describe('fetchMenuItemRatingStats', () => {
    it('should fetch stats and update store', async () => {
      reviewsApi.getMenuItemRatingStats.mockResolvedValue({
        success: true,
        data: mockStats
      })

      let result
      await act(async () => {
        result = await useReviewsStore.getState().fetchMenuItemRatingStats('item-1')
      })

      expect(reviewsApi.getMenuItemRatingStats).toHaveBeenCalledWith('item-1')
      expect(result.stats).toEqual(mockStats)
      expect(useReviewsStore.getState().stats['item-1']).toEqual(mockStats)
    })

    it('should handle null data with defaults', async () => {
      reviewsApi.getMenuItemRatingStats.mockResolvedValue({ success: true, data: null })

      await act(async () => {
        await useReviewsStore.getState().fetchMenuItemRatingStats('item-1')
      })

      expect(useReviewsStore.getState().stats['item-1']).toEqual({
        averageRating: 0,
        reviewCount: 0
      })
    })
  })

  describe('createReview', () => {
    it('should create review, prepend to list, and refresh stats', async () => {
      act(() => {
        useReviewsStore.setState({ reviews: { 'item-1': mockReviews } })
      })

      const newReview = { id: 'review-new', rating: 5, comment: 'Amazing!', menuItemId: 'item-1' }
      reviewsApi.createReview.mockResolvedValue({ success: true, data: newReview })
      reviewsApi.getMenuItemRatingStats.mockResolvedValue({ success: true, data: mockStats })

      let result
      await act(async () => {
        result = await useReviewsStore.getState().createReview('item-1', { rating: 5, comment: 'Amazing!' })
      })

      expect(reviewsApi.createReview).toHaveBeenCalledWith('item-1', { rating: 5, comment: 'Amazing!' })
      expect(result.success).toBe(true)

      const reviews = useReviewsStore.getState().reviews['item-1']
      expect(reviews[0]).toEqual(newReview) // Prepended
      expect(reviews.length).toBe(3)

      expect(reviewsApi.getMenuItemRatingStats).toHaveBeenCalledWith('item-1')
    })

    it('should return error code and details on failure', async () => {
      reviewsApi.createReview.mockResolvedValue({
        success: false,
        error: 'Already reviewed',
        code: 'ALREADY_REVIEWED',
        details: { existingReviewId: 'review-789' }
      })

      let result
      await act(async () => {
        result = await useReviewsStore.getState().createReview('item-1', { rating: 5 })
      })

      expect(result.success).toBe(false)
      expect(result.code).toBe('ALREADY_REVIEWED')
      expect(result.details).toEqual({ existingReviewId: 'review-789' })
    })
  })

  describe('updateReview', () => {
    beforeEach(() => {
      act(() => {
        useReviewsStore.setState({ reviews: { 'item-1': mockReviews } })
      })
    })

    it('should update review in store and refresh stats', async () => {
      const updatedReview = { ...mockReviews[0], comment: 'Updated!', menuItemId: 'item-1' }
      reviewsApi.updateReview.mockResolvedValue({ success: true, data: updatedReview })
      reviewsApi.getMenuItemRatingStats.mockResolvedValue({ success: true, data: mockStats })

      let result
      await act(async () => {
        result = await useReviewsStore.getState().updateReview('review-1', { comment: 'Updated!' })
      })

      expect(reviewsApi.updateReview).toHaveBeenCalledWith('review-1', { comment: 'Updated!' })
      expect(result.success).toBe(true)
      expect(useReviewsStore.getState().reviews['item-1'][0].comment).toBe('Updated!')
      expect(reviewsApi.getMenuItemRatingStats).toHaveBeenCalledWith('item-1')
    })

    it('should not refresh stats if response has no menuItemId', async () => {
      const updatedReview = { id: 'review-1', rating: 5, comment: 'Updated!', userId: 'user-1' }
      reviewsApi.updateReview.mockResolvedValue({ success: true, data: updatedReview })

      await act(async () => {
        await useReviewsStore.getState().updateReview('review-1', { comment: 'Updated!' })
      })

      expect(reviewsApi.getMenuItemRatingStats).not.toHaveBeenCalled()
    })

    it('should handle error', async () => {
      reviewsApi.updateReview.mockResolvedValue({ success: false, error: 'Review not found' })

      let result
      await act(async () => {
        result = await useReviewsStore.getState().updateReview('invalid-id', { rating: 5 })
      })

      expect(result.success).toBe(false)
      expect(useReviewsStore.getState().error).toBe('Review not found')
    })
  })

  describe('deleteReview', () => {
    beforeEach(() => {
      act(() => {
        useReviewsStore.setState({ reviews: { 'item-1': mockReviews } })
      })
    })

    it('should delete review from store and refresh stats', async () => {
      reviewsApi.deleteReview.mockResolvedValue({ success: true })
      reviewsApi.getMenuItemRatingStats.mockResolvedValue({ success: true, data: mockStats })

      let result
      await act(async () => {
        result = await useReviewsStore.getState().deleteReview('review-1', 'item-1')
      })

      expect(reviewsApi.deleteReview).toHaveBeenCalledWith('review-1')
      expect(result.success).toBe(true)
      expect(useReviewsStore.getState().reviews['item-1']).toHaveLength(1)
      expect(useReviewsStore.getState().reviews['item-1'].find(r => r.id === 'review-1')).toBeUndefined()
    })

    it('should not modify store on error', async () => {
      reviewsApi.deleteReview.mockResolvedValue({ success: false, error: 'Not authorized' })

      await act(async () => {
        await useReviewsStore.getState().deleteReview('review-1', 'item-1')
      })

      expect(useReviewsStore.getState().reviews['item-1']).toHaveLength(2)
    })
  })

  describe('Getters', () => {
    beforeEach(() => {
      act(() => {
        useReviewsStore.setState({
          reviews: { 'item-1': mockReviews },
          stats: { 'item-1': mockStats }
        })
      })
    })

    it('getUserReviewForMenuItem should find user review', () => {
      const review = useReviewsStore.getState().getUserReviewForMenuItem('item-1', 'user-1')
      expect(review).toEqual(mockReviews[0])
    })

    it('getUserReviewForMenuItem should return undefined if not found', () => {
      const review = useReviewsStore.getState().getUserReviewForMenuItem('item-1', 'user-999')
      expect(review).toBeUndefined()
    })
  })
})
