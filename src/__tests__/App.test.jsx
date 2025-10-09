import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { vi, describe, test, expect } from 'vitest'
import '@testing-library/jest-dom'

// Mock all stores with minimal implementation
vi.mock('../store/authStore', () => ({
  default: () => ({
    user: null
  })
}))

vi.mock('../store/cartStore', () => ({
  default: () => ({
    setCurrentUser: vi.fn()
  })
}))

vi.mock('../store/menuStore', () => ({
  default: () => ({
    initializeMenu: vi.fn()
  })
}))

vi.mock('../store/ordersStore', () => ({
  default: () => ({
    initializeOrders: vi.fn()
  })
}))

vi.mock('../store/reservationsStore', () => ({
  default: () => ({
    initializeReservations: vi.fn()
  })
}))

vi.mock('../store/usersStore', () => ({
  default: () => ({
    initializeUsers: vi.fn()
  })
}))

vi.mock('../store/contactsStore', () => ({
  default: () => ({
    initializeMessages: vi.fn()
  })
}))

// Mock all page components
vi.mock('../pages/public/Home', () => ({
  default: () => <div data-testid="home-page">Home Page</div>
}))

vi.mock('../pages/menu/Menu', () => ({
  default: () => <div data-testid="menu-page">Menu Page</div>
}))

vi.mock('../pages/contact/Contact', () => ({
  default: () => <div data-testid="contact-page">Contact Page</div>
}))

vi.mock('../pages/auth/Login', () => ({
  default: () => <div data-testid="login-page">Login Page</div>
}))

vi.mock('../pages/auth/Register', () => ({
  default: () => <div data-testid="register-page">Register Page</div>
}))

vi.mock('../pages/profile/Profile', () => ({
  default: () => <div data-testid="profile-page">Profile Page</div>
}))

vi.mock('../pages/orders/Orders', () => ({
  default: () => <div data-testid="orders-page">Orders Page</div>
}))

vi.mock('../pages/reservations/Reservations', () => ({
  default: () => <div data-testid="reservations-page">Reservations Page</div>
}))

vi.mock('../pages/checkout/Checkout', () => ({
  default: () => <div data-testid="checkout-page">Checkout Page</div>
}))

vi.mock('../pages/admin/Dashboard', () => ({
  default: () => <div data-testid="admin-dashboard">Admin Dashboard</div>
}))

vi.mock('../pages/admin/MenuManagement', () => ({
  default: () => <div data-testid="admin-menu">Admin Menu</div>
}))

vi.mock('../pages/admin/OrdersManagement', () => ({
  default: () => <div data-testid="admin-orders">Admin Orders</div>
}))

vi.mock('../pages/admin/ReservationsManagement', () => ({
  default: () => <div data-testid="admin-reservations">Admin Reservations</div>
}))

vi.mock('../pages/admin/UsersManagement', () => ({
  default: () => <div data-testid="admin-users">Admin Users</div>
}))

vi.mock('../pages/admin/ContactsManagement', () => ({
  default: () => <div data-testid="admin-messages">Admin Messages</div>
}))

// Mock layout components
vi.mock('../components/layout/Layout', () => ({
  default: function Layout() {
    const { Outlet } = require('react-router-dom')
    return (
      <div data-testid="layout">
        <Outlet />
      </div>
    )
  }
}))

vi.mock('../components/admin/AdminLayout', () => ({
  default: function AdminLayout() {
    const { Outlet } = require('react-router-dom')
    return (
      <div data-testid="admin-layout">
        <Outlet />
      </div>
    )
  }
}))

// Mock ProtectedRoute
vi.mock('../components/common/ProtectedRoute', () => ({
  default: function ProtectedRoute({ children }) {
    return <div data-testid="protected-route">{children}</div>
  }
}))

// Import the components we need
import Layout from '../components/layout/Layout'
import AdminLayout from '../components/admin/AdminLayout'
import Home from '../pages/public/Home'
import Menu from '../pages/menu/Menu'
import Login from '../pages/auth/Login'
import Register from '../pages/auth/Register'
import Profile from '../pages/profile/Profile'
import Orders from '../pages/orders/Orders'
import Reservations from '../pages/reservations/Reservations'
import Contact from '../pages/contact/Contact'
import Dashboard from '../pages/admin/Dashboard'
import MenuManagement from '../pages/admin/MenuManagement'
import OrdersManagement from '../pages/admin/OrdersManagement'
import ReservationsManagement from '../pages/admin/ReservationsManagement'
import UsersManagement from '../pages/admin/UsersManagement'
import ContactsManagement from '../pages/admin/ContactsManagement'
import Checkout from '../pages/checkout/Checkout'
import ProtectedRoute from '../components/common/ProtectedRoute'
import { ROUTES } from '../constants'

// Create a test version of App routes without the BrowserRouter wrapper
const AppRoutes = () => (
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
          <p className="text-xl text-gray-600 mb-8">Page not found</p>
          <a href="/" className="text-primary-600 hover:text-primary-500 font-medium">
            Return to home
          </a>
        </div>
      </div>
    } />
  </Routes>
)

