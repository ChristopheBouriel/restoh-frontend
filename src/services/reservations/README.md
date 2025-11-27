# Reservation Services

Service layer for reservation business logic. This demonstrates the **recommended architecture** for managing complex business logic in React applications.

## 📁 Structure

```
services/reservations/
├── reservationValidator.js    # Validation rules
├── reservationFilters.js      # Query & filtering logic
├── reservationStats.js        # Analytics & calculations
├── reservationService.js      # Main orchestration service
├── index.js                   # Public API exports
├── EXAMPLE_simplified_store.js # How to use services in store
├── EXAMPLE_service.test.js    # Example tests
└── README.md                  # This file
```

## 🎯 Purpose

Extract business logic from Zustand stores into **pure, testable functions**.

### Before (Current)
```javascript
// reservationsStore.js - 360 lines, mixed concerns
const useReservationsStore = create((set, get) => ({
  reservations: [],

  createReservation: async (data) => {
    // ❌ Validation logic
    if (!data.guests || data.guests < 1) return { error: '...' }
    if (!data.date) return { error: '...' }

    // ❌ Data transformation
    const cleaned = { ...data, guests: parseInt(data.guests) }

    // ❌ API call
    const result = await reservationsApi.create(cleaned)

    // ❌ State update
    set({ reservations: [...get().reservations, result.data] })
  },

  getReservationsStats: () => {
    // ❌ Complex calculation logic in store
    const today = new Date().toISOString().split('T')[0]
    return get().reservations.filter(r => r.date === today)...
  }
}))
```

**Problems:**
- ❌ Hard to test (must mock entire store)
- ❌ Logic tied to Zustand
- ❌ Cannot reuse in other contexts
- ❌ Difficult to maintain

### After (With Services)
```javascript
// reservationValidator.js - Pure functions
export const validateReservationData = (data) => {
  const errors = []
  if (!data.guests || data.guests < 1) {
    errors.push('At least 1 guest required')
  }
  return { valid: errors.length === 0, errors }
}

// reservationsStore.js - Simple orchestration
const useReservationsStore = create((set, get) => ({
  reservations: [],

  createReservation: async (data) => {
    // ✅ Use service for validation
    const validation = ReservationService.validate(data)
    if (!validation.valid) return { success: false, errors: validation.errors }

    // ✅ Use service for data prep
    const prepared = ReservationService.prepareReservationData(data)

    // API call
    const result = await reservationsApi.create(prepared)

    // State update
    set({ reservations: [...get().reservations, result.data] })
    return { success: true }
  },

  getReservationsStats: () => {
    // ✅ Delegate to service
    return ReservationService.calculateStats(get().reservations)
  }
}))
```

**Benefits:**
- ✅ Easy to test (pure functions)
- ✅ Framework-agnostic logic
- ✅ Reusable anywhere
- ✅ Easy to maintain

## 📚 Services Overview

### 1. `reservationValidator.js`
**Purpose:** Validation rules and business constraints

**Functions:**
- `validateReservationData(data)` - Complete validation
- `validateGuests(guests)` - Guest count validation
- `validateReservationDate(date)` - Date validation
- `validateTimeSlot(slot)` - Time slot validation
- `validatePhone(phone)` - Phone format validation
- `canModifyReservation(reservation)` - Modification rules
- `canCancelReservation(reservation)` - Cancellation rules

**Example:**
```javascript
import { validateReservationData } from '@/services/reservations'

const result = validateReservationData({
  date: '2025-01-20',
  guests: 4,
  slot: 7,
  phone: '06 12 34 56 78'
})

if (!result.valid) {
  console.error('Validation errors:', result.errors)
}
```

### 2. `reservationFilters.js`
**Purpose:** Query and filtering logic

**Functions:**
- `filterByStatus(reservations, status)` - Filter by status
- `filterByDate(reservations, date)` - Filter by date
- `filterByUser(reservations, userId)` - Filter by user
- `getTodaysReservations(reservations)` - Get today's reservations
- `getUpcomingReservations(reservations)` - Get future reservations
- `getPastReservations(reservations)` - Get past reservations
- `filterReservations(reservations, filters)` - Multi-criteria filtering
- `searchReservations(reservations, text)` - Text search

**Example:**
```javascript
import { getTodaysReservations, filterByStatus } from '@/services/reservations'

const todaysConfirmed = filterByStatus(
  getTodaysReservations(allReservations),
  'confirmed'
)
```

### 3. `reservationStats.js`
**Purpose:** Analytics and calculations

**Functions:**
- `calculateReservationStats(reservations)` - Overall statistics
- `calculateDateRangeStats(reservations, start, end)` - Date range stats
- `getPeakHours(reservations)` - Identify busy time slots
- `calculateTableUtilization(reservations, totalTables)` - Table usage
- `calculateCancellationRate(reservations)` - Cancellation metrics
- `calculateAveragePartySize(reservations, options)` - Average guests

