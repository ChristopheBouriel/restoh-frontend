import { useState, useEffect } from 'react'
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

const Dashboard = () => {
  const [stats, setStats] = useState(null)
  const [recentOrders, setRecentOrders] = useState([])
  const [recentReservations, setRecentReservations] = useState([])
  
  useEffect(() => {
    // Data loading simulation
    setTimeout(() => {
      setStats({
        revenue: {
          today: 1250,
          thisMonth: 28500,
          growth: 12.5
        },
        orders: {
          today: 25,
          thisMonth: 634,
          growth: 8.2
        },
        customers: {
          total: 1248,
          newThisMonth: 89,
          growth: 15.3
        },
        reservations: {
          today: 12,
          thisWeek: 67,
          growth: -2.1
        }
      })

      setRecentOrders([
        {
          id: '#12387',
          customer: 'Marie Dubois',
          total: 42.50,
          status: 'preparing',
          time: '14:30',
          items: 3
        },
        {
          id: '#12386',
          customer: 'Jean Martin',
          total: 28.90,
          status: 'ready',
          time: '14:25',
          items: 2
        },
        {
          id: '#12385',
          customer: 'Sophie Laurent',
          total: 65.40,
          status: 'delivered',
          time: '14:20',
          items: 5
        },
        {
          id: '#12384',
          customer: 'Pierre Durand',
          total: 18.50,
          status: 'confirmed',
          time: '14:15',
          items: 1
        }
      ])

      setRecentReservations([
        {
          id: 1,
          customer: 'Emma Wilson',
          date: '2024-01-22',
          time: '19:30',
          guests: 4,
          status: 'confirmed'
        },
        {
          id: 2,
          customer: 'Lucas Bernard',
          date: '2024-01-22',
          time: '20:00',
          guests: 2,
          status: 'pending'
        },
        {
          id: 3,
          customer: 'Camille Moreau',
          date: '2024-01-23',
          time: '19:00',
          guests: 6,
          status: 'confirmed'
        }
      ])
    }, 800)
  }, [])

  const getOrderStatusInfo = (status) => {
    switch (status) {
      case 'preparing':
        return { label: 'Preparing', color: 'bg-yellow-100 text-yellow-800' }
      case 'ready':
        return { label: 'Ready', color: 'bg-blue-100 text-blue-800' }
      case 'delivered':
        return { label: 'Delivered', color: 'bg-green-100 text-green-800' }
      case 'confirmed':
        return { label: 'Confirmed', color: 'bg-gray-100 text-gray-800' }
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

  if (!stats) {
    return (
      <div className="animate-pulse">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-sm">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      </div>
    )
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
            <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View all
            </button>
          </div>
          
          <div className="space-y-4">
            {recentOrders.map((order) => {
              const statusInfo = getOrderStatusInfo(order.status)
              return (
                <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div>
                        <p className="font-medium text-gray-900">{order.id}</p>
                        <p className="text-sm text-gray-600">{order.customer}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">€{order.total}</p>
                    <p className="text-sm text-gray-500">{order.time} - {order.items} items</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent reservations */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Recent Reservations</h2>
            <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View all
            </button>
          </div>
          
          <div className="space-y-4">
            {recentReservations.map((reservation) => {
              const statusInfo = getReservationStatusInfo(reservation.status)
              const StatusIcon = statusInfo.icon
              
              return (
                <div key={reservation.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <StatusIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{reservation.customer}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(reservation.date).toLocaleDateString('fr-FR')} à {reservation.time}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                    <p className="text-sm text-gray-500 mt-1">{reservation.guests} guests</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard