import { useState, useRef, useEffect } from 'react'

const SimpleSelect = ({ value, onChange, options = [], className = '', disabled = false, size = 'sm' }) => {
  const [isOpen, setIsOpen] = useState(false)
  const selectRef = useRef(null)
  const buttonRef = useRef(null)

  // Size variants
  const sizeClasses = {
    sm: 'py-1.5 text-xs',
    md: 'py-2 text-sm'
  }

  // Close the dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Restore focus when the dropdown closes
  useEffect(() => {
    if (!isOpen && buttonRef.current) {
      buttonRef.current.focus()
    }
  }, [isOpen])

  const selectedOption = options.find(opt => opt.value === value)

  
  return (
    <div ref={selectRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex items-center justify-between px-3 ${sizeClasses[size]} border-2 border-primary-300 rounded-lg transition-colors group ${
          disabled
            ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
            : isOpen
              ? 'bg-white outline-none ring-0 border-primary-300'
              : 'bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent hover:border-primary-400'
        } ${className || 'w-auto min-w-[100px]'}`}
      >
        <span className="text-gray-900 pr-3">{selectedOption?.label}</span>
        <span className={`transition-all duration-200 text-xs ${
          disabled
            ? 'text-gray-300'
            : isOpen
              ? 'rotate-180 text-gray-400'
              : 'text-gray-400 group-hover:text-primary-500'
        }`}>
          ▼
        </span>
      </button>

      {isOpen && !disabled && (
        <div className={`absolute top-0 left-0 bg-white border-2 border-primary-500 rounded-lg shadow-lg z-50 ${className || 'w-auto min-w-[100px]'}`}>
          {options.map((option) => {
            const isDisabled = option.disabled || false
            const disabledReason = option.disabledReason || ''

            return (
              <div
                key={option.value}
                title={isDisabled ? disabledReason : ''}
                className={`px-3 ${sizeClasses[size]} transition-colors ${
                  isDisabled
                    ? 'cursor-not-allowed text-gray-400 bg-gray-50'
                    : value === option.value
                      ? 'cursor-pointer text-primary-600'
                      : 'cursor-pointer text-gray-900 hover:text-primary-600 hover:font-semibold'
                }`}
                onClick={() => {
                  if (!isDisabled) {
                    onChange(option.value)
                    setIsOpen(false)
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <span>{option.label}</span>
                  {value === option.value && !isDisabled && (
                    <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default SimpleSelect