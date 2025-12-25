# RestOh Frontend - Architecture

> Restaurant management application built with React 18 + Vite
> Connected to a REST API backend with HTTP-only cookie authentication

---

## Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | React 18 + Vite |
| **State** | Zustand (with localStorage persistence) |
| **Forms** | React Hook Form |
| **HTTP** | Axios (with interceptors) |
| **Routing** | React Router v6 |
| **Styling** | Tailwind CSS |
| **Icons** | Lucide React |
| **Notifications** | React Hot Toast |
| **Testing** | Vitest + RTL (1620 tests) + Playwright E2E |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         COMPONENTS                               │
│    Pages, Layout, Common UI                                      │
└────────────────────────────┬────────────────────────────────────┘
                             │ use
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                           HOOKS                                  │
│    useAuth, useCart, useMenu, useOrders, useReservations        │
│    (UX logic: navigation, toasts, form handling)                │
└────────────────────────────┬────────────────────────────────────┘
                             │ use
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   STORES (Zustand)                               │
│    authStore, cartStore, menuStore, ordersStore, etc.           │
│    (State + API calls orchestration)                            │
└───────────────┬─────────────────────────────┬───────────────────┘
                │ use                         │ use
                ▼                             ▼
┌───────────────────────────┐   ┌─────────────────────────────────┐
│         SERVICES          │   │           API LAYER             │
│  Business logic, filters  │   │   Axios calls to backend        │
│  stats, validation        │   │   (apiClient + *Api.js)         │
└───────────────────────────┘   └─────────────────────────────────┘
                                              │
                                              ▼
                                    ┌─────────────────┐
                                    │  REST API       │
                                    │  (Backend)      │
                                    └─────────────────┘
