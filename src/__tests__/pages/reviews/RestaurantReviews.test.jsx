import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import RestaurantReviews from '../../../pages/reviews/RestaurantReviews'
import useRestaurantReviewsStore from '../../../store/restaurantReviewsStore'
import useAuthStore from '../../../store/authStore'
import toast from 'react-hot-toast'

vi.mock('../../../store/restaurantReviewsStore')
vi.mock('../../../store/authStore')
vi.mock('react-hot-toast')

const mockScrollTo = vi.fn()
Object.defineProperty(window, 'scrollTo', { value: mockScrollTo, writable: true })

const mockConfirm = vi.fn(() => true)
Object.defineProperty(window, 'confirm', { value: mockConfirm, writable: true })

vi.mock('../../../components/restaurant-reviews/RestaurantReviewCard', () => ({
  default: ({ review, canEdit, canDelete, onEdit, onDelete }) => (
    <div data-testid={`review-card-${review.id}`}>
      <span>{review.comment}</span>
      {canEdit && <button onClick={() => onEdit(review)} data-testid={`edit-${review.id}`}>Edit</button>}
      {canDelete && <button onClick={() => onDelete(review.id)} data-testid={`delete-${review.id}`}>Delete</button>}
    </div>
  )
}))

vi.mock('../../../components/restaurant-reviews/RestaurantReviewForm', () => ({
  default: ({ initialReview, onSubmit, onCancel }) => (
    <div data-testid="review-form">
      <span>{initialReview ? 'Editing' : 'Creating'}</span>
      <button onClick={() => onSubmit({ ratings: { overall: 5 }, comment: 'Test' })} data-testid="submit-review">Submit</button>
      <button onClick={onCancel} data-testid="cancel-review">Cancel</button>
    </div>
  )
}))

vi.mock('../../../components/restaurant-reviews/RestaurantStats', () => ({
  default: () => null
}))

