# Tests E2E - RestOh Frontend

Documentation complète des tests end-to-end avec Playwright.

## Vue d'ensemble

| Métrique | Valeur |
|----------|--------|
| **Total tests** | 658 |
| **Fichiers de test** | 17 |
| **Projets Playwright** | 6 |
| **Navigateurs** | Chromium, Firefox, WebKit (Safari) |

---

## Tests par Projet

| Projet | Tests | Description |
|--------|-------|-------------|
| `mobile-safari` | 204 | Tests sur iPhone Safari (webkit) |
| `mobile-chrome` | 204 | Tests sur mobile Android Chrome |
| `chromium` | 151 | Tests desktop Chrome (utilisateur connecté) |
| `admin` | 53 | Tests panel admin (admin connecté) |
| `chromium-no-auth` | 44 | Tests sans authentification |
| `setup` | 2 | Setup authentification (user + admin) |

---

## Fichiers de Test

### Auth (4 fichiers)

| Fichier | Description | Tests |
|---------|-------------|-------|
| `auth/login.spec.ts` | Connexion utilisateur | Login valide/invalide, validation, "Remember Me" |
| `auth/register.spec.ts` | Inscription | Formulaire, validation, acceptation CGU |
| `auth/logout.spec.ts` | Déconnexion | Logout utilisateur |
| `auth/password-reset.spec.ts` | Réinitialisation mot de passe | Forgot password (email), Reset password (nouveau mdp) |

### Menu & Commandes (2 fichiers)

| Fichier | Description | Tests |
|---------|-------------|-------|
| `menu/menu-browsing.spec.ts` | Navigation menu | Affichage items, filtres catégorie/cuisine, tri prix, recherche, avis |
| `ordering/order-flow.spec.ts` | Processus commande | Ajout panier, modification quantité, checkout delivery/pickup, paiement card/cash |

### Réservations (1 fichier)

| Fichier | Description | Tests |
|---------|-------------|-------|
| `reservations/reservation-flow.spec.ts` | Gestion réservations | Création (lunch/dinner), modification, annulation, validation téléphone |

### Navigation & Contact (2 fichiers)

| Fichier | Description | Tests |
|---------|-------------|-------|
| `navigation/navigation.spec.ts` | Navigation site | Navbar, footer, CTAs home, menu utilisateur |
| `contact/contact.spec.ts` | Page contact | Formulaire, validation champs, soumission |

### Mobile (1 fichier)

| Fichier | Description | Tests |
|---------|-------------|-------|
| `mobile/responsive.spec.ts` | Responsive design | Menu hamburger, layout mobile, touch targets, espacement |

### Accessibilité (2 fichiers)

| Fichier | Description | Tests |
|---------|-------------|-------|
| `accessibility/a11y.spec.ts` | Accessibilité manuelle | Navigation clavier, focus management, HTML sémantique, formulaires |
| `accessibility/axe-violations.spec.ts` | Audit axe-core | Violations WCAG sur toutes les pages |

### Admin (4 fichiers)

| Fichier | Description | Tests |
|---------|-------------|-------|
| `admin/dashboard.spec.ts` | Dashboard admin | Quick stats, navigation, activité récente |
| `admin/access-control.spec.ts` | Contrôle d'accès | Blocage non-admin, redirection non-authentifié |
| `admin/orders-management.spec.ts` | Gestion commandes | Filtres, recherche, changement status, annulation |
| `admin/reservations-management.spec.ts` | Gestion réservations | Filtres, recherche, changement status, détails |

### Debug (1 fichier)

| Fichier | Description | Tests |
|---------|-------------|-------|
| `debug-auth.spec.ts` | Debug authentification | Vérification flux auth |

---

## Architecture

```
e2e/
├── fixtures/                    # Fixtures Playwright
│   └── auth.fixture.ts          # authenticatedPage, unauthenticatedPage, adminPage
├── pages/                       # Page Object Models
│   ├── admin/
│   │   ├── AdminDashboardPage.ts
│   │   ├── AdminOrdersPage.ts
│   │   └── AdminReservationsPage.ts
│   ├── BasePage.ts              # Classe de base (navigation, toasts)
│   ├── LoginPage.ts
│   ├── RegisterPage.ts
│   ├── ForgotPasswordPage.ts
│   ├── ResetPasswordPage.ts
│   ├── MenuPage.ts
│   ├── CheckoutPage.ts
│   ├── ReservationPage.ts
│   ├── ProfilePage.ts
│   ├── ContactPage.ts
│   ├── HomePage.ts
│   └── index.ts                 # Exports centralisés
├── setup/
│   └── auth.setup.ts            # Génère user.json et admin.json
└── tests/
    ├── accessibility/
    ├── admin/
    ├── auth/
    ├── contact/
    ├── menu/
    ├── mobile/
    ├── navigation/
    ├── ordering/
    └── reservations/
```

