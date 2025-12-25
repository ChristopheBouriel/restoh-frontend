# CLAUDE.md - RestOh Frontend

Ce fichier fournit des instructions spécifiques à Claude Code pour travailler efficacement sur le projet RestOh Frontend.

## Vue d'ensemble du projet

RestOh Frontend est une application React 18 de gestion de restaurant, connectée à un backend REST API. Elle implémente un système complet avec authentification par cookies HTTP-only, gestion des commandes, réservations, avis, et panel d'administration.

**État actuel** : Frontend intégré avec backend, tests complets (1620+ tests), architecture service layer implémentée, dashboard avec statistiques API.

## Architecture et Technologies

### Stack Technique
- **Frontend** : React 18 + Vite
- **State Management** : Zustand avec persistance localStorage
- **Forms** : React Hook Form avec validation centralisée
- **HTTP Client** : Axios avec intercepteurs (cookies HTTP-only)
- **Styling** : Tailwind CSS
- **Icons** : Lucide React
- **Notifications** : React Hot Toast
- **Routing** : React Router Dom
- **Testing** : Vitest + React Testing Library

### Structure de l'Application
```
src/
├── api/                    # Couche API (appels HTTP)
│   ├── apiClient.js        # Instance Axios + intercepteurs
│   ├── authApi.js          # Endpoints authentification
│   ├── ordersApi.js        # Endpoints commandes
│   ├── reservationsApi.js  # Endpoints réservations
│   ├── menuApi.js          # Endpoints menu
│   ├── contactsApi.js      # Endpoints contacts
│   ├── emailApi.js         # Endpoints email (verification, reset)
│   ├── reviewsApi.js       # Endpoints avis menu items
│   ├── restaurantReviewsApi.js  # Endpoints avis restaurant
│   ├── statsApi.js         # Endpoints statistiques dashboard
│   └── index.js            # Export centralisé
├── services/               # Couche Service (logique métier)
│   ├── menu/               # MenuService (enrichissement, validation)
│   ├── reservations/       # ReservationService (filtres, stats, validation)
│   ├── orders/             # OrderService (filtres, stats, validation)
│   └── auth/               # AuthService (validation credentials)
├── components/             # Composants réutilisables
├── constants/              # Config, enums, routes
├── contexts/               # React Contexts (UI state)
├── hooks/                  # Custom hooks métier
├── pages/                  # Pages/Routes
├── store/                  # Zustand stores (state + appels API)
├── utils/                  # Fonctions utilitaires
└── __tests__/              # Tests unitaires et d'intégration
```

### Architecture en couches
```
Composants (UI)
    ↓ utilisent
Hooks (useAuth, useOrders, etc.)
    ↓ utilisent
Stores (Zustand) + Services (logique métier)
    ↓ appellent
API Layer (Axios)
    ↓ communique avec
Backend REST API
```

## Configuration Backend

### Variables d'Environnement
Créer un fichier `.env` à la racine :
```env
VITE_API_URL=http://localhost:3000/api
```

**Important** : Ne jamais commiter le fichier `.env`. Utiliser `.env.example` comme template.

### API Client (axios)

Le client API est configuré dans `src/api/apiClient.js` avec :
- **Base URL** : Depuis `VITE_API_URL`
- **Timeout** : 30 secondes
- **withCredentials** : `true` (cookies HTTP-only envoyés automatiquement)
- **Intercepteurs response** : Gestion globale des erreurs HTTP

#### Gestion automatique des erreurs
- **401 Unauthorized** : Déconnexion + redirection `/login` (sauf pages auth publiques)
- **403 Forbidden** : Toast "Permissions insuffisantes"
- **500 Server Error** : Toast "Erreur serveur"

**Note** : Les pages publiques (`/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`) ne déclenchent pas de redirection sur 401.

## Logique Métier Critique

### Système de Paiement
```javascript
// IMPORTANT : Logique automatique côté backend attendue
// Card payments → isPaid: true (immédiat)
// Cash payments → isPaid: false jusqu'à livraison
// Lors du passage en 'delivered' : cash devient automatiquement payé
```

### Authentification (Access Token + Refresh Token)

Le système utilise une architecture sécurisée avec deux tokens :

