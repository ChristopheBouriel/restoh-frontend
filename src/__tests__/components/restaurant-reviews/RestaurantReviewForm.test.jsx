import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RestaurantReviewForm from '../../../components/restaurant-reviews/RestaurantReviewForm'

vi.mock('../../../components/common/StarRating', () => ({
  default: ({ rating, onChange, showRating }) => (
    <div data-testid="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange && onChange(star)}
          data-testid={`star-${star}`}
        >
          {star <= rating ? '★' : '☆'}
        </button>
      ))}
      {showRating && <span data-testid="rating-value">{rating.toFixed(1)}</span>}
    </div>
  )
}))

describe('RestaurantReviewForm', () => {
  const mockOnSubmit = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  const renderForm = (props = {}) => {
    return render(
      <RestaurantReviewForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        {...props}
      />
    )
  }

  describe('Validation', () => {
    it('should disable submit when no rating selected', () => {
      renderForm()
      expect(screen.getByRole('button', { name: 'Submit Review' })).toBeDisabled()
    })

    it('should show error for comment less than 10 characters', async () => {
      const user = userEvent.setup()
      renderForm()

      await user.click(screen.getByTestId('star-4'))
      await user.type(screen.getByLabelText('Your Review (optional)'), 'Short')
      await user.click(screen.getByRole('button', { name: 'Submit Review' }))

      expect(screen.getByText('Comment must be at least 10 characters')).toBeInTheDocument()
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('should allow empty comment (sends undefined)', async () => {
      const user = userEvent.setup()
      renderForm()

      await user.click(screen.getByTestId('star-5'))
      await user.click(screen.getByRole('button', { name: 'Submit Review' }))

      expect(mockOnSubmit).toHaveBeenCalledWith({
        ratings: { overall: 5 },
        comment: undefined
      })
    })
  })

  describe('Form Submission', () => {
    it('should submit with ratings object structure and trimmed comment', async () => {
      const user = userEvent.setup()
      renderForm()

      await user.click(screen.getByTestId('star-4'))
      await user.type(screen.getByLabelText('Your Review (optional)'), '  Great restaurant experience!  ')
      await user.click(screen.getByRole('button', { name: 'Submit Review' }))

      expect(mockOnSubmit).toHaveBeenCalledWith({
        ratings: { overall: 4 },
        comment: 'Great restaurant experience!'
      })
    })
  })

  describe('Edit Mode', () => {
    it('should pre-fill form with initial values', () => {
      renderForm({
        initialReview: { ratings: { overall: 5 }, comment: 'Excellent!' }
      })

      expect(screen.getByTestId('rating-value').textContent).toBe('5.0')
      expect(screen.getByLabelText('Your Review (optional)')).toHaveValue('Excellent!')
      expect(screen.getByRole('button', { name: 'Update Review' })).toBeInTheDocument()
    })
  })
})
