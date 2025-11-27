import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Eye, Users, Calendar, Clock, MapPin, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'
import SimpleSelect from '../../components/common/SimpleSelect'
import CustomDatePicker from '../../components/common/CustomDatePicker'
import { isReservationTimePassed, getLabelFromSlot } from '../../utils/reservationSlots'
import { getTodayLocalDate, normalizeDateString } from '../../utils/dateUtils'
import {
  getRecentReservations,
  getHistoricalReservations,
  updateReservationStatusEnhanced
} from '../../api/reservationsApi'

const ReservationsManagement = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  // Active tab state
  const [activeTab, setActiveTab] = useState('recent')

  // Recent reservations state
  const [recentReservations, setRecentReservations] = useState([])
  const [recentLoading, setRecentLoading] = useState(false)
  const [recentPage, setRecentPage] = useState(1)
  const [recentPagination, setRecentPagination] = useState({})
  const [lastRefresh, setLastRefresh] = useState(null)
  const [refreshTick, setRefreshTick] = useState(0) // Force re-render for timer

  // Historical reservations state
  const [historicalReservations, setHistoricalReservations] = useState([])
  const [historicalLoading, setHistoricalLoading] = useState(false)
  const [historicalPage, setHistoricalPage] = useState(1)
  const [historicalPagination, setHistoricalPagination] = useState({})

  // Filter state
  const [statusFilter, setStatusFilter] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [searchReservationNumber, setSearchReservationNumber] = useState('')
  const [showTodayOnly, setShowTodayOnly] = useState(false)

  // Modal state
  const [selectedReservation, setSelectedReservation] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const modalRef = useRef(null) // Ref for modal content to detect outside clicks

  // ========================================
  // FETCH FUNCTIONS
  // ========================================

  const fetchRecentReservationsData = useCallback(async (page = 1) => {
    console.log('🔄 Fetching recent reservations...')
    setRecentLoading(true)

    const params = {
      limit: 50,
      page,
      ...(statusFilter !== 'all' && { status: statusFilter })
    }

    const result = await getRecentReservations(params)

    if (result.success) {
      setRecentReservations(result.data || [])
      setRecentPagination(result.pagination || {})
      setRecentPage(page)
      setLastRefresh(new Date())
    }

    setRecentLoading(false)
  }, [statusFilter])

  const fetchHistoricalReservationsData = useCallback(async (page = 1) => {
    if (!startDate || !endDate) {
      return
    }

    console.log('📜 Fetching historical reservations...')
    setHistoricalLoading(true)

    const params = {
      startDate,
      endDate,
      limit: 20,
      page,
      ...(statusFilter !== 'all' && { status: statusFilter }),
      ...(searchReservationNumber && { search: searchReservationNumber })
    }

    const result = await getHistoricalReservations(params)

    if (result.success) {
      setHistoricalReservations(result.data || [])
      setHistoricalPagination(result.pagination || {})
      setHistoricalPage(page)
    }

    setHistoricalLoading(false)
  }, [startDate, endDate, statusFilter, searchReservationNumber])

  // ========================================
  // AUTO-REFRESH LOGIC (Recent only)
  // ========================================

  useEffect(() => {
    if (activeTab === 'recent') {
      fetchRecentReservationsData()

      // Auto-refresh every 5 minutes
      const interval = setInterval(() => {
        fetchRecentReservationsData(recentPage)
      }, 300000)

      return () => clearInterval(interval)
    }
  }, [activeTab, fetchRecentReservationsData, recentPage])

  // Update timer display every 5 seconds
  useEffect(() => {
    if (activeTab === 'recent' && lastRefresh) {
      const interval = setInterval(() => {
        setRefreshTick(tick => tick + 1)
      }, 5000)

      return () => clearInterval(interval)
    }
  }, [activeTab, lastRefresh])

  // Auto-open modal when reservationId is in URL (from Dashboard)
  useEffect(() => {
    const reservationId = searchParams.get('reservationId')
    if (reservationId && recentReservations.length > 0) {
      const reservation = recentReservations.find(r => r.id === reservationId)
      if (reservation) {
        setSelectedReservation(reservation)
        setIsModalOpen(true)
        // Clean up the query param
        setSearchParams({})
      }
    }
  }, [searchParams, recentReservations, setSearchParams])

  // Load historical when dates change
  useEffect(() => {
    if (activeTab === 'history' && startDate && endDate) {
      setHistoricalPage(1) // Reset to page 1
      fetchHistoricalReservationsData(1)
    }
  }, [activeTab, startDate, endDate, statusFilter, searchReservationNumber]) // eslint-disable-line react-hooks/exhaustive-deps

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isModalOpen && modalRef.current && !modalRef.current.contains(event.target)) {
        closeModal()
      }
    }

    if (isModalOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isModalOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  // ========================================
  // HANDLERS
  // ========================================

  const handleStatusChange = async (reservationId, newStatus) => {
    const result = await updateReservationStatusEnhanced(reservationId, newStatus)

    if (result.success) {
      // Refresh current view
      if (activeTab === 'recent') {
        await fetchRecentReservationsData(recentPage)
      } else {
        await fetchHistoricalReservationsData(historicalPage)
      }
    }
  }

  const handleManualRefresh = () => {
    fetchRecentReservationsData(recentPage)
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setStatusFilter('all')
    setSearchReservationNumber('')
  }

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

  const clearDateRange = () => {
    setStartDate('')
    setEndDate('')
    setHistoricalReservations([])
  }

  // ========================================
  // STATS CALCULATION
  // ========================================

  const stats = useMemo(() => {
    const allReservations = activeTab === 'recent' ? recentReservations : historicalReservations

    const today = getTodayLocalDate()

    const todayReservations = allReservations.filter(r => {
      const reservationDateStr = normalizeDateString(r.date)
      return reservationDateStr === today
    })

    return {
      total: allReservations.length,
      todayTotal: todayReservations.length,
      totalGuests: allReservations.reduce((sum, r) => sum + (r.guests || 0), 0),
      todayGuests: todayReservations.reduce((sum, r) => sum + (r.guests || 0), 0),
      confirmed: allReservations.filter(r => r.status === 'confirmed').length,
      seated: allReservations.filter(r => r.status === 'seated').length,
      completed: allReservations.filter(r => r.status === 'completed').length,
      cancelled: allReservations.filter(r => r.status === 'cancelled').length,
      noShow: allReservations.filter(r => r.status === 'no-show').length
    }
  }, [recentReservations, historicalReservations, activeTab])

  // ========================================
  // FILTERING
  // ========================================

  const displayedReservations = useMemo(() => {
    const reservations = activeTab === 'recent' ? recentReservations : historicalReservations

    return reservations.filter(reservation => {
      // Status filter
      if (statusFilter !== 'all' && reservation.status !== statusFilter) {
        return false
      }

      // Search by reservation number (only for recent tab)
      if (activeTab === 'recent' && searchReservationNumber) {
        const matches = reservation.reservationNumber &&
          reservation.reservationNumber.toString().includes(searchReservationNumber)
        if (!matches) return false
      }

      // Today filter (only for recent tab)
      if (activeTab === 'recent' && showTodayOnly) {
        const reservationDateStr = normalizeDateString(reservation.date)
        const todayStr = getTodayLocalDate()
        if (reservationDateStr !== todayStr) {
          return false
        }
      }

      return true
    })
  }, [recentReservations, historicalReservations, activeTab, statusFilter, searchReservationNumber, showTodayOnly])

  // ========================================
  // HELPERS
  // ========================================

  const getTimeSinceRefresh = () => {
    if (!lastRefresh) return 'Never'

    const seconds = Math.floor((new Date() - lastRefresh) / 1000)

    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    return `${Math.floor(seconds / 3600)}h ago`
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-100 text-blue-800'
      case 'seated': return 'bg-purple-100 text-purple-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'no-show': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'confirmed': return 'Confirmed'
      case 'seated': return 'Seated'
      case 'completed': return 'Completed'
      case 'cancelled': return 'Cancelled'
      case 'no-show': return 'No-show'
      default: return status
    }
  }

  const getDeletedUserRowClass = (reservation) => {
    if (!isDeletedUser(reservation)) {
      return 'hover:bg-gray-50'
    }

    const timePassed = isReservationTimePassed(reservation.date, reservation.slot)

    if (reservation.status === 'completed' || reservation.status === 'cancelled' || reservation.status === 'no-show') {
      return 'bg-gray-100 hover:bg-gray-200'
    } else if (!timePassed) {
      return 'bg-red-50 hover:bg-red-100'
    } else {
      return 'bg-orange-50 hover:bg-orange-100'
    }
  }

  const isDeletedUser = (reservation) => {
    const deletedEmailPattern = /^deleted-[a-f0-9]+@account\.com$/i
    return deletedEmailPattern.test(reservation.userEmail) || reservation.userId === 'deleted-user'
  }

  const formatTableNumbers = (tableNumber) => {
    if (!tableNumber) return 'Not assigned'

    const tables = Array.isArray(tableNumber) ? tableNumber : [tableNumber]

    if (tables.length === 0) return 'Not assigned'

    const tableLabel = tables.length === 1 ? 'Table' : 'Tables'
    const sortedTables = [...tables].sort((a, b) => a - b)

    if (sortedTables.length <= 4) {
      return `${tableLabel} ${sortedTables.join(', ')}`
    }

    const firstThree = sortedTables.slice(0, 3).join(', ')
    const remaining = sortedTables.length - 3
    return `${tableLabel} ${firstThree}... (+${remaining})`
  }

  const getStatusOptionsForReservation = (reservation) => {
    const timePassed = isReservationTimePassed(reservation.date, reservation.slot)
    const timeRestrictedReason = 'Only available after reservation time'

    return [
      { value: 'confirmed', label: 'Confirmed' },
      {
        value: 'seated',
        label: 'Seated',
        disabled: !timePassed,
        disabledReason: timeRestrictedReason
      },
      {
        value: 'completed',
        label: 'Completed',
        disabled: !timePassed,
        disabledReason: timeRestrictedReason
      },
      { value: 'cancelled', label: 'Cancelled' },
      {
        value: 'no-show',
        label: 'No-show',
        disabled: !timePassed,
        disabledReason: timeRestrictedReason
      }
    ]
  }

  const openReservationModal = (reservation) => {
    setSelectedReservation(reservation)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedReservation(null)
  }

  const statusOptions = [
    { value: 'all', label: 'All statuses' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'seated', label: 'Seated' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'no-show', label: 'No-show' }
  ]

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Reservations Management</h1>
        <p className="text-gray-600">Manage all restaurant reservations</p>
        <div className="mt-3 text-xs text-gray-500">
          <strong>Color codes:</strong>
          <span className="inline-block bg-gray-100 px-2 py-1 rounded mr-2 ml-2">Gray</span>Deleted user - Completed/Cancelled/No-show
          <span className="inline-block bg-red-50 px-2 py-1 rounded mr-2 ml-3">Red</span>Deleted user - Upcoming reservation
          <span className="inline-block bg-orange-50 px-2 py-1 rounded mr-2 ml-3">Orange</span>Deleted user - Past reservation not completed
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex space-x-8">
          <button
            onClick={() => handleTabChange('recent')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'recent'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Recent (Last 15 days + Upcoming)
          </button>
          <button
            onClick={() => handleTabChange('history')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'history'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            History
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-gray-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900 tabular-nums">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-green-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Today</p>
              <p className="text-2xl font-bold text-gray-900 tabular-nums">{stats.todayTotal}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-purple-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Total guests</p>
              <p className="text-2xl font-bold text-gray-900 tabular-nums">{stats.totalGuests}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-green-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Today's guests</p>
              <p className="text-2xl font-bold text-gray-900 tabular-nums">{stats.todayGuests}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-blue-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Confirmed</p>
              <p className="text-2xl font-bold text-gray-900 tabular-nums">{stats.confirmed}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-purple-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Seated</p>
              <p className="text-2xl font-bold text-gray-900 tabular-nums">{stats.seated}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-green-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900 tabular-nums">{stats.completed}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-red-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Cancelled</p>
              <p className="text-2xl font-bold text-gray-900 tabular-nums">{stats.cancelled}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-orange-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">No-show</p>
              <p className="text-2xl font-bold text-gray-900 tabular-nums">{stats.noShow || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters - Recent Tab */}
      {activeTab === 'recent' && (
        <div className="bg-white rounded-lg border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
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
                onClick={handleManualRefresh}
                disabled={recentLoading}
                className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${recentLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <SimpleSelect
                value={statusFilter}
                onChange={setStatusFilter}
                options={statusOptions}
                className="w-full"
                size="md"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Search by reservation number
                </label>
                {searchReservationNumber && (
                  <button
                    onClick={() => setSearchReservationNumber('')}
                    className="text-xs text-gray-500 hover:text-gray-700 font-medium"
                  >
                    Clear
                  </button>
                )}
              </div>
              <input
                type="text"
                value={searchReservationNumber}
                onChange={(e) => setSearchReservationNumber(e.target.value)}
                placeholder="Enter reservation number..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      )}

      {/* Filters - History Tab */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-lg border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <SimpleSelect
                value={statusFilter}
                onChange={setStatusFilter}
                options={statusOptions}
                className="w-full"
                size="md"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Search by reservation number
                </label>
                {searchReservationNumber && (
                  <button
                    onClick={() => setSearchReservationNumber('')}
                    className="text-xs text-gray-500 hover:text-gray-700 font-medium"
                  >
                    Clear
                  </button>
                )}
              </div>
              <input
                type="text"
                value={searchReservationNumber}
                onChange={(e) => setSearchReservationNumber(e.target.value)}
                placeholder="Enter reservation number..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">Period (Required)</h3>
              {(startDate || endDate) && (
                <button
                  onClick={clearDateRange}
                  className="text-xs text-gray-500 hover:text-gray-700 font-medium"
                >
                  Clear fields
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Start date
                </label>
                <CustomDatePicker
                  value={startDate}
                  onChange={handleStartDateChange}
                  className="w-full"
                  placeholder="Select start date"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  End date
                </label>
                <CustomDatePicker
                  value={endDate}
                  onChange={handleEndDateChange}
                  className="w-full"
                  minDate={startDate}
                  placeholder="Select end date"
                />
              </div>
            </div>
            {!startDate || !endDate ? (
              <p className="mt-3 text-xs text-gray-500 italic">
                Select both start and end dates to load historical reservations
              </p>
            ) : null}
          </div>
        </div>
      )}

      {/* Reservations List */}
      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Reservations ({displayedReservations.length})
          </h2>
        </div>

        {recentLoading || historicalLoading ? (
          <div className="p-12 text-center">
            <RefreshCw className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading reservations...</p>
          </div>
        ) : displayedReservations.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            {activeTab === 'history' && !startDate && !endDate
              ? 'Please select a date range to view historical reservations.'
              : 'No reservations found with these filters.'}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Guests
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Table
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {displayedReservations.map((reservation) => (
                    <tr key={reservation.id} className={getDeletedUserRowClass(reservation)}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          #{reservation.reservationNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isDeletedUser(reservation) ? (
                          <div className="text-sm text-gray-500 italic">
                            Deleted user
                          </div>
                        ) : (
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {reservation.userName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {reservation.userEmail}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(reservation.date)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {getLabelFromSlot(reservation.slot)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 text-gray-400 mr-1" />
                          <span className="text-sm text-gray-900">{reservation.guests}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start">
                          <MapPin className="h-4 w-4 text-gray-400 mr-1 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-900">
                            {formatTableNumbers(reservation.tableNumber)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(reservation.status)}`}>
                          {getStatusLabel(reservation.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => openReservationModal(reservation)}
                            className="text-gray-400 hover:text-blue-600 transition-colors"
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <SimpleSelect
                            value={reservation.status}
                            onChange={(newStatus) => handleStatusChange(reservation.id, newStatus)}
                            options={getStatusOptionsForReservation(reservation)}
                            className="w-[110px]"
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden divide-y divide-gray-200">
              {displayedReservations.map((reservation) => (
                <div key={reservation.id} className={`p-4 ${getDeletedUserRowClass(reservation)}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => openReservationModal(reservation)}
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <SimpleSelect
                        value={reservation.status}
                        onChange={(newStatus) => handleStatusChange(reservation.id, newStatus)}
                        options={getStatusOptionsForReservation(reservation)}
                        className="w-[110px]"
                      />
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(reservation.status)}`}>
                      {getStatusLabel(reservation.status)}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-500">
                        #{reservation.reservationNumber}
                      </span>
                      <div className="flex items-center text-sm text-gray-500">
                        <Users className="h-4 w-4 mr-1" />
                        {reservation.guests} guests
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      {isDeletedUser(reservation) ? (
                        <span className="text-sm text-gray-500 italic">Deleted user</span>
                      ) : (
                        <span className="text-sm font-medium text-gray-900">{reservation.userName}</span>
                      )}
                    </div>

                    {!isDeletedUser(reservation) && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">{reservation.userEmail}</span>
                      </div>
                    )}

                    <div className="flex items-start justify-between">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-1 flex-shrink-0" />
                        {formatDate(reservation.date)} - {getLabelFromSlot(reservation.slot)}
                      </div>
                      <div className="flex items-start text-sm text-gray-500 max-w-[45%]">
                        <MapPin className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                        <span className="text-right break-words">
                          {formatTableNumbers(reservation.tableNumber)}
                        </span>
                      </div>
                    </div>

                    {reservation.specialRequests && (
                      <div className="text-sm text-gray-600 bg-gray-50 rounded p-2">
                        <strong>Special requests:</strong> {reservation.specialRequests}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

          </>
        )}
      </div>

      {/* Pagination */}
      {!recentLoading && !historicalLoading && displayedReservations.length > 0 && (
        <div className="bg-white border-t px-6 py-4">
          {activeTab === 'recent' && recentPagination && recentPagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing page <span className="font-medium">{recentPage}</span> of{' '}
                <span className="font-medium">{recentPagination.totalPages}</span>
                {' '}({recentPagination.total} total reservations)
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => fetchRecentReservationsData(recentPage - 1)}
                  disabled={recentPage === 1}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Previous</span>
                </button>
                <button
                  onClick={() => fetchRecentReservationsData(recentPage + 1)}
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
                {' '}({historicalPagination.total} total reservations)
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => fetchHistoricalReservationsData(historicalPage - 1)}
                  disabled={historicalPage === 1}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Previous</span>
                </button>
                <button
                  onClick={() => fetchHistoricalReservationsData(historicalPage + 1)}
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

      {/* Reservation Detail Modal */}
      {isModalOpen && selectedReservation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div ref={modalRef} className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Reservation details
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Client Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Client</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    {isDeletedUser(selectedReservation) ? (
                      <p className="text-gray-500 italic">Deleted user</p>
                    ) : (
                      <>
                        <p><strong>Name:</strong> {selectedReservation.userName}</p>
                        <p><strong>Email:</strong> {selectedReservation.userEmail}</p>
                        <p><strong>Contact Phone:</strong> {selectedReservation.contactPhone}</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Reservation Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Reservation</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p><strong>Reservation #:</strong> {selectedReservation.reservationNumber}</p>
                    <p><strong>Date:</strong> {formatDate(selectedReservation.date)}</p>
                    <p><strong>Time:</strong> {getLabelFromSlot(selectedReservation.slot)}</p>
                    <p><strong>Guests:</strong> {selectedReservation.guests}</p>
                    <p><strong>{Array.isArray(selectedReservation.tableNumber) && selectedReservation.tableNumber.length > 1 ? 'Tables:' : 'Table:'}</strong> {formatTableNumbers(selectedReservation.tableNumber)}</p>
                    <p>
                      <strong>Status:</strong>{' '}
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedReservation.status)}`}>
                        {getStatusLabel(selectedReservation.status)}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Special Requests */}
              {selectedReservation.specialRequests && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Special requests</h3>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-gray-700">{selectedReservation.specialRequests}</p>
                  </div>
                </div>
              )}

              {/* History */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">History</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm text-gray-600">
                  <p><strong>Created:</strong> {new Date(selectedReservation.createdAt).toLocaleString('en-US')}</p>
                  <p><strong>Modified:</strong> {new Date(selectedReservation.updatedAt).toLocaleString('en-US')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReservationsManagement
