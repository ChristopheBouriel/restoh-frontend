import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { emailApi } from '../../api'
import { ROUTES } from '../../constants'

const VerifyEmail = () => {
  const { token } = useParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading') // loading, success, error
  const [message, setMessage] = useState('')
  const [errorDetails, setErrorDetails] = useState(null)
  const hasVerified = useRef(false) // Prevent double verification in StrictMode

  useEffect(() => {
    const verifyEmail = async () => {
      // Prevent double call in React 18 StrictMode
      if (hasVerified.current) return
      hasVerified.current = true
      if (!token) {
        setStatus('error')
        setMessage('Invalid verification link')
        return
      }

      try {
        const result = await emailApi.verifyEmail(token)

        if (result.success) {
          setStatus('success')
          setMessage(result.message || 'Email verified successfully!')
          toast.success('Email verified!')

          // Redirect to login after 3 seconds ONLY on success
          setTimeout(() => {
            navigate(ROUTES.LOGIN)
          }, 3000)
        } else {
          setStatus('error')
          setMessage(result.error || 'Verification failed')
          setErrorDetails(result.details)
          toast.error(result.error)
          // NO automatic redirect on error
        }
      } catch (error) {
        setStatus('error')
        setMessage('An unexpected error occurred')
        toast.error('Verification failed')
        // NO automatic redirect on error
      }
    }

    verifyEmail()
  }, [token, navigate])

  return (
    <div className="min-h-screen bg-brown-200 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to={ROUTES.HOME} className="flex justify-center">
          <span className="text-4xl font-bold text-primary-600">RestOh!</span>
        </Link>

        <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Loading state */}
          {status === 'loading' && (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 mb-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Verifying your email...
              </h2>
              <p className="text-sm text-gray-600">
                Please wait while we verify your email address.
              </p>
            </div>
          )}

          {/* Success state */}
          {status === 'success' && (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Email Verified!
              </h2>

              <p className="text-sm text-gray-600 mb-6">
                {message}
              </p>

              <div className="space-y-3">
                <p className="text-sm text-gray-500">
                  Redirecting to login page...
                </p>

                <Link
                  to={ROUTES.LOGIN}
                  className="inline-block bg-primary-600 text-white py-2 px-6 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Go to Login Now
                </Link>
              </div>
            </div>
          )}

          {/* Error state */}
          {status === 'error' && (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Verification Failed
              </h2>

              <p className="text-sm text-red-600 mb-4">
                {message}
              </p>

              {errorDetails && (
                <div className="mb-6 p-3 bg-gray-50 rounded-md text-left">
                  <p className="text-xs text-gray-600">
                    {errorDetails.message || errorDetails}
                  </p>
                </div>
              )}

              <div className="space-y-3">
                {message.toLowerCase().includes('expired') && (
                  <div className="p-3 bg-yellow-50 rounded-md mb-4">
                    <p className="text-sm text-yellow-800">
                      Your verification link has expired.
                      Please request a new one from your profile page.
                    </p>
                  </div>
                )}

                <div className="flex flex-col space-y-2">
                  <Link
                    to={ROUTES.PROFILE}
                    className="inline-block bg-primary-600 text-white py-2 px-6 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Go to Profile
                  </Link>

                  <Link
                    to={ROUTES.LOGIN}
                    className="text-sm text-primary-600 hover:text-primary-500"
                  >
                    Back to Login
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Return to home */}
        <div className="mt-6 text-center">
          <Link
            to={ROUTES.HOME}
            className="text-sm font-medium text-primary-600 hover:text-primary-500"
          >
            ← Return to home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default VerifyEmail
