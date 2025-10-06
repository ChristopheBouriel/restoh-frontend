import { useState, useEffect } from 'react'
import { Eye, Search, Shield, User, Mail, Phone, Calendar, TrendingUp, UserCheck, UserX } from 'lucide-react'
import useUsersStore from '../../store/usersStore'
import SimpleSelect from '../../components/common/SimpleSelect'

const UsersManagement = () => {
  const { 
    users, 
    initializeUsers, 
    toggleUserStatus,
    updateUserRole,
    getUsersStats,
    searchUsers,
    getActiveUsers,
    getInactiveUsers,
    getUsersByRole
  } = useUsersStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedUser, setSelectedUser] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    initializeUsers()
  }, [initializeUsers])

  const stats = getUsersStats()

  // Options pour les filtres
  const roleOptions = [
    { value: 'all', label: 'Tous les rôles' },
    { value: 'admin', label: 'Administrateurs' },
    { value: 'user', label: 'Utilisateurs' }
  ]

  const statusOptions = [
    { value: 'all', label: 'Tous les statuts' },
    { value: 'active', label: 'Actifs' },
    { value: 'inactive', label: 'Inactifs' }
  ]

  const roleUpdateOptions = [
    { value: 'user', label: 'Utilisateur' },
    { value: 'admin', label: 'Administrateur' }
  ]

  // Fonction de filtrage
  const filteredUsers = users.filter(user => {
    const searchMatch = searchQuery === '' || 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone?.includes(searchQuery)

    const roleMatch = roleFilter === 'all' || user.role === roleFilter
    const statusMatch = statusFilter === 'all' || 
      (statusFilter === 'active' && user.isActive) ||
      (statusFilter === 'inactive' && !user.isActive)

    return searchMatch && roleMatch && statusMatch
  })

  // Gestion du changement de statut
  const handleStatusToggle = async (userId) => {
    await toggleUserStatus(userId)
  }

  // Gestion du changement de rôle
  const handleRoleChange = async (userId, newRole) => {
    await updateUserRole(userId, newRole)
  }

  // Ouvrir le modal de détail
  const openUserModal = (user) => {
    setSelectedUser(user)
    setIsModalOpen(true)
  }

  // Fermer le modal
  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedUser(null)
  }

  // Fonction pour formater la date
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Jamais'
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Fonction pour obtenir la couleur du badge selon le rôle
  const getRoleColor = (role) => {
    return role === 'admin' 
      ? 'bg-purple-100 text-purple-800' 
      : 'bg-blue-100 text-blue-800'
  }

  // Fonction pour obtenir le libellé du rôle
  const getRoleLabel = (role) => {
    return role === 'admin' ? 'Admin' : 'Utilisateur'
  }

  return (
    <div className="p-6">
      {/* En-tête */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Gestion des Utilisateurs</h1>
        <p className="text-gray-600">Gérez tous les utilisateurs de la plateforme</p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center">
            <User className="h-8 w-8 text-blue-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center">
            <UserCheck className="h-8 w-8 text-green-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Actifs</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-purple-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Admins</p>
              <p className="text-2xl font-bold text-gray-900">{stats.admins}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center">
            <Mail className="h-8 w-8 text-orange-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Vérifiés</p>
              <p className="text-2xl font-bold text-gray-900">{stats.verified}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-emerald-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Ce mois</p>
              <p className="text-2xl font-bold text-gray-900">{stats.newThisMonth}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-indigo-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Actifs ce mois</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeThisMonth}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recherche et filtres</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rechercher
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Nom, email, téléphone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rôle
            </label>
            <SimpleSelect
              value={roleFilter}
              onChange={setRoleFilter}
              options={roleOptions}
              className="w-full"
            />
          </div>
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
        </div>
      </div>

      {/* Liste des utilisateurs */}
      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Utilisateurs ({filteredUsers.length})
          </h2>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            Aucun utilisateur trouvé avec ces critères.
          </div>
        ) : (
          <>
            {/* Vue Desktop - Tableau */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Utilisateur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rôle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Activité
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {user.id}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {user.email}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.phone || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                            {getRoleLabel(user.role)}
                          </span>
                          <SimpleSelect
                            value={user.role}
                            onChange={(newRole) => handleRoleChange(user.id, newRole)}
                            options={roleUpdateOptions}
                            className="w-[120px]"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {user.isActive ? 'Actif' : 'Inactif'}
                          </span>
                          {user.emailVerified ? (
                            <div className="text-xs text-green-600">✓ Email vérifié</div>
                          ) : (
                            <div className="text-xs text-orange-600">⚠ Email non vérifié</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>Commandes: {user.totalOrders}</div>
                        <div>Dépensé: {user.totalSpent.toFixed(2)}€</div>
                        <div>Réservations: {user.totalReservations}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => openUserModal(user)}
                            className="text-gray-400 hover:text-blue-600 transition-colors"
                            title="Voir les détails"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleStatusToggle(user.id)}
                            className={`transition-colors ${
                              user.isActive 
                                ? 'text-red-400 hover:text-red-600' 
                                : 'text-green-400 hover:text-green-600'
                            }`}
                            title={user.isActive ? 'Désactiver' : 'Activer'}
                          >
                            {user.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Vue Mobile/Tablet - Cards */}
            <div className="lg:hidden divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <div key={user.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => openUserModal(user)}
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                        title="Voir les détails"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                    <button
                      onClick={() => handleStatusToggle(user.id)}
                      className={`transition-colors ${
                        user.isActive 
                          ? 'text-red-400 hover:text-red-600' 
                          : 'text-green-400 hover:text-green-600'
                      }`}
                    >
                      {user.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">{user.name}</span>
                      <span className="text-xs text-gray-500">ID: {user.id}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">{user.email}</span>
                      <span className="text-sm text-gray-500">{user.phone || 'N/A'}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Commandes: {user.totalOrders}</span>
                      <span>Dépensé: {user.totalSpent.toFixed(2)}€</span>
                      <span>Réservations: {user.totalReservations}</span>
                    </div>

                    {!user.emailVerified && (
                      <div className="text-xs text-orange-600">⚠ Email non vérifié</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal de détail */}
      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Détails de l'utilisateur
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Informations personnelles */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Informations personnelles</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p><strong>ID:</strong> {selectedUser.id}</p>
                    <p><strong>Nom:</strong> {selectedUser.name}</p>
                    <p><strong>Email:</strong> {selectedUser.email}</p>
                    <p><strong>Téléphone:</strong> {selectedUser.phone || 'N/A'}</p>
                    <p><strong>Adresse:</strong> {selectedUser.address || 'N/A'}</p>
                    <p>
                      <strong>Rôle:</strong>{' '}
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(selectedUser.role)}`}>
                        {getRoleLabel(selectedUser.role)}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Statut et activité */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Statut et activité</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p>
                      <strong>Statut:</strong>{' '}
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        selectedUser.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedUser.isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </p>
                    <p>
                      <strong>Email vérifié:</strong>{' '}
                      {selectedUser.emailVerified ? (
                        <span className="text-green-600">✓ Oui</span>
                      ) : (
                        <span className="text-red-600">✗ Non</span>
                      )}
                    </p>
                    <p><strong>Inscription:</strong> {formatDate(selectedUser.createdAt)}</p>
                    <p><strong>Dernière connexion:</strong> {formatDate(selectedUser.lastLoginAt)}</p>
                  </div>
                </div>
              </div>

              {/* Statistiques d'activité */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Statistiques d'activité</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{selectedUser.totalOrders}</div>
                    <div className="text-sm text-blue-600">Commandes</div>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{selectedUser.totalSpent.toFixed(2)}€</div>
                    <div className="text-sm text-green-600">Total dépensé</div>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">{selectedUser.totalReservations}</div>
                    <div className="text-sm text-purple-600">Réservations</div>
                  </div>
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

export default UsersManagement