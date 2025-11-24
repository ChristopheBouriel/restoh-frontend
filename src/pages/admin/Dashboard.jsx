import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  Calendar,
  MessageSquare,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle
} from 'lucide-react'
import useOrdersStore from '../../store/ordersStore'
import useReservationsStore from '../../store/reservationsStore'
import useUsersStore from '../../store/usersStore'
import { getLabelFromSlot } from '../../services/reservationSlots'
import { pluralize } from '../../utils/pluralize'

const Dashboard = () => {
  const { orders } = useOrdersStore()
  const { reservations } = useReservationsStore()
  const { users } = useUsersStore()

  // Calculate statistics from real data
  const stats = useMemo(() => {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const thisWeek = new Date(now.setDate(now.getDate() - 7)).toISOString().split('T')[0]

    // Orders stats
    const todayOrders = orders.filter(o => o.createdAt?.startsWith(today))
    const thisMonthOrders = orders.filter(o => o.createdAt?.startsWith(thisMonth))

    const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0)
    const thisMonthRevenue = thisMonthOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0)

    // Reservations stats
    const todayReservations = reservations.filter(r => r.date === today)
    const thisWeekReservations = reservations.filter(r => r.date >= thisWeek)

    // Users stats
    const thisMonthUsers = users.filter(u => u.createdAt?.startsWith(thisMonth))

    return {
      revenue: {
        today: todayRevenue,
        thisMonth: thisMonthRevenue,
        growth: 0 // Could calculate from previous month if needed
      },
      orders: {
        today: todayOrders.length,
        thisMonth: thisMonthOrders.length,
        growth: 0
      },
      customers: {
        total: users.length,
        newThisMonth: thisMonthUsers.length,
        growth: 0
      },
      reservations: {
        today: todayReservations.length,
        thisWeek: thisWeekReservations.length,
        growth: 0
      }
    }
  }, [orders, reservations, users])

  // Get recent orders (last 10)
  const recentOrders = useMemo(() => {
    return [...orders]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10)
  }, [orders])

  // Get recent reservations (last 10)
  const recentReservations = useMemo(() => {
    return [...reservations]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10)
  }, [reservations])

  const getOrderStatusInfo = (status) => {
    switch (status) {
      case 'pending':
        return { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' }
      case 'confirmed':
        return { label: 'Confirmed', color: 'bg-blue-100 text-blue-800' }
      case 'preparing':
        return { label: 'Preparing', color: 'bg-orange-100 text-orange-800' }
      case 'ready':
        return { label: 'Ready', color: 'bg-purple-100 text-purple-800' }
      case 'delivered':
        return { label: 'Delivered', color: 'bg-green-100 text-green-800' }
      case 'cancelled':
        return { label: 'Cancelled', color: 'bg-red-100 text-red-800' }
      default:
        return { label: 'Unknown', color: 'bg-gray-100 text-gray-800' }
    }
  }

  const getReservationStatusInfo = (status) => {
    switch (status) {
      case 'confirmed':
        return { label: 'Confirmed', color: 'bg-green-100 text-green-800', icon: CheckCircle }
      case 'pending':
        return { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock }
      default:
        return { label: 'Unknown', color: 'bg-gray-100 text-gray-800', icon: Clock }
    }
  }

  const formatTime = (dateString) => {
    if (!dateString) return '--:--'
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
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

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Revenus */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today's Revenue</p>
              <p className="text-2xl font-bold text-gray-900">€{stats.revenue.today}</p>
              <p className="text-xs text-gray-500">€{stats.revenue.thisMonth.toLocaleString()} this month</p>
            </div>
            <div className="p-2 bg-green-50 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600 font-medium">+{stats.revenue.growth}%</span>
            <span className="text-sm text-gray-500 ml-1">vs last month</span>
          </div>
        </div>

        {/* Orders */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Orders Today</p>
              <p className="text-2xl font-bold text-gray-900">{stats.orders.today}</p>
              <p className="text-xs text-gray-500">{stats.orders.thisMonth} this month</p>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg">
              <ShoppingBag className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600 font-medium">+{stats.orders.growth}%</span>
            <span className="text-sm text-gray-500 ml-1">vs last month</span>
          </div>
        </div>

        {/* Clients */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900">{stats.customers.total}</p>
              <p className="text-xs text-gray-500">+{stats.customers.newThisMonth} new</p>
            </div>
            <div className="p-2 bg-purple-50 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600 font-medium">+{stats.customers.growth}%</span>
            <span className="text-sm text-gray-500 ml-1">vs last month</span>
          </div>
        </div>

        {/* Reservations */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Reservations Today</p>
              <p className="text-2xl font-bold text-gray-900">{stats.reservations.today}</p>
              <p className="text-xs text-gray-500">{stats.reservations.thisWeek} this week</p>
            </div>
            <div className="p-2 bg-orange-50 rounded-lg">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
            <span className="text-sm text-red-600 font-medium">{Math.abs(stats.reservations.growth)}%</span>
            <span className="text-sm text-gray-500 ml-1">vs last week</span>
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent orders */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
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
                  <div key={order.id} className="flex items-start justify-between p-4 border rounded-lg hover:border-primary-200 transition-colors">
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
                  </div>
                )
              })
            ) : (
              <p className="text-center text-gray-500 py-8">No recent orders</p>
            )}
          </div>
        </div>

        {/* Recent reservations */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
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
                  <div key={reservation.id} className="flex items-start justify-between p-4 border rounded-lg hover:border-primary-200 transition-colors">
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
                  </div>
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