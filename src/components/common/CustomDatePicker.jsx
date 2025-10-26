import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react'

const CustomDatePicker = ({ value, onChange, placeholder = "Sélectionner une date", className = '', minDate, maxDate }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(value ? new Date(value) : null)
  const [inputValue, setInputValue] = useState('')
  const [inputError, setInputError] = useState('')
  const pickerRef = useRef(null)
  const buttonRef = useRef(null)
  const inputRef = useRef(null)

  // Mois en français
  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ]

  // Jours de la semaine
  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

  // Parse date from manual input (accepts DD/MM/YYYY or YYYY-MM-DD formats)
  const parseInputDate = (input) => {
    if (!input || typeof input !== 'string') return null
    
    const trimmed = input.trim()
    
    // Format DD/MM/YYYY
    const frenchDateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
    const frenchMatch = trimmed.match(frenchDateRegex)
    
    if (frenchMatch) {
      const [, day, month, year] = frenchMatch
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      
      // Validate that the date is valid (handles edge cases like 31/02/2024)
      if (date.getFullYear() == year && 
          date.getMonth() == month - 1 && 
          date.getDate() == day) {
        return date
      }
    }
    
    // Format YYYY-MM-DD
    const isoDateRegex = /^(\d{4})-(\d{1,2})-(\d{1,2})$/
    const isoMatch = trimmed.match(isoDateRegex)
    
    if (isoMatch) {
      const [, year, month, day] = isoMatch
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      
      // Validate that the date is valid
      if (date.getFullYear() == year && 
          date.getMonth() == month - 1 && 
          date.getDate() == day) {
        return date
      }
    }
    
    return null
  }

  // Format date for input display (DD/MM/YYYY)
  const formatDateForInput = (date) => {
    if (!date) return ''
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Fermer au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Remettre le focus sur le bouton quand le picker se ferme
  useEffect(() => {
    if (!isOpen && buttonRef.current) {
      buttonRef.current.focus()
    }
  }, [isOpen])

  // Mettre à jour la date sélectionnée quand value change
  useEffect(() => {
    if (value) {
      const newDate = new Date(value)
      setSelectedDate(newDate)
      setCurrentDate(newDate)
      setInputValue(formatDateForInput(newDate))
    } else {
      setSelectedDate(null)
      setInputValue('')
    }
    setInputError('')
  }, [value])

  // Navigation mois précédent
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  // Navigation mois suivant
  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  // Sélectionner une date
  const selectDate = (day) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    
    // Vérifier les contraintes min/max
    if (minDate && newDate < new Date(minDate)) return
    if (maxDate && newDate > new Date(maxDate)) return

    setSelectedDate(newDate)
    setInputValue(formatDateForInput(newDate))
    // Format as YYYY-MM-DD avoiding timezone issues
    const year = newDate.getFullYear()
    const month = String(newDate.getMonth() + 1).padStart(2, '0')
    const dayPart = String(newDate.getDate()).padStart(2, '0')
    const formattedDate = `${year}-${month}-${dayPart}`
    onChange(formattedDate)
    setIsOpen(false)
  }

  // Aller à aujourd'hui
  const goToToday = () => {
    const today = new Date()
    setCurrentDate(today)
    selectDate(today.getDate())
  }

  // Effacer la sélection
  const clearDate = () => {
    setSelectedDate(null)
    setInputValue('')
    setInputError('')
    onChange('')
    setIsOpen(false)
  }

  // Gérer les changements dans l'input manuel
  const handleInputChange = (e) => {
    const newValue = e.target.value
    setInputValue(newValue)
    setInputError('')
    
    // Si l'input est vide, clear la date
    if (!newValue.trim()) {
      if (selectedDate) {
        setSelectedDate(null)
        onChange('')
      }
      return
    }
    
    // Essayer de parser la date
    const parsedDate = parseInputDate(newValue)
    if (parsedDate) {
      // Vérifier les contraintes min/max
      if (minDate && parsedDate < new Date(minDate)) {
        setInputError('Date trop ancienne')
        return
      }
      if (maxDate && parsedDate > new Date(maxDate)) {
        setInputError('Date trop récente')
        return
      }
      
      // Date valide - mettre à jour
      setSelectedDate(parsedDate)
      setCurrentDate(parsedDate)
      // Format as YYYY-MM-DD avoiding timezone issues
      const year = parsedDate.getFullYear()
      const month = String(parsedDate.getMonth() + 1).padStart(2, '0')
      const dayPart = String(parsedDate.getDate()).padStart(2, '0')
      const formattedDate = `${year}-${month}-${dayPart}`
      onChange(formattedDate)
    }
  }

  // Gérer la validation au blur de l'input
  const handleInputBlur = () => {
    if (!inputValue.trim()) {
      setInputError('')
      return
    }
    
    const parsedDate = parseInputDate(inputValue)
    if (!parsedDate) {
      setInputError('Format invalide (DD/MM/YYYY)')
      return
    }
    
    // Vérifier les contraintes
    if (minDate && parsedDate < new Date(minDate)) {
      setInputError('Date trop ancienne')
      return
    }
    if (maxDate && parsedDate > new Date(maxDate)) {
      setInputError('Date trop récente')
      return
    }
    
    // Reformater la date correctement
    setInputValue(formatDateForInput(parsedDate))
    setInputError('')
  }

  // Gérer les touches spéciales dans l'input
  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleInputBlur()
      inputRef.current?.blur()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      // Restaurer la valeur précédente
      if (selectedDate) {
        setInputValue(formatDateForInput(selectedDate))
      } else {
        setInputValue('')
      }
      setInputError('')
      inputRef.current?.blur()
    }
  }

  // Générer les jours du calendrier
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    // Premier jour du mois et nombre de jours
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    // Jours vides au début
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Jours du mois
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const isToday = date.toDateString() === new Date().toDateString()
      const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString()
      const isDisabled = 
        (minDate && date < new Date(minDate)) ||
        (maxDate && date > new Date(maxDate))

      days.push({
        day,
        date,
        isToday,
        isSelected,
        isDisabled
      })
    }

    return days
  }

  // Format d'affichage de la date
  const formatDisplayDate = (date) => {
    if (!date) return placeholder
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const days = generateCalendarDays()

  return (
    <div ref={pickerRef} className="relative">
      {/* Conteneur de l'input avec bouton calendrier */}
      <div className={`flex items-center bg-white border border-gray-300 rounded-md transition-colors ${
        isOpen 
          ? 'outline-none ring-0 border-gray-300' 
          : 'focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500 hover:border-orange-500'
      } ${className || 'w-full'}`}>
        
        {/* Input manuel */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          placeholder="DD/MM/YYYY"
          className="flex-1 px-3 py-0.5 text-s bg-transparent border-none outline-none text-gray-900 placeholder-gray-500"
        />
        
        {/* Bouton calendrier */}
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="px-2 py-1.5 text-gray-400 hover:text-orange-500 transition-colors"
        >
          <Calendar className={`h-4 w-4 transition-all duration-200 ${
            isOpen ? 'text-orange-500' : ''
          }`} />
        </button>
      </div>
      
      {/* Message d'erreur */}
      {inputError && (
        <div className="mt-1 text-xs text-red-600">
          {inputError}
        </div>
      )}

      {isOpen && (
        <div className="absolute top-0 left-0 bg-white border-2 border-orange-500 rounded-md shadow-lg z-50 p-4 w-full min-w-[280px]">
          {/* Header avec navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={goToPreviousMonth}
              className="p-1 rounded-md hover:bg-orange-50 text-gray-600 hover:text-orange-600 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <h3 className="text-sm font-semibold text-gray-900">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>

            <button
              type="button"
              onClick={goToNextMonth}
              className="p-1 rounded-md hover:bg-orange-50 text-gray-600 hover:text-orange-600 transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Jours de la semaine */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map(day => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Grille des jours */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {days.map((day, index) => (
              <div key={index} className="text-center">
                {day ? (
                  <button
                    onClick={() => selectDate(day.day)}
                    disabled={day.isDisabled}
                    className={`w-8 h-8 text-xs rounded-md transition-colors ${
                      day.isSelected
                        ? 'bg-orange-600 text-white font-semibold'
                        : day.isToday
                        ? 'bg-orange-100 text-orange-900 font-semibold'
                        : day.isDisabled
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-700 hover:bg-orange-50 hover:text-orange-900'
                    }`}
                  >
                    {day.day}
                  </button>
                ) : (
                  <div className="w-8 h-8"></div>
                )}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={goToToday}
              className="text-xs text-orange-600 hover:text-orange-800 font-medium"
            >
              Today
            </button>

            {selectedDate && (
              <button
                type="button"
                onClick={clearDate}
                className="text-xs text-gray-500 hover:text-gray-700 font-medium flex items-center space-x-1"
              >
                <X className="h-3 w-3" />
                <span>Cancel</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default CustomDatePicker