describe('RestaurantReviews Page', () => {
  const mockReviews = [
    { id: 'review-1', ratings: { overall: 5 }, comment: 'Excellent!', user: { id: 'user-1', name: 'John' } },
    { id: 'review-2', ratings: { overall: 4 }, comment: 'Very good', user: { id: 'user-2', name: 'Jane' } }
  ]

  const mockFetchReviews = vi.fn().mockResolvedValue({ success: true })
  const mockFetchStats = vi.fn().mockResolvedValue({ success: true })
  const mockCreateReview = vi.fn()
  const mockUpdateReview = vi.fn()
  const mockDeleteReview = vi.fn()
  const mockGetUserReview = vi.fn(() => null)

  const defaultStore = {
    reviews: mockReviews,
    stats: { totalReviews: 50 },
    pagination: { currentPage: 1, totalPages: 5, limit: 10, total: 50 },
    isLoading: false,
    fetchReviews: mockFetchReviews,
    fetchStats: mockFetchStats,
    createReview: mockCreateReview,
    updateReview: mockUpdateReview,
    deleteReview: mockDeleteReview,
    getUserReview: mockGetUserReview
  }

  beforeEach(() => {
    vi.clearAllMocks()
    useRestaurantReviewsStore.mockReturnValue(defaultStore)
    useAuthStore.mockReturnValue({ user: null })
  })

  const renderPage = () => render(<BrowserRouter><RestaurantReviews /></BrowserRouter>)

  it('should fetch reviews and stats on mount', () => {
    renderPage()

    expect(mockFetchReviews).toHaveBeenCalledWith(1, 10)
    expect(mockFetchStats).toHaveBeenCalled()
  })

  it('should show login message for guests', () => {
    renderPage()

    expect(screen.getByText('Please login to write a review')).toBeInTheDocument()
  })

  it('should show "Write a Review" button for logged-in user without existing review', () => {
    useAuthStore.mockReturnValue({ user: { id: 'user-3', name: 'New User' } })

    renderPage()

    expect(screen.getByRole('button', { name: 'Write a Review' })).toBeInTheDocument()
  })

  describe('Creating Review', () => {
    beforeEach(() => {
      useAuthStore.mockReturnValue({ user: { id: 'user-3' } })
    })

    it('should show form when clicking Write a Review', async () => {
      const user = userEvent.setup()
      renderPage()

      await user.click(screen.getByRole('button', { name: 'Write a Review' }))

      expect(screen.getByTestId('review-form')).toBeInTheDocument()
      expect(screen.getByText('Creating')).toBeInTheDocument()
    })

    it('should call createReview and show success toast', async () => {
      mockCreateReview.mockResolvedValue({ success: true })
      const user = userEvent.setup()
      renderPage()

      await user.click(screen.getByRole('button', { name: 'Write a Review' }))
      await user.click(screen.getByTestId('submit-review'))

      expect(mockCreateReview).toHaveBeenCalled()
      expect(toast.success).toHaveBeenCalledWith('Review added successfully')
    })

    it('should show error toast on REVIEW_ALREADY_EXISTS', async () => {
      mockCreateReview.mockResolvedValue({ success: false, code: 'REVIEW_ALREADY_EXISTS' })
      const user = userEvent.setup()
      renderPage()

      await user.click(screen.getByRole('button', { name: 'Write a Review' }))
      await user.click(screen.getByTestId('submit-review'))

      expect(toast.error).toHaveBeenCalledWith('You have already reviewed this restaurant')
    })
  })

  describe('User with existing review', () => {
    const userReview = { id: 'review-user', ratings: { overall: 5 }, comment: 'My review', user: { id: 'user-1' } }

    beforeEach(() => {
      useAuthStore.mockReturnValue({ user: { id: 'user-1' } })
      mockGetUserReview.mockReturnValue(userReview)
      useRestaurantReviewsStore.mockReturnValue({
        ...defaultStore,
        reviews: [userReview, ...mockReviews],
        getUserReview: mockGetUserReview
      })
    })

    it('should not show Write a Review button', () => {
      renderPage()

      expect(screen.queryByRole('button', { name: 'Write a Review' })).not.toBeInTheDocument()
    })

    it('should show Your Review section with edit/delete buttons', () => {
      renderPage()

      expect(screen.getByText('Your Review')).toBeInTheDocument()
      expect(screen.getByTestId('edit-review-user')).toBeInTheDocument()
      expect(screen.getByTestId('delete-review-user')).toBeInTheDocument()
    })

    it('should show edit form when clicking edit', async () => {
      const user = userEvent.setup()
      renderPage()

      await user.click(screen.getByTestId('edit-review-user'))

      expect(screen.getByText('Editing')).toBeInTheDocument()
    })

    it('should delete review after confirmation', async () => {
      mockDeleteReview.mockResolvedValue({ success: true })
      const user = userEvent.setup()
      renderPage()

      await user.click(screen.getByTestId('delete-review-user'))

      expect(mockConfirm).toHaveBeenCalled()
      expect(mockDeleteReview).toHaveBeenCalledWith('review-user')
      expect(toast.success).toHaveBeenCalledWith('Review deleted successfully')
    })
  })

  describe('Pagination', () => {
    it('should show pagination controls when multiple pages', () => {
      renderPage()

      expect(screen.getByText('Page 1 of 5')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Previous/ })).toBeDisabled()
      expect(screen.getByRole('button', { name: /Next/ })).toBeEnabled()
    })

    it('should fetch next page when clicking Next', async () => {
      const user = userEvent.setup()
      renderPage()

      await user.click(screen.getByRole('button', { name: /Next/ }))

      expect(mockFetchReviews).toHaveBeenCalledWith(2, 10)
    })
  })

  describe('Empty state', () => {
    it('should show empty message when no reviews', () => {
      useRestaurantReviewsStore.mockReturnValue({
        ...defaultStore,
        reviews: [],
        pagination: { currentPage: 1, totalPages: 1, limit: 10, total: 0 }
      })

      renderPage()

      expect(screen.getByText('No reviews yet')).toBeInTheDocument()
    })
  })
})
