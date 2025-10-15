import { useState, useEffect } from 'react'
import { Calendar, Clock, Users, Plus, Edit, Trash2, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useReservations } from '../../hooks/useReservations'
import useAuthStore from '../../store/authStore'
import CustomDatePicker from '../../components/common/CustomDatePicker'

const Reservations = () => {
  const { user } = useAuthStore()
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [partySize, setPartySize] = useState(2)
  const [contactPhone, setContactPhone] = useState('')
  const [specialRequests, setSpecialRequests] = useState('')
  const [editingId, setEditingId] = useState(null)

  // Pre-fill phone from user profile
  useEffect(() => {
    if (user?.phone && !contactPhone) {
      setContactPhone(user.phone)
    }
  }, [user, contactPhone])

  // Use reservations hook with persistence
  const {
    reservations,
    createReservation,
    updateReservation,
    cancelReservation,
    validateReservationData
  } = useReservations()

  const availableTimes = [
    '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'
  ]

  const getStatusInfo = (status) => {
    switch (status) {
      case 'confirmed':
        return {
          label: 'Confirmed',
          color: 'text-green-600 bg-green-50',
          icon: CheckCircle
        }
      case 'pending':
        return {
          label: 'Pending',
          color: 'text-yellow-600 bg-yellow-50',
          icon: AlertCircle
        }
      case 'cancelled':
        return {
          label: 'Cancelled',
          color: 'text-red-600 bg-red-50',
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

  const handleSubmit = (e) => {
    e.preventDefault()

    const reservationData = {
      date: selectedDate,
      time: selectedTime,
      guests: partySize,
      contactPhone: contactPhone,
      requests: specialRequests
    }

    // Validation
    const errors = validateReservationData(reservationData)
    if (errors.length > 0) {
      toast.error(errors[0])
      return
    }

    try {
      createReservation(reservationData)

      // Reset form (keep phone if it's from profile)
      setSelectedDate('')
      setSelectedTime('')
      setPartySize(2)
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
    setSelectedTime(reservation.time)
    setPartySize(reservation.guests)
    setContactPhone(reservation.contactPhone || '')
    setSpecialRequests(reservation.specialRequests || '')
    toast.info('Edit mode enabled - use the form above')
  }

  const handleCancelReservation = async (reservationId) => {
    await cancelReservation(reservationId)
  }

  const handleUpdate = (e) => {
    e.preventDefault()

    const reservationData = {
      date: selectedDate,
      time: selectedTime,
      guests: partySize,
      contactPhone: contactPhone,
      requests: specialRequests
    }

    // Validation
    const errors = validateReservationData(reservationData)
    if (errors.length > 0) {
      toast.error(errors[0])
      return
    }

    try {
      updateReservation(editingId, reservationData)

      // Reset form and editing state (keep phone if from profile)
      setSelectedDate('')
      setSelectedTime('')
      setPartySize(2)
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reservations</h1>
          <p className="text-gray-600">Book a table and manage your reservations</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* New Reservation */}
          <div className="bg-white rounded-lg shadow-sm p-6">
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

              {/* Heure */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <Clock className="w-4 h-4 inline mr-2" />
                  Time
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {availableTimes.map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setSelectedTime(time)}
                      className={`p-2 text-sm rounded-md border transition-colors ${
                        selectedTime === time
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nombre de personnes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="w-4 h-4 inline mr-2" />
                  Number of guests
                </label>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setPartySize(Math.max(1, partySize - 1))}
                    className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                  >
                    -
                  </button>
                  <span className="text-xl font-semibold w-12 text-center">
                    {partySize}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPartySize(partySize + 1)}
                    className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
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
                  disabled={!selectedDate || !selectedTime}
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
                      setSelectedTime('')
                      setPartySize(2)
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
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              My reservations
            </h2>

            <div className="space-y-4">
              {reservations.length > 0 ? (
                reservations.map((reservation) => {
                  const statusInfo = getStatusInfo(reservation.status)
                  const StatusIcon = statusInfo.icon

                  return (
                    <div key={reservation.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-semibold">
                              {new Date(reservation.date).toLocaleDateString('en-US')}
                            </span>
                            <span className="text-gray-500">at {reservation.time}</span>
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
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No reservations
                  </h3>
                  <p className="text-gray-600">
                    You don't have any reservations yet.
                  </p>
                </div>
              )}
            </div>

            {reservations.length > 0 && (
              <div className="mt-6 text-center">
                <button className="text-primary-600 hover:text-primary-700 font-medium">
                  View history
                </button>
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
              <strong>Cancellation policy:</strong>
              <br />
              Free cancellation up to 2 hours before reservation.
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