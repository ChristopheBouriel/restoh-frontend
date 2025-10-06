import { Link } from 'react-router-dom'
import { ChefHat, Star, Clock, Users } from 'lucide-react'
import { useCart } from '../../hooks/useCart'
import { useMenu } from '../../hooks/useMenu'
import ImageWithFallback from '../../components/common/ImageWithFallback'
import { ROUTES } from '../../constants'

const Home = () => {
  const { addItem } = useCart()
  const { popularItems, isLoading } = useMenu()

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
              Savourez l'Excellence Culinaire
            </h1>
            <p className="text-xl lg:text-2xl mb-8 text-primary-100 max-w-3xl mx-auto">
              Découvrez une expérience gastronomique unique avec nos plats authentiques 
              préparés par nos chefs passionnés
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to={ROUTES.MENU}
                className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
              >
                Commander Maintenant
              </Link>
              <Link
                to={ROUTES.RESERVATIONS}
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition-colors"
              >
                Réserver une Table
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Nos Atouts */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Pourquoi Choisir RestOh! ?
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <ChefHat className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Chefs Expérimentés</h3>
              <p className="text-gray-600">
                Notre équipe de chefs passionnés crée des plats exceptionnels
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Qualité Premium</h3>
              <p className="text-gray-600">
                Ingrédients frais et de qualité supérieure pour chaque plat
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Service Rapide</h3>
              <p className="text-gray-600">
                Commande et livraison rapides pour votre satisfaction
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Ambiance Chaleureuse</h3>
              <p className="text-gray-600">
                Un cadre accueillant pour tous vos repas et événements
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Plats Populaires */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Nos Plats Populaires
            </h2>
            <p className="text-xl text-gray-600">
              Découvrez nos spécialités les plus appréciées
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
              // Plats populaires depuis le store
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
                        + Panier
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
              Voir Tout le Menu
            </Link>
          </div>
        </div>
      </section>

      {/* Témoignages */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Ce Que Disent Nos Clients
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: 'Marie Dubois', text: 'Excellente cuisine, service parfait ! Je recommande vivement.', rating: 5 },
              { name: 'Jean Martin', text: 'Une expérience culinaire exceptionnelle. Les saveurs sont au rendez-vous.', rating: 5 },
              { name: 'Sophie Laurent', text: 'Ambiance chaleureuse et plats délicieux. Notre nouveau restaurant préféré !', rating: 5 },
            ].map((testimonial, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4 italic">"{testimonial.text}"</p>
                <p className="font-semibold text-gray-900">- {testimonial.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home