import { useState } from 'react'
import { AlertCircle, Mail, X } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { resendVerification } from '../../api/emailApi'

/**
 * EmailVerificationBanner - Displays a warning banner for users who haven't verified their email
 *
 * Features:
 * - Shows warning message with resend verification option
 * - Can be dismissed (stored in sessionStorage to avoid showing again during session)
 * - Handles resend verification with loading state and success/error feedback
 *
 * @param {Object} props
 * @param {Object} props.user - The current user object (must have email and isEmailVerified)
 * @param {boolean} props.dismissible - Whether the banner can be dismissed (default: true)
 * @param {string} props.className - Additional CSS classes
 */
const EmailVerificationBanner = ({ user, dismissible = true, className = '' }) => {
  const [isDismissed, setIsDismissed] = useState(() => {
    return sessionStorage.getItem('emailVerificationBannerDismissed') === 'true'
  })
  const [isResending, setIsResending] = useState(false)

  // Don't render if user is verified, no user, or banner is dismissed
  if (!user || user.isEmailVerified || isDismissed) {
    return null
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    sessionStorage.setItem('emailVerificationBannerDismissed', 'true')
  }

  const handleResendVerification = async () => {
    if (!user.email) {
      toast.error('Unable to resend verification email')
      return
    }

    setIsResending(true)
    try {
      const result = await resendVerification(user.email)
      if (result.success) {
        toast.success('Verification email sent! Please check your inbox.')
      } else {
        toast.error(result.error || 'Failed to send verification email')
      }
    } catch {
      toast.error('Failed to send verification email')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className={`rounded-md bg-amber-50 border border-amber-200 p-4 ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-amber-400" aria-hidden="true" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-amber-800">
            Email Verification Required
          </h3>
          <div className="mt-2 text-sm text-amber-700">
            <p>
              Your email address has not been verified. Some features like placing orders,
              making reservations, and leaving reviews require a verified email.
            </p>
          </div>
          <div className="mt-3">
            <button
              type="button"
              onClick={handleResendVerification}
              disabled={isResending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-amber-800 bg-amber-100 hover:bg-amber-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Mail className="h-3.5 w-3.5" />
              {isResending ? 'Sending...' : 'Resend Verification Email'}
            </button>
          </div>
        </div>
        {dismissible && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                onClick={handleDismiss}
                className="inline-flex rounded-md bg-amber-50 p-1.5 text-amber-500 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
              >
                <span className="sr-only">Dismiss</span>
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default EmailVerificationBanner
