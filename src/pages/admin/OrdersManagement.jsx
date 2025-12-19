import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Package, Eye, Clock, CheckCircle, Truck, XCircle, RefreshCw, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import SimpleSelect from '../../components/common/SimpleSelect'
import CustomDatePicker from '../../components/common/CustomDatePicker'
import ImageWithFallback from '../../components/common/ImageWithFallback'
import InlineAlert from '../../components/common/InlineAlert'
import { toast } from 'react-hot-toast'
import {
  getRecentOrders,
  getHistoricalOrders,
  updateOrderStatusEnhanced
} from '../../api/ordersApi'
import { OrderService } from '../../services/orders'
import { pluralizeWord } from '../../utils/pluralize'

const OrdersManagement = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  // Tab state: 'recent' or 'history'
  const [activeTab, setActiveTab] = useState('recent')

  // Recent orders state
  const [recentOrders, setRecentOrders] = useState([])
  const [recentPagination, setRecentPagination] = useState(null)
  const [recentPage, setRecentPage] = useState(1)
  const [isLoadingRecent, setIsLoadingRecent] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(null)

  // Historical orders state
  const [historicalOrders, setHistoricalOrders] = useState([])
  const [historicalPagination, setHistoricalPagination] = useState(null)
  const [historicalPage, setHistoricalPage] = useState(1)
  const [isLoadingHistorical, setIsLoadingHistorical] = useState(false)

  // Filters
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchOrderNumber, setSearchOrderNumber] = useState('')
  const [showTodayOnly, setShowTodayOnly] = useState(false)

  // Historical date range
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // UI state
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [inlineError, setInlineError] = useState(null)
  const [, setRefreshTick] = useState(0) // Force re-render for "Updated Xs ago"
  const modalRef = useRef(null) // Ref for modal content to detect outside clicks

  // Fetch recent orders
  const fetchRecentOrdersData = useCallback(async (page = 1) => {
    setIsLoadingRecent(true)

    const params = {
      limit: 50,
      page
    }
    if (filterStatus !== 'all') {
      params.status = filterStatus
    }

    const result = await getRecentOrders(params)

    if (result.success) {
      setRecentOrders(result.data || [])
      setRecentPagination(result.pagination)
      setRecentPage(page)
      setLastRefresh(new Date())
    } else {
      toast.error(result.error || 'Failed to load recent orders')
    }

    setIsLoadingRecent(false)
  }, [filterStatus])

  // Fetch historical orders
  const fetchHistoricalOrdersData = useCallback(async (page = 1) => {
    if (!startDate || !endDate) {
      setHistoricalOrders([])
      setHistoricalPagination(null)
      return
    }

    setIsLoadingHistorical(true)

    const params = {
      startDate,
      endDate,
      limit: 20,
      page
    }
    if (filterStatus !== 'all') {
      params.status = filterStatus
    }
    if (searchOrderNumber) {
      params.search = searchOrderNumber
    }

    const result = await getHistoricalOrders(params)

    if (result.success) {
      setHistoricalOrders(result.data || [])
      setHistoricalPagination(result.pagination)
      setHistoricalPage(page)
    } else {
      toast.error(result.error || 'Failed to load historical orders')
    }

    setIsLoadingHistorical(false)
  }, [startDate, endDate, filterStatus, searchOrderNumber])

  // Initial load for recent orders
  useEffect(() => {
    if (activeTab === 'recent') {
      fetchRecentOrdersData()
    }
  }, [activeTab, fetchRecentOrdersData])

  // Auto-refresh for recent orders (every 2 minutes)
  useEffect(() => {
    if (activeTab === 'recent') {
      const interval = setInterval(() => {
        fetchRecentOrdersData()
      }, 120000) // 2 minutes

      return () => clearInterval(interval)
    }
  }, [activeTab, fetchRecentOrdersData])

  // Update "Updated Xs ago" display every 5 seconds
  useEffect(() => {
    if (activeTab === 'recent' && lastRefresh) {
      const interval = setInterval(() => {
        setRefreshTick(tick => tick + 1) // Force re-render
      }, 5000) // 5 seconds

      return () => clearInterval(interval)
    }
  }, [activeTab, lastRefresh])

  // Auto-open modal when orderId is in URL (from Dashboard)
  useEffect(() => {
    const orderId = searchParams.get('orderId')
    if (orderId && recentOrders.length > 0) {
      const order = recentOrders.find(o => o.id === orderId)
      if (order) {
        setSelectedOrder(order)
        // Clean up the query param
        setSearchParams({})
      }
    }
  }, [searchParams, recentOrders, setSearchParams])

  // Load historical when dates change
  useEffect(() => {
    if (activeTab === 'history' && startDate && endDate) {
      setHistoricalPage(1) // Reset to page 1
      fetchHistoricalOrdersData(1)
    }
  }, [activeTab, startDate, endDate, filterStatus, searchOrderNumber]) // eslint-disable-line react-hooks/exhaustive-deps

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectedOrder && modalRef.current && !modalRef.current.contains(event.target)) {
        setSelectedOrder(null)
      }
    }

    if (selectedOrder) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [selectedOrder])

  // Handle date changes
  const handleStartDateChange = (newStartDate) => {
    setStartDate(newStartDate)
    if (endDate && newStartDate && new Date(endDate) < new Date(newStartDate)) {
      setEndDate('')
    }
  }

  const handleEndDateChange = (newEndDate) => {
    if (startDate && newEndDate && new Date(newEndDate) < new Date(startDate)) {
      return
    }
    setEndDate(newEndDate)
  }

  // Handle status change
  const handleStatusChange = async (orderId, newStatus) => {
    setInlineError(null)

    const result = await updateOrderStatusEnhanced(orderId, newStatus)

    if (result && !result.success) {
      if (result.code === 'ORDER_INVALID_STATUS' && result.details) {
        setInlineError(result)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        toast.error(result.error || 'Failed to update status')
      }
    } else {
      toast.success('Order status updated')
      // Refresh current view
      if (activeTab === 'recent') {
        fetchRecentOrdersData()
      } else {
        fetchHistoricalOrdersData()
      }
    }
  }

  // Get current orders
  const currentOrders = activeTab === 'recent' ? recentOrders : historicalOrders
  const isLoading = activeTab === 'recent' ? isLoadingRecent : isLoadingHistorical

  // Helper function to check if order is from today
  const isOrderFromToday = (order) => {
    const orderDate = new Date(order.createdAt)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    return orderDate >= today && orderDate < tomorrow
  }

  // Filter orders (for search and today filter)
  const filteredOrders = currentOrders.filter(order => {
    // Search filter
    if (searchOrderNumber) {
      const matches = order.orderNumber && order.orderNumber.toString().includes(searchOrderNumber)
      if (!matches) return false
    }

    // Today filter (only for recent tab)
    if (activeTab === 'recent' && showTodayOnly) {
      if (!isOrderFromToday(order)) {
        return false
      }
    }

    return true
  })

  // Calculate stats from current orders using OrderService
  // When "Today" filter is active, calculate stats from filtered orders only
  const currentOrdersForStats = activeTab === 'recent'
    ? (showTodayOnly ? filteredOrders : recentOrders)
    : historicalOrders
  const stats = OrderService.calculateStats(currentOrdersForStats)

  // Deleted user row class
  const getDeletedUserRowClass = (order) => {
    const deletedEmailPattern = /^deleted-[a-f0-9]+@account\.com$/i
    const isDeletedUser = deletedEmailPattern.test(order.userEmail) || order.userId === 'deleted-user'

    if (!isDeletedUser) {
      return 'hover:bg-gray-50'
    }

    if (order.status === 'delivered' || order.status === 'cancelled') {
      return 'bg-gray-100 hover:bg-gray-200'
    } else if (order.paymentStatus === 'paid') {
      return 'bg-orange-50 hover:bg-orange-100'
    } else {
      return 'bg-red-50 hover:bg-red-100'
    }
  }

  // Status configuration using OrderService + local icon/CSS mapping
  const getStatusConfig = (status) => {
    const baseInfo = OrderService.getStatusDisplayInfo(status)
    const iconMap = {
      pending: Clock,
      confirmed: CheckCircle,
      preparing: Package,
      ready: CheckCircle,
      delivered: Truck,
      cancelled: XCircle
    }
    const colorMap = {
      yellow: 'bg-yellow-100 text-yellow-800',
      blue: 'bg-blue-100 text-blue-800',
      purple: 'bg-orange-100 text-orange-800', // preparing uses orange in this component
      green: 'bg-green-100 text-green-800',
      gray: 'bg-gray-100 text-gray-800',
      red: 'bg-red-100 text-red-800'
    }
    return {
      label: baseInfo.label,
      color: colorMap[baseInfo.color] || 'bg-gray-100 text-gray-800',
      icon: iconMap[status] || Package
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTimeSinceRefresh = () => {
    if (!lastRefresh) return 'Never'

    const seconds = Math.floor((new Date() - lastRefresh) / 1000)

    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    return `${Math.floor(seconds / 3600)}h ago`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Orders Management</h1>
        <p className="text-gray-600">View and manage all customer orders</p>
        <div className="mt-3 text-xs text-gray-500">
          <strong>Color codes:</strong>
          <span className="inline-block bg-gray-100 px-2 py-1 rounded mr-2 ml-2">Gray</span>Deleted user - Delivered/Cancelled
          <span className="inline-block bg-orange-50 px-2 py-1 rounded mr-2 ml-3">Orange</span>Deleted user - Paid order in progress
          <span className="inline-block bg-red-50 px-2 py-1 rounded mr-2 ml-3">Red</span>Deleted user - Unpaid order in progress
        </div>
      </div>

      {/* InlineAlert for errors */}
      {inlineError && inlineError.code === 'ORDER_INVALID_STATUS' && inlineError.details && (
        <InlineAlert
          type="error"
          message={inlineError.error}
          details={inlineError.details.message || 'This status change is not allowed for this order.'}
          dismissible={false}
        />
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('recent')}
            className={`
              whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === 'recent'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Recent (15 days)</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`
              whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === 'history'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>History</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-brown-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total orders</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Package className="h-8 w-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-brown-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-400" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-brown-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">In progress</p>
              <p className="text-2xl font-bold text-blue-600">{stats.confirmed + stats.preparing}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-brown-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ready Orders</p>
              <p className="text-2xl font-bold text-orange-600">{stats.ready}</p>
            </div>
            <Truck className="h-8 w-8 text-orange-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-brown-400 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          {activeTab === 'recent' && (
            <div className="flex items-center space-x-3">
              {lastRefresh && (
                <span className="text-xs text-gray-500">
                  Updated {getTimeSinceRefresh()}
                </span>
              )}
              <button
                onClick={() => setShowTodayOnly(!showTodayOnly)}
                className={`flex items-center space-x-2 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  showTodayOnly
                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                    : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <Calendar className="h-4 w-4" />
                <span>Today</span>
              </button>
              <button
                onClick={fetchRecentOrdersData}
                disabled={isLoadingRecent}
                className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${isLoadingRecent ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          )}
        </div>

        {/* Search by order number */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search by order number
          </label>
          <input
            type="text"
            value={searchOrderNumber}
            onChange={(e) => setSearchOrderNumber(e.target.value)}
            placeholder="Enter order number..."
            className="w-full px-3 py-2 border-2 border-primary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <SimpleSelect
              value={filterStatus}
              onChange={setFilterStatus}
              options={[
                { value: 'all', label: 'All orders' },
                { value: 'pending', label: 'Pending' },
                { value: 'confirmed', label: 'Confirmed' },
                { value: 'preparing', label: 'Preparing' },
                { value: 'ready', label: 'Ready' },
                { value: 'delivered', label: 'Delivered' },
                { value: 'cancelled', label: 'Cancelled' }
              ]}
              className="w-full"
              size="md"
            />
          </div>

          {/* Date range only for historical */}
          {activeTab === 'history' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start date
                </label>
                <CustomDatePicker
                  value={startDate}
                  onChange={handleStartDateChange}
                  placeholder="Select a start date"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End date
                </label>
                <CustomDatePicker
                  value={endDate}
                  onChange={handleEndDateChange}
                  placeholder="Select an end date"
                  minDate={startDate || undefined}
                  className="w-full"
                />
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <div className="flex items-center space-x-4">
            {(filterStatus !== 'all' || searchOrderNumber || (activeTab === 'history' && (startDate || endDate))) && (
              <button
                onClick={() => {
                  setFilterStatus('all')
                  setSearchOrderNumber('')
                  if (activeTab === 'history') {
                    setStartDate('')
                    setEndDate('')
                  }
                }}
                className="text-sm text-orange-600 hover:text-orange-800 underline"
              >
                Clear filters
              </button>
            )}
          </div>
          <span className="text-sm text-gray-500">
            {filteredOrders.length} order(s) displayed
          </span>
        </div>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64 bg-white rounded-lg border border-brown-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : activeTab === 'history' && !startDate && !endDate ? (
        <div className="bg-white rounded-lg border border-brown-400 p-12 text-center">
          <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select a date range</h3>
          <p className="text-gray-500">
            Please select a start and end date to view historical orders.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-brown-400 overflow-hidden">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders</h3>
              <p className="text-gray-500">
                {filterStatus === 'all'
                  ? 'No orders found for the selected period.'
                  : `No orders with status "${getStatusConfig(filterStatus).label.toLowerCase()}".`
                }
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Items
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredOrders.map((order) => {
                      const statusInfo = getStatusConfig(order.status)
                      const StatusIcon = statusInfo.icon
                      return (
                        <tr key={order.id} className={getDeletedUserRowClass(order)}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              #{order.orderNumber}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{order.userName || 'N/A'}</div>
                              <div className="text-sm text-gray-500">{order.userEmail}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              <div className="font-semibold">{order.items?.length || 0}</div>
                              <div className="text-xs text-gray-500">{pluralizeWord(order.items?.length || 0, 'item')}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {formatPrice(order.total || order.totalPrice || 0)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusInfo.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(order.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={() => setSelectedOrder(order)}
                                className="text-orange-600 hover:text-orange-900"
                                title="View details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              {order.status !== 'delivered' && order.status !== 'cancelled' && (
                                <SimpleSelect
                                  value={order.status}
                                  onChange={(newStatus) => handleStatusChange(order.id, newStatus)}
                                  className="w-[110px]"
                                  options={[
                                    { value: 'pending', label: 'Pending' },
                                    { value: 'confirmed', label: 'Confirmed' },
                                    { value: 'preparing', label: 'Preparing' },
                                    { value: 'ready', label: 'Ready' },
                                    { value: 'delivered', label: 'Delivered' },
                                    { value: 'cancelled', label: 'Cancelled' }
                                  ]}
                                />
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards View */}
              <div className="lg:hidden divide-y divide-gray-200">
                {filteredOrders.map((order) => {
                  const statusInfo = getStatusConfig(order.status)
                  const StatusIcon = statusInfo.icon
                  return (
                    <div key={order.id} className={`p-4 ${getDeletedUserRowClass(order)}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">#{order.orderNumber}</span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusInfo.label}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-orange-600">
                          {formatPrice(order.total || order.totalPrice || 0)}
                        </span>
                      </div>

                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-900">{order.userName || 'N/A'}</p>
                        <p className="text-xs text-gray-500">{order.userEmail}</p>
                      </div>

                      <div className="flex justify-between items-start mb-3 text-xs text-gray-500">
                        <div>
                          <div className="font-semibold text-gray-900 text-sm">{order.items?.length || 0}</div>
                          <div className="text-xs text-gray-500">{pluralizeWord(order.items?.length || 0, 'item')}</div>
                        </div>
                        <span>{formatDate(order.createdAt)}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="flex items-center space-x-2 text-orange-600 hover:text-orange-900 text-sm"
                        >
                          <Eye className="h-4 w-4" />
                          <span>Details</span>
                        </button>

                        {order.status !== 'delivered' && order.status !== 'cancelled' && (
                          <SimpleSelect
                            value={order.status}
                            onChange={(newStatus) => handleStatusChange(order.id, newStatus)}
                            className="w-[140px]"
                            options={[
                              { value: 'pending', label: 'Pending' },
                              { value: 'confirmed', label: 'Confirmed' },
                              { value: 'preparing', label: 'Preparing' },
                              { value: 'ready', label: 'Ready' },
                              { value: 'delivered', label: 'Delivered' },
                              { value: 'cancelled', label: 'Cancelled' }
                            ]}
                          />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && filteredOrders.length > 0 && (
        <div className="bg-white border-t px-6 py-4">
          {activeTab === 'recent' && recentPagination && recentPagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing page <span className="font-medium">{recentPage}</span> of{' '}
                <span className="font-medium">{recentPagination.totalPages}</span>
                {' '}({recentPagination.total} total orders)
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => fetchRecentOrdersData(recentPage - 1)}
                  disabled={recentPage === 1}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Previous</span>
                </button>
                <button
                  onClick={() => fetchRecentOrdersData(recentPage + 1)}
                  disabled={!recentPagination.hasMore}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                >
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'history' && historicalPagination && historicalPagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing page <span className="font-medium">{historicalPage}</span> of{' '}
                <span className="font-medium">{historicalPagination.totalPages}</span>
                {' '}({historicalPagination.total} total orders)
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => fetchHistoricalOrdersData(historicalPage - 1)}
                  disabled={historicalPage === 1}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Previous</span>
                </button>
                <button
                  onClick={() => fetchHistoricalOrdersData(historicalPage + 1)}
                  disabled={!historicalPagination.hasMore}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                >
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div ref={modalRef} className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Order details #{selectedOrder.orderNumber}
                </h2>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Customer Info */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Customer information</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p><strong>Name:</strong> {selectedOrder.userName || 'N/A'}</p>
                    <p><strong>Email:</strong> {selectedOrder.userEmail}</p>
                    {selectedOrder.phone && (
                      <p><strong>Phone:</strong> {selectedOrder.phone}</p>
                    )}
                    <p><strong>Date:</strong> {formatDate(selectedOrder.createdAt)}</p>
                  </div>
                </div>

                {/* Items */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Ordered items</h3>
                  <div className="space-y-3">
                    {selectedOrder.items?.map((item, index) => (
                      <div key={index} className="flex items-center space-x-3 bg-gray-50 p-3 rounded-lg">
                        <div className="w-12 h-12 bg-gray-200 rounded-md overflow-hidden flex-shrink-0">
                          <ImageWithFallback
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-500">
                            {formatPrice(item.price)} × {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">
                            {formatPrice(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Type */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Order type</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-medium">
                      {selectedOrder.orderType === 'delivery' ? '🚚 Delivery' : '🏪 Pick-up'}
                    </p>
                  </div>
                </div>

                {/* Delivery Address - only for delivery orders */}
                {selectedOrder.orderType === 'delivery' && selectedOrder.deliveryAddress && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Delivery address</h3>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <p>{selectedOrder.deliveryAddress.street}</p>
                      <p>{selectedOrder.deliveryAddress.zipCode} {selectedOrder.deliveryAddress.city}</p>
                      {selectedOrder.deliveryAddress.instructions && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <p className="text-sm text-gray-600">Instructions:</p>
                          <p className="text-sm text-gray-900">{selectedOrder.deliveryAddress.instructions}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Special Instructions */}
                {selectedOrder.specialInstructions && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Special instructions</h3>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-900">{selectedOrder.specialInstructions}</p>
                    </div>
                  </div>
                )}

                {/* Payment */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Payment</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Payment method:</span>
                      <span className="text-sm font-medium">
                        {selectedOrder.paymentMethod === 'card' ? '💳 Credit card' : '💰 Cash'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Payment status:</span>
                      <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                        selectedOrder.paymentStatus === 'paid'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        {selectedOrder.paymentStatus === 'paid'
                          ? '✅ Paid'
                          : selectedOrder.paymentMethod === 'cash'
                            ? '💰 To pay on delivery'
                            : '⏳ Pending'
                        }
                      </span>
                    </div>
                  </div>
                </div>

                {/* Total */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-orange-600">{formatPrice(selectedOrder.total || selectedOrder.totalPrice || 0)}</span>
                  </div>
                </div>

                {/* Notes */}
                {selectedOrder.notes && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Notes</h3>
                    <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedOrder.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrdersManagement
