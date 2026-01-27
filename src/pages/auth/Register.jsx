import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useAuthContext } from '../../contexts/AuthContext'
import { emailApi } from '../../api'
import { ROUTES } from '../../constants'
import InlineAlert from '../../components/common/InlineAlert'
import { validationRules, validatePasswordMatch } from '../../utils/formValidators'

const Register = () => {
  // Rename context's register to registerUser to avoid conflict with RHF's register
  const { register: registerUser, isLoading, error } = useAuthContext()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [inlineError, setInlineError] = useState(null)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')
  const [isResending, setIsResending] = useState(false)

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm({
    mode: 'onBlur', // Validate when field loses focus
    reValidateMode: 'onChange' // Re-validate on change after first error
  })

  // Watch password for confirmation validation
  const password = watch('password')

  const onSubmit = async (data) => {
    // Clear previous inline error
    setInlineError(null)

    const result = await registerUser({
      name: data.name,
      email: data.email,
      password: data.password
    })

    if (result && result.success) {
      // User is NOT logged in after registration (handled in store)
      // Just show success screen
      setRegisteredEmail(data.email)
      setRegistrationSuccess(true)
      toast.success('Account created! Please verify your email.')
    } else if (result && !result.success) {
      // If backend returns details, show InlineAlert
      if (result.details) {
        setInlineError(result)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
      // Simple errors are already handled by toast in the hook
    }
  }

  const handleResendVerification = async () => {
    setIsResending(true)

    try {
      const result = await emailApi.resendVerification(registeredEmail)

      if (result.success) {
        toast.success('Verification email sent! Check your inbox.')
      } else {
        toast.error(result.error || 'Failed to resend email')
      }
    } catch (err) {
      toast.error('Failed to resend email')
    } finally {
      setIsResending(false)
    }
  }

  // Success screen - show after registration
  if (registrationSuccess) {
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
                Account Created Successfully!
              </h2>

              <div className="space-y-3 text-sm text-gray-600 mb-6">
                <p>
                  We've sent a verification email to:
                </p>
                <p className="font-medium text-gray-900 text-base">
                  {registeredEmail}
                </p>
                <p>
                  Please check your inbox and click the verification link to activate your account.
                </p>
                <div className="mt-4 p-3 bg-blue-50 rounded-md">
                  <p className="text-xs text-blue-800">
                    💡 <strong>Tip:</strong> The email should arrive within a few minutes. Don't forget to check your spam folder!
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-gray-500">
                  Didn't receive the email?
                </p>
                <button
                  onClick={handleResendVerification}
                  disabled={isResending}
                  className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  {isResending ? 'Sending...' : 'Resend Verification Email'}
                </button>

                <p className="text-xs text-gray-500 pt-2">
                  Once verified, you can log in with your credentials.
                </p>
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
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link
            to={ROUTES.LOGIN}
            className="font-medium text-primary-600 hover:text-primary-500"
          >
            log in to your existing account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* InlineAlert for errors with details (e.g., EMAIL_ALREADY_EXISTS) */}
            {inlineError && inlineError.details && inlineError.details.field === 'email' && (
              <InlineAlert
                type="error"
                message={inlineError.error}
                details={`${inlineError.details.message || ''} ${inlineError.details.suggestion || ''}`}
                onDismiss={() => setInlineError(null)}
              />
            )}

            {/* Fallback: Global Error for simple errors */}
            {error && !inlineError && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full name
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  {...register('name', validationRules.name)}
                  className={`appearance-none block w-full pl-10 pr-3 py-2 border-2 ${
                    errors.name ? 'border-red-300' : 'border-primary-300'
                  } rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm`}
                  placeholder="Your full name"
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

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
                  type="email"
                  autoComplete="email"
                  {...register('email', validationRules.email)}
                  className={`appearance-none block w-full pl-10 pr-3 py-2 border-2 ${
                    errors.email ? 'border-red-300' : 'border-primary-300'
                  } rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm`}
                  placeholder="your@email.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  {...register('password', validationRules.password)}
                  className={`appearance-none block w-full pl-10 pr-10 py-2 border-2 ${
                    errors.password ? 'border-red-300' : 'border-primary-300'
                  } rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm`}
                  placeholder="Minimum 6 characters"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (value) => validatePasswordMatch(value, password)
                  })}
                  className={`appearance-none block w-full pl-10 pr-10 py-2 border-2 ${
                    errors.confirmPassword ? 'border-red-300' : 'border-primary-300'
                  } rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm`}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Terms */}
            <div className="flex items-center">
              <input
                id="agree-terms"
                type="checkbox"
                {...register('agreeTerms', { required: 'You must accept the terms' })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="agree-terms" className="ml-2 block text-sm text-gray-900">
                I accept the{' '}
                <Link to="/terms" className="text-primary-600 hover:text-primary-500">
                  terms of use
                </Link>{' '}
                and the{' '}
                <Link to="/privacy" className="text-primary-600 hover:text-primary-500">
                  privacy policy
                </Link>
              </label>
            </div>
            {errors.agreeTerms && (
              <p className="text-sm text-red-600">{errors.agreeTerms.message}</p>
            )}

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
                    Creating account...
                  </div>
                ) : (
                  'Create my account'
                )}
              </button>
            </div>
          </form>

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
    </div>
  )
}

export default Register
