# RestOh API Contract

> **Version:** 1.0.0
> **Base URL:** `http://localhost:5000/api` (development) | `https://api.restoh.com/api` (production)
> **Last Updated:** 2025-12-25

This document describes the API contract between the RestOh frontend and backend. It serves as a reference for frontend developers.

---

## Table of Contents

1. [Authentication](#authentication)
2. [Response Format](#response-format)
3. [Error Codes](#error-codes)
4. [Rate Limiting](#rate-limiting)
5. [Endpoints](#endpoints)
   - [Auth](#auth-apiauth)
   - [Email](#email-apiemail)
   - [Menu](#menu-apimenu)
   - [Reviews (Menu Items)](#reviews-menu-items-apireview)
   - [Restaurant Reviews](#restaurant-reviews-apirestaurant)
   - [Orders](#orders-apiorders)
   - [Reservations](#reservations-apireservations)
   - [Tables](#tables-apitables)
   - [Payments](#payments-apipayments)
   - [Contact](#contact-apicontact)
   - [Newsletter](#newsletter-apinewsletter)
   - [Admin](#admin-apiadmin)
   - [Users (Admin)](#users-admin-apiusers)
6. [Types and Interfaces](#types-and-interfaces)
7. [Authentication Flow](#authentication-flow)

---

## Authentication

### Dual Token System

The backend uses a dual token system:

| Token | Duration | Storage | Usage |
|-------|----------|---------|-------|
| **Access Token** | 15 min | Header `Authorization: Bearer <token>` | Request authentication |
| **Refresh Token** | 7 days (or 24h without "Remember Me") | HttpOnly Cookie `refreshToken` | Access token renewal |

### Required Headers

```http
Authorization: Bearer <accessToken>
Content-Type: application/json
```

### Authentication Middleware

| Middleware | Description |
|------------|-------------|
| `protect` | Requires a valid access token |
| `authorize('admin')` | Requires admin role |
| `requireEmailVerified` | Requires a verified email address |
| `optionalAuth` | Optional authentication |

---

## Response Format

### Success

```typescript
{
  success: true,
  message?: string,
  data?: any,
  count?: number,        // Number of returned items
  total?: number,        // Total number of items
  pagination?: {
    next?: { page: number, limit: number },
    prev?: { page: number, limit: number }
  }
}
```

### Error

```typescript
{
  success: false,
  message: string,
  code?: string,         // Specific error code
  data?: any             // Additional details
}
```

---

## Error Codes

### Authentication

| Code | Status | Description | Frontend Action |
|------|--------|-------------|-----------------|
| `AUTH_TOKEN_EXPIRED` | 401 | Access token expired | Call `/api/auth/refresh` |
| `AUTH_NO_REFRESH_TOKEN` | 401 | No refresh token | Redirect to login |
| `AUTH_INVALID_REFRESH_TOKEN` | 401 | Invalid refresh token | Redirect to login |
| `AUTH_EMAIL_NOT_VERIFIED` | 403 | Email not verified | Show verification prompt |
| `INVALID_CREDENTIALS` | 401 | Invalid credentials | Show login error |
| `ACCOUNT_LOCKED` | 423 | Account locked (5 attempts) | Show remaining time (`remainingMinutes`) |
| `ACCOUNT_DELETED` | 403 | Account deleted | Redirect to login |
| `ACCOUNT_INACTIVE` | 403 | Account deactivated | Contact support |
| `EMAIL_EXISTS_ERROR` | 409 | Email already used | Show registration error |

### Orders & Reservations

| Code | Status | Description |
|------|--------|-------------|
| `UNPAID_DELIVERY_ORDERS` | 400 | Unpaid delivery order |
| `ACTIVE_RESERVATIONS_WARNING` | 400 | Active reservations (account deletion) |
| `CANCELLATION_TOO_LATE` | 400 | Cancellation < 24h before reservation |
| `CAPACITY_EXCEEDED` | 400 | Table capacity exceeded |

### Payments

| Code | Status | Description |
|------|--------|-------------|
| `PAYMENT_SERVICE_UNAVAILABLE` | 503 | Stripe not configured |
| `PAYMENT_NOT_COMPLETED` | 400 | Payment not finalized |

---

## Rate Limiting

> **Note:** Disabled in development mode

| Endpoint | Limit | Window |
|----------|-------|--------|
| `POST /api/auth/register` | 5 req | 15 min |
| `POST /api/auth/login` | 10 req | 15 min |
| `/api/payments/*` | 30 req | 15 min |
| `/api/admin/*` | 30 req | 15 min |
| All `/api/*` | 100 req | 15 min |
| `POST /api/contact` | 3 req | 1 hour |

---

## Endpoints

---

### Auth (`/api/auth`)

#### `POST /api/auth/register`

Register a new user.

**Access:** Public

**Request Body:**
```typescript
{
  name: string,          // 2-50 characters
  email: string,         // Valid email format
  password: string,      // Min 6 characters
  phone?: string         // 10 digits (optional)
}
```

**Response (201):**
```typescript
{
  success: true,
  message: "User registered successfully. Please check your email to verify your account.",
  accessToken: string,
  user: User
}
```
+ Cookie `refreshToken` (HttpOnly)

**Errors:** `EMAIL_EXISTS_ERROR`

---

#### `POST /api/auth/login`

User login.

**Access:** Public

**Request Body:**
```typescript
{
  email: string,
  password: string,
  rememberMe?: boolean   // false = 24h, true = 7 days
}
```

**Response (200):**
```typescript
{
  success: true,
  message: "Login successful",
  accessToken: string,
  user: User
}
```
+ Cookie `refreshToken` (HttpOnly)

**Errors:** `INVALID_CREDENTIALS`, `ACCOUNT_LOCKED`, `ACCOUNT_DELETED`, `ACCOUNT_INACTIVE`

---

#### `POST /api/auth/refresh`

Renew the access token using the refresh token cookie.

**Access:** Public (uses cookie)

**Request Body:** Empty

**Response (200):**
```typescript
{
  success: true,
  accessToken: string
}
```

**Errors:** `AUTH_NO_REFRESH_TOKEN`, `AUTH_INVALID_REFRESH_TOKEN`

---

#### `GET /api/auth/me`

Get the connected user's profile.

**Access:** Protected

**Response (200):**
```typescript
{
  success: true,
  user: User  // Full profile with address, notifications, etc.
}
```

---

#### `PUT /api/auth/profile`

Update user profile.

**Access:** Protected

**Request Body:**
```typescript
{
  name?: string,
  email?: string,
  phone?: string | null,
  address?: {
    street?: string | null,
    city?: string | null,
    state?: string | null,
    zipCode?: string | null    // 5 digits
  },
  notifications?: {
    newsletter?: boolean,
    promotions?: boolean
  },
  currentPassword?: string,    // Required if newPassword
  newPassword?: string
}
```

**Response (200):**
```typescript
{
  success: true,
  message: "Profile updated successfully",
  user: User
}
```

---

#### `POST /api/auth/logout`

Logout (revokes the refresh token).

**Access:** Protected

**Response (200):**
```typescript
{
  success: true,
  message: "Logged out successfully"
}
```

---

#### `POST /api/auth/logout-all`

Logout from all devices.

**Access:** Protected

**Response (200):**
```typescript
{
  success: true,
  message: "Logged out from all devices",
  details: {
    revokedSessions: number
  }
}
```

---

#### `DELETE /api/auth/delete-account`

Delete account (soft delete).

**Access:** Protected

**Request Body (1st call):** Empty

**Request Body (2nd call if warning):**
```typescript
{
  confirmCancelReservations: true
}
```

**Response (200):**
```typescript
{
  success: true,
  message: "Account deleted successfully"
}
```

**Warning Response (400) - `ACTIVE_RESERVATIONS_WARNING`:**
```typescript
{
  success: false,
  code: "ACTIVE_RESERVATIONS_WARNING",
  message: "You have active reservations...",
  data: {
    count: number,
    reservations: Reservation[]
  }
}
```

**Blocking Response (400) - `UNPAID_DELIVERY_ORDERS`:**
```typescript
{
  success: false,
  code: "UNPAID_DELIVERY_ORDERS",
  message: "Cannot delete account with unpaid delivery order...",
  data: {
    count: number,
    orders: Order[]
  }
}
```

---

### Email (`/api/email`)

#### `GET /api/email/verify/:token`

Verify email with the token received by email.

**Access:** Public

**Response (200):**
```typescript
{
  success: true,
  message: "Email verified successfully"
}
```

---

#### `POST /api/email/resend-verification`

Resend verification email.

**Access:** Public

**Request Body:**
```typescript
{
  email: string
}
```

---

#### `POST /api/email/forgot-password`

Request password reset.

**Access:** Public

**Request Body:**
```typescript
{
  email: string
}
```

---

#### `POST /api/email/reset-password/:token`

Reset password.

**Access:** Public

**Request Body:**
```typescript
{
  password: string    // Min 6 characters
}
```

---

### Menu (`/api/menu`)

#### `GET /api/menu`

List all menu items.

**Access:** Public

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Current page |
| `limit` | number | 20 | Items per page |
| `category` | string | - | `appetizer`, `main`, `dessert`, `beverage` |
| `vegetarian` | boolean | - | Filter vegetarian |
| `search` | string | - | Search name/description |

**Response (200):**
```typescript
{
  success: true,
  count: number,
  total: number,
  pagination: Pagination,
  data: MenuItem[]
}
```

---

#### `GET /api/menu/popular`

Return popular items (8 items).

**Access:** Public

**Distribution:** 2 appetizers, 3 mains, 1 dessert, 2 beverages

**Response (200):**
```typescript
{
  success: true,
  count: 8,
  data: MenuItem[]
}
```

---

#### `GET /api/menu/suggestions`

Return restaurant suggestions.

**Access:** Public

**Response (200):**
```typescript
{
  success: true,
  count: number,
  data: MenuItem[]  // Items with isSuggested: true
}
```

---

#### `GET /api/menu/:id`

Menu item details.

**Access:** Public

**Response (200):**
```typescript
{
  success: true,
  data: MenuItem  // Includes reviews and rating
}
```

---

#### `POST /api/menu/:id/review`

Add a review on an item.

**Access:** Protected + Email Verified

**Request Body:**
```typescript
{
  rating: number,     // 1-5
  comment?: string    // Max 500 characters
}
```

**Response (200):**
```typescript
{
  success: true,
  message: "Review added successfully",
  data: MenuItem  // With updated reviews
}
```

---

#### `GET /api/menu/:id/review`

List reviews for an item.

**Access:** Public

**Response (200):**
```typescript
{
  success: true,
  count: number,
  data: Review[]
}
```

---

#### `GET /api/menu/:id/rating`

Rating statistics for an item.

**Access:** Public

**Response (200):**
```typescript
{
  success: true,
  data: {
    average: number,  // 0-5
    count: number
  }
}
```

---

#### `POST /api/menu` (Admin)

Create a new item.

**Access:** Protected + Admin

**Request Body:**
```typescript
{
  name: string,           // 2-100 characters
  description: string,    // 10-500 characters
  price: number,          // Positive
  category: "appetizer" | "main" | "dessert" | "beverage",
  cuisine?: "asian" | "lao" | "continental" | null,
  preparationTime?: number,  // Minutes, 0 allowed
  isVegetarian?: boolean | null,
  isAvailable?: boolean,
  ingredients?: string[],
  allergens?: string[],
  spiceLevel?: "mild" | "medium" | "hot" | "very-hot" | null,
  image?: string,
  cloudinaryPublicId?: string
}
```

---

#### `PUT /api/menu/:id` (Admin)

Update an item.

**Access:** Protected + Admin

**Request Body:** Same fields as POST (all optional)

---

#### `DELETE /api/menu/:id` (Admin)

Delete an item.

**Access:** Protected + Admin

---

### Reviews (Menu Items) (`/api/review`)

#### `PUT /api/review/:reviewId`

Update own review.

**Access:** Protected + Email Verified

**Request Body:**
```typescript
{
  rating?: number,    // 1-5
  comment?: string    // Max 500 characters
  // At least one field required
}
```

---

#### `DELETE /api/review/:reviewId`

Delete own review.

**Access:** Protected + Email Verified (or Admin)

---

### Restaurant Reviews (`/api/restaurant`)

#### `GET /api/restaurant/reviews`

List restaurant reviews.

**Access:** Public

**Query Parameters:**
| Param | Type | Default |
|-------|------|---------|
| `page` | number | 1 |
| `limit` | number | 10 |

**Response (200):**
```typescript
{
  success: true,
  count: number,
  total: number,
  pagination: Pagination,
  data: RestaurantReview[]
}
```

---

#### `GET /api/restaurant/rating`

Restaurant rating statistics.

**Access:** Public

**Response (200):**
```typescript
{
  success: true,
  data: {
    totalReviews: number,
    ratings: {
      overall: { average: number, count: number },
      service: { average: number, count: number },
      ambiance: { average: number, count: number },
      food: { average: number, count: number },
      value: { average: number, count: number }
    }
  }
}
```

---

#### `POST /api/restaurant/review`

Add a restaurant review.

**Access:** Protected + Email Verified

**Request Body:**
```typescript
{
  ratings: {
    overall: number,      // 1-5, REQUIRED
    service?: number,     // 1-5, optional
    ambiance?: number,    // 1-5, optional
    food?: number,        // 1-5, optional
    value?: number        // 1-5, optional
  },
  comment?: string,       // Max 500 characters
  visitDate?: string      // ISO 8601
}
```

---

#### `PUT /api/restaurant/review/:id`

Update own review.

**Access:** Protected + Email Verified

---

#### `DELETE /api/restaurant/review/:id`

Delete own review.

**Access:** Protected + Email Verified

---

### Orders (`/api/orders`)

#### `POST /api/orders`

Create a new order.

**Access:** Protected + Email Verified

**Request Body:**
```typescript
{
  items: Array<{
    menuItem: string,              // MenuItem ObjectId
    quantity: number,              // Min 1
    specialInstructions?: string   // Max 100 characters
  }>,
  orderType: "pickup" | "delivery",
  phone: string,                   // 10 digits
  paymentMethod?: "cash" | "card",
  paymentStatus?: "pending" | "paid",
  deliveryAddress?: {              // Required if delivery
    street: string,
    city: string,
    zipCode: string,
    instructions?: string          // Max 200 characters
  },
  specialInstructions?: string     // Max 200 characters
}
```

**Response (201):**
```typescript
{
  success: true,
  message: "Order created successfully",
  data: Order
}
```

---

#### `GET /api/orders`

List user's orders.

**Access:** Protected

**Query Parameters:**
| Param | Type | Default |
|-------|------|---------|
| `page` | number | 1 |
| `limit` | number | 10 |
| `status` | string | - |

---

#### `GET /api/orders/:id`

Order details.

**Access:** Protected (owner or admin)

---

#### `DELETE /api/orders/:id`

Cancel an order.

**Access:** Protected (owner)

**Restrictions:**
- Status must be `pending` or `confirmed`
- `paymentStatus` must not be `paid`

**Error Response (400) if paid:**
```typescript
{
  success: false,
  message: "Cannot cancel paid orders",
  data: {
    orderId: string,
    paymentStatus: "paid",
    message: "This order has already been paid...",
    suggestion: "Please contact customer service...",
    contactEmail: string,
    contactPhone: string
  }
}
```

---

#### `GET /api/orders/admin` (Admin)

List all orders.

**Access:** Protected + Admin

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `page` | number | |
| `limit` | number | |
| `status` | string | |
| `orderType` | string | `pickup`, `delivery` |
| `paymentMethod` | string | `cash`, `card` |
| `search` | string | Search orderNumber, userName, userEmail |

---

#### `PATCH /api/orders/:id/status` (Admin)

Update order status.

**Access:** Protected + Admin

**Request Body:**
```typescript
{
  status: "pending" | "confirmed" | "preparing" | "ready" | "out-for-delivery" | "delivered" | "cancelled"
}
```

**Side Effects:**
- `delivered` → Increments item `orderCount` + updates user stats

---

#### `DELETE /api/orders/:id/delete` (Admin)

Delete an order (hard delete).

**Access:** Protected + Admin

**Restriction:** Only `delivered` or `cancelled`

---

#### `GET /api/orders/admin/recent` (Admin)

Orders from the last 15 days.

**Access:** Protected + Admin

---

#### `GET /api/orders/admin/history` (Admin)

Order history (> 15 days).

**Access:** Protected + Admin

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `startDate` | string | Yes | ISO 8601 |
| `endDate` | string | Yes | ISO 8601 |
| `page` | number | No | |
| `limit` | number | No | Max 50 |

---

#### `GET /api/orders/stats` (Admin)

Order statistics.

**Access:** Protected + Admin

**Response (200):**
```typescript
{
  success: true,
  data: {
    totalOrders: number,
    totalRevenue: number,
    ordersByStatus: {
      pending: number,
      confirmed: number,
      preparing: number,
      ready: number,
      delivered: number,
      cancelled: number
    }
  }
}
```

---

### Reservations (`/api/reservations`)

#### `POST /api/reservations`

Create a reservation.

**Access:** Protected + Email Verified

**Request Body:**
```typescript
{
  date: string,           // ISO 8601, >= today
  slot: number,           // Time slot
  guests: number,         // 1-20
  tableNumber: number[],  // Table IDs
  specialRequest?: string, // Max 200 characters
  contactPhone: string    // 10 digits
}
```

**Error Response (400) - `CAPACITY_EXCEEDED`:**
```typescript
{
  success: false,
  code: "CAPACITY_EXCEEDED",
  message: "Total table capacity exceeds maximum for party size",
  data: {
    requestedGuests: number,
    selectedTables: number[],
    totalCapacity: number,
    maxCapacity: number,
    suggestedTables: number[]
  }
}
```

---

#### `GET /api/reservations`

List user's reservations.

**Access:** Protected

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `page` | number | |
| `limit` | number | |
| `status` | string | |
| `upcoming` | boolean | Future reservations |
| `past` | boolean | Past reservations |

---

#### `PUT /api/reservations/:id`

Update own reservation.

**Access:** Protected (owner) + Email Verified

**Restrictions:**
- Status must be `confirmed`
- At least 24h before reservation

---

#### `DELETE /api/reservations/:id`

Cancel own reservation.

**Access:** Protected (owner)

**Restrictions:**
- Status must be `confirmed`
- At least 24h before reservation

**Error Response (400) - `CANCELLATION_TOO_LATE`:**
```typescript
{
  success: false,
  code: "CANCELLATION_TOO_LATE",
  message: "Cannot cancel reservation within 24 hours...",
  data: {
    hoursUntil: number,
    minimumHoursRequired: 24
  }
}
```

---

#### `GET /api/reservations/admin/recent` (Admin)

Reservations from the last 15 days.

**Access:** Protected + Admin

---

#### `GET /api/reservations/admin/history` (Admin)

Reservation history.

**Access:** Protected + Admin

**Query Parameters:** Same as orders/admin/history

---

#### `PATCH /api/reservations/admin/:id/status` (Admin)

Update status.

**Access:** Protected + Admin

**Request Body:**
```typescript
{
  status: "confirmed" | "seated" | "completed" | "cancelled" | "no-show"
}
```

---

#### `PUT /api/reservations/admin/:id` (Admin)

Update a reservation.

**Access:** Protected + Admin

---

#### `GET /api/reservations/admin/stats` (Admin)

Reservation statistics.

**Access:** Protected + Admin

---

### Tables (`/api/tables`)

#### `GET /api/tables/availability`

Table availability for a date.

**Access:** Protected

**Query Parameters:**
| Param | Type | Required |
|-------|------|----------|
| `date` | string | Yes |

---

#### `GET /api/tables/available`

Available tables for a slot.

**Access:** Protected

**Query Parameters:**
| Param | Type | Required |
|-------|------|----------|
| `date` | string | Yes |
| `slot` | number | Yes |

---

#### `GET /api/tables` (Admin)

List all tables.

**Access:** Protected + Admin

---

#### `GET /api/tables/:id` (Admin)

Table details.

**Access:** Protected + Admin

---

#### `PUT /api/tables/:id` (Admin)

Update a table.

**Access:** Protected + Admin

---

#### `POST /api/tables/initialize` (Admin)

Initialize default tables (22 tables).

**Access:** Protected + Admin

---

### Payments (`/api/payments`)

#### `GET /api/payments/methods`

List available payment methods.

**Access:** Protected

**Response (200):**
```typescript
{
  success: true,
  data: {
    methods: Array<{
      id: string,
      name: string,
      type: "gateway" | "offline",
      currencies: string[],
      enabled: boolean
    }>
  }
}
```

---

#### `POST /api/payments/stripe/create-intent`

Create a Stripe Payment Intent.

**Access:** Protected + Email Verified

**Request Body:**
```typescript
{
  amount: number,            // Positive amount
  currency?: string          // "usd" | "eur" | "gbp" (default: "usd")
}
```

**Response (200):**
```typescript
{
  success: true,
  data: {
    clientSecret: string,
    paymentIntentId: string
  }
}
```

---

#### `POST /api/payments/stripe/confirm`

Confirm a Stripe payment.

**Access:** Protected + Email Verified

**Request Body:**
```typescript
{
  paymentIntentId: string
}
```

**Response (200):**
```typescript
{
  success: true,
  message: "Payment confirmed successfully",
  data: {
    paymentIntentId: string,
    amount: number,
    status: "succeeded"
  }
}
```

---

### Contact (`/api/contact`)

#### `POST /api/contact`

Submit contact form.

**Access:** Public (optional auth)

**Request Body:**
```typescript
{
  name: string,           // 2-100 characters
  email: string,
  phone?: string,         // 10-15 characters with +, spaces, dashes
  subject: string,        // 5-200 characters
  message: string         // 10-1000 characters
}
```

**Response (200):**
```typescript
{
  success: true,
  message: "Thank you for your message! We will get back to you soon.",
  data: {
    id: string,
    submittedAt: string
  }
}
```

---

#### `GET /api/contact/my-messages`

List own contact messages.

**Access:** Protected

---

#### `PATCH /api/contact/:id/reply`

Reply to a message.

**Access:** Protected (owner or admin)

**Request Body:**
```typescript
{
  text: string    // 1-1000 characters
}
```

---

#### `PATCH /api/contact/:id/discussion/:discussionId/status`

Mark a discussion message as read.

**Access:** Protected

**Request Body:**
```typescript
{
  status: "read"
}
```

---

#### `GET /api/contact/admin/messages` (Admin)

List all messages.

**Access:** Protected + Admin

**Query Parameters:**
| Param | Type |
|-------|------|
| `page` | number |
| `limit` | number |
| `status` | `new`, `read`, `replied`, `newlyReplied`, `closed` |

---

#### `PATCH /api/contact/admin/messages/:id/status` (Admin)

Update message status.

**Access:** Protected + Admin

---

#### `DELETE /api/contact/admin/messages/:id` (Admin)

Archive a message (soft delete).

**Access:** Protected + Admin

---

#### `GET /api/contact/admin/messages/deleted` (Admin)

List archived messages.

**Access:** Protected + Admin

---

#### `PATCH /api/contact/admin/messages/:id/restore` (Admin)

Restore an archived message.

**Access:** Protected + Admin

---

### Newsletter (`/api/newsletter`)

#### `POST /api/newsletter/send` (Admin)

Send a newsletter.

**Access:** Protected + Admin

---

#### `POST /api/newsletter/promotion` (Admin)

Send a promotional email.

**Access:** Protected + Admin

---

#### `GET /api/newsletter/stats` (Admin)

Subscription statistics.

**Access:** Protected + Admin

---

#### `GET /api/newsletter/unsubscribe/newsletter/:userId`

Unsubscribe from newsletter.

**Access:** Public

---

#### `GET /api/newsletter/unsubscribe/promotions/:userId`

Unsubscribe from promotions.

**Access:** Public

---

### Admin (`/api/admin`)

#### `GET /api/admin/stats`

Dashboard statistics.

**Access:** Protected + Admin

**Response (200):**
```typescript
{
  success: true,
  data: {
    totalMenuItems: number,
    activeMenuItems: number,
    inactiveMenuItems: number,
    quickStats: {
      totalOrders: number,
      totalReservations: number,
      totalUsers: number,
      totalRevenue: number
    },
    orders: {
      pending: number,
      confirmed: number,
      delivered: number,
      cancelled: number
    },
    reservations: {
      confirmed: number,
      completed: number,
      cancelled: number
    },
    revenue: {
      today: number,
      week: number,
      month: number
    }
  }
}
```

---

#### `GET /api/admin/users/:userId/orders`

User's orders.

**Access:** Protected + Admin

---

#### `GET /api/admin/users/:userId/reservations`

User's reservations.

**Access:** Protected + Admin

---

#### `GET /api/admin/menu/popular`

Popular overrides status.

**Access:** Protected + Admin

---

#### `PATCH /api/admin/menu/:id/popular`

Toggle item exclusion from popular.

**Access:** Protected + Admin

**Response (200):**
```typescript
{
  success: true,
  message: "Menu item excluded from popular items",
  data: {
    toggledItem: {
      id: string,
      name: string,
      category: string,
      isPopularOverride: boolean
    },
    popularItems: MenuItem[]  // Updated list
  }
}
```

---

#### `PATCH /api/admin/menu/popular/reset`

Reset all popular overrides.

**Access:** Protected + Admin

---

#### `GET /api/admin/menu/suggested`

List suggested items.

**Access:** Protected + Admin

---

#### `PATCH /api/admin/menu/:id/suggested`

Toggle item suggested status.

**Access:** Protected + Admin

---

### Users (Admin) (`/api/users`)

#### `GET /api/users` (Admin)

List all users.

**Access:** Protected + Admin

---

#### `GET /api/users/stats` (Admin)

User statistics.

**Access:** Protected + Admin

---

#### `GET /api/users/:id` (Admin)

User details.

**Access:** Protected + Admin

---

#### `PUT /api/users/:id` (Admin)

Update a user.

**Access:** Protected + Admin

**Request Body:**
```typescript
{
  role?: "user" | "admin",
  isActive?: boolean
}
```

---

#### `DELETE /api/users/:id` (Admin)

Delete a user.

**Access:** Protected + Admin

---

#### `GET /api/users/admin` (Admin)

List administrators.

**Access:** Protected + Admin

---

## Types and Interfaces

### User

```typescript
interface User {
  _id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "user" | "admin";
  isActive: boolean;
  isEmailVerified: boolean;
  address: {
    street: string | null;
    city: string | null;
    state: string | null;
    zipCode: string | null;
  };
  notifications: {
    newsletter: boolean;
    promotions: boolean;
  };
  totalOrders: number;
  totalReservations: number;
  totalSpent: number;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
}
```

### MenuItem

```typescript
interface MenuItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: "appetizer" | "main" | "dessert" | "beverage";
  cuisine: "asian" | "lao" | "continental" | null;
  preparationTime: number;
  isVegetarian: boolean | null;
  isAvailable: boolean;
  image: string | null;
  ingredients: string[];
  allergens: string[];
  spiceLevel: "mild" | "medium" | "hot" | "very-hot" | null;
  rating: {
    average: number;
    count: number;
  };
  reviews: Review[];
  isPopular: boolean;        // Dynamically calculated
  isPopularOverride: boolean;
  isSuggested: boolean;
  orderCount: number;
  createdAt: string;
  updatedAt: string;
}
```

### Review (Menu Item)

```typescript
interface Review {
  _id: string;
  user: {
    id: string;
    name: string;
  };
  rating: number;           // 1-5
  comment: string | null;
  createdAt: string;
}
```

### RestaurantReview

```typescript
interface RestaurantReview {
  _id: string;
  user: {
    id: string;
    name: string;
  };
  ratings: {
    overall: number;        // 1-5, required
    service: number | null;
    ambiance: number | null;
    food: number | null;
    value: number | null;
  };
  comment: string | null;
  visitDate: string | null;
  createdAt: string;
  updatedAt: string;
}
```

### Order

```typescript
interface Order {
  _id: string;
  orderNumber: string;        // Format: ORD-XXXXXX
  userId: string;
  userName: string;
  userEmail: string;
  phone: string;
  items: Array<{
    menuItem: string;
    name: string;
    image: string;
    price: number;
    quantity: number;
    specialInstructions: string | null;
  }>;
  totalPrice: number;
  orderType: "pickup" | "delivery";
  status: "pending" | "confirmed" | "preparing" | "ready" | "out-for-delivery" | "delivered" | "cancelled";
  paymentStatus: "pending" | "paid";
  paymentMethod: "cash" | "card";
  deliveryAddress: {
    street: string;
    city: string;
    zipCode: string;
    instructions: string | null;
  } | null;
  specialInstructions: string | null;
  createdAt: string;
  updatedAt: string;
}
```

### Reservation

```typescript
interface Reservation {
  _id: string;
  reservationNumber: string;  // Format: YYYYMMDD-HHMM-T1-T2
  userId: string;
  userName: string;
  userEmail: string;
  date: string;
  slot: number;
  guests: number;
  tableNumber: number[];
  status: "confirmed" | "seated" | "completed" | "cancelled" | "no-show";
  specialRequest: string | null;
  contactPhone: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}
```

### Table

```typescript
interface Table {
  _id: string;
  tableNumber: number;        // 1-22
  capacity: number;           // 1-12
  isActive: boolean;
  notes: string | null;
  tableBookings: Array<{
    date: string;
    bookedSlots: number[];    // 1-15
  }>;
  createdAt: string;
  updatedAt: string;
}
```

### Contact

```typescript
interface Contact {
  _id: string;
  userId: string | null;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: "new" | "read" | "replied" | "newlyReplied" | "closed";
  discussion: Array<{
    _id: string;
    userId: string;
    name: string;
    role: "admin" | "user";
    text: string;
    date: string;
    status: "new" | "read";
  }>;
  isDeleted: boolean;
  deletedBy: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
```

### Pagination

```typescript
interface Pagination {
  next?: {
    page: number;
    limit: number;
  };
  prev?: {
    page: number;
    limit: number;
  };
}
```

---

## Authentication Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                         REGISTRATION                              │
├──────────────────────────────────────────────────────────────────┤
│ 1. POST /api/auth/register                                        │
│    └─→ Receives accessToken + refreshToken (cookie)               │
│ 2. Verification email sent                                        │
│ 3. GET /api/email/verify/:token                                   │
│    └─→ Email verified                                             │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                            LOGIN                                  │
├──────────────────────────────────────────────────────────────────┤
│ 1. POST /api/auth/login                                           │
│    └─→ Receives accessToken + refreshToken (cookie)               │
│ 2. Store accessToken (memory/localStorage)                        │
│ 3. Use Header: Authorization: Bearer <accessToken>                │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                      TOKEN RENEWAL                                │
├──────────────────────────────────────────────────────────────────┤
│ 1. Request fails with 401 + code AUTH_TOKEN_EXPIRED               │
│ 2. POST /api/auth/refresh (cookie sent automatically)             │
│    └─→ Receives new accessToken                                   │
│ 3. Replay original request                                        │
│                                                                   │
│ If refresh fails (AUTH_INVALID_REFRESH_TOKEN):                    │
│    └─→ Redirect to /login                                         │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                           LOGOUT                                  │
├──────────────────────────────────────────────────────────────────┤
│ 1. POST /api/auth/logout                                          │
│    └─→ Refresh token revoked + cookies deleted                    │
│ 2. Delete accessToken on client side                              │
│ 3. Redirect to /login                                             │
└──────────────────────────────────────────────────────────────────┘
```

---

## Health Check

#### `GET /api/health`

Check API status.

**Access:** Public

**Response (200):**
```typescript
{
  success: true,
  message: "API is running",
  timestamp: string
}
```

---

## Development Notes

### CORS

In development, CORS is configured for:
- `http://localhost:3000`
- `http://localhost:3001`
- `http://localhost:3002`

### Cookies

The `refreshToken` cookie is configured with:
- `httpOnly: true`
- `secure: true` (production)
- `sameSite: 'strict'`

### Phone Validation

- Standard format: `/^[0-9]{10}$/` (10 digits)
- Contact form: `/^[+]?[0-9\s\-()]{10,15}$/`

### Time Slots

Slots are numbered from 1 to 15 and correspond to reservation time slots.

---

> **Note:** This document is automatically generated and should be updated when backend API changes occur.
