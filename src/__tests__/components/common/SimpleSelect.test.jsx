import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import SimpleSelect from '../../../components/common/SimpleSelect'

describe('SimpleSelect Component', () => {
  let mockOnChange
  const user = userEvent.setup()

  // Realistic test options
  const testOptions = [
    { value: 'pizza', label: 'Pizza' },
    { value: 'pasta', label: 'Pasta' },
    { value: 'salade', label: 'Salade' },
    { value: 'dessert', label: 'Dessert' }
  ]

  beforeEach(() => {
    mockOnChange = vi.fn()
    vi.clearAllMocks()
  })

  const renderComponent = (props = {}) => {
    return render(
      <SimpleSelect
        onChange={mockOnChange}
        options={testOptions}
        {...props}
      />
    )
  }

  // 1. Core Rendering & Props Tests
  describe('Core Rendering and Props', () => {
    it('should render select button with selected option label', () => {
      renderComponent({ value: 'pizza' })
      
      expect(screen.getByRole('button')).toBeInTheDocument()
      expect(screen.getByText('Pizza')).toBeInTheDocument()
      expect(screen.getByText('▼')).toBeInTheDocument() // Dropdown arrow
    })

    it('should apply custom className to button and dropdown', async () => {
      renderComponent({ 
        value: 'pasta',
        className: 'custom-select-class'
      })
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-select-class')
      
      // Open dropdown to check dropdown className
      await user.click(button)
      
      await waitFor(() => {
        // Find dropdown by its specific class structure
        const dropdown = document.querySelector('div.absolute.top-0.left-0')
        expect(dropdown).toHaveClass('custom-select-class')
      })
    })

    it('should handle empty options array gracefully', () => {
      renderComponent({ 
        options: [],
        value: undefined
      })
      
      expect(screen.getByRole('button')).toBeInTheDocument()
      expect(screen.getByText('▼')).toBeInTheDocument()
    })
  })

  // 2. Dropdown Interaction Tests
  describe('Dropdown Interaction', () => {
    it('should open dropdown when button clicked', async () => {
      renderComponent({ value: 'pizza' })
      
      // Initially dropdown should not be visible
      expect(document.querySelector('div.absolute.top-0.left-0')).not.toBeInTheDocument()
      
      // Click button to open dropdown
      await user.click(screen.getByRole('button'))
      
      // Dropdown should now be visible with all options
      await waitFor(() => {
        const dropdown = document.querySelector('div.absolute.top-0.left-0')
        expect(dropdown).toBeInTheDocument()
        // Check that we have multiple options in dropdown
        const dropdownOptions = dropdown.querySelectorAll('div[class*="cursor-pointer"]')
        expect(dropdownOptions.length).toBe(4) // All 4 options
      })
    })

    it('should close dropdown when clicking outside', async () => {
      renderComponent({ value: 'pizza' })
      
      // Open dropdown
      const button = screen.getByRole('button')
      await user.click(button)
      
      // Verify dropdown is open
      await waitFor(() => {
        expect(document.querySelector('div.absolute.top-0.left-0')).toBeInTheDocument()
      })
      
      // Click outside (on document body)
      await user.click(document.body)
      
      // Dropdown should close
      await waitFor(() => {
        expect(document.querySelector('div.absolute.top-0.left-0')).not.toBeInTheDocument()
      })
    })

    it('should close dropdown when option selected', async () => {
      renderComponent({ value: 'pizza' })
      
      // Open dropdown
      await user.click(screen.getByRole('button'))
      
      // Verify dropdown is open
      await waitFor(() => {
        expect(document.querySelector('div.absolute.top-0.left-0')).toBeInTheDocument()
      })
      
      // Click on an option (find Pasta option in dropdown)
      const dropdown = document.querySelector('div.absolute.top-0.left-0')
      const pastaOption = Array.from(dropdown.querySelectorAll('div[class*="cursor-pointer"]')).find(el =>
        el.textContent.includes('Pasta')
      )
      await user.click(pastaOption)
      
      // Dropdown should close
      await waitFor(() => {
        expect(document.querySelector('div.absolute.top-0.left-0')).not.toBeInTheDocument()
      })
    })
  })

  // 3. Option Selection & Callbacks Tests
  describe('Option Selection and Callbacks', () => {
    it('should call onChange when option clicked', async () => {
      renderComponent({ value: 'pizza' })
      
      // Open dropdown
      await user.click(screen.getByRole('button'))
      
      // Wait for dropdown to open
      await waitFor(() => {
        expect(document.querySelector('div.absolute.top-0.left-0')).toBeInTheDocument()
      })
      
      // Click on Pasta option
      const dropdown = document.querySelector('div.absolute.top-0.left-0')
      const pastaOption = Array.from(dropdown.querySelectorAll('div[class*="cursor-pointer"]')).find(el =>
        el.textContent.includes('Pasta')
      )
      await user.click(pastaOption)
      
      expect(mockOnChange).toHaveBeenCalledWith('pasta')
    })

    it('should display selected option with indicator dot', async () => {
      renderComponent({ value: 'salade' })
      
      // Open dropdown
      await user.click(screen.getByRole('button'))
      
      // Wait for dropdown to open
      await waitFor(() => {
        expect(document.querySelector('div.absolute.top-0.left-0')).toBeInTheDocument()
      })
      
      // Check that selected option has orange dot indicator
      const dropdown = document.querySelector('div.absolute.top-0.left-0')
      const saladeOption = Array.from(dropdown.querySelectorAll('div[class*="cursor-pointer"]')).find(el =>
        el.textContent.includes('Salade')
      )
      const orangeDot = saladeOption.querySelector('.bg-orange-600.rounded-full')
      expect(orangeDot).toBeInTheDocument()
    })

    it('should highlight selected option in dropdown', async () => {
      renderComponent({ value: 'dessert' })
      
      // Open dropdown
      await user.click(screen.getByRole('button'))
      
      // Wait for dropdown to open
      await waitFor(() => {
        expect(document.querySelector('div.absolute.top-0.left-0')).toBeInTheDocument()
      })
      
      // Check that selected option has orange text color
      const dropdown = document.querySelector('div.absolute.top-0.left-0')
      const dessertOption = Array.from(dropdown.querySelectorAll('div[class*="cursor-pointer"]')).find(el =>
        el.textContent.includes('Dessert')
      )
      expect(dessertOption).toHaveClass('text-orange-600')
    })
  })

  // 4. Focus Management & Accessibility Tests
  describe('Focus Management and Accessibility', () => {
    it('should manage focus correctly during dropdown interactions', async () => {
      renderComponent({ value: 'pizza' })
      
      const button = screen.getByRole('button')
      
      // Button should be focusable
      button.focus()
      expect(button).toHaveFocus()
      
      // Open dropdown
      await user.click(button)
      
      // Wait for dropdown to open
      await waitFor(() => {
        expect(document.querySelector('div.absolute.top-0.left-0')).toBeInTheDocument()
      })
      
      // Close dropdown by clicking outside
      await user.click(document.body)
      
      // Wait for dropdown to close
      await waitFor(() => {
        expect(document.querySelector('div.absolute.top-0.left-0')).not.toBeInTheDocument()
      })
    })

    it('should show proper visual states (open/closed/hover)', async () => {
      renderComponent({ value: 'pizza' })
      
      const button = screen.getByRole('button')
      
      // Initially closed state
      expect(button).toBeInTheDocument()
      
      // Open dropdown
      await user.click(button)
      
      // Should show open state (dropdown visible)
      await waitFor(() => {
        expect(document.querySelector('div.absolute.top-0.left-0')).toBeInTheDocument()
        // Arrow should be rotated when open
        const arrow = screen.getByText('▼')
        expect(arrow).toHaveClass('rotate-180')
      })
    })
  })

  // 5. Edge Cases Tests
  describe('Edge Cases', () => {
    it('should handle no initial selection (undefined value)', () => {
      renderComponent({ 
        value: undefined,
        options: testOptions
      })
      
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
      
      // Button should be empty (no selected option text)
      const buttonText = button.querySelector('span')
      expect(buttonText.textContent).toBe('')
    })

    it('should handle options with same labels but different values', async () => {
      const duplicateOptions = [
        { value: 'pizza-small', label: 'Pizza' },
        { value: 'pizza-large', label: 'Pizza' },
        { value: 'pasta', label: 'Pasta' }
      ]
      
      renderComponent({ 
        value: 'pizza-large',
        options: duplicateOptions
      })
      
      // Should show the selected option
      expect(screen.getByText('Pizza')).toBeInTheDocument()
      
      // Open dropdown
      await user.click(screen.getByRole('button'))
      
      // Should show both Pizza options in dropdown
      await waitFor(() => {
        const dropdown = document.querySelector('div.absolute.top-0.left-0')
        expect(dropdown).toBeInTheDocument()
        const pizzaOptionsInDropdown = Array.from(dropdown.querySelectorAll('div[class*="cursor-pointer"]')).filter(el =>
          el.textContent.includes('Pizza')
        )
        expect(pizzaOptionsInDropdown.length).toBe(2)
      })
      
      // Click on the first Pizza option (pizza-small)
      const dropdown = document.querySelector('div.absolute.top-0.left-0')
      const pizzaOptions = Array.from(dropdown.querySelectorAll('div[class*="cursor-pointer"]')).filter(el =>
        el.textContent.includes('Pizza')
      )
      await user.click(pizzaOptions[0])
      
      expect(mockOnChange).toHaveBeenCalledWith('pizza-small')
    })
  })

  // 6. Integration Tests
  describe('Integration Behavior', () => {
    it('should update display when value prop changes', () => {
      const { rerender } = renderComponent({ value: 'pizza' })
      
      // Initial value
      expect(screen.getByText('Pizza')).toBeInTheDocument()
      
      // Change value prop
      rerender(
        <SimpleSelect
          onChange={mockOnChange}
          options={testOptions}
          value="salade"
        />
      )
      
      expect(screen.getByText('Salade')).toBeInTheDocument()
    })

    it('should handle rapid clicks without breaking', async () => {
      renderComponent({ value: 'pizza' })
      
      const button = screen.getByRole('button')
      
      // Click rapidly multiple times
      await user.click(button)
      await user.click(button)
      await user.click(button)
      
      // Should still work correctly
      await waitFor(() => {
        expect(screen.getByText('Pasta')).toBeInTheDocument()
      })
    })

    it('should work with minimal options array', async () => {
      renderComponent({ 
        value: 'single',
        options: [{ value: 'single', label: 'Only Option' }]
      })
      
      expect(screen.getByText('Only Option')).toBeInTheDocument()
      
      // Open dropdown
      await user.click(screen.getByRole('button'))
      
      // Should show the single option
      await waitFor(() => {
        const options = screen.getAllByText('Only Option')
        expect(options.length).toBe(2) // Button + dropdown
      })
    })
  })
})