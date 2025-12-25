import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AddReviewForm from '../../../components/reviews/AddReviewForm'

// Mock StarRating
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

describe('AddReviewForm', () => {
  const mockOnSubmit = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  const renderForm = (props = {}) => {
    return render(
      <AddReviewForm
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

    it('should show error for comment over 500 characters', async () => {
      const user = userEvent.setup()
      renderForm()

      await user.click(screen.getByTestId('star-4'))
      await user.type(screen.getByLabelText('Your Review (optional)'), 'a'.repeat(501))
      await user.click(screen.getByRole('button', { name: 'Submit Review' }))

      expect(screen.getByText('Comment must not exceed 500 characters')).toBeInTheDocument()
    })

    it('should allow empty comment (optional field)', async () => {
      const user = userEvent.setup()
      renderForm()

      await user.click(screen.getByTestId('star-5'))
      await user.click(screen.getByRole('button', { name: 'Submit Review' }))

      expect(mockOnSubmit).toHaveBeenCalledWith({ rating: 5, comment: '' })
    })
  })

  describe('Form Submission', () => {
    it('should submit with rating and trimmed comment', async () => {
      const user = userEvent.setup()
      renderForm()

      await user.click(screen.getByTestId('star-4'))
      await user.type(screen.getByLabelText('Your Review (optional)'), '  Great dish, highly recommend!  ')
      await user.click(screen.getByRole('button', { name: 'Submit Review' }))

      expect(mockOnSubmit).toHaveBeenCalledWith({
        rating: 4,
        comment: 'Great dish, highly recommend!'
      })
    })

    it('should call onCancel when cancel is clicked', async () => {
      const user = userEvent.setup()
      renderForm()

      await user.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(mockOnCancel).toHaveBeenCalled()
    })
  })

  describe('Edit Mode', () => {
    it('should pre-fill form with initial values', () => {
      renderForm({ initialReview: { rating: 5, comment: 'Excellent!' } })

      expect(screen.getByTestId('rating-value').textContent).toBe('5.0')
      expect(screen.getByLabelText('Your Review (optional)')).toHaveValue('Excellent!')
      expect(screen.getByRole('button', { name: 'Update Review' })).toBeInTheDocument()
    })

    it('should show "Updating..." when submitting in edit mode', () => {
      renderForm({
        isSubmitting: true,
        initialReview: { rating: 4, comment: 'Original' }
      })

      expect(screen.getByText('Updating...')).toBeInTheDocument()
    })
  })

  describe('Submitting State', () => {
    it('should show "Submitting..." for new review', () => {
      renderForm({ isSubmitting: true })

      expect(screen.getByText('Submitting...')).toBeInTheDocument()
    })

    it('should disable buttons when submitting', () => {
      renderForm({ isSubmitting: true })

      expect(screen.getByLabelText('Your Review (optional)')).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
    })
  })
})
