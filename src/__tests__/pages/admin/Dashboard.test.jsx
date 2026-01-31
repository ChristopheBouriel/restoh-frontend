import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import '@testing-library/jest-dom'
import Dashboard from '../../../pages/admin/Dashboard'
import useOrdersStore from '../../../store/ordersStore'
import useReservationsStore from '../../../store/reservationsStore'
import useStatsStore from '../../../store/statsStore'

// Mock the stores
vi.mock('../../../store/ordersStore')
vi.mock('../../../store/reservationsStore')
vi.mock('../../../store/statsStore')

// Mock OrderService
vi.mock('../../../services/orders', () => ({
  OrderService: {
    getRecentOrders: vi.fn((orders, limit) => {
      return [...orders]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, limit)
    }),
    getStatusDisplayInfo: vi.fn((status) => {
      const statusMap = {
        pending: { label: 'Pending', color: 'yellow' },
        confirmed: { label: 'Confirmed', color: 'blue' },
        preparing: { label: 'Preparing', color: 'purple' },
        ready: { label: 'Ready', color: 'green' },
        delivered: { label: 'Delivered', color: 'gray' },
        cancelled: { label: 'Cancelled', color: 'red' }
      }
      return statusMap[status] || { label: 'Unknown', color: 'gray' }
    })
  }
}))

// Mock utils
vi.mock('../../../utils/reservationSlots', () => ({
  getLabelFromSlot: vi.fn((slot) => {
    const slotMap = {
      'lunch-12': '12:00',
      'lunch-13': '13:00',
      'dinner-19': '19:00',
      'dinner-20': '20:00'
    }
    return slotMap[slot] || slot
  })
}))

vi.mock('../../../utils/pluralize', () => ({
  pluralize: vi.fn((count, word) => `${count} ${word}${count !== 1 ? 's' : ''}`)
}))

describe('Dashboard Component', () => {
  // Mock the current date to mid-month to avoid end-of-month edge cases
  // This ensures tests always have future dates available within the month
  const MOCK_DATE = new Date('2026-01-15T12:00:00.000Z')

  beforeAll(() => {
    vi.useFakeTimers()
    vi.setSystemTime(MOCK_DATE)
  })

  afterAll(() => {
    vi.useRealTimers()
  })

  // Mock API stats data
  const mockApiStats = {
    quickStats: {
      todayRevenue: 125.00,
      todayOrders: 5,
      todayReservations: 3,
      totalActiveUsers: 150
    },
    totalMenuItems: 15,
    activeMenuItems: 12,
    inactiveMenuItems: 3,
    orders: {
      thisMonth: { total: 45, revenue: 1250.00, pickup: 30, delivery: 15 },
      lastMonth: { total: 52, revenue: 1480.00, pickup: 35, delivery: 17 },
      today: { total: 5, revenue: 125.00, pickup: 3, delivery: 2 },
      sameDayLastWeek: { total: 4, revenue: 110.00, pickup: 2, delivery: 2 }
    },
    reservations: {
      thisMonth: { total: 28, totalGuests: 84 },
      lastMonth: { total: 32, totalGuests: 96 },
      today: { total: 3, totalGuests: 10 },
      sameDayLastWeek: { total: 2, totalGuests: 6 }
    },
    revenue: {
      thisMonth: 1250.00,
      lastMonth: 1480.00,
      today: 125.00,
      sameDayLastWeek: 110.00
    }
  }

  // Mock orders data (using fixed dates matching MOCK_DATE)
  const mockOrders = [
    {
      id: 'order-001',
      orderNumber: 1001,
      userEmail: 'user1@example.com',
      items: [
        { name: 'Pizza', price: 15.90, quantity: 2 }
      ],
      totalPrice: 31.80,
      status: 'preparing',
      createdAt: '2026-01-15T12:00:00.000Z'
    },
    {
      id: 'order-002',
      orderNumber: 1002,
      userEmail: 'user2@example.com',
      items: [
        { name: 'Burger', price: 18.00, quantity: 1 }
      ],
      totalPrice: 18.00,
      status: 'confirmed',
      createdAt: '2026-01-15T11:59:00.000Z'
    }
  ]

  // Mock reservations data (future dates for upcoming calculation)
  // Use fixed dates that match MOCK_DATE (2026-01-15) to avoid end-of-month edge cases
  const futureDateStr = '2026-01-17' // 2 days after mock date, within same month

  const mockReservations = [
    {
      id: 'res-001',
      reservationNumber: 'R1001',
      userEmail: 'guest1@example.com',
      date: futureDateStr,
      slot: 'dinner-19',
      guests: 4,
      status: 'confirmed',
      tableNumber: [1, 2],
      createdAt: '2026-01-15T10:00:00.000Z'
    },
    {
      id: 'res-002',
      reservationNumber: 'R1002',
      userEmail: 'guest2@example.com',
      date: futureDateStr,
      slot: 'lunch-12',
      guests: 2,
      status: 'confirmed',
      tableNumber: 3,
      createdAt: '2026-01-15T09:00:00.000Z'
    }
  ]

  const mockFetchStats = vi.fn()

  const renderDashboard = () => {
    return render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Default store mocks
    useOrdersStore.mockReturnValue({ orders: mockOrders })
    useReservationsStore.mockReturnValue({ reservations: mockReservations })
    useStatsStore.mockReturnValue({
      stats: mockApiStats,
      fetchStats: mockFetchStats
    })
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  // 1. HEADER
  describe('Header', () => {
    test('should display dashboard title', () => {
      renderDashboard()

      expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
      expect(screen.getByText('Overview of your restaurant')).toBeInTheDocument()
    })
  })

  // 2. LOADING STATE
  describe('Loading State', () => {
    test('should call fetchStats on mount', () => {
      renderDashboard()

      expect(mockFetchStats).toHaveBeenCalledTimes(1)
    })
  })

  // 3. QUICK STATS (TOP ROW)
  describe('Quick Stats Cards', () => {
    test('should display Today\'s Revenue card', () => {
      renderDashboard()

      expect(screen.getByText("Today's Revenue")).toBeInTheDocument()
      expect(screen.getByText('€125.00')).toBeInTheDocument()
      expect(screen.getByText('€1,250 this month')).toBeInTheDocument()
    })

    test('should display Orders Today card', () => {
      renderDashboard()

      expect(screen.getByText('Orders Today')).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument()
      expect(screen.getByText('45 this month')).toBeInTheDocument()
    })

    test('should display Reservations Today card', () => {
      renderDashboard()

      expect(screen.getByText('Reservations Today')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
      expect(screen.getByText('28 this month')).toBeInTheDocument()
    })

    test('should display Total Active Users card', () => {
      renderDashboard()

      expect(screen.getByText('Total Active Users')).toBeInTheDocument()
      expect(screen.getByText('150')).toBeInTheDocument()
    })

    test('should display positive percentage change for revenue', () => {
      renderDashboard()

      // Revenue: 125 vs 110 = +13.6%
      const revenueSection = screen.getByText("Today's Revenue").closest('.bg-white')
      expect(within(revenueSection).getByText('vs last week')).toBeInTheDocument()
      expect(within(revenueSection).getByText(/\+.*%/)).toBeInTheDocument()
    })

    test('should display negative percentage change when current is lower', () => {
      const statsWithDecrease = {
        ...mockApiStats,
        revenue: {
          ...mockApiStats.revenue,
          today: 80.00,
          sameDayLastWeek: 110.00
        }
      }

      useStatsStore.mockReturnValue({
        stats: statsWithDecrease,
        fetchStats: mockFetchStats
      })

      renderDashboard()

      // Revenue: 80 vs 110 = -27.3%
      const revenueSection = screen.getByText("Today's Revenue").closest('.bg-white')
      expect(within(revenueSection).getByText(/-.*%/)).toBeInTheDocument()
    })
  })

  // 4. MONTHLY OVERVIEW
  describe('Monthly Overview Section', () => {
    test('should display Monthly Overview heading', () => {
      renderDashboard()

      expect(screen.getByText('Monthly Overview')).toBeInTheDocument()
    })

    test('should display Monthly Revenue card', () => {
      renderDashboard()

      expect(screen.getByText('Monthly Revenue')).toBeInTheDocument()
      expect(screen.getByText('€1,250')).toBeInTheDocument()
      expect(screen.getByText('€1,480 last month')).toBeInTheDocument()
    })

    test('should display Monthly Orders card with pickup/delivery breakdown', () => {
      renderDashboard()

      expect(screen.getByText('Monthly Orders')).toBeInTheDocument()
      expect(screen.getByText('Pickup')).toBeInTheDocument()
      expect(screen.getByText('Delivery')).toBeInTheDocument()

      // Check pickup and delivery values within the Monthly Orders card
      const monthlyOrdersCard = screen.getByText('Monthly Orders').closest('.bg-white')
      expect(within(monthlyOrdersCard).getByText('30')).toBeInTheDocument()
      // 15 appears twice (delivery and totalMenuItems), so check within card
      const deliverySection = screen.getByText('Delivery').closest('.flex')
      expect(within(deliverySection).getByText('15')).toBeInTheDocument()
    })

    test('should display Monthly Reservations card', () => {
      renderDashboard()

      expect(screen.getByText('Monthly Reservations')).toBeInTheDocument()
      expect(screen.getByText('32 last month')).toBeInTheDocument()
    })

    test('should display Monthly Guests card', () => {
      renderDashboard()

      expect(screen.getByText('Monthly Guests')).toBeInTheDocument()
      expect(screen.getByText('84')).toBeInTheDocument()
      expect(screen.getByText('96 last month')).toBeInTheDocument()
    })

    test('should display Upcoming Reservations card', () => {
      renderDashboard()

      expect(screen.getByText('Upcoming Reservations')).toBeInTheDocument()
      expect(screen.getByText(/guests until end of month/)).toBeInTheDocument()
    })

    test('should display Menu Items card with active/inactive breakdown', () => {
      renderDashboard()

      expect(screen.getByText('Menu Items')).toBeInTheDocument()
      expect(screen.getByText('12 active')).toBeInTheDocument()
      expect(screen.getByText('3 inactive')).toBeInTheDocument()
    })

    test('should display monthly revenue percentage change', () => {
      renderDashboard()

      // 1250 vs 1480 = -15.5%
      const monthlyRevenueSection = screen.getByText('Monthly Revenue').closest('.bg-white')
      expect(within(monthlyRevenueSection).getByText('vs last month')).toBeInTheDocument()
    })
  })

  // 5. UPCOMING RESERVATIONS CALCULATION
  describe('Upcoming Reservations Calculation', () => {
    test('should calculate upcoming reservations from local store', () => {
      renderDashboard()

      // Both mock reservations are in the future and confirmed
      expect(screen.getByText('Upcoming Reservations')).toBeInTheDocument()
      // 4 + 2 = 6 guests
      expect(screen.getByText('6 guests until end of month')).toBeInTheDocument()
    })

    test('should exclude cancelled reservations from upcoming count', () => {
      const reservationsWithCancelled = [
        ...mockReservations,
        {
          id: 'res-cancelled',
          date: futureDateStr,
          guests: 10,
          status: 'cancelled',
          createdAt: '2026-01-15T08:00:00.000Z'
        }
      ]

      useReservationsStore.mockReturnValue({ reservations: reservationsWithCancelled })

      renderDashboard()

      // Cancelled reservation should not be counted
      expect(screen.getByText('6 guests until end of month')).toBeInTheDocument()
    })

    test('should exclude completed reservations from upcoming count', () => {
      const reservationsWithCompleted = [
        ...mockReservations,
        {
          id: 'res-completed',
          date: futureDateStr,
          guests: 8,
          status: 'completed',
          createdAt: '2026-01-15T08:00:00.000Z'
        }
      ]

      useReservationsStore.mockReturnValue({ reservations: reservationsWithCompleted })

      renderDashboard()

      // Completed reservation should not be counted
      expect(screen.getByText('6 guests until end of month')).toBeInTheDocument()
    })

    test('should show 0 upcoming reservations when none exist', () => {
      useReservationsStore.mockReturnValue({ reservations: [] })

      renderDashboard()

      expect(screen.getByText('0 guests until end of month')).toBeInTheDocument()
    })
  })

  // 6. RECENT ORDERS
  describe('Recent Orders Section', () => {
    test('should display Recent Orders heading', () => {
      renderDashboard()

      expect(screen.getByRole('heading', { name: 'Recent Orders' })).toBeInTheDocument()
    })

    test('should display View all link for orders', () => {
      renderDashboard()

      const viewAllLinks = screen.getAllByText('View all')
      const ordersViewAll = viewAllLinks[0]
      expect(ordersViewAll.closest('a')).toHaveAttribute('href', '/admin/orders')
    })

    test('should display recent orders list', () => {
      renderDashboard()

      expect(screen.getByText('#1001')).toBeInTheDocument()
      expect(screen.getByText('#1002')).toBeInTheDocument()
      expect(screen.getByText('user1@example.com')).toBeInTheDocument()
      expect(screen.getByText('user2@example.com')).toBeInTheDocument()
    })

    test('should display order total price', () => {
      renderDashboard()

      expect(screen.getByText('€31.80')).toBeInTheDocument()
      expect(screen.getByText('€18.00')).toBeInTheDocument()
    })

    test('should display order item count', () => {
      renderDashboard()

      // Both orders have 1 item each, so we expect two "1 item" texts
      const itemCounts = screen.getAllByText('1 item')
      expect(itemCounts.length).toBe(2)
    })

    test('should display order status badge', () => {
      renderDashboard()

      expect(screen.getByText('Preparing')).toBeInTheDocument()
      // Confirmed appears for both orders and reservations, use getAllByText
      const confirmedBadges = screen.getAllByText('Confirmed')
      expect(confirmedBadges.length).toBeGreaterThan(0)
    })

    test('should link orders to detail view', () => {
      renderDashboard()

      const order1Link = screen.getByText('#1001').closest('a')
      expect(order1Link).toHaveAttribute('href', '/admin/orders?orderId=order-001')
    })

    test('should display empty state when no orders', () => {
      useOrdersStore.mockReturnValue({ orders: [] })

      renderDashboard()

      expect(screen.getByText('No recent orders')).toBeInTheDocument()
    })

    test('should display Guest when userEmail is missing', () => {
      const ordersWithGuest = [{
        ...mockOrders[0],
        userEmail: null
      }]

      useOrdersStore.mockReturnValue({ orders: ordersWithGuest })

      renderDashboard()

      expect(screen.getByText('Guest')).toBeInTheDocument()
    })
  })

  // 7. RECENT RESERVATIONS
  describe('Recent Reservations Section', () => {
    test('should display Recent Reservations heading', () => {
      renderDashboard()

      expect(screen.getByRole('heading', { name: 'Recent Reservations' })).toBeInTheDocument()
    })

    test('should display View all link for reservations', () => {
      renderDashboard()

      const viewAllLinks = screen.getAllByText('View all')
      const reservationsViewAll = viewAllLinks[1]
      expect(reservationsViewAll.closest('a')).toHaveAttribute('href', '/admin/reservations')
    })

    test('should display recent reservations list', () => {
      renderDashboard()

      expect(screen.getByText('#R1001')).toBeInTheDocument()
      expect(screen.getByText('#R1002')).toBeInTheDocument()
      expect(screen.getByText('guest1@example.com')).toBeInTheDocument()
      expect(screen.getByText('guest2@example.com')).toBeInTheDocument()
    })

    test('should display guest count', () => {
      renderDashboard()

      expect(screen.getByText('4 guests')).toBeInTheDocument()
      expect(screen.getByText('2 guests')).toBeInTheDocument()
    })

    test('should display reservation status badge', () => {
      renderDashboard()

      const confirmedBadges = screen.getAllByText('Confirmed')
      expect(confirmedBadges.length).toBeGreaterThan(0)
    })

    test('should display table numbers (array format)', () => {
      renderDashboard()

      expect(screen.getByText('Tables 1, 2')).toBeInTheDocument()
    })

    test('should display table number (single value)', () => {
      renderDashboard()

      expect(screen.getByText('Table 3')).toBeInTheDocument()
    })

    test('should link reservations to detail view', () => {
      renderDashboard()

      const res1Link = screen.getByText('#R1001').closest('a')
      expect(res1Link).toHaveAttribute('href', '/admin/reservations?reservationId=res-001')
    })

    test('should display empty state when no reservations', () => {
      useReservationsStore.mockReturnValue({ reservations: [] })

      renderDashboard()

      expect(screen.getByText('No recent reservations')).toBeInTheDocument()
    })

    test('should display Table TBD when tableNumber is missing', () => {
      const reservationsWithoutTable = [{
        ...mockReservations[0],
        tableNumber: null
      }]

      useReservationsStore.mockReturnValue({ reservations: reservationsWithoutTable })

      renderDashboard()

      expect(screen.getByText('Table TBD')).toBeInTheDocument()
    })

    test('should display time slot label', () => {
      renderDashboard()

      expect(screen.getByText(/19:00/)).toBeInTheDocument()
      expect(screen.getByText(/12:00/)).toBeInTheDocument()
    })
  })

  // 8. RESERVATION STATUS DISPLAY
  describe('Reservation Status Display', () => {
    test('should display Confirmed status badge', () => {
      const reservationsWithStatus = [{
        ...mockReservations[0],
        status: 'confirmed'
      }]

      useReservationsStore.mockReturnValue({ reservations: reservationsWithStatus })

      renderDashboard()

      // Confirmed appears multiple times (orders + reservations), use getAllByText
      const confirmedBadges = screen.getAllByText('Confirmed')
      expect(confirmedBadges.length).toBeGreaterThan(0)
    })

    test('should display Seated status badge', () => {
      const reservationsWithStatus = [{
        ...mockReservations[0],
        status: 'seated'
      }]

      useReservationsStore.mockReturnValue({ reservations: reservationsWithStatus })

      renderDashboard()

      expect(screen.getByText('Seated')).toBeInTheDocument()
    })

    test('should display Completed status badge for reservation', () => {
      // Use past date so it doesn't affect upcoming count
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 5)

      const reservationsWithStatus = [{
        ...mockReservations[0],
        date: pastDate.toISOString().split('T')[0],
        status: 'completed'
      }]

      useReservationsStore.mockReturnValue({ reservations: reservationsWithStatus })

      renderDashboard()

      // Find within the Recent Reservations section
      const recentReservationsSection = screen.getByRole('heading', { name: 'Recent Reservations' }).closest('.bg-white')
      expect(within(recentReservationsSection).getByText('Completed')).toBeInTheDocument()
    })

    test('should display Cancelled status badge for reservation', () => {
      const reservationsWithStatus = [{
        ...mockReservations[0],
        status: 'cancelled'
      }]

      useReservationsStore.mockReturnValue({ reservations: reservationsWithStatus })

      renderDashboard()

      // Find within the Recent Reservations section
      const recentReservationsSection = screen.getByRole('heading', { name: 'Recent Reservations' }).closest('.bg-white')
      expect(within(recentReservationsSection).getByText('Cancelled')).toBeInTheDocument()
    })

    test('should display No-show status badge', () => {
      const reservationsWithStatus = [{
        ...mockReservations[0],
        status: 'no-show'
      }]

      useReservationsStore.mockReturnValue({ reservations: reservationsWithStatus })

      renderDashboard()

      expect(screen.getByText('No-show')).toBeInTheDocument()
    })
  })

  // 9. EDGE CASES
  describe('Edge Cases', () => {
    test('should handle missing order.orderNumber by using id', () => {
      const ordersWithoutNumber = [{
        ...mockOrders[0],
        orderNumber: undefined,
        id: 'test-order-id'
      }]

      useOrdersStore.mockReturnValue({ orders: ordersWithoutNumber })

      renderDashboard()

      expect(screen.getByText('#test-order-id')).toBeInTheDocument()
    })

    test('should handle reservation without reservationNumber', () => {
      const reservationsWithoutNumber = [{
        ...mockReservations[0],
        reservationNumber: undefined,
        id: 'abcdef12-test-id'
      }]

      useReservationsStore.mockReturnValue({ reservations: reservationsWithoutNumber })

      renderDashboard()

      // Should use last 8 chars of id
      expect(screen.getByText('#-test-id')).toBeInTheDocument()
    })

    test('should handle zero values in stats', () => {
      const zeroStats = {
        quickStats: {
          todayRevenue: 0,
          todayOrders: 0,
          todayReservations: 0,
          totalActiveUsers: 0
        },
        totalMenuItems: 0,
        activeMenuItems: 0,
        inactiveMenuItems: 0,
        orders: {
          thisMonth: { total: 0, revenue: 0, pickup: 0, delivery: 0 },
          lastMonth: { total: 0, revenue: 0, pickup: 0, delivery: 0 },
          today: { total: 0, revenue: 0, pickup: 0, delivery: 0 },
          sameDayLastWeek: { total: 0, revenue: 0, pickup: 0, delivery: 0 }
        },
        reservations: {
          thisMonth: { total: 0, totalGuests: 0 },
          lastMonth: { total: 0, totalGuests: 0 },
          today: { total: 0, totalGuests: 0 },
          sameDayLastWeek: { total: 0, totalGuests: 0 }
        },
        revenue: {
          thisMonth: 0,
          lastMonth: 0,
          today: 0,
          sameDayLastWeek: 0
        }
      }

      useStatsStore.mockReturnValue({
        stats: zeroStats,
        fetchStats: mockFetchStats
      })

      renderDashboard()

      expect(screen.getByText('€0.00')).toBeInTheDocument()
      expect(screen.getByText('0 active')).toBeInTheDocument()
      expect(screen.getByText('0 inactive')).toBeInTheDocument()
    })

    test('should calculate 100% change when previous value is 0', () => {
      const statsWithZeroPrevious = {
        ...mockApiStats,
        revenue: {
          ...mockApiStats.revenue,
          today: 100.00,
          sameDayLastWeek: 0
        }
      }

      useStatsStore.mockReturnValue({
        stats: statsWithZeroPrevious,
        fetchStats: mockFetchStats
      })

      renderDashboard()

      // When previous is 0 and current > 0, should show +100%
      const revenueSection = screen.getByText("Today's Revenue").closest('.bg-white')
      expect(within(revenueSection).getByText('+100%')).toBeInTheDocument()
    })

    test('should not display Monthly Overview when stats are null', () => {
      useStatsStore.mockReturnValue({
        stats: null,
        fetchStats: mockFetchStats
      })

      renderDashboard()

      expect(screen.queryByText('Monthly Overview')).not.toBeInTheDocument()
    })

    test('should display order totalPrice of 0 correctly', () => {
      const ordersWithZeroPrice = [{
        ...mockOrders[0],
        totalPrice: 0
      }]

      useOrdersStore.mockReturnValue({ orders: ordersWithZeroPrice })

      renderDashboard()

      expect(screen.getByText('€0.00')).toBeInTheDocument()
    })

    test('should handle empty items array', () => {
      const ordersWithNoItems = [{
        ...mockOrders[0],
        items: []
      }]

      useOrdersStore.mockReturnValue({ orders: ordersWithNoItems })

      renderDashboard()

      expect(screen.getByText('0 items')).toBeInTheDocument()
    })

    test('should handle missing items property', () => {
      const ordersWithoutItems = [{
        ...mockOrders[0],
        items: undefined
      }]

      useOrdersStore.mockReturnValue({ orders: ordersWithoutItems })

      renderDashboard()

      expect(screen.getByText('0 items')).toBeInTheDocument()
    })
  })

  // 10. DATE FORMATTING
  describe('Date Formatting', () => {
    test('should format dates correctly', () => {
      const specificDate = new Date('2024-03-15T10:00:00Z')
      const ordersWithDate = [{
        ...mockOrders[0],
        createdAt: specificDate.toISOString()
      }]

      useOrdersStore.mockReturnValue({ orders: ordersWithDate })

      renderDashboard()

      // Should display "Mar 15" format
      expect(screen.getByText('Mar 15')).toBeInTheDocument()
    })

    test('should display N/A for missing dates', () => {
      const ordersWithoutDate = [{
        ...mockOrders[0],
        createdAt: null
      }]

      useOrdersStore.mockReturnValue({ orders: ordersWithoutDate })

      renderDashboard()

      expect(screen.getByText('N/A')).toBeInTheDocument()
    })
  })
})
