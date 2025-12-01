import { useState, useEffect } from 'react'
import { Calendar, Clock, Users, Plus, Edit, Trash2, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useReservations } from '../../hooks/useReservations'
import useAuthStore from '../../store/authStore'
import useReservationsStore from '../../store/reservationsStore'
import CustomDatePicker from '../../components/common/CustomDatePicker'
import TableMap from '../../components/reservations/TableMap'
import InlineAlert from '../../components/common/InlineAlert'
import { LUNCH_SLOTS, DINNER_SLOTS, getLabelFromSlot } from '../../utils/reservationSlots'
import { getAvailableTables } from '../../api/tablesApi'
import { calculateTotalCapacity, getTableCapacity } from '../../utils/tablesConfig'
import { RESTAURANT_INFO } from '../../constants'
import { ReservationService } from '../../services/reservations'

const Reservations = () => {
  const { user } = useAuthStore()
  const { fetchReservations } = useReservationsStore()
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
  const [inlineError, setInlineError] = useState(null) // Error with details for InlineAlert

  // Load user's reservations on mount (not admin data)
  useEffect(() => {
    // Always fetch user's own reservations for this page
    fetchReservations(false)
  }, [fetchReservations])

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
    cancelReservation
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

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Clear any previous inline error
    setInlineError(null)

    const reservationData = {
      date: selectedDate,
      slot: selectedSlotId, // Send slot number (type: number)
      guests: partySize,
      contactPhone: contactPhone,
      specialRequest: specialRequests.trim() || null,
      tableNumber: selectedTables // Send selected tables array
    }

    // Validation using ReservationService
    const validation = ReservationService.validate(reservationData)
    if (!validation.isValid) {
      toast.error(validation.errors[0])
      return
    }

    // Final capacity check before submission
    const totalCapacity = calculateTotalCapacity(selectedTables)
    const maxAllowedCapacity = partySize + 1
    if (totalCapacity > maxAllowedCapacity) {
      toast.error(`Selected tables capacity (${totalCapacity}) exceeds maximum allowed (${maxAllowedCapacity}) for ${partySize} guests`)
      return
    }

    const result = await createReservation(reservationData)

    console.log('Create reservation result:', JSON.stringify(result, null, 2))
    console.log('result.code:', result?.code)
    console.log('result.details:', result?.details)

    if (result.success) {
      // Reset form (keep phone if it's from profile)
      setSelectedDate('')
      setSelectedSlotId(null)
      setPartySize(2)
      setSelectedTables([])
      if (!user?.phone) {
        setContactPhone('')
      }
      setSpecialRequests('')
    } else if (result.details) {
      // Show InlineAlert for errors with details
      setInlineError(result)
      // Scroll to top to show the alert
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    // Else: error was already shown as toast in the hook
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
    // Clear any previous inline error
    setInlineError(null)

    const result = await cancelReservation(reservationId)

    console.log('Cancel reservation result:', JSON.stringify(result, null, 2))

    if (result && !result.success) {
      // Show InlineAlert if backend returns details
      if (result.details) {
        setInlineError(result)
        // Scroll to top to show the alert
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
      // Else: error was already shown as toast in the hook
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    console.log('=== handleUpdate called ===')
    console.log('editingId:', editingId)

    // Clear any previous inline error
    setInlineError(null)

    const reservationData = {
      date: selectedDate,
      slot: selectedSlotId, // Send slot number (type: number)
      guests: partySize,
      contactPhone: contactPhone,
      specialRequest: specialRequests.trim() || null,
      tableNumber: selectedTables // Send selected tables array
    }

    console.log('Update reservation data being sent:', reservationData)
    console.log('contactPhone value:', contactPhone)

    // Validation using ReservationService
    const validation = ReservationService.validate(reservationData)
    if (!validation.isValid) {
      toast.error(validation.errors[0])
      return
    }

    // Final capacity check before submission
    const totalCapacity = calculateTotalCapacity(selectedTables)
    const maxAllowedCapacity = partySize + 1
    if (totalCapacity > maxAllowedCapacity) {
      toast.error(`Selected tables capacity (${totalCapacity}) exceeds maximum allowed (${maxAllowedCapacity}) for ${partySize} guests`)
      return
    }

    const result = await updateReservation(editingId, reservationData)

    console.log('Update reservation result:', JSON.stringify(result, null, 2))

    if (result.success) {
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
    } else if (result.details) {
      setInlineError(result)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    // Else: error was already shown as toast in the hook
  }

  const today = new Date().toISOString().split('T')[0]

  // Check if a reservation's time has passed
  const isReservationPassed = (reservation) => {
    const now = new Date()
    const reservationDate = new Date(reservation.date).toISOString().split('T')[0]

    // If it's a past date, it's passed
    if (reservationDate < today) return true

    // If it's a future date, it's not passed
    if (reservationDate > today) return false

    // It's today - check the time
    const timeLabel = getLabelFromSlot(reservation.slot)
    if (timeLabel === 'N/A') return false

    const [hours, minutes] = timeLabel.split(':').map(Number)
    const reservationDateTime = new Date(reservation.date)
    reservationDateTime.setHours(hours, minutes, 0, 0)

    return reservationDateTime <= now
  }

  const getFilteredReservations = () => {
    if (filterStatus === 'all') {
      // Sort by date descending (most recent first), then by time slot descending
      return [...reservations].sort((a, b) => {
        const dateA = new Date(a.date)
        const dateB = new Date(b.date)

        // If same date, sort by time slot (higher slot = later time)
        if (dateA.getTime() === dateB.getTime()) {
          return b.slot - a.slot
        }

        // Otherwise sort by date (most recent first)
        return dateB - dateA
      })
    }

    if (filterStatus === 'upcoming') {
      const now = new Date()

      return reservations.filter(reservation => {
        const isActive = !['cancelled', 'completed', 'no-show'].includes(reservation.status)
        if (!isActive) return false

        const reservationDate = new Date(reservation.date).toISOString().split('T')[0]

        if (reservationDate > today) return true

        if (reservationDate < today) return false

        const timeLabel = getLabelFromSlot(reservation.slot)
        if (timeLabel === 'N/A') return false

        const [hours, minutes] = timeLabel.split(':').map(Number)
        const reservationDateTime = new Date(reservation.date)
        reservationDateTime.setHours(hours, minutes, 0, 0)

        return reservationDateTime > now
      })
    }

    if (filterStatus === 'past') {
      const now = new Date()

      return reservations.filter(reservation => {
        const isInactive = ['cancelled', 'completed', 'no-show'].includes(reservation.status)
        if (isInactive) return true

        const reservationDate = new Date(reservation.date).toISOString().split('T')[0]

        if (reservationDate < today) return true

        if (reservationDate > today) return false

        const timeLabel = getLabelFromSlot(reservation.slot)
        if (timeLabel === 'N/A') return false

        const [hours, minutes] = timeLabel.split(':').map(Number)
        const reservationDateTime = new Date(reservation.date)
        reservationDateTime.setHours(hours, minutes, 0, 0)

        return reservationDateTime <= now
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
              {editingId ? (
                <>
                  <Edit className="w-5 h-5 mr-2" />
                  Update reservation
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 mr-2" />
                  New reservation
                </>
              )}
            </h2>

            <form onSubmit={editingId ? handleUpdate : handleSubmit} className="space-y-6">
              {editingId && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <p className="text-sm text-blue-800">
                    ✏️ Edit mode - Modify details below
                  </p>
                </div>
              )}

              {/* InlineAlert for errors with details */}

              {/* Case 1a: TABLES_UNAVAILABLE - Tables already booked */}
              {inlineError && inlineError.code === 'TABLES_UNAVAILABLE' && inlineError.details && (
                <InlineAlert
                  type="warning"
                  message={inlineError.error}
                  details={inlineError.details.message || 'These tables were just booked by another customer.'}
                  actions={inlineError.details.suggestedTables && inlineError.details.suggestedTables.length > 0 ? inlineError.details.suggestedTables.map(tableId => ({
                    label: `Try Table ${tableId}`,
                    onClick: () => {
                      setSelectedTables(prev => {
                        if (!prev.includes(tableId)) {
                          return [...prev, tableId]
                        }
                        return prev
                      })
                      setInlineError(null)
                      toast.success(`Table ${tableId} selected`)
                    },
                    variant: inlineError.details.suggestedTables.indexOf(tableId) === 0 ? 'primary' : undefined
                  })) : []}
                  onDismiss={() => setInlineError(null)}
                />
              )}

              {/* Case 1b: CAPACITY_INSUFFICIENT - Selected tables don't match party size */}
              {inlineError && inlineError.code === 'CAPACITY_INSUFFICIENT' && inlineError.details && (
                <InlineAlert
                  type="warning"
                  message={inlineError.error}
                  details={inlineError.details.message || `The selected tables don't match your party size.`}
                  actions={inlineError.details.suggestedTables && inlineError.details.suggestedTables.length > 0 ? inlineError.details.suggestedTables.map((tableId, index) => ({
                    label: `Try Table ${tableId}`,
                    onClick: () => {
                      setSelectedTables(prev => {
                        if (!prev.includes(tableId)) {
                          return [...prev, tableId]
                        }
                        return prev
                      })
                      setInlineError(null)
                      toast.success(`Table ${tableId} added`)
                    },
                    variant: index === 0 ? 'primary' : undefined
                  })) : []}
                  onDismiss={() => setInlineError(null)}
                />
              )}

              {/* Case 3: Timing errors (MODIFICATION_TOO_LATE, CANCELLATION_TOO_LATE) */}
              {inlineError && (
                inlineError.code === 'MODIFICATION_TOO_LATE' ||
                inlineError.code === 'CANCELLATION_TOO_LATE'
              ) && inlineError.details && (
                <InlineAlert
                  type="error"
                  dismissible={false}
                >
                  <div>
                    <p className="font-semibold">{inlineError.error}</p>
                    <p className="mt-2">{inlineError.details.message || 'This action cannot be completed online at this time.'}</p>
                    {inlineError.details.action && (
                      <p className="mt-2 font-semibold">{inlineError.details.action}</p>
                    )}
                    {inlineError.details.policy && (
                      <p className="mt-1 text-sm opacity-90">{inlineError.details.policy}</p>
                    )}
                  </div>
                </InlineAlert>
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

                {/* Lunch slots */}
                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-500 mb-2">Lunch</p>
                  <div className="grid grid-cols-3 gap-2">
                    {LUNCH_SLOTS.map((slotObj) => (
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

                {/* Dinner slots */}
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">Dinner</p>
                  <div className="grid grid-cols-3 gap-2">
                    {DINNER_SLOTS.map((slotObj) => (
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
                  const isPassed = isReservationPassed(reservation)

                  const displayTime = getLabelFromSlot(reservation.slot)

                  return (
                    <div
                      key={reservation.id}
                      className={`border rounded-lg p-4 ${
                        isPassed && reservation.status === 'confirmed'
                          ? 'bg-red-50 border-red-200'
                          : 'border-gray-200'
                      }`}
                    >
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

                      {/* Only show action buttons for confirmed reservations that haven't passed */}
                      {reservation.status === 'confirmed' && !isPassed && (
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
              For last-minute reservations or modifications, please call us directly
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