export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

export const ROUTES = {
  HOME: '/',
  MENU: '/menu',
  MENU_ITEM: '/menu/:id',
  LOGIN: '/login',
  REGISTER: '/register',
  PROFILE: '/profile',
  CHECKOUT: '/checkout',
  ORDERS: '/orders',
  RESERVATIONS: '/reservations',
  CONTACT: '/contact',
  ADMIN: '/admin',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_MENU: '/admin/menu',
  ADMIN_ORDERS: '/admin/orders',
  ADMIN_RESERVATIONS: '/admin/reservations',
  ADMIN_USERS: '/admin/users',
}

export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY: 'ready',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
}

export const RESERVATION_STATUS = {
  CONFIRMED: 'confirmed',
  SEATED: 'seated',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no-show'
}