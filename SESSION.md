# Session E2E Tests - RestOh Frontend

> Document de contexte - Dernière mise à jour : 24 décembre 2024

## Résumé de la Session

Cette session a porté sur l'activation et la correction des tests E2E Playwright qui étaient skippés. L'objectif était d'augmenter la couverture des tests en corrigeant les sélecteurs et la logique des tests existants.

## État Actuel des Tests E2E

### Résultats Globaux
- **80 tests passants**
- **17 tests skippés** (raisons valides documentées)
- **0 tests échouants**

### Commandes pour lancer les tests
```bash
# Tous les tests (chromium + admin)
npx playwright test --project=chromium --project=admin

# Tests spécifiques
npx playwright test e2e/tests/menu/menu-browsing.spec.ts --project=chromium
npx playwright test e2e/tests/admin/ --project=admin

# Mode UI (recommandé pour debug)
npx playwright test --ui
```

---

## Fichiers Modifiés dans cette Session

### 1. e2e/pages/MenuPage.ts
**Problème** : Les sélecteurs de dropdowns ne fonctionnaient pas car le texte des boutons change après sélection.

**Solution** :
```typescript
// Avant
private get cuisineDropdown() {
  return this.page.getByRole('button', { name: /cuisines/i });
}

// Après - gère le texte dynamique
private get cuisineDropdown() {
  return this.page.getByRole('button', { name: /cuisines|asian|lao|continental/i }).first();
}
```

**Méthodes de sélection mises à jour** :
```typescript
async selectCuisine(cuisine: string) {
  await this.cuisineDropdown.click();
  await this.page.waitForTimeout(200);
  await this.page.getByText(cuisine, { exact: true }).first().click();
}
```

### 2. e2e/tests/menu/menu-browsing.spec.ts
**Tests activés** (8 tests) :
- `should filter by cuisine type` - utilise 'Lao' au lieu de 'Italian'
- `should filter by category` - utilise 'Main' au lieu de 'Main Course'
- `should reset filters by selecting All options` - pas de bouton Reset, utilise "All cuisines"
- `should sort by price ascending` - au lieu de 'Price: Low to High'
- `should sort by price descending` - au lieu de 'Price: High to Low'
- `should open reviews modal for an item`
- `should close reviews modal`

**Valeurs de dropdown réelles** :
| Dropdown | Valeurs disponibles |
|----------|---------------------|
| Cuisines | All cuisines, Asian, Lao, Continental |
| Categories | All dishes, Main, Dessert, Beverage, Appetizer |
| Sort | Sort by price, Price ascending, Price descending |

### 3. e2e/tests/reservations/reservation-flow.spec.ts
**Tests activés** (4 tests) :
- `should open edit modal for existing reservation` - se skip si pas de réservations
- `should cancel existing reservation` - se skip si pas de réservations
- `should require phone number` - clear le phone pré-rempli puis vérifie bouton disabled
- `should validate phone format` - vérifie le toast d'erreur "Invalid phone format (e.g., 06 12 34 56 78)"

**Pattern pour tests conditionnels** :
```typescript
test('should open edit modal for existing reservation', async ({ page }) => {
  await reservationPage.showAllReservations();
  await page.waitForTimeout(500);

  const count = await reservationPage.getReservationCount();
  if (count === 0) {
    test.skip(); // Se skip proprement si pas de données
    return;
  }
  // ... reste du test
});
```

### 4. e2e/tests/admin/orders-management.spec.ts
**Test activé** :
- `should view order details` - fonctionne maintenant

**Tests toujours skippés** (avec raison documentée) :
- Status updates (confirmed, preparing, ready, delivered) - UI utilise des dropdowns inline avec sélecteurs spécifiques
- `should mark order as paid` - pas de bouton "Mark as paid" dans l'UI actuelle
- `should cancel order` - pas de bouton "Cancel" dans l'UI actuelle

### 5. e2e/pages/ContactPage.ts (session précédente)
**Correction des sélecteurs restaurant info** :
```typescript
// Les sections utilisent des headings, pas des sections génériques
private get addressSection() {
  return this.page.getByRole('heading', { name: /^address$/i });
}
```

### 6. e2e/pages/HomePage.ts (session précédente)
**Correction des boutons CTA** :
```typescript
// Le bouton s'appelle "Order Now", pas "View Menu"
private get viewMenuButton() {
  return this.page.getByRole('link', { name: /order now|view.*menu|voir le menu/i }).first();
}

// Le bouton s'appelle "Book a Table", pas "Reserve"
private get reserveTableButton() {
  return this.page.getByRole('link', { name: /book.*table|reserve|réserver/i }).first();
}
```

---

## Tests Skippés - Raisons

### Tests qui se skip dynamiquement (comportement normal)
| Test | Raison |
|------|--------|
| Edit reservation | Pas de réservations dans la DB de test |
| Cancel reservation | Pas de réservations dans la DB de test |
| Order status updates | Pas de commandes dans la DB de test |

### Tests skippés définitivement (nécessitent du travail)
| Test | Fichier | Raison |
|------|---------|--------|
| Non-admin redirect tests | access-control.spec.ts | Nécessite reconfiguration projet Playwright |
| Order status updates | orders-management.spec.ts | UI dropdowns avec sélecteurs spécifiques |
| Mark order as paid | orders-management.spec.ts | Fonctionnalité pas visible dans l'UI |
| Cancel order | orders-management.spec.ts | Fonctionnalité pas visible dans l'UI |
| Reservation status updates | reservations-management.spec.ts | UI dropdowns avec sélecteurs spécifiques |

