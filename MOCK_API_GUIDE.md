# Mock API Guide - Development Mode

## Overview

The admin panel now uses a new architecture with mock data for development. This allows frontend development to proceed independently of backend implementation.

## How to Use Mock Mode

### 1. Enable Mock Mode

Edit your `.env` file:

```env
VITE_MOCK_API=true
```

### 2. Disable Mock Mode (Use Real API)

```env
VITE_MOCK_API=false
```

**Important:** You must restart the Vite dev server after changing this variable!

```bash
# Stop the server (Ctrl+C)
npm run dev  # Start again
```

## What's Been Refactored

### OrdersManagement ✅

**New Features:**
- **Recent Tab (15 days)**: Shows last 50 orders, auto-refreshes every 60 seconds
- **History Tab**: Search by date range (max 1 year), on-demand loading
- **No Store Dependency**: Uses local state + direct API calls
- **Real Pagination**: Ready for backend pagination
- **Refresh Button**: Manual refresh for recent orders
- **Last Updated Indicator**: Shows "Updated Xs ago"

**How to Test:**
1. Navigate to `/admin/orders`
2. You should see **50 mock orders** in "Recent" tab
3. Click "History" tab
4. Select a date range (e.g., Jan 1, 2024 - Feb 1, 2024)
5. See **200 historical orders** loaded
6. Try filtering by status
7. Try searching by order number
8. Watch the "Updated Xs ago" indicator in Recent tab
9. Click "Refresh" button to manually refresh

**Auto-Refresh:**
- Recent orders auto-refresh every **60 seconds** (watch browser console)
- Stops when switching to History tab
- Resumes when switching back to Recent

### ReservationsManagement ✅

**New Features:**
- **Recent Tab (15 days + upcoming)**: Shows last 50 reservations, auto-refreshes every 60 seconds
- **History Tab**: Search by date range (max 1 year), on-demand loading
- **No Store Dependency**: Uses local state + direct API calls
- **Real Pagination**: Ready for backend pagination
- **Refresh Button**: Manual refresh for recent reservations
- **Last Updated Indicator**: Shows "Updated Xs ago"

**How to Test:**
1. Navigate to `/admin/reservations`
2. You should see **50 mock reservations** in "Recent" tab (last 15 days + upcoming)
3. Click "History" tab
4. Select a date range (e.g., Jan 1, 2024 - Feb 1, 2024)
5. See **200 historical reservations** loaded
6. Try filtering by status
7. Try searching by reservation number
8. Watch the "Updated Xs ago" indicator in Recent tab
9. Click "Refresh" button to manually refresh

**Auto-Refresh:**
- Recent reservations auto-refresh every **60 seconds** (watch browser console)
- Stops when switching to History tab
- Resumes when switching back to Recent

## Mock Data Details

### Orders Mock

**File:** `src/api/mocks/ordersMock.js`

**Recent Orders:**
- 50 orders generated
- 0-14 days old
- Random statuses, payment methods
- Includes some "deleted user" scenarios

**Historical Orders:**
- 200 orders generated
- 15-365 days old
- Sorted by date descending

**Dynamic Refresh:**
The mock has a `refreshMockOrders()` function that simulates new orders coming in. This is called automatically during auto-refresh.

### Reservations Mock

**File:** `src/api/mocks/reservationsMock.js`

**Recent Reservations:**
- 50 reservations generated
- Mix of past (0-14 days ago) and future (0-6 days ahead) reservations
- Random statuses, guest counts, time slots
- Includes some "deleted user" scenarios

**Historical Reservations:**
- 200 reservations generated
- 15-365 days ago
- Sorted by date DESC, then slot DESC

**Dynamic Refresh:**
The mock has a `refreshMockReservations()` function that simulates new reservations coming in. This is called automatically during auto-refresh.

## Switching to Real API

When backend endpoints are ready:

1. **Set `.env` variable:**
   ```env
   VITE_MOCK_API=false
   ```

2. **Restart dev server**

3. **Ensure backend is running** on `http://localhost:3001`

4. **Expected backend endpoints:**

   **Orders:**
   - `GET /api/orders/admin/recent?limit=50&page=1&status=...`
   - `GET /api/orders/admin/history?startDate=...&endDate=...&limit=20&page=1`
   - `PATCH /api/orders/:id/status`

   **Reservations:**
   - `GET /api/reservations/admin/recent?limit=50&page=1&status=...`
   - `GET /api/reservations/admin/history?startDate=...&endDate=...&limit=20&page=1`
   - `PATCH /api/reservations/admin/:id/status`

See `BACKEND_API_REQUIREMENTS.md` for full API specification.

## Troubleshooting

### "No orders" even in mock mode

1. Check `.env` has `VITE_MOCK_API=true`
2. Restart Vite dev server
3. Open browser console, check for errors
4. Verify mock files exist in `src/api/mocks/`

### Auto-refresh not working

1. Open browser console
2. You should see API call logs every 60 seconds
3. Make sure you're on "Recent" tab (auto-refresh disabled on History)

### Date range not working in History

1. Make sure you selected BOTH start and end dates
2. End date must be after start date
3. Max range is 1 year (enforced by backend, not yet in frontend)

## Development Workflow

### Typical Day

**Morning:**
1. `VITE_MOCK_API=true` - Work on frontend features
2. See immediate results with mock data
3. Test UX, filters, pagination

**Afternoon:**
1. Backend team implements `/orders/admin/recent`
2. You switch `VITE_MOCK_API=false`
3. Test with real data
4. Report any API issues

**Benefits:**
- ✅ No waiting for backend
- ✅ Consistent test data
- ✅ Easy to test edge cases (deleted users, etc.)
- ✅ Fast iteration on UI/UX

## Files Changed

```
src/
├── api/
│   ├── mocks/
│   │   ├── ordersMock.js             (NEW)
│   │   └── reservationsMock.js       (NEW)
│   ├── ordersApi.js                  (MODIFIED - added getRecentOrders, getHistoricalOrders)
│   └── reservationsApi.js            (MODIFIED - added getRecentReservations, getHistoricalReservations)
├── pages/
│   └── admin/
│       ├── OrdersManagement.jsx      (REFACTORED)
│       ├── OrdersManagement.old.jsx  (BACKUP)
│       ├── ReservationsManagement.jsx (REFACTORED)
│       └── ReservationsManagement.old.jsx (BACKUP)
.env                                   (MODIFIED - added VITE_MOCK_API)
.env.example                           (MODIFIED)
BACKEND_API_REQUIREMENTS.md            (NEW)
MOCK_API_GUIDE.md                      (THIS FILE)
```

## Next Steps

1. **Test OrdersManagement thoroughly** with mocks ✅
2. **Test ReservationsManagement thoroughly** with mocks ✅
3. **Report any UI/UX issues** before backend implementation
4. **Refactor UsersManagement** (if needed - probably simpler, no history tab)
5. **Backend implements endpoints** from BACKEND_API_REQUIREMENTS.md
6. **Switch to real API** and final testing

---

**Questions?** Check `BACKEND_API_REQUIREMENTS.md` for API details or ask for help!

Last updated: 2025-01-08
