/**
 * Mock data for Reservations API
 * Used for development until backend endpoints are ready
 */

// Generate mock reservation
const generateMockReservation = (id, daysAgo = 0) => {
  const statuses = ['confirmed', 'seated', 'completed', 'cancelled', 'no-show']
  const tables = [[1], [2], [3], [4], [5], [1, 2], [3, 4], [5, 6]]

  const date = new Date()
  date.setDate(date.getDate() + daysAgo) // daysAgo can be negative for future reservations

  const createdDate = new Date()
  createdDate.setDate(createdDate.getDate() - Math.abs(daysAgo) - Math.floor(Math.random() * 3)) // Created before the reservation date

  const status = statuses[Math.floor(Math.random() * statuses.length)]
  const guests = Math.floor(Math.random() * 6) + 2 // 2-7 guests
  const slot = Math.floor(Math.random() * 15) + 1 // Slots 1-15

  return {
    id: `mock-reservation-${id}`,
    reservationNumber: 2000 + id,
    userId: Math.abs(daysAgo) > 30 ? 'deleted-user' : `user-${Math.floor(Math.random() * 100)}`,
    userName: Math.abs(daysAgo) > 30 ? 'Deleted User' : `User ${Math.floor(Math.random() * 100)}`,
    userEmail: Math.abs(daysAgo) > 30 ? 'deleted-xyz456@account.com' : `user${Math.floor(Math.random() * 100)}@example.com`,
    contactPhone: `+336${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
    date: date.toISOString().split('T')[0], // YYYY-MM-DD format
    slot,
    guests,
    tableNumber: tables[Math.floor(Math.random() * tables.length)],
    status,
    specialRequests: Math.random() > 0.7 ? 'Quiet table please' : null,
    createdAt: createdDate.toISOString(),
    updatedAt: createdDate.toISOString()
  }
}

// Generate recent reservations (last 15 days + next 7 days)
export const generateRecentReservations = (count = 50) => {
  const reservations = []
  for (let i = 0; i < count; i++) {
    // Mix of past reservations (0-14 days ago) and future reservations (0-7 days ahead)
    const daysOffset = Math.random() > 0.6
      ? Math.floor(Math.random() * 7) // 0-6 days in the future
      : -Math.floor(Math.random() * 15) // 0-14 days ago

    reservations.push(generateMockReservation(i, daysOffset))
  }
  // Sort by date DESC, then slot DESC (newest/latest first)
  return reservations.sort((a, b) => {
    const dateCompare = new Date(b.date) - new Date(a.date)
    if (dateCompare !== 0) return dateCompare
    return b.slot - a.slot
  })
}

// Generate historical reservations (16-365 days ago)
export const generateHistoricalReservations = (count = 200) => {
  const reservations = []
  for (let i = 0; i < count; i++) {
    const daysAgo = -(Math.floor(Math.random() * 350) + 15) // -15 to -365 days ago
    reservations.push(generateMockReservation(i + 1000, daysAgo))
  }
  // Sort by date DESC, then slot DESC (newest/latest first)
  return reservations.sort((a, b) => {
    const dateCompare = new Date(b.date) - new Date(a.date)
    if (dateCompare !== 0) return dateCompare
    return b.slot - a.slot
  })
}

// Mock recent reservations data
let mockRecentReservations = []
let mockHistoricalReservations = []

// Initialize mock data
const initializeMockData = () => {
  mockRecentReservations = generateRecentReservations(50)
  mockHistoricalReservations = generateHistoricalReservations(200)
}

// Initialize on load
initializeMockData()

/**
 * Mock: Get recent reservations (last 15 days + upcoming)
 */
export const getRecentReservationsMock = async (params = {}) => {
  const { limit = 50, page = 1, status } = params

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300))

  // Filter by status if provided
  let filteredReservations = status
    ? mockRecentReservations.filter(reservation => reservation.status === status)
    : mockRecentReservations

  // Pagination
  const startIndex = (page - 1) * limit
  const endIndex = startIndex + limit
  const paginatedReservations = filteredReservations.slice(startIndex, endIndex)

  return {
    success: true,
    data: paginatedReservations,
    pagination: {
      total: filteredReservations.length,
      page,
      limit,
      totalPages: Math.ceil(filteredReservations.length / limit),
      hasMore: endIndex < filteredReservations.length
    }
  }
}

/**
 * Mock: Get historical reservations (> 15 days ago)
 */
export const getHistoricalReservationsMock = async (params = {}) => {
  const { startDate, endDate, limit = 20, page = 1, status, search } = params

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500))

  let filteredReservations = [...mockHistoricalReservations]

  // Filter by date range
  if (startDate && endDate) {
    const start = new Date(startDate)
    const end = new Date(endDate)
    filteredReservations = filteredReservations.filter(reservation => {
      const reservationDate = new Date(reservation.date)
      return reservationDate >= start && reservationDate <= end
    })
  }

  // Filter by status
  if (status) {
    filteredReservations = filteredReservations.filter(reservation => reservation.status === status)
  }

  // Filter by search (reservation number, name, or email)
  if (search) {
    const searchLower = search.toLowerCase()
    filteredReservations = filteredReservations.filter(reservation =>
      reservation.reservationNumber.toString().includes(searchLower) ||
      reservation.userName?.toLowerCase().includes(searchLower) ||
      reservation.userEmail?.toLowerCase().includes(searchLower)
    )
  }

  // Pagination
  const startIndex = (page - 1) * limit
  const endIndex = startIndex + limit
  const paginatedReservations = filteredReservations.slice(startIndex, endIndex)

  return {
    success: true,
    data: paginatedReservations,
    pagination: {
      total: filteredReservations.length,
      page,
      limit,
      totalPages: Math.ceil(filteredReservations.length / limit),
      hasMore: endIndex < filteredReservations.length
    }
  }
}

/**
 * Mock: Update reservation status
 */
export const updateReservationStatusMock = async (reservationId, newStatus) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 200))

  // Find and update reservation in recent
  let reservation = mockRecentReservations.find(r => r.id === reservationId)
  if (reservation) {
    reservation.status = newStatus
    reservation.updatedAt = new Date().toISOString()
    return { success: true, data: reservation }
  }

  // Find and update reservation in historical
  reservation = mockHistoricalReservations.find(r => r.id === reservationId)
  if (reservation) {
    reservation.status = newStatus
    reservation.updatedAt = new Date().toISOString()
    return { success: true, data: reservation }
  }

  return { success: false, error: 'Reservation not found' }
}

/**
 * Refresh mock data (simulate new reservations coming in)
 */
export const refreshMockReservations = () => {
  // Add 1-2 new reservations to recent
  const newReservationsCount = Math.floor(Math.random() * 2) + 1
  for (let i = 0; i < newReservationsCount; i++) {
    const daysOffset = Math.floor(Math.random() * 7) // 0-6 days in the future
    const newReservation = generateMockReservation(Date.now() + i, daysOffset)
    mockRecentReservations.unshift(newReservation)
  }

  // Keep only last 100 recent reservations
  if (mockRecentReservations.length > 100) {
    mockRecentReservations = mockRecentReservations.slice(0, 100)
  }
}
