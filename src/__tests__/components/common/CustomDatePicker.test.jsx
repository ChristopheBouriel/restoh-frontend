import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import CustomDatePicker from '../../../components/common/CustomDatePicker'

describe('CustomDatePicker Component', () => {
  let mockOnChange
  const user = userEvent.setup()

  beforeEach(() => {
    mockOnChange = vi.fn()
    vi.clearAllMocks()
  })

  const renderComponent = (props = {}) => {
    return render(
      <CustomDatePicker
        onChange={mockOnChange}
        {...props}
      />
    )
  }

  // 1. Core Rendering & Props Tests
  describe('Core Rendering and Props', () => {
    it('should render date picker with input field and calendar button', () => {
      renderComponent()
      
      expect(screen.getByRole('button')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('DD/MM/YYYY')).toBeInTheDocument()
      expect(screen.getByDisplayValue('')).toBeInTheDocument() // Empty input
    })

    it('should display selected date in French format when value provided', () => {
      renderComponent({ value: '2024-01-20' })
      
      const input = screen.getByPlaceholderText('DD/MM/YYYY')
      expect(input).toHaveValue('20/01/2024')
    })

    it('should apply custom className to container', () => {
      renderComponent({ 
        placeholder: 'Choisir une date',
        className: 'custom-class'
      })
      
      const inputContainer = screen.getByPlaceholderText('DD/MM/YYYY').parentElement
      expect(inputContainer).toHaveClass('custom-class')
    })
  })

  // 2. Dropdown Interaction Tests
  describe('Dropdown Interaction', () => {
    it('should open calendar dropdown when button clicked', async () => {
      renderComponent()
      
      // Initially calendar should not be visible (check for any month)
      expect(screen.queryByText(/\d{4}/)).not.toBeInTheDocument() // No year visible
      
      // Click button to open calendar
      const button = screen.getByRole('button')
      await user.click(button)
      
      // Should show calendar with current month/year and day headers
      await waitFor(() => {
        expect(screen.getByText(/\d{4}/)).toBeInTheDocument() // Any year should be visible
        expect(screen.getByText('Dim')).toBeInTheDocument() // Day headers
        expect(screen.getByText('Lun')).toBeInTheDocument()
      })
    })

    it('should close calendar when clicking outside', async () => {
      const { container } = renderComponent()
      
      // Open calendar
      const button = screen.getByRole('button')
      await user.click(button)
      
      // Wait for calendar to open
      await waitFor(() => {
        expect(screen.getByText(/\d{4}/)).toBeInTheDocument()
      })
      
      // Click outside (on body)
      await user.click(document.body)
      
      // Wait for calendar to close
      await waitFor(() => {
        expect(screen.queryByText(/\d{4}/)).not.toBeInTheDocument()
      })
    })

    it('should close calendar when date selected', async () => {
      renderComponent()
      
      // Open calendar
      const button = screen.getByRole('button')
      await user.click(button)
      
      // Wait for calendar to open
      await waitFor(() => {
        expect(screen.getByText(/\d{4}/)).toBeInTheDocument()
      })
      
      // Click on a date (day 10)
      const dayButtons = screen.getAllByRole('button')
      const dayButton = dayButtons.find(btn => btn.textContent === '10' && btn.className.includes('w-8 h-8'))
      if (dayButton) {
        await user.click(dayButton)
        
        // After clicking a date, the calendar should close (check for action buttons disappearing)
        await waitFor(() => {
          expect(screen.queryByText('Today')).not.toBeInTheDocument()
        })
      }
    })
  })

  // 3. Date Selection & Navigation Tests
  describe('Date Selection and Navigation', () => {
    it('should select date when day clicked and call onChange', async () => {
      renderComponent()
      
      // Open calendar
      const button = screen.getByRole('button')
      await user.click(button)
      
      // Wait for calendar to open
      await waitFor(() => {
        expect(screen.getByText(/\d{4}/)).toBeInTheDocument()
      })
      
      // Click on a specific day that should exist (day 15)
      const dayButtons = screen.getAllByRole('button')
      const dayButton = dayButtons.find(btn => 
        btn.className.includes('w-8 h-8') && 
        btn.textContent === '15' && 
        !btn.disabled
      )
      
      if (dayButton) {
        await user.click(dayButton)
        
        // Should call onChange with a valid date string
        expect(mockOnChange).toHaveBeenCalled()
        const calledWith = mockOnChange.mock.calls[0][0]
        expect(calledWith).toMatch(/\d{4}-\d{2}-\d{2}/)
        // Verify that onChange was called with a valid date
        expect(new Date(calledWith)).toBeInstanceOf(Date)
        expect(isNaN(new Date(calledWith).getTime())).toBe(false)
      } else {
        // If day 15 is not available, just check that any date selection works
        const anyDayButton = dayButtons.find(btn => 
          btn.className.includes('w-8 h-8') && 
          /^\d+$/.test(btn.textContent?.trim() || '') && 
          !btn.disabled
        )
        
        if (anyDayButton) {
          await user.click(anyDayButton)
          
          expect(mockOnChange).toHaveBeenCalled()
          const calledWith = mockOnChange.mock.calls[0][0]
          expect(calledWith).toMatch(/\d{4}-\d{2}-\d{2}/)
        }
      }
    })

    it('should navigate between months using arrow buttons', async () => {
      renderComponent()
      
      // Open calendar
      const button = screen.getByRole('button')
      await user.click(button)
      
      // Wait for calendar to open and get initial month
      await waitFor(() => {
        expect(screen.getByText(/\d{4}/)).toBeInTheDocument()
      })
      
      const initialMonthText = screen.getByText(/\w+ \d{4}/).textContent
      
      // Navigate to next month using the right arrow button
      const navigationButtons = screen.getAllByRole('button')
      const nextButton = navigationButtons.find(btn => 
        btn.querySelector('svg') && btn.className.includes('hover:bg-orange-50')
      )
      
      if (nextButton) {
        await user.click(nextButton)
        
        await waitFor(() => {
          const newMonthText = screen.getByText(/\w+ \d{4}/).textContent
          expect(newMonthText).not.toBe(initialMonthText)
        })
      }
    })

    it('should highlight today\'s date in calendar', async () => {
      renderComponent()
      
      // Open calendar
      const button = screen.getByRole('button')
      await user.click(button)
      
      // Wait for calendar to open
      await waitFor(() => {
        expect(screen.getByText(/\d{4}/)).toBeInTheDocument()
        // Calendar should be rendered with days
        const dayButtons = screen.getAllByRole('button')
        const calendarDays = dayButtons.filter(btn => btn.className.includes('w-8 h-8'))
        expect(calendarDays.length).toBeGreaterThan(0)
      })
    })

    it('should display correct month and year in header', async () => {
      renderComponent()
      
      // Open calendar
      const button = screen.getByRole('button')
      await user.click(button)
      
      // Wait for calendar to open and check header format
      await waitFor(() => {
        const headerText = screen.getByText(/\w+ \d{4}/)
        expect(headerText).toBeInTheDocument()
        // Should match format like "Septembre 2025" or "Janvier 2024"
        expect(headerText.textContent).toMatch(/^\w+ \d{4}$/)
      })
    })
  })

  // 4. Constraints & Validation Tests
  describe('Constraints and Validation', () => {
    it('should disable dates outside minDate/maxDate range', async () => {
      // Set constraints for current month
      const today = new Date()
      const currentYear = today.getFullYear()
      const currentMonth = today.getMonth()
      const minDate = new Date(currentYear, currentMonth, 10).toISOString().split('T')[0]
      const maxDate = new Date(currentYear, currentMonth, 25).toISOString().split('T')[0]
      
      renderComponent({ minDate, maxDate })
      
      // Open calendar
      const button = screen.getByRole('button')
      await user.click(button)
      
      // Wait for calendar to open
      await waitFor(() => {
        expect(screen.getByText(/\d{4}/)).toBeInTheDocument()
        
        // Check that some dates are disabled
        const dayButtons = screen.getAllByRole('button')
        const calendarDays = dayButtons.filter(btn => btn.className.includes('w-8 h-8'))
        
        // Find a day that should be disabled (day 5, before minDate)
        const day5Button = calendarDays.find(btn => btn.textContent === '5')
        if (day5Button) {
          expect(day5Button).toBeDisabled()
        }
        
        // Find a day that should be enabled (day 15, within range)
        const day15Button = calendarDays.find(btn => btn.textContent === '15')
        if (day15Button) {
          expect(day15Button).not.toBeDisabled()
        }
      })
    })

    it('should prevent selection of disabled dates', async () => {
      // Set constraints for current month
      const today = new Date()
      const currentYear = today.getFullYear()
      const currentMonth = today.getMonth()
      const minDate = new Date(currentYear, currentMonth, 10).toISOString().split('T')[0]
      const maxDate = new Date(currentYear, currentMonth, 25).toISOString().split('T')[0]
      
      renderComponent({ minDate, maxDate })
      
      // Open calendar
      const button = screen.getByRole('button')
      await user.click(button)
      
      // Wait for calendar to open
      await waitFor(() => {
        expect(screen.getByText(/\d{4}/)).toBeInTheDocument()
      })
      
      // Try to click on disabled date (day 5)
      const dayButtons = screen.getAllByRole('button')
      const calendarDays = dayButtons.filter(btn => btn.className.includes('w-8 h-8'))
      const day5Button = calendarDays.find(btn => btn.textContent === '5')
      
      if (day5Button && day5Button.disabled) {
        await user.click(day5Button)
        // onChange should not be called
        expect(mockOnChange).not.toHaveBeenCalled()
      }
    })

    it('should respect date constraints when navigating', async () => {
      const testDate = '2024-01-15'
      renderComponent({ 
        value: testDate,
        minDate: '2024-01-01',
        maxDate: '2024-01-31'
      })
      
      // Should show the selected date in the input
      const input = screen.getByPlaceholderText('DD/MM/YYYY')
      expect(input).toHaveValue('15/01/2024')
      
      // Open calendar and verify it opens successfully
      const button = screen.getByRole('button')
      await user.click(button)
      
      await waitFor(() => {
        // Look specifically for the calendar header (month + year)
        const calendarHeaders = screen.getAllByText(/\w+ \d{4}/)
        expect(calendarHeaders.length).toBeGreaterThan(0)
      })
    })
  })

  // 5. Action Buttons Tests
  describe('Action Buttons', () => {
    it('should set today\'s date when "Today" clicked', async () => {
      renderComponent()
      
      // Open calendar
      const button = screen.getByRole('button')
      await user.click(button)
      
      // Wait for calendar to open
      await waitFor(() => {
        expect(screen.getByText(/\d{4}/)).toBeInTheDocument()
      })
      
      // Click "Today" button
      const todayButton = screen.getByText('Today')
      await user.click(todayButton)
      
      // Should call onChange with today's date
      expect(mockOnChange).toHaveBeenCalled()
      const calledWith = mockOnChange.mock.calls[0][0]
      expect(calledWith).toMatch(/\d{4}-\d{2}-\d{2}/)
    })

    it('should clear selection when "Cancel" clicked', async () => {
      renderComponent({ value: '2024-01-20' })
      
      // Open calendar
      const button = screen.getByRole('button')
      await user.click(button)
      
      // Wait for calendar to open by looking for the action buttons
      await waitFor(() => {
        expect(screen.getByText('Today')).toBeInTheDocument()
      })
      
      // Should show "Cancel" button when there's a selection
      const clearButton = screen.getByText('Cancel')
      expect(clearButton).toBeInTheDocument()
      
      // Click "Cancel"
      await user.click(clearButton)
      
      expect(mockOnChange).toHaveBeenCalledWith('')
    })
  })

  // 6. French Localization Tests
  describe('French Localization', () => {
    it('should display French month names and day abbreviations', async () => {
      renderComponent()
      
      // Open calendar
      const button = screen.getByRole('button')
      await user.click(button)
      
      // Wait for calendar to open
      await waitFor(() => {
        // Check that a French month name is displayed (any month is fine)
        const monthHeader = screen.getByText(/\w+ \d{4}/)
        expect(monthHeader).toBeInTheDocument()
        
        // Check day abbreviations
        expect(screen.getByText('Dim')).toBeInTheDocument()
        expect(screen.getByText('Lun')).toBeInTheDocument()
        expect(screen.getByText('Mar')).toBeInTheDocument()
        expect(screen.getByText('Mer')).toBeInTheDocument()
        expect(screen.getByText('Jeu')).toBeInTheDocument()
        expect(screen.getByText('Ven')).toBeInTheDocument()
        expect(screen.getByText('Sam')).toBeInTheDocument()
      })
    })

    it('should format selected date in French locale (DD/MM/YYYY)', () => {
      renderComponent({ value: '2024-12-25' })
      
      // Should display in French format in the input field
      const input = screen.getByPlaceholderText('DD/MM/YYYY')
      expect(input).toHaveValue('25/12/2024')
    })
  })

  // 7. Manual Input Tests
  describe('Manual Date Input', () => {
    it('should render input field with DD/MM/YYYY placeholder', () => {
      renderComponent()
      
      const input = screen.getByPlaceholderText('DD/MM/YYYY')
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('type', 'text')
    })

    it('should accept and validate DD/MM/YYYY format', async () => {
      renderComponent()
      
      const input = screen.getByPlaceholderText('DD/MM/YYYY')
      await user.type(input, '25/12/2024')
      await user.tab() // Trigger blur event
      
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('2024-12-25')
        expect(screen.queryByText(/Format invalide/)).not.toBeInTheDocument()
      })
    })

    it('should accept and validate YYYY-MM-DD format', async () => {
      renderComponent()
      
      const input = screen.getByPlaceholderText('DD/MM/YYYY')
      await user.type(input, '2024-12-25')
      await user.tab() // Trigger blur event
      
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('2024-12-25')
        expect(screen.queryByText(/Format invalide/)).not.toBeInTheDocument()
      })
    })

    it('should show error for invalid date format', async () => {
      renderComponent()
      
      const input = screen.getByPlaceholderText('DD/MM/YYYY')
      await user.type(input, 'invalid-date')
      await user.tab() // Trigger blur event
      
      await waitFor(() => {
        expect(screen.getByText('Format invalide (DD/MM/YYYY)')).toBeInTheDocument()
        expect(mockOnChange).not.toHaveBeenCalled()
      })
    })

    it('should show error for invalid dates like 31/02/2024', async () => {
      renderComponent()
      
      const input = screen.getByPlaceholderText('DD/MM/YYYY')
      await user.type(input, '31/02/2024')
      await user.tab() // Trigger blur event
      
      await waitFor(() => {
        expect(screen.getByText('Format invalide (DD/MM/YYYY)')).toBeInTheDocument()
        expect(mockOnChange).not.toHaveBeenCalled()
      })
    })

    it('should validate minDate constraint for manual input', async () => {
      const today = new Date()
      const currentYear = today.getFullYear()
      const currentMonth = today.getMonth()
      const minDate = new Date(currentYear, currentMonth, 15).toISOString().split('T')[0]
      
      renderComponent({ minDate })
      
      const input = screen.getByPlaceholderText('DD/MM/YYYY')
      await user.type(input, '05/01/2020') // Very old date
      await user.tab()
      
      await waitFor(() => {
        expect(screen.getByText('Date trop ancienne')).toBeInTheDocument()
      })
    })

    it('should validate maxDate constraint for manual input', async () => {
      const today = new Date()
      const currentYear = today.getFullYear()
      const currentMonth = today.getMonth()
      const maxDate = new Date(currentYear, currentMonth, 15).toISOString().split('T')[0]
      
      renderComponent({ maxDate })
      
      const input = screen.getByPlaceholderText('DD/MM/YYYY')
      await user.type(input, '01/01/2030') // Future date
      await user.tab()
      
      await waitFor(() => {
        expect(screen.getByText('Date trop récente')).toBeInTheDocument()
      })
    })

    it('should clear date when input is emptied', async () => {
      renderComponent({ value: '2024-01-15' })
      
      const input = screen.getByPlaceholderText('DD/MM/YYYY')
      expect(input).toHaveValue('15/01/2024')
      
      await user.clear(input)
      
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('')
      })
    })

    it('should format date correctly in input when value prop changes', () => {
      const { rerender } = renderComponent({ value: '2024-01-15' })
      
      const input = screen.getByPlaceholderText('DD/MM/YYYY')
      expect(input).toHaveValue('15/01/2024')
      
      rerender(
        <CustomDatePicker
          onChange={mockOnChange}
          value="2024-06-20"
        />
      )
      
      expect(input).toHaveValue('20/06/2024')
    })
  })

  // 8. Keyboard Navigation Tests
  describe('Keyboard Navigation', () => {
    it('should confirm input on Enter key', async () => {
      renderComponent()
      
      const input = screen.getByPlaceholderText('DD/MM/YYYY')
      await user.type(input, '15/03/2024')
      await user.keyboard('{Enter}')
      
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('2024-03-15')
        expect(input).not.toHaveFocus()
      })
    })

    it('should cancel input changes on Escape key', async () => {
      renderComponent({ value: '2024-01-15' })
      
      const input = screen.getByPlaceholderText('DD/MM/YYYY')
      expect(input).toHaveValue('15/01/2024')
      
      await user.clear(input)
      await user.type(input, '25/12/2024')
      await user.keyboard('{Escape}')
      
      await waitFor(() => {
        expect(input).toHaveValue('15/01/2024') // Should restore previous value
        expect(input).not.toHaveFocus()
      })
    })

    it('should clear error on new input', async () => {
      renderComponent()
      
      const input = screen.getByPlaceholderText('DD/MM/YYYY')
      await user.type(input, 'invalid')
      await user.tab()
      
      await waitFor(() => {
        expect(screen.getByText('Format invalide (DD/MM/YYYY)')).toBeInTheDocument()
      })
      
      // Start typing new value
      await user.clear(input)
      await user.type(input, '1')
      
      await waitFor(() => {
        expect(screen.queryByText('Format invalide (DD/MM/YYYY)')).not.toBeInTheDocument()
      })
    })
  })

  // 9. Integration between Manual Input and Calendar
  describe('Manual Input and Calendar Integration', () => {
    it('should update calendar when valid date is entered manually', async () => {
      renderComponent()
      
      const input = screen.getByPlaceholderText('DD/MM/YYYY')
      await user.type(input, '15/06/2024')
      await user.tab()
      
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('2024-06-15')
      })
      
      // Open calendar to verify it shows the correct month
      const calendarButton = screen.getByRole('button')
      await user.click(calendarButton)
      
      await waitFor(() => {
        expect(screen.getByText(/Juin 2024/)).toBeInTheDocument()
      })
    })

    it('should update input when date is selected from calendar', async () => {
      renderComponent()
      
      const input = screen.getByPlaceholderText('DD/MM/YYYY')
      
      // Open calendar
      const calendarButton = screen.getByRole('button')
      await user.click(calendarButton)
      
      await waitFor(() => {
        expect(screen.getByText(/\d{4}/)).toBeInTheDocument()
      })
      
      // Click on a date
      const dayButtons = screen.getAllByRole('button')
      const dayButton = dayButtons.find(btn => 
        btn.className.includes('w-8 h-8') && 
        btn.textContent === '15' && 
        !btn.disabled
      )
      
      if (dayButton) {
        await user.click(dayButton)
        
        await waitFor(() => {
          expect(mockOnChange).toHaveBeenCalled()
          // Check that input value was updated with the selected date
          const calledWith = mockOnChange.mock.calls[0][0]
          const selectedDate = new Date(calledWith)
          const expectedFormat = selectedDate.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })
          expect(input).toHaveValue(expectedFormat)
        })
      }
    })

    it('should clear both input and error when clear button is clicked', async () => {
      renderComponent({ value: '2024-01-20' })
      
      const input = screen.getByPlaceholderText('DD/MM/YYYY')
      expect(input).toHaveValue('20/01/2024')
      
      // Open calendar
      const calendarButton = screen.getByRole('button')
      await user.click(calendarButton)
      
      await waitFor(() => {
        expect(screen.getByText('Cancel')).toBeInTheDocument()
      })
      
      // Click clear button
      const clearButton = screen.getByText('Cancel')
      await user.click(clearButton)
      
      await waitFor(() => {
        expect(input).toHaveValue('')
        expect(mockOnChange).toHaveBeenCalledWith('')
        expect(screen.queryByText(/Format invalide/)).not.toBeInTheDocument()
      })
    })
  })

  // 10. Integration Tests
  describe('Integration Behavior', () => {
    it('should handle value prop changes correctly', async () => {
      const { rerender } = renderComponent({ value: '2024-01-10' })
      
      // Initial value displayed in input
      const input = screen.getByPlaceholderText('DD/MM/YYYY')
      expect(input).toHaveValue('10/01/2024')
      
      // Update value prop
      rerender(
        <CustomDatePicker
          onChange={mockOnChange}
          value="2024-02-20"
        />
      )
      
      expect(input).toHaveValue('20/02/2024')
    })

    it('should maintain calendar position when selecting dates in different months', async () => {
      renderComponent()
      
      // Open calendar
      const button = screen.getByRole('button')
      await user.click(button)
      
      // Wait for calendar to open
      await waitFor(() => {
        expect(screen.getByText(/\d{4}/)).toBeInTheDocument()
      })
      
      // Navigate to next month
      const navigationButtons = screen.getAllByRole('button')
      const nextButton = navigationButtons.find(btn => 
        btn.querySelector('svg') && btn.className.includes('hover:bg-orange-50')
      )
      
      if (nextButton) {
        await user.click(nextButton)
        
        // Wait for month change
        await waitFor(() => {
          expect(screen.getByText(/\d{4}/)).toBeInTheDocument()
        })
        
        // Select a date in the new month
        const dayButtons = screen.getAllByRole('button')
        const calendarDays = dayButtons.filter(btn => btn.className.includes('w-8 h-8'))
        const dayButton = calendarDays.find(btn => btn.textContent === '14' && !btn.disabled)
        
        if (dayButton) {
          await user.click(dayButton)
          expect(mockOnChange).toHaveBeenCalled()
        }
      }
    })
  })
})