# Backend API Requirements - Recent/Historical Data Split

## Overview

This document specifies the new API endpoints needed to support the recent vs. historical data separation strategy in the admin panel.

## Strategy

- **Recent data** (last 15 days): Auto-refreshed every 60 seconds, limited pagination
- **Historical data** (> 15 days): Fetch on demand with full pagination

---

## Orders API

### 1. Get Recent Orders (Last 15 Days)

**Endpoint:** `GET /api/orders/admin/recent`

**Auth:** Admin only

**Query Parameters:**
```
limit: number (default: 50, max: 100)
page: number (default: 1)
status: string (optional) - 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "orderNumber": 1234,
      "userId": "...",
      "userEmail": "user@example.com",
      "items": [...],
      "total": 45.50,
      "status": "confirmed",
      "paymentMethod": "card",
      "paymentStatus": "paid",
      "createdAt": "2025-01-08T10:30:00Z",
      "updatedAt": "2025-01-08T10:32:00Z"
    }
  ],
  "pagination": {
    "total": 234,
    "page": 1,
    "limit": 50,
    "totalPages": 5,
    "hasMore": true
  }
}
```

**Business Logic:**
- Only return orders from the last 15 days (`createdAt >= NOW() - 15 days`)
- Sort by `createdAt` DESC (newest first)
- Apply status filter if provided

---

### 2. Get Historical Orders (> 15 Days)

**Endpoint:** `GET /api/orders/admin/history`

**Auth:** Admin only

**Query Parameters:**
```
startDate: string (required) - ISO date 'YYYY-MM-DD'
endDate: string (required) - ISO date 'YYYY-MM-DD'
limit: number (default: 20, max: 50)
page: number (default: 1)
status: string (optional)
search: string (optional) - Search by order number or user email
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 5234,
    "page": 1,
    "limit": 20,
    "totalPages": 262,
    "hasMore": true
  }
}
```

**Business Logic:**
- Filter by date range: `createdAt >= startDate AND createdAt <= endDate`
- Max date range: 1 year (prevent fetching too much data)
- Sort by `createdAt` DESC
- Apply filters (status, search)

---

## Reservations API

### 3. Get Recent Reservations (Last 15 Days)

**Endpoint:** `GET /api/reservations/admin/recent`

**Auth:** Admin only

**Query Parameters:**
```
limit: number (default: 50, max: 100)
page: number (default: 1)
status: string (optional) - 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no-show'
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "reservationNumber": 5678,
      "userId": "...",
      "userName": "John Doe",
      "userEmail": "john@example.com",
      "contactPhone": "+33612345678",
      "date": "2025-01-15",
      "slot": 7,
      "guests": 4,
      "tableNumber": [1, 2],
      "status": "confirmed",
      "specialRequests": "...",
      "createdAt": "2025-01-08T14:20:00Z",
      "updatedAt": "2025-01-08T14:25:00Z"
    }
  ],
  "pagination": {
    "total": 156,
    "page": 1,
    "limit": 50,
    "totalPages": 4,
    "hasMore": true
  }
}
```

**Business Logic:**
- Return reservations where `date >= NOW() - 15 days` OR `createdAt >= NOW() - 15 days`
- Sort by `date` DESC, then `slot` DESC (newest/latest first)
- Apply status filter if provided

---

### 4. Get Historical Reservations (> 15 Days)

**Endpoint:** `GET /api/reservations/admin/history`

**Auth:** Admin only

**Query Parameters:**
```
startDate: string (required) - ISO date 'YYYY-MM-DD'
endDate: string (required) - ISO date 'YYYY-MM-DD'
limit: number (default: 20, max: 50)
page: number (default: 1)
status: string (optional)
search: string (optional) - Search by reservation number or user name/email
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 3421,
    "page": 1,
    "limit": 20,
    "totalPages": 172,
    "hasMore": true
  }
}
```

**Business Logic:**
- Filter by date range: `date >= startDate AND date <= endDate`
- Max date range: 1 year
- Sort by `date` DESC, then `slot` DESC
- Apply filters

---

## Users API

### 5. Get Users Stats

**Endpoint:** `GET /api/users/stats`

**Auth:** Admin only

**Response:**
```json
{
  "success": true,
  "data": {
    "totalUsers": 1248,
    "activeUsers": 856,
    "inactiveUsers": 392,
    "regularUsers": 1100,
    "newUsers": 89,
    "recentlyLoggedUsers": 234,
    "activeCustomersLastMonth": 156
  }
}
```

**Note:** This endpoint already exists and works correctly. No changes needed.

---

### 6. Get All Users (with pagination)

**Endpoint:** `GET /api/users/admin`

**Auth:** Admin only

**Query Parameters:**
```
limit: number (default: 50, max: 200)
page: number (default: 1)
role: string (optional) - 'user' | 'admin'
status: string (optional) - 'active' | 'inactive'
search: string (optional) - Search by name, email, or phone
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "_id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+33612345678",
      "role": "user",
      "isActive": true,
      "emailVerified": true,
      "createdAt": "2024-06-15T10:00:00Z",
      "lastLogin": "2025-01-08T09:15:00Z"
    }
  ],
  "pagination": {
    "total": 1248,
    "page": 1,
    "limit": 50,
    "totalPages": 25,
    "hasMore": true
  }
}
```

**Business Logic:**
- Return all users with pagination
- Apply filters (role, status, search)
- Sort by `createdAt` DESC by default

---

## Important Notes

### Date Handling
- All dates should be in **ISO 8601 format**
- Backend should handle timezone conversions appropriately
- Use `YYYY-MM-DD` for date-only parameters
- Use full ISO string for timestamps in responses

### Pagination
- Always include complete pagination info in responses
- `hasMore` boolean helps frontend know if there are more pages
- Limit max page size to prevent memory issues

### Performance
- Add database indexes on:
  - `orders.createdAt`
  - `reservations.date`
  - `reservations.createdAt`
  - `users.createdAt`
- Consider caching recent data queries (30-60 seconds)

### Deleted Users (RGPD)
- When users are deleted, maintain data integrity:
  - `userId` → `'deleted-user'`
  - `userEmail` → `'deleted-XXXXX@account.com'` (hashed)
  - `userName` → null or 'Deleted User'

---

## Migration from Current API

### Current Endpoints to Deprecate
- `GET /api/orders/admin` (replace with `/recent` or `/history`)
- `GET /api/reservations/admin` (replace with `/recent` or `/history`)

### Transition Period
1. Keep old endpoints for 1-2 weeks during frontend migration
2. Add deprecation warnings in responses
3. Remove old endpoints once frontend is fully migrated

---

## Frontend Auto-Refresh Strategy

**Recent data endpoints:**
- Auto-refresh interval: **60 seconds**
- Only when admin panel tab is active
- Stop auto-refresh when switching to historical view

**Historical data endpoints:**
- No auto-refresh
- Fetch only when user selects date range

---

## Error Handling

All endpoints should return standardized errors:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

Common error codes:
- `INVALID_DATE_RANGE`: Date range exceeds max allowed (1 year)
- `INVALID_PAGINATION`: Page or limit out of bounds
- `UNAUTHORIZED`: Not admin or not authenticated

---

Last updated: 2025-01-08
