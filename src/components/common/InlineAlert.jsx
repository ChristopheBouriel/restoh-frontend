import { XCircle, AlertTriangle, Info, CheckCircle, X } from 'lucide-react'
import { useState } from 'react'

/**
 * InlineAlert - Composant d'alerte persistante pour erreurs détaillées
 *
 * Utilisé pour afficher des erreurs qui nécessitent plus d'attention qu'un toast :
 * - Erreurs avec suggestions/alternatives
 * - Erreurs bloquantes nécessitant une action
 * - Messages persistants avec actions disponibles
 *
 * @param {string} type - Type d'alerte : 'error' | 'warning' | 'info' | 'success'
 * @param {string} message - Message principal (requis)
 * @param {string} details - Message de détails optionnel
 * @param {Array} actions - Liste d'actions cliquables [{ label, onClick, variant }]
 * @param {boolean} dismissible - Peut être fermé par l'utilisateur (défaut: true)
 * @param {function} onDismiss - Callback quand l'alerte est fermée
 * @param {ReactNode} children - Contenu personnalisé (remplace message si présent)
 */
const InlineAlert = ({
  type = 'info',
  message,
  details,
  actions = [],
  dismissible = true,
  onDismiss,
  children,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(true)

  const handleDismiss = () => {
    setIsVisible(false)
    if (onDismiss) onDismiss()
  }

  if (!isVisible) return null

  // Configuration des styles selon le type
  const configs = {
    error: {
      icon: XCircle,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      iconColor: 'text-red-500',
      textColor: 'text-red-800',
      detailsColor: 'text-red-600'
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      iconColor: 'text-amber-500',
      textColor: 'text-amber-800',
      detailsColor: 'text-amber-600'
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-500',
      textColor: 'text-blue-800',
      detailsColor: 'text-blue-600'
    },
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      iconColor: 'text-green-500',
      textColor: 'text-green-800',
      detailsColor: 'text-green-600'
    }
  }

  const config = configs[type] || configs.info
  const Icon = config.icon

  return (
    <div
      className={`
        ${config.bgColor} ${config.borderColor} ${config.textColor}
        border-l-4 rounded-md p-4 mb-4 relative
        ${className}
      `}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <Icon className={`${config.iconColor} h-5 w-5 flex-shrink-0 mt-0.5`} />

        {/* Content */}
        <div className="flex-1 min-w-0">
          {children ? (
            <div className="text-sm">{children}</div>
          ) : (
            <>
              {/* Main message */}
              {message && (
                <p className="font-semibold text-sm mb-1">{message}</p>
              )}

              {/* Details */}
              {details && (
                <p className={`text-sm ${config.detailsColor} mt-1`}>
                  {details}
                </p>
              )}
            </>
          )}

          {/* Actions */}
          {actions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  className={`
                    px-3 py-1.5 text-xs font-semibold rounded-md
                    transition-colors duration-200
                    ${action.variant === 'primary'
                      ? `bg-${type === 'error' ? 'red' : type === 'warning' ? 'amber' : type === 'success' ? 'green' : 'blue'}-600 text-white hover:bg-${type === 'error' ? 'red' : type === 'warning' ? 'amber' : type === 'success' ? 'green' : 'blue'}-700`
                      : `border ${config.borderColor} ${config.textColor} hover:bg-white/50`
                    }
                  `}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Close button */}
        {dismissible && (
          <button
            onClick={handleDismiss}
            className={`${config.iconColor} hover:opacity-70 transition-opacity flex-shrink-0`}
            aria-label="Dismiss alert"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}

export default InlineAlert
