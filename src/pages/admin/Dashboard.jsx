import { useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  DollarSign,
  ShoppingBag,
  Users,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  Utensils,
  Truck,
  Store
} from 'lucide-react'
import useOrdersStore from '../../store/ordersStore'
import useReservationsStore from '../../store/reservationsStore'
import useStatsStore from '../../store/statsStore'
import { OrderService } from '../../services/orders'
import { getLabelFromSlot } from '../../utils/reservationSlots'
import { pluralize } from '../../utils/pluralize'

const Dashboard = () => {
  const { orders } = useOrdersStore()
  const { reservations } = useReservationsStore()
  const { stats: apiStats, fetchStats } = useStatsStore()

  // Fetch API stats on mount
  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  // Calculate percentage change helper
  const calculateChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous * 100).toFixed(1)
  }

  // Get comparison stats from API (week-over-week for daily, month-over-month for monthly)
  const getRevenueChange = () => {
    if (!apiStats) return { value: 0, isPositive: true }
    const change = calculateChange(apiStats.revenue.today, apiStats.revenue.sameDayLastWeek)
    return { value: Math.abs(change), isPositive: change >= 0 }
  }

  const getOrdersChange = () => {
    if (!apiStats) return { value: 0, isPositive: true }
    const change = calculateChange(apiStats.orders.today.total, apiStats.orders.sameDayLastWeek.total)
    return { value: Math.abs(change), isPositive: change >= 0 }
  }

  const getReservationsChange = () => {
    if (!apiStats) return { value: 0, isPositive: true }
    const change = calculateChange(apiStats.reservations.today.total, apiStats.reservations.sameDayLastWeek.total)
    return { value: Math.abs(change), isPositive: change >= 0 }
  }

  const getMonthlyRevenueChange = () => {
    if (!apiStats) return { value: 0, isPositive: true }
    const change = calculateChange(apiStats.revenue.thisMonth, apiStats.revenue.lastMonth)
    return { value: Math.abs(change), isPositive: change >= 0 }
  }

  // Calculate upcoming reservations (from today until end of month)
  const upcomingReservations = useMemo(() => {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

    const upcoming = reservations.filter(r =>
      r.date >= today &&
      r.date <= endOfMonth &&
      r.status !== 'cancelled' &&
      r.status !== 'no-show' &&
      r.status !== 'completed'
    )

    return {
      count: upcoming.length,
      guests: upcoming.reduce((sum, r) => sum + (r.guests || 0), 0)
    }
  }, [reservations])

  // Get recent orders (last 10) using OrderService
  const recentOrders = useMemo(() => {
    return OrderService.getRecentOrders(orders, 10)
  }, [orders])

  // Get recent reservations (last 10)
  const recentReservations = useMemo(() => {
    return [...reservations]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10)
  }, [reservations])

  // Order status info using OrderService
  const getOrderStatusInfo = (status) => {
    const baseInfo = OrderService.getStatusDisplayInfo(status)
    const colorMap = {
      yellow: 'bg-yellow-100 text-yellow-800',
      blue: 'bg-blue-100 text-blue-800',
      purple: 'bg-orange-100 text-orange-800', // preparing
      green: 'bg-purple-100 text-purple-800', // ready (Dashboard uses purple for ready)
      gray: 'bg-green-100 text-green-800', // delivered (Dashboard uses green)
      red: 'bg-red-100 text-red-800'
    }
    // Custom mapping to preserve Dashboard's original colors
    const effectiveColor = status === 'delivered' ? 'bg-green-100 text-green-800'
      : status === 'ready' ? 'bg-purple-100 text-purple-800'
      : colorMap[baseInfo.color] || 'bg-gray-100 text-gray-800'

    return {
      label: baseInfo.label,
      color: effectiveColor
    }
  }

  const getReservationStatusInfo = (status) => {
    switch (status) {
      case 'confirmed':
        return { label: 'Confirmed', color: 'bg-blue-100 text-blue-800', icon: CheckCircle }
      case 'seated':
        return { label: 'Seated', color: 'bg-purple-100 text-purple-800', icon: Users }
      case 'completed':
        return { label: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle }
      case 'cancelled':
        return { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle }
      case 'no-show':
        return { label: 'No-show', color: 'bg-orange-100 text-orange-800', icon: XCircle }
      default:
        return { label: 'Unknown', color: 'bg-gray-100 text-gray-800', icon: Clock }
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview of your restaurant</p>
      </div>

      {/* Stats cards - Quick Stats from API */}
      {apiStats?.quickStats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Revenue */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-brown-400">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Revenue</p>
                <p className="text-2xl font-bold text-gray-900">€{apiStats.quickStats.todayRevenue.toFixed(2)}</p>
                <p className="text-xs text-gray-500">€{apiStats.revenue.thisMonth.toLocaleString()} this month</p>
              </div>
              <div className="p-2 bg-green-50 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              {getRevenueChange().isPositive ? (
                <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm font-medium ${getRevenueChange().isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {getRevenueChange().isPositive ? '+' : '-'}{getRevenueChange().value}%
              </span>
              <span className="text-sm text-gray-500 ml-1">vs last week</span>
            </div>
          </div>

          {/* Orders */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-brown-400">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Orders Today</p>
                <p className="text-2xl font-bold text-gray-900">{apiStats.quickStats.todayOrders}</p>
                <p className="text-xs text-gray-500">{apiStats.orders.thisMonth.total} this month</p>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg">
                <ShoppingBag className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              {getOrdersChange().isPositive ? (
                <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm font-medium ${getOrdersChange().isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {getOrdersChange().isPositive ? '+' : '-'}{getOrdersChange().value}%
              </span>
              <span className="text-sm text-gray-500 ml-1">vs last week</span>
            </div>
          </div>

          {/* Reservations */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-brown-400">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Reservations Today</p>
                <p className="text-2xl font-bold text-gray-900">{apiStats.quickStats.todayReservations}</p>
                <p className="text-xs text-gray-500">{apiStats.reservations.thisMonth.total} this month</p>
              </div>
              <div className="p-2 bg-orange-50 rounded-lg">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              {getReservationsChange().isPositive ? (
                <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm font-medium ${getReservationsChange().isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {getReservationsChange().isPositive ? '+' : '-'}{getReservationsChange().value}%
              </span>
              <span className="text-sm text-gray-500 ml-1">vs last week</span>
            </div>
          </div>

          {/* Active Users */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-brown-400">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Active Users</p>
                <p className="text-2xl font-bold text-gray-900">{apiStats.quickStats.totalActiveUsers}</p>
              </div>
              <div className="p-2 bg-purple-50 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-sm border border-brown-400 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      )}

      {/* API Statistics (from backend) */}
      {apiStats && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Overview</h2>

          {/* Row 1: Revenue & Orders */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Monthly Revenue */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-brown-400">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">€{apiStats.revenue.thisMonth.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">€{apiStats.revenue.lastMonth.toLocaleString()} last month</p>
                </div>
                <div className="p-2 bg-green-50 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                {getMonthlyRevenueChange().isPositive ? (
                  <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm font-medium ${getMonthlyRevenueChange().isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {getMonthlyRevenueChange().isPositive ? '+' : '-'}{getMonthlyRevenueChange().value}%
                </span>
                <span className="text-sm text-gray-500 ml-1">vs last month</span>
              </div>
            </div>

            {/* Order Types */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-brown-400">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-gray-600">Monthly Orders</p>
                <p className="text-2xl font-bold text-gray-900">{apiStats.orders.thisMonth.total}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Store className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Pickup</p>
                    <p className="text-lg font-bold text-gray-900">{apiStats.orders.thisMonth.pickup}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <Truck className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Delivery</p>
                    <p className="text-lg font-bold text-gray-900">{apiStats.orders.thisMonth.delivery}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Reservations & Guests */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Monthly Reservations */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-brown-400">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Monthly Reservations</p>
                  <p className="text-2xl font-bold text-gray-900">{apiStats.reservations.thisMonth.total}</p>
                  <p className="text-xs text-gray-500">{apiStats.reservations.lastMonth.total} last month</p>
                </div>
                <div className="p-2 bg-orange-50 rounded-lg">
                  <Calendar className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>

            {/* Monthly Guests */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-brown-400">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Monthly Guests</p>
                  <p className="text-2xl font-bold text-gray-900">{apiStats.reservations.thisMonth.totalGuests}</p>
                  <p className="text-xs text-gray-500">{apiStats.reservations.lastMonth.totalGuests} last month</p>
                </div>
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Row 3: Upcoming Reservations & Menu Items */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Upcoming Reservations */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-brown-400">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Upcoming Reservations</p>
                  <p className="text-2xl font-bold text-gray-900">{upcomingReservations.count}</p>
                  <p className="text-xs text-gray-500">{upcomingReservations.guests} guests until end of month</p>
                </div>
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-brown-400">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Menu Items</p>
                  <p className="text-2xl font-bold text-gray-900">{apiStats.totalMenuItems}</p>
                  <p className="text-xs text-gray-500">
                    <span className="text-green-600">{apiStats.activeMenuItems} active</span>
                    {' / '}
                    <span className="text-gray-400">{apiStats.inactiveMenuItems} inactive</span>
                  </p>
                </div>
                <div className="p-2 bg-orange-50 rounded-lg">
                  <Utensils className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent orders */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-brown-400">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
            <Link
              to="/admin/orders"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              View all
            </Link>
          </div>
          
          <div className="space-y-4">
            {recentOrders.length > 0 ? (
              recentOrders.map((order) => {
                const statusInfo = getOrderStatusInfo(order.status)
                return (
                  <Link
                    key={order.id}
                    to={`/admin/orders?orderId=${order.id}`}
                    className="flex items-start justify-between p-4 border border-primary-300 rounded-lg hover:border-primary-500 hover:shadow-[0_4px_12px_rgba(253,186,116,0.5)] transition-all cursor-pointer"
                  >
                    {/* Left side */}
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 mb-1">#{order.orderNumber || order.id}</p>
                      <p className="text-sm text-gray-600 mb-1">{order.userEmail || 'Guest'}</p>
                      <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                    </div>

                    {/* Right side */}
                    <div className="text-right">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-2 ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                      <p className="font-bold text-gray-900 mb-1">€{(order.totalPrice || 0).toFixed(2)}</p>
                      <p className="text-xs text-gray-500">{pluralize(order.items?.length || 0, 'item')}</p>
                    </div>
                  </Link>
                )
              })
            ) : (
              <p className="text-center text-gray-500 py-8">No recent orders</p>
            )}
          </div>
        </div>

        {/* Recent reservations */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-brown-400">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Recent Reservations</h2>
            <Link
              to="/admin/reservations"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              View all
            </Link>
          </div>
          
          <div className="space-y-4">
            {recentReservations.length > 0 ? (
              recentReservations.map((reservation) => {
                const statusInfo = getReservationStatusInfo(reservation.status)

                // Format tables (handle array or single value)
                const formatTables = (tables) => {
                  if (!tables) return 'TBD'
                  if (Array.isArray(tables)) {
                    return tables.length > 0 ? tables.join(', ') : 'TBD'
                  }
                  return tables
                }

                // Count tables for pluralization
                const tableCount = !reservation.tableNumber
                  ? 0
                  : Array.isArray(reservation.tableNumber)
                    ? reservation.tableNumber.length
                    : 1

                return (
                  <Link
                    key={reservation.id}
                    to={`/admin/reservations?reservationId=${reservation.id}`}
                    className="flex items-start justify-between p-4 border border-primary-300 rounded-lg hover:border-primary-500 hover:shadow-[0_4px_12px_rgba(253,186,116,0.5)] transition-all cursor-pointer"
                  >
                    {/* Left side */}
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 mb-1">#{reservation.reservationNumber || reservation.id?.slice(-8)}</p>
                      <p className="text-sm text-gray-600 mb-1">{reservation.userEmail || 'Guest'}</p>
                      <p className="text-xs text-gray-500">{formatDate(reservation.date)} • {getLabelFromSlot(reservation.slot)}</p>
                    </div>

                    {/* Right side */}
                    <div className="text-right">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-2 ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                      <p className="font-semibold text-gray-900 mb-1">{pluralize(reservation.guests, 'guest')}</p>
                      <p className="text-xs text-gray-500">
                        {tableCount > 0 ? `Table${tableCount > 1 ? 's' : ''} ${formatTables(reservation.tableNumber)}` : 'Table TBD'}
                      </p>
                    </div>
                  </Link>
                )
              })
            ) : (
              <p className="text-center text-gray-500 py-8">No recent reservations</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard