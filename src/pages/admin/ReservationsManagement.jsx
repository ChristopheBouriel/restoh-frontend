import { useState, useEffect, useMemo } from 'react'
import { Eye, Users, Calendar, Clock, MapPin } from 'lucide-react'
import useReservationsStore from '../../store/reservationsStore'
import SimpleSelect from '../../components/common/SimpleSelect'
import CustomDatePicker from '../../components/common/CustomDatePicker'
import { isReservationTimePassed, getLabelFromSlot } from '../../services/reservationSlots'
import { getTodayLocalDate, normalizeDateString } from '../../utils/dateUtils'

const ReservationsManagement = () => {
  const reservations = useReservationsStore((state) => state.reservations)
  const fetchReservations = useReservationsStore((state) => state.fetchReservations)
  const updateReservationStatus = useReservationsStore((state) => state.updateReservationStatus)
  const assignTable = useReservationsStore((state) => state.assignTable)
  const getReservationsStats = useReservationsStore((state) => state.getReservationsStats)

  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [searchReservationNumber, setSearchReservationNumber] = useState('')
  const [selectedReservation, setSelectedReservation] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    fetchReservations(true)
  }, [fetchReservations])

  const stats = useMemo(() => getReservationsStats(), [reservations, getReservationsStats])

  const statusOptions = [
    { value: 'all', label: 'All statuses' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'seated', label: 'Seated' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'no-show', label: 'No-show' }
  ]

  const dateOptions = [
    { value: 'all', label: 'All dates' },
    { value: 'today', label: 'Today' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'past', label: 'Past' }
  ]

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

  const filteredReservations = reservations
    .filter(reservation => {
      const statusMatch = statusFilter === 'all' || reservation.status === statusFilter

      let dateMatch = true
      // Normalize reservation date to YYYY-MM-DD
      const reservationDateStr = normalizeDateString(reservation.date)
      const reservationDate = new Date(reservation.date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const hasDateRange = startDate || endDate

      if (hasDateRange) {
        if (startDate && endDate) {
          dateMatch = reservationDateStr >= startDate && reservationDateStr <= endDate
        } else if (startDate) {
          dateMatch = reservationDateStr >= startDate
        } else if (endDate) {
          dateMatch = reservationDateStr <= endDate
        }
      } else {
        if (dateFilter === 'today') {
          const todayStr = getTodayLocalDate()
          dateMatch = reservationDateStr === todayStr
        } else if (dateFilter === 'upcoming') {
          dateMatch = reservationDate >= today
        } else if (dateFilter === 'past') {
          dateMatch = reservationDate < today
        }
      }

      // Search by reservation number
      const searchMatch = searchReservationNumber === '' ||
        (reservation.reservationNumber && reservation.reservationNumber.toString().includes(searchReservationNumber))

      return statusMatch && dateMatch && searchMatch
    })
    .sort((a, b) => {
      // Sort by date first
      const dateA = new Date(a.date)
      const dateB = new Date(b.date)

      if (dateA.getTime() !== dateB.getTime()) {
        return dateA - dateB
      }

      // If same date, sort by slot (time)
      return (a.slot || 0) - (b.slot || 0)
    })

  const clearDateRange = () => {
    setStartDate('')
    setEndDate('')
  }

  const handleStatusChange = async (reservationId, newStatus) => {
    await updateReservationStatus(reservationId, newStatus)
  }

  const openReservationModal = (reservation) => {
    setSelectedReservation(reservation)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedReservation(null)
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

    // Handle both single number and array
    const tables = Array.isArray(tableNumber) ? tableNumber : [tableNumber]

    if (tables.length === 0) return 'Not assigned'

    const tableLabel = tables.length === 1 ? 'Table' : 'Tables'
    const sortedTables = [...tables].sort((a, b) => a - b)

    // If 4 or less tables, show all
    if (sortedTables.length <= 4) {
      return `${tableLabel} ${sortedTables.join(', ')}`
    }

    // If more than 4, show first 3 and ellipsis
    const firstThree = sortedTables.slice(0, 3).join(', ')
    const remaining = sortedTables.length - 3
    return `${tableLabel} ${firstThree}... (+${remaining})`
  }

  return (
    <div className="p-6">
      {/* En-tête */}
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

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {/* Row 1 - General Stats */}
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-gray-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-green-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Today</p>
              <p className="text-2xl font-bold text-gray-900">{stats.todayTotal}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-purple-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Total guests</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalGuests}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-green-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Today's guests</p>
              <p className="text-2xl font-bold text-gray-900">{stats.todayGuests}</p>
            </div>
          </div>
        </div>

        {/* Row 2 - Status Stats */}
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-blue-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Confirmed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.confirmed}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-purple-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Seated</p>
              <p className="text-2xl font-bold text-gray-900">{stats.seated}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-green-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-red-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Cancelled</p>
              <p className="text-2xl font-bold text-gray-900">{stats.cancelled}</p>
            </div>
          </div>
        </div>

        {/* Row 3 - Problem Stats */}
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-orange-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">No-show</p>
              <p className="text-2xl font-bold text-gray-900">{stats.noShow || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filtres</h2>

        {/* Search by reservation number */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Search by reservation number
            </label>
            {searchReservationNumber && (
              <button
                onClick={() => setSearchReservationNumber('')}
                className="text-xs text-gray-500 hover:text-gray-700 font-medium"
              >
                Clear search
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <SimpleSelect
              value={dateFilter}
              onChange={setDateFilter}
              options={dateOptions}
              className="w-full"
              size="md"
              disabled={startDate || endDate}
            />
          </div>
        </div>
        
        {/* Période Section */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">Period</h3>
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
                onChange={setStartDate}
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
                onChange={setEndDate}
                className="w-full"
                minDate={startDate}
                placeholder="Select end date"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Liste des réservations */}
      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Reservations ({filteredReservations.length})
          </h2>
        </div>

        {filteredReservations.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No reservations found with these filters.
          </div>
        ) : (
          <>
            {/* Vue Desktop - Tableau */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
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
                  {filteredReservations.map((reservation) => (
                    <tr key={reservation.id} className={getDeletedUserRowClass(reservation)}>
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
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => openReservationModal(reservation)}
                            className="text-gray-400 hover:text-blue-600 transition-colors"
                            title="Voir les détails"
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(reservation.status)}`}>
                          {getStatusLabel(reservation.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Vue Mobile/Tablet - Cards */}
            <div className="lg:hidden divide-y divide-gray-200">
              {filteredReservations.map((reservation) => (
                <div key={reservation.id} className={`p-4 ${getDeletedUserRowClass(reservation)}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => openReservationModal(reservation)}
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                        title="Voir les détails"
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
                      {isDeletedUser(reservation) ? (
                        <span className="text-sm text-gray-500 italic">Deleted user</span>
                      ) : (
                        <span className="text-sm font-medium text-gray-900">{reservation.userName}</span>
                      )}
                      <div className="flex items-center text-sm text-gray-500">
                        <Users className="h-4 w-4 mr-1" />
                        {reservation.guests} guests
                      </div>
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

      {/* Modal de détail */}
      {isModalOpen && selectedReservation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
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
                {/* Informations client */}
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

                {/* Informations réservation */}
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

              {/* Demandes spéciales */}
              {selectedReservation.specialRequests && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Special requests</h3>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-gray-700">{selectedReservation.specialRequests}</p>
                  </div>
                </div>
              )}

              {/* Historique */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">History</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm text-gray-600">
                  <p><strong>Created:</strong> {new Date(selectedReservation.createdAt).toLocaleString('en-US')}</p>
                  <p><strong>Modified:</strong> {new Date(selectedReservation.updatedAt).toLocaleString('en-US')}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex justify-end space-x-4">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReservationsManagement