# Tests qui testent le framework - Liste de référence

Ce document liste les tests qui testent le framework (React, Zustand, React Hook Form, etc.) plutôt que la logique métier de l'application. Ces tests peuvent être supprimés, consolidés ou simplifiés.

**Date de création** : 23 décembre 2024
**Total estimé** : ~84 tests sur 1532

---

## Résumé par catégorie

| Catégorie | Nombre | Description |
|-----------|--------|-------------|
| Zustand setState | ~12 | `setLoading()`, `setError()`, état initial |
| React Hook Form | ~25 | Saisie inputs, toggle checkbox, attributs form |
| React rendering | ~18 | Rendu conditionnel, présence d'éléments DOM |
| CSS/Styling | ~6 | Classes Tailwind (`animate-pulse`, etc.) |
| React state | ~10 | Modal open/close, loading state display |
| HTML attributes | ~8 | `type="email"`, `placeholder`, `disabled` |
| useEffect/lifecycle | ~3 | `fetchStats` on mount |
| React Router | ~2 | Attributs `href` des liens |

---

## 1. STORE TESTS (Zustand)

### `src/__tests__/store/menuStore.test.js`

| Ligne(s) | Test | Raison | Action |
|----------|------|--------|--------|
| 52-63 | "should have correct initial state" | Teste l'initialisation Zustand | SUPPRIMER |
| 67-79 | "should set loading state" | Teste `setLoading(true/false)` | SUPPRIMER |
| 81-88 | "should set error" | Teste `setError()` | SUPPRIMER |
| 90-98 | "should clear error" | Teste `clearError()` | SUPPRIMER |
| 126-144 | "should set loading state during fetch" | Teste async loading pattern | SUPPRIMER |
| 343-358 | "should set loading state during fetch" (fetchPopularItems) | Idem | SUPPRIMER |
| 408-423 | "should set loading state during fetch" (fetchSuggestedItems) | Idem | SUPPRIMER |
| 379-386 | "should default to empty array when data is undefined" | Teste fallback Zustand | SUPPRIMER |

### `src/__tests__/store/authStore.test.js`

| Ligne(s) | Test | Raison | Action |
|----------|------|--------|--------|
| 98-106 | "should have correct initial state" | Teste initialisation store | SUPPRIMER |
| 108-118 | "should set user and update authentication status" | Teste `setUser()` basique | SUPPRIMER |
| 120-135 | "should handle error management correctly" | Teste `setError()`/`clearError()` | SUPPRIMER |
| 601-613 | "should store accessToken after successful login" | Teste stockage token | CONSERVER (vérifie comportement auth) |
| 615-623 | "should set accessToken with setAccessToken action" | Teste action Zustand | SUPPRIMER |
| 625-637 | "should set auth data with setAuth action" | Teste `setAuth()` | SUPPRIMER |
| 639-659 | "should clear all auth data with clearAuth action" | Teste `clearAuth()` | SUPPRIMER |

### `src/__tests__/store/cartStore.test.js`

| Ligne(s) | Test | Raison | Action |
|----------|------|--------|--------|
| 44-57 | "should initialize user cart when setting current user" | Teste création cart vide | SUPPRIMER |
| 342-347 | "should handle sync with menu correctly" | Teste console.log | SUPPRIMER |
| 349-361 | "should handle operations without current user gracefully" | Teste safety check | SUPPRIMER |

### `src/__tests__/store/ordersStore.test.js`

| Test | Raison | Action |
|------|--------|--------|
| "should have correct initial state" | Teste initialisation | SUPPRIMER |
| "should set loading state" | Teste `setLoading()` | SUPPRIMER |
| "should set error" | Teste `setError()` | SUPPRIMER |

### `src/__tests__/store/reservationsStore.test.js`

| Test | Raison | Action |
|------|--------|--------|
| "should have correct initial state" | Teste initialisation | SUPPRIMER |
| "should set loading state" | Teste `setLoading()` | SUPPRIMER |
| "should set error" | Teste `setError()` | SUPPRIMER |

### `src/__tests__/store/contactsStore.test.js`

| Test | Raison | Action |
|------|--------|--------|
| "should have correct initial state" | Teste initialisation | SUPPRIMER |
| "should set loading state" | Teste `setLoading()` | SUPPRIMER |
| "should set error" | Teste `setError()` | SUPPRIMER |

### `src/__tests__/store/usersStore.test.js`

| Test | Raison | Action |
|------|--------|--------|
| "should have correct initial state" | Teste initialisation | SUPPRIMER |
| "should set loading state" | Teste `setLoading()` | SUPPRIMER |