**Example:**
```javascript
import { calculateReservationStats } from '@/services/reservations'

const stats = calculateReservationStats(reservations)
console.log(`Today: ${stats.todayTotal} reservations, ${stats.todayGuests} guests`)
```

### 4. `reservationService.js`
**Purpose:** High-level orchestration and coordination

**Functions:**
- `validate(data)` - Validate reservation
- `prepareReservationData(data)` - Clean and transform data
- `canModify(reservation)` - Check if modifiable
- `canCancel(reservation)` - Check if cancellable
- `getAvailableStatusTransitions(status)` - Valid status changes
- `isValidStatusTransition(from, to)` - Validate status change
- `filter(reservations, filters)` - Filter reservations
- `search(reservations, text)` - Search reservations
- `calculateStats(reservations)` - Calculate statistics
- `getAnalytics(reservations, totalTables)` - Full analytics
- `formatReservation(reservation)` - Add display properties
- `getConflicts(newReservation, existing)` - Find conflicts
- `suggestTables(guests, availableTables)` - Table suggestions

**Example:**
```javascript
import { ReservationService } from '@/services/reservations'

// Validate before creating
const validation = ReservationService.validate(formData)
if (!validation.valid) {
  // Handle errors
}

// Check if reservation can be modified
const { canModify, reason } = ReservationService.canModify(reservation)
if (!canModify) {
  alert(reason)
}

// Get analytics
const analytics = ReservationService.getAnalytics(reservations, 15)
console.log('Utilization:', analytics.utilization.utilizationRate + '%')
```

## 🧪 Testing

Services are **pure functions** → incredibly easy to test!

```javascript
import { validateGuests } from '@/services/reservations'

test('should reject zero guests', () => {
  const result = validateGuests(0)
  expect(result.valid).toBe(false)
  expect(result.error).toBe('At least 1 guest is required')
})
```

No mocking required! Just: **input → output**

See `EXAMPLE_service.test.js` for comprehensive examples.

## 🔄 Migration Path

### Step 1: Current Store (Status Quo)
Keep using `reservationsStore.js` as-is.

### Step 2: Add Service Layer (Gradual)
Start using services for new features:
```javascript
// In store
createReservation: async (data) => {
  // Use service for validation
  const validation = ReservationService.validate(data)
  if (!validation.valid) return { success: false, errors: validation.errors }

  // Rest of implementation
  ...
}
```

### Step 3: Refactor Existing (When Ready)
Gradually move logic from store to services:
- Move getters → use service filters
- Move stats → use service stats
- Move validation → use service validators

### Step 4: React Query (Optional Future)
Services work perfectly with React Query:
```javascript
// hooks/queries/useReservations.js
import { useQuery, useMutation } from '@tanstack/react-query'
import { ReservationService } from '@/services/reservations'

export const useReservations = (filters) => {
  return useQuery({
    queryKey: ['reservations', filters],
    queryFn: async () => {
      const data = await reservationsApi.getAll()
      // Use service to filter
      return ReservationService.filter(data, filters)
    }
  })
}

export const useCreateReservation = () => {
  return useMutation({
    mutationFn: async (data) => {
      // Validate with service
      const validation = ReservationService.validate(data)
      if (!validation.valid) throw new Error(validation.errors[0])

      // Prepare with service
      const prepared = ReservationService.prepareReservationData(data)

      // Call API
      return reservationsApi.create(prepared)
    }
  })
}
```

## 💡 Best Practices

1. **Keep Services Pure**
   - No side effects
   - Same input = same output
   - Easy to test

2. **Single Responsibility**
   - Each service file has ONE purpose
   - Validator = validation only
   - Filters = filtering only
   - Stats = calculations only

3. **Document Business Rules**
   - Use JSDoc comments
   - Explain WHY, not just WHAT
   - Make rules explicit

4. **Test Everything**
   - Pure functions = 100% testable
   - Write tests as you code
   - Tests = living documentation

5. **Export Clearly**
   - Use named exports for functions
   - Use default export for main service
   - Centralize in `index.js`

## 📖 Additional Resources

- [Zustand Best Practices](https://github.com/pmndrs/zustand/discussions/1299)
- [React Query + Zustand Architecture](https://medium.com/@zerebkov.artjom/how-to-structure-next-js-project-with-zustand-and-react-query-c4949544b0fe)
- [Separation of Concerns in React](https://medium.com/design-bootcamp/separating-%EF%B8%8F-business-logic-from-ui-components-in-react-18-aa1775b3caba)

## 🚀 Next Steps

1. Review `EXAMPLE_simplified_store.js` to see how stores become simpler
2. Review `EXAMPLE_service.test.js` to see how easy testing becomes
3. Try using services in your components/hooks
4. Gradually refactor existing stores to use services
5. Consider React Query migration for server state
