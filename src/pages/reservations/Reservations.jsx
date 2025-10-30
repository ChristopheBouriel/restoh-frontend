import { useState, useEffect } from 'react'
import { Calendar, Clock, Users, Plus, Edit, Trash2, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useReservations } from '../../hooks/useReservations'
import useAuthStore from '../../store/authStore'
import CustomDatePicker from '../../components/common/CustomDatePicker'
import TableMap from '../../components/reservations/TableMap'
import { TIME_SLOTS, getLabelFromSlot } from '../../services/reservationSlots'
import { getAvailableTables } from '../../api/tablesApi'
import { calculateTotalCapacity, getTableCapacity } from '../../utils/tablesConfig'

const Reservations = () => {
  const { user } = useAuthStore()
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSlotId, setSelectedSlotId] = useState(null)
  const [partySize, setPartySize] = useState(2)
  const [contactPhone, setContactPhone] = useState('')
  const [specialRequests, setSpecialRequests] = useState('')
  const [selectedTables, setSelectedTables] = useState([])
  const [occupiedTables, setOccupiedTables] = useState([])
  const [notEligibleTables, setNotEligibleTables] = useState([])
  const [previouslyBookedTables, setPreviouslyBookedTables] = useState([]) // Tables from the reservation being edited
  const [isLoadingTables, setIsLoadingTables] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [filterStatus, setFilterStatus] = useState('upcoming') // 'all', 'upcoming', 'past'

  // Pre-fill phone from user profile
  useEffect(() => {
    if (user?.phone) {
      setContactPhone(user.phone)
    }
  }, [user])

  // Fetch available tables when date and slot are selected
  useEffect(() => {
    const fetchAvailableTables = async () => {
      // Only fetch if both date and slot are selected
      if (!selectedDate || selectedSlotId === null) {
        setOccupiedTables([])
        setNotEligibleTables([])
        return
      }

      setIsLoadingTables(true)
      try {
        // Pass editingId to exclude current reservation from occupied tables
        const result = await getAvailableTables(selectedDate, selectedSlotId, partySize, editingId)

        if (result.success) {
          setOccupiedTables(result.occupiedTables)
          setNotEligibleTables(result.notEligibleTables || [])
          // Clear selected tables if any of them are now occupied or not eligible
          // BUT: if we're editing, keep the originally selected tables even if they appear occupied
          // (because the backend should exclude the current reservation from occupied list)
          setSelectedTables(prev =>
            prev.filter(tableId =>
              !result.occupiedTables.includes(tableId) &&
              !result.notEligibleTables?.includes(tableId)
            )
          )
        } else {
          // If error, show all tables as available (optimistic approach)
          setOccupiedTables([])
          setNotEligibleTables([])
          console.error('❌ Error fetching available tables:', result.error)
        }
      } catch (error) {
        console.error('❌ Exception fetching available tables:', error)
        setOccupiedTables([])
        setNotEligibleTables([])
      } finally {
        setIsLoadingTables(false)
      }
    }

    fetchAvailableTables()
  }, [selectedDate, selectedSlotId, partySize, editingId])

  // Use reservations hook with persistence
  const {
    reservations,
    createReservation,
    updateReservation,
    cancelReservation,
    validateReservationData
  } = useReservations()

  const getStatusInfo = (status) => {
    switch (status) {
      case 'confirmed':
        return {
          label: 'Confirmed',
          color: 'text-green-600 bg-green-50',
          icon: CheckCircle
        }
      case 'seated':
        return {
          label: 'Seated',
          color: 'text-blue-600 bg-blue-50',
          icon: CheckCircle
        }
      case 'completed':
        return {
          label: 'Completed',
          color: 'text-gray-600 bg-gray-50',
          icon: CheckCircle
        }
      case 'cancelled':
        return {
          label: 'Cancelled',
          color: 'text-red-600 bg-red-50',
          icon: AlertCircle
        }
      case 'no-show':
        return {
          label: 'No-show',
          color: 'text-orange-600 bg-orange-50',
          icon: AlertCircle
        }
      default:
        return {
          label: 'Unknown',
          color: 'text-gray-600 bg-gray-50',
          icon: AlertCircle
        }
    }
  }

  const handleTableSelect = (tableId) => {
    setSelectedTables(prev => {
      if (prev.includes(tableId)) {
        return prev.filter(id => id !== tableId)
      } else {
        return [...prev, tableId]
      }
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const reservationData = {
      date: selectedDate,
      slot: selectedSlotId, // Send slot number (type: number)
      guests: partySize,
      contactPhone: contactPhone,
      specialRequest: specialRequests.trim() || null,
      tableNumber: selectedTables // Send selected tables array
    }

    // Validation
    const errors = validateReservationData(reservationData)
    if (errors.length > 0) {
      toast.error(errors[0])
      return
    }

    // Final capacity check before submission
    const totalCapacity = calculateTotalCapacity(selectedTables)
    const maxAllowedCapacity = partySize + 1
    if (totalCapacity > maxAllowedCapacity) {
      toast.error(`Selected tables capacity (${totalCapacity}) exceeds maximum allowed (${maxAllowedCapacity}) for ${partySize} guests`)
      return
    }

    try {
      createReservation(reservationData)

      // Reset form (keep phone if it's from profile)
      setSelectedDate('')
      setSelectedSlotId(null)
      setPartySize(2)
      setSelectedTables([])
      if (!user?.phone) {
        setContactPhone('')
      }
      setSpecialRequests('')
    } catch (error) {
      // L'erreur est déjà gérée dans le hook
    }
  }

  const handleEdit = (reservation) => {
    setEditingId(reservation.id)
    setSelectedDate(reservation.date)
    setSelectedSlotId(reservation.slot) // Use slot number from reservation
    setPartySize(reservation.guests)
    setContactPhone(reservation.contactPhone || '')
    setSpecialRequests(reservation.specialRequests || '')
    // Show previously booked tables in a different color, don't pre-select them
    setPreviouslyBookedTables(reservation.tableNumber || [])
    setSelectedTables([]) // User must manually re-select all tables

    // Scroll to top to show the form
    window.scrollTo({ top: 0, behavior: 'smooth' })

    toast.info('Edit mode: Re-select tables (previously booked tables are highlighted)')
  }

  const handleCancelReservation = async (reservationId) => {
    await cancelReservation(reservationId)
  }

  const handleUpdate = (e) => {
    e.preventDefault()

    const reservationData = {
      date: selectedDate,
      slot: selectedSlotId, // Send slot number (type: number)
      guests: partySize,
      contactPhone: contactPhone,
      specialRequest: specialRequests.trim() || null,
      tableNumber: selectedTables // Send selected tables array
    }

    // Validation
    const errors = validateReservationData(reservationData)
    if (errors.length > 0) {
      toast.error(errors[0])
      return
    }

    // Final capacity check before submission
    const totalCapacity = calculateTotalCapacity(selectedTables)
    const maxAllowedCapacity = partySize + 1
    if (totalCapacity > maxAllowedCapacity) {
      toast.error(`Selected tables capacity (${totalCapacity}) exceeds maximum allowed (${maxAllowedCapacity}) for ${partySize} guests`)
      return
    }

    try {
      updateReservation(editingId, reservationData)

      // Reset form and editing state (keep phone if from profile)
      setSelectedDate('')
      setSelectedSlotId(null)
      setPartySize(2)
      setSelectedTables([])
      setPreviouslyBookedTables([])
      if (!user?.phone) {
        setContactPhone('')
      }
      setSpecialRequests('')
      setEditingId(null)
    } catch (error) {
      // Error already handled in hook
    }
  }

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0]

  // Filter reservations based on selected filter
  const getFilteredReservations = () => {
    if (filterStatus === 'all') {
      return reservations
    }

    if (filterStatus === 'upcoming') {
      // Upcoming: future dates OR today, and not cancelled/completed/no-show
      return reservations.filter(reservation => {
        const reservationDate = new Date(reservation.date).toISOString().split('T')[0]
        const isUpcoming = reservationDate >= today
        const isActive = !['cancelled', 'completed', 'no-show'].includes(reservation.status)
        return isUpcoming && isActive
      })
    }

    if (filterStatus === 'past') {
      // Past: past dates OR completed/cancelled/no-show status
      return reservations.filter(reservation => {
        const reservationDate = new Date(reservation.date).toISOString().split('T')[0]
        const isPast = reservationDate < today
        const isInactive = ['cancelled', 'completed', 'no-show'].includes(reservation.status)
        return isPast || isInactive
      })
    }

    return reservations
  }

  const filteredReservations = getFilteredReservations()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reservations</h1>
          <p className="text-gray-600">Book a table and manage your reservations</p>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {/* New Reservation */}
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 max-w-full overflow-hidden">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <Plus className="w-5 h-5 mr-2" />
              New reservation
            </h2>

            <form onSubmit={editingId ? handleUpdate : handleSubmit} className="space-y-6">
              {editingId && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <p className="text-sm text-blue-800">
                    ✏️ Edit mode - Modify details below
                  </p>
                </div>
              )}
              {/* Date, Guests, and Phone - Side by side on tablet/laptop */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Date
                  </label>
                  <CustomDatePicker
                    value={selectedDate}
                    onChange={setSelectedDate}
                    minDate={today}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Select a date"
                  />
                </div>

                {/* Number of guests */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Users className="w-4 h-4 inline mr-2" />
                    Number of guests
                  </label>
                  <div className="flex items-center w-full border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent bg-white overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setPartySize(Math.max(1, partySize - 1))}
                      className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white flex items-center justify-center transition-colors font-bold text-lg h-full"
                    >
                      -
                    </button>
                    <span className="flex-1 text-l text-gray-900 text-center">
                      {partySize}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPartySize(partySize + 1)}
                      className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white flex items-center justify-center transition-colors font-bold text-lg h-full"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Contact Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Phone *
                  </label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="06 12 34 56 78"
                    required
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <Clock className="w-4 h-4 inline mr-2" />
                  Time
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {TIME_SLOTS.map((slotObj) => (
                    <button
                      key={slotObj.slot}
                      type="button"
                      onClick={() => setSelectedSlotId(slotObj.slot)}
                      className={`p-2 text-sm rounded-md border transition-colors ${
                        selectedSlotId === slotObj.slot
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {slotObj.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Tables *
                </label>
                {!selectedDate || selectedSlotId === null ? (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                    <p className="text-sm text-orange-800">
                      📅 Please select a date and time slot to view available tables
                    </p>
                  </div>
                ) : (
                  <TableMap
                    selectedTables={selectedTables}
                    onTableSelect={handleTableSelect}
                    occupiedTables={occupiedTables}
                    notEligibleTables={notEligibleTables}
                    previouslyBookedTables={previouslyBookedTables}
                    isLoading={isLoadingTables}
                    partySize={partySize}
                  />
                )}
              </div>

              {/* Demandes spéciales */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Special requests
                </label>
                <textarea
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="Allergies, table preferences, special occasion..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="flex space-x-2">
                <button
                  type="submit"
                  disabled={!selectedDate || !selectedSlotId || !contactPhone.trim() || selectedTables.length === 0}
                  className="flex-1 bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {editingId ? '✏️ Update' : '🗓️ Book'}
                </button>

                {editingId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null)
                      setSelectedDate('')
                      setSelectedSlotId(null)
                      setPartySize(2)
                      setSelectedTables([])
                      setPreviouslyBookedTables([])
                      if (!user?.phone) {
                        setContactPhone('')
                      } else {
                        setContactPhone(user.phone)
                      }
                      setSpecialRequests('')
                      toast.info('Edit cancelled')
                    }}
                    className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* My Reservations */}
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              My reservations
            </h2>

            {/* Filter buttons */}
            {reservations.length > 0 && (
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setFilterStatus('upcoming')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterStatus === 'upcoming'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Upcoming
                </button>
                <button
                  onClick={() => setFilterStatus('past')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterStatus === 'past'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Past
                </button>
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterStatus === 'all'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
              </div>
            )}

            <div className="space-y-4">
              {filteredReservations.length > 0 ? (
                filteredReservations.map((reservation) => {
                  const statusInfo = getStatusInfo(reservation.status)
                  const StatusIcon = statusInfo.icon

                  const displayTime = getLabelFromSlot(reservation.slot)

                  return (
                    <div key={reservation.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-semibold">
                              {new Date(reservation.date).toLocaleDateString('en-US')}
                            </span>
                            <span className="text-gray-500">at {displayTime}</span>
                          </div>
                          <p className="text-sm text-gray-600">
                            <span className='mr-2'>👥</span> {reservation.guests} guest{reservation.guests > 1 ? 's' : ''}
                          </p>
                          {reservation.specialRequests && (
                            <p className="text-sm text-gray-600 mt-1">
                              📝 {reservation.specialRequests}
                            </p>
                          )}
                        </div>
                        
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusInfo.label}
                        </span>
                      </div>

                      {/* Only show action buttons for confirmed reservations */}
                      {reservation.status === 'confirmed' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(reservation)}
                            className="flex items-center space-x-1 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                          >
                            <Edit className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleCancelReservation(reservation.id)}
                            className="flex items-center space-x-1 px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Cancel</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {reservations.length === 0 ? 'No reservations' : `No ${filterStatus} reservations`}
                  </h3>
                  <p className="text-gray-600">
                    {reservations.length === 0
                      ? "You don't have any reservations yet."
                      : `You don't have any ${filterStatus} reservations.`
                    }
                  </p>
                </div>
              )}
            </div>

            {reservations.length > 0 && filteredReservations.length > 0 && (
              <div className="mt-6 text-center text-sm text-gray-500">
                Showing {filteredReservations.length} of {reservations.length} reservation{reservations.length > 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-primary-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-primary-900 mb-3">
            Important information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-primary-800">
            <div>
              <strong>Opening hours:</strong>
              <br />
              Monday - Friday: 11:30 AM - 2:30 PM, 6:30 PM - 10:30 PM
              <br />
              Weekend: 12:00 PM - 11:00 PM
            </div>
            <div>
              <strong>Cancellation/Modification policy:</strong>
              <br />
              Free cancellation up to 2 hours before reservation.
              <br />
              Modification must be done at least one hour before before the original time.
              <br />
              New reservation time must be at least 1 hour from the moment of your modification.
              <br />
              For groups of 6+ people, please call.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Reservations