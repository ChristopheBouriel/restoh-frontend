import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RestaurantReviewCard from '../../../components/restaurant-reviews/RestaurantReviewCard'

vi.mock('../../../components/common/StarRating', () => ({
  default: ({ rating }) => <div data-testid="star-rating">{rating} stars</div>
}))

describe('RestaurantReviewCard', () => {
  const mockReview = {
    id: 'review-123',
    ratings: { overall: 5 },
    comment: 'Excellent restaurant!',
    createdAt: '2024-12-15T10:30:00Z',
    updatedAt: '2024-12-15T10:30:00Z',
    user: { id: 'user-1', name: 'Jane Smith' }
  }

  const mockOnEdit = vi.fn()
  const mockOnDelete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should display user name and comment', () => {
    render(<RestaurantReviewCard review={mockReview} />)

    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.getByText('Excellent restaurant!')).toBeInTheDocument()
  })

  it('should display overall rating from ratings object', () => {
    render(<RestaurantReviewCard review={mockReview} />)

    expect(screen.getByTestId('star-rating')).toHaveTextContent('5 stars')
  })

  it('should handle missing ratings gracefully', () => {
    render(<RestaurantReviewCard review={{ ...mockReview, ratings: null }} />)

    expect(screen.getByTestId('star-rating')).toHaveTextContent('0 stars')
  })

  it('should call onEdit with review when edit button clicked', async () => {
    const user = userEvent.setup()
    render(
      <RestaurantReviewCard
        review={mockReview}
        canEdit
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )

    await user.click(screen.getByTitle('Edit review'))

    expect(mockOnEdit).toHaveBeenCalledWith(mockReview)
  })

  it('should call onDelete with review id when delete button clicked', async () => {
    const user = userEvent.setup()
    render(
      <RestaurantReviewCard
        review={mockReview}
        canDelete
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )

    await user.click(screen.getByTitle('Delete review'))

    expect(mockOnDelete).toHaveBeenCalledWith('review-123')
  })
})
