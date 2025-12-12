import apiClient from './apiClient'

/**
 * Dashboard Statistics API
 *
 * Endpoint for admin dashboard statistics
 * Returns aggregated data from orders, reservations, and menu items
 */

/**
 * Get dashboard statistics (ADMIN)
 *
 * Returns:
 * - Menu stats: totalMenuItems, activeMenuItems, inactiveMenuItems
 * - Orders by period: thisMonth, lastMonth, today, sameDayLastWeek
 *   Each with: total, revenue, pickup, delivery
 * - Reservations by period: thisMonth, lastMonth, today, sameDayLastWeek
 *   Each with: total, totalGuests
 * - Revenue summary by period
 */
export const getDashboardStats = async () => {
  try {
    const response = await apiClient.get('/admin/stats')
    return { success: true, ...response }
  } catch (error) {
    return { success: false, error: error.error || 'Error fetching dashboard statistics' }
  }
}
