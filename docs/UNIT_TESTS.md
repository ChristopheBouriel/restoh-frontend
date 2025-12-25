# Tests Unitaires - RestOh Frontend

Documentation complète des tests unitaires avec Vitest et React Testing Library.

## Vue d'ensemble

| Métrique | Valeur |
|----------|--------|
| **Total tests** | 1417 |
| **Fichiers de test** | 57 |
| **Framework** | Vitest |
| **Testing Library** | React Testing Library |

---

## Structure des Tests

```
src/__tests__/
├── api/                    # Tests des appels API
├── components/             # Tests des composants React
│   ├── admin/
│   ├── common/
│   ├── layout/
│   ├── profile/
│   └── reservations/
├── hooks/                  # Tests des custom hooks
├── pages/                  # Tests des pages/routes
│   ├── admin/
│   ├── auth/
│   ├── checkout/
│   ├── contact/
│   ├── menu/
│   ├── orders/
│   ├── profile/
│   └── reservations/
├── services/               # Tests de la couche service
├── store/                  # Tests des stores Zustand
└── App.test.jsx            # Tests du routing
```

---

## Fichiers de Test par Catégorie

### API (3 fichiers)

| Fichier | Description |
|---------|-------------|
| `api/emailApi.test.js` | Forgot password, verify email, reset password, resend verification |
| `api/menuApi.popularSuggestions.test.js` | Popular items, suggestions, toggle overrides |
| `api/statsApi.test.js` | Dashboard stats, quick stats, revenue |

### Components (9 fichiers)

| Fichier | Description |
|---------|-------------|
| `components/admin/AdminLayout.test.jsx` | Layout admin, navigation sidebar |
| `components/common/CartModal.test.jsx` | Modal panier, quantités, total |
| `components/common/CustomDatePicker.test.jsx` | Sélecteur de date personnalisé |
| `components/common/EmailVerificationBanner.test.jsx` | Banner vérification email |
| `components/common/InlineAlert.test.jsx` | Alertes inline (success, error, warning) |
| `components/common/SimpleSelect.test.jsx` | Dropdown select custom |
| `components/layout/Header.test.jsx` | Header, navigation, user menu |
| `components/profile/DeleteAccountModal.test.jsx` | Modal suppression compte multi-étapes |
| `components/reservations/TableMap.test.jsx` | Carte des tables du restaurant |

### Hooks (5 fichiers)

| Fichier | Description |
|---------|-------------|
| `hooks/useAuth.test.js` | Login, register, logout, profile, password |
| `hooks/useCart.test.js` | Add/remove items, quantities, total, checkout |
| `hooks/useMenu.test.js` | Fetch items, filters, search, categories |
| `hooks/useOrders.test.js` | Create order, fetch orders, status updates |
| `hooks/useReservations.test.js` | Create/edit/cancel reservations |

### Pages (16 fichiers)

#### Admin (6 fichiers)

| Fichier | Description |
|---------|-------------|
| `pages/admin/Dashboard.test.jsx` | Quick stats, navigation, recent activity |
| `pages/admin/ContactsManagement.test.jsx` | Liste messages, status, réponses |
| `pages/admin/MenuManagement.test.jsx` | CRUD items, catégories, disponibilité |
| `pages/admin/OrdersManagement.test.jsx` | Filtres, status updates, stats |
| `pages/admin/ReservationsManagement.test.jsx` | Filtres, status updates, stats |
| `pages/admin/UsersManagement.test.jsx` | Liste users, rôles, actions |

#### Auth (5 fichiers)

| Fichier | Description |
|---------|-------------|
| `pages/auth/Login.test.jsx` | Formulaire login, validation, remember me |
| `pages/auth/Register.test.jsx` | Formulaire inscription, validation, terms |
| `pages/auth/ForgotPassword.test.jsx` | Demande reset password |
| `pages/auth/ResetPassword.test.jsx` | Nouveau mot de passe avec token |
| `pages/auth/VerifyEmail.test.jsx` | Vérification email avec token |