- **Access Token** : Court (15 min), stocké en mémoire uniquement (pas localStorage)
- **Refresh Token** : Long (24h par défaut, 7 jours avec "Remember Me"), stocké dans un cookie HTTP-only sécurisé
- **État local** : `user` et `isAuthenticated` persistés dans localStorage (`auth-storage`)

#### Flux d'authentification
1. **Login** : Backend retourne `accessToken` + set cookie `refreshToken`
2. **Requêtes API** : Header `Authorization: Bearer {accessToken}`
3. **Token expiré (401)** : Auto-refresh via cookie, retry de la requête
4. **App startup** : `initializeAuth()` utilise le refresh token pour restaurer la session

#### Auto-refresh interceptor (apiClient.js)
- Détecte les erreurs `AUTH_TOKEN_EXPIRED`
- Queue les requêtes pendant le refresh
- Retry automatique après obtention du nouveau token
- Logout si refresh échoue

#### Déconnexion automatique
- Sur 401 avec `AUTH_NO_REFRESH_TOKEN` ou `AUTH_INVALID_REFRESH_TOKEN`
- Redirection vers `/login` (sauf pages publiques)

#### Remember Me
La checkbox "Remember Me" sur la page de login contrôle la durée de session :
- **Non cochée (défaut)** : Session de 24h
- **Cochée** : Session de 7 jours

```javascript
// Login.jsx - Intégration React Hook Form
const { register } = useForm({
  defaultValues: { rememberMe: false }
})

// La checkbox est connectée au formulaire
<input type="checkbox" {...register('rememberMe')} />

// onSubmit envoie { email, password, rememberMe: true/false }
```

Le backend ajuste la durée du refresh token en fonction de `rememberMe`.

### Suppression de Compte (RGPD)

La suppression de compte utilise un modal multi-étapes avec validation backend :

#### Flux de suppression
1. **Initial** : Formulaire avec confirmation "DELETE" + mot de passe
2. **Blocked** (`UNPAID_DELIVERY_ORDERS`) : Message d'erreur, suppression impossible
3. **Confirm Reservations** (`ACTIVE_RESERVATIONS`) : Liste des réservations actives, demande de confirmation

#### API deleteAccount
```javascript
// authApi.js - Signature avec options
export const deleteAccount = async (password, options = {}) => {
  // options.confirmCancelReservations: true pour confirmer l'annulation des réservations
}

// Codes d'erreur possibles
// - UNPAID_DELIVERY_ORDERS : Commande en livraison non payée (blocage)
// - ACTIVE_RESERVATIONS : Réservations actives (confirmation requise)
// - INVALID_PASSWORD : Mot de passe incorrect
```

#### Implémentation dans Profile.jsx
Le composant Profile appelle directement `authApi.deleteAccount()` au lieu de passer par le store, pour éviter les re-renders qui réinitialisent l'état du modal.

```javascript
// Profile.jsx - Appel API direct pour éviter les re-renders du store
const handleDeleteAccount = async (password, options = {}) => {
  setIsDeleting(true)
  const result = await authApi.deleteAccount(password, options)

  if (result.code === 'UNPAID_DELIVERY_ORDERS') {
    setDeleteModalStep('blocked')
  } else if (result.code === 'ACTIVE_RESERVATIONS') {
    setActiveReservations(result.reservations)
    setDeleteModalStep('confirm-reservations')
  }
  // ...
}
```

#### Anonymisation des données
Lors de la suppression effective :
- **Anonymisation** (pas suppression) des commandes/réservations
- Préservation des statistiques business
- `userId` → `'deleted-user'`
- `userEmail` → `'deleted@account.com'`

### Terminologie Standardisée
- **Réservations** : Utiliser `guests` (pas `people`)
- **Commandes** : `isPaid` boolean + `paymentMethod` ('card'|'cash')
- **Statuts commandes** : 'pending' → 'confirmed' → 'preparing' → 'ready' → 'delivered' | 'cancelled'
- **Statuts réservations** : 'pending' → 'confirmed' → 'seated' → 'completed' | 'cancelled'
- **Statuts contacts** : 'new' → 'read' → 'replied'

## Commandes de Développement

### Lancement
```bash
npm install          # Installation des dépendances
npm run dev          # Mode développement (port 5173)
npm run build        # Build production
npm run preview      # Preview du build
npm run lint         # ESLint
```

### Tests
```bash
npm test             # Lancer tous les tests (1620+ tests)
npm run test:ui      # Interface Vitest UI
npm run test:coverage # Couverture de code
npm run test:watch   # Mode watch
```

## Patterns de Code

### Usage de la couche API

**Import centralisé** :
```javascript
import { authApi, ordersApi } from '@/api'

// Dans un store ou un hook
const result = await authApi.login(credentials)
if (result.success) {
  // Traiter result.user, result.token
}
```

**Import individuel** :
```javascript
import { login, register } from '@/api/authApi'

const result = await login({ email, password })
```

### Store Pattern avec API réelle
```javascript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getMenuItems } from '../api/menuApi'

const useMenuStore = create(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      error: null,

      // Appel API réel
      fetchItems: async () => {
        set({ isLoading: true, error: null })

        const result = await getMenuItems()

        if (result.success) {
          set({ items: result.items, isLoading: false })
        } else {
          set({ error: result.error, isLoading: false })
        }
      }
    }),
    { name: 'menu-storage' }
  )
)
```

### Hook Pattern
```javascript
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import useAuthStore from '../store/authStore'

export const useAuth = () => {
  const navigate = useNavigate()
  const { user, login, logout } = useAuthStore()

  const handleLogin = async (credentials) => {
    const result = await login(credentials)

    if (result.success) {
      toast.success('Connexion réussie !')
      navigate('/dashboard')
    } else {
      toast.error(result.error)
    }
  }

  return { user, login: handleLogin, logout }
}
```

### React Hook Form Pattern

Tous les formulaires utilisent React Hook Form avec validation centralisée dans `src/utils/formValidators.js`.

**Configuration standard** :
```javascript
import { useForm } from 'react-hook-form'
import { validationRules, validatePasswordMatch } from '../../utils/formValidators'

const MyForm = () => {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors }
  } = useForm({
    mode: 'onBlur',           // Valider au blur
    reValidateMode: 'onChange' // Revalider à chaque changement
  })

  const onSubmit = async (data) => {
    // data contient les valeurs du formulaire
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        {...register('email', validationRules.email)}
        className={errors.email ? 'border-red-300' : 'border-primary-300'}
      />
      {errors.email && (
        <p className="text-red-600">{errors.email.message}</p>
      )}
    </form>
  )
}
```

**Règles de validation disponibles** (`formValidators.js`) :
- `email` - Email requis avec format valide
- `password` - Mot de passe requis, min 6 caractères
- `passwordRequired` - Juste requis (pour login)
- `name` - Nom requis, min 2 caractères
- `phone` - Format français optionnel (0612345678)
- `phoneRequired` - Téléphone requis (pour pickup)
- `message` - Message requis, min 10 caractères
- `subject` - Sujet requis
- `guests`, `date`, `time` - Pour réservations

**Validation de confirmation de mot de passe** :
```javascript
const password = watch('password')

<input
  {...register('confirmPassword', {
    required: 'Please confirm your password',
    validate: (value) => validatePasswordMatch(value, password)
  })}
/>
```

**Formulaires multiples dans un composant** (ex: Profile.jsx) :
```javascript
// Renommer les propriétés pour éviter les conflits
const {
  register: registerProfile,
  handleSubmit: handleSubmitProfile,
  formState: { errors: profileErrors }
} = useForm({ ... })

const {
  register: registerPassword,
  handleSubmit: handleSubmitPassword,
  formState: { errors: passwordErrors }
} = useForm({ ... })
```

## Intégration Backend

### Endpoints Requis
Voir `API_ENDPOINTS.md` pour la documentation complète des endpoints backend attendus.

**Résumé** :
- `POST /auth/login`, `/auth/register`, `/auth/logout`
- `GET /auth/me`, `PUT /auth/profile`, `DELETE /auth/account`
- `GET /menu/items`, `GET /menu/categories`
- `GET /orders`, `POST /orders`, `PATCH /orders/:id/status`
- `GET /reservations`, `POST /reservations`, `PATCH /reservations/:id/status`
- `POST /contacts`, `GET /contacts` (admin)
- `GET /admin/stats` (statistiques dashboard)

### Format de Réponse Standard
**Succès** :
```json
{
  "success": true,
  "data": { ... },
  "message": "Optionnel"
}
```

**Erreur** :
```json
{
  "success": false,
  "error": "Message d'erreur",
  "code": "ERROR_CODE",
  "details": {}
}
```

### Authentification
Les cookies HTTP-only sont automatiquement envoyés avec chaque requête (`withCredentials: true`).
Aucun header `Authorization` n'est nécessaire côté frontend.

## Règles de Développement

### Sécurité
- ❌ **JAMAIS** commiter de tokens/secrets dans le code
- ❌ **JAMAIS** exposer de mots de passe en clair
- ✅ **TOUJOURS** utiliser les variables d'environnement pour les configs sensibles
- ✅ **TOUJOURS** valider les données côté client avant envoi API

### Performance
- ✅ Utiliser la persistance localStorage intelligemment (ne pas surcharger)
- ✅ Implémenter des états de loading appropriés
- ✅ Optimiser les re-renders avec useCallback/useMemo si nécessaire
- ✅ Éviter les appels API redondants (cache dans stores)

### UX/UI
- ✅ **TOUJOURS** afficher des toasts pour les actions utilisateur
- ✅ **TOUJOURS** gérer les cas d'erreur avec des messages explicites
- ✅ Responsive design mobile-first
- ✅ États de loading visuels (spinners, skeletons)

### Code Quality
- ✅ Utiliser ESLint (déjà configuré)
- ✅ Nommer les composants en PascalCase
- ✅ Nommer les hooks avec préfixe `use`
- ✅ Commenter le code complexe
- ✅ Suivre les conventions de nommage

## Service Layer

Les services encapsulent la logique métier réutilisable, séparée des stores et composants.

### Services disponibles
- **MenuService** : Enrichissement panier, validation items
- **ReservationService** : Filtres, statistiques, validation créneaux
- **OrderService** : Filtres, statistiques, calculs paiement
- **AuthService** : Validation credentials, helpers utilisateur

## Dashboard Admin

### Statistiques API (statsStore)
Le dashboard utilise un store dédié (`statsStore`) qui récupère les statistiques agrégées depuis le backend via `GET /admin/stats`.

**Structure des données quickStats** :
```javascript
{
  quickStats: {
    todayRevenue: 125.00,
    todayOrders: 5,
    todayReservations: 3,
    totalActiveUsers: 150
  },
  orders: {
    thisMonth: { total, revenue, pickup, delivery },
    lastMonth: { total, revenue, pickup, delivery },
    today: { total, revenue, pickup, delivery },
    sameDayLastWeek: { total, revenue, pickup, delivery }
  },
  reservations: {
    thisMonth: { total, totalGuests },
    lastMonth: { total, totalGuests },
    today: { total, totalGuests },
    sameDayLastWeek: { total, totalGuests }
  },
  revenue: {
    thisMonth, lastMonth, today, sameDayLastWeek
  },
  totalMenuItems, activeMenuItems, inactiveMenuItems
}
```

### Filtres Today dynamiques
Dans OrdersManagement et ReservationsManagement, le bouton "Today" filtre non seulement la liste affichée, mais aussi les statistiques en haut de page. Les stats sont recalculées à partir des données filtrées.

### Usage des Services
```javascript
import { OrderService } from '../services/orders'

// Dans un composant
const stats = OrderService.calculateStats(orders)
const todaysOrders = OrderService.getTodaysOrders(orders)
const { label, color, icon } = OrderService.getStatusDisplayInfo('confirmed')

// Validation avant soumission
const validation = OrderService.validateOrderData(orderData)
if (!validation.isValid) {
  toast.error(validation.errors[0])
  return
}
```

## Bonnes Pratiques de Tests

### Tester contre la spécification, pas contre l'implémentation

