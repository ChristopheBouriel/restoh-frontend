import { useState, useEffect } from 'react'
import { Eye, Search, Shield, User, Mail, Phone, Calendar, TrendingUp, ShoppingCart, ShoppingBag, Calendar as CalendarIcon, Package, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import useUsersStore from '../../store/usersStore'
import { ordersApi, reservationsApi } from '../../api'
import SimpleSelect from '../../components/common/SimpleSelect'
import ImageWithFallback from '../../components/common/ImageWithFallback'

const UsersManagement = () => {
  const {
    users,
    stats,
    isLoadingStats,
    initializeUsers,
    fetchUsersStats,
    toggleUserStatus,
    updateUserRole,
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

  // User activity states - fetch on demand for security
  const [userOrders, setUserOrders] = useState([])
  const [userReservations, setUserReservations] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [loadingReservations, setLoadingReservations] = useState(false)
  const [showOrders, setShowOrders] = useState(false)
  const [showReservations, setShowReservations] = useState(false)
  const [selectedOrderDetail, setSelectedOrderDetail] = useState(null)
  const [selectedReservationDetail, setSelectedReservationDetail] = useState(null)

  useEffect(() => {
    initializeUsers()
    fetchUsersStats()
  }, [initializeUsers, fetchUsersStats])

  const roleOptions = [
    { value: 'all', label: 'All roles' },
    { value: 'admin', label: 'Administrators' },
    { value: 'user', label: 'Users' }
  ]

  const statusOptions = [
    { value: 'all', label: 'All statuses' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }
  ]

  const roleUpdateOptions = [
    { value: 'user', label: 'User' },
    { value: 'admin', label: 'Administrator' }
  ]

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

  const handleStatusToggle = async (user) => {
    await toggleUserStatus(user._id || user.id)
  }

  const handleRoleChange = async (user, newRole) => {
    await updateUserRole(user._id || user.id, newRole)
  }

  const openUserModal = async (user) => {
    setSelectedUser(user)
    setIsModalOpen(true)

    // Fetch orders and reservations immediately for accurate statistics
    const userId = user.id || user._id
    await Promise.all([
      fetchUserOrders(userId),
      fetchUserReservations(userId)
    ])
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedUser(null)
    setShowOrders(false)
    setShowReservations(false)
    setUserOrders([])
    setUserReservations([])
    setSelectedOrderDetail(null)
    setSelectedReservationDetail(null)
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Never'
    return new Date(dateStr).toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price || 0)
  }

  // Calculate real total spent from actual orders
  const calculateTotalSpent = () => {
    if (!userOrders || userOrders.length === 0) return 0
    return userOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0)
  }

  // Get actual orders count
  const getActualOrdersCount = () => {
    return userOrders.length
  }

  // Get actual reservations count
  const getActualReservationsCount = () => {
    return userReservations.length
  }

  // Fetch user's orders on demand (SECURE: only loads specific user's data)
  const fetchUserOrders = async (userId) => {
    if (!userId) return

    setLoadingOrders(true)
    const result = await ordersApi.getOrdersByUserId(userId)

    if (result.success) {
      setUserOrders(result.orders)
    } else {
      setUserOrders([])
    }
    setLoadingOrders(false)
  }

  // Fetch user's reservations on demand (SECURE: only loads specific user's data)
  const fetchUserReservations = async (userId) => {
    if (!userId) return

    setLoadingReservations(true)
    const result = await reservationsApi.getReservationsByUserId(userId)

    if (result.success) {
      setUserReservations(result.reservations)
    } else {
      setUserReservations([])
      console.error('Error fetching user reservations:', result.error)
    }
    setLoadingReservations(false)
  }

  const toggleOrders = () => {
    setShowOrders(!showOrders)
    setShowReservations(false)
  }

  const toggleReservations = () => {
    setShowReservations(!showReservations)
    setShowOrders(false)
  }

  const getRoleColor = (role) => {
    return role === 'admin' 
      ? 'bg-purple-100 text-purple-800' 
      : 'bg-blue-100 text-blue-800'
  }

  const getRoleLabel = (role) => {
    return role === 'admin' ? 'Admin' : 'User'
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Users Management</h1>
        <p className="text-gray-600">Manage all platform users</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {isLoadingStats ? (
          // Loading skeleton
          <>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white rounded-lg border p-4 animate-pulse">
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-gray-200 rounded mr-3"></div>
                  <div className="flex-1">
                    <div className="h-10 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              </div>
            ))}
          </>
        ) : stats ? (
          <>
            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center">
                <User className="h-8 w-8 text-blue-500 mr-3 flex-shrink-0" />
                <div className="flex-1 flex flex-col justify-between">
                  <p className="text-sm font-medium text-gray-600 h-10 flex items-start">Total</p>
                  <p className="text-2xl font-bold text-gray-900 tabular-nums">{stats.totalUsers}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center">
                <User className="h-8 w-8 text-green-500 mr-3 flex-shrink-0" />
                <div className="flex-1 flex flex-col justify-between">
                  <p className="text-sm font-medium text-gray-600 h-10 flex items-start">Active</p>
                  <p className="text-2xl font-bold text-gray-900 tabular-nums">{stats.activeUsers}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-emerald-500 mr-3 flex-shrink-0" />
                <div className="flex-1 flex flex-col justify-between">
                  <p className="text-sm font-medium text-gray-600 h-10 flex items-start">New this month</p>
                  <p className="text-2xl font-bold text-gray-900 tabular-nums">{stats.newUsers}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-purple-500 mr-3 flex-shrink-0" />
                <div className="flex-1 flex flex-col justify-between">
                  <p className="text-sm font-medium text-gray-600 h-10 flex items-start">Logged last month</p>
                  <p className="text-2xl font-bold text-gray-900 tabular-nums">{stats.recentlyLoggedUsers}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center">
                <ShoppingBag className="h-8 w-8 text-indigo-500 mr-3 flex-shrink-0" />
                <div className="flex-1 flex flex-col justify-between">
                  <p className="text-sm font-medium text-gray-600 h-10 flex items-start">Customers this month</p>
                  <p className="text-2xl font-bold text-gray-900 tabular-nums">{stats.activeCustomersLastMonth}</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="col-span-full text-center text-gray-500 py-4">
            Unable to load statistics
          </div>
        )}
      </div>

      {/* Filters and search */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Search and filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Name, email, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <SimpleSelect
              value={roleFilter}
              onChange={setRoleFilter}
              options={roleOptions}
              className="w-full"
              size="md"
            />
          </div>
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
        </div>
      </div>

      {/* Users list */}
      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Users ({filteredUsers.length})
          </h2>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No users found with these criteria.
          </div>
        ) : (
          <>
            {/* Desktop View - Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Activity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user._id || user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {user._id || user.id}
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
                        <div className="flex flex-col space-y-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                            {getRoleLabel(user.role)}
                          </span>
                          <SimpleSelect
                            value={user.role}
                            onChange={(newRole) => handleRoleChange(user, newRole)}
                            options={roleUpdateOptions}
                            className="w-[120px]"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-2">
                          {/* Toggle isActive */}
                          <button
                            onClick={() => handleStatusToggle(user)}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                              user.isActive ? 'bg-green-600' : 'bg-gray-200'
                            }`}
                            role="switch"
                            aria-checked={user.isActive}
                            title={user.isActive ? 'Deactivate' : 'Activate'}
                          >
                            <span
                              aria-hidden="true"
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                user.isActive ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                          {user.emailVerified ? (
                            <div className="text-xs text-green-600">✓ Email verified</div>
                          ) : (
                            <div className="text-xs text-orange-600">⚠ Not verified</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>Orders: {user.totalOrders}</div>
                        <div>Spent: {user.totalSpent.toFixed(2)}€</div>
                        <div>Reservations: {user.totalReservations}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => openUserModal(user)}
                          className="text-gray-400 hover:text-blue-600 transition-colors"
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile/Tablet View - Cards */}
            <div className="lg:hidden divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <div key={user._id || user.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => openUserModal(user)}
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {/* Toggle isActive - Mobile */}
                    <button
                      onClick={() => handleStatusToggle(user)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                        user.isActive ? 'bg-green-600' : 'bg-gray-200'
                      }`}
                      role="switch"
                      aria-checked={user.isActive}
                      title={user.isActive ? 'Deactivate' : 'Activate'}
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          user.isActive ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">{user.name}</span>
                      <span className="text-xs text-gray-500">ID: {user._id || user.id}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">{user.email}</span>
                      <span className="text-sm text-gray-500">{user.phone || 'N/A'}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Orders: {user.totalOrders}</span>
                      <span>Spent: {user.totalSpent.toFixed(2)}€</span>
                      <span>Reservations: {user.totalReservations}</span>
                    </div>

                    {!user.emailVerified && (
                      <div className="text-xs text-orange-600">⚠ Email not verified</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Detail modal */}
      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  User details
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Personal information</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p><strong>Name:</strong> {selectedUser.name}</p>
                    <p><strong>Email:</strong> {selectedUser.email}</p>
                    <p><strong>Phone:</strong> {selectedUser.phone || 'N/A'}</p>
                    <div>
                      <strong>Address:</strong>
                      {selectedUser.address && typeof selectedUser.address === 'object' ? (
                        <div className="ml-4 mt-1">
                          {selectedUser.address.street && <div>{selectedUser.address.street}</div>}
                          {selectedUser.address.city && <div>{selectedUser.address.city}</div>}
                          {selectedUser.address.state && <div>{selectedUser.address.state}</div>}
                          {selectedUser.address.zipCode && <div>{selectedUser.address.zipCode}</div>}
                          {!selectedUser.address.street && !selectedUser.address.city && !selectedUser.address.state && !selectedUser.address.zipCode && <div>N/A</div>}
                        </div>
                      ) : (
                        <span className="ml-2">{selectedUser.address || 'N/A'}</span>
                      )}
                    </div>
                    <p>
                      <strong>Role:</strong>{' '}
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(selectedUser.role)}`}>
                        {getRoleLabel(selectedUser.role)}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Status and activity */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Status and activity</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p>
                      <strong>Status:</strong>{' '}
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        selectedUser.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedUser.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </p>
                    <p>
                      <strong>Email verified:</strong>{' '}
                      {selectedUser.emailVerified ? (
                        <span className="text-green-600">✓ Yes</span>
                      ) : (
                        <span className="text-red-600">✗ No</span>
                      )}
                    </p>
                    <p><strong>Registration:</strong> {formatDate(selectedUser.createdAt)}</p>
                    <p><strong>Last login:</strong> {formatDate(selectedUser.lastLogin)}</p>
                  </div>
                </div>
              </div>

              {/* Activity statistics */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Activity statistics</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                    {loadingOrders ? (
                      <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto" />
                    ) : (
                      <>
                        <div className="text-2xl font-bold text-blue-600">{getActualOrdersCount()}</div>
                        <div className="text-sm text-blue-600">Orders</div>
                      </>
                    )}
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    {loadingOrders ? (
                      <Loader2 className="w-6 h-6 animate-spin text-green-500 mx-auto" />
                    ) : (
                      <>
                        <div className="text-2xl font-bold text-green-600">{formatPrice(calculateTotalSpent())}</div>
                        <div className="text-sm text-green-600">Total spent</div>
                      </>
                    )}
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                    {loadingReservations ? (
                      <Loader2 className="w-6 h-6 animate-spin text-purple-500 mx-auto" />
                    ) : (
                      <>
                        <div className="text-2xl font-bold text-purple-600">{getActualReservationsCount()}</div>
                        <div className="text-sm text-purple-600">Reservations</div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* View Activity Buttons */}
              <div className="mt-6 flex gap-4">
                <button
                  onClick={toggleOrders}
                  disabled={loadingOrders}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingOrders ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <ShoppingCart className="w-5 h-5" />
                  )}
                  <span className="font-medium">View Orders {userOrders.length > 0 && `(${userOrders.length})`}</span>
                  {showOrders ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                <button
                  onClick={toggleReservations}
                  disabled={loadingReservations}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors border border-purple-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingReservations ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <CalendarIcon className="w-5 h-5" />
                  )}
                  <span className="font-medium">View Reservations {userReservations.length > 0 && `(${userReservations.length})`}</span>
                  {showReservations ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {/* Orders List */}
              {showOrders && (
                <div className="mt-4 border border-blue-200 rounded-lg p-4 bg-blue-50/30">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    User Orders
                  </h4>
                  {loadingOrders ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    </div>
                  ) : userOrders.length > 0 ? (
                    <div className="space-y-2">
                      {userOrders.map((order) => (
                        <div
                          key={order.id || order._id}
                          onClick={() => setSelectedOrderDetail(order)}
                          className="bg-white p-3 rounded-lg border border-gray-200 hover:border-blue-400 cursor-pointer transition-colors"
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">#{order.orderNumber}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                  order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                  'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {order.status}
                                </span>
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                {formatDate(order.createdAt)}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-blue-600">{formatPrice(order.totalPrice)}</div>
                              <div className="text-xs text-gray-500">{order.items?.length || 0} items</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm text-center py-4">No orders found</p>
                  )}
                </div>
              )}

              {/* Reservations List */}
              {showReservations && (
                <div className="mt-4 border border-purple-200 rounded-lg p-4 bg-purple-50/30">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    User Reservations
                  </h4>
                  {loadingReservations ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                    </div>
                  ) : userReservations.length > 0 ? (
                    <div className="space-y-2">
                      {userReservations.map((reservation) => (
                        <div
                          key={reservation.id || reservation._id}
                          onClick={() => setSelectedReservationDetail(reservation)}
                          className="bg-white p-3 rounded-lg border border-gray-200 hover:border-purple-400 cursor-pointer transition-colors"
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">{formatDate(reservation.date)}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  reservation.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                  reservation.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                  'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {reservation.status}
                                </span>
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                {reservation.slot} • {reservation.guests} guests
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium text-gray-700">Table {reservation.tableNumber}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm text-center py-4">No reservations found</p>
                  )}
                </div>
              )}

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

      {/* Order Detail Modal */}
      {selectedOrderDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-[60] flex items-end justify-end p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl border-2 border-orange-500">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Order details #{selectedOrderDetail.orderNumber}
                </h2>
                <button
                  onClick={() => setSelectedOrderDetail(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Customer Info */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Customer information</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p><strong>Name:</strong> {selectedOrderDetail.userName || selectedUser?.name}</p>
                    <p><strong>Email:</strong> {selectedOrderDetail.userEmail || selectedUser?.email}</p>
                    <p><strong>Date:</strong> {formatDate(selectedOrderDetail.createdAt)}</p>
                  </div>
                </div>

                {/* Items */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Ordered items</h3>
                  <div className="space-y-3">
                    {selectedOrderDetail.items?.map((item, index) => (
                      <div key={index} className="flex items-center space-x-3 bg-gray-50 p-3 rounded-lg">
                        <div className="w-12 h-12 bg-gray-200 rounded-md overflow-hidden flex-shrink-0">
                          <ImageWithFallback
                            src={item.image}
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

                {/* Payment */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Payment</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Payment method:</span>
                      <span className="text-sm font-medium">
                        {selectedOrderDetail.paymentMethod === 'card' ? '💳 Credit card' : '💰 Cash'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Payment status:</span>
                      <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                        selectedOrderDetail.paymentStatus === 'paid'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        {selectedOrderDetail.paymentStatus === 'paid'
                          ? '✅ Paid'
                          : selectedOrderDetail.paymentMethod === 'cash'
                            ? '💰 To pay on delivery'
                            : '⏳ Pending'
                        }
                      </span>
                    </div>
                  </div>
                </div>

                {/* Total */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-orange-600">{formatPrice(selectedOrderDetail.totalPrice)}</span>
                  </div>
                </div>

                {/* Notes */}
                {selectedOrderDetail.notes && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Notes</h3>
                    <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedOrderDetail.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reservation Detail Modal */}
      {selectedReservationDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-[60] flex items-end justify-end p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl border-2 border-purple-500">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Reservation details
                </h2>
                <button
                  onClick={() => setSelectedReservationDetail(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Customer Info */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Customer information</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p><strong>Name:</strong> {selectedReservationDetail.userName || selectedUser?.name}</p>
                    <p><strong>Email:</strong> {selectedReservationDetail.userEmail || selectedUser?.email}</p>
                    <p><strong>Phone:</strong> {selectedReservationDetail.contactPhone || selectedUser?.phone || 'N/A'}</p>
                  </div>
                </div>

                {/* Reservation Details */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Reservation details</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Date:</span>
                      <span className="text-sm font-medium">{formatDate(selectedReservationDetail.date)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Time slot:</span>
                      <span className="text-sm font-medium">{selectedReservationDetail.slot}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Guests:</span>
                      <span className="text-sm font-medium">{selectedReservationDetail.guests} persons</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Table number:</span>
                      <span className="text-sm font-medium">Table {selectedReservationDetail.tableNumber}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Status:</span>
                      <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                        selectedReservationDetail.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                        selectedReservationDetail.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        selectedReservationDetail.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {selectedReservationDetail.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Special Requests */}
                {selectedReservationDetail.specialRequests && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Special requests</h3>
                    <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedReservationDetail.specialRequests}</p>
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

export default UsersManagement