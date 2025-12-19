import { forwardRef } from 'react'

/**
 * Reusable form input component with built-in error display
 * Works seamlessly with React Hook Form's register function
 */
const FormInput = forwardRef(({
  label,
  name,
  type = 'text',
  placeholder,
  error,
  icon: Icon,
  rightElement,
  className = '',
  ...props
}, ref) => {
  return (
    <div>
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="mt-1 relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400" />
          </div>
        )}
        <input
          ref={ref}
          id={name}
          name={name}
          type={type}
          placeholder={placeholder}
          className={`appearance-none block w-full ${Icon ? 'pl-10' : 'pl-3'} ${rightElement ? 'pr-10' : 'pr-3'} py-2 border-2 ${
            error ? 'border-red-300' : 'border-primary-300'
          } rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm ${className}`}
          {...props}
        />
        {rightElement && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {rightElement}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
})

FormInput.displayName = 'FormInput'

export default FormInput
