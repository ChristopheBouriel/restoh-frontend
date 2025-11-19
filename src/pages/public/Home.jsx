import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChefHat, Star, Clock, Users } from 'lucide-react'
import { useCart } from '../../hooks/useCart'
import { useMenu } from '../../hooks/useMenu'
import useRestaurantReviewsStore from '../../store/restaurantReviewsStore'
import ImageWithFallback from '../../components/common/ImageWithFallback'
import RestaurantStats from '../../components/restaurant-reviews/RestaurantStats'
import RestaurantReviewCard from '../../components/restaurant-reviews/RestaurantReviewCard'
import { ROUTES } from '../../constants'

const Home = () => {
  const { addItem } = useCart()
  const { popularItems, isLoading } = useMenu()
  const { reviews, stats, fetchReviews, fetchStats } = useRestaurantReviewsStore()

  // Fetch restaurant reviews and stats on mount
  useEffect(() => {
    fetchReviews(1, 5) // Get first 5 reviews for home page
    fetchStats()
  }, [fetchReviews, fetchStats])

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
      
      {/* Our Strengths */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Why Choose RestOh! ?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <ChefHat className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Experienced Chefs</h3>
              <p className="text-gray-600">
                Our team of passionate chefs creates exceptional dishes
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Premium Quality</h3>
              <p className="text-gray-600">
                Fresh ingredients and superior quality for every dish
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Fast Service</h3>
              <p className="text-gray-600">
                Quick ordering and delivery for your satisfaction
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Warm Atmosphere</h3>
              <p className="text-gray-600">
                A welcoming setting for all your meals and events
              </p>
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {isLoading ? (
              // Loading skeleton
              [1, 2, 3, 4].map((i) => (
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
              ))
            ) : (
              // Popular dishes from the store
              popularItems.slice(0, 4).map((dish) => (
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
              ))
            )}
          </div>
          
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

      {/* Customer Reviews */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Stats Widget - Narrow & Centered */}
          <div className="flex justify-center mb-8">
            <div className="w-full max-w-md">
              <RestaurantStats stats={stats} showLink={false} compact={false} hideTitle />
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              What Our Customers Say
            </h2>

            {/* Action Buttons */}
            <div className="flex justify-center gap-4 max-w-md mx-auto">
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
          </div>

          {/* Reviews List */}
          <div className="space-y-4 mt-12">
            {reviews.length > 0 ? (
              reviews.slice(0, 3).map((review) => (
                <RestaurantReviewCard key={review._id} review={review} />
              ))
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