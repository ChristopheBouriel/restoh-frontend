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
import * as menuApi from './menuApi'
import * as ordersApi from './ordersApi'
import * as reservationsApi from './reservationsApi'
import * as contactsApi from './contactsApi'

export {
  authApi,
  menuApi,
  ordersApi,
  reservationsApi,
  contactsApi
}

// Default export for alternative usage
export default {
  auth: authApi,
  menu: menuApi,
  orders: ordersApi,
  reservations: reservationsApi,
  contacts: contactsApi
}