### `src/__tests__/store/statsStore.test.js`

| Test | Raison | Action |
|------|--------|--------|
| "should have correct initial state" | Teste initialisation | SUPPRIMER |
| "should set loading state" | Teste `setLoading()` | SUPPRIMER |

---

## 2. COMPONENT TESTS (React / React Hook Form)

### `src/__tests__/pages/auth/Login.test.jsx`

| Ligne(s) | Test | Raison | Action |
|----------|------|--------|--------|
| 46-70 | "should render login form with all required elements" | Teste présence éléments HTML | SIMPLIFIER |
| 72-95 | "should have proper form structure and attributes" | Teste attributs HTML | SUPPRIMER |
| 99-108 | "should allow typing in email field" | Teste React Hook Form | SUPPRIMER |
| 110-119 | "should allow typing in password field" | Teste React Hook Form | SUPPRIMER |
| 121-133 | "should handle form data correctly when typing in multiple fields" | Teste React Hook Form | SUPPRIMER |
| 135-151 | "should toggle remember me checkbox" | Teste React Hook Form checkbox | SUPPRIMER |
| 154-170 | "should toggle password visibility when eye icon is clicked" | Teste toggle UI | SUPPRIMER |
| 156-170 | "should display correct icon based on password visibility state" | Teste icône UI | SUPPRIMER |
| 222-227 | "should prevent default form submission behavior" | Teste mécanique form | SUPPRIMER |
| 229-240 | "should handle empty form submission" | Teste validation HTML5 | SUPPRIMER |
| 243-266 | "Loading State" (2 tests) | Teste UI loading | SIMPLIFIER (1 test) |
| 268-309 | "Error Handling" (3 tests) | Teste rendu erreur | SIMPLIFIER (1 test) |
| 312-343 | "Navigation Links" (4 tests) | Teste attributs href | SUPPRIMER |
| 345-377 | "Accessibility" (2 tests) | Teste labels/for | CONSERVER (a11y important) |
| 379-394 | "Demo Credentials Section" (2 tests) | Teste présence texte | SUPPRIMER |

### `src/__tests__/pages/auth/Register.test.jsx`

| Test | Raison | Action |
|------|--------|--------|
| "should render registration form with all required elements" | Teste présence éléments | SIMPLIFIER |
| "should have proper form structure and attributes" | Teste attributs HTML | SUPPRIMER |
| "should allow typing in name field" | Teste React Hook Form | SUPPRIMER |
| "should allow typing in email field" | Teste React Hook Form | SUPPRIMER |
| "should allow typing in password field" | Teste React Hook Form | SUPPRIMER |
| "should allow typing in confirm password field" | Teste React Hook Form | SUPPRIMER |
| "should toggle password visibility" | Teste toggle UI | SUPPRIMER |
| "should toggle confirm password visibility" | Teste toggle UI | SUPPRIMER |
| "Navigation Links" tests | Teste attributs href | SUPPRIMER |

### `src/__tests__/pages/auth/ForgotPassword.test.jsx`

| Test | Raison | Action |
|------|--------|--------|
| "should render form with all elements" | Teste présence éléments | SIMPLIFIER |
| "should allow typing in email field" | Teste React Hook Form | SUPPRIMER |
| "should have proper form attributes" | Teste attributs HTML | SUPPRIMER |
| "Navigation Links" tests | Teste attributs href | SUPPRIMER |

### `src/__tests__/pages/auth/ResetPassword.test.jsx`

| Test | Raison | Action |
|------|--------|--------|
| "should render form with all elements" | Teste présence éléments | SIMPLIFIER |
| "should allow typing in password fields" | Teste React Hook Form | SUPPRIMER |
| "should toggle password visibility" | Teste toggle UI | SUPPRIMER |
| "should have proper form attributes" | Teste attributs HTML | SUPPRIMER |

### `src/__tests__/components/profile/DeleteAccountModal.test.jsx`

| Ligne(s) | Test | Raison | Action |
|----------|------|--------|--------|
| 24-35 | "should not render when isOpen is false" | Teste rendu conditionnel | SUPPRIMER |
| 37-47 | "should render modal with all elements when isOpen is true" | Teste présence éléments | SIMPLIFIER |
| 69-77 | "should allow typing in confirmation text field" | Teste React Hook Form | SUPPRIMER |
| 79-90 | "should allow typing in password field and maintain password type" | Teste React Hook Form | SUPPRIMER |
| 92-114 | "should update field values correctly on input change" | Teste React Hook Form | SUPPRIMER |