```

---

## Directory Structure

```
src/
├── api/                      # HTTP layer
│   ├── apiClient.js          # Axios instance + interceptors
│   ├── authApi.js            # Auth endpoints
│   ├── menuApi.js            # Menu CRUD
│   ├── ordersApi.js          # Orders CRUD
│   ├── reservationsApi.js    # Reservations CRUD
│   ├── contactsApi.js        # Contact messages
│   ├── emailApi.js           # Email verification, password reset
│   ├── reviewsApi.js         # Menu item reviews
│   ├── restaurantReviewsApi.js  # Restaurant reviews
│   ├── statsApi.js           # Dashboard statistics
│   ├── tablesApi.js          # Table availability
│   ├── usersApi.js           # User management (admin)
│   └── index.js              # Centralized exports
│
├── store/                    # Zustand stores
│   ├── authStore.js          # User, tokens, auth actions
│   ├── cartStore.js          # Shopping cart (per user)
│   ├── menuStore.js          # Menu items + categories
│   ├── ordersStore.js        # User/admin orders
│   ├── reservationsStore.js  # User/admin reservations
│   ├── contactsStore.js      # Contact messages (admin)
│   ├── usersStore.js         # User management (admin)
│   ├── reviewsStore.js       # Menu item reviews
│   ├── restaurantReviewsStore.js  # Restaurant reviews
│   └── statsStore.js         # Dashboard stats (admin)
│
├── services/                 # Business logic layer
│   ├── auth/
│   │   ├── authService.js    # Password helpers, user utils
│   │   └── authValidator.js  # Credentials validation
│   ├── menu/
│   │   ├── menuService.js    # Cart enrichment, calculations
│   │   ├── menuFilters.js    # Category/search filtering
│   │   └── menuValidator.js  # Menu item validation
│   ├── orders/
│   │   ├── orderService.js   # Status display, helpers
│   │   ├── orderFilters.js   # Status/date filtering
│   │   ├── orderStats.js     # Revenue, count calculations
│   │   └── orderValidator.js # Order data validation
│   ├── reservations/
│   │   ├── reservationService.js  # Formatting, helpers
│   │   ├── reservationFilters.js  # Date/status filtering
│   │   ├── reservationStats.js    # Guest counts, trends
│   │   └── reservationValidator.js
│   └── contacts/
│       ├── contactService.js      # Message formatting
│       └── contactValidator.js
│
├── hooks/                    # Custom React hooks
│   ├── useAuth.js            # Login/logout with navigation + toasts
│   ├── useCart.js            # Cart actions with toasts
│   ├── useMenu.js            # Menu browsing helpers
│   ├── useOrders.js          # Order actions with feedback
│   └── useReservations.js    # Reservation flow
│
├── components/
│   ├── layout/
│   │   ├── Layout.jsx        # Main layout with Header/Footer
│   │   ├── Header.jsx        # Navigation, auth state
│   │   └── Footer.jsx
│   ├── admin/
│   │   └── AdminLayout.jsx   # Admin sidebar + layout
│   ├── common/
│   │   ├── ProtectedRoute.jsx   # Auth guard
│   │   ├── CartModal.jsx        # Sliding cart panel
│   │   ├── CustomDatePicker.jsx # Date selection
│   │   ├── StarRating.jsx       # Rating input/display
│   │   ├── ImageUpload.jsx      # Cloudinary upload
│   │   ├── EmailVerificationBanner.jsx
│   │   └── ...
│   ├── reservations/
│   │   └── TableMap.jsx      # Interactive table selection
│   ├── reviews/
│   │   ├── ReviewCard.jsx
│   │   └── AddReviewForm.jsx
│   ├── restaurant-reviews/
│   │   ├── RestaurantReviewCard.jsx
│   │   ├── RestaurantReviewForm.jsx
│   │   └── RestaurantStats.jsx
│   └── profile/
│       └── DeleteAccountModal.jsx  # Multi-step deletion
│
├── pages/
│   ├── public/
│   │   └── Home.jsx          # Landing page
│   ├── auth/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── ForgotPassword.jsx
│   │   ├── ResetPassword.jsx
│   │   └── VerifyEmail.jsx
│   ├── menu/
│   │   └── Menu.jsx          # Menu browsing + cart
│   ├── checkout/
│   │   └── Checkout.jsx      # Order placement
│   ├── orders/
│   │   └── Orders.jsx        # User order history
│   ├── reservations/
│   │   └── Reservations.jsx  # Reservation form + history
│   ├── reviews/
│   │   └── RestaurantReviews.jsx
│   ├── contact/
│   │   ├── Contact.jsx       # Contact form
│   │   └── MyMessages.jsx    # User's message history
│   ├── profile/
│   │   └── Profile.jsx       # User settings
│   └── admin/
│       ├── Dashboard.jsx     # Stats overview
│       ├── MenuManagement.jsx
│       ├── OrdersManagement.jsx
│       ├── ReservationsManagement.jsx
│       ├── UsersManagement.jsx
│       └── ContactsManagement.jsx
│
├── contexts/
│   └── CartUIContext.jsx     # Cart modal open/close state
│
├── utils/
│   ├── formValidators.js     # React Hook Form rules
│   ├── dateUtils.js          # Date formatting
│   ├── reservationSlots.js   # Time slot definitions
│   ├── tablesConfig.js       # Restaurant table layout
│   ├── pluralize.js          # Text helpers
│   └── crypto.js             # Token utilities
│
├── constants/
│   └── index.js              # Routes, statuses, restaurant info
│
└── __tests__/                # Unit + integration tests
    ├── api/                  # API layer tests
    ├── store/                # Store tests
    ├── services/             # Service tests
    ├── hooks/                # Hook tests
    ├── components/           # Component tests
    └── pages/                # Page tests
```

---

## Key Patterns

### 1. API Layer

All HTTP calls go through `apiClient.js` which configures:
- Base URL from environment
- `withCredentials: true` for HTTP-only cookies
- Auto-refresh on 401 with `AUTH_TOKEN_EXPIRED`
- Global error handling (403 → toast, 500 → toast)

```javascript
// Usage
import { authApi, ordersApi } from '@/api'

const result = await authApi.login(credentials)
if (result.success) {
  // Handle success
}
```

### 2. Store Pattern

Zustand stores manage state and orchestrate API calls:

```javascript
const useOrdersStore = create(
  persist(
    (set, get) => ({
      orders: [],
      isLoading: false,

      fetchOrders: async () => {
        set({ isLoading: true })
        const result = await ordersApi.getOrders()
        if (result.success) {
          set({ orders: result.data })
        }
        set({ isLoading: false })
      }
    }),
    { name: 'orders-storage' }
  )
)
```

### 3. Hook Pattern

Hooks add UX layer (navigation, toasts) on top of stores:

```javascript
export const useOrders = () => {
  const navigate = useNavigate()
  const { createOrder } = useOrdersStore()

  const handleCreateOrder = async (data) => {
    const result = await createOrder(data)
    if (result.success) {
      toast.success('Order placed!')
      navigate('/orders')
    } else {
      toast.error(result.error)
    }
  }

  return { createOrder: handleCreateOrder }
}
```

### 4. Service Layer

Pure functions for business logic, easily testable:

```javascript
// services/orders/orderStats.js
export const calculateRevenue = (orders) => {
  return orders
    .filter(o => o.status === 'delivered')
    .reduce((sum, o) => sum + o.totalPrice, 0)
}
```

---

## Authentication Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Login     │────▶│   Backend   │────▶│  Response   │
│   Form      │     │  /auth/login│     │             │
└─────────────┘     └─────────────┘     └─────────────┘
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    │                         │                         │
                    ▼                         ▼                         ▼
            ┌──────────────┐         ┌──────────────┐         ┌──────────────┐
            │ accessToken  │         │ refreshToken │         │    user      │
            │ (in memory)  │         │ (HTTP-only   │         │ (localStorage│
            │              │         │   cookie)    │         │  via Zustand)│
            └──────────────┘         └──────────────┘         └──────────────┘
                    │
                    ▼
            Authorization: Bearer <token>
            (sent with every API request)
```