---

## Commandes

### Lancer tous les tests

```bash
npx playwright test
```

### Lancer par projet

```bash
# Desktop Chrome (utilisateur connecté)
npx playwright test --project=chromium

# Mobile Safari
npx playwright test --project=mobile-safari

# Mobile Chrome
npx playwright test --project=mobile-chrome

# Admin panel
npx playwright test --project=admin

# Sans authentification
npx playwright test --project=chromium-no-auth
```

### Lancer par fichier ou dossier

```bash
# Un fichier spécifique
npx playwright test auth/login.spec.ts

# Tous les tests admin
npx playwright test admin/

# Tous les tests auth
npx playwright test auth/
```

### Lancer un test spécifique

```bash
npx playwright test -g "should login successfully"
```

### Mode UI (interactif)

```bash
npx playwright test --ui
```

### Mode debug

```bash
npx playwright test --debug
```

### Générer un rapport HTML

```bash
npx playwright test --reporter=html
npx playwright show-report
```

---

## Configuration

### Projets Playwright (`playwright.config.ts`)

| Projet | Navigateur | Viewport | Auth |
|--------|------------|----------|------|
| `chromium` | Chromium | Desktop | `user.json` |
| `chromium-no-auth` | Chromium | Desktop | Aucune |
| `mobile-chrome` | Chromium | iPhone 12 | `user.json` |
| `mobile-safari` | WebKit | iPhone 12 | `user.json` |
| `admin` | Chromium | Desktop | `admin.json` |

### Authentification

Les tests utilisent des fichiers d'état de session générés par `auth.setup.ts` :

- `e2e/.auth/user.json` - Session utilisateur standard (demo@test.com)
- `e2e/.auth/admin.json` - Session administrateur (admin@test.com)

---

## Tests Skippés

| Test | Fichier | Raison |
|------|---------|--------|
| `should show success on valid password reset` | password-reset.spec.ts | Nécessite un vrai token du backend |
| `should complete full password reset with valid token` | password-reset.spec.ts | Nécessite un vrai token du backend |

Pour activer ces tests, il faudrait :
1. Créer un endpoint de test dans le backend pour générer des tokens
2. Ou accéder directement à la base de données de test

---

## Bonnes Pratiques

### Page Object Model

Tous les tests utilisent le pattern Page Object Model pour :
- Encapsuler les sélecteurs
- Réutiliser les actions communes
- Faciliter la maintenance

```typescript
// Exemple d'utilisation
const loginPage = new LoginPage(page);
await loginPage.goto();
await loginPage.login('demo@test.com', 'password123');
await loginPage.expectLoginSuccess();
```

### Fixtures d'authentification

Utiliser les fixtures pour les différents contextes d'auth :

```typescript
import { test } from '../../fixtures/auth.fixture';

// Test avec utilisateur connecté
test('should do something', async ({ authenticatedPage }) => {
  // ...
});

// Test sans authentification
test('should redirect to login', async ({ unauthenticatedPage }) => {
  // ...
});

// Test admin
test('should access admin panel', async ({ adminPage }) => {
  // ...
});
```

### Override d'authentification

Pour tester un contexte d'auth différent dans un describe :

```typescript
test.describe('Non-admin access', () => {
  test.use({ storageState: './e2e/.auth/user.json' });

  test('should deny access', async ({ page }) => {
    // Ce test utilise user.json même dans le projet admin
  });
});
```

---

## Prérequis

### Installation des navigateurs

```bash
npx playwright install
```

Ou un navigateur spécifique :

```bash
npx playwright install chromium
npx playwright install webkit
npx playwright install firefox
```

### Variables d'environnement

Les tests utilisent les mêmes variables que l'application :

```env
VITE_API_URL=http://localhost:3001/api
```

### Serveurs requis

Avant de lancer les tests :

1. **Backend** : `npm run dev` dans le projet backend (port 3001)
2. **Frontend** : `npm run dev` dans ce projet (port 5173)

---

## CI/CD

Pour intégrer dans GitHub Actions, créer `.github/workflows/e2e.yml` :

```yaml
name: E2E Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Start backend
        run: |
          cd ../restoh-backend
          npm ci
          npm run dev &

      - name: Start frontend
        run: npm run dev &

      - name: Wait for servers
        run: npx wait-on http://localhost:5173 http://localhost:3001/api/health

      - name: Run E2E tests
        run: npx playwright test

      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

---

*Dernière mise à jour : Décembre 2024*
