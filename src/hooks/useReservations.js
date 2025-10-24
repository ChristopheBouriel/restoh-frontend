import { toast } from 'react-hot-toast'
import useReservationsStore from '../store/reservationsStore'
import { useAuth } from './useAuth'

export const useReservations = () => {
  const { user } = useAuth()
  const {
    reservations: allReservations,
    createReservation,
    updateReservation,
    cancelReservation
  } = useReservationsStore()

  // Backend already filters reservations by user (via auth middleware)
  // No need to filter again on frontend
  const userReservations = allReservations

  const handleCreateReservation = async (reservationData) => {
    if (!user) {
      toast.error('You must be logged in to create a reservation')
      throw new Error('User not authenticated')
    }

    try {
      // User info is attached by authentication middleware on backend
      // Only send reservation-specific data
      const result = await createReservation(reservationData)
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

  const handleUpdateReservation = async (reservationId, reservationData) => {
    if (!user) {
      toast.error('You must be logged in to update a reservation')
      throw new Error('User not authenticated')
    }

    try {
      // Backend will validate:
      // - Only 'confirmed' reservations can be updated
      // - Must be at least 1h before original time
      // - New time must be at least 1h from now
      const result = await updateReservation(reservationId, reservationData)
      if (result.success) {
        toast.success('Reservation updated successfully!')
        return result
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast.error(error.message || 'Error updating reservation')
      throw error
    }
  }

  const handleCancelReservation = async (reservationId) => {
    if (!user) {
      toast.error('You must be logged in to cancel a reservation')
      throw new Error('User not authenticated')
    }

    try {
      // Backend will validate:
      // - Only 'confirmed' reservations can be cancelled
      // - Must be at least 2h before reservation time
      const result = await cancelReservation(reservationId)

      if (result.success) {
        toast.success('Reservation cancelled successfully')
        return result
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast.error(error.message || 'Error cancelling reservation')
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

  // Business rules helpers
  const canEditReservation = (reservation) => {
    // Can only edit 'confirmed' reservations
    if (reservation.status !== 'confirmed') {
      return { canEdit: false, reason: 'Only confirmed reservations can be edited' }
    }

    // Must be at least 1h before reservation time
    const now = new Date()
    const reservationDateTime = new Date(`${reservation.date}T${reservation.time || '00:00'}:00`)
    const hoursUntilReservation = (reservationDateTime - now) / (1000 * 60 * 60)

    if (hoursUntilReservation < 1) {
      return { canEdit: false, reason: 'Cannot edit less than 1 hour before reservation time' }
    }

    return { canEdit: true }
  }

  const canCancelReservation = (reservation) => {
    // Can only cancel 'confirmed' reservations
    if (reservation.status !== 'confirmed') {
      return { canCancel: false, reason: 'Only confirmed reservations can be cancelled' }
    }

    // Must be at least 2h before reservation time
    const now = new Date()
    const reservationDateTime = new Date(`${reservation.date}T${reservation.time || '00:00'}:00`)
    const hoursUntilReservation = (reservationDateTime - now) / (1000 * 60 * 60)

    if (hoursUntilReservation < 2) {
      return { canCancel: false, reason: 'Cannot cancel less than 2 hours before reservation time' }
    }

    return { canCancel: true }
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

    if (!data.tableNumber || !Array.isArray(data.tableNumber) || data.tableNumber.length === 0) {
      errors.push('At least one table must be selected')
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
    canEditReservation,
    canCancelReservation,

    // User statistics
    totalReservations: userReservations.length,
    confirmedReservations: userReservations.filter(r => r.status === 'confirmed').length,
    completedReservations: userReservations.filter(r => r.status === 'completed').length
  }
}