export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

export const ROUTES = {
  HOME: '/',
  MENU: '/menu',
  MENU_ITEM: '/menu/:id',
  REVIEWS: '/reviews',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password/:token',
  VERIFY_EMAIL: '/verify-email/:token',
  PROFILE: '/profile',
  CHECKOUT: '/checkout',
  ORDERS: '/orders',
  RESERVATIONS: '/reservations',
  CONTACT: '/contact',
  MY_MESSAGES: '/my-messages',
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

export const RESTAURANT_INFO = {
  PHONE: '01 23 45 67 89',
  EMAIL: 'contact@restoh.com',
  NAME: 'RestOh!'
}