/**
 * Centralized entry point for all APIs
 * Allows easy import of API functions from anywhere in the app
 *
 * Usage example:
 * import { authApi, ordersApi } from '@/api'
 *
 * const result = await authApi.login(credentials)
 * const orders = await ordersApi.getUserOrders()
 */

import * as authApi from './authApi'
import * as emailApi from './emailApi'
import * as menuApi from './menuApi'
import * as ordersApi from './ordersApi'
import * as reservationsApi from './reservationsApi'
import * as contactsApi from './contactsApi'
import * as tablesApi from './tablesApi'
import * as reviewsApi from './reviewsApi'
import * as restaurantReviewsApi from './restaurantReviewsApi'
import * as statsApi from './statsApi'

export {
  authApi,
  emailApi,
  menuApi,
  ordersApi,
  reservationsApi,
  contactsApi,
  tablesApi,
  reviewsApi,
  restaurantReviewsApi,
  statsApi
}

// Default export for alternative usage
export default {
  auth: authApi,
  email: emailApi,
  menu: menuApi,
  orders: ordersApi,
  reservations: reservationsApi,
  contacts: contactsApi,
  tables: tablesApi,
  reviews: reviewsApi,
  restaurantReviews: restaurantReviewsApi,
  stats: statsApi
}
