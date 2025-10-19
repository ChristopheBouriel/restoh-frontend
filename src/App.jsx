import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import AdminLayout from './components/admin/AdminLayout'
import Home from './pages/public/Home'
import Menu from './pages/menu/Menu'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Profile from './pages/profile/Profile'
import Orders from './pages/orders/Orders'
import Reservations from './pages/reservations/Reservations'
import Contact from './pages/contact/Contact'
import Dashboard from './pages/admin/Dashboard'
import MenuManagement from './pages/admin/MenuManagement'
import ProtectedRoute from './components/common/ProtectedRoute'
import useAuthStore from './store/authStore'
import useCartStore from './store/cartStore'
import useMenuStore from './store/menuStore'
import useOrdersStore from './store/ordersStore'
import useReservationsStore from './store/reservationsStore'
import useUsersStore from './store/usersStore'
import useContactsStore from './store/contactsStore'
import OrdersManagement from './pages/admin/OrdersManagement'
import ReservationsManagement from './pages/admin/ReservationsManagement'
import UsersManagement from './pages/admin/UsersManagement'
import ContactsManagement from './pages/admin/ContactsManagement'
import Checkout from './pages/checkout/Checkout'
import { ROUTES } from './constants'

function App() {
  const { user, isAuthenticated, fetchCurrentUser } = useAuthStore()
  const { setCurrentUser } = useCartStore()
  const { fetchMenuItems } = useMenuStore()
  const { fetchOrders } = useOrdersStore()
  const { fetchReservations } = useReservationsStore()
  const { initializeUsers } = useUsersStore()
  const { fetchMessages } = useContactsStore()

  // Fetch current user from backend on app startup (if authenticated)
  useEffect(() => {
    const refreshUserData = async () => {
      if (isAuthenticated) {
        await fetchCurrentUser()
      }
    }
    refreshUserData()
  }, []) // Run once on mount

  // Clean up old token from localStorage (migration to cookie auth)
  useEffect(() => {
    const authStorage = localStorage.getItem('auth-storage')
    if (authStorage) {
      try {
        const data = JSON.parse(authStorage)
        if (data.state && data.state.token) {
          delete data.state.token
          localStorage.setItem('auth-storage', JSON.stringify(data))
          console.log('✅ Cleaned up old JWT token from localStorage')
        }
      } catch (error) {
        console.error('Error cleaning old auth data:', error)
      }
    }
  }, [])

  useEffect(() => {
    // Load initial data on app startup
    const loadInitialData = async () => {
      // Load menu (public)
      await fetchMenuItems()

      // If user is logged in, load their data
      if (user) {
        const isAdmin = user.role === 'admin'

        if (isAdmin) {
          // Admin: load all data
          await fetchOrders(true)
          await fetchReservations(true)
          await fetchMessages()
          initializeUsers() // usersStore not yet migrated
        } else {
          // User: load only their own data
          await fetchOrders(false)
          await fetchReservations(false)
        }
      }
    }

    loadInitialData()
  }, [user]) // Reload when user changes (login/logout)

  useEffect(() => {
    // Connect user to cart
    if (user) {
      setCurrentUser(user.id)
    } else {
      setCurrentUser(null)
    }
  }, [user, setCurrentUser])

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path={ROUTES.MENU} element={<Menu />} />
          <Route path={ROUTES.CONTACT} element={<Contact />} />
          <Route path={ROUTES.CHECKOUT} element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          } />
          
          {/* Protected Routes */}
          <Route path={ROUTES.PROFILE} element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path={ROUTES.ORDERS} element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          } />
          <Route path={ROUTES.RESERVATIONS} element={
            <ProtectedRoute>
              <Reservations />
            </ProtectedRoute>
          } />
        </Route>
        
        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="menu" element={<MenuManagement />} />
          <Route path="orders" element={<OrdersManagement />} />
          <Route path="reservations" element={<ReservationsManagement />} />
          <Route path="users" element={<UsersManagement />} />
          <Route path="messages" element={<ContactsManagement />} />
        </Route>
        
        {/* Routes without layout (auth) */}
        <Route path={ROUTES.LOGIN} element={<Login />} />
        <Route path={ROUTES.REGISTER} element={<Register />} />
        
        {/* Catch all route */}
        <Route path="*" element={
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
              <p className="text-xl text-gray-600 mb-8">Not found</p>
              <a href="/" className="text-primary-600 hover:text-primary-500 font-medium">
                Return to home
              </a>
            </div>
          </div>
        } />
      </Routes>
    </Router>
  )
}

export default App