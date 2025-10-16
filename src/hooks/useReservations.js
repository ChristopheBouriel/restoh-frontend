import { toast } from 'react-hot-toast'
import useReservationsStore from '../store/reservationsStore'
import { useAuth } from './useAuth'

export const useReservations = () => {
  const { user } = useAuth()
  const {
    reservations: allReservations,
    createReservation,
    updateReservationStatus
  } = useReservationsStore()

  // Filter reservations for logged-in user only
  // ✅ Use allReservations directly for reactivity
  const userReservations = user
    ? allReservations.filter(r => r.userId === user.id)
    : []


  const handleCreateReservation = async (reservationData) => {
    if (!user) {
      toast.error('You must be logged in to create a reservation')
      throw new Error('User not authenticated')
    }

    try {
      const fullReservationData = {
        ...reservationData,
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        phone: user.phone || '',
        guests: reservationData.guests,
        specialRequests: reservationData.requests || ''
      }


      const result = await createReservation(fullReservationData)
      if (result.success) {
        toast.success('Reservation created successfully!')
        return result
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast.error('Error creating reservation')
      throw error
    }
  }

  const handleUpdateReservation = async (reservationId) => {
    if (!user) {
      toast.error('You must be logged in to update a reservation')
      throw new Error('User not authenticated')
    }

    try {
      const result = await updateReservationStatus(reservationId, 'pending') // Reset to pending for re-validation
      if (result.success) {
        toast.success('Reservation updated successfully!')
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast.error('Error updating reservation')
      throw error
    }
  }

  const handleCancelReservation = async (reservationId) => {
    if (!user) {
      toast.error('You must be logged in to cancel a reservation')
      throw new Error('User not authenticated')
    }

    try {
      const result = await updateReservationStatus(reservationId, 'cancelled')

      if (result.success) {
        toast.success('Reservation cancelled')
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast.error('Error cancelling reservation')
      throw error
    }
  }

  const handleConfirmCancellation = async (reservationId) => {
    if (window.confirm('Are you sure you want to cancel this reservation?')) {
      await handleCancelReservation(reservationId)
      return true
    }
    return false
  }

  // Date formatting
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR')
  }

  const formatDateTime = (date, time) => {
    return `${formatDate(date)} at ${time}`
  }

  // Validation
  const validateReservationData = (data) => {
    const errors = []

    if (!data.date) {
      errors.push('Date is required')
    }

    if (!data.slot || typeof data.slot !== 'number') {
      errors.push('Time slot is required')
    }

    if (!data.guests || data.guests < 1) {
      errors.push('Number of guests must be at least 1')
    }

    if (!data.contactPhone) {
      errors.push('Contact phone is required')
    }

    // Check that date is not in the past
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const reservationDate = new Date(data.date)

    if (reservationDate < today) {
      errors.push('Cannot book in the past')
    }

    return errors
  }

  return {
    // State - logged-in user's reservations only
    reservations: userReservations,
    upcomingReservations: userReservations.filter(r => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const reservationDate = new Date(r.date)
      return reservationDate >= today && r.status !== 'cancelled'
    }).sort((a, b) => new Date(a.date) - new Date(b.date)),

    // Actions with error handling
    createReservation: handleCreateReservation,
    updateReservation: handleUpdateReservation,
    cancelReservation: handleConfirmCancellation,

    // Utilities
    formatDate,
    formatDateTime,
    validateReservationData,

    // User statistics
    totalReservations: userReservations.length,
    confirmedReservations: userReservations.filter(r => r.status === 'confirmed').length,
    pendingReservations: userReservations.filter(r => r.status === 'pending').length
  }
}