/**
 * EXAMPLE: How to use reservation services in React components
 * This demonstrates best practices for using the service layer
 */

import { useState } from 'react'
import { toast } from 'react-hot-toast'
import useReservationsStore from '../../store/reservationsStore'
import { ReservationService } from './index'

/**
 * Example: Create Reservation Form
 * Shows how to use services for validation and business logic
 */
export const CreateReservationForm = () => {
  const [formData, setFormData] = useState({
    date: '',
    slot: '',
    guests: 2,
    phone: ''
  })
  const [errors, setErrors] = useState([])

  const { createReservation, isLoading } = useReservationsStore()

  /**
   * Client-side validation using service
   * No store needed!
   */
  const handleValidation = () => {
    // ✅ Use service for validation (pure function)
    const validation = ReservationService.validate(formData)

    if (!validation.valid) {
      setErrors(validation.errors)
      return false
    }

    setErrors([])
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate first
    if (!handleValidation()) {
      toast.error('Please fix validation errors')
      return
    }

    // Create reservation (store handles API call and state update)
    const result = await createReservation(formData)

    if (result.success) {
      toast.success('Reservation created!')
      // Reset form
      setFormData({ date: '', slot: '', guests: 2, phone: '' })
    } else {
      toast.error(result.error)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields... */}
      {errors.length > 0 && (
        <div className="errors">
          {errors.map((error, i) => (
            <p key={i}>{error}</p>
          ))}
        </div>
      )}
      <button type="submit" disabled={isLoading}>
        Create Reservation
      </button>
    </form>
  )
}

/**
 * Example: Reservations List with Filters
 * Shows how to use services for filtering without touching the store
 */
export const ReservationsList = () => {
  const [filters, setFilters] = useState({
    status: '',
    timeRange: 'upcoming',
    searchText: ''
  })

  // Get raw data from store
  const { reservations } = useReservationsStore()

  // ✅ Use services for filtering (pure functions, can be memoized)
  const filteredReservations = useMemo(() => {
    let result = reservations

    // Apply filters using service
    if (filters.status || filters.timeRange) {
      result = ReservationService.filter(result, {
        status: filters.status,
        timeRange: filters.timeRange
      })
    }

    // Apply search using service
    if (filters.searchText) {
      result = ReservationService.search(result, filters.searchText)
    }

    return result
  }, [reservations, filters])

  return (
    <div>
      {/* Filter Controls */}
      <div className="filters">
        <select
          value={filters.timeRange}
          onChange={(e) => setFilters({ ...filters, timeRange: e.target.value })}
        >
          <option value="upcoming">Upcoming</option>
          <option value="past">Past</option>
          <option value="today">Today</option>
        </select>

        <input
          type="text"
          placeholder="Search..."
          value={filters.searchText}
          onChange={(e) => setFilters({ ...filters, searchText: e.target.value })}
        />
      </div>

      {/* Reservations List */}
      <div className="reservations">
        {filteredReservations.map((reservation) => (
          <ReservationCard key={reservation.id} reservation={reservation} />
        ))}
      </div>
    </div>
  )
}

/**
 * Example: Reservation Card with Business Rules
 * Shows how to use services for business logic display
 */
