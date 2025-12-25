import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ReviewCard from '../../../components/reviews/ReviewCard'

vi.mock('../../../components/common/StarRating', () => ({
  default: ({ rating }) => <div data-testid="star-rating">{rating} stars</div>
}))

describe('ReviewCard', () => {
  const mockReview = {
    id: 'review-123',
    rating: 4,
    comment: 'Great dish!',
    createdAt: '2024-12-15T10:30:00Z',
    updatedAt: '2024-12-15T10:30:00Z',
    user: { id: 'user-1', name: 'John Doe' }
  }

  const mockOnEdit = vi.fn()
  const mockOnDelete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should display user name and comment', () => {
    render(<ReviewCard review={mockReview} />)

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Great dish!')).toBeInTheDocument()
  })

  it('should display "Anonymous User" when no user name', () => {
    render(<ReviewCard review={{ ...mockReview, user: null }} />)

    expect(screen.getByText('Anonymous User')).toBeInTheDocument()
  })

  it('should show "Edited on" when updatedAt differs from createdAt', () => {
    render(<ReviewCard review={{ ...mockReview, updatedAt: '2024-12-20T15:00:00Z' }} />)

    expect(screen.getByText(/Edited on/)).toBeInTheDocument()
  })

  it('should call onEdit with review when edit button clicked', async () => {
    const user = userEvent.setup()
    render(
      <ReviewCard review={mockReview} canEdit onEdit={mockOnEdit} onDelete={mockOnDelete} />
    )

    await user.click(screen.getByTitle('Edit review'))

    expect(mockOnEdit).toHaveBeenCalledWith(mockReview)
  })

  it('should call onDelete with review id when delete button clicked', async () => {
    const user = userEvent.setup()
    render(
      <ReviewCard review={mockReview} canDelete onEdit={mockOnEdit} onDelete={mockOnDelete} />
    )

    await user.click(screen.getByTitle('Delete review'))

    expect(mockOnDelete).toHaveBeenCalledWith('review-123')
  })

  it('should not show action buttons when canEdit and canDelete are false', () => {
    render(<ReviewCard review={mockReview} />)

    expect(screen.queryByTitle('Edit review')).not.toBeInTheDocument()
    expect(screen.queryByTitle('Delete review')).not.toBeInTheDocument()
  })
})
