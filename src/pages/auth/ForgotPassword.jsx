import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { emailApi } from '../../api'
import { ROUTES } from '../../constants'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await emailApi.forgotPassword(email)

      if (result.success) {
        setIsSuccess(true)
        toast.success('Reset link sent! Check your email.')
      } else {
        // OWASP recommandation: toujours afficher un message de succès
        // pour éviter l'énumération d'emails (même si l'email n'existe pas)
        setIsSuccess(true)
      }
    } catch (error) {
      // En cas d'erreur serveur, on affiche quand même le succès (sécurité)
      setIsSuccess(true)
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-brown-200 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Link to={ROUTES.HOME} className="flex justify-center">
            <span className="text-4xl font-bold text-primary-600">RestOh!</span>
          </Link>

          <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Check Your Email
              </h2>

              <div className="space-y-3 text-sm text-gray-600">
                <p>
                  If an account exists with <strong className="text-gray-900">{email}</strong>,
                  you will receive a password reset link shortly.
                </p>
                <p>
                  The link will expire in <strong className="text-gray-900">30 minutes</strong>.
                </p>
                <div className="mt-4 p-3 bg-blue-50 rounded-md">
                  <p className="text-xs text-blue-800">
                    💡 <strong>Tip:</strong> Don't forget to check your spam folder if you don't see the email.
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <Link
                  to={ROUTES.LOGIN}
                  className="block w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Return to Login
                </Link>

                <button
                  onClick={() => setIsSuccess(false)}
                  className="block w-full text-sm text-primary-600 hover:text-primary-500"
                >
                  Send another reset link
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brown-200 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to={ROUTES.HOME} className="flex justify-center">
          <span className="text-4xl font-bold text-primary-600">RestOh!</span>
        </Link>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Forgot your password?
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Enter your email address and we'll send you a reset link.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            {/* Submit button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </div>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </div>
          </form>

          {/* Back to login */}
          <div className="mt-6 flex items-center justify-center text-sm">
            <Link
              to={ROUTES.LOGIN}
              className="flex items-center text-primary-600 hover:text-primary-500 font-medium"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
