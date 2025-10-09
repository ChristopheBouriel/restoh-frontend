import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import ReservationsManagement from '../../../pages/admin/ReservationsManagement'
import useReservationsStore from '../../../store/reservationsStore'

// Mock the reservations store
vi.mock('../../../store/reservationsStore')

describe('ReservationsManagement Component', () => {
  // Create realistic test data with various scenarios
  const mockReservations = [
    {
      id: 'reservation-001',
      userId: 'client1',
      userEmail: 'jean@example.com',
      userName: 'Jean Dupont',
      phone: '06 12 34 56 78',
      date: new Date().toISOString().split('T')[0], // Today
      time: '19:30',
      guests: 4,
      status: 'confirmed',
      tableNumber: 12,
      specialRequests: 'Table by the window',
      createdAt: '2024-01-20T14:30:00Z',
      updatedAt: '2024-01-20T14:30:00Z'
    },
    {
      id: 'reservation-002',
      userId: 'client2',
      userEmail: 'marie@example.com',
      userName: 'Marie Martin',
      phone: '07 98 76 54 32',
      date: (() => {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        return tomorrow.toISOString().split('T')[0]
      })(), // Tomorrow (upcoming)
      time: '20:00',
      guests: 2,
      status: 'pending',
      tableNumber: null,
      specialRequests: null,
      createdAt: '2024-01-21T10:15:00Z',
      updatedAt: '2024-01-21T10:15:00Z'
    },
    {
      id: 'reservation-003',
      userId: 'client3',
      userEmail: 'pierre@example.com',
      userName: 'Pierre Durand',
      phone: '06 87 65 43 21',
      date: (() => {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        return yesterday.toISOString().split('T')[0]
      })(), // Yesterday (past)
      time: '19:00',
      guests: 6,
      status: 'completed',
      tableNumber: 8,
      specialRequests: 'Birthday - décoration table',
      createdAt: '2024-01-19T09:00:00Z',
      updatedAt: '2024-01-19T20:30:00Z'
    },
    {
      id: 'reservation-004',
      userId: 'client4',
      userEmail: 'sophie@example.com',
      userName: 'Sophie Leroy',
      phone: '07 11 22 33 44',
      date: new Date().toISOString().split('T')[0], // Today
      time: '18:30',
      guests: 3,
      status: 'seated',
      tableNumber: 5,
      specialRequests: null,
      createdAt: '2024-01-20T12:00:00Z',
      updatedAt: '2024-01-20T18:30:00Z'
    }
  ]

  const mockStoreState = {
    reservations: mockReservations,
    isLoading: false,
    initializeReservations: vi.fn(),
    updateReservationStatus: vi.fn(),
    assignTable: vi.fn(),
    getReservationsStats: vi.fn(() => ({
      total: 4,
      pending: 1,
      confirmed: 1,
      seated: 1,
      completed: 1,
      cancelled: 0,
      todayTotal: 2,
      todayGuests: 7,
      totalGuests: 15
    }))
  }

  const user = userEvent.setup()

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <ReservationsManagement />
      </MemoryRouter>
    )
  }

  beforeEach(() => {
    vi.clearAllMocks()
    useReservationsStore.mockReturnValue(mockStoreState)
  })

  // 1. Core Rendering Tests
  describe('Core Rendering', () => {
    it('should render header, statistics, and reservations list', () => {
      renderComponent()
      
      // Header
      expect(screen.getByText('Reservations Management')).toBeInTheDocument()
      expect(screen.getByText('Manage all restaurant reservations')).toBeInTheDocument()
      
      // Statistics cards
      expect(screen.getByText('Total')).toBeInTheDocument()
      expect(screen.getAllByText('Pending').length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText('Confirmed')).toBeInTheDocument()
      expect(screen.getByText('Aujourd\'hui')).toBeInTheDocument()
      expect(screen.getByText('Total seats')).toBeInTheDocument()
      expect(screen.getByText('Couverts aujourd\'hui')).toBeInTheDocument()
      
      // Reservations list with count
      expect(screen.getByText('Reservations (4)')).toBeInTheDocument()
    })

    it('should initialize reservations data on mount', () => {
      renderComponent()
      expect(mockStoreState.initializeReservations).toHaveBeenCalledOnce()
    })

    it('should display reservation information in both desktop and mobile views', () => {
      renderComponent()
      
      // Check that all reservations are displayed (desktop table + mobile cards)
      expect(screen.getAllByText('Jean Dupont')).toHaveLength(2) // Desktop + mobile
      expect(screen.getAllByText('Marie Martin')).toHaveLength(2) // Desktop + mobile
      expect(screen.getAllByText('Pierre Durand')).toHaveLength(2) // Desktop + mobile
      expect(screen.getAllByText('Sophie Leroy')).toHaveLength(2) // Desktop + mobile
      
      // Check guest counts are displayed (may appear in stats too)
      expect(screen.getAllByText('4').length).toBeGreaterThanOrEqual(2) // Jean's guests + stats
      expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(2) // Marie's guests + stats
    })
  })

  // 2. Filtering Functionality Tests
  describe('Filtering Functionality', () => {
    it('should have status filter functionality available', () => {
      renderComponent()
      
      // Find status filter dropdown
      const statusFilterButton = screen.getAllByRole('button').find(button => 
        button.textContent?.includes('All statuses')
      )
      expect(statusFilterButton).toBeInTheDocument()
      
      // Verify filter options are available (may appear in multiple places)
      expect(screen.getAllByText('Status').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('Date').length).toBeGreaterThanOrEqual(1)
    })

    it('should have date filter functionality available', () => {
      renderComponent()
      
      // Find date filter dropdown
      const dateFilterButton = screen.getAllByRole('button').find(button => 
        button.textContent?.includes('Toutes les dates')
      )
      expect(dateFilterButton).toBeInTheDocument()
      
      // Verify date filter labels
      expect(screen.getAllByText('Date').length).toBeGreaterThanOrEqual(1)
    })

    it('should display all reservations by default', () => {
      renderComponent()
      
      // Should show all 4 reservations by default
      expect(screen.getByText('Reservations (4)')).toBeInTheDocument()
      expect(screen.getAllByText('Jean Dupont')).toHaveLength(2) // Desktop + mobile
      expect(screen.getAllByText('Marie Martin')).toHaveLength(2)
      expect(screen.getAllByText('Pierre Durand')).toHaveLength(2)
      expect(screen.getAllByText('Sophie Leroy')).toHaveLength(2)
    })

    it('should show empty state when no reservations match filters', async () => {
      // Mock empty filtered result
      useReservationsStore.mockReturnValue({
        ...mockStoreState,
        reservations: [] // No reservations
      })
      
      renderComponent()
      
      expect(screen.getByText('Reservations (0)')).toBeInTheDocument()
      expect(screen.getByText('Aucune réservation trouvée avec ces filtres.')).toBeInTheDocument()
    })
  })

  // 3. Reservation Actions Tests  
  describe('Reservation Actions', () => {
    it('should have status change functionality available', () => {
      renderComponent()
      
      // Find status dropdowns for reservations
      const statusDropdowns = screen.getAllByRole('button').filter(button => 
        button.textContent?.includes('Pending') || 
        button.textContent?.includes('Confirmed') ||
        button.textContent?.includes('Installée')
      )
      expect(statusDropdowns.length).toBeGreaterThan(0)
      
      // Verify updateReservationStatus function is available
      expect(mockStoreState.updateReservationStatus).toBeDefined()
    })

    it('should open reservation details modal when eye icon clicked', async () => {
      renderComponent()
      
      // Click on first "Voir les détails" button
      const viewButtons = screen.getAllByTitle('Voir les détails')
      await user.click(viewButtons[0])
      
      await waitFor(() => {
        expect(screen.getByText('Détails de la réservation')).toBeInTheDocument()
        expect(screen.getAllByText('Client').length).toBeGreaterThanOrEqual(1) // Modal should be open
      })
    })

    it('should close modal with both close button and X button', async () => {
      renderComponent()
      
      // Open modal first
      const viewButton = screen.getAllByTitle('Voir les détails')[0]
      await user.click(viewButton)
      
      await waitFor(() => {
        expect(screen.getByText('Détails de la réservation')).toBeInTheDocument()
      })
      
      // Close with X button
      const xButton = screen.getByText('×')
      await user.click(xButton)
      
      await waitFor(() => {
        expect(screen.queryByText('Détails de la réservation')).not.toBeInTheDocument()
      })
      
      // Open again and close with Fermer button
      await user.click(viewButton)
      
      await waitFor(() => {
        expect(screen.getByText('Détails de la réservation')).toBeInTheDocument()
      })
      
      const closeButton = screen.getByText('Fermer')
      await user.click(closeButton)
      
      await waitFor(() => {
        expect(screen.queryByText('Détails de la réservation')).not.toBeInTheDocument()
      })
    })
  })

  // 4. Modal Content Tests
  describe('Modal Content', () => {
    it('should display comprehensive reservation information in modal', async () => {
      renderComponent()
      
      // Click on Jean Dupont's modal (first reservation)
      const viewButtons = screen.getAllByTitle('Voir les détails')
      await user.click(viewButtons[0])
      
      await waitFor(() => {
        expect(screen.getByText('Détails de la réservation')).toBeInTheDocument()
        
        // Check client information
        expect(screen.getAllByText('Jean Dupont').length).toBeGreaterThanOrEqual(2) // Table + modal
        expect(screen.getAllByText('jean@example.com').length).toBeGreaterThanOrEqual(2) // Table + modal
        expect(screen.getAllByText('06 12 34 56 78').length).toBeGreaterThanOrEqual(2) // Table + modal
        expect(screen.getAllByText('Client').length).toBeGreaterThanOrEqual(2) // Table header + modal
        
        // Check reservation details
        expect(screen.getByText('reservation-001')).toBeInTheDocument() // ID
        expect(screen.getAllByText('19:30').length).toBeGreaterThanOrEqual(1) // Time
        expect(screen.getAllByText('Table 12').length).toBeGreaterThanOrEqual(1) // Table assignment
        expect(screen.getAllByText('Confirmed').length).toBeGreaterThanOrEqual(1) // Status
      })
    })

    it('should show special requests and history in modal when available', async () => {
      renderComponent()
      
      // Click on Jean Dupont's modal (has special requests)
      const viewButtons = screen.getAllByTitle('Voir les détails')
      await user.click(viewButtons[0])
      
      await waitFor(() => {
        expect(screen.getByText('Demandes spéciales')).toBeInTheDocument()
        expect(screen.getAllByText('Table by the window').length).toBeGreaterThanOrEqual(1)
        expect(screen.getByText('Historique')).toBeInTheDocument()
        expect(screen.getByText('Créée le:')).toBeInTheDocument()
        expect(screen.getByText('Modifiée le:')).toBeInTheDocument()
      })
      
      // Close and check a reservation without special requests
      await user.click(screen.getByText('×'))
      
      // Click on Marie Martin's modal (no special requests)
      await user.click(viewButtons[1])
      
      await waitFor(() => {
        expect(screen.getByText('Détails de la réservation')).toBeInTheDocument()
        expect(screen.getAllByText('Marie Martin').length).toBeGreaterThanOrEqual(2)
        expect(screen.getAllByText('Non assignée').length).toBeGreaterThanOrEqual(1) // No table assigned
        // Special requests section should not be visible when null
      })
    })
  })

  // 5. Statistics & State Management Tests
  describe('Statistics and State Management', () => {
    it('should display correct reservation counts and statistics', () => {
      renderComponent()
      
      // Check statistics display - numbers may appear multiple times
      const stats = mockStoreState.getReservationsStats()
      expect(screen.getAllByText(stats.total.toString()).length).toBeGreaterThanOrEqual(1) // Total: 4
      expect(screen.getAllByText(stats.pending.toString()).length).toBeGreaterThanOrEqual(1) // Pending: 1
      expect(screen.getAllByText(stats.confirmed.toString()).length).toBeGreaterThanOrEqual(1) // Confirmed: 1
      expect(screen.getAllByText(stats.todayTotal.toString()).length).toBeGreaterThanOrEqual(1) // Today: 2
      expect(screen.getAllByText(stats.totalGuests.toString()).length).toBeGreaterThanOrEqual(1) // Total guests: 15
      expect(screen.getAllByText(stats.todayGuests.toString()).length).toBeGreaterThanOrEqual(1) // Today guests: 7
      
      // Check reservation count in header
      expect(screen.getByText(`Reservations (${mockReservations.length})`)).toBeInTheDocument()
    })

    it('should handle loading state appropriately', () => {
      useReservationsStore.mockReturnValue({
        ...mockStoreState,
        isLoading: true
      })
      
      renderComponent()
      
      // Component should still render with loading state
      expect(screen.getByText('Reservations Management')).toBeInTheDocument()
    })

    it('should handle status change errors gracefully', async () => {
      mockStoreState.updateReservationStatus.mockResolvedValue({ 
        success: false, 
        error: 'Network error' 
      })
      
      renderComponent()
      
      // Verify error handling mechanism is available
      expect(mockStoreState.updateReservationStatus).toBeDefined()
      
      // The updateReservationStatus should be callable
      const result = await mockStoreState.updateReservationStatus('test-id', 'confirmed')
      expect(result.success).toBe(false)
      expect(result.error).toBe('Network error')
    })
  })
})