#### Autres pages (5 fichiers)

| Fichier | Description |
|---------|-------------|
| `pages/checkout/Checkout.test.jsx` | Formulaire commande, delivery/pickup, paiement |
| `pages/contact/Contact.test.jsx` | Formulaire contact, validation |
| `pages/contact/MyMessages.test.jsx` | Historique messages utilisateur |
| `pages/menu/Menu.test.jsx` | Affichage items, filtres, panier |
| `pages/orders/Orders.test.jsx` | Historique commandes utilisateur |
| `pages/profile/Profile.test.jsx` | Édition profil, password, suppression compte |
| `pages/reservations/Reservations.test.jsx` | Création, liste, modification réservations |

### Services (12 fichiers)

| Fichier | Description |
|---------|-------------|
| `services/authService.test.js` | Helpers auth, user roles |
| `services/authValidator.test.js` | Validation credentials |
| `services/contactService.test.js` | Helpers contacts |
| `services/contactValidator.test.js` | Validation messages |
| `services/menuFilters.test.js` | Filtres menu (catégorie, cuisine, search) |
| `services/menuService.test.js` | Enrichissement items, validation |
| `services/menuValidator.test.js` | Validation items menu |
| `services/orderFilters.test.js` | Filtres commandes (status, date, type) |
| `services/orderStats.test.js` | Calcul statistiques commandes |
| `services/orderValidator.test.js` | Validation commandes |
| `services/reservationFilters.test.js` | Filtres réservations |
| `services/reservationStats.test.js` | Calcul statistiques réservations |
| `services/reservationValidator.test.js` | Validation réservations |

### Store (8 fichiers)

| Fichier | Description |
|---------|-------------|
| `store/authStore.test.js` | Login, register, logout, token refresh |
| `store/cartStore.test.js` | Add/remove items, persist, clear |
| `store/contactsStore.test.js` | Fetch contacts, update status |
| `store/menuStore.test.js` | Fetch items, CRUD admin |
| `store/ordersStore.test.js` | Create order, fetch, update status |
| `store/reservationsStore.test.js` | CRUD reservations, status |
| `store/statsStore.test.js` | Fetch dashboard stats |
| `store/usersStore.test.js` | Fetch users, update roles |

### App (1 fichier)

| Fichier | Description |
|---------|-------------|
| `App.test.jsx` | Routing, protected routes, admin routes |

---

## Commandes

### Lancer tous les tests

```bash
npm test
```

### Mode watch (développement)

```bash
npm run test:watch
```

### Interface UI

```bash
npm run test:ui
```

### Couverture de code

```bash
npm run test:coverage
```

### Lancer un fichier spécifique

```bash
npm test -- src/__tests__/hooks/useAuth.test.js
```

### Lancer les tests d'un dossier

```bash
npm test -- src/__tests__/store/
```

### Lancer les tests matchant un pattern

```bash
npm test -- -t "should login"
```

---

## Configuration

### Vitest (`vitest.config.js`)

```javascript
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.js'],
    include: ['src/**/*.{test,spec}.{js,jsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'src/setupTests.js']
    }
  }
})
```

### Setup (`src/setupTests.js`)

Configure :
- Jest DOM matchers (`@testing-library/jest-dom`)
- Mocks globaux (localStorage, matchMedia, etc.)
- Cleanup automatique après chaque test

---

## Patterns de Test

### Test de composant

```javascript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import MyComponent from '../components/MyComponent'

describe('MyComponent', () => {
  const renderComponent = (props = {}) => {
    return render(
      <BrowserRouter>
        <MyComponent {...props} />
      </BrowserRouter>
    )
  }

  it('should render correctly', () => {
    renderComponent()
    expect(screen.getByRole('heading')).toBeInTheDocument()
  })

  it('should handle click', async () => {
    const user = userEvent.setup()
    renderComponent()

    await user.click(screen.getByRole('button'))
    expect(screen.getByText('Clicked!')).toBeVisible()
  })
})
```