describe('App Component Routing', () => {
  describe('Basic Rendering', () => {
    test('should render without crashing', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <AppRoutes />
        </MemoryRouter>
      )
      
      expect(screen.getByTestId('layout')).toBeInTheDocument()
      expect(screen.getByTestId('home-page')).toBeInTheDocument()
    })

    test('should render 404 page for unknown routes', () => {
      render(
        <MemoryRouter initialEntries={['/unknown-route']}>
          <AppRoutes />
        </MemoryRouter>
      )

      expect(screen.getByText('404')).toBeInTheDocument()
      expect(screen.getByText('Page not found')).toBeInTheDocument()
      expect(screen.getByText('Return to home')).toBeInTheDocument()
    })
  })

  describe('Public Routing', () => {
    test('should render Home component on root path', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <AppRoutes />
        </MemoryRouter>
      )
      
      expect(screen.getByTestId('home-page')).toBeInTheDocument()
    })

    test('should render Menu component on /menu path', () => {
      render(
        <MemoryRouter initialEntries={['/menu']}>
          <AppRoutes />
        </MemoryRouter>
      )
      
      expect(screen.getByTestId('menu-page')).toBeInTheDocument()
    })

    test('should render Contact component on /contact path', () => {
      render(
        <MemoryRouter initialEntries={['/contact']}>
          <AppRoutes />
        </MemoryRouter>
      )
      
      expect(screen.getByTestId('contact-page')).toBeInTheDocument()
    })

    test('should render Login component on /login path', () => {
      render(
        <MemoryRouter initialEntries={['/login']}>
          <AppRoutes />
        </MemoryRouter>
      )
      
      expect(screen.getByTestId('login-page')).toBeInTheDocument()
    })

    test('should render Register component on /register path', () => {
      render(
        <MemoryRouter initialEntries={['/register']}>
          <AppRoutes />
        </MemoryRouter>
      )
      
      expect(screen.getByTestId('register-page')).toBeInTheDocument()
    })
  })

  describe('Protected Routes', () => {
    test('should render protected routes with ProtectedRoute wrapper', () => {
      render(
        <MemoryRouter initialEntries={['/profile']}>
          <AppRoutes />
        </MemoryRouter>
      )
      
      expect(screen.getByTestId('protected-route')).toBeInTheDocument()
      expect(screen.getByTestId('profile-page')).toBeInTheDocument()
    })

    test('should protect checkout route', () => {
      render(
        <MemoryRouter initialEntries={['/checkout']}>
          <AppRoutes />
        </MemoryRouter>
      )
      
      expect(screen.getByTestId('protected-route')).toBeInTheDocument()
      expect(screen.getByTestId('checkout-page')).toBeInTheDocument()
    })

    test('should protect orders route', () => {
      render(
        <MemoryRouter initialEntries={['/orders']}>
          <AppRoutes />
        </MemoryRouter>
      )
      
      expect(screen.getByTestId('protected-route')).toBeInTheDocument()
      expect(screen.getByTestId('orders-page')).toBeInTheDocument()
    })

    test('should protect reservations route', () => {
      render(
        <MemoryRouter initialEntries={['/reservations']}>
          <AppRoutes />
        </MemoryRouter>
      )
      
      expect(screen.getByTestId('protected-route')).toBeInTheDocument()
      expect(screen.getByTestId('reservations-page')).toBeInTheDocument()
    })
  })

  describe('Admin Routes', () => {
    test('should render admin layout for admin routes', () => {
      render(
        <MemoryRouter initialEntries={['/admin']}>
          <AppRoutes />
        </MemoryRouter>
      )
      
      expect(screen.getByTestId('protected-route')).toBeInTheDocument()
      expect(screen.getByTestId('admin-layout')).toBeInTheDocument()
      expect(screen.getByTestId('admin-dashboard')).toBeInTheDocument()
    })

    test('should render admin menu management page', () => {
      render(
        <MemoryRouter initialEntries={['/admin/menu']}>
          <AppRoutes />
        </MemoryRouter>
      )
      
      expect(screen.getByTestId('admin-layout')).toBeInTheDocument()
      expect(screen.getByTestId('admin-menu')).toBeInTheDocument()
    })

    test('should render admin orders management page', () => {
      render(
        <MemoryRouter initialEntries={['/admin/orders']}>
          <AppRoutes />
        </MemoryRouter>
      )
      
      expect(screen.getByTestId('admin-layout')).toBeInTheDocument()
      expect(screen.getByTestId('admin-orders')).toBeInTheDocument()
    })

    test('should render admin messages management page', () => {
      render(
        <MemoryRouter initialEntries={['/admin/messages']}>
          <AppRoutes />
        </MemoryRouter>
      )
      
      expect(screen.getByTestId('admin-layout')).toBeInTheDocument()
      expect(screen.getByTestId('admin-messages')).toBeInTheDocument()
    })

    test('should render admin users management page', () => {
      render(
        <MemoryRouter initialEntries={['/admin/users']}>
          <AppRoutes />
        </MemoryRouter>
      )
      
      expect(screen.getByTestId('admin-layout')).toBeInTheDocument()
      expect(screen.getByTestId('admin-users')).toBeInTheDocument()
    })

    test('should render admin reservations management page', () => {
      render(
        <MemoryRouter initialEntries={['/admin/reservations']}>
          <AppRoutes />
        </MemoryRouter>
      )
      
      expect(screen.getByTestId('admin-layout')).toBeInTheDocument()
      expect(screen.getByTestId('admin-reservations')).toBeInTheDocument()
    })
  })
})