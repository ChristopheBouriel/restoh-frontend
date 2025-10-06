/**
 * Point d'entrée centralisé pour toutes les APIs
 * Permet d'importer facilement les fonctions API depuis n'importe où dans l'app
 *
 * Exemple d'usage:
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

// Export par défaut pour un usage alternatif
export default {
  auth: authApi,
  menu: menuApi,
  orders: ordersApi,
  reservations: reservationsApi,
  contacts: contactsApi
}
