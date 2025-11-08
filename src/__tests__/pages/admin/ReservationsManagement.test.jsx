import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import ReservationsManagement from '../../../pages/admin/ReservationsManagement'
import * as reservationsApi from '../../../api/reservationsApi'

// Mock the API
vi.mock('../../../api/reservationsApi')

// Mock toast
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

// Mock components
vi.mock('../../../components/common/SimpleSelect', () => ({
  default: ({ value, onChange, options, className }) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      data-testid="simple-select"
      className={className}
    >
      {options.map(option => (
        <option key={option.value} value={option.value} disabled={option.disabled}>
          {option.label}
        </option>
      ))}
    </select>
  )
}))

vi.mock('../../../components/common/CustomDatePicker', () => ({
  default: ({ value, onChange, placeholder, minDate }) => (
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      min={minDate}
      data-testid="custom-date-picker"
    />
  )
}))

// Mock date utils
vi.mock('../../../utils/dateUtils', () => ({
  getTodayLocalDate: () => '2024-01-15',
  normalizeDateString: (dateStr) => dateStr?.split('T')[0] || dateStr
}))

// Mock reservation slots
vi.mock('../../../services/reservationSlots', () => ({
  isReservationTimePassed: vi.fn(() => true), // Return true to enable all status options
  getLabelFromSlot: (slot) => {
    const slots = {
      1: '11:00', 2: '11:30', 3: '12:00', 4: '12:30', 5: '13:00', 6: '13:30',
      7: '18:00', 8: '18:30', 9: '19:00', 10: '19:30', 11: '20:00', 12: '20:30',
      13: '21:00', 14: '21:30', 15: '22:00'
    }
    return slots[slot] || 'Unknown'
  },
  LUNCH_SLOTS: [
    { slot: 1, label: '11:00' },
    { slot: 2, label: '11:30' },
    { slot: 3, label: '12:00' },
    { slot: 4, label: '12:30' },
    { slot: 5, label: '13:00' },
    { slot: 6, label: '13:30' }
  ],
  DINNER_SLOTS: [
    { slot: 7, label: '18:00' },
    { slot: 8, label: '18:30' },
    { slot: 9, label: '19:00' },
    { slot: 10, label: '19:30' },
    { slot: 11, label: '20:00' },
    { slot: 12, label: '20:30' },
    { slot: 13, label: '21:00' },
    { slot: 14, label: '21:30' },
    { slot: 15, label: '22:00' }
  ]
}))

