import { Edit, Trash2, User } from 'lucide-react'
import StarRating from '../common/StarRating'

/**
 * RestaurantReviewCard component - Display a single restaurant review
 * @param {Object} review - Review data
 * @param {boolean} canEdit - Can the current user edit this review
 * @param {boolean} canDelete - Can the current user delete this review
 * @param {function} onEdit - Callback for edit action
 * @param {function} onDelete - Callback for delete action
 */
const RestaurantReviewCard = ({ review, canEdit = false, canDelete = false, onEdit, onDelete }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getUserName = () => {
    return review.user?.name || 'Anonymous User'
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">
              {getUserName()}
            </p>
            <p className="text-sm text-gray-500">{formatDate(review.createdAt)}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <StarRating rating={review.ratings?.overall || 0} size="sm" readonly />
          {(canEdit || canDelete) && (
            <div className="flex items-center space-x-1 ml-3">
              {canEdit && (
                <button
                  onClick={() => onEdit(review)}
                  className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="Edit review"
                >
                  <Edit className="w-4 h-4" />
                </button>
              )}
              {canDelete && (
                <button
                  onClick={() => onDelete(review._id)}
                  className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Delete review"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {review.comment && (
        <p className="text-gray-700 leading-relaxed">{review.comment}</p>
      )}

      {review.updatedAt && review.updatedAt !== review.createdAt && (
        <p className="text-xs text-gray-400 mt-2 italic">
          Edited on {formatDate(review.updatedAt)}
        </p>
      )}
    </div>
  )
}

export default RestaurantReviewCard
