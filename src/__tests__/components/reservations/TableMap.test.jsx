import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import TableMap from '../../../components/reservations/TableMap'

describe('TableMap Component', () => {
  const mockOnTableSelect = vi.fn()

  beforeEach(() => {
    mockOnTableSelect.mockClear()
  })

  describe('Rendering', () => {
    it('should render the component without crashing', () => {
      render(<TableMap onTableSelect={mockOnTableSelect} />)
      expect(screen.getByText(/entrance/i)).toBeInTheDocument()
      expect(screen.getByText(/kitchen/i)).toBeInTheDocument()
    })

    it('should render the legend with all status types', () => {
      render(<TableMap onTableSelect={mockOnTableSelect} />)
      expect(screen.getByText('Available')).toBeInTheDocument()
      expect(screen.getByText('Selected')).toBeInTheDocument()
      expect(screen.getByText('Occupied')).toBeInTheDocument()
    })

    it('should render all 22 tables', () => {
      render(<TableMap onTableSelect={mockOnTableSelect} />)
      // Check that tables 1-22 are rendered by checking all buttons
      const allButtons = screen.getAllByRole('button')
      // Filter out non-table buttons and count tables
      const tableButtons = allButtons.filter(button => {
        const text = button.textContent
        return /^\d+\(\d+p\)$/.test(text)
      })
      expect(tableButtons).toHaveLength(22)
    })

    it('should render bay window decoration', () => {
      render(<TableMap onTableSelect={mockOnTableSelect} />)
      expect(screen.getByText('Bay Window')).toBeInTheDocument()
    })

    it('should render bar/counter decoration', () => {
      render(<TableMap onTableSelect={mockOnTableSelect} />)
      expect(screen.getByText('Bar / Counter')).toBeInTheDocument()
    })

    it('should render box decorations for tables 21 and 22', () => {
      render(<TableMap onTableSelect={mockOnTableSelect} />)
      expect(screen.getByText('Box 1')).toBeInTheDocument()
      expect(screen.getByText('Box 2')).toBeInTheDocument()
    })
  })

  describe('Loading State', () => {
    it('should show loading overlay when isLoading is true', () => {
      render(<TableMap onTableSelect={mockOnTableSelect} isLoading={true} />)
      expect(screen.getByText('Loading tables...')).toBeInTheDocument()
    })

    it('should not show loading overlay when isLoading is false', () => {
      render(<TableMap onTableSelect={mockOnTableSelect} isLoading={false} />)
      expect(screen.queryByText('Loading tables...')).not.toBeInTheDocument()
    })
  })

  describe('Table Selection', () => {
    it('should call onTableSelect when an available table is clicked', () => {
      render(<TableMap onTableSelect={mockOnTableSelect} />)
      const table1 = screen.getByText('1').closest('button')
      fireEvent.click(table1)
      expect(mockOnTableSelect).toHaveBeenCalledWith(1)
    })

    it('should not call onTableSelect when an occupied table is clicked', () => {
      render(<TableMap onTableSelect={mockOnTableSelect} occupiedTables={[5]} />)
      const table5 = screen.getByText('5').closest('button')
      fireEvent.click(table5)
      expect(mockOnTableSelect).not.toHaveBeenCalled()
    })

    it('should display selected tables with orange background', () => {
      render(<TableMap onTableSelect={mockOnTableSelect} selectedTables={[3]} />)
      const table3 = screen.getByText('3').closest('button')
      expect(table3).toHaveClass('bg-orange-500')
    })

    it('should display occupied tables with red background', () => {
      render(<TableMap onTableSelect={mockOnTableSelect} occupiedTables={[7]} />)
      const table7 = screen.getByText('7').closest('button')
      expect(table7).toHaveClass('bg-red-100')
    })

    it('should disable occupied tables', () => {
      render(<TableMap onTableSelect={mockOnTableSelect} occupiedTables={[9]} />)
      const table9 = screen.getByText('9').closest('button')
      expect(table9).toBeDisabled()
    })
  })

  describe('Selected Tables Summary', () => {
    it('should not show summary when no tables are selected', () => {
      render(<TableMap onTableSelect={mockOnTableSelect} selectedTables={[]} />)
      expect(screen.queryByText(/Selected Tables:/)).not.toBeInTheDocument()
    })

    it('should show summary when tables are selected', () => {
      render(<TableMap onTableSelect={mockOnTableSelect} selectedTables={[1, 2]} />)
      expect(screen.getByText(/Selected Tables: 2/)).toBeInTheDocument()
    })

    it('should display table numbers in the summary', () => {
      render(<TableMap onTableSelect={mockOnTableSelect} selectedTables={[1, 5]} />)
      expect(screen.getByText(/#1 \(2p\)/)).toBeInTheDocument()
      expect(screen.getByText(/#5 \(2p\)/)).toBeInTheDocument()
    })

    it('should calculate total capacity correctly for 2-person tables', () => {
      render(<TableMap onTableSelect={mockOnTableSelect} selectedTables={[1, 2, 3]} />)
      expect(screen.getByText(/Total capacity: 6 guests/)).toBeInTheDocument()
    })

    it('should calculate total capacity correctly for 4-person tables', () => {
      render(<TableMap onTableSelect={mockOnTableSelect} selectedTables={[13, 14]} />)
      expect(screen.getByText(/Total capacity: 8 guests/)).toBeInTheDocument()
    })

    it('should calculate total capacity correctly for 6-person tables', () => {
      render(<TableMap onTableSelect={mockOnTableSelect} selectedTables={[21, 22]} />)
      expect(screen.getByText(/Total capacity: 12 guests/)).toBeInTheDocument()
    })

    it('should calculate total capacity correctly for mixed tables', () => {
      // Table 1 (2p) + Table 13 (4p) + Table 21 (6p) = 12p
      render(<TableMap onTableSelect={mockOnTableSelect} selectedTables={[1, 13, 21]} />)
      expect(screen.getByText(/Total capacity: 12 guests/)).toBeInTheDocument()
    })

    it('should sort selected tables by ID in summary', () => {
      render(<TableMap onTableSelect={mockOnTableSelect} selectedTables={[10, 3, 7]} />)
      const summaryContainer = screen.getByText(/Selected Tables:/).parentElement
      const tableSpans = within(summaryContainer).getAllByText(/#\d+/)
      expect(tableSpans[0]).toHaveTextContent('#3')
      expect(tableSpans[1]).toHaveTextContent('#7')
      expect(tableSpans[2]).toHaveTextContent('#10')
    })
  })

  describe('Table Capacities', () => {
    it('should display correct capacity for 2-person tables (1-12)', () => {
      render(<TableMap onTableSelect={mockOnTableSelect} />)
      for (let i = 1; i <= 12; i++) {
        const table = screen.getByText(i.toString()).closest('button')
        expect(table).toHaveTextContent('(2p)')
      }
    })

    it('should display correct capacity for 4-person tables (13-20)', () => {
      render(<TableMap onTableSelect={mockOnTableSelect} />)
      for (let i = 13; i <= 20; i++) {
        const table = screen.getByText(i.toString()).closest('button')
        expect(table).toHaveTextContent('(4p)')
      }
    })

    it('should display correct capacity for 6-person tables (21-22)', () => {
      render(<TableMap onTableSelect={mockOnTableSelect} />)
      const table21 = screen.getByText('21').closest('button')
      const table22 = screen.getByText('22').closest('button')
      expect(table21).toHaveTextContent('(6p)')
      expect(table22).toHaveTextContent('(6p)')
    })
  })

  describe('Hover Interactions', () => {
    it('should handle mouse enter on available table', () => {
      render(<TableMap onTableSelect={mockOnTableSelect} />)
      const table1 = screen.getByText('1').closest('button')

      // Before hover
      expect(table1).toHaveClass('bg-white')

      // Trigger hover
      fireEvent.mouseEnter(table1)
      expect(table1).toHaveClass('bg-green-100')
    })

    it('should handle mouse leave on available table', () => {
      render(<TableMap onTableSelect={mockOnTableSelect} />)
      const table1 = screen.getByText('1').closest('button')

      fireEvent.mouseEnter(table1)
      expect(table1).toHaveClass('bg-green-100')

      fireEvent.mouseLeave(table1)
      expect(table1).toHaveClass('bg-white')
    })

    it('should not change style on hover for occupied tables', () => {
      render(<TableMap onTableSelect={mockOnTableSelect} occupiedTables={[5]} />)
      const table5 = screen.getByText('5').closest('button')

      expect(table5).toHaveClass('bg-red-100')
      fireEvent.mouseEnter(table5)
      expect(table5).toHaveClass('bg-red-100')
    })

    it('should maintain selected style on hover for selected tables', () => {
      render(<TableMap onTableSelect={mockOnTableSelect} selectedTables={[8]} />)
      const table8 = screen.getByText('8').closest('button')

      expect(table8).toHaveClass('bg-orange-500')
      fireEvent.mouseEnter(table8)
      expect(table8).toHaveClass('bg-orange-500')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty selectedTables array', () => {
      render(<TableMap onTableSelect={mockOnTableSelect} selectedTables={[]} />)
      expect(screen.queryByText(/Selected Tables:/)).not.toBeInTheDocument()
    })

    it('should handle empty occupiedTables array', () => {
      render(<TableMap onTableSelect={mockOnTableSelect} occupiedTables={[]} />)
      const table1 = screen.getByText('1').closest('button')
      expect(table1).not.toBeDisabled()
    })

    it('should handle undefined selectedTables prop', () => {
      render(<TableMap onTableSelect={mockOnTableSelect} />)
      // Should not crash and should work with default value []
      expect(screen.queryByText(/Selected Tables:/)).not.toBeInTheDocument()
    })

    it('should handle undefined occupiedTables prop', () => {
      render(<TableMap onTableSelect={mockOnTableSelect} />)
      const table1 = screen.getByText('1').closest('button')
      fireEvent.click(table1)
      expect(mockOnTableSelect).toHaveBeenCalledWith(1)
    })

    it('should handle all tables selected', () => {
      const allTables = Array.from({ length: 22 }, (_, i) => i + 1)
      render(<TableMap onTableSelect={mockOnTableSelect} selectedTables={allTables} />)
      expect(screen.getByText(/Selected Tables: 22/)).toBeInTheDocument()
      // Total: 12 tables of 2p (24) + 8 tables of 4p (32) + 2 tables of 6p (12) = 68
      expect(screen.getByText(/Total capacity: 68 guests/)).toBeInTheDocument()
    })

    it('should handle all tables occupied', () => {
      const allTables = Array.from({ length: 22 }, (_, i) => i + 1)
      render(<TableMap onTableSelect={mockOnTableSelect} occupiedTables={allTables} />)

      for (let i = 1; i <= 22; i++) {
        const table = screen.getByText(i.toString()).closest('button')
        expect(table).toBeDisabled()
      }
    })

    it('should handle table that is both selected and occupied (occupied takes precedence)', () => {
      render(<TableMap onTableSelect={mockOnTableSelect} selectedTables={[5]} occupiedTables={[5]} />)
      const table5 = screen.getByText('5').closest('button')
      expect(table5).toHaveClass('bg-red-100')
      expect(table5).toBeDisabled()
    })
  })

  describe('Callback Behavior', () => {
    it('should call onTableSelect with correct table ID', () => {
      // Table 15 is a table for 4, so we need partySize of at least 3 to allow selection
      render(<TableMap onTableSelect={mockOnTableSelect} partySize={4} />)

      const table15 = screen.getByText('15').closest('button')
      fireEvent.click(table15)

      expect(mockOnTableSelect).toHaveBeenCalledTimes(1)
      expect(mockOnTableSelect).toHaveBeenCalledWith(15)
    })

    it('should call onTableSelect multiple times for different tables', () => {
      render(<TableMap onTableSelect={mockOnTableSelect} />)

      const table1 = screen.getByText('1').closest('button')
      const table2 = screen.getByText('2').closest('button')

      fireEvent.click(table1)
      fireEvent.click(table2)

      expect(mockOnTableSelect).toHaveBeenCalledTimes(2)
      expect(mockOnTableSelect).toHaveBeenNthCalledWith(1, 1)
      expect(mockOnTableSelect).toHaveBeenNthCalledWith(2, 2)
    })

    it('should allow clicking on selected tables (for deselection)', () => {
      render(<TableMap onTableSelect={mockOnTableSelect} selectedTables={[6]} />)
      const table6 = screen.getByText('6').closest('button')

      fireEvent.click(table6)
      expect(mockOnTableSelect).toHaveBeenCalledWith(6)
    })
  })
})
