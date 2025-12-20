import { Link } from 'react-router-dom'
import { Star, MessageSquare } from 'lucide-react'
import StarRating from '../common/StarRating'

/**
 * RestaurantStats component - Display restaurant rating statistics
 * Widget for Home page showing overall rating and review count
 * @param {Object} stats - Rating statistics
 * @param {boolean} showLink - Show "See all reviews" link
 * @param {boolean} compact - Compact mode for smaller displays
 * @param {boolean} hideTitle - Hide title and all links/buttons (for Home page version)
 */
const RestaurantStats = ({ stats, showLink = true, compact = false, hideTitle = false }) => {
  const { totalReviews = 0, overallRating = 0, overallCount = 0 } = stats || {}

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <StarRating rating={overallRating} size="sm" readonly showRating />
        <span className="text-sm text-gray-600">
          ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
        </span>
      </div>
    )
  }

  // Minimal version for Home page (no title, no buttons)
  if (hideTitle) {
    return (
      <div className="bg-white rounded-lg p-6 border border-primary-600" style={{ boxShadow: 'inset 0 2px 6px rgba(234, 88, 12, 0.3)' }}>
        {totalReviews > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Star className="w-8 h-8 fill-yellow-400 text-yellow-400" />
                  <span className="text-4xl font-bold text-gray-900">
                    {overallRating.toFixed(1)}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  <p className="font-medium">out of 5</p>
                  <p>{totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <StarRating rating={overallRating} size="md" readonly />
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No reviews yet</p>
          </div>
        )}
      </div>
    )
  }

  // Full version with title and links
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary-600" />
          Customer Reviews
        </h3>
        {showLink && totalReviews > 0 && (
          <Link
            to="/reviews"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            See all reviews →
          </Link>
        )}
      </div>

      {totalReviews > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Star className="w-8 h-8 fill-yellow-400 text-yellow-400" />
                <span className="text-4xl font-bold text-gray-900">
                  {overallRating.toFixed(1)}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                <p className="font-medium">out of 5</p>
                <p>{totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}</p>
              </div>
            </div>
          </div>

          <div>
            <StarRating rating={overallRating} size="md" readonly />
          </div>

          {showLink && (
            <Link
              to="/reviews"
              className="block w-full py-2 text-center bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors font-medium text-sm"
            >
              Write a Review
            </Link>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 mb-4">No reviews yet</p>
          {showLink && (
            <Link
              to="/reviews"
              className="inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium text-sm"
            >
              Be the first to review
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

export default RestaurantStats
