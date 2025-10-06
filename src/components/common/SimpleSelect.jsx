import { useState, useRef, useEffect } from 'react'

const SimpleSelect = ({ value, onChange, options = [], className = '', disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false)
  const selectRef = useRef(null)
  const buttonRef = useRef(null)

  // Fermer le dropdown quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Remettre le focus quand le dropdown se ferme
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
        className={`flex items-center justify-between px-3 py-1.5 border border-gray-300 rounded-md text-xs transition-colors group ${
          disabled 
            ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
            : isOpen 
              ? 'bg-white outline-none ring-0 border-gray-300' 
              : 'bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 hover:border-orange-500'
        } ${className || 'w-auto min-w-[100px]'}`}
      >
        <span className="text-gray-900 pr-3">{selectedOption?.label}</span>
        <span className={`transition-all duration-200 ${
          disabled
            ? 'text-gray-300'
            : isOpen 
              ? 'rotate-180 text-gray-400' 
              : 'text-gray-400 group-hover:text-orange-500'
        }`}>
          ▼
        </span>
      </button>
      
      {isOpen && !disabled && (
        <div className={`absolute top-0 left-0 bg-white border-2 border-orange-500 rounded-md shadow-lg z-50 ${className || 'w-auto min-w-[100px]'}`}>
          {options.map((option) => (
            <div
              key={option.value}
              className={`px-3 py-1.5 text-xs cursor-pointer transition-colors ${
                value === option.value ? 'text-orange-600' : 'text-gray-900 hover:text-orange-600 hover:font-semibold'
              }`}
              onClick={() => {
                onChange(option.value)
                setIsOpen(false)
              }}
            >
              <div className="flex items-center justify-between">
                <span>{option.label}</span>
                {value === option.value && (
                  <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SimpleSelect