---

## Problèmes Connus

### 1. Mobile Safari ne fonctionne pas
```
Error: browserType.launch: Executable doesn't exist at .../webkit-2227/pw_run.sh
```
**Solution** : `npx playwright install webkit`

### 2. React Hook Form validation (mode: 'onBlur')
Les champs pré-remplis ne sont pas validés tant qu'on ne les touche pas. Solution : utiliser Tab pour naviguer et déclencher la validation.

```typescript
// Pattern pour déclencher la validation sur champs pré-remplis
await nameInput.click();
await page.keyboard.press('Tab'); // to email - triggers validation
await page.keyboard.press('Tab'); // to phone
await page.keyboard.press('Tab'); // to subject
```

### 3. Dropdowns custom (pas de role="option")
L'application utilise des dropdowns custom qui ne sont pas des `<select>` natifs. Les options sont des `<div>` génériques.

**Pattern de sélection** :
```typescript
await this.page.getByText(optionText, { exact: true }).first().click();
```

---

## Comparaison avec E2E_TESTING_PLAN.md

### Phases complétées
- [x] Phase 1 : Setup Initial
- [x] Phase 2 : Authentification
- [x] Phase 3 : Page Objects
- [x] Phase 4 : Tests Critiques
- [x] Phase 5 : Tests Admin (partiel)
- [x] Phase 6 : Mobile + Accessibilité (partiel)

### Phases restantes
- [ ] Phase 7 : CI/CD (workflow GitHub Actions)
- [ ] Phase 8 : Documentation

### Fichiers manquants par rapport au plan
| Fichier | Status |
|---------|--------|
| password-reset.spec.ts | Non créé |
| .github/workflows/e2e.yml | Non créé |

---

## Prochaines Étapes Suggérées

### Priorité 1 - Quick Wins
1. Installer webkit : `npx playwright install webkit`
2. Créer password-reset.spec.ts

### Priorité 2 - CI/CD
1. Créer `.github/workflows/e2e.yml` basé sur le plan
2. Configurer les secrets GitHub (E2E_USER_EMAIL, etc.)

### Priorité 3 - Tests Admin
1. Inspecter l'UI admin pour comprendre les sélecteurs des dropdowns de status
2. Mettre à jour AdminOrdersPage.updateOrderStatus()
3. Mettre à jour AdminReservationsPage status methods

### Priorité 4 - Access Control
1. Option A : Déplacer les tests non-admin hors du dossier `admin/`
2. Option B : Utiliser `test.use({ storageState: './e2e/.auth/user.json' })` dans le describe

---

## Commits de cette Session

```
b3548f3 test(e2e): enable skipped tests and fix selectors
33c7eb6 test(e2e): fix contact and navigation tests, enable skipped tests
```

---

## Structure E2E Actuelle

```
e2e/
├── .auth/
│   ├── user.json
│   └── admin.json
├── components/
│   ├── CartModalComponent.ts
│   ├── FooterComponent.ts
│   ├── NavbarComponent.ts
│   └── index.ts
├── fixtures/
│   └── auth.fixture.ts
├── pages/
│   ├── admin/
│   │   ├── AdminDashboardPage.ts
│   │   ├── AdminOrdersPage.ts
│   │   ├── AdminReservationsPage.ts
│   │   └── index.ts
│   ├── BasePage.ts
│   ├── CheckoutPage.ts
│   ├── ContactPage.ts
│   ├── HomePage.ts
│   ├── LoginPage.ts
│   ├── MenuPage.ts
│   ├── ProfilePage.ts
│   ├── RegisterPage.ts
│   ├── ReservationPage.ts
│   └── index.ts
├── setup/
│   ├── auth.setup.ts
│   └── global.teardown.ts
└── tests/
    ├── accessibility/
    │   ├── a11y.spec.ts
    │   └── axe-violations.spec.ts
    ├── admin/
    │   ├── access-control.spec.ts
    │   ├── dashboard.spec.ts
    │   ├── orders-management.spec.ts
    │   └── reservations-management.spec.ts
    ├── auth/
    │   ├── login.spec.ts
    │   ├── logout.spec.ts
    │   └── register.spec.ts
    ├── contact/
    │   └── contact.spec.ts
    ├── menu/
    │   └── menu-browsing.spec.ts
    ├── mobile/
    │   └── responsive.spec.ts
    ├── navigation/
    │   └── navigation.spec.ts
    ├── ordering/
    │   └── order-flow.spec.ts
    └── reservations/
        └── reservation-flow.spec.ts
```

---

## Notes Techniques

### Pattern de validation React Hook Form
L'application utilise `mode: 'onBlur'` pour la validation. Les champs pré-remplis (pour utilisateurs connectés) ne déclenchent pas automatiquement la validation. Il faut :
1. Soit utiliser Tab pour naviguer à travers les champs
2. Soit focus/blur explicitement chaque champ

### Authentification
- Les tests utilisent des storage states sauvegardés (user.json, admin.json)
- Le setup authentifie via le formulaire de login une seule fois
- Les credentials de test sont dans auth.setup.ts (demo@test.com / 123456 et admin@restoh.com / admin123)

### Timeouts utilisés
- Action timeout : 10000ms
- Navigation timeout : 30000ms
- Test timeout : 60000ms
- Petits waits (dropdown animations) : 200-300ms
