import { useEffect, useState } from 'react'
import { MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react'
import useRestaurantReviewsStore from '../../store/restaurantReviewsStore'
import useAuthStore from '../../store/authStore'
import RestaurantReviewCard from '../../components/restaurant-reviews/RestaurantReviewCard'
import RestaurantReviewForm from '../../components/restaurant-reviews/RestaurantReviewForm'
import RestaurantStats from '../../components/restaurant-reviews/RestaurantStats'
import toast from 'react-hot-toast'

const RestaurantReviews = () => {
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [editingReview, setEditingReview] = useState(null)

  const { user } = useAuthStore()
  const {
    reviews,
    stats,
    pagination,
    isLoading,
    fetchReviews,
    fetchStats,
    createReview,
    updateReview,
    deleteReview,
    getUserReview
  } = useRestaurantReviewsStore()

  // Fetch initial data
  useEffect(() => {
    fetchReviews(1, 10)
    fetchStats()
  }, [fetchReviews, fetchStats])

  const userReview = user ? getUserReview(user.id) : null
  const hasUserReviewed = !!userReview

  const handleAddReview = () => {
    if (!user) {
      toast.error('Please login to add a review')
      return
    }
    if (hasUserReviewed) {
      toast.error('You have already reviewed this restaurant. You can edit your existing review.')
      return
    }
    setShowReviewForm(true)
    setEditingReview(null)
  }

  const handleEditReview = (review) => {
    setEditingReview(review)
    setShowReviewForm(true)
  }

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) {
      return
    }

    const result = await deleteReview(reviewId)

    if (result.success) {
      toast.success('Review deleted successfully')
      setShowReviewForm(false)
      setEditingReview(null)
    } else {
      toast.error(result.error || 'Failed to delete review')
    }
  }

  const handleReviewSubmit = async (reviewData) => {
    let result

    if (editingReview) {
      result = await updateReview(editingReview.id, reviewData)
    } else {
      result = await createReview(reviewData)
    }

    if (result.success) {
      toast.success(editingReview ? 'Review updated successfully' : 'Review added successfully')
      setShowReviewForm(false)
      setEditingReview(null)
    } else {
      if (result.code === 'REVIEW_ALREADY_EXISTS') {
        toast.error('You have already reviewed this restaurant')
      } else {
        toast.error(result.error || 'Failed to submit review')
      }
    }
  }

  const handleCancelReview = () => {
    setShowReviewForm(false)
    setEditingReview(null)
  }

  const handlePageChange = (newPage) => {
    fetchReviews(newPage, pagination.limit)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
            <MessageSquare className="w-10 h-10 text-primary-600" />
            Restaurant Reviews
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            See what our customers are saying about their dining experience
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Reviews List */}
          <div className="space-y-6">
            {/* Add Review Button */}
            {user && !hasUserReviewed && !showReviewForm && (
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <button
                  onClick={handleAddReview}
                  className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                >
                  Write a Review
                </button>
              </div>
            )}

            {!user && !showReviewForm && (
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 text-center">
                <p className="text-gray-600">Please login to write a review</p>
              </div>
            )}

            {/* Review Form */}
            {showReviewForm && (
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {editingReview ? 'Edit Your Review' : 'Write Your Review'}
                </h3>
                <RestaurantReviewForm
                  initialReview={editingReview}
                  onSubmit={handleReviewSubmit}
                  onCancel={handleCancelReview}
                  isSubmitting={isLoading}
                />
              </div>
            )}

            {/* User's Review (if exists) */}
            {user && userReview && !editingReview && (
              <div className="bg-primary-50 rounded-lg border-2 border-primary-200 p-1">
                <div className="bg-white rounded-lg p-2">
                  <div className="flex items-center gap-2 mb-2 px-2">
                    <span className="text-sm font-medium text-primary-700">Your Review</span>
                  </div>
                  <RestaurantReviewCard
                    review={userReview}
                    canEdit={true}
                    canDelete={true}
                    onEdit={handleEditReview}
                    onDelete={handleDeleteReview}
                  />
                </div>
              </div>
            )}

            {/* Reviews List */}
            {isLoading && reviews.length === 0 ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/6"></div>
                      </div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : reviews.length > 0 ? (
              <>
                <div className="space-y-4">
                  {reviews
                    .filter((review) => review.id !== userReview?.id) // Don't show user's review twice
                    .map((review) => (
                      <RestaurantReviewCard
                        key={review.id}
                        review={review}
                        canEdit={user && review.user?.id === user.id}
                        canDelete={user && review.user?.id === user.id}
                        onEdit={handleEditReview}
                        onDelete={handleDeleteReview}
                      />
                    ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                        disabled={pagination.currentPage === 1}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </button>

                      <span className="text-sm text-gray-600">
                        Page {pagination.currentPage} of {pagination.totalPages}
                      </span>

                      <button
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                        disabled={pagination.currentPage === pagination.totalPages}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
                <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
                <p className="text-gray-600 mb-6">Be the first to share your experience!</p>
                {user && (
                  <button
                    onClick={handleAddReview}
                    className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                  >
                    Write the First Review
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default RestaurantReviews
