import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChefHat, Star, Clock, Users } from 'lucide-react'
import { useCart } from '../../hooks/useCart'
import { useMenu } from '../../hooks/useMenu'
import useRestaurantReviewsStore from '../../store/restaurantReviewsStore'
import ImageWithFallback from '../../components/common/ImageWithFallback'
import Carousel from '../../components/common/Carousel'
import RestaurantStats from '../../components/restaurant-reviews/RestaurantStats'
import RestaurantReviewCard from '../../components/restaurant-reviews/RestaurantReviewCard'
import { ROUTES } from '../../constants'

const Home = () => {
  const { addItem } = useCart()
  const {
    popularItems,
    suggestedItems,
    isLoadingPopular,
    isLoadingSuggested,
    fetchPopularItems,
    fetchSuggestedItems
  } = useMenu()
  const { reviews, stats, fetchReviews, fetchStats } = useRestaurantReviewsStore()

  // Fetch restaurant reviews and stats on mount
  useEffect(() => {
    fetchReviews(1, 5) // Get first 5 reviews for home page
    fetchStats()
  }, [fetchReviews, fetchStats])

  // Fetch popular and suggested items from backend
  useEffect(() => {
    fetchPopularItems()
    fetchSuggestedItems()
  }, [fetchPopularItems, fetchSuggestedItems])

  const handleAddToCart = (dish) => {
    const cartItem = {
      id: dish.id,
      name: dish.name,
      price: dish.price,
      image: dish.image,
      category: dish.category
    }
    addItem(cartItem)
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">
              Savor Culinary Excellence
            </h1>
            <p className="text-xl lg:text-2xl mb-8 text-primary-100 max-w-3xl mx-auto">
              Discover a unique gastronomic experience with our authentic dishes
              prepared by our passionate chefs
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to={ROUTES.MENU}
                className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
              >
                Order Now
              </Link>
              <Link
                to={ROUTES.RESERVATIONS}
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition-colors"
              >
                Book a Table
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Dishes */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Our Popular Dishes
            </h2>
            <p className="text-xl text-gray-600">
              Discover our most appreciated specialties
            </p>
          </div>
          
          {isLoadingPopular ? (
            // Loading skeleton
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                  <div className="h-48 bg-gray-200"></div>
                  <div className="p-4">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded w-2/3 mb-4"></div>
                    <div className="flex justify-between items-center">
                      <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-10 bg-gray-200 rounded w-1/3"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Popular dishes carousel
            <Carousel
              itemsPerView={{ mobile: 1, tablet: 2, desktop: 4 }}
              showArrows={true}
              showDots={true}
            >
              {popularItems.map((dish) => (
                <div key={dish.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
                  <div className="h-48 bg-gray-200 overflow-hidden">
                    <ImageWithFallback
                      src={dish.image}
                      alt={dish.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <span className="text-sm text-primary-600 font-medium capitalize">{dish.category}</span>
                    <h3 className="text-lg font-semibold mb-2">{dish.name}</h3>
                    <div className="flex justify-between items-center mt-auto">
                      <span className="text-2xl font-bold text-primary-600">€{dish.price.toFixed(2)}</span>
                      <button
                        onClick={() => handleAddToCart(dish)}
                        className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 transition-colors"
                      >
                        + Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </Carousel>
          )}
          
          <div className="text-center mt-12">
            <Link
              to={ROUTES.MENU}
              className="bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              View Full Menu
            </Link>
          </div>
        </div>
      </section>

      {/* Our Strengths */}
      <section className="py-8 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl lg:text-3xl font-bold text-primary-500">
              Why Choose RestOh! ?
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="bg-primary-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                <ChefHat className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="text-base font-semibold text-white mb-1">Experienced Chefs</h3>
              <p className="text-primary-100 text-sm">
                Passionate chefs creating exceptional dishes
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                <Star className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="text-base font-semibold text-white mb-1">Premium Quality</h3>
              <p className="text-primary-100 text-sm">
                Fresh ingredients for every dish
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                <Clock className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="text-base font-semibold text-white mb-1">Fast Service</h3>
              <p className="text-primary-100 text-sm">
                Quick ordering and delivery
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                <Users className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="text-base font-semibold text-white mb-1">Warm Atmosphere</h3>
              <p className="text-primary-100 text-sm">
                Welcoming setting for all occasions
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Chef's Recommendations */}
      {suggestedItems.length > 0 && (
        <section className="py-16 bg-brown-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-4">
                <ChefHat className="w-10 h-10 text-brown-700" />
                <h2 className="text-3xl lg:text-4xl font-bold text-brown-700">
                  Chef's Recommendations
                </h2>
              </div>
              <p className="text-xl text-gray-700">
                Hand-picked selections by our culinary team
              </p>
            </div>

            {isLoadingSuggested ? (
              // Loading skeleton
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                    <div className="h-56 bg-gray-200"></div>
                    <div className="p-6">
                      <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                      <div className="h-6 bg-gray-200 rounded w-2/3 mb-4"></div>
                      <div className="flex justify-between items-center">
                        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-10 bg-gray-200 rounded w-1/3"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Carousel
                itemsPerView={{ mobile: 1, tablet: 2, desktop: 3 }}
                showArrows={true}
                showDots={true}
              >
                {suggestedItems.map((dish) => (
                  <div key={dish.id} className="bg-white rounded-xl overflow-hidden h-full flex flex-col border border-brown-700" style={{ boxShadow: '0px 6px 12px rgba(166, 132, 108, 0.5)' }}>
                    <div className="relative h-56 bg-gray-200 overflow-hidden">
                      <ImageWithFallback
                        src={dish.image}
                        alt={dish.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 flex items-center gap-1 bg-brown-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                        <ChefHat size={14} />
                        <span>Chef's Pick</span>
                      </div>
                    </div>
                    <div className="p-6 flex-1 flex flex-col">
                      <span className="text-sm text-brown-600 font-medium capitalize">{dish.category}</span>
                      <h3 className="text-xl font-bold mb-2 text-gray-900">{dish.name}</h3>
                      {dish.description && (
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{dish.description}</p>
                      )}
                      <div className="flex justify-between items-center mt-auto">
                        <span className="text-2xl font-bold text-brown-700">€{dish.price.toFixed(2)}</span>
                        <button
                          onClick={() => handleAddToCart(dish)}
                          className="bg-brown-600 text-white px-5 py-2 rounded-lg hover:bg-brown-800 transition-colors font-medium"
                        >
                          + Cart
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </Carousel>
            )}
          </div>
        </section>
      )}

      {/* Customer Reviews */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Stats Widget - Narrow & Centered */}
          <div className="flex justify-center mb-8">
            <div className="w-full max-w-md">
              <RestaurantStats stats={stats} showLink={false} compact={false} hideTitle />
            </div>
          </div>

          {/* Title and Action Buttons */}
          <div className="text-center mb-8">
            {/* Action Buttons */}
            <div className="flex justify-center gap-4 max-w-md mx-auto mb-6">
              <Link
                to={ROUTES.REVIEWS}
                className="flex-1 px-6 py-3 bg-white border-2 border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors font-medium text-center"
              >
                See All Reviews
              </Link>
              <Link
                to={ROUTES.REVIEWS}
                className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium text-center"
              >
                Write a Review
              </Link>
            </div>

            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
              What Our Customers Say
            </h2>
          </div>

          {/* Reviews List */}
          <div className="mt-12">
            {reviews.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reviews.slice(0, 3).map((review) => (
                  <RestaurantReviewCard key={review.id} review={review} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
                <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
                <p className="text-gray-600">Be the first to share your experience!</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home