**Token Refresh**: When a request returns 401 with `AUTH_TOKEN_EXPIRED`, the apiClient automatically calls `/auth/refresh` and retries the request.

---

## Routing

| Route | Component | Auth |
|-------|-----------|------|
| `/` | Home | Public |
| `/menu` | Menu | Public |
| `/reviews` | RestaurantReviews | Public |
| `/contact` | Contact | Public |
| `/login` | Login | Public |
| `/register` | Register | Public |
| `/forgot-password` | ForgotPassword | Public |
| `/verify-email/:token` | VerifyEmail | Public |
| `/reset-password/:token` | ResetPassword | Public |
| `/profile` | Profile | Protected |
| `/orders` | Orders | Protected |
| `/reservations` | Reservations | Protected |
| `/checkout` | Checkout | Protected |
| `/my-messages` | MyMessages | Protected |
| `/admin` | Dashboard | Admin |
| `/admin/menu` | MenuManagement | Admin |
| `/admin/orders` | OrdersManagement | Admin |
| `/admin/reservations` | ReservationsManagement | Admin |
| `/admin/users` | UsersManagement | Admin |
| `/admin/messages` | ContactsManagement | Admin |

---

## State Persistence

Zustand stores use `persist` middleware with localStorage:

| Store | Storage Key | Persisted Data |
|-------|-------------|----------------|
| authStore | `auth-storage` | user, isAuthenticated |
| cartStore | `cart-storage` | items (per userId) |
| menuStore | `menu-storage` | items, categories |
| ordersStore | `orders-storage-v2` | recentOrders (15 days) |
| reservationsStore | `reservations-storage-v2` | recentReservations |

**Note**: Access tokens are stored in memory only (security). Refresh tokens use HTTP-only cookies.

---

## Testing Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│  E2E Tests (Playwright)                                         │
│  17 test files - Critical user journeys                         │
├─────────────────────────────────────────────────────────────────┤
│  Integration Tests (Vitest + RTL)                               │
│  Pages, Components with mocked stores/API                       │
├─────────────────────────────────────────────────────────────────┤
│  Unit Tests (Vitest)                                            │
│  1620 tests - Services, Stores, Hooks, API layer                │
├─────────────────────────────────────────────────────────────────┤
│  Static Analysis (ESLint)                                       │
└─────────────────────────────────────────────────────────────────┘
```

**Test Commands**:
```bash
npm test              # Run all unit/integration tests
npm run test:ui       # Vitest UI
npm run test:coverage # Coverage report
npx playwright test   # E2E tests
```

---

## Environment Variables

```env
VITE_API_URL=http://localhost:5000/api   # Backend API URL
```

---

## Key Business Logic

### Order Status Flow
```
pending → confirmed → preparing → ready → delivered
                                       ↘ cancelled
```

### Reservation Status Flow
```
confirmed → seated → completed
         ↘ cancelled
         ↘ no-show
```

### Payment Logic
- **Card**: `paymentStatus: 'paid'` immediately
- **Cash**: `paymentStatus: 'pending'` until delivery
- Order cancellation blocked if `paymentStatus === 'paid'`

### Account Deletion
Multi-step flow:
1. Check for unpaid delivery orders → Block
2. Check for active reservations → Confirm cancellation
3. Soft delete + anonymize orders/reservations

---

## Related Documentation

- [API_CONTRACT.md](./API_CONTRACT.md) - Backend API specification
- [CLAUDE.md](./CLAUDE.md) - Development guidelines