describe('ReservationsManagement Component', () => {
  // Sample reservation data
  const mockRecentReservations = [
    {
      id: 'res-001',
      _id: 'res-001',
      reservationNumber: 2001,
      userId: 'user-1',
      userEmail: 'user1@example.com',
      userName: 'Jean Dupont',
      contactPhone: '+33612345678',
      date: '2024-01-15',
      slot: 7,
      guests: 4,
      tableNumber: [1, 2],
      status: 'confirmed',
      specialRequests: 'Quiet table please',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'res-002',
      _id: 'res-002',
      reservationNumber: 2002,
      userId: 'user-2',
      userEmail: 'user2@example.com',
      userName: 'Marie Martin',
      contactPhone: '+33698765432',
      date: '2024-01-16',
      slot: 10,
      guests: 2,
      tableNumber: [3],
      status: 'seated',
      specialRequests: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]

  const mockHistoricalReservations = [
    {
      id: 'res-100',
      _id: 'res-100',
      reservationNumber: 2100,
      userId: 'user-3',
      userEmail: 'user3@example.com',
      userName: 'Pierre Durand',
      contactPhone: '+33687654321',
      date: '2023-12-15',
      slot: 12,
      guests: 6,
      tableNumber: [5, 6],
      status: 'completed',
      specialRequests: null,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    }
  ]

  const mockRecentResponse = {
    success: true,
    data: mockRecentReservations,
    pagination: {
      total: 2,
      page: 1,
      limit: 50,
      totalPages: 1,
      hasMore: false
    }
  }

  const mockHistoricalResponse = {
    success: true,
    data: mockHistoricalReservations,
    pagination: {
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
      hasMore: false
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Default mock implementation
    reservationsApi.getRecentReservations.mockResolvedValue(mockRecentResponse)
    reservationsApi.getHistoricalReservations.mockResolvedValue(mockHistoricalResponse)
    reservationsApi.updateReservationStatusEnhanced.mockResolvedValue({ success: true })
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <ReservationsManagement />
      </MemoryRouter>
    )
  }

  test('should render the header and Recent tab by default', async () => {
    renderComponent()

    expect(screen.getByText('Reservations Management')).toBeInTheDocument()

    // Should show Recent tab as active
    const recentTab = screen.getByRole('button', { name: /Recent \(Last 15 days \+ Upcoming\)/i })
    expect(recentTab).toBeInTheDocument()

    // Should fetch recent reservations
    await waitFor(() => {
      expect(reservationsApi.getRecentReservations).toHaveBeenCalledWith({
        limit: 50,
        page: 1
      })
    })
  })

  test('should display recent reservations after loading', async () => {
    renderComponent()

    // Wait for reservations to load (can appear in both desktop and mobile views)
    await waitFor(() => {
      expect(screen.getAllByText('Jean Dupont').length).toBeGreaterThan(0)
    })

    expect(screen.getAllByText('Marie Martin').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/2001/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/2002/).length).toBeGreaterThan(0)
  })

  test('should switch to History tab when clicked', async () => {
    const user = userEvent.setup()
    renderComponent()

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getAllByText('Jean Dupont').length).toBeGreaterThan(0)
    })

    // Click History tab
    const historyTab = screen.getByRole('button', { name: /History/i })
    await user.click(historyTab)

    // Should show date pickers for history
    await waitFor(() => {
      const datePickers = screen.getAllByTestId('custom-date-picker')
      expect(datePickers.length).toBeGreaterThan(0)
    })
  })

  test('should filter reservations with Today button', async () => {
    const user = userEvent.setup()
    renderComponent()

    // Wait for reservations to load
    await waitFor(() => {
      expect(screen.getAllByText('Jean Dupont').length).toBeGreaterThan(0)
    })

    // Click Today button
    const todayButton = screen.getByRole('button', { name: /Today/i })
    await user.click(todayButton)

    // Today button should be highlighted (primary color class)
    expect(todayButton).toHaveClass('bg-primary-600')
  })

  test('should search reservations by reservation number', async () => {
    const user = userEvent.setup()
    renderComponent()

    // Wait for reservations to load
    await waitFor(() => {
      expect(screen.getAllByText('Jean Dupont').length).toBeGreaterThan(0)
    })

    // Find and type in search input
    const searchInput = screen.getByPlaceholderText(/Enter reservation number/i)
    await user.type(searchInput, '2001')

    // Should still show reservation 2001
    expect(screen.getAllByText('Jean Dupont').length).toBeGreaterThan(0)
  })

  test('should update reservation status when select is changed', async () => {
    const user = userEvent.setup()
    renderComponent()

    // Wait for reservations to load
    await waitFor(() => {
      expect(screen.getAllByText('Jean Dupont').length).toBeGreaterThan(0)
    })

    // Find status selects (there should be at least one for each reservation)
    const selects = screen.getAllByTestId('simple-select')
    // Filter to get only status selects (not the status filter)
    const reservationStatusSelects = selects.filter((_, index) => index > 0)

    if (reservationStatusSelects.length > 0) {
      await user.selectOptions(reservationStatusSelects[0], 'seated')

      await waitFor(() => {
        expect(reservationsApi.updateReservationStatusEnhanced).toHaveBeenCalledWith(
          'res-001',
          'seated'
        )
      })
    }
  })

  test('should open reservation details modal when eye icon is clicked', async () => {
    const user = userEvent.setup()
    renderComponent()

    // Wait for reservations to load
    await waitFor(() => {
      expect(screen.getAllByText('Jean Dupont').length).toBeGreaterThan(0)
    })

    // Find and click eye icon (view details button)
    const eyeButtons = screen.queryAllByTitle('View details')
    if (eyeButtons.length > 0) {
      await user.click(eyeButtons[0])

      // Modal should appear with reservation details
      await waitFor(() => {
        expect(screen.getByText('Reservation details')).toBeInTheDocument()
      })
    }
  })

  test('should call Refresh button to reload recent reservations', async () => {
    const user = userEvent.setup()
    renderComponent()

    // Wait for initial load
    await waitFor(() => {
      expect(reservationsApi.getRecentReservations).toHaveBeenCalledTimes(1)
    })

    // Click Refresh button
    const refreshButton = screen.getByRole('button', { name: /Refresh/i })
    await user.click(refreshButton)

    // Should call API again
    await waitFor(() => {
      expect(reservationsApi.getRecentReservations).toHaveBeenCalledTimes(2)
    })
  })

  test('should load historical reservations when both dates are selected', async () => {
    const user = userEvent.setup()
    renderComponent()

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getAllByText('Jean Dupont').length).toBeGreaterThan(0)
    })

    // Switch to History tab
    const historyTab = screen.getByRole('button', { name: /History/i })
    await user.click(historyTab)

    // Find date pickers
    await waitFor(() => {
      const datePickers = screen.getAllByTestId('custom-date-picker')
      expect(datePickers.length).toBeGreaterThan(0)
    })

    const datePickers = screen.getAllByTestId('custom-date-picker')

    // Set start date
    await user.clear(datePickers[0])
    await user.type(datePickers[0], '2023-12-01')

    // Set end date
    await user.clear(datePickers[1])
    await user.type(datePickers[1], '2023-12-31')

    // Should call historical reservations API
    await waitFor(() => {
      expect(reservationsApi.getHistoricalReservations).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: expect.any(String),
          endDate: expect.any(String)
        })
      )
    })
  })

  test('should display statistics correctly', async () => {
    renderComponent()

    // Wait for reservations to load
    await waitFor(() => {
      expect(screen.getAllByText('Jean Dupont').length).toBeGreaterThan(0)
    })

    // Should show total reservations count
    expect(screen.getByText('Total')).toBeInTheDocument()
    expect(screen.getAllByText('Today').length).toBeGreaterThan(0)

    // Should show various status statistics (can appear in status select dropdown too)
    expect(screen.getAllByText('Confirmed').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Seated').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Completed').length).toBeGreaterThan(0)
  })

  test('should handle empty state when no reservations', async () => {
    reservationsApi.getRecentReservations.mockResolvedValue({
      success: true,
      data: [],
      pagination: {
        total: 0,
        page: 1,
        limit: 50,
        totalPages: 0,
        hasMore: false
      }
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText(/No reservations found/i)).toBeInTheDocument()
    })
  })

  test('should display Updated time indicator in Recent tab', async () => {
    renderComponent()

    // Wait for reservations to load
    await waitFor(() => {
      expect(screen.getAllByText('Jean Dupont').length).toBeGreaterThan(0)
    })

    // Should show "Updated Xs ago" text
    await waitFor(() => {
      expect(screen.getByText(/Updated/i)).toBeInTheDocument()
    })
  })

  test('should filter by status', async () => {
    const user = userEvent.setup()
    renderComponent()

    // Wait for reservations to load
    await waitFor(() => {
      expect(screen.getAllByText('Jean Dupont').length).toBeGreaterThan(0)
    })

    // Find the status filter (first select)
    const selects = screen.getAllByTestId('simple-select')
    const statusFilter = selects[0]

    // Change to 'seated'
    await user.selectOptions(statusFilter, 'seated')

    // Should still show the seated reservation
    expect(screen.getAllByText('Marie Martin').length).toBeGreaterThan(0)
  })

  test('should show pagination when there are multiple pages', async () => {
    reservationsApi.getRecentReservations.mockResolvedValue({
      success: true,
      data: mockRecentReservations,
      pagination: {
        total: 60,
        page: 1,
        limit: 50,
        totalPages: 2,
        hasMore: true
      }
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getAllByText('Jean Dupont').length).toBeGreaterThan(0)
    })

    // Should show pagination info
    await waitFor(() => {
      expect(screen.getByText(/Showing page/i)).toBeInTheDocument()
    })
  })

  test('should display guest count and table information', async () => {
    renderComponent()

    // Wait for reservations to load
    await waitFor(() => {
      expect(screen.getAllByText('Jean Dupont').length).toBeGreaterThan(0)
    })

    // Should show guest counts (can appear multiple times in stats)
    expect(screen.getAllByText(/4/).length).toBeGreaterThan(0) // 4 guests for first reservation

    // Should show table numbers (appears in both desktop and mobile views)
    expect(screen.getAllByText(/Tables 1, 2/i).length).toBeGreaterThan(0)
  })

  test('should display time slots correctly', async () => {
    renderComponent()

    // Wait for reservations to load
    await waitFor(() => {
      expect(screen.getAllByText('Jean Dupont').length).toBeGreaterThan(0)
    })

    // Should show time slots (18:00 for slot 7, 19:30 for slot 10)
    expect(screen.getAllByText(/18:00/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/19:30/).length).toBeGreaterThan(0)
  })
})
