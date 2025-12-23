# Plan de Tests E2E avec Playwright - RestOh Frontend

> Document créé le 23 décembre 2024
> Basé sur les meilleures pratiques officielles Playwright, Kent C. Dodds, et retours d'équipes en production.

## Table des Matières

1. [Philosophie et Stratégie](#1-philosophie-et-stratégie)
2. [Architecture et Structure](#2-architecture-et-structure)
3. [Configuration](#3-configuration)
4. [Patterns d'Authentification](#4-patterns-dauthentification)
5. [Page Object Model](#5-page-object-model)
6. [Stratégie de Sélecteurs](#6-stratégie-de-sélecteurs)
7. [Mocking API vs Backend Réel](#7-mocking-api-vs-backend-réel)
8. [Tests par Fonctionnalité](#8-tests-par-fonctionnalité)
9. [Tests Mobile](#9-tests-mobile)
10. [Tests d'Accessibilité](#10-tests-daccessibilité)
11. [CI/CD et Parallélisation](#11-cicd-et-parallélisation)
12. [Debugging et Reporting](#12-debugging-et-reporting)
13. [Prévention des Tests Flaky](#13-prévention-des-tests-flaky)
14. [Checklist d'Implémentation](#14-checklist-dimplémentation)

---

## 1. Philosophie et Stratégie

### Le "Testing Trophy" de Kent C. Dodds

```
        ┌─────────┐
        │  E2E    │  ← Peu de tests, parcours critiques uniquement
       ┌┴─────────┴┐
       │Integration │  ← Focus principal (déjà fait avec Vitest)
      ┌┴───────────┴┐
      │    Unit     │  ← Tests isolés logique métier
     ┌┴─────────────┴┐
     │ Static (ESLint)│
     └───────────────┘
```

**Principe clé** : "The more your tests resemble the way your software is used, the more confidence they can give you."

### Ce qu'on teste en E2E vs ce qu'on a déjà

| Type | Déjà couvert (Vitest) | À faire (Playwright) |
|------|----------------------|---------------------|
| Logique métier | ✅ Services, Stores | - |
| Composants isolés | ✅ 1417 tests | - |
| Intégration UI | ✅ Hooks + Stores | - |
| Parcours utilisateur complet | ❌ | ✅ |
| Multi-navigateurs | ❌ | ✅ |
| Mobile responsive | ❌ | ✅ |
| Accessibilité | ❌ | ✅ |

### Parcours Critiques à Tester (Happy Paths)

**Priorité 1 - Bloquants business** :
1. Inscription → Vérification email → Connexion
2. Commande complète : Menu → Panier → Checkout → Confirmation
3. Réservation : Formulaire → Confirmation

**Priorité 2 - Fonctionnalités clés** :
4. Connexion/Déconnexion (Remember Me)
5. Profil : Modification infos, changement mot de passe
6. Contact : Envoi message

**Priorité 3 - Admin** :
7. Dashboard : Affichage stats
8. Gestion commandes : Changement statut
9. Gestion réservations : Changement statut

---

## 2. Architecture et Structure

### Structure des Dossiers

```
restoh-frontend/
├── e2e/                              # Dossiers tests E2E
│   ├── .auth/                        # États d'authentification sauvegardés
│   │   ├── user.json
│   │   └── admin.json
│   │
│   ├── fixtures/                     # Fixtures personnalisées
│   │   ├── auth.fixture.ts
│   │   └── test-data.fixture.ts
│   │
│   ├── pages/                        # Page Object Models
│   │   ├── BasePage.ts
│   │   ├── LoginPage.ts
│   │   ├── RegisterPage.ts
│   │   ├── MenuPage.ts
│   │   ├── CartPage.ts
│   │   ├── CheckoutPage.ts
│   │   ├── ReservationPage.ts
│   │   ├── ProfilePage.ts
│   │   ├── ContactPage.ts
│   │   └── admin/
│   │       ├── DashboardPage.ts
│   │       ├── OrdersManagementPage.ts
│   │       └── ReservationsManagementPage.ts
│   │
│   ├── components/                   # Component Objects (réutilisables)
│   │   ├── NavbarComponent.ts
│   │   ├── FooterComponent.ts
│   │   ├── CartModalComponent.ts
│   │   └── ToastComponent.ts
│   │
│   ├── tests/                        # Fichiers de tests
│   │   ├── auth/
│   │   │   ├── login.spec.ts
│   │   │   ├── register.spec.ts
│   │   │   └── password-reset.spec.ts
│   │   ├── ordering/
│   │   │   ├── menu-browsing.spec.ts
│   │   │   ├── cart.spec.ts
│   │   │   └── checkout.spec.ts
│   │   ├── reservation/
│   │   │   └── reservation-flow.spec.ts
│   │   ├── user/
│   │   │   ├── profile.spec.ts
│   │   │   └── contact.spec.ts
│   │   ├── admin/
│   │   │   ├── dashboard.spec.ts
│   │   │   ├── orders-management.spec.ts
│   │   │   └── reservations-management.spec.ts
│   │   └── accessibility/
│   │       └── wcag.spec.ts
│   │
│   ├── setup/                        # Scripts de setup
│   │   ├── auth.setup.ts             # Setup authentification
│   │   └── global.setup.ts           # Setup global
│   │
│   └── utils/                        # Utilitaires
│       ├── test-helpers.ts
│       └── data-generators.ts
│
├── playwright.config.ts              # Configuration Playwright
└── package.json                      # Scripts ajoutés
```

### Conventions de Nommage

| Type | Convention | Exemple |
|------|-----------|---------|
| Tests | `kebab-case.spec.ts` | `checkout.spec.ts` |
| Page Objects | `PascalCase + Page` | `LoginPage.ts` |
| Components | `PascalCase + Component` | `NavbarComponent.ts` |
| Fixtures | `kebab-case.fixture.ts` | `auth.fixture.ts` |
| Setup | `kebab-case.setup.ts` | `auth.setup.ts` |

---

## 3. Configuration

### Installation

```bash
# Installation Playwright
npm init playwright@latest

# Dépendances additionnelles recommandées
npm install -D @axe-core/playwright  # Tests accessibilité
```

### playwright.config.ts

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Dossier des tests
  testDir: './e2e/tests',

  // Exécution parallèle
  fullyParallel: true,

  // Échouer si test.only() oublié en CI
  forbidOnly: !!process.env.CI,

  // Retries : 2 en CI, 0 en local
  retries: process.env.CI ? 2 : 0,

  // Workers : 1 en CI (stabilité), max en local
  workers: process.env.CI ? 1 : undefined,

  // Reporters
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'e2e/test-results/results.json' }],
    // GitHub Actions annotations
    ...(process.env.CI ? [['github']] : []),
  ],

  // Options globales
  use: {
    // URL de base
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:5173',

    // Traces uniquement sur premier retry (debug CI)
    trace: 'on-first-retry',

    // Screenshots sur échec
    screenshot: 'only-on-failure',

    // Vidéos conservées sur échec
    video: 'retain-on-failure',

    // Timeout actions
    actionTimeout: 10000,

    // Timeout navigation
    navigationTimeout: 30000,
  },

  // Timeout global par test
  timeout: 60000,

  // Projets (navigateurs + devices)
  projects: [
    // === SETUP ===
    {
      name: 'setup-user',
      testMatch: /auth\.setup\.ts/,
      use: { storageState: undefined },
    },

    // === DESKTOP ===
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: './e2e/.auth/user.json',
      },
      dependencies: ['setup-user'],
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        storageState: './e2e/.auth/user.json',
      },
      dependencies: ['setup-user'],
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        storageState: './e2e/.auth/user.json',
      },
      dependencies: ['setup-user'],
    },

    // === MOBILE ===
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
        storageState: './e2e/.auth/user.json',
      },
      dependencies: ['setup-user'],
    },
    {
      name: 'mobile-safari',
      use: {
        ...devices['iPhone 13'],
        storageState: './e2e/.auth/user.json',
      },
      dependencies: ['setup-user'],
    },

    // === ADMIN (projet séparé) ===
    {
      name: 'admin',
      testMatch: /admin\/.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: './e2e/.auth/admin.json',
      },
      dependencies: ['setup-user'], // Le setup crée aussi admin.json
    },
  ],

  // Serveur de dev automatique
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

### Scripts package.json

```json
{
  "scripts": {
    "e2e": "playwright test",
    "e2e:ui": "playwright test --ui",
    "e2e:headed": "playwright test --headed",
    "e2e:debug": "playwright test --debug",
    "e2e:codegen": "playwright codegen http://localhost:5173",
    "e2e:report": "playwright show-report",
    "e2e:trace": "playwright show-trace"
  }
}
```

---

## 4. Patterns d'Authentification

### Principe : Authentifier une fois, réutiliser partout

L'authentification via UI est lente (~3-5s). En la faisant une seule fois et en sauvegardant l'état, on économise ce temps sur chaque test.

**Impact** : Jusqu'à 70% de réduction du temps d'exécution.

### auth.setup.ts

```typescript
// e2e/setup/auth.setup.ts
import { test as setup, expect } from '@playwright/test';

const USER_FILE = './e2e/.auth/user.json';
const ADMIN_FILE = './e2e/.auth/admin.json';

// Credentials de test (à mettre dans .env pour CI)
const TEST_USER = {
  email: process.env.E2E_USER_EMAIL || 'test-user@restoh.fr',
  password: process.env.E2E_USER_PASSWORD || 'TestPassword123!',
};

const TEST_ADMIN = {
  email: process.env.E2E_ADMIN_EMAIL || 'admin@restoh.fr',
  password: process.env.E2E_ADMIN_PASSWORD || 'AdminPassword123!',
};

setup('authenticate as user', async ({ page }) => {
  // Aller sur la page de login
  await page.goto('/login');

  // Remplir le formulaire
  await page.getByLabel('Email').fill(TEST_USER.email);
  await page.getByLabel('Password').fill(TEST_USER.password);

  // Soumettre
  await page.getByRole('button', { name: /sign in|connexion/i }).click();

  // Attendre la redirection vers le dashboard ou home
  await page.waitForURL(/\/(dashboard|menu|home)?$/);

  // Vérifier qu'on est connecté
  await expect(page.getByRole('button', { name: /logout|déconnexion|profile/i })).toBeVisible();

  // Sauvegarder l'état
  await page.context().storageState({ path: USER_FILE });
});

setup('authenticate as admin', async ({ page }) => {
  await page.goto('/login');

  await page.getByLabel('Email').fill(TEST_ADMIN.email);
  await page.getByLabel('Password').fill(TEST_ADMIN.password);

  await page.getByRole('button', { name: /sign in|connexion/i }).click();

  // Admin redirigé vers dashboard admin
  await page.waitForURL(/\/admin/);

  await page.context().storageState({ path: ADMIN_FILE });
});
```

### Fixture d'Authentification Personnalisée

```typescript
// e2e/fixtures/auth.fixture.ts
import { test as base, Page } from '@playwright/test';

type AuthFixtures = {
  authenticatedPage: Page;
  adminPage: Page;
  unauthenticatedPage: Page;
};

export const test = base.extend<AuthFixtures>({
  // Page avec utilisateur connecté (défaut)
  authenticatedPage: async ({ page }, use) => {
    await use(page);
  },

  // Page avec admin connecté
  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: './e2e/.auth/admin.json',
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  // Page sans authentification (pour tester login/register)
  unauthenticatedPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: undefined, // Pas d'état sauvegardé
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

export { expect } from '@playwright/test';
```

---

## 5. Page Object Model

### Pourquoi POM ?

- **Maintenabilité** : Un changement UI = une modification dans le Page Object, pas dans 50 tests
- **Réutilisabilité** : Actions communes centralisées
- **Lisibilité** : Tests décrivent le "quoi", Page Objects le "comment"

### BasePage.ts

```typescript
// e2e/pages/BasePage.ts
import { Page, Locator, expect } from '@playwright/test';

export abstract class BasePage {
  constructor(protected page: Page) {}

  // Navigation
  async goto(path: string = '') {
    await this.page.goto(path);
  }

  // Attendre le chargement complet
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  // Toast notifications
  async expectSuccessToast(message?: string | RegExp) {
    const toast = this.page.locator('[data-testid="toast-success"], .toast-success');
    await expect(toast).toBeVisible();
    if (message) {
      await expect(toast).toContainText(message);
    }
  }

  async expectErrorToast(message?: string | RegExp) {
    const toast = this.page.locator('[data-testid="toast-error"], .toast-error');
    await expect(toast).toBeVisible();
    if (message) {
      await expect(toast).toContainText(message);
    }
  }

  // Helpers communs
  async clickAndWaitForNavigation(locator: Locator) {
    await Promise.all([
      this.page.waitForNavigation(),
      locator.click(),
    ]);
  }
}
```

### Exemple : LoginPage.ts

```typescript
// e2e/pages/LoginPage.ts
import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  // Locators (lazy, évalués à l'utilisation)
  private get emailInput() {
    return this.page.getByLabel('Email');
  }

  private get passwordInput() {
    return this.page.getByLabel('Password');
  }

  private get rememberMeCheckbox() {
    return this.page.getByRole('checkbox', { name: /remember me|se souvenir/i });
  }

  private get submitButton() {
    return this.page.getByRole('button', { name: /sign in|connexion/i });
  }

  private get forgotPasswordLink() {
    return this.page.getByRole('link', { name: /forgot password|mot de passe oublié/i });
  }

  private get registerLink() {
    return this.page.getByRole('link', { name: /register|créer un compte/i });
  }

  // Actions
  async goto() {
    await super.goto('/login');
  }

  async login(email: string, password: string, rememberMe = false) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);

    if (rememberMe) {
      await this.rememberMeCheckbox.check();
    }

    await this.submitButton.click();
  }

  async loginAndExpectSuccess(email: string, password: string) {
    await this.login(email, password);
    // Attendre redirection hors de /login
    await this.page.waitForURL((url) => !url.pathname.includes('/login'));
  }

  async loginAndExpectError(email: string, password: string, errorMessage?: string | RegExp) {
    await this.login(email, password);
    await this.expectErrorToast(errorMessage);
    // Rester sur /login
    await expect(this.page).toHaveURL(/\/login/);
  }

  // Assertions
  async expectToBeOnLoginPage() {
    await expect(this.page).toHaveURL(/\/login/);
    await expect(this.emailInput).toBeVisible();
  }
}
```

### Exemple : MenuPage.ts avec Component Object

```typescript
// e2e/components/MenuItemCardComponent.ts
import { Locator, Page } from '@playwright/test';

export class MenuItemCardComponent {
  constructor(private card: Locator) {}

  get name() {
    return this.card.locator('[data-testid="item-name"], h3, .item-name').first();
  }

  get price() {
    return this.card.locator('[data-testid="item-price"], .price').first();
  }

  get addToCartButton() {
    return this.card.getByRole('button', { name: /add to cart|ajouter/i });
  }

  async addToCart() {
    await this.addToCartButton.click();
  }
}

// e2e/pages/MenuPage.ts
import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { MenuItemCardComponent } from '../components/MenuItemCardComponent';

export class MenuPage extends BasePage {
  // Locators
  private get categoryTabs() {
    return this.page.getByRole('tablist').getByRole('tab');
  }

  private get menuItems() {
    return this.page.locator('[data-testid="menu-item"], .menu-item-card');
  }

  private get searchInput() {
    return this.page.getByPlaceholder(/search|rechercher/i);
  }

  private get cartButton() {
    return this.page.getByRole('button', { name: /cart|panier/i });
  }

  private get cartBadge() {
    return this.page.locator('[data-testid="cart-badge"], .cart-badge');
  }

  // Actions
  async goto() {
    await super.goto('/menu');
  }

  async selectCategory(categoryName: string) {
    await this.categoryTabs.filter({ hasText: categoryName }).click();
  }

  async searchItem(query: string) {
    await this.searchInput.fill(query);
  }

  async getMenuItem(index: number): Promise<MenuItemCardComponent> {
    const card = this.menuItems.nth(index);
    await card.waitFor();
    return new MenuItemCardComponent(card);
  }

  async getMenuItemByName(name: string): Promise<MenuItemCardComponent> {
    const card = this.menuItems.filter({ hasText: name }).first();
    await card.waitFor();
    return new MenuItemCardComponent(card);
  }

  async addItemToCartByName(itemName: string) {
    const item = await this.getMenuItemByName(itemName);
    await item.addToCart();
  }

  async openCart() {
    await this.cartButton.click();
  }

  // Assertions
  async expectCartCount(count: number) {
    if (count === 0) {
      await expect(this.cartBadge).toBeHidden();
    } else {
      await expect(this.cartBadge).toContainText(String(count));
    }
  }

  async expectItemsVisible(minCount = 1) {
    await expect(this.menuItems.first()).toBeVisible();
    const count = await this.menuItems.count();
    expect(count).toBeGreaterThanOrEqual(minCount);
  }
}
```

---

## 6. Stratégie de Sélecteurs

### Priorité des Sélecteurs (Recommandation Officielle)

```
1. getByRole()        ← Meilleur choix (accessibilité)
2. getByLabel()       ← Formulaires
3. getByPlaceholder() ← Inputs sans label
4. getByText()        ← Contenu textuel
5. getByTestId()      ← Quand rien d'autre ne marche
6. CSS/XPath          ← Dernier recours
```

### Exemples Pratiques

```typescript
// ✅ BON - Accessibilité first
await page.getByRole('button', { name: 'Add to cart' }).click();
await page.getByRole('textbox', { name: 'Email' }).fill('test@test.com');
await page.getByRole('checkbox', { name: 'Remember me' }).check();
await page.getByRole('link', { name: 'Forgot password?' }).click();
await page.getByRole('heading', { name: 'Welcome' }).isVisible();
await page.getByRole('tab', { name: 'Starters' }).click();

// ✅ BON - Labels de formulaire
await page.getByLabel('Password').fill('secret');
await page.getByLabel('Phone number').fill('0612345678');

// ✅ BON - Texte visible
await page.getByText('Order confirmed!').isVisible();
await page.getByText(/total.*€/i).isVisible();

// ✅ ACCEPTABLE - data-testid pour éléments sans sémantique
await page.getByTestId('cart-item-count').textContent();
await page.getByTestId('order-status-badge').isVisible();

// ❌ ÉVITER - CSS fragiles
await page.locator('.btn-primary').click();
await page.locator('#submit-btn').click();
await page.locator('div > span.price').textContent();
```

### Ajouter data-testid Quand Nécessaire

Si un élément n'a pas de rôle/label accessible, ajouter `data-testid` dans le composant React :

```jsx
// Avant (pas de sélecteur stable)
<span className="badge bg-green-500">{count}</span>

// Après (testable)
<span className="badge bg-green-500" data-testid="cart-badge">{count}</span>
```

**Règle** : Préférer améliorer l'accessibilité (ajouter `aria-label`) plutôt qu'ajouter `data-testid`.

---

## 7. Mocking API vs Backend Réel

### Stratégie Recommandée pour RestOh

| Scénario | Approche | Raison |
|----------|----------|--------|
| Tests E2E principaux | Backend réel (staging) | Confiance maximale |
| Tests de cas d'erreur | Mock API | Difficile à reproduire |
| Tests visuels/UI | Mock API | Données consistantes |
| Développement local | Mock API | Pas besoin du backend |
| CI/CD | Backend réel (staging) | Validation intégration |

### Configuration pour Backend Réel

```typescript
// playwright.config.ts
use: {
  baseURL: process.env.CI
    ? 'https://staging.restoh.fr'  // Staging en CI
    : 'http://localhost:5173',      // Local
}
```

### Mocking avec Playwright (cas d'erreur)

```typescript
// e2e/tests/ordering/checkout-errors.spec.ts
import { test, expect } from '@playwright/test';

test('should handle payment failure gracefully', async ({ page }) => {
  // Mock uniquement l'endpoint de paiement pour simuler une erreur
  await page.route('**/api/orders', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 402,
        json: {
          success: false,
          error: 'Payment declined',
          code: 'PAYMENT_FAILED',
        },
      });
    } else {
      await route.continue();
    }
  });

  // ... reste du test
  await page.goto('/checkout');
  await page.getByRole('button', { name: /pay|payer/i }).click();
  await expect(page.getByText(/payment.*failed|paiement.*échoué/i)).toBeVisible();
});
```

### Mocking Complet pour Tests Isolés

```typescript
// e2e/tests/menu/menu-display.spec.ts
import { test, expect } from '@playwright/test';

const mockMenuItems = [
  { id: '1', name: 'Pizza Margherita', price: 12.90, category: 'Pizzas' },
  { id: '2', name: 'Burger Classic', price: 14.50, category: 'Burgers' },
];

test.describe('Menu display (mocked)', () => {
  test.beforeEach(async ({ page }) => {
    // Mock toutes les requêtes menu
    await page.route('**/api/menu/**', async (route) => {
      await route.fulfill({
        status: 200,
        json: { success: true, items: mockMenuItems },
      });
    });
  });

  test('should display menu items', async ({ page }) => {
    await page.goto('/menu');

    for (const item of mockMenuItems) {
      await expect(page.getByText(item.name)).toBeVisible();
    }
  });
});
```

---

## 8. Tests par Fonctionnalité

### 8.1 Authentification

```typescript
// e2e/tests/auth/login.spec.ts
import { test, expect } from '../../fixtures/auth.fixture';
import { LoginPage } from '../../pages/LoginPage';

test.describe('Login', () => {
  test('should login successfully with valid credentials', async ({ unauthenticatedPage }) => {
    const loginPage = new LoginPage(unauthenticatedPage);
    await loginPage.goto();

    await loginPage.loginAndExpectSuccess('test-user@restoh.fr', 'TestPassword123!');

    // Vérifier redirection
    await expect(unauthenticatedPage).not.toHaveURL(/\/login/);
  });

  test('should show error with invalid credentials', async ({ unauthenticatedPage }) => {
    const loginPage = new LoginPage(unauthenticatedPage);
    await loginPage.goto();

    await loginPage.loginAndExpectError(
      'wrong@email.com',
      'wrongpassword',
      /invalid|incorrect|invalide/i
    );
  });

  test('should persist session with Remember Me', async ({ unauthenticatedPage, context }) => {
    const loginPage = new LoginPage(unauthenticatedPage);
    await loginPage.goto();

    await loginPage.login('test-user@restoh.fr', 'TestPassword123!', true);
    await unauthenticatedPage.waitForURL((url) => !url.pathname.includes('/login'));

    // Fermer et rouvrir le navigateur
    const cookies = await context.cookies();
    const hasRememberToken = cookies.some(c => c.name.includes('remember') || c.maxAge > 86400);
    expect(hasRememberToken).toBeTruthy();
  });
});
```

### 8.2 Parcours Commande Complet

```typescript
// e2e/tests/ordering/complete-order-flow.spec.ts
import { test, expect } from '@playwright/test';
import { MenuPage } from '../../pages/MenuPage';
import { CheckoutPage } from '../../pages/CheckoutPage';

test.describe('Complete Order Flow', () => {
  test('should complete a pickup order from menu to confirmation', async ({ page }) => {
    const menuPage = new MenuPage(page);
    const checkoutPage = new CheckoutPage(page);

    // 1. Parcourir le menu et ajouter des items
    await menuPage.goto();
    await menuPage.addItemToCartByName('Pizza Margherita');
    await menuPage.expectSuccessToast(/added|ajouté/i);
    await menuPage.expectCartCount(1);

    // 2. Ajouter un autre item
    await menuPage.addItemToCartByName('Tiramisu');
    await menuPage.expectCartCount(2);

    // 3. Ouvrir le panier et aller au checkout
    await menuPage.openCart();
    await page.getByRole('button', { name: /checkout|commander/i }).click();

    // 4. Remplir les infos de commande
    await checkoutPage.expectToBeOnCheckoutPage();
    await checkoutPage.selectOrderType('pickup');
    await checkoutPage.selectPaymentMethod('card');

    // 5. Confirmer la commande
    await checkoutPage.confirmOrder();

    // 6. Vérifier la confirmation
    await expect(page.getByText(/order confirmed|commande confirmée/i)).toBeVisible();
    await expect(page.getByText(/order number|numéro de commande/i)).toBeVisible();
  });

  test('should complete a delivery order with address', async ({ page }) => {
    const menuPage = new MenuPage(page);
    const checkoutPage = new CheckoutPage(page);

    await menuPage.goto();
    await menuPage.addItemToCartByName('Burger Classic');
    await menuPage.openCart();
    await page.getByRole('button', { name: /checkout|commander/i }).click();

    await checkoutPage.selectOrderType('delivery');
    await checkoutPage.fillDeliveryAddress({
      street: '123 Rue de Paris',
      city: 'Paris',
      postalCode: '75001',
    });
    await checkoutPage.selectPaymentMethod('cash');
    await checkoutPage.confirmOrder();

    await expect(page.getByText(/order confirmed|commande confirmée/i)).toBeVisible();
  });
});
```

### 8.3 Réservation

```typescript
// e2e/tests/reservation/reservation-flow.spec.ts
import { test, expect } from '@playwright/test';
import { ReservationPage } from '../../pages/ReservationPage';

test.describe('Reservation Flow', () => {
  test('should make a reservation successfully', async ({ page }) => {
    const reservationPage = new ReservationPage(page);

    await reservationPage.goto();

    // Sélectionner une date future
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);
    await reservationPage.selectDate(futureDate);

    // Sélectionner le nombre de personnes
    await reservationPage.selectGuests(4);

    // Sélectionner un créneau
    await reservationPage.selectTimeSlot('19:30');

    // Ajouter une demande spéciale
    await reservationPage.addSpecialRequest('Table près de la fenêtre si possible');

    // Confirmer
    await reservationPage.confirmReservation();

    // Vérifier la confirmation
    await expect(page.getByText(/reservation confirmed|réservation confirmée/i)).toBeVisible();
    await expect(page.getByText(/reservation number|numéro de réservation/i)).toBeVisible();
  });

  test('should show unavailable slots as disabled', async ({ page }) => {
    const reservationPage = new ReservationPage(page);

    await reservationPage.goto();

    // Sélectionner une date
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    await reservationPage.selectDate(futureDate);

    // Vérifier qu'il y a des créneaux (certains peuvent être disabled)
    await reservationPage.expectTimeSlotsVisible();
  });
});
```

### 8.4 Admin - Gestion Commandes

```typescript
// e2e/tests/admin/orders-management.spec.ts
import { test, expect } from '../../fixtures/auth.fixture';
import { OrdersManagementPage } from '../../pages/admin/OrdersManagementPage';

test.describe('Admin - Orders Management', () => {
  test('should display orders list', async ({ adminPage }) => {
    const ordersPage = new OrdersManagementPage(adminPage);

    await ordersPage.goto();

    await ordersPage.expectOrdersListVisible();
    await expect(adminPage.getByText('Orders Management')).toBeVisible();
  });

  test('should filter orders by status', async ({ adminPage }) => {
    const ordersPage = new OrdersManagementPage(adminPage);

    await ordersPage.goto();
    await ordersPage.filterByStatus('preparing');

    // Vérifier que seules les commandes "preparing" sont affichées
    await ordersPage.expectAllOrdersHaveStatus('preparing');
  });

  test('should update order status', async ({ adminPage }) => {
    const ordersPage = new OrdersManagementPage(adminPage);

    await ordersPage.goto();

    // Prendre la première commande
    const firstOrderStatus = await ordersPage.getFirstOrderStatus();

    // Changer le statut
    await ordersPage.updateFirstOrderStatus('ready');

    // Vérifier le toast de succès
    await ordersPage.expectSuccessToast(/status updated|statut mis à jour/i);
  });
});
```

---

## 9. Tests Mobile

### Configuration Déjà en Place

La config `playwright.config.ts` inclut déjà :
- `mobile-chrome` (Pixel 5)
- `mobile-safari` (iPhone 13)

### Tests Spécifiques Mobile

```typescript
// e2e/tests/mobile/responsive.spec.ts
import { test, expect, devices } from '@playwright/test';

test.describe('Mobile Responsive', () => {
  test.use({ ...devices['iPhone 13'] });

  test('should show mobile menu hamburger', async ({ page }) => {
    await page.goto('/');

    // Menu hamburger visible sur mobile
    await expect(page.getByRole('button', { name: /menu/i })).toBeVisible();

    // Navigation desktop cachée
    await expect(page.getByRole('navigation').getByRole('link', { name: 'Menu' })).toBeHidden();
  });

  test('should open mobile menu on hamburger click', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: /menu/i }).click();

    // Menu mobile visible
    await expect(page.getByRole('navigation')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Menu' })).toBeVisible();
  });

  test('should handle touch on menu items', async ({ page }) => {
    await page.goto('/menu');

    // Tap pour ajouter au panier
    await page.getByRole('button', { name: /add to cart|ajouter/i }).first().tap();

    await expect(page.getByText(/added|ajouté/i)).toBeVisible();
  });
});
```

---

## 10. Tests d'Accessibilité

### Installation

```bash
npm install -D @axe-core/playwright
```

### Tests WCAG

```typescript
// e2e/tests/accessibility/wcag.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const pagesToTest = [
  { name: 'Home', path: '/' },
  { name: 'Menu', path: '/menu' },
  { name: 'Login', path: '/login' },
  { name: 'Register', path: '/register' },
  { name: 'Contact', path: '/contact' },
  { name: 'Reservation', path: '/reservation' },
];

test.describe('Accessibility - WCAG 2.1 AA', () => {
  for (const { name, path } of pagesToTest) {
    test(`${name} page should have no accessibility violations`, async ({ page }) => {
      await page.goto(path);

      // Attendre que la page soit chargée
      await page.waitForLoadState('networkidle');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      // Log les violations pour debug
      if (results.violations.length > 0) {
        console.log(`Violations on ${name}:`, JSON.stringify(results.violations, null, 2));
      }

      expect(results.violations).toEqual([]);
    });
  }
});

test.describe('Accessibility - Keyboard Navigation', () => {
  test('should navigate login form with keyboard only', async ({ page }) => {
    await page.goto('/login');

    // Tab vers email
    await page.keyboard.press('Tab');
    await expect(page.getByLabel('Email')).toBeFocused();

    // Tab vers password
    await page.keyboard.press('Tab');
    await expect(page.getByLabel('Password')).toBeFocused();

    // Tab vers Remember Me
    await page.keyboard.press('Tab');

    // Tab vers Submit
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: /sign in|connexion/i })).toBeFocused();
  });
});
```

### Exclure des Éléments Connus (Temporairement)

```typescript
test('should have no violations except known issues', async ({ page }) => {
  await page.goto('/menu');

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .exclude('.third-party-widget') // Exclure widget externe
    .disableRules(['color-contrast']) // Désactiver temporairement
    .analyze();

  expect(results.violations).toEqual([]);
});
```

---

## 11. CI/CD et Parallélisation

### GitHub Actions - Workflow Complet

```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  E2E_BASE_URL: ${{ secrets.E2E_STAGING_URL }}
  E2E_USER_EMAIL: ${{ secrets.E2E_USER_EMAIL }}
  E2E_USER_PASSWORD: ${{ secrets.E2E_USER_PASSWORD }}
  E2E_ADMIN_EMAIL: ${{ secrets.E2E_ADMIN_EMAIL }}
  E2E_ADMIN_PASSWORD: ${{ secrets.E2E_ADMIN_PASSWORD }}

jobs:
  e2e-tests:
    timeout-minutes: 30
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        # Sharding : diviser les tests en 4 parties
        shardIndex: [1, 2, 3, 4]
        shardTotal: [4]

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright Browsers
        run: npx playwright install --with-deps chromium

      - name: Run E2E tests
        run: npx playwright test --shard=${{ matrix.shardIndex }}/${{ matrix.shardTotal }}

      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report-${{ matrix.shardIndex }}
          path: |
            playwright-report/
            e2e/test-results/
          retention-days: 7

  # Job pour merger les rapports
  merge-reports:
    needs: e2e-tests
    runs-on: ubuntu-latest
    if: always()
    steps:
      - name: Download all reports
        uses: actions/download-artifact@v4
        with:
          pattern: playwright-report-*
          merge-multiple: true

      - name: Upload merged report
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report-full
          path: playwright-report/
          retention-days: 30
```

### Optimisations CI

1. **Sharding** : Divise les tests en 4 parties parallèles
2. **Un seul navigateur** : Chromium uniquement en CI (suffisant pour la plupart des bugs)
3. **Cache npm** : Réutilise node_modules
4. **Fail-fast: false** : Continue même si un shard échoue

---

## 12. Debugging et Reporting

### Trace Viewer (Outil Principal)

```bash
# Ouvrir une trace après échec
npx playwright show-trace e2e/test-results/*/trace.zip

# Ou via l'interface web
# Aller sur https://trace.playwright.dev et glisser le fichier
```

**Ce que le Trace Viewer montre** :
- Timeline de chaque action
- Screenshots à chaque étape
- DOM snapshot interactif
- Logs console
- Requêtes réseau
- Code source du test

### HTML Report

```bash
# Générer et ouvrir le rapport
npx playwright show-report
```

### Debug Mode (Local)

```bash
# Mode debug avec Playwright Inspector
npx playwright test --debug

# Exécuter un seul test en debug
npx playwright test login.spec.ts --debug

# Mode headed (voir le navigateur)
npx playwright test --headed
```

### UI Mode (Recommandé pour Développement)

```bash
npx playwright test --ui
```

- Interface graphique
- Watch mode
- Voir les tests passer en temps réel
- Filtrer par fichier/test
- Voir les traces directement

---

## 13. Prévention des Tests Flaky

### Règles d'Or

1. **Ne JAMAIS utiliser `waitForTimeout()`**
   ```typescript
   // ❌ Mauvais
   await page.waitForTimeout(3000);

   // ✅ Bon
   await expect(page.getByText('Loaded')).toBeVisible();
   ```

2. **Utiliser les Web-First Assertions**
   ```typescript
   // ❌ Mauvais - Ne retry pas
   const isVisible = await page.getByRole('button').isVisible();
   expect(isVisible).toBe(true);

   // ✅ Bon - Auto-retry
   await expect(page.getByRole('button')).toBeVisible();
   ```

3. **Attendre les réponses API**
   ```typescript
   // Attendre une requête spécifique
   const responsePromise = page.waitForResponse('**/api/orders');
   await page.getByRole('button', { name: 'Submit' }).click();
   await responsePromise;
   ```

4. **Isolation des Tests**
   - Chaque test doit être indépendant
   - Ne pas dépendre de l'ordre d'exécution
   - Utiliser des données de test uniques si nécessaire

5. **Sélecteurs Stables**
   - Préférer `getByRole`, `getByLabel`, `getByTestId`
   - Éviter les sélecteurs CSS dynamiques

### Config Anti-Flaky

```typescript
// playwright.config.ts
export default defineConfig({
  retries: process.env.CI ? 2 : 0,

  use: {
    // Timeouts généreux
    actionTimeout: 10000,
    navigationTimeout: 30000,

    // Trace pour debug des retries
    trace: 'on-first-retry',
  },

  // Timeout global
  timeout: 60000,

  // Reporter pour identifier les flaky
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results.json' }],
  ],
});
```

---

## 14. Checklist d'Implémentation

### Phase 1 : Setup Initial (2-3h)
- [ ] `npm init playwright@latest`
- [ ] Configurer `playwright.config.ts`
- [ ] Créer la structure de dossiers
- [ ] Ajouter scripts dans `package.json`
- [ ] Créer `.gitignore` entries (`e2e/.auth/`, `playwright-report/`, `test-results/`)
- [ ] **PAUSE** : Vérifier que `npx playwright test --ui` fonctionne

### Phase 2 : Authentification (2h)
- [ ] Créer `auth.setup.ts`
- [ ] Créer `auth.fixture.ts`
- [ ] Créer `LoginPage.ts`
- [ ] Écrire tests de login basiques
- [ ] **PAUSE** : Vérifier que l'auth est réutilisée entre les tests

### Phase 3 : Page Objects (3-4h)
- [ ] `BasePage.ts`
- [ ] `MenuPage.ts` + `MenuItemCardComponent.ts`
- [ ] `CartModalComponent.ts`
- [ ] `CheckoutPage.ts`
- [ ] `ReservationPage.ts`
- [ ] `ProfilePage.ts`
- [ ] **PAUSE** : Review des Page Objects

### Phase 4 : Tests Critiques (4-5h)
- [ ] Tests login/register
- [ ] Test parcours commande complet
- [ ] Test parcours réservation
- [ ] **PAUSE** : Exécuter tous les tests, vérifier stabilité

### Phase 5 : Tests Admin (3-4h)
- [ ] `DashboardPage.ts`
- [ ] `OrdersManagementPage.ts`
- [ ] `ReservationsManagementPage.ts`
- [ ] Tests admin
- [ ] **PAUSE** : Vérifier avec compte admin réel

### Phase 6 : Mobile + Accessibilité (3-4h)
- [ ] Tests responsive mobile
- [ ] Installer `@axe-core/playwright`
- [ ] Tests WCAG sur pages principales
- [ ] **PAUSE** : Fixer les violations d'accessibilité critiques

### Phase 7 : CI/CD (2-3h)
- [ ] Créer `.github/workflows/e2e.yml`
- [ ] Configurer secrets GitHub
- [ ] Tester le pipeline
- [ ] **PAUSE** : Vérifier que le CI passe

### Phase 8 : Documentation + Polish (2h)
- [ ] Documenter les commandes dans README
- [ ] Ajouter exemples de mocking pour cas d'erreur
- [ ] Review finale et cleanup

---

## Estimation Totale

| Phase | Temps |
|-------|-------|
| Setup Initial | 2-3h |
| Authentification | 2h |
| Page Objects | 3-4h |
| Tests Critiques | 4-5h |
| Tests Admin | 3-4h |
| Mobile + Accessibilité | 3-4h |
| CI/CD | 2-3h |
| Documentation | 2h |
| **Total** | **21-27h** |

---

## Ressources

- [Documentation Officielle Playwright](https://playwright.dev/docs/intro)
- [Best Practices Playwright](https://playwright.dev/docs/best-practices)
- [Kent C. Dodds - Testing Trophy](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)
- [Trace Viewer Guide](https://playwright.dev/docs/trace-viewer)
- [axe-core pour Accessibilité](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright)

---

**Ce document sera mis à jour au fur et à mesure de l'implémentation.**
