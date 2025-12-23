import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import InlineAlert from '../../../components/common/InlineAlert'

describe('InlineAlert Component', () => {
  describe('Rendering', () => {
    it('should render with message and details', () => {
      render(
        <InlineAlert
          type="error"
          message="Something went wrong"
          details="Please try again later"
        />
      )

      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
      expect(screen.getByText('Please try again later')).toBeInTheDocument()
    })

    it('should render with custom children instead of message', () => {
      render(
        <InlineAlert type="info">
          <div>Custom content here</div>
        </InlineAlert>
      )

      expect(screen.getByText('Custom content here')).toBeInTheDocument()
    })

    it('should render without details', () => {
      render(<InlineAlert type="warning" message="Warning message" />)

      expect(screen.getByText('Warning message')).toBeInTheDocument()
      expect(screen.queryByText('Please try again later')).not.toBeInTheDocument()
    })
  })

  describe('Actions', () => {
    it('should render action buttons', () => {
      const mockAction1 = vi.fn()
      const mockAction2 = vi.fn()

      render(
        <InlineAlert
          type="warning"
          message="Choose an option"
          actions={[
            { label: 'Option 1', onClick: mockAction1 },
            { label: 'Option 2', onClick: mockAction2 }
          ]}
        />
      )

      expect(screen.getByText('Option 1')).toBeInTheDocument()
      expect(screen.getByText('Option 2')).toBeInTheDocument()
    })

    it('should call onClick when action button is clicked', () => {
      const mockAction = vi.fn()

      render(
        <InlineAlert
          type="warning"
          message="Choose an option"
          actions={[{ label: 'Click me', onClick: mockAction }]}
        />
      )

      const button = screen.getByText('Click me')
      fireEvent.click(button)

      expect(mockAction).toHaveBeenCalledTimes(1)
    })

    it('should render multiple actions', () => {
      render(
        <InlineAlert
          type="info"
          message="Multiple options"
          actions={[
            { label: 'Action 1', onClick: vi.fn() },
            { label: 'Action 2', onClick: vi.fn() },
            { label: 'Action 3', onClick: vi.fn() }
          ]}
        />
      )

      expect(screen.getByText('Action 1')).toBeInTheDocument()
      expect(screen.getByText('Action 2')).toBeInTheDocument()
      expect(screen.getByText('Action 3')).toBeInTheDocument()
    })
  })

  describe('Dismissible', () => {
    it('should show dismiss button by default', () => {
      render(<InlineAlert type="info" message="Dismissible" />)

      const dismissButton = screen.getByLabelText('Dismiss alert')
      expect(dismissButton).toBeInTheDocument()
    })

    it('should hide dismiss button when dismissible is false', () => {
      render(<InlineAlert type="info" message="Not dismissible" dismissible={false} />)

      const dismissButton = screen.queryByLabelText('Dismiss alert')
      expect(dismissButton).not.toBeInTheDocument()
    })

    it('should hide alert when dismiss button is clicked', () => {
      render(<InlineAlert type="info" message="Will be dismissed" />)

      const dismissButton = screen.getByLabelText('Dismiss alert')
      fireEvent.click(dismissButton)

      expect(screen.queryByText('Will be dismissed')).not.toBeInTheDocument()
    })

    it('should call onDismiss callback when dismissed', () => {
      const mockOnDismiss = vi.fn()

      render(
        <InlineAlert
          type="info"
          message="Dismissible"
          onDismiss={mockOnDismiss}
        />
      )

      const dismissButton = screen.getByLabelText('Dismiss alert')
      fireEvent.click(dismissButton)

      expect(mockOnDismiss).toHaveBeenCalledTimes(1)
    })
  })

  describe('Accessibility', () => {
    it('should have role="alert"', () => {
      render(<InlineAlert type="info" message="Alert" />)

      const alert = screen.getByRole('alert')
      expect(alert).toBeInTheDocument()
    })

    it('should have aria-live="polite"', () => {
      render(<InlineAlert type="info" message="Alert" />)

      const alert = screen.getByRole('alert')
      expect(alert).toHaveAttribute('aria-live', 'polite')
    })

    it('should have accessible dismiss button label', () => {
      render(<InlineAlert type="info" message="Alert" />)

      const dismissButton = screen.getByLabelText('Dismiss alert')
      expect(dismissButton).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty actions array', () => {
      render(
        <InlineAlert
          type="info"
          message="No actions"
          actions={[]}
        />
      )

      expect(screen.getByText('No actions')).toBeInTheDocument()
      // Should not render actions container
      expect(screen.queryByRole('button', { name: /^(?!Dismiss)/ })).not.toBeInTheDocument()
    })

    it('should handle message without details', () => {
      render(<InlineAlert type="warning" message="Only message" />)

      expect(screen.getByText('Only message')).toBeInTheDocument()
    })

    it('should handle children overriding message and details', () => {
      render(
        <InlineAlert type="info" message="Will not show" details="Also not shown">
          <p>Custom content</p>
        </InlineAlert>
      )

      expect(screen.queryByText('Will not show')).not.toBeInTheDocument()
      expect(screen.queryByText('Also not shown')).not.toBeInTheDocument()
      expect(screen.getByText('Custom content')).toBeInTheDocument()
    })
  })

  describe('Integration Scenario - Table Suggestions', () => {
    it('should render table suggestion scenario correctly', () => {
      const mockSelectTable = vi.fn()

      render(
        <InlineAlert
          type="warning"
          message="Tables 5 and 6 are unavailable"
          details="Already reserved by another customer"
          actions={[
            { label: 'Try Table 7', onClick: () => mockSelectTable(7), variant: 'primary' },
            { label: 'Try Table 8', onClick: () => mockSelectTable(8) },
            { label: 'Try Table 9', onClick: () => mockSelectTable(9) }
          ]}
        />
      )

      expect(screen.getByText('Tables 5 and 6 are unavailable')).toBeInTheDocument()
      expect(screen.getByText('Already reserved by another customer')).toBeInTheDocument()

      const table7Button = screen.getByText('Try Table 7')
      fireEvent.click(table7Button)

      expect(mockSelectTable).toHaveBeenCalledWith(7)
    })
  })
})
