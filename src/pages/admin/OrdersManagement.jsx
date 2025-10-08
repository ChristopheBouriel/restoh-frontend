import { useState, useEffect } from 'react'
import { Package, Eye, Clock, CheckCircle, Truck, XCircle, Filter } from 'lucide-react'
import useOrdersStore from '../../store/ordersStore'
import SimpleSelect from '../../components/common/SimpleSelect'
import CustomDatePicker from '../../components/common/CustomDatePicker'

const OrdersManagement = () => {
  const {
    orders,
    isLoading,
    fetchOrders,
    updateOrderStatus,
    getOrdersStats
  } = useOrdersStore()

  const [filterStatus, setFilterStatus] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Validation des dates : empêcher que la date de fin soit antérieure à la date de début
  const handleStartDateChange = (newStartDate) => {
    setStartDate(newStartDate)
    // Si la date de fin est antérieure à la nouvelle date de début, la réinitialiser
    if (endDate && newStartDate && new Date(endDate) < new Date(newStartDate)) {
      setEndDate('')
    }
  }

  const handleEndDateChange = (newEndDate) => {
    // Ne pas permettre une date de fin antérieure à la date de début
    if (startDate && newEndDate && new Date(newEndDate) < new Date(startDate)) {
      return // Ignorer le changement
    }
    setEndDate(newEndDate)
  }
  const [selectedOrder, setSelectedOrder] = useState(null)

  // Fonction helper pour déterminer la couleur de fond des commandes d'utilisateurs supprimés
  const getDeletedUserRowClass = (order) => {
    if (order.userId !== 'deleted-user') {
      return 'hover:bg-gray-50' // Comportement normal
    }

    // Cas d'utilisateur supprimé
    if (order.status === 'delivered' || order.status === 'cancelled') {
      // Cas n°1 : Livré ou annulé - gris clair mais plus foncé que la pastille
      return 'bg-gray-100 hover:bg-gray-200'
    } else if (order.isPaid) {
      // Cas n°2 : Payé avec autre statut - orange clair
      return 'bg-orange-50 hover:bg-orange-100'
    } else {
      // Cas n°3 : Non payé avec autre statut - rouge très clair
      return 'bg-red-50 hover:bg-red-100'
    }
  }

  useEffect(() => {
    // Charger toutes les commandes (mode admin)
    fetchOrders(true)
  }, [fetchOrders])

  // Filtrer les commandes selon le statut et les dates
  const filteredOrders = orders.filter(order => {
    const statusMatch = filterStatus === 'all' || order.status === filterStatus
    
    let dateMatch = true
    if (startDate || endDate) {
      const orderDate = new Date(order.createdAt)
      
      if (startDate) {
        const start = new Date(startDate)
        start.setHours(0, 0, 0, 0)
        dateMatch = dateMatch && orderDate >= start
      }
      
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        dateMatch = dateMatch && orderDate <= end
      }
    }
    
    return statusMatch && dateMatch
  })

  // Statistiques
  const stats = getOrdersStats()

  // Gestion du changement de statut
  const handleStatusChange = async (orderId, newStatus) => {
    const result = await updateOrderStatus(orderId, newStatus)
    if (result.success) {
      console.log('✅ Statut mis à jour')
    }
  }

  // Configuration des statuts
  const statusConfig = {
    pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    confirmed: { label: 'Confirmée', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
    preparing: { label: 'En préparation', color: 'bg-orange-100 text-orange-800', icon: Package },
    ready: { label: 'Prête', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    delivered: { label: 'Livrée', color: 'bg-gray-100 text-gray-800', icon: Truck },
    cancelled: { label: 'Annulée', color: 'bg-red-100 text-red-800', icon: XCircle }
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Commandes</h1>
        <p className="text-gray-600">Visualisez et gérez toutes les commandes des clients</p>
        <div className="mt-3 text-xs text-gray-500">
          <strong>Codes couleur :</strong>
          <span className="inline-block bg-gray-100 px-2 py-1 rounded mr-2 ml-2">Gris</span>Utilisateur supprimé - Livrée/Annulée
          <span className="inline-block bg-orange-50 px-2 py-1 rounded mr-2 ml-3">Orange</span>Utilisateur supprimé - Payée en cours
          <span className="inline-block bg-red-50 px-2 py-1 rounded mr-2 ml-3">Rouge</span>Utilisateur supprimé - Non payée
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total commandes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Package className="h-8 w-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">En attente</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-400" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">En cours</p>
              <p className="text-2xl font-bold text-blue-600">{stats.confirmed + stats.preparing}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Chiffre d'affaires</p>
              <p className="text-2xl font-bold text-green-600">{formatPrice(stats.totalRevenue)}</p>
            </div>
            <Truck className="h-8 w-8 text-green-400" />
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filtres</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Statut
            </label>
            <SimpleSelect
              value={filterStatus}
              onChange={setFilterStatus}
              options={[
                { value: 'all', label: 'Toutes les commandes' },
                { value: 'pending', label: 'En attente' },
                { value: 'confirmed', label: 'Confirmées' },
                { value: 'preparing', label: 'Préparation' },
                { value: 'ready', label: 'Prêtes' },
                { value: 'delivered', label: 'Livrées' },
                { value: 'cancelled', label: 'Annulées' }
              ]}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date de début
            </label>
            <CustomDatePicker
              value={startDate}
              onChange={handleStartDateChange}
              placeholder="Sélectionner une date de début"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date de fin
            </label>
            <CustomDatePicker
              value={endDate}
              onChange={handleEndDateChange}
              placeholder="Sélectionner une date de fin"
              minDate={startDate || undefined}
              className="w-full"
            />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <div className="flex items-center space-x-4">
            {(startDate || endDate || filterStatus !== 'all') && (
              <button
                onClick={() => {
                  setStartDate('')
                  setEndDate('')
                  setFilterStatus('all')
                }}
                className="text-sm text-orange-600 hover:text-orange-800 underline"
              >
                Effacer les filtres
              </button>
            )}
          </div>
          <span className="text-sm text-gray-500">
            {filteredOrders.length} commande(s) affichée(s)
          </span>
        </div>
      </div>

      {/* Liste des commandes */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune commande</h3>
            <p className="text-gray-500">
              {filterStatus === 'all' 
                ? 'Aucune commande n\'a été passée pour le moment.'
                : `Aucune commande avec le statut "${statusConfig[filterStatus]?.label.toLowerCase()}".`
              }
            </p>
          </div>
        ) : (
          <>
            {/* Vue Desktop - Tableau */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Commande
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Articles
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
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
                    const StatusIcon = statusConfig[order.status]?.icon || Package
                    return (
                      <tr key={order.id} className={getDeletedUserRowClass(order)}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {order.id}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{order.userName}</div>
                            <div className="text-sm text-gray-500">{order.userEmail}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {order.items.length} article(s)
                          </div>
                          <div className="text-xs text-gray-500">
                            {order.items.slice(0, 2).map(item => item.name).join(', ')}
                            {order.items.length > 2 && '...'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatPrice(order.totalAmount)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[order.status]?.color}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig[order.status]?.label}
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
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {order.status !== 'delivered' && order.status !== 'cancelled' && (
                              <SimpleSelect
                                value={order.status}
                                onChange={(newStatus) => handleStatusChange(order.id, newStatus)}
                                className="w-[110px]"
                                options={[
                                  { value: 'pending', label: 'En attente' },
                                  { value: 'confirmed', label: 'Confirmée' },
                                  { value: 'preparing', label: 'Préparation' },
                                  { value: 'ready', label: 'Prête' },
                                  { value: 'delivered', label: 'Livrée' },
                                  { value: 'cancelled', label: 'Annulée' }
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

            {/* Vue Mobile/Tablet - Cards */}
            <div className="lg:hidden divide-y divide-gray-200">
              {filteredOrders.map((order) => {
                const StatusIcon = statusConfig[order.status]?.icon || Package
                return (
                  <div key={order.id} className={`p-4 ${getDeletedUserRowClass(order)}`}>
                    {/* Header de la card */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">#{order.id}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[order.status]?.color}`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig[order.status]?.label}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-orange-600">
                        {formatPrice(order.totalAmount)}
                      </span>
                    </div>

                    {/* Informations client */}
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-900">{order.userName}</p>
                      <p className="text-xs text-gray-500">{order.userEmail}</p>
                    </div>

                    {/* Articles et date */}
                    <div className="flex justify-between items-center mb-3 text-xs text-gray-500">
                      <span>{order.items.length} article(s)</span>
                      <span>{formatDate(order.createdAt)}</span>
                    </div>

                    {/* Articles preview */}
                    <div className="mb-3">
                      <p className="text-xs text-gray-600">
                        {order.items.slice(0, 2).map(item => item.name).join(', ')}
                        {order.items.length > 2 && '...'}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="flex items-center space-x-2 text-orange-600 hover:text-orange-900 text-sm"
                      >
                        <Eye className="h-4 w-4" />
                        <span>Détails</span>
                      </button>
                      
                      {order.status !== 'delivered' && order.status !== 'cancelled' && (
                        <SimpleSelect
                          value={order.status}
                          onChange={(newStatus) => handleStatusChange(order.id, newStatus)}
                          className="w-[140px]"
                          options={[
                            { value: 'pending', label: 'En attente' },
                            { value: 'confirmed', label: 'Confirmée' },
                            { value: 'preparing', label: 'Préparation' },
                            { value: 'ready', label: 'Prête' },
                            { value: 'delivered', label: 'Livrée' },
                            { value: 'cancelled', label: 'Annulée' }
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

      {/* Modal détail commande */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Détail de la commande {selectedOrder.id}
                </h2>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Info client */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Informations client</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p><strong>Nom:</strong> {selectedOrder.userName}</p>
                    <p><strong>Email:</strong> {selectedOrder.userEmail}</p>
                    <p><strong>Date:</strong> {formatDate(selectedOrder.createdAt)}</p>
                  </div>
                </div>

                {/* Articles */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Articles commandés</h3>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="flex items-center space-x-3 bg-gray-50 p-3 rounded-lg">
                        <div className="w-12 h-12 bg-gray-200 rounded-md overflow-hidden">
                          <img
                            src={`/images/menu/${item.image}`}
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

                {/* Paiement */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Paiement</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Moyen de paiement:</span>
                      <span className="text-sm font-medium">
                        {selectedOrder.paymentMethod === 'card' ? '💳 Carte bancaire' : '💰 Espèces'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Statut du règlement:</span>
                      <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                        selectedOrder.isPaid 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        {selectedOrder.isPaid 
                          ? '✅ Payé' 
                          : selectedOrder.paymentMethod === 'cash' 
                            ? '💰 À payer à la réception'
                            : '⏳ En attente'
                        }
                      </span>
                    </div>
                  </div>
                </div>

                {/* Total */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-orange-600">{formatPrice(selectedOrder.totalAmount)}</span>
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