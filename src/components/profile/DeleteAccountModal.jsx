import { useState } from 'react'
import { X, AlertTriangle } from 'lucide-react'

const DeleteAccountModal = ({ isOpen, onClose, onConfirm, isLoading }) => {
  const [password, setPassword] = useState('')
  const [confirmText, setConfirmText] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (confirmText === 'SUPPRIMER' && password.trim()) {
      onConfirm(password)
    }
  }

  const handleClose = () => {
    setPassword('')
    setConfirmText('')
    onClose()
  }

  if (!isOpen) return null

  const canDelete = confirmText === 'SUPPRIMER' && password.trim()

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          {/* Header */}
          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Supprimer définitivement votre compte
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
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <div className="text-sm text-red-800">
                <p className="mb-2">⚠️ <strong>Cette action est irréversible !</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Votre compte sera définitivement supprimé</li>
                  <li>Toutes vos données personnelles seront effacées</li>
                  <li>Vos commandes et réservations seront anonymisées</li>
                  <li>Vous ne pourrez plus vous reconnecter avec ces identifiants</li>
                </ul>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Confirmation text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pour confirmer, tapez <strong>SUPPRIMER</strong> dans le champ ci-dessous :
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Tapez SUPPRIMER"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Password confirmation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmez avec votre mot de passe actuel :
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mot de passe"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                />
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="mt-6 sm:flex sm:flex-row-reverse gap-3">
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={!canDelete || isLoading}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Suppression...' : 'Supprimer définitivement'}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:w-auto sm:text-sm"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeleteAccountModal