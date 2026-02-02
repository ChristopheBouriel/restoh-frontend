import { useState } from 'react'
import { X, AlertTriangle, Calendar, Clock, Users, ShoppingBag, DollarSign } from 'lucide-react'
import { getLabelFromSlot } from '../../utils/reservationSlots'

const DeleteAccountModal = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  step = 'initial',
  blockMessage = '',
  activeReservations = [],
  blockingOrders = []
}) => {
  const [password, setPassword] = useState('')
  const [confirmText, setConfirmText] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (confirmText !== 'DELETE' || !password.trim()) return

    // If we're confirming reservations, send with confirmCancelReservations flag
    const options = step === 'confirm-reservations' ? { confirmCancelReservations: true } : {}

    await onConfirm(password, options)
    // Parent handles all result handling (step changes, toasts, navigation)
  }

  const handleClose = () => {
    setPassword('')
    setConfirmText('')
    onClose()
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  if (!isOpen) return null

  const canDelete = confirmText === 'DELETE' && password.trim()

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          {/* Header */}
          <div className="sm:flex sm:items-start">
            <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full sm:mx-0 sm:h-10 sm:w-10 ${
              step === 'blocked' ? 'bg-amber-100' : 'bg-red-100'
            }`}>
              <AlertTriangle className={`h-6 w-6 ${step === 'blocked' ? 'text-amber-600' : 'text-red-600'}`} />
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {step === 'blocked'
                  ? 'Cannot delete account'
                  : step === 'confirm-reservations'
                    ? 'Active reservations found'
                    : 'Permanently delete your account'
                }
              </h3>
            </div>
            <button
              onClick={handleClose}
              className="ml-auto -mt-2 -mr-2 p-2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="mt-4">
            {step === 'blocked' && (
              <>
                <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-4">
                  <div className="text-sm text-amber-800">
                    <p className="mb-2"><strong>You cannot delete your account at this time.</strong></p>
                    <p>{blockMessage}</p>
                  </div>
                </div>

                {blockingOrders.length > 0 && (
                  <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                    {blockingOrders.map((order) => (
                      <div
                        key={order.id || order.orderNumber}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200"
                      >
                        <div className="flex items-center space-x-3">
                          <ShoppingBag className="w-5 h-5 text-primary-600" />
                          <div>
                            <p className="font-medium text-gray-900">Order #{order.orderNumber}</p>
                            <div className="flex items-center text-sm text-gray-600 space-x-3">
                              <span className="flex items-center">
                                <DollarSign className="w-4 h-4 mr-1" />
                                ${order.totalPrice?.toFixed(2)}
                              </span>
                              <span className="capitalize">{order.orderType}</span>
                            </div>
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          order.status === 'preparing'
                            ? 'bg-yellow-100 text-yellow-800'
                            : order.status === 'ready'
                              ? 'bg-green-100 text-green-800'
                              : order.status === 'out-for-delivery'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status === 'out-for-delivery' ? 'Out for delivery' : order.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {step === 'confirm-reservations' && (
              <>
                <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-4">
                  <div className="text-sm text-amber-800">
                    <p className="mb-2"><strong>You have {activeReservations.length} active reservation{activeReservations.length > 1 ? 's' : ''}:</strong></p>
                    <p>If you proceed, these reservations will be <strong>cancelled</strong>.</p>
                  </div>
                </div>

                <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                  {activeReservations.map((reservation) => (
                    <div
                      key={reservation.id || reservation._id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200"
                    >
                      <div className="flex items-center space-x-3">
                        <Calendar className="w-5 h-5 text-primary-600" />
                        <div>
                          <p className="font-medium text-gray-900">{formatDate(reservation.date)}</p>
                          <div className="flex items-center text-sm text-gray-600 space-x-3">
                            <span className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {getLabelFromSlot(reservation.slot)}
                            </span>
                            <span className="flex items-center">
                              <Users className="w-4 h-4 mr-1" />
                              {reservation.guests} guest{reservation.guests > 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        reservation.status === 'confirmed'
                          ? 'bg-brown-100 text-brown-800'
                          : reservation.status === 'pending'
                            ? 'bg-terracotta-100 text-terracotta-800'
                            : 'bg-gray-100 text-gray-800'
                      }`}>
                        {reservation.status}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <p className="text-sm text-red-800">
                    <strong>Are you sure you want to proceed?</strong> Your reservations will be cancelled and your account will be permanently deleted.
                  </p>
                </div>
              </>
            )}

            {step === 'initial' && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                <div className="text-sm text-red-800">
                  <p className="mb-2"><strong>This action is irreversible!</strong></p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Your account will be permanently deleted</li>
                    <li>All your personal data will be erased</li>
                    <li>Your orders and reservations will be anonymized</li>
                    <li>You will no longer be able to log in with these credentials</li>
                  </ul>
                </div>
              </div>
            )}

            {step !== 'blocked' && (
              <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                {/* Confirmation text */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    To confirm, type <strong>DELETE</strong> in the field below:
                  </label>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="Type DELETE"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Password confirmation */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm with your current password:
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  />
                </div>
              </form>
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 sm:flex sm:flex-row-reverse gap-3">
            {step === 'blocked' ? (
              <button
                type="button"
                onClick={handleClose}
                className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:w-auto sm:text-sm"
              >
                Close
              </button>
            ) : (
              <>
                <button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={!canDelete || isLoading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading
                    ? 'Deleting...'
                    : step === 'confirm-reservations'
                      ? 'Cancel reservations & delete account'
                      : 'Delete permanently'
                  }
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeleteAccountModal
