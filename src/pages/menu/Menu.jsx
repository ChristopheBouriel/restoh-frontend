import { useState, useMemo, useEffect, useRef } from 'react'
import { Search, Filter, X } from 'lucide-react'
import { useCart } from '../../hooks/useCart'
import { useMenu } from '../../hooks/useMenu'
import { MenuService } from '../../services/menu'
import useReviewsStore from '../../store/reviewsStore'
import useAuthStore from '../../store/authStore'
import ImageWithFallback from '../../components/common/ImageWithFallback'
import SimpleSelect from '../../components/common/SimpleSelect'
import StarRating from '../../components/common/StarRating'
import ReviewCard from '../../components/reviews/ReviewCard'
import AddReviewForm from '../../components/reviews/AddReviewForm'
import toast from 'react-hot-toast'

const Menu = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCuisine, setSelectedCuisine] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [selectedItem, setSelectedItem] = useState(null)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [editingReview, setEditingReview] = useState(null)
  const modalRef = useRef(null)

  const { addItem } = useCart()
  const { items: allMenuItems, categories: menuCategories, isLoading } = useMenu()
  const { user } = useAuthStore()
  const {
    fetchMenuItemRatingStats,
    getMenuItemStats,
    fetchMenuItemReviews,
    getMenuItemReviews,
    createReview,
    updateReview,
    deleteReview,
    isLoading: isReviewLoading
  } = useReviewsStore()

  // Fetch rating stats for all menu items
  useEffect(() => {
    if (allMenuItems.length > 0) {
      allMenuItems.forEach(item => {
        fetchMenuItemRatingStats(item.id)
      })
    }
  }, [allMenuItems, fetchMenuItemRatingStats])

  // Close modal on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectedItem && modalRef.current && !modalRef.current.contains(event.target)) {
        closeModal()
      }
    }

    if (selectedItem) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [selectedItem])

  // Fetch reviews when item is selected
  useEffect(() => {
    if (selectedItem) {
      fetchMenuItemReviews(selectedItem.id)
    }
  }, [selectedItem, fetchMenuItemReviews])

  const handleAddToCart = (item) => {
    addItem(item)
  }

  const handleItemClick = (item) => {
    setSelectedItem(item)
    setShowReviewForm(false)
    setEditingReview(null)
  }

  const closeModal = () => {
    setSelectedItem(null)
    setShowReviewForm(false)
    setEditingReview(null)
  }

  const handleAddReview = () => {
    if (!user) {
      toast.error('Please login to add a review')
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

    const result = await deleteReview(reviewId, selectedItem.id)

    if (result.success) {
      toast.success('Review deleted successfully')
    } else {
      toast.error(result.error || 'Failed to delete review')
    }
  }

  const handleReviewSubmit = async (reviewData) => {
    let result

    if (editingReview) {
      result = await updateReview(editingReview.id, reviewData)
    } else {
      result = await createReview(selectedItem.id, reviewData)
    }

    if (result.success) {
      toast.success(editingReview ? 'Review updated successfully' : 'Review added successfully')
      // Close the entire modal after successful review submission
      closeModal()
    } else {
      if (result.code === 'DUPLICATE_REVIEW') {
        toast.error('You have already reviewed this item')
      } else {
        toast.error(result.error || 'Failed to submit review')
      }
    }
  }

  const handleCancelReview = () => {
    setShowReviewForm(false)
    setEditingReview(null)
  }

  const getCuisineStyle = (cuisine) => {
    const styles = {
      asian: { bg: 'bg-red-100', text: 'text-red-700', label: 'Asian' },
      lao: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Lao' },
      continental: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Continental' }
    }
    return styles[cuisine] || styles.continental
  }

  const categories = [
    { id: 'all', name: 'All dishes' },
    ...menuCategories.map(cat => ({ id: cat.id, name: cat.name }))
  ]

  const cuisineTypes = [
    { id: 'all', name: 'All cuisines' },
    { id: 'asian', name: 'Asian' },
    { id: 'lao', name: 'Lao' },
    { id: 'continental', name: 'Continental' }
  ]

  // Filter and sort menu items using MenuService (show all items, including unavailable)
  const filteredItems = useMemo(() => {
    // Build filters object
    const filters = {}
    if (selectedCuisine !== 'all') {
      filters.cuisine = selectedCuisine
    }
    if (selectedCategory !== 'all') {
      filters.category = selectedCategory
    }

    // Apply filters using MenuService
    let filtered = MenuService.filter(allMenuItems, filters)

    // Apply search using MenuService
    if (searchTerm) {
      filtered = MenuService.search(filtered, searchTerm)
    }

    // Sort using MenuService based on sortBy option
    const sortMapping = {
      'price-asc': { sortBy: 'price', direction: 'asc' },
      'price-desc': { sortBy: 'price', direction: 'desc' },
      'name': { sortBy: 'name', direction: 'asc' }
    }
    const sortConfig = sortMapping[sortBy] || sortMapping['name']
    filtered = MenuService.sort(filtered, sortConfig.sortBy, sortConfig.direction)

    // Additional sort: prioritize available items first (custom business logic for public menu)
    filtered.sort((a, b) => {
      // First sort by availability (available items first)
      if (a.isAvailable !== b.isAvailable) {
        return b.isAvailable ? 1 : -1
      }
      // Already sorted by price/name from MenuService, so return 0 to preserve that order
      return 0
    })

    return filtered
  }, [allMenuItems, selectedCuisine, selectedCategory, searchTerm, sortBy])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-96 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm">
                  <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                  <div className="p-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="flex justify-between items-center">
                      <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Our Menu</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover our selection of dishes prepared with fresh, quality ingredients
          </p>
        </div>

        {/* Filters and search */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search bar */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for a dish..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Filter by cuisine type */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <SimpleSelect
                value={selectedCuisine}
                onChange={setSelectedCuisine}
                options={cuisineTypes.map(c => ({ value: c.id, label: c.name }))}
                className="min-w-[200px]"
                size="md"
              />
            </div>

            {/* Filter by category */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <SimpleSelect
                value={selectedCategory}
                onChange={setSelectedCategory}
                options={categories.map(c => ({ value: c.id, label: c.name }))}
                className="min-w-[200px]"
                size="md"
              />
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <SimpleSelect
                value={sortBy}
                onChange={setSortBy}
                options={[
                  { value: 'name', label: 'Sort by price' },
                  { value: 'price-asc', label: 'Price ascending' },
                  { value: 'price-desc', label: 'Price descending' }
                ]}
                className="min-w-[180px]"
                size="md"
              />
            </div>
          </div>
        </div>

        {/* Dishes grid */}
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={`bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col ${
                  !item.isAvailable ? 'opacity-60' : ''
                }`}
              >
                <div
                  className="h-48 overflow-hidden relative cursor-pointer"
                  onClick={() => handleItemClick(item)}
                >
                  <ImageWithFallback
                    src={item.image}
                    alt={item.name}
                    className={`w-full h-full object-cover hover:scale-105 transition-transform duration-300 ${
                      !item.isAvailable ? 'grayscale' : ''
                    }`}
                  />
                  {!item.isAvailable && (
                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                      <span className="bg-red-500 text-white px-4 py-2 rounded-lg font-semibold text-sm">
                        Unavailable
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className={`text-lg font-semibold ${item.isAvailable ? 'text-gray-900' : 'text-gray-500'}`}>
                      {item.name}
                    </h3>
                    <span className={`text-lg font-bold ${item.isAvailable ? 'text-primary-600' : 'text-gray-400'}`}>
                      €{item.price.toFixed(2)}
                    </span>
                  </div>

                  <p className={`text-sm mb-3 line-clamp-2 ${item.isAvailable ? 'text-gray-600' : 'text-gray-400'}`}>
                    {item.description}
                  </p>

                  {/* Rating */}
                  {(() => {
                    const stats = getMenuItemStats(item.id)
                    return stats.reviewCount > 0 ? (
                      <div className="flex items-center gap-2 mb-3">
                        <StarRating rating={stats.averageRating} size="sm" readonly />
                        <span className="text-xs text-gray-500">
                          ({stats.reviewCount} {stats.reviewCount === 1 ? 'review' : 'reviews'})
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs text-gray-400 italic">No reviews yet</span>
                      </div>
                    )
                  })()}

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-medium px-2 py-1 rounded capitalize ${
                        item.isAvailable
                          ? 'text-primary-600 bg-primary-50'
                          : 'text-gray-500 bg-gray-100'
                      }`}>
                        {item.category}
                      </span>
                      {item.cuisine && (() => {
                        const style = getCuisineStyle(item.cuisine)
                        return (
                          <span className={`text-xs font-medium px-2 py-1 rounded ${style.bg} ${style.text}`}>
                            {style.label}
                          </span>
                        )
                      })()}
                      {item.isVegetarian && (
                        <span className="text-xs font-medium px-2 py-1 rounded bg-emerald-100 text-emerald-700">
                          🌱
                        </span>
                      )}
                    </div>
                    <span className={`text-xs ${item.isAvailable ? 'text-gray-500' : 'text-gray-400'}`}>
                      {item.preparationTime} min
                    </span>
                  </div>

                  {item.allergens && item.allergens.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-1">Allergens:</p>
                      <div className="flex flex-wrap gap-1">
                        {item.allergens.map((allergen, idx) => (
                          <span key={idx} className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                            {allergen}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 mt-auto">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleItemClick(item)
                      }}
                      className="px-4 py-2 rounded-lg font-medium transition-colors border border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      Reviews
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleAddToCart(item)
                      }}
                      disabled={!item.isAvailable}
                      className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                        item.isAvailable
                          ? 'bg-primary-600 text-white hover:bg-primary-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {item.isAvailable ? 'Add to cart' : 'Unavailable'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No dishes found</h3>
            <p className="text-gray-600 mb-6">
              Try modifying your search criteria or filters
            </p>
            <button
              onClick={() => {
                setSearchTerm('')
                setSelectedCategory('all')
                setSortBy('name')
              }}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Reset filters
            </button>
          </div>
        )}

        {/* Additional information */}
        <div className="mt-12 bg-primary-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-primary-900 mb-3">
            Important information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-primary-800">
            <div>
              <strong>Delivery:</strong>
              <br />
              Free from 25€ - Average time 30-45 min
            </div>
            <div>
              <strong>Allergies:</strong>
              <br />
              Inform us of your allergies when ordering
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div ref={modalRef} className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-start z-10">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedItem.name}</h2>
                {(() => {
                  const stats = getMenuItemStats(selectedItem.id)
                  return stats.reviewCount > 0 ? (
                    <div className="flex items-center gap-2">
                      <StarRating rating={stats.averageRating} size="md" readonly showRating />
                      <span className="text-sm text-gray-600">
                        ({stats.reviewCount} {stats.reviewCount === 1 ? 'review' : 'reviews'})
                      </span>
                    </div>
                  ) : (
                    <p className="text-gray-500">No reviews yet</p>
                  )
                })()}
              </div>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Add Review Button */}
              {user && !showReviewForm && (
                <div className="mb-6">
                  <button
                    onClick={handleAddReview}
                    className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                  >
                    Write a Review
                  </button>
                </div>
              )}

              {!user && (
                <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                  <p className="text-gray-600">Please login to write a review</p>
                </div>
              )}

              {/* Review Form */}
              {showReviewForm && (
                <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-4">
                    {editingReview ? 'Edit Your Review' : 'Write Your Review'}
                  </h4>
                  <AddReviewForm
                    initialReview={editingReview}
                    onSubmit={handleReviewSubmit}
                    onCancel={handleCancelReview}
                    isSubmitting={isReviewLoading}
                  />
                </div>
              )}

              {/* Reviews List */}
              {(() => {
                const reviews = getMenuItemReviews(selectedItem.id)
                return reviews.length > 0 ? (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Customer Reviews
                    </h3>
                    {reviews.map((review) => (
                      <ReviewCard
                        key={review.id}
                        review={review}
                        canEdit={user && review.userId === user.id}
                        canDelete={user && review.userId === user.id}
                        onEdit={handleEditReview}
                        onDelete={handleDeleteReview}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <div className="text-5xl mb-3">⭐</div>
                    <p className="text-lg font-medium mb-1">No reviews yet</p>
                    <p className="text-sm">Be the first to review this dish!</p>
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Menu