⚠️ **IMPORTANT** : Quand on écrit un test, il faut vérifier contre la **spécification attendue** (signature de fonction, contrat d'API), pas contre ce que le code fait actuellement.

**Exemple de bug non détecté** :
```javascript
// authApi.js - La fonction attend 2 arguments séparés
export const changePassword = async (currentPassword, newPassword) => {
  return apiClient.put('/auth/change-password', { currentPassword, newPassword })
}

// authStore.js - BUG: passe un objet au lieu de 2 arguments
const result = await authApi.changePassword({ currentPassword, newPassword })

// authStore.test.js - MAUVAIS: le test valide le bug !
expect(mockChangePassword).toHaveBeenCalledWith({ currentPassword: 'old', newPassword: 'new' })

// authStore.test.js - CORRECT: tester contre la signature de l'API
expect(mockChangePassword).toHaveBeenCalledWith('old', 'new')
```

**Règles** :
- ✅ Vérifier la signature des fonctions API avant d'écrire le test
- ✅ Tester les arguments passés correspondent au contrat de l'API
- ❌ Ne pas copier le comportement du code sans vérifier s'il est correct

## État des Tests

**Tests implémentés (1620+)** :
- ✅ Stores : authStore, ordersStore, reservationsStore, menuStore, contactsStore, cartStore, usersStore, statsStore, reviewsStore, restaurantReviewsStore
- ✅ Hooks : useAuth, useCart, useMenu, useOrders, useReservations
- ✅ Services : MenuService, ReservationService, OrderService, AuthService, ContactService
- ✅ Composants : Pages principales (dont Dashboard 56 tests, Menu 33 tests, Reservations 30 tests), formulaires, navigation, composants communs, TableMap (50 tests)
- ✅ Modals : DeleteAccountModal (multi-step, blocked, confirm-reservations)
- ✅ API : Tests unitaires complets pour authApi, contactsApi, ordersApi, reservationsApi, usersApi, tablesApi, menuApi, emailApi, reviewsApi, restaurantReviewsApi, statsApi
- ✅ Reviews : ReviewCard, AddReviewForm, RestaurantReviewCard, RestaurantReviewForm, RestaurantReviews page

### Pattern de test recommandé pour les hooks

```javascript
// ✅ CORRECT : Mock l'API, utilise le vrai store
vi.mock('../../api/ordersApi')

beforeEach(() => {
  // Reset le vrai store
  act(() => {
    useOrdersStore.setState({
      orders: mockOrders,
      isLoading: false,
      error: null
    })
  })

  // Mock les réponses API
  ordersApi.updateOrderStatus.mockResolvedValue({ success: true })
})

// ❌ INCORRECT : Mock le store entier (crée une fausse implémentation)
vi.mock('../../store/ordersStore')
```

### Couverture de code

```bash
npm run test:coverage  # Génère le rapport dans coverage/
open coverage/index.html  # Ouvrir le rapport HTML
```

### Tests à ajouter
- [x] Tests E2E avec Playwright (17 fichiers de tests)
- [ ] Tests de performance (bundle size, render times)
- [x] Tests d'accessibilité (a11y avec @axe-core/playwright)

## Déploiement

### Build de Production
```bash
npm run build
```

Les fichiers optimisés seront dans `dist/`

### Variables d'environnement en production
Configurer sur Vercel/Netlify :
- `VITE_API_URL` = URL du backend de production (ex: `https://api.restoh.com/api`)

## Notes pour le Développement Futur

### Améliorations Possibles
- **Refresh Tokens** : Implémenter la rotation automatique
- **WebSockets** : Notifications temps réel pour les commandes
- **PWA** : Support offline avec Service Workers
- **i18n** : Internationalisation (français/anglais)
- **Dark Mode** : Thème sombre avec Tailwind

### Performance Optimizations
- **React Query** : Remplacer Zustand par React Query pour le cache API
- **Code Splitting** : Lazy loading des routes
- **Image Optimization** : WebP + responsive images
- **Bundle Analysis** : Analyser et optimiser la taille du bundle

## Conventions de Nommage

- **Composants** : `PascalCase` (`UserProfile.jsx`)
- **Hooks** : `camelCase` avec préfixe `use` (`useAuth.js`)
- **Stores** : `camelCase` avec suffixe `Store` (`authStore.js`)
- **API Services** : `camelCase` avec suffixe `Api` (`authApi.js`)
- **Constants** : `UPPER_SNAKE_CASE` (`API_BASE_URL`)
- **Functions** : `camelCase` (`handleLogin`)

## Commits

Format recommandé :
```
feat: Add user profile page
fix: Resolve cart persistence issue
refactor: Simplify auth store logic
test: Add tests for orders API
```

---

**Ce fichier doit être mis à jour à chaque évolution majeure du projet.**

Dernière mise à jour : Décembre 2024 - Tests complets (1620+ unit, 17 E2E, a11y), couverture API et reviews.
