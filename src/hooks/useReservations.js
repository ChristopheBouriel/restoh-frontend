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

  // Filtrer les réservations pour l'utilisateur connecté uniquement
  // ✅ Utiliser allReservations directement pour la réactivité
  const userReservations = user 
    ? allReservations.filter(r => r.userId === user.id) 
    : []


  const handleCreateReservation = async (reservationData) => {
    if (!user) {
      toast.error('Vous devez être connecté pour créer une réservation')
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
        toast.success('Réservation créée avec succès !')
        return result
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast.error('Erreur lors de la création de la réservation')
      throw error
    }
  }

  const handleUpdateReservation = async (reservationId) => {
    if (!user) {
      toast.error('Vous devez être connecté pour modifier une réservation')
      throw new Error('User not authenticated')
    }

    try {
      const result = await updateReservationStatus(reservationId, 'pending') // Remet en attente pour re-validation
      if (result.success) {
        toast.success('Réservation modifiée avec succès !')
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast.error('Erreur lors de la modification de la réservation')
      throw error
    }
  }

  const handleCancelReservation = async (reservationId) => {
    if (!user) {
      toast.error('Vous devez être connecté pour annuler une réservation')
      throw new Error('User not authenticated')
    }

    try {
      const result = await updateReservationStatus(reservationId, 'cancelled')
      
      if (result.success) {
        toast.success('Réservation annulée')
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast.error('Erreur lors de l\'annulation de la réservation')
      throw error
    }
  }

  const handleConfirmCancellation = async (reservationId) => {
    if (window.confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) {
      await handleCancelReservation(reservationId)
      return true
    }
    return false
  }

  // Formatage des dates
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR')
  }

  const formatDateTime = (date, time) => {
    return `${formatDate(date)} à ${time}`
  }

  // Validation
  const validateReservationData = (data) => {
    const errors = []
    
    if (!data.date) {
      errors.push('La date est obligatoire')
    }
    
    if (!data.time) {
      errors.push('L\'heure est obligatoire')
    }
    
    if (!data.guests || data.guests < 1) {
      errors.push('Le nombre de personnes doit être au moins 1')
    }
    
    // Vérifier que la date n'est pas dans le passé
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const reservationDate = new Date(data.date)
    
    if (reservationDate < today) {
      errors.push('Impossible de réserver dans le passé')
    }
    
    return errors
  }

  return {
    // État - seulement les réservations de l'utilisateur connecté
    reservations: userReservations,
    upcomingReservations: userReservations.filter(r => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const reservationDate = new Date(r.date)
      return reservationDate >= today && r.status !== 'cancelled'
    }).sort((a, b) => new Date(a.date) - new Date(b.date)),
    
    // Actions avec gestion d'erreurs
    createReservation: handleCreateReservation,
    updateReservation: handleUpdateReservation,
    cancelReservation: handleConfirmCancellation,
    
    // Utilitaires
    formatDate,
    formatDateTime,
    validateReservationData,
    
    // Statistiques pour l'utilisateur
    totalReservations: userReservations.length,
    confirmedReservations: userReservations.filter(r => r.status === 'confirmed').length,
    pendingReservations: userReservations.filter(r => r.status === 'pending').length
  }
}