### `src/__tests__/components/common/CartModal.test.jsx`

| Test | Raison | Action |
|------|--------|--------|
| "should not render when cart is closed" | Teste rendu conditionnel | SUPPRIMER |
| "should render modal with header when cart is open" | Teste présence éléments | SIMPLIFIER |

### `src/__tests__/components/common/InlineAlert.test.jsx`

| Test | Raison | Action |
|------|--------|--------|
| "should not render when no message" | Teste rendu conditionnel | SUPPRIMER |
| "should render with correct type styling" (plusieurs) | Teste classes CSS | SUPPRIMER |
| "should render title and message" | Teste présence texte | SIMPLIFIER |
| "should call onDismiss when close button clicked" | Teste onClick | CONSERVER (comportement) |

### `src/__tests__/components/common/SimpleSelect.test.jsx`

| Test | Raison | Action |
|------|--------|--------|
| "should render with placeholder" | Teste présence texte | SUPPRIMER |
| "should open dropdown on click" | Teste état React | SUPPRIMER |
| "should close dropdown after selection" | Teste état React | SUPPRIMER |
| "should display selected option" | Teste texte affiché | SUPPRIMER |
| "should apply disabled styling" | Teste classes CSS | SUPPRIMER |
| "should call onChange with selected value" | Teste callback | CONSERVER |

### `src/__tests__/components/common/CustomDatePicker.test.jsx`

| Test | Raison | Action |
|------|--------|--------|
| "should render with placeholder" | Teste présence texte | SUPPRIMER |
| "should open calendar on click" | Teste état React | SUPPRIMER |
| "should close calendar after selection" | Teste état React | SUPPRIMER |
| "should display selected date" | Teste formatage | CONSERVER (logique métier) |
| "should call onChange with selected date" | Teste callback | CONSERVER |

### `src/__tests__/components/common/EmailVerificationBanner.test.jsx`

| Test | Raison | Action |
|------|--------|--------|
| "should not render when not visible" | Teste rendu conditionnel | SUPPRIMER |
| "should render when visible" | Teste présence | SUPPRIMER |
| "should display correct message" | Teste texte | SUPPRIMER |
| "should call onResend when button clicked" | Teste callback | CONSERVER |

---

## 3. PAGE TESTS

### `src/__tests__/pages/admin/Dashboard.test.jsx`

| Test | Raison | Action |
|------|--------|--------|
| "should display skeleton loader when stats are not loaded" | Teste classe CSS `animate-pulse` | SUPPRIMER |
| "should call fetchStats on mount" | Teste useEffect | SUPPRIMER |

### `src/__tests__/pages/profile/Profile.test.jsx`

| Test | Raison | Action |
|------|--------|--------|
| "should render profile form with user data" | Teste présence éléments | SIMPLIFIER |
| "should allow editing name field" | Teste React Hook Form | SUPPRIMER |
| "should allow editing email field" | Teste React Hook Form | SUPPRIMER |
| "should allow editing phone field" | Teste React Hook Form | SUPPRIMER |
| "should open delete modal when button clicked" | Teste état modal | SUPPRIMER |

### `src/__tests__/pages/contact/Contact.test.jsx`

| Test | Raison | Action |
|------|--------|--------|
| "should render contact form" | Teste présence éléments | SIMPLIFIER |
| "should allow typing in form fields" | Teste React Hook Form | SUPPRIMER |
| "should toggle newsletter checkbox" | Teste checkbox | SUPPRIMER |

### `src/__tests__/pages/menu/Menu.test.jsx`

| Test | Raison | Action |
|------|--------|--------|
| "should render loading state" | Teste loader | SUPPRIMER |
| "should render category buttons" | Teste présence boutons | SIMPLIFIER |
| "should filter by category on click" | Teste onClick | CONSERVER (logique filtrage) |

### `src/__tests__/pages/admin/MenuManagement.test.jsx`

| Test | Raison | Action |
|------|--------|--------|
| "should render menu items table" | Teste présence table | SIMPLIFIER |
| "should open add modal on button click" | Teste état modal | SUPPRIMER |
| "should allow typing in form fields" | Teste React Hook Form | SUPPRIMER |

### `src/__tests__/pages/admin/OrdersManagement.test.jsx`

| Test | Raison | Action |
|------|--------|--------|
| "should render orders table" | Teste présence table | SIMPLIFIER |
| "should display loading state" | Teste loader | SUPPRIMER |