### Test de hook

```javascript
import { renderHook, act } from '@testing-library/react'
import useMyHook from '../hooks/useMyHook'

describe('useMyHook', () => {
  it('should return initial state', () => {
    const { result } = renderHook(() => useMyHook())
    expect(result.current.value).toBe(0)
  })

  it('should update state', () => {
    const { result } = renderHook(() => useMyHook())

    act(() => {
      result.current.increment()
    })

    expect(result.current.value).toBe(1)
  })
})
```

### Test de store Zustand

```javascript
import { act } from '@testing-library/react'
import useMyStore from '../store/myStore'

vi.mock('../api/myApi')

describe('myStore', () => {
  beforeEach(() => {
    // Reset store state
    act(() => {
      useMyStore.setState({ items: [], isLoading: false })
    })
  })

  it('should fetch items', async () => {
    myApi.getItems.mockResolvedValue({ success: true, items: [1, 2, 3] })

    await act(async () => {
      await useMyStore.getState().fetchItems()
    })

    expect(useMyStore.getState().items).toHaveLength(3)
  })
})
```

### Test d'API

```javascript
import { vi } from 'vitest'
import apiClient from '../api/apiClient'
import { myApiFunction } from '../api/myApi'

vi.mock('../api/apiClient')

describe('myApi', () => {
  it('should call endpoint correctly', async () => {
    apiClient.get.mockResolvedValue({ data: { success: true } })

    const result = await myApiFunction()

    expect(apiClient.get).toHaveBeenCalledWith('/my-endpoint')
    expect(result.success).toBe(true)
  })
})
```

---

## Mocking

### Mock d'un module

```javascript
vi.mock('../api/authApi', () => ({
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn()
}))
```

### Mock de react-router

```javascript
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})
```

### Mock de toast

```javascript
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn()
  },
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))
```

---

## Bonnes Pratiques

### 1. Tester contre la spécification

Vérifier les arguments passés aux fonctions API correspondent au contrat attendu, pas à l'implémentation actuelle.

```javascript
// ✅ Correct : teste la signature de l'API
expect(mockChangePassword).toHaveBeenCalledWith('oldPass', 'newPass')

// ❌ Incorrect : valide potentiellement un bug
expect(mockChangePassword).toHaveBeenCalledWith({ oldPass, newPass })
```

### 2. Utiliser les queries appropriées

```javascript
// Préférer getByRole pour l'accessibilité
screen.getByRole('button', { name: /submit/i })

// Utiliser getByText pour le contenu
screen.getByText('Welcome back!')

// Utiliser getByTestId en dernier recours
screen.getByTestId('custom-component')
```

### 3. Attendre les éléments asynchrones

```javascript
// ✅ Correct
await screen.findByText('Loaded!')

// ❌ Incorrect (pas d'attente)
screen.getByText('Loaded!')
```

### 4. Nettoyer entre les tests

```javascript
beforeEach(() => {
  vi.clearAllMocks()
  // Reset store state si nécessaire
})

afterEach(() => {
  cleanup()
})
```

---

## Couverture de Code

Générer le rapport de couverture :

```bash
npm run test:coverage
```

Ouvrir le rapport HTML :

```bash
open coverage/index.html
```

### Seuils de couverture recommandés

| Métrique | Seuil |
|----------|-------|
| Statements | 80% |
| Branches | 75% |
| Functions | 80% |
| Lines | 80% |

---

## Dépannage

### Tests qui échouent aléatoirement

1. Vérifier les timers non nettoyés
2. Utiliser `vi.useFakeTimers()` si nécessaire
3. Ajouter `await` aux actions asynchrones

### Erreurs de mémoire

```bash
NODE_OPTIONS=--max-old-space-size=4096 npm test
```

### Erreurs de mock

Vérifier que les mocks sont réinitialisés :

```javascript
beforeEach(() => {
  vi.clearAllMocks()
})
```

---

*Dernière mise à jour : Décembre 2024*
