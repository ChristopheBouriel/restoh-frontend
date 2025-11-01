import { useState } from 'react'
import InlineAlert from '../../components/common/InlineAlert'
import { toast } from 'react-hot-toast'

/**
 * NotificationsDemo - Page de démonstration du système de notifications
 *
 * Cette page montre tous les types de notifications disponibles :
 * - Toasts (actuels)
 * - InlineAlerts (nouveau système)
 *
 * ⚠️ Cette page est uniquement pour le développement
 * Elle sera utilisée pour valider l'UX avant l'intégration backend
 */
const NotificationsDemo = () => {
  const [selectedTables, setSelectedTables] = useState([])
  const [showAlert1, setShowAlert1] = useState(true)
  const [showAlert2, setShowAlert2] = useState(true)
  const [showAlert3, setShowAlert3] = useState(true)
  const [showAlert4, setShowAlert4] = useState(true)

  // Simuler la sélection de table
  const handleSelectTable = (tableId) => {
    setSelectedTables(prev => [...prev, tableId])
    toast.success(`Table ${tableId} selected!`)
    setShowAlert1(false)
  }

  // Simuler un retry
  const handleRetry = () => {
    toast.loading('Retrying...', { duration: 1000 })
    setTimeout(() => {
      toast.success('Connection restored!')
      setShowAlert3(false)
    }, 1000)
  }

  // Simuler une navigation
  const handleNavigate = (path) => {
    toast.info(`Navigating to ${path}...`)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🔔 Notifications Demo
          </h1>
          <p className="text-gray-600">
            Démonstration des différents types de notifications utilisés dans l'application.
          </p>
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Cette page est uniquement pour le développement.
              Les InlineAlerts seront intégrés dans les vraies pages une fois le backend prêt.
            </p>
          </div>
        </div>

        {/* Section 1: Toast Examples */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            1. Toasts (système actuel)
          </h2>
          <p className="text-gray-600 mb-4">
            Notifications rapides qui disparaissent automatiquement. Parfait pour les feedbacks simples.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => toast.success('Action successful!')}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Success
            </button>
            <button
              onClick={() => toast.error('Something went wrong')}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Error
            </button>
            <button
              onClick={() => toast('Just a message', { icon: 'ℹ️' })}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Info
            </button>
            <button
              onClick={() => toast.error('Warning!', { icon: '⚠️' })}
              className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors"
            >
              Warning
            </button>
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-700">
              ✅ <strong>Bon pour:</strong> Succès d'actions, erreurs simples, feedback rapide
            </p>
            <p className="text-sm text-gray-700 mt-1">
              ❌ <strong>Pas adapté pour:</strong> Erreurs nécessitant des détails, suggestions, actions
            </p>
          </div>
        </section>

        {/* Section 2: InlineAlert Examples */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            2. InlineAlerts (nouveau système)
          </h2>
          <p className="text-gray-600 mb-6">
            Alertes persistantes pour erreurs nécessitant plus d'attention ou d'actions.
          </p>

          <div className="space-y-6">
            {/* Cas 1: Tables unavailable avec suggestions */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                📅 Cas 1: Tables indisponibles (avec suggestions)
              </h3>
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 mb-3">
                <code className="text-xs text-gray-600">
                  POST /api/reservations → 409 TABLES_UNAVAILABLE
                </code>
              </div>
              {showAlert1 && (
                <InlineAlert
                  type="warning"
                  message="Tables 5 and 6 are no longer available"
                  details="These tables were just booked by another customer."
                  actions={[
                    {
                      label: 'Try Table 7',
                      onClick: () => handleSelectTable(7),
                      variant: 'primary'
                    },
                    {
                      label: 'Try Table 8',
                      onClick: () => handleSelectTable(8)
                    },
                    {
                      label: 'Try Table 9',
                      onClick: () => handleSelectTable(9)
                    }
                  ]}
                  onDismiss={() => setShowAlert1(false)}
                />
              )}
              {selectedTables.length > 0 && (
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-800">
                    ✅ Tables sélectionnées: {selectedTables.join(', ')}
                  </p>
                </div>
              )}
            </div>

            {/* Cas 2: Capacity exceeded */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                👥 Cas 2: Capacité dépassée
              </h3>
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 mb-3">
                <code className="text-xs text-gray-600">
                  POST /api/reservations → 400 CAPACITY_EXCEEDED
                </code>
              </div>
              {showAlert2 && (
                <InlineAlert
                  type="error"
                  message="Selected tables exceed maximum capacity"
                  details="You selected 3 tables (6 seats) for 4 guests. Maximum allowed is 5 seats (party size + 1)."
                  actions={[
                    {
                      label: 'Remove Table 3',
                      onClick: () => {
                        toast.success('Table 3 removed')
                        setShowAlert2(false)
                      },
                      variant: 'primary'
                    },
                    {
                      label: 'Clear all',
                      onClick: () => {
                        toast.info('All tables cleared')
                        setShowAlert2(false)
                      }
                    }
                  ]}
                  onDismiss={() => setShowAlert2(false)}
                />
              )}
            </div>

            {/* Cas 3: Server error avec retry */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                🔴 Cas 3: Erreur serveur (avec retry)
              </h3>
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 mb-3">
                <code className="text-xs text-gray-600">
                  Any endpoint → 500 SERVER_ERROR
                </code>
              </div>
              {showAlert3 && (
                <InlineAlert
                  type="error"
                  message="Server temporarily unavailable"
                  details="Our servers are experiencing high traffic. Please try again in a moment."
                  actions={[
                    {
                      label: 'Retry Now',
                      onClick: handleRetry,
                      variant: 'primary'
                    }
                  ]}
                  dismissible={false}
                />
              )}
            </div>

            {/* Cas 4: Permission denied */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                🔒 Cas 4: Permissions insuffisantes
              </h3>
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 mb-3">
                <code className="text-xs text-gray-600">
                  GET /api/orders/admin → 403 FORBIDDEN
                </code>
              </div>
              {showAlert4 && (
                <InlineAlert
                  type="error"
                  message="Access Denied"
                  details="This feature requires admin permissions. Contact your administrator for access."
                  actions={[
                    {
                      label: 'Go Back',
                      onClick: () => {
                        handleNavigate('/')
                        setShowAlert4(false)
                      },
                      variant: 'primary'
                    }
                  ]}
                  onDismiss={() => setShowAlert4(false)}
                />
              )}
            </div>

            {/* Cas 5: Success avec action */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                ✅ Cas 5: Success avec action
              </h3>
              <InlineAlert
                type="success"
                message="Reservation confirmed!"
                details="Your table has been reserved for January 25th at 7:30 PM."
                actions={[
                  {
                    label: 'View Details',
                    onClick: () => handleNavigate('/reservations'),
                    variant: 'primary'
                  },
                  {
                    label: 'Make Another',
                    onClick: () => toast.info('Opening reservation form...')
                  }
                ]}
              />
            </div>

            {/* Cas 6: Info simple */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                ℹ️ Cas 6: Information simple
              </h3>
              <InlineAlert
                type="info"
                message="Restaurant closing early today"
                details="We'll be closing at 9 PM instead of 11 PM due to a private event."
              />
            </div>

            {/* Cas 7: Custom content avec children */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                🎨 Cas 7: Contenu personnalisé
              </h3>
              <InlineAlert type="warning">
                <div>
                  <p className="font-semibold text-sm mb-2">
                    Cancellation Policy
                  </p>
                  <ul className="text-sm space-y-1 list-disc list-inside">
                    <li>Free cancellation up to 2 hours before</li>
                    <li>50% charge for cancellations within 2 hours</li>
                    <li>Full charge for no-shows</li>
                  </ul>
                  <div className="mt-3">
                    <button
                      onClick={() => toast.info('Opening policy details...')}
                      className="text-xs font-semibold text-amber-700 hover:underline"
                    >
                      Read full policy →
                    </button>
                  </div>
                </div>
              </InlineAlert>
            </div>
          </div>
        </section>

        {/* Section 3: Usage Guidelines */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            3. Quand utiliser quoi ?
          </h2>

          <div className="space-y-4">
            <div className="border-l-4 border-green-500 bg-green-50 p-4 rounded-r-md">
              <h3 className="font-semibold text-green-900 mb-2">✅ Utiliser Toast pour:</h3>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Succès d'actions simples ("Item added to cart")</li>
                <li>• Erreurs récupérables sans détails</li>
                <li>• Confirmations rapides</li>
                <li>• Feedback qui ne nécessite pas d'action</li>
              </ul>
            </div>

            <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-md">
              <h3 className="font-semibold text-blue-900 mb-2">✅ Utiliser InlineAlert pour:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Erreurs avec suggestions/alternatives</li>
                <li>• Erreurs nécessitant une action utilisateur</li>
                <li>• Messages persistants importants</li>
                <li>• Contexte métier complexe (permissions, timing, disponibilité)</li>
                <li>• Quand le champ <code>details</code> de l'API est rempli</li>
              </ul>
            </div>

            <div className="border-l-4 border-red-500 bg-red-50 p-4 rounded-r-md">
              <h3 className="font-semibold text-red-900 mb-2">❌ Ne PAS utiliser pour:</h3>
              <ul className="text-sm text-red-800 space-y-1">
                <li>• Validation de formulaire simple (utiliser inline dans le champ)</li>
                <li>• Modales de confirmation (utiliser window.confirm ou Modal)</li>
                <li>• Messages qui doivent bloquer l'utilisateur</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 4: Implementation Status */}
        <section className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            4. État d'implémentation
          </h2>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-green-600 font-bold">✅</span>
              <span className="text-sm">Composant InlineAlert créé</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-green-600 font-bold">✅</span>
              <span className="text-sm">Page de démo créée</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-yellow-600 font-bold">⏳</span>
              <span className="text-sm">En attente: Backend Phase 1 (standardisation erreurs)</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-yellow-600 font-bold">⏳</span>
              <span className="text-sm">En attente: Backend Phase 2 (ajout details.suggestedTables)</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-400 font-bold">⬜</span>
              <span className="text-sm">À faire: Intégration dans useReservations.js</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-400 font-bold">⬜</span>
              <span className="text-sm">À faire: Intégration dans autres hooks si nécessaire</span>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Les hooks continuent d'utiliser <code>toast.error()</code> pour l'instant.
              L'intégration se fera une fois que le backend Phase 2 sera prêt.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}

export default NotificationsDemo
