# RestOh Frontend

Modern React restaurant management application with online ordering, reservations, and admin panel.

## Technologies

- **React 18** - UI Library
- **Vite** - Ultra-fast build tool
- **Zustand** - State management with persistence
- **React Router** - Navigation
- **Tailwind CSS** - Utility-first styling
- **Axios** - HTTP client (HTTP-only cookies)
- **React Hot Toast** - Notifications
- **Lucide React** - Modern icons
- **Vitest** - Unit and integration testing
- **React Testing Library** - Component testing

## 📋 Prerequisites

- **Node.js** 22.x or higher
- **npm** 9.x or higher
- RestOh backend running (see backend repository)

## 🛠️ Installation

1. **Clone the repository**
```bash
git clone https://github.com/ChristopheBouriel/restoh-frontend.git
cd restoh-frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` and configure your backend URL:
```env
VITE_API_URL=http://localhost:3000/api
```

4. **Start development server**
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # Lint code with ESLint
npm test             # Run tests (1400+ tests)
npm run test:ui      # Vitest UI interface
npm run test:watch   # Watch mode
npm run test:coverage # Code coverage
```

## Project Structure

```
restoh-frontend/
├── src/
│   ├── api/              # API layer (axios + endpoints)
│   │   ├── apiClient.js
│   │   ├── authApi.js
│   │   ├── ordersApi.js
│   │   ├── reservationsApi.js
│   │   ├── menuApi.js
│   │   ├── contactsApi.js
│   │   ├── emailApi.js
│   │   ├── reviewsApi.js
│   │   └── restaurantReviewsApi.js
│   ├── services/         # Service layer (business logic)
│   │   ├── menu/         # MenuService
│   │   ├── reservations/ # ReservationService
│   │   ├── orders/       # OrderService
│   │   └── auth/         # AuthService
│   ├── components/       # Reusable components
│   ├── constants/        # Constants and enums
│   ├── contexts/         # React Contexts
│   ├── hooks/            # Custom hooks
│   ├── pages/            # Pages/Routes
│   ├── store/            # Zustand stores
│   ├── utils/            # Utility functions
│   ├── __tests__/        # Unit and integration tests
│   ├── App.jsx
│   └── main.jsx
├── public/               # Static assets
├── .env.example          # Configuration example
├── API_ENDPOINTS.md      # Backend endpoints documentation
└── CLAUDE.md            # Claude Code instructions
```

## 🔑 Key Features

### For Customers
- ✅ Browse menu by categories
- ✅ Add to cart with persistence
- ✅ Place orders (card/cash payment)
- ✅ Real-time order tracking
- ✅ Table reservations
- ✅ User profile management
- ✅ Account deletion (GDPR)

### For Administrators
- ✅ Dashboard with statistics
- ✅ Complete menu management
- ✅ Order management (status, payments)
- ✅ Reservation management (table assignment)
- ✅ Contact messaging
- ✅ User management

## Authentication

The application uses HTTP-only cookies for authentication:

- **Session**: Managed by HTTP-only cookies on the backend (secure)
- **Local state**: `user` and `isAuthenticated` persisted in localStorage
- **Auto-logout**: Redirect to `/login` when session expires
- **Public pages**: Login, register, reset-password don't trigger redirects

## 🎨 Customization

### Tailwind CSS
Edit `tailwind.config.js` to customize colors, fonts, etc.

### Constants
Edit `src/constants/index.js` to modify routes, statuses, etc.

## Tests

The project has over **1400 tests** covering:
- **Stores**: authStore, ordersStore, reservationsStore, menuStore, cartStore, contactsStore, usersStore
- **Hooks**: useAuth, useCart, useMenu, useOrders, useReservations
- **Services**: MenuService, ReservationService, OrderService, AuthService, ContactService
- **Components**: Pages, forms, navigation, common components

```bash
npm test              # All tests
npm run test:ui       # Vitest interface
npm run test:coverage # Code coverage (HTML report in coverage/)
npm run test:watch    # Watch mode
```

### Testing Best Practices
- Hook tests use the **real store** with **mocked API** (no mocking the entire store)
- Tests verify against the **specification** (function signature), not the implementation
- External dependencies (toast, navigate, context) are mocked as side effects

## 📡 Backend Integration

This frontend is designed to work with the RestOh backend.

**Full endpoints documentation**: see `API_ENDPOINTS.md`

**Backend URL**: Configurable via `VITE_API_URL` in `.env`

### Local backend connection example
```env
VITE_API_URL=http://localhost:3000/api
```

### Production backend connection example
```env
VITE_API_URL=https://api.restoh.com/api
```

## 🚢 Deployment

### Production Build
```bash
npm run build
```

The `dist/` folder will contain the optimized files.

### Deployment on Vercel/Netlify
1. Connect your GitHub repository
2. Configure environment variables:
   - `VITE_API_URL` = Your production backend URL
3. Build command: `npm run build`
4. Output directory: `dist`

## 🐛 Debugging

### Debug Mode
Enable detailed logs in `.env`:
```env
VITE_DEBUG=true
```

### Browser Console
API errors are logged to console with:
- HTTP error code
- Error message
- Additional details

## 📝 Code Conventions

- **Components**: PascalCase (`UserProfile.jsx`)
- **Hooks**: camelCase with `use` prefix (`useAuth.js`)
- **Stores**: camelCase with `Store` suffix (`authStore.js`)
- **API**: camelCase with `Api` suffix (`authApi.js`)
- **Constants**: UPPER_SNAKE_CASE

## 🤝 Contributing

1. Fork the project
2. Create a branch (`git checkout -b feature/AmazingFeature`)
3. Commit (`git commit -m 'feat: Add amazing feature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under MIT.

## 🆘 Support

For any questions or issues:
- Open an issue on GitHub
- Check the `API_ENDPOINTS.md` documentation
- See instructions in `CLAUDE.md` for development

## Roadmap

- [x] Complete unit tests (1400+ tests)
- [x] Code coverage report
- [ ] E2E tests with Playwright/Cypress
- [ ] PWA (Progressive Web App)
- [ ] Internationalization (i18n)
- [ ] Dark mode
- [ ] Push notifications
- [ ] PDF invoice export
- [ ] Advanced analytics

---

**Built with ❤️ for RestOh**