### `src/__tests__/pages/admin/ReservationsManagement.test.jsx`

| Test | Raison | Action |
|------|--------|--------|
| "should render reservations table" | Teste présence table | SIMPLIFIER |
| "should display loading state" | Teste loader | SUPPRIMER |

---

## 4. HOOKS TESTS

### `src/__tests__/hooks/useAuth.test.js`

| Test | Raison | Action |
|------|--------|--------|
| "should expose all auth state from store" | Teste passthrough Zustand | SUPPRIMER |
| "should calculate isAdmin correctly" | Teste computed property | CONSERVER (logique métier) |
| "should calculate isUser correctly" | Teste computed property | CONSERVER (logique métier) |

### `src/__tests__/hooks/useCart.test.js`

| Test | Raison | Action |
|------|--------|--------|
| "should expose cart state from store" | Teste passthrough | SUPPRIMER |

### `src/__tests__/hooks/useMenu.test.js`

| Test | Raison | Action |
|------|--------|--------|
| "should expose menu state from store" | Teste passthrough | SUPPRIMER |

### `src/__tests__/hooks/useOrders.test.js`

| Test | Raison | Action |
|------|--------|--------|
| "should expose orders state from store" | Teste passthrough | SUPPRIMER |

### `src/__tests__/hooks/useReservations.test.js`

| Test | Raison | Action |
|------|--------|--------|
| "should expose reservations state from store" | Teste passthrough | SUPPRIMER |

---

## Patterns de détection

Ces patterns indiquent généralement un test framework :

```javascript
// 1. Tests de saisie React Hook Form
expect(input).toHaveValue('typed text')
await user.type(input, 'text')

// 2. Tests d'attributs HTML
expect(element).toHaveAttribute('type', 'email')
expect(element).toHaveAttribute('placeholder', '...')
expect(element).toHaveAttribute('autoComplete', '...')

// 3. Tests de rendu conditionnel basique
expect(element).not.toBeInTheDocument() // isOpen={false}
expect(element).toBeInTheDocument() // isOpen={true}

// 4. Tests de classes CSS
expect(element).toHaveClass('animate-pulse')
expect(element).toHaveClass('bg-red-50')

// 5. Tests d'état initial Zustand
expect(store.getState().isLoading).toBe(false)
expect(store.getState().error).toBe(null)
expect(store.getState().items).toEqual([])

// 6. Tests setLoading/setError basiques
act(() => store.getState().setLoading(true))
expect(store.getState().isLoading).toBe(true)

// 7. Tests de checkbox toggle
expect(checkbox).not.toBeChecked()
await user.click(checkbox)
expect(checkbox).toBeChecked()

// 8. Tests de password visibility toggle
expect(passwordInput).toHaveAttribute('type', 'password')
await user.click(toggleButton)
expect(passwordInput).toHaveAttribute('type', 'text')

// 9. Tests useEffect on mount
expect(mockFetch).toHaveBeenCalledTimes(1)

// 10. Tests href de liens
expect(link).toHaveAttribute('href', '/path')
```

---

## Actions recommandées

### SUPPRIMER (~60 tests)
Tests qui vérifient uniquement le fonctionnement du framework :
- Tests de saisie dans les inputs
- Tests de toggle checkbox/password visibility
- Tests d'attributs HTML standards
- Tests d'état initial Zustand vide
- Tests setLoading/setError basiques
- Tests de rendu conditionnel simple
- Tests de classes CSS

### SIMPLIFIER (~15 tests)
Consolider plusieurs tests en un seul :
- "should render with all elements" → Un seul test de smoke test par composant
- Tests de loading/error → Un test par composant, pas par état

### CONSERVER (~9 tests)
Tests qui vérifient des comportements métier importants :
- Tests d'accessibilité (labels, aria)
- Tests de callbacks avec paramètres métier
- Tests de computed properties (isAdmin, isUser)
- Tests de formatage de données

---

## Estimation d'impact

- **Tests actuels** : 1532
- **Tests à supprimer** : ~60
- **Tests à simplifier** : ~15 → ~5
- **Tests après nettoyage** : ~1467

**Réduction** : ~4% du nombre de tests
**Gain** : Meilleure maintenabilité, tests plus rapides, moins de faux positifs

---

## Priorisation du nettoyage

1. **Priorité haute** : Store tests (facile, impact immédiat)
2. **Priorité moyenne** : Login/Register tests (nombreux tests framework)
3. **Priorité basse** : Components communs (moins nombreux)

---

*Document de référence pour le nettoyage des tests - Décembre 2024*