export const ReservationCard = ({ reservation }) => {
  const { updateReservationStatus, cancelReservation } = useReservationsStore()

  // ✅ Use service to format reservation (adds computed properties)
  const formatted = ReservationService.formatReservation(reservation)

  // ✅ Use service to check business rules
  const { canCancel, reason: cancelReason } = ReservationService.canCancel(reservation)
  const { canModify, reason: modifyReason } = ReservationService.canModify(reservation)

  const handleStatusChange = async (newStatus) => {
    // ✅ Validate transition using service
    const validation = ReservationService.isValidStatusTransition(
      reservation.status,
      newStatus
    )

    if (!validation.valid) {
      toast.error(validation.error)
      return
    }

    const result = await updateReservationStatus(reservation.id, newStatus)
    if (result.success) {
      toast.success('Status updated!')
    }
  }

  const handleCancel = async () => {
    if (!canCancel) {
      toast.error(cancelReason)
      return
    }

    if (!confirm('Are you sure you want to cancel this reservation?')) {
      return
    }

    const result = await cancelReservation(reservation.id)
    if (result.success) {
      toast.success('Reservation cancelled')
    }
  }

  return (
    <div className={`reservation-card ${formatted.isPast ? 'past' : ''}`}>
      <h3>{formatted.displayDate}</h3>
      <p>{reservation.guests} guests</p>
      <p>Status: {reservation.status}</p>

      {/* Business rules determine what actions are available */}
      <div className="actions">
        {canModify && (
          <button onClick={() => {/* Edit */}}>
            Edit
          </button>
        )}

        {canCancel && (
          <button onClick={handleCancel}>
            Cancel
          </button>
        )}

        {/* Show available status transitions */}
        {formatted.availableTransitions.length > 0 && (
          <select onChange={(e) => handleStatusChange(e.target.value)}>
            <option value="">Change status...</option>
            {formatted.availableTransitions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        )}

        {/* Show reasons if actions are disabled */}
        {!canCancel && (
          <span className="disabled-reason">{cancelReason}</span>
        )}
      </div>
    </div>
  )
}

/**
 * Example: Dashboard Statistics
 * Shows how to use services for analytics
 */
export const ReservationsDashboard = () => {
  const { reservations } = useReservationsStore()

  // ✅ Use service for analytics (pure functions)
  const stats = ReservationService.calculateStats(reservations)
  const analytics = ReservationService.getAnalytics(reservations, 15) // 15 tables

  return (
    <div className="dashboard">
      {/* Overall Statistics */}
      <div className="stats-grid">
        <StatCard
          title="Total Reservations"
          value={stats.total}
          subtitle={`${stats.confirmed} confirmed`}
        />
        <StatCard
          title="Today's Reservations"
          value={stats.todayTotal}
          subtitle={`${stats.todayGuests} guests`}
        />
        <StatCard
          title="Table Utilization"
          value={`${analytics.utilization.utilizationRate}%`}
          subtitle={`${analytics.utilization.usedSlots} / ${analytics.utilization.totalSlots} slots`}
        />
        <StatCard
          title="Cancellation Rate"
          value={`${analytics.cancellations.cancellationRate}%`}
          subtitle={`${analytics.cancellations.totalCancelled} cancelled`}
        />
      </div>

      {/* Peak Hours Chart */}
      <div className="peak-hours">
        <h3>Peak Hours</h3>
        {analytics.peakHours.slice(0, 5).map((peak) => (
          <div key={peak.slot} className="peak-bar">
            <span>Slot {peak.slot}</span>
            <div className="bar" style={{ width: `${(peak.count / stats.total) * 100}%` }} />
            <span>{peak.count} reservations</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Example: Table Suggestion Tool (Admin)
 * Shows how to use services for complex business logic
 */
export const TableSuggestionTool = ({ reservation, availableTables }) => {
  // ✅ Use service to suggest tables based on party size
  const suggestedTables = ReservationService.suggestTables(
    reservation.guests,
    availableTables
  )

  // ✅ Use service to check for conflicts
  const { reservations } = useReservationsStore()
  const conflicts = ReservationService.getConflicts(
    {
      date: reservation.date,
      slot: reservation.slot,
      tableNumber: suggestedTables[0]
    },
    reservations
  )

  return (
    <div className="table-suggestion">
      <h4>Suggested Tables for {reservation.guests} guests</h4>

      {suggestedTables.length > 0 ? (
        <div>
          <p>Recommended: Tables {suggestedTables.join(', ')}</p>

          {conflicts.length > 0 && (
            <div className="warning">
              ⚠️ Table {suggestedTables[0]} has a conflict with reservation #{conflicts[0].id}
            </div>
          )}
        </div>
      ) : (
        <p>No available tables for this party size</p>
      )}
    </div>
  )
}

/**
 * KEY BENEFITS OF THIS APPROACH:
 *
 * 1. ✅ COMPONENTS STAY SIMPLE
 *    - Focus on rendering and user interaction
 *    - Delegate business logic to services
 *    - Easy to read and maintain
 *
 * 2. ✅ BUSINESS RULES ARE CENTRALIZED
 *    - Validation logic in one place
 *    - Status transitions defined once
 *    - Easy to update rules
 *
 * 3. ✅ TESTABILITY
 *    - Services can be tested independently
 *    - Components can be tested with mocked services
 *    - Clear separation of concerns
 *
 * 4. ✅ REUSABILITY
 *    - Same service logic used in multiple components
 *    - No duplication of business rules
 *    - Services can be used outside React (e.g., Node.js scripts)
 *
 * 5. ✅ PERFORMANCE
 *    - Pure functions can be memoized
 *    - No unnecessary re-renders
 *    - Efficient filtering and calculations
 */

// Helper component
const StatCard = ({ title, value, subtitle }) => (
  <div className="stat-card">
    <h4>{title}</h4>
    <div className="value">{value}</div>
    <div className="subtitle">{subtitle}</div>
  </div>
)
