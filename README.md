# RestOh! Frontend

A modern, full-featured restaurant management application built with React 18. Customers can browse the menu, place orders, make reservations, and leave reviews. Administrators have access to a comprehensive dashboard for managing all aspects of the restaurant.

> **Live Demo**: Coming soon
> **Backend Repository**: [restoh-backend](https://github.com/ChristopheBouriel/restoh-backend)

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Authentication](#authentication)
- [Testing](#testing)
- [Deployment](#deployment)
- [Documentation](#documentation)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Features

### Customer Features

| Feature | Description |
|---------|-------------|
| **Menu Browsing** | Browse dishes by category (appetizers, mains, desserts, beverages) with search and filtering. View dish details including ingredients, allergens, preparation time, and spice level. |
| **Shopping Cart** | Add items with special instructions, adjust quantities, persistent cart per user (survives page refresh and logout). |
| **Online Ordering** | Choose between pickup and delivery. Card payment (Stripe-ready) or cash on delivery. Real-time order status tracking. |
| **Table Reservations** | Interactive table map showing real-time availability. Select date, time slot (lunch/dinner), and party size. Tables filtered by capacity. Special requests supported. |
| **Reviews & Ratings** | Rate menu items (1-5 stars with comments). Rate the restaurant on multiple criteria (overall, food, service, ambiance, value). View aggregated ratings and recent reviews on homepage. |
| **User Profile** | Update personal information and delivery address. Change password with current password verification. Notification preferences (newsletter, promotions). |
| **Account Deletion** | GDPR-compliant multi-step deletion process. Blocks deletion if unpaid delivery orders exist. Confirms cancellation of active reservations. Anonymizes historical data. |
| **Contact & Messaging** | Send messages to restaurant. View conversation history with reply notifications. |

### Admin Features

| Feature | Description |
|---------|-------------|
| **Dashboard** | Real-time statistics from API: today's revenue, orders, reservations, active users. Comparison with previous periods (yesterday, last week, last month). Quick access to pending items. |
| **Menu Management** | Full CRUD for menu items with image upload (Cloudinary). Toggle availability, mark as vegetarian, set spice level. Manage "Popular" and "Chef's Suggestions" sections. |
| **Order Management** | View all orders with filters (status, type, payment method, search). Update order status through workflow (pending → confirmed → preparing → ready → delivered). "Today" filter updates both list and statistics. |
| **Reservation Management** | Calendar view with table assignments. Status workflow (confirmed → seated → completed). Handle no-shows and cancellations. "Today" filter for quick daily overview. |
| **User Management** | View all users with statistics (total orders, reservations, spending). Promote users to admin or deactivate accounts. View individual user history. |
| **Contact Management** | Inbox for customer messages with status tracking (new, read, replied). Threaded conversations. Archive and restore functionality. |

### UI/UX Features

- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Loading States**: Skeleton loaders for smooth perceived performance
- **Toast Notifications**: Success/error feedback for all actions
- **Form Validation**: Real-time validation with React Hook Form
- **Image Optimization**: Lazy loading with fallback images
- **Carousel Components**: Smooth navigation for popular items and suggestions

---

## Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | React 18 + Vite |
| **State Management** | Zustand (with localStorage persistence) |
| **Forms** | React Hook Form |
| **HTTP Client** | Axios (with interceptors for auth) |
| **Routing** | React Router v6 |
| **Styling** | Tailwind CSS |
| **Icons** | Lucide React |
| **Notifications** | React Hot Toast |
| **Date Handling** | date-fns |
| **Testing** | Vitest + React Testing Library + Playwright |

---

## Getting Started

### Prerequisites

- **Node.js** 22.x or higher
- **npm** 9.x or higher
- RestOh backend running ([setup instructions](https://github.com/ChristopheBouriel/restoh-backend))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ChristopheBouriel/restoh-frontend.git
   cd restoh-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   ```

   Edit `.env`:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:5173`

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # ESLint check

# Testing
npm test             # Run all unit tests (1620+ tests)
npm run test:ui      # Vitest UI interface
npm run test:watch   # Watch mode
npm run test:coverage # Coverage report

# E2E Testing
npm run e2e          # Run Playwright tests
npm run e2e:ui       # Playwright UI mode
npm run e2e:headed   # Run with browser visible
npm run e2e:report   # Show test report
```

---

## Project Structure

```
src/
├── api/                  # HTTP layer (Axios client + endpoint modules)
├── store/                # Zustand stores (state + API orchestration)
├── services/             # Business logic (filters, validators, calculations)
├── hooks/                # Custom hooks (UX layer: navigation, toasts)
├── components/           # Reusable UI components
│   ├── common/           # Shared components (CartModal, DatePicker, etc.)
│   ├── layout/           # Header, Footer, Layout
│   ├── admin/            # Admin-specific components
│   └── ...
├── pages/                # Route components
│   ├── public/           # Home
│   ├── auth/             # Login, Register, Password reset
│   ├── menu/             # Menu browsing
│   ├── checkout/         # Order placement
│   ├── reservations/     # Table booking
│   ├── admin/            # Admin dashboard and management
│   └── ...
├── contexts/             # React contexts (UI state)
├── constants/            # Routes, statuses, config
├── utils/                # Utility functions
└── __tests__/            # Test files
```

See [PROJECT_ARCHITECTURE.md](./docs/PROJECT_ARCHITECTURE.md) for detailed architecture documentation.

---

## Authentication

The application uses a secure dual-token architecture:

| Token | Lifetime | Storage | Purpose |
|-------|----------|---------|---------|
| **Access Token** | 15 min | Memory only | API request authentication |
| **Refresh Token** | 24h / 7 days* | HTTP-only cookie | Token renewal |

*7 days when "Remember Me" is checked

### Key Features

- **Auto-refresh**: Expired tokens are automatically refreshed via interceptor
- **Request queuing**: Failed requests are queued and retried after token refresh
- **Session restore**: Sessions persist across page refreshes using refresh token
- **Secure storage**: Refresh tokens are HTTP-only (not accessible via JavaScript)
- **Auto-logout**: Redirect to login when refresh token expires

### Protected Routes

Public pages (login, register, password reset) don't require authentication. All other pages use the `ProtectedRoute` component which:
- Redirects unauthenticated users to login
- Stores intended destination for post-login redirect
- Checks admin role for admin routes

See [API_CONTRACT.md](./API_CONTRACT.md) for complete authentication flow documentation.

---

## Testing

### Test Coverage: 1620+ Unit/Integration Tests

| Layer | Coverage |
|-------|----------|
| **API Layer** | All endpoint modules (auth, orders, reservations, menu, contacts, reviews, etc.) |
| **Stores** | All Zustand stores with mocked API |
| **Services** | Business logic (filters, validators, statistics) |
| **Hooks** | Custom hooks with real stores + mocked API |
| **Components** | UI components with mocked dependencies |
| **Pages** | Full page tests (Dashboard: 56 tests, Menu: 33 tests, etc.) |

### E2E Tests: 17 Test Files (Playwright)

- Authentication flows (login, register, password reset)
- Complete ordering journey
- Reservation booking
- Admin management operations
- Accessibility compliance (axe-core)
- Mobile responsiveness

### Testing Philosophy

```
Tests use REAL stores with MOCKED API responses.
This ensures integration between layers while isolating external dependencies.
```

See [UNIT_TESTS.md](./docs/UNIT_TESTS.md) and [E2E_TESTS.md](./docs/E2E_TESTS.md) for detailed testing documentation.

---

## Deployment

### Production Build

```bash
npm run build
```

Optimized files are generated in `dist/`.

### Vercel / Netlify Deployment

1. Connect your GitHub repository
2. Configure environment variables:
   - `VITE_API_URL` = Your production backend URL
3. Build settings:
   - Build command: `npm run build`
   - Output directory: `dist`

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `https://api.restoh.com/api` |
| `VITE_DEBUG` | Enable debug logging | `true` |

---

## Documentation

| Document | Description |
|----------|-------------|
| [API_CONTRACT.md](./API_CONTRACT.md) | Complete backend API specification |
| [docs/PROJECT_ARCHITECTURE.md](./docs/PROJECT_ARCHITECTURE.md) | Frontend architecture and patterns |
| [docs/UNIT_TESTS.md](./docs/UNIT_TESTS.md) | Unit testing guide and patterns |
| [docs/E2E_TESTS.md](./docs/E2E_TESTS.md) | E2E testing setup and scenarios |
| [docs/EMAIL_SYSTEM_GUIDE.md](./docs/EMAIL_SYSTEM_GUIDE.md) | Email verification and notifications |
| [docs/GITHUB_ACTIONS_GUIDE.md](./docs/GITHUB_ACTIONS_GUIDE.md) | CI/CD pipeline configuration |
| [CLAUDE.md](./CLAUDE.md) | Development guidelines for AI assistance |

---

## Roadmap

### Completed

- [x] Complete menu browsing with categories and search
- [x] Shopping cart with persistence
- [x] Order placement (pickup/delivery)
- [x] Table reservations with interactive map
- [x] User authentication (access + refresh tokens)
- [x] Admin dashboard with real-time statistics
- [x] Menu management with image upload
- [x] Order and reservation management
- [x] User management
- [x] Contact messaging system
- [x] Reviews for menu items and restaurant
- [x] GDPR-compliant account deletion
- [x] Comprehensive test suite (1620+ tests)
- [x] E2E tests with accessibility checks
- [x] CI/CD with GitHub Actions

### Planned

- [ ] Progressive Web App (PWA)
- [ ] Internationalization (i18n) - [Plan available](./INTERNATIONALIZATION_PLAN.md)
- [ ] Dark mode
- [ ] Push notifications
- [ ] PDF invoice export
- [ ] Advanced analytics dashboard
- [ ] Real-time order updates (WebSocket)

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Conventions

- **Components**: PascalCase (`UserProfile.jsx`)
- **Hooks**: camelCase with `use` prefix (`useAuth.js`)
- **Stores**: camelCase with `Store` suffix (`authStore.js`)
- **API modules**: camelCase with `Api` suffix (`authApi.js`)
- **Commits**: Follow [Conventional Commits](https://www.conventionalcommits.org/)

---

## License

This project is licensed under the MIT License.

---

**Built with React + Vite**
