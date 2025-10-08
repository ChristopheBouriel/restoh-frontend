import { useState, useEffect } from 'react'
import { Eye, Users, Calendar, Clock, MapPin } from 'lucide-react'
import useReservationsStore from '../../store/reservationsStore'
import SimpleSelect from '../../components/common/SimpleSelect'
import CustomDatePicker from '../../components/common/CustomDatePicker'

const ReservationsManagement = () => {
  const {
    reservations,
    fetchReservations,
    updateReservationStatus,
    assignTable,
    getReservationsStats
  } = useReservationsStore()

  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedReservation, setSelectedReservation] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    // Charger toutes les réservations (mode admin)
    fetchReservations(true)
  }, [fetchReservations])

  const stats = getReservationsStats()

  // Options pour les filtres
  const statusOptions = [
    { value: 'all', label: 'Tous les statuts' },
    { value: 'pending', label: 'En attente' },
    { value: 'confirmed', label: 'Confirmée' },
    { value: 'seated', label: 'Installée' },
    { value: 'completed', label: 'Terminée' },
    { value: 'cancelled', label: 'Annulée' }
  ]

  const dateOptions = [
    { value: 'all', label: 'Toutes les dates' },
    { value: 'today', label: 'Aujourd\'hui' },
    { value: 'upcoming', label: 'À venir' },
    { value: 'past', label: 'Passées' }
  ]

  const newStatusOptions = [
    { value: 'pending', label: 'En attente' },
    { value: 'confirmed', label: 'Confirmée' },
    { value: 'seated', label: 'Installée' },
    { value: 'completed', label: 'Terminée' },
    { value: 'cancelled', label: 'Annulée' }
  ]

  // Fonction de filtrage
  const filteredReservations = reservations.filter(reservation => {
    const statusMatch = statusFilter === 'all' || reservation.status === statusFilter
    
    let dateMatch = true
    const reservationDate = new Date(reservation.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Vérifier d'abord si on utilise la période (date range)
    const hasDateRange = startDate || endDate
    
    if (hasDateRange) {
      // Utiliser le filtrage par période
      if (startDate && endDate) {
        // Les deux dates sont définies
        dateMatch = reservation.date >= startDate && reservation.date <= endDate
      } else if (startDate) {
        // Seulement la date de début
        dateMatch = reservation.date >= startDate
      } else if (endDate) {
        // Seulement la date de fin
        dateMatch = reservation.date <= endDate
      }
    } else {
      // Utiliser le filtrage par date simple (existant)
      if (dateFilter === 'today') {
        const todayStr = today.toISOString().split('T')[0]
        dateMatch = reservation.date === todayStr
      } else if (dateFilter === 'upcoming') {
        dateMatch = reservationDate >= today
      } else if (dateFilter === 'past') {
        dateMatch = reservationDate < today
      }
    }

    return statusMatch && dateMatch
  })

  // Fonction pour vider les champs de période
  const clearDateRange = () => {
    setStartDate('')
    setEndDate('')
  }

  // Gestion du changement de statut
  const handleStatusChange = async (reservationId, newStatus) => {
    await updateReservationStatus(reservationId, newStatus)
  }

  // Ouvrir le modal de détail
  const openReservationModal = (reservation) => {
    setSelectedReservation(reservation)
    setIsModalOpen(true)
  }

  // Fermer le modal
  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedReservation(null)
  }

  // Fonction pour formater la date
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Fonction pour obtenir la couleur du badge selon le statut
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'confirmed': return 'bg-blue-100 text-blue-800'
      case 'seated': return 'bg-purple-100 text-purple-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Fonction pour obtenir le libellé du statut
  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'En attente'
      case 'confirmed': return 'Confirmée'
      case 'seated': return 'Installée'
      case 'completed': return 'Terminée'
      case 'cancelled': return 'Annulée'
      default: return status
    }
  }

  return (
    <div className="p-6">
      {/* En-tête */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Gestion des Réservations</h1>
        <p className="text-gray-600">Gérez toutes les réservations du restaurant</p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-blue-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-yellow-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">En attente</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Confirmées</p>
              <p className="text-2xl font-bold text-gray-900">{stats.confirmed}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-green-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Aujourd'hui</p>
              <p className="text-2xl font-bold text-gray-900">{stats.todayTotal}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-purple-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Couverts total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalGuests}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-orange-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Couverts aujourd'hui</p>
              <p className="text-2xl font-bold text-gray-900">{stats.todayGuests}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filtres</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Statut
            </label>
            <SimpleSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={statusOptions}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dates
            </label>
            <SimpleSelect
              value={dateFilter}
              onChange={setDateFilter}
              options={dateOptions}
              className="w-full"
              disabled={startDate || endDate}
            />
          </div>
        </div>
        
        {/* Période Section */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">Période</h3>
            {(startDate || endDate) && (
              <button 
                onClick={clearDateRange}
                className="text-xs text-gray-500 hover:text-gray-700 font-medium"
              >
                Vider les champs
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Date de début
              </label>
              <CustomDatePicker
                value={startDate}
                onChange={setStartDate}
                className="w-full"
                placeholder="Sélectionner date de début"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Date de fin
              </label>
              <CustomDatePicker
                value={endDate}
                onChange={setEndDate}
                className="w-full"
                minDate={startDate}
                placeholder="Sélectionner date de fin"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Liste des réservations */}
      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Réservations ({filteredReservations.length})
          </h2>
        </div>

        {filteredReservations.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            Aucune réservation trouvée avec ces filtres.
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
                      Date & Heure
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Couverts
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Table
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredReservations.map((reservation) => (
                    <tr key={reservation.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {reservation.userName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {reservation.userEmail}
                          </div>
                          <div className="text-sm text-gray-500">
                            {reservation.phone}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(reservation.date)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {reservation.time}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 text-gray-400 mr-1" />
                          <span className="text-sm text-gray-900">{reservation.guests}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {reservation.tableNumber ? (
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                            <span className="text-sm text-gray-900">Table {reservation.tableNumber}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Non assignée</span>
                        )}
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
                            options={newStatusOptions}
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
                <div key={reservation.id} className="p-4 hover:bg-gray-50">
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
                        options={newStatusOptions}
                        className="w-[110px]"
                      />
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(reservation.status)}`}>
                      {getStatusLabel(reservation.status)}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">{reservation.userName}</span>
                      <div className="flex items-center text-sm text-gray-500">
                        <Users className="h-4 w-4 mr-1" />
                        {reservation.guests} couverts
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">{reservation.userEmail}</span>
                      <span className="text-sm text-gray-500">{reservation.phone}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(reservation.date)} - {reservation.time}
                      </div>
                      {reservation.tableNumber ? (
                        <div className="flex items-center text-sm text-gray-500">
                          <MapPin className="h-4 w-4 mr-1" />
                          Table {reservation.tableNumber}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Non assignée</span>
                      )}
                    </div>
                    
                    {reservation.specialRequests && (
                      <div className="text-sm text-gray-600 bg-gray-50 rounded p-2">
                        <strong>Demandes spéciales:</strong> {reservation.specialRequests}
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
                  Détails de la réservation
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
                    <p><strong>Nom:</strong> {selectedReservation.userName}</p>
                    <p><strong>Email:</strong> {selectedReservation.userEmail}</p>
                    <p><strong>Téléphone:</strong> {selectedReservation.phone}</p>
                  </div>
                </div>

                {/* Informations réservation */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Réservation</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p><strong>ID:</strong> {selectedReservation.id}</p>
                    <p><strong>Date:</strong> {formatDate(selectedReservation.date)}</p>
                    <p><strong>Heure:</strong> {selectedReservation.time}</p>
                    <p><strong>Couverts:</strong> {selectedReservation.guests}</p>
                    <p><strong>Table:</strong> {selectedReservation.tableNumber || 'Non assignée'}</p>
                    <p>
                      <strong>Statut:</strong>{' '}
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
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Demandes spéciales</h3>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-gray-700">{selectedReservation.specialRequests}</p>
                  </div>
                </div>
              )}

              {/* Historique */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Historique</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm text-gray-600">
                  <p><strong>Créée le:</strong> {new Date(selectedReservation.createdAt).toLocaleString('fr-FR')}</p>
                  <p><strong>Modifiée le:</strong> {new Date(selectedReservation.updatedAt).toLocaleString('fr-FR')}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex justify-end space-x-4">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Fermer
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