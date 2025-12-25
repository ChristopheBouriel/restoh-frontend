# Migration Context - RestOh Frontend

Ce document capture tout le contexte de la migration du projet RestOh de démo vers frontend production-ready.

## 📋 Table des matières

1. [Contexte du projet](#contexte-du-projet)
2. [Architecture actuelle](#architecture-actuelle)
3. [Ce qui a été fait](#ce-qui-a-été-fait)
4. [État actuel](#état-actuel)
5. [Prochaines étapes](#prochaines-étapes)
6. [Détails techniques](#détails-techniques)
7. [Logique métier critique](#logique-métier-critique)

---

## 📖 Contexte du projet

### Origine
- **Projet initial** : `restOh-front` - Application démo complète avec simulation backend
- **Objectif** : Transformer en vrai frontend connecté à un backend REST API
- **Nouveau repo** : `restoh-frontend` - Frontend production-ready

### Technologies utilisées
- React 18 + Vite
- Zustand (state management avec persistance localStorage)
- Tailwind CSS
- React Router Dom
- Axios (nouvellement ajouté)
- React Hot Toast (notifications)
- Lucide React (icônes)

---

## 🏗️ Architecture actuelle

### Structure des dossiers
```
restoh-frontend/
├── src/
│   ├── api/                    # ✅ Nouvellement créé - Couche API complète
│   │   ├── apiClient.js        # Instance Axios + intercepteurs JWT
│   │   ├── authApi.js          # Endpoints authentification
│   │   ├── ordersApi.js        # Endpoints commandes
│   │   ├── reservationsApi.js  # Endpoints réservations
│   │   ├── menuApi.js          # Endpoints menu
│   │   ├── contactsApi.js      # Endpoints contacts
│   │   └── index.js            # Export centralisé
│   │
│   ├── components/             # Composants réutilisables
│   │   ├── admin/              # AdminLayout
│   │   ├── common/             # CartModal, ProtectedRoute, etc.
│   │   ├── layout/             # Header, Footer, Layout
│   │   └── profile/            # DeleteAccountModal
│   │
│   ├── constants/              # Configuration et enums
│   │   └── index.js            # API_BASE_URL, ROUTES, ORDER_STATUS, etc.
│   │
│   ├── contexts/               # React Contexts pour UI state
│   │   └── CartUIContext.jsx   # Gestion ouverture/fermeture panier
│   │
│   ├── hooks/                  # Custom hooks métier
│   │   ├── useAuth.js          # Hook authentification
│   │   ├── useCart.js          # Hook panier
│   │   ├── useOrders.js        # Hook commandes
│   │   ├── useReservations.js  # Hook réservations
│   │   └── useMenu.js          # Hook menu
│   │
│   ├── pages/                  # Pages/Routes
│   │   ├── admin/              # Dashboard, OrdersManagement, etc.
│   │   ├── auth/               # Login, Register
│   │   ├── checkout/           # Checkout
│   │   ├── contact/            # Contact
│   │   ├── menu/               # Menu
│   │   ├── orders/             # Orders
│   │   ├── profile/            # Profile
│   │   ├── public/             # Home
│   │   └── reservations/       # Reservations
│   │
│   ├── store/                  # ⚠️ Zustand stores - UTILISE ENCORE LA DÉMO
│   │   ├── authStore.js        # Authentification (localStorage)
│   │   ├── cartStore.js        # Panier
│   │   ├── menuStore.js        # Menu
│   │   ├── ordersStore.js      # Commandes
│   │   ├── reservationsStore.js # Réservations
│   │   ├── contactsStore.js    # Contacts
│   │   └── usersStore.js       # Utilisateurs (admin)
│   │
│   ├── utils/                  # Utilitaires
│   │   └── crypto.js           # Hachage SHA-256 mots de passe
│   │
│   ├── App.jsx                 # Composant principal
│   └── main.jsx                # Point d'entrée
│
├── public/                     # Ressources statiques
│   └── images/menu/            # Images des plats
│
├── .env.example                # ✅ Template configuration
├── .gitignore
├── API_ENDPOINTS.md            # ✅ Documentation endpoints backend
├── CLAUDE.md                   # ✅ Instructions développement
├── README.md                   # ✅ Documentation projet
├── package.json                # Dépendances (axios ajouté)
├── vite.config.js
├── tailwind.config.js
├── eslint.config.js
└── postcss.config.js
```

---

## ✅ Ce qui a été fait

### 1. Création du nouveau repository
- **URL** : https://github.com/ChristopheBouriel/restoh-frontend
- **Visibilité** : Public
- Repository créé avec GitHub CLI

### 2. Structure complète copiée
- 103 fichiers copiés depuis `restOh-front`
- Tous les composants, pages, hooks, contexts conservés
- Images et ressources statiques incluses

### 3. Installation d'Axios
```bash
npm install axios
# Version installée : 1.12.2
```

### 4. Création de la couche API complète

#### `src/api/apiClient.js`
- Instance Axios configurée avec `baseURL` depuis `VITE_API_URL`
- **Intercepteur request** : Ajout automatique du JWT Bearer token depuis localStorage
- **Intercepteur response** :
  - Gestion des erreurs HTTP (401, 403, 404, 500, etc.)
  - Auto-déconnexion si 401 Unauthorized
  - Toasts d'erreur automatiques
  - Format d'erreur structuré

#### APIs créées
- **`authApi.js`** : register, login, logout, refreshToken, getCurrentUser, updateProfile, changePassword, deleteAccount
- **`menuApi.js`** : getMenuItems, getCategories, createMenuItem, updateMenuItem, deleteMenuItem
- **`ordersApi.js`** : getUserOrders, getAllOrders, getOrderById, createOrder, updateOrderStatus
- **`reservationsApi.js`** : getUserReservations, getAllReservations, getReservationById, createReservation, updateReservationStatus, assignTable
- **`contactsApi.js`** : sendContactMessage, getAllContacts, updateContactStatus, replyToContact
- **`index.js`** : Export centralisé de toutes les APIs

### 5. Configuration environnement
Fichier `.env.example` créé :
```env
VITE_API_URL=http://localhost:3000/api
VITE_MODE=development
VITE_DEBUG=false
```

### 6. Documentation complète

#### `README.md`
- Instructions d'installation
- Scripts disponibles
- Structure du projet
- Guide de déploiement
- Conventions de code

#### `CLAUDE.md`
- Vue d'ensemble architecture
- Patterns de code avec API
- Guide de migration des stores
- Logique métier critique
- Conventions de nommage

#### `API_ENDPOINTS.md`
- Documentation exhaustive de tous les endpoints backend requis
- Format de requêtes/réponses
- Codes d'erreur HTTP
- Exemples de payloads
- Notes d'implémentation backend

### 7. Git et déploiement
```bash
git init
git add .
git commit -m "feat: Initial commit - RestOh Frontend ready for backend integration"
git remote add origin https://github.com/ChristopheBouriel/restoh-frontend.git
git push -u origin main
```

---

## ⚠️ État actuel

### ✅ Ce qui fonctionne
- Structure complète du projet
- Couche API prête et fonctionnelle
- Configuration environnement
- Documentation complète
- Tous les composants UI
- Tous les hooks custom
- Routing React Router

### ❌ Ce qui NE fonctionne PAS encore
**Les stores Zustand utilisent encore la DÉMO (localStorage + setTimeout)**

#### Stores à migrer vers API :
1. ❌ `authStore.js` - Utilise localStorage pour users + simulation setTimeout
2. ❌ `menuStore.js` - Données hardcodées + localStorage
3. ❌ `ordersStore.js` - Simulation avec localStorage
4. ❌ `reservationsStore.js` - Simulation avec localStorage
5. ❌ `contactsStore.js` - Simulation avec localStorage
6. ❌ `cartStore.js` - Peut rester en localStorage (données locales uniquement)
7. ❌ `usersStore.js` - Admin users, besoin d'API

**Résultat** : L'application tourne en mode DÉMO même dans le nouveau repo.

---

## 🚀 Prochaines étapes

### Phase 1 : Migration des stores vers API

#### 1.1 Migrer `authStore.js` (PRIORITAIRE)
**Fichier** : `/src/store/authStore.js`

**Actions à migrer** :
```javascript
// login - Remplacer simulation par authApi.login()
// register - Remplacer simulation par authApi.register()
// logout - Remplacer par authApi.logout()
// updateProfile - Remplacer par authApi.updateProfile()
// changePassword - Remplacer par authApi.changePassword()
// deleteAccount - Remplacer par authApi.deleteAccount()
```

**Pattern de migration** :
```javascript
// AVANT (actuel - simulation)
login: async (credentials) => {
  set({ isLoading: true, error: null })

  try {
    await new Promise(resolve => setTimeout(resolve, 1000)) // Simulation

    const storedUsers = JSON.parse(localStorage.getItem('registered-users') || '[]')
    const existingUser = storedUsers.find(user => user.email === credentials.email)
    // ... logique locale

    set({
      user: mockUser,
      token: mockToken,
      isAuthenticated: true,
      isLoading: false
    })

    return { success: true }
  } catch (error) {
    set({ error: error.message, isLoading: false })
    return { success: false, error: error.message }
  }
}

// APRÈS (à implémenter - API réelle)
login: async (credentials) => {
  set({ isLoading: true, error: null })

  try {
    const result = await authApi.login(credentials)

    if (result.success) {
      set({
        user: result.user,
        token: result.token,
        isAuthenticated: true,
        isLoading: false,
        error: null
      })
      return { success: true }
    } else {
      set({
        error: result.error,
        isLoading: false
      })
      return { success: false, error: result.error }
    }
  } catch (error) {
    set({
      error: error.error || 'Erreur de connexion',
      isLoading: false
    })
    return { success: false, error: error.error }
  }
}
```

**Import nécessaire** :
```javascript
import * as authApi from '../api/authApi'
// ou
import { login as apiLogin, register as apiRegister, ... } from '../api/authApi'
```

#### 1.2 Migrer `menuStore.js`
**Actions** :
- `initializeMenu()` → `menuApi.getMenuItems()` + `menuApi.getCategories()`
- `createItem()` → `menuApi.createMenuItem()`
- `updateItem()` → `menuApi.updateMenuItem()`
- `deleteItem()` → `menuApi.deleteMenuItem()`

#### 1.3 Migrer `ordersStore.js`
**Actions** :
- `initializeOrders()` → `ordersApi.getAllOrders()` (admin) ou `ordersApi.getUserOrders()` (user)
- `createOrder()` → `ordersApi.createOrder()`
- `updateOrderStatus()` → `ordersApi.updateOrderStatus()`

**⚠️ Logique critique à préserver** :
```javascript
// Paiement automatique cash → isPaid: true quand delivered
// Cette logique doit être CÔTÉ BACKEND maintenant !
if (newStatus === 'delivered' && order.paymentMethod === 'cash' && !order.isPaid) {
  updatedOrder.isPaid = true
}
```

#### 1.4 Migrer `reservationsStore.js`
**Actions** :
- `initializeReservations()` → `reservationsApi.getAllReservations()` ou `getUserReservations()`
- `createReservation()` → `reservationsApi.createReservation()`
- `updateReservationStatus()` → `reservationsApi.updateReservationStatus()`
- `assignTable()` → `reservationsApi.assignTable()`

#### 1.5 Migrer `contactsStore.js`
**Actions** :
- `initializeContacts()` → `contactsApi.getAllContacts()` (admin)
- `sendMessage()` → `contactsApi.sendContactMessage()`
- `updateStatus()` → `contactsApi.updateContactStatus()`
- `replyToContact()` → `contactsApi.replyToContact()`

#### 1.6 Migrer `usersStore.js`
**Actions** :
- Créer `usersApi.js` (non créé actuellement)
- Endpoints à créer backend : `GET /admin/users`, `DELETE /admin/users/:id`, etc.

### Phase 2 : Configuration backend

#### 2.1 Créer fichier `.env`
```bash
cp .env.example .env
```

Éditer `.env` :
```env
VITE_API_URL=http://localhost:3000/api  # URL du backend
VITE_MODE=development
```

#### 2.2 Démarrer le backend
Le backend doit implémenter tous les endpoints documentés dans `API_ENDPOINTS.md`

#### 2.3 Tester la connexion
```bash
npm run dev
# Vérifier les appels API dans la console navigateur (Network tab)
```

### Phase 3 : Tests et validation

#### 3.1 Tests fonctionnels
- ✅ Login/Register
- ✅ Création commande
- ✅ Création réservation
- ✅ CRUD menu (admin)
- ✅ Gestion commandes (admin)
- ✅ Suppression compte RGPD

#### 3.2 Gestion d'erreurs
- ✅ Erreurs réseau (backend offline)
- ✅ Erreurs 401 (token expiré)
- ✅ Erreurs validation (400)
- ✅ Toasts appropriés

---

## 🔧 Détails techniques

### Variables d'environnement
**Fichier** : `.env` (à créer depuis `.env.example`)

```env
VITE_API_URL=http://localhost:3000/api
```

**Usage dans le code** :
```javascript
// src/constants/index.js
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

// src/api/apiClient.js
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
```

### Authentification JWT

#### Storage du token
Le token JWT est stocké dans Zustand avec persistance localStorage :
```javascript
// src/store/authStore.js
persist(
  (set, get) => ({ ... }),
  {
    name: 'auth-storage',
    partialize: (state) => ({
      user: state.user,
      token: state.token,
      isAuthenticated: state.isAuthenticated
    }),
  }
)
```

#### Ajout automatique dans les requêtes
```javascript
// src/api/apiClient.js - Intercepteur
apiClient.interceptors.request.use((config) => {
  const authStorage = localStorage.getItem('auth-storage')

  if (authStorage) {
    const { state } = JSON.parse(authStorage)
    const token = state?.token

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }

  return config
})
```

#### Gestion expiration token (401)
```javascript
// src/api/apiClient.js - Intercepteur response
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth-storage')

      if (!window.location.pathname.includes('/login')) {
        toast.error('Session expirée. Veuillez vous reconnecter.')
        window.location.href = '/login'
      }
    }
    // ...
  }
)
```

### Format des réponses API

#### Succès
```json
{
  "success": true,
  "user": { "id": "...", "email": "...", ... },
  "token": "jwt-token-here"
}
```

#### Erreur
```json
{
  "success": false,
  "error": "Message d'erreur lisible",
  "code": "ERROR_CODE",
  "details": {}
}
```

### Codes HTTP attendus
- `200` - OK
- `201` - Created
- `400` - Bad Request (validation)
- `401` - Unauthorized (non authentifié)
- `403` - Forbidden (pas les permissions)
- `404` - Not Found
- `409` - Conflict (ex: email déjà utilisé)
- `500` - Internal Server Error

---

## 🧩 Logique métier critique

### 1. Système de paiement automatique

#### Règle métier
```javascript
// Card payment → isPaid: true (immédiat)
// Cash payment → isPaid: false jusqu'à livraison
// Quand status devient 'delivered' ET paymentMethod='cash' → isPaid automatiquement true
```

#### Implémentation (DOIT ÊTRE CÔTÉ BACKEND)
```javascript
// Backend - lors de updateOrderStatus
if (newStatus === 'delivered' && order.paymentMethod === 'cash' && !order.isPaid) {
  order.isPaid = true
  order.notes = order.notes
    ? `${order.notes} - Payé à la livraison`
    : 'Payé à la livraison'
}
```

### 2. Suppression de compte RGPD

#### Règle métier
Lors de `DELETE /auth/account` :
- ❌ NE PAS supprimer les commandes/réservations
- ✅ ANONYMISER les données personnelles
- ✅ Préserver les statistiques business

#### Données à anonymiser
```javascript
{
  userId: 'deleted-user',
  userEmail: 'deleted@account.com',
  userName: 'Utilisateur supprimé',
  deliveryAddress: 'Adresse supprimée',
  phone: 'Téléphone supprimé',
  notes: order.notes ? 'Notes supprimées' : '',
  specialRequests: reservation.specialRequests ? 'Demandes supprimées' : ''
}
```

### 3. Gestion des utilisateurs supprimés (UI)

#### Couleurs dans OrdersManagement
```javascript
// src/pages/admin/OrdersManagement.jsx

if (order.userId === 'deleted-user') {
  if (['delivered', 'cancelled'].includes(order.status)) {
    return 'bg-gray-100'  // 🟫 Gris - Terminé
  } else if (order.isPaid) {
    return 'bg-orange-50' // 🟠 Orange - Payé en cours
  } else {
    return 'bg-red-50'    // 🔴 Rouge - Non payé
  }
}
```

### 4. Assignation de table automatique

#### Règle métier
```javascript
// Quand on assigne une table (tableNumber) à une réservation
// ET que status = 'pending'
// → Automatiquement passer status à 'confirmed'

if (reservation.status === 'pending' && tableNumber) {
  reservation.status = 'confirmed'
}
```

### 5. Statuts valides

#### Commandes
```javascript
const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY: 'ready',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
}
// Flow: pending → confirmed → preparing → ready → delivered
```

#### Réservations
```javascript
const RESERVATION_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  SEATED: 'seated',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
}
// Flow: pending → confirmed → seated → completed
```

#### Contacts
```javascript
const CONTACT_STATUS = {
  NEW: 'new',
  READ: 'read',
  REPLIED: 'replied'
}
// Flow: new → read → replied
```

### 6. Terminologie standardisée

- **Réservations** : Toujours utiliser `guests` (JAMAIS `people`)
- **Paiement** : `isPaid` (boolean) + `paymentMethod` ('card' | 'cash')
- **Tables** : `tableNumber` (number ou null)

---

## 📝 Conventions de code

### Nommage
- **Composants** : `PascalCase.jsx` (`UserProfile.jsx`)
- **Hooks** : `camelCase.js` avec préfixe `use` (`useAuth.js`)
- **Stores** : `camelCase.js` avec suffixe `Store` (`authStore.js`)
- **APIs** : `camelCase.js` avec suffixe `Api` (`authApi.js`)
- **Constants** : `UPPER_SNAKE_CASE`
- **Functions** : `camelCase`

### Imports
```javascript
// API - Import centralisé (recommandé)
import { authApi, ordersApi } from '@/api'

// API - Import individuel
import { login, register } from '@/api/authApi'

// Stores
import useAuthStore from '@/store/authStore'

// Hooks
import { useAuth } from '@/hooks/useAuth'

// Constants
import { ROUTES, ORDER_STATUS } from '@/constants'
```

### Format des commits
```
feat: Add user profile page
fix: Resolve cart persistence issue
refactor: Simplify auth store logic
test: Add tests for orders API
docs: Update API endpoints documentation
```

---

## 🔍 Debugging

### Vérifier les appels API
1. Ouvrir DevTools (F12)
2. Onglet **Network**
3. Filtrer par **Fetch/XHR**
4. Vérifier les requêtes vers `http://localhost:3000/api`

### Vérifier le token JWT
```javascript
// Console navigateur
const authStorage = JSON.parse(localStorage.getItem('auth-storage'))
console.log('Token:', authStorage?.state?.token)
```

### Activer les logs debug
```env
# .env
VITE_DEBUG=true
```

### Erreurs courantes

#### Erreur : "Network Error" / "ERR_CONNECTION_REFUSED"
→ Backend non démarré ou mauvaise URL dans `.env`

#### Erreur : 401 Unauthorized en boucle
→ Token invalide ou expiré, vérifier le format JWT backend

#### Erreur : CORS
→ Configurer CORS côté backend pour autoriser `http://localhost:5173`

---

## 📚 Documentation de référence

### Fichiers clés à consulter
1. **`README.md`** - Guide d'utilisation général
2. **`CLAUDE.md`** - Instructions développement et patterns
3. **`API_ENDPOINTS.md`** - Tous les endpoints backend requis
4. **`.env.example`** - Template configuration
5. **`src/api/apiClient.js`** - Configuration Axios
6. **`src/constants/index.js`** - Toutes les constantes

### Ordre de lecture recommandé
1. Ce fichier (`MIGRATION_CONTEXT.md`) pour comprendre l'état actuel
2. `README.md` pour setup initial
3. `API_ENDPOINTS.md` pour comprendre les APIs attendues
4. `CLAUDE.md` pour les patterns de code
5. Code source des stores pour voir ce qui doit être migré

---

## ✅ Checklist de migration

### Préparation
- [x] Repository GitHub créé
- [x] Couche API complète (`src/api/`)
- [x] Documentation complète
- [x] Configuration environnement (`.env.example`)
- [ ] Fichier `.env` créé et configuré
- [ ] Backend démarré et accessible

### Migration stores
- [ ] `authStore.js` migré vers `authApi`
- [ ] `menuStore.js` migré vers `menuApi`
- [ ] `ordersStore.js` migré vers `ordersApi`
- [ ] `reservationsStore.js` migré vers `reservationsApi`
- [ ] `contactsStore.js` migré vers `contactsApi`
- [ ] `usersStore.js` migré (nécessite création `usersApi`)
- [ ] `cartStore.js` reste local (OK)

### Tests
- [ ] Login/Register fonctionne
- [ ] Création commande fonctionne
- [ ] Gestion admin commandes fonctionne
- [ ] Création réservation fonctionne
- [ ] Gestion admin réservations fonctionne
- [ ] CRUD menu admin fonctionne
- [ ] Suppression compte RGPD fonctionne
- [ ] Gestion erreurs réseau OK
- [ ] Gestion 401 (session expirée) OK

### Validation finale
- [ ] Tous les stores utilisent les vraies APIs
- [ ] Plus de simulation localStorage
- [ ] Toasts d'erreur appropriés
- [ ] Loading states corrects
- [ ] Build production fonctionne (`npm run build`)

---

## 🎯 Objectif final

**Transformer le frontend de DÉMO en application PRODUCTION connectée au backend.**

**État actuel** : Frontend complet avec couche API prête, mais stores encore en mode démo.

**État cible** : Tous les stores utilisent les vraies APIs, le frontend communique avec le backend REST.

**Blocage actuel** : Il faut migrer les stores un par un pour remplacer les simulations par les vrais appels API.

---

## 📞 Support

Pour toute question lors de la migration :
1. Consulter ce fichier (`MIGRATION_CONTEXT.md`)
2. Voir `API_ENDPOINTS.md` pour les specs backend
3. Voir `CLAUDE.md` pour les patterns de code
4. Vérifier les fichiers API dans `src/api/` (déjà créés et fonctionnels)

---

**Document créé le** : 6 octobre 2025
**Projet** : restoh-frontend
**Repository** : https://github.com/ChristopheBouriel/restoh-frontend
**Dernière mise à jour** : Migration initiale terminée, stores à migrer
