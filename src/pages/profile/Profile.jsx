import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { User, Mail, Phone, MapPin, Lock, Save, AlertCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useAuth } from '../../hooks/useAuth'
import { authApi, emailApi } from '../../api'
import { useAuthContext } from '../../contexts/AuthContext'
import DeleteAccountModal from '../../components/profile/DeleteAccountModal'
import { validationRules, validatePasswordMatch } from '../../utils/formValidators'
import { ROUTES } from '../../constants'

const Profile = () => {
  const navigate = useNavigate()
  const { user, updateProfile, changePassword, isLoading } = useAuth()
  const { logout } = useAuthContext()
  const [activeTab, setActiveTab] = useState('personal')
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteModalStep, setDeleteModalStep] = useState('initial')
  const [deleteBlockMessage, setDeleteBlockMessage] = useState('')
  const [activeReservations, setActiveReservations] = useState([])
  const [blockingOrders, setBlockingOrders] = useState([])
  const [isDeleting, setIsDeleting] = useState(false)
  const [isResendingVerification, setIsResendingVerification] = useState(false)

  const [notifications, setNotifications] = useState({
    newsletter: user?.notifications?.newsletter ?? false,
    promotions: user?.notifications?.promotions ?? false,
  })

  // React Hook Form for profile
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    reset: resetProfile,
    formState: { errors: profileErrors }
  } = useForm({
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      street: user?.address?.street || '',
      city: user?.address?.city || '',
      zipCode: user?.address?.zipCode || '',
      state: user?.address?.state || '',
    }
  })

  // React Hook Form for password change
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    watch: watchPassword,
    reset: resetPassword,
    formState: { errors: passwordErrors }
  } = useForm({
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  })

  const newPassword = watchPassword('newPassword')

  // Sync profile form with user when user changes
  useEffect(() => {
    if (user) {
      resetProfile({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        street: user.address?.street || '',
        city: user.address?.city || '',
        zipCode: user.address?.zipCode || '',
        state: user.address?.state || '',
      })
      setNotifications({
        newsletter: user.notifications?.newsletter ?? false,
        promotions: user.notifications?.promotions ?? false,
      })
    }
  }, [user, resetProfile])

  const handleNotificationChange = (e) => {
    setNotifications({
      ...notifications,
      [e.target.name]: e.target.checked
    })
  }

  const onSaveProfile = async (data) => {
    // Restructure data to match backend schema
    const dataToSend = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: {
        street: data.street,
        city: data.city,
        zipCode: data.zipCode,
        state: data.state
      },
      notifications
    }

    const success = await updateProfile(dataToSend)
    if (success) {
      setIsEditing(false)
    }
  }

  const onChangePassword = async (data) => {
    try {
      const { success, error } = await changePassword(
        data.currentPassword,
        data.newPassword
      )

      if (success) {
        toast.success('Password changed successfully')
        resetPassword()
      } else {
        toast.error(error || 'Error changing password')
      }
    } catch (err) {
      toast.error('Error changing password')
    }
  }

  const handleDeleteAccount = async (password, options = {}) => {
    setIsDeleting(true)

    // Call API directly to avoid store re-renders that reset modal state
    const result = await authApi.deleteAccount(password, options)

    if (result.success) {
      // Success - logout (clears auth + revokes refresh token) and redirect
      setIsDeleting(false)
      setShowDeleteModal(false)
      setDeleteModalStep('initial')
      await logout()
      toast.success('Account deleted successfully')
      navigate(ROUTES.HOME)
    } else if (result.code === 'UNPAID_CASH_ORDERS') {
      // Blocked - cannot delete account (cash orders in preparation)
      setIsDeleting(false)
      setDeleteBlockMessage(result.error)
      setBlockingOrders(result.orders || [])
      setDeleteModalStep('blocked')
    } else if (result.code === 'ACTIVE_RESERVATIONS_WARNING') {
      // Has active reservations - show confirmation step
      setIsDeleting(false)
      setActiveReservations(result.reservations || [])
      setDeleteModalStep('confirm-reservations')
    } else {
      // Generic error
      setIsDeleting(false)
      toast.error(result.error || 'Error deleting account')
    }

    return result
  }

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false)
    setDeleteModalStep('initial')
    setDeleteBlockMessage('')
    setActiveReservations([])
    setBlockingOrders([])
  }

  const handleResendVerification = async () => {
    if (!user?.email) return

    setIsResendingVerification(true)

    try {
      const result = await emailApi.resendVerification(user.email)

      if (result.success) {
        toast.success('Verification email sent! Check your inbox.')
      } else {
        toast.error(result.error || 'Failed to resend verification email')
      }
    } catch (error) {
      toast.error('Failed to resend verification email')
    } finally {
      setIsResendingVerification(false)
    }
  }

  const tabs = [
    { id: 'personal', label: 'Personal information', icon: User },
    { id: 'security', label: 'Security', icon: Lock }
  ]

  return (
    <div className="min-h-screen bg-brown-200 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-brown-400 p-6 mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-primary-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
              <p className="text-gray-600">Manage your personal information and preferences</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-brown-400 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm border border-brown-400 p-6">
          {activeTab === 'personal' && (
            <div>
              {/* Email verification banner */}
              {user && !user.isEmailVerified && (
                <div className="mb-6 rounded-md bg-amber-50 border border-amber-200 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-amber-400" />
                    </div>
                    <div className="ml-3 flex-1">
                      <h3 className="text-sm font-medium text-amber-800">
                        Email Not Verified
                      </h3>
                      <div className="mt-2 text-sm text-amber-700">
                        <p className="mb-3">
                          Your email address has not been verified yet. Please check your inbox
                          for the verification email or request a new one.
                        </p>
                        <button
                          onClick={handleResendVerification}
                          disabled={isResendingVerification}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-amber-700 bg-amber-100 hover:bg-amber-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50"
                        >
                          {isResendingVerification ? 'Sending...' : 'Resend Verification Email'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Personal information
                </h2>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Edit
                  </button>
                ) : (
                  <div className="space-x-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="text-gray-600 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmitProfile(onSaveProfile)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Nom */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Full name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input
                        id="name"
                        type="text"
                        {...registerProfile('name', validationRules.name)}
                        disabled={!isEditing}
                        className={`w-full pl-10 pr-3 py-2 border-2 ${profileErrors.name ? 'border-red-300' : 'border-primary-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50`}
                      />
                    </div>
                    {profileErrors.name && (
                      <p className="mt-1 text-sm text-red-600">{profileErrors.name.message}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input
                        id="email"
                        type="email"
                        {...registerProfile('email', validationRules.email)}
                        disabled={!isEditing}
                        className={`w-full pl-10 pr-3 py-2 border-2 ${profileErrors.email ? 'border-red-300' : 'border-primary-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50`}
                      />
                    </div>
                    {profileErrors.email && (
                      <p className="mt-1 text-sm text-red-600">{profileErrors.email.message}</p>
                    )}
                  </div>

                  {/* Téléphone */}
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input
                        id="phone"
                        type="tel"
                        {...registerProfile('phone', validationRules.phone)}
                        disabled={!isEditing}
                        placeholder="0612345678"
                        className={`w-full pl-10 pr-3 py-2 border-2 ${profileErrors.phone ? 'border-red-300' : 'border-primary-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50`}
                      />
                    </div>
                    {profileErrors.phone && (
                      <p className="mt-1 text-sm text-red-600">{profileErrors.phone.message}</p>
                    )}
                  </div>

                  {/* Zip Code */}
                  <div>
                    <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-2">
                      Zip Code
                    </label>
                    <input
                      id="zipCode"
                      type="text"
                      {...registerProfile('zipCode')}
                      disabled={!isEditing}
                      placeholder="75001"
                      className="w-full px-3 py-2 border-2 border-primary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50"
                    />
                  </div>
                </div>

                {/* Street Address */}
                <div>
                  <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-2">
                    Street Address
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      id="street"
                      type="text"
                      {...registerProfile('street')}
                      disabled={!isEditing}
                      placeholder="123 Main Street"
                      className="w-full pl-10 pr-3 py-2 border-2 border-primary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50"
                    />
                  </div>
                </div>

                {/* City and State */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      id="city"
                      type="text"
                      {...registerProfile('city')}
                      disabled={!isEditing}
                      placeholder="Paris"
                      className="w-full px-3 py-2 border-2 border-primary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50"
                    />
                  </div>

                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                      State / Province
                    </label>
                    <input
                      id="state"
                      type="text"
                      {...registerProfile('state')}
                      disabled={!isEditing}
                      placeholder="Île-de-France"
                      className="w-full px-3 py-2 border-2 border-primary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50"
                    />
                  </div>
                </div>

                {/* Notifications */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Notifications</h3>
                  <div className="space-y-4">
                    {[
                      { key: 'newsletter', label: 'Newsletter' },
                      { key: 'promotions', label: 'Promotional Offers' },
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center">
                        <input
                          type="checkbox"
                          name={key}
                          checked={notifications[key]}
                          onChange={handleNotificationChange}
                          disabled={!isEditing}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded disabled:opacity-50"
                        />
                        <label className="ml-2 block text-sm text-gray-900">
                          {label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {isEditing && (
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex items-center space-x-2 bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      <span>{isLoading ? 'Saving...' : 'Save'}</span>
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}

          {activeTab === 'security' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Change password
              </h2>

              <form onSubmit={handleSubmitPassword(onChangePassword)} className="max-w-md space-y-6">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Current password
                  </label>
                  <input
                    id="currentPassword"
                    type="password"
                    {...registerPassword('currentPassword', { required: 'Current password is required' })}
                    className={`w-full px-3 py-2 border-2 ${passwordErrors.currentPassword ? 'border-red-300' : 'border-primary-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
                  />
                  {passwordErrors.currentPassword && (
                    <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    New password
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    {...registerPassword('newPassword', validationRules.password)}
                    className={`w-full px-3 py-2 border-2 ${passwordErrors.newPassword ? 'border-red-300' : 'border-primary-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
                  />
                  {passwordErrors.newPassword && (
                    <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm new password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    {...registerPassword('confirmPassword', {
                      required: 'Please confirm your password',
                      validate: (value) => validatePasswordMatch(value, newPassword)
                    })}
                    className={`w-full px-3 py-2 border-2 ${passwordErrors.confirmPassword ? 'border-red-300' : 'border-primary-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
                  />
                  {passwordErrors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Change password
                </button>
              </form>

              <div className="mt-8 p-4 bg-red-50 rounded-md">
                <h3 className="text-sm font-medium text-red-800 mb-2">
                  Danger zone
                </h3>
                <p className="text-sm text-red-600 mb-4">
                  This action is irreversible and will permanently delete your account.
                </p>
                <button 
                  onClick={() => setShowDeleteModal(true)}
                  className="text-sm text-red-600 hover:text-red-800 font-medium"
                >
                  Delete my account
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Delete Account Modal */}
        <DeleteAccountModal
          isOpen={showDeleteModal}
          onClose={handleCloseDeleteModal}
          onConfirm={handleDeleteAccount}
          isLoading={isDeleting}
          step={deleteModalStep}
          blockMessage={deleteBlockMessage}
          activeReservations={activeReservations}
          blockingOrders={blockingOrders}
        />
      </div>
    </div>
  )
}

export default Profile