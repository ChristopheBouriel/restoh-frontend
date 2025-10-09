import { useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, 
  MenuIcon, 
  ShoppingBag, 
  Calendar, 
  Users, 
  MessageSquare,
  LogOut,
  Menu,
  X,
  Settings
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import useContactsStore from '../../store/contactsStore'
import { ROUTES } from '../../constants'

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { getNewMessagesCount } = useContactsStore()

  // Check if user is admin (simulation)
  const isAdmin = user?.role === 'admin' || user?.email === 'admin@restoh.fr'

  if (!isAdmin) {
    // Show message instead of redirecting directly
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access denied</h1>
          <p className="text-gray-600 mb-6">You do not have permission to access the admin panel.</p>
          <button
            onClick={() => navigate(ROUTES.HOME)}
            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    )
  }

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: LayoutDashboard,
      current: location.pathname === '/admin'
    },
    {
      name: 'Menu Management',
      href: '/admin/menu',
      icon: MenuIcon,
      current: location.pathname === '/admin/menu'
    },
    {
      name: 'Orders',
      href: '/admin/orders',
      icon: ShoppingBag,
      current: location.pathname === '/admin/orders'
    },
    {
      name: 'Reservations',
      href: '/admin/reservations',
      icon: Calendar,
      current: location.pathname === '/admin/reservations'
    },
    {
      name: 'Users',
      href: '/admin/users',
      icon: Users,
      current: location.pathname === '/admin/users'
    },
    {
      name: 'Contact Messages',
      href: '/admin/messages',
      icon: MessageSquare,
      current: location.pathname === '/admin/messages'
    }
  ]

  const handleLogout = () => {
    logout()
    navigate(ROUTES.HOME)
  }

  return (
    <div className="h-screen bg-gray-100 flex">
      {/* Sidebar mobile overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 transform transition-transform duration-300 ease-in-out lg:relative lg:transform-none flex flex-col ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="flex items-center justify-between h-16 px-6 bg-gray-800">
          <Link to="/admin" className="text-xl font-bold text-white">
            RestOh Admin
          </Link>
          <button
            className="text-gray-400 hover:text-white lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X size={24} />
          </button>
        </div>

        <nav className="mt-8 flex-1">
          {navigationItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={`group flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                  item.current
                    ? 'bg-gray-800 border-r-2 border-primary-500 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.name}
                {/* Badge for new messages */}
                {item.name === 'Contact Messages' && getNewMessagesCount() > 0 && (
                  <span className="ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 bg-red-600 rounded-full">
                    {getNewMessagesCount()}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Admin user info */}
        <div className="border-t border-gray-800 p-4 mt-auto">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {user?.name?.charAt(0) || 'A'}
              </span>
            </div>
            <div className="text-sm">
              <p className="text-white font-medium">{user?.name || 'Admin'}</p>
              <p className="text-gray-400 text-xs">Admin</p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 text-gray-300 hover:text-white text-sm w-full"
          >
            <LogOut size={16} />
            <span>Log out</span>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <div className="h-16 bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <button
              className="text-gray-500 hover:text-gray-700 lg:hidden"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>

            <div className="flex items-center space-x-4">
              <Link
                to={ROUTES.HOME}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← Return to site
              </Link>
              
              <button className="p-2 text-gray-500 hover:text-gray-700 transition-colors">
                <Settings size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-gray-50 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout