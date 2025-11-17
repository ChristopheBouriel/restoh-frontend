import { useState } from 'react'
import StarRating from '../common/StarRating'

/**
 * AddReviewForm component - Form to add or edit a review
 * @param {Object} initialReview - Initial review data for editing (optional)
 * @param {function} onSubmit - Callback when form is submitted
 * @param {function} onCancel - Callback when form is cancelled
 * @param {boolean} isSubmitting - Whether the form is currently submitting
 */
const AddReviewForm = ({ initialReview, onSubmit, onCancel, isSubmitting = false }) => {
  const [rating, setRating] = useState(initialReview?.rating || 0)
  const [comment, setComment] = useState(initialReview?.comment || '')
  const [errors, setErrors] = useState({})

  const isEditing = !!initialReview

  const validate = () => {
    const newErrors = {}

    if (rating === 0) {
      newErrors.rating = 'Please select a rating'
    }

    if (comment.trim().length < 10) {
      newErrors.comment = 'Comment must be at least 10 characters'
    }

    if (comment.trim().length > 500) {
      newErrors.comment = 'Comment must not exceed 500 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    onSubmit({
      rating,
      comment: comment.trim()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Rating */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your Rating *
        </label>
        <StarRating
          rating={rating}
          onChange={setRating}
          size="lg"
          showRating
        />
        {errors.rating && (
          <p className="mt-1 text-sm text-red-600">{errors.rating}</p>
        )}
      </div>

      {/* Comment */}
      <div>
        <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
          Your Review *
        </label>
        <textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="Share your experience with this dish..."
          disabled={isSubmitting}
        />
        <div className="flex justify-between items-center mt-1">
          <div>
            {errors.comment && (
              <p className="text-sm text-red-600">{errors.comment}</p>
            )}
          </div>
          <p className="text-xs text-gray-500">
            {comment.length}/500 characters
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting || rating === 0}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {isEditing ? 'Updating...' : 'Submitting...'}
            </span>
          ) : (
            isEditing ? 'Update Review' : 'Submit Review'
          )}
        </button>
      </div>
    </form>
  )
}

export default AddReviewForm
