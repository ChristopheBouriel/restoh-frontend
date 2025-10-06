import { Link } from 'react-router-dom'
import { MapPin, Phone, Mail, Clock } from 'lucide-react'
import { ROUTES } from '../../constants'

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo et description */}
          <div className="col-span-1 lg:col-span-2">
            <Link to={ROUTES.HOME} className="flex items-center mb-4">
              <span className="text-3xl font-bold text-primary-500">RestOh!</span>
            </Link>
            <p className="text-gray-300 mb-4 max-w-md">
              Savourez l'excellence culinaire dans notre restaurant. 
              Des plats authentiques préparés avec passion et des ingrédients de qualité.
            </p>
          </div>

          {/* Informations de contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <MapPin className="w-5 h-5 text-primary-500 mr-3 flex-shrink-0" />
                <span className="text-gray-300">
                  123 Rue de la Gastronomie<br />
                  75001 Paris, France
                </span>
              </div>
              <div className="flex items-center">
                <Phone className="w-5 h-5 text-primary-500 mr-3 flex-shrink-0" />
                <span className="text-gray-300">01 23 45 67 89</span>
              </div>
              <div className="flex items-center">
                <Mail className="w-5 h-5 text-primary-500 mr-3 flex-shrink-0" />
                <span className="text-gray-300">contact@restoh.fr</span>
              </div>
            </div>
          </div>

          {/* Horaires */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Horaires</h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-primary-500 mr-3 flex-shrink-0" />
                <div className="text-gray-300">
                  <div>Lun - Ven: 11h30 - 14h30</div>
                  <div className="ml-8">18h30 - 22h30</div>
                  <div>Sam - Dim: 12h00 - 23h00</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation rapide */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <nav className="flex flex-wrap justify-center md:justify-start space-x-6 mb-4 md:mb-0">
              <Link to={ROUTES.HOME} className="text-gray-300 hover:text-primary-500 transition-colors">
                Accueil
              </Link>
              <Link to={ROUTES.MENU} className="text-gray-300 hover:text-primary-500 transition-colors">
                Menu
              </Link>
              <Link to={ROUTES.RESERVATIONS} className="text-gray-300 hover:text-primary-500 transition-colors">
                Réservations
              </Link>
              <Link to={ROUTES.CONTACT} className="text-gray-300 hover:text-primary-500 transition-colors">
                Contact
              </Link>
              <Link to="/mentions-legales" className="text-gray-300 hover:text-primary-500 transition-colors">
                Mentions légales
              </Link>
            </nav>
            
            <div className="text-gray-400 text-sm">
              © 2024 RestOh! Tous droits réservés.
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer