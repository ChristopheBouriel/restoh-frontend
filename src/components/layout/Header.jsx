import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Menu, X, ShoppingCart, User, LogOut, MessageSquare } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useCart } from '../../hooks/useCart'
import { useCartUI } from '../../contexts/CartUIContext'
import { ROUTES } from '../../constants'

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const userMenuRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAuthenticated, logout } = useAuth()
  const { totalItems, totalItemsAvailable, hasUnavailableItems } = useCart()
  const { toggleCart, closeCart } = useCartUI()
  
  // Close the cart when clicking on header elements
  const handleHeaderClick = (event) => {
    // Don't close if clicking on the cart button or its children
    const cartButton = event.target.closest('[data-cart-button]')
    if (!cartButton) {
      closeCart()
    }
  }

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

  const toggleUserMenu = (e) => {
    e.stopPropagation()
    setIsUserMenuOpen(!isUserMenuOpen)
  }

  // Close user menu when clicking outside
  useEffect(() => {
    if (!isUserMenuOpen) return

    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isUserMenuOpen])

  // Function to check if a nav item is active
  const isActiveRoute = (path) => {
    // Exact match for most routes
    if (location.pathname === path) return true
    
    // Special case for home route - only active if exactly '/'
    if (path === ROUTES.HOME) return location.pathname === '/'
    
    // For other routes, also match if current path starts with the route path
    // This handles sub-routes (e.g., /menu/item-1 should highlight Menu)
    return path !== ROUTES.HOME && location.pathname.startsWith(path)
  }

  // Filter nav items based on user role
  const navItems = [
    { label: 'Home', path: ROUTES.HOME },
    { label: 'Menu', path: ROUTES.MENU },
    { label: 'Reservations', path: ROUTES.RESERVATIONS },
    { label: 'Contact', path: ROUTES.CONTACT, hideForAdmin: true },
  ].filter(item => !(item.hideForAdmin && user?.role === 'admin'))

  // DEBUG: Log every render
  console.log('[Header] Rendering - isAuthenticated:', isAuthenticated, 'user:', user?.name)

  return (
    <header className="bg-white shadow-md sticky top-0 z-50" onClick={handleHeaderClick}>
      {/* DEBUG BANNER - Remove after testing */}
      <div className="bg-yellow-300 text-black text-xs p-1 text-center">
        DEBUG: isAuth={String(isAuthenticated)} | user={user?.name || 'null'} | render={Date.now()}
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to={ROUTES.HOME} className="flex items-center">
            <span className="text-2xl font-bold text-primary-600">RestOh!</span>
          </Link>

          {/* Navigation Desktop */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`font-medium transition-colors px-3 py-2 rounded-lg ${
                  isActiveRoute(item.path)
                    ? 'text-primary-600 border-2 border-primary-600'
                    : 'text-gray-700 hover:text-primary-600'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Actions Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={toggleCart}
              data-cart-button
              className="relative p-2 text-gray-700 hover:text-primary-600 transition-colors"
            >
              <ShoppingCart size={20} />
              {totalItems > 0 && (
                <span className={`absolute -top-2 -right-2 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center ${
                  hasUnavailableItems ? 'bg-red-500' : 'bg-primary-600'
                }`}>
                  {totalItemsAvailable}
                </span>
              )}
              {hasUnavailableItems && totalItemsAvailable > 0 && (
                <span className="absolute -top-1 -right-1 bg-yellow-400 text-yellow-900 text-xs rounded-full h-3 w-3 flex items-center justify-center font-bold">
                  !
                </span>
              )}
            </button>
            
            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onMouseDown={toggleUserMenu}
                  className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition-colors"
                >
                  <User size={20} />
                  <span>{user?.name || 'User'}</span>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                      <Link
                        to={ROUTES.PROFILE}
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        My Profile
                      </Link>
                    <Link
                      to={ROUTES.ORDERS}
                      onClick={() => setIsUserMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      My Orders
                    </Link>
                    <Link
                      to={ROUTES.RESERVATIONS}
                      onClick={() => setIsUserMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      My Reservations
                    </Link>
                    {user?.role !== 'admin' && (
                      <Link
                        to={ROUTES.MY_MESSAGES}
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <MessageSquare size={16} className="mr-2" />
                        My Messages
                      </Link>
                    )}
                    {user?.role === 'admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-primary-600 hover:bg-primary-50 font-medium"
                      >
                        Admin Panel
                      </Link>
                    )}
                    <hr className="my-1" />
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false)
                        logout()
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <LogOut size={16} className="mr-2" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => navigate(ROUTES.LOGIN)}
                className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition-colors"
              >
                <User size={20} />
                <span>Login</span>
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={toggleMenu}
            className="md:hidden p-2 rounded-md text-gray-700 hover:text-primary-600 hover:bg-gray-100 transition-colors"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50 rounded-b-lg">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-3 py-2 font-medium transition-colors ${
                    isActiveRoute(item.path)
                      ? 'text-primary-600 bg-primary-50 border-l-4 border-primary-600'
                      : 'text-gray-700 hover:text-primary-600 hover:bg-primary-50'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              
              <div className="border-t pt-2 mt-2">
                <Link
                  to={ROUTES.CHECKOUT}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center px-3 py-2 text-gray-700 hover:text-primary-600 transition-colors"
                >
                  <ShoppingCart size={20} className="mr-2" />
                  Cart (0)
                </Link>

                <Link
                  to={ROUTES.LOGIN}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center px-3 py-2 text-gray-700 hover:text-primary-600 transition-colors"
                >
                  <User size={20} className="mr-2" />
                  Login
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header