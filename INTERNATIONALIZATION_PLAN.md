# Plan d'Internationalisation (i18n) - RestOh Frontend

> **Document de référence** pour l'implémentation de l'internationalisation français/anglais.
>
> **Effort estimé** : 12-16 jours de travail
> **Langues** : Français (par défaut) + Anglais

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Phase 1 : Setup et configuration](#2-phase-1--setup-et-configuration)
3. [Phase 2 : Messages de validation](#3-phase-2--messages-de-validation)
4. [Phase 3 : Hooks et toasts](#4-phase-3--hooks-et-toasts)
5. [Phase 4 : Pages d'authentification](#5-phase-4--pages-dauthentification)
6. [Phase 5 : Pages utilisateur](#6-phase-5--pages-utilisateur)
7. [Phase 6 : Pages admin](#7-phase-6--pages-admin)
8. [Phase 7 : Composants communs](#8-phase-7--composants-communs)
9. [Phase 8 : Services et statuts](#9-phase-8--services-et-statuts)
10. [Phase 9 : Layout et navigation](#10-phase-9--layout-et-navigation)
11. [Phase 10 : Tests et QA](#11-phase-10--tests-et-qa)
12. [Phase 11 : Backend (optionnel)](#12-phase-11--backend-optionnel)
13. [Checklist finale](#13-checklist-finale)
14. [Annexes](#14-annexes)

---

## 1. Vue d'ensemble

### 1.1 Objectifs

- Supporter français (langue par défaut) et anglais
- Interface utilisateur entièrement traduite
- Détection automatique de la langue du navigateur
- Sélecteur de langue manuel dans le header
- Persistance du choix utilisateur

### 1.2 Stack technique

```
react-i18next     - Librairie i18n pour React
i18next           - Core i18n
i18next-browser-languagedetector  - Détection langue navigateur
i18next-http-backend              - Chargement lazy des traductions (optionnel)
```

### 1.3 Structure des fichiers de traduction

```
src/
├── i18n/
│   ├── index.js              # Configuration i18next
│   ├── locales/
│   │   ├── fr/
│   │   │   ├── common.json       # Textes partagés (boutons, labels génériques)
│   │   │   ├── auth.json         # Login, Register, ForgotPassword, etc.
│   │   │   ├── validation.json   # Messages de validation
│   │   │   ├── menu.json         # Page menu public
│   │   │   ├── cart.json         # Panier et checkout
│   │   │   ├── orders.json       # Commandes utilisateur
│   │   │   ├── reservations.json # Réservations
│   │   │   ├── profile.json      # Profil utilisateur
│   │   │   ├── contact.json      # Page contact
│   │   │   ├── admin.json        # Dashboard et pages admin
│   │   │   └── errors.json       # Messages d'erreur
│   │   └── en/
│   │       ├── common.json
│   │       ├── auth.json
│   │       ├── validation.json
│   │       ├── menu.json
│   │       ├── cart.json
│   │       ├── orders.json
│   │       ├── reservations.json
│   │       ├── profile.json
│   │       ├── contact.json
│   │       ├── admin.json
│   │       └── errors.json
```

### 1.4 Conventions de nommage des clés

```javascript
// Format : section.element.action ou section.element.state
{
  "login": {
    "title": "Connexion",
    "subtitle": "Connectez-vous à votre compte",
    "button": {
      "submit": "Se connecter",
      "loading": "Connexion en cours..."
    },
    "field": {
      "email": "Adresse email",
      "password": "Mot de passe"
    },
    "link": {
      "forgotPassword": "Mot de passe oublié ?",
      "register": "Créer un compte"
    }
  }
}
```

---

## 2. Phase 1 : Setup et configuration

**Durée estimée : 2-3 heures**

### 2.1 Installation des dépendances

```bash
npm install react-i18next i18next i18next-browser-languagedetector
```

### 2.2 Créer la configuration i18n

**Fichier : `src/i18n/index.js`**

```javascript
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Import des traductions
import frCommon from './locales/fr/common.json'
import frAuth from './locales/fr/auth.json'
import frValidation from './locales/fr/validation.json'
import frMenu from './locales/fr/menu.json'
import frCart from './locales/fr/cart.json'
import frOrders from './locales/fr/orders.json'
import frReservations from './locales/fr/reservations.json'
import frProfile from './locales/fr/profile.json'
import frContact from './locales/fr/contact.json'
import frAdmin from './locales/fr/admin.json'
import frErrors from './locales/fr/errors.json'

import enCommon from './locales/en/common.json'
import enAuth from './locales/en/auth.json'
import enValidation from './locales/en/validation.json'
import enMenu from './locales/en/menu.json'
import enCart from './locales/en/cart.json'
import enOrders from './locales/en/orders.json'
import enReservations from './locales/en/reservations.json'
import enProfile from './locales/en/profile.json'
import enContact from './locales/en/contact.json'
import enAdmin from './locales/en/admin.json'
import enErrors from './locales/en/errors.json'

const resources = {
  fr: {
    common: frCommon,
    auth: frAuth,
    validation: frValidation,
    menu: frMenu,
    cart: frCart,
    orders: frOrders,
    reservations: frReservations,
    profile: frProfile,
    contact: frContact,
    admin: frAdmin,
    errors: frErrors
  },
  en: {
    common: enCommon,
    auth: enAuth,
    validation: enValidation,
    menu: enMenu,
    cart: enCart,
    orders: enOrders,
    reservations: enReservations,
    profile: enProfile,
    contact: enContact,
    admin: enAdmin,
    errors: enErrors
  }
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'fr',
    defaultNS: 'common',

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng'
    },

    interpolation: {
      escapeValue: false // React déjà sécurisé contre XSS
    },

    react: {
      useSuspense: false
    }
  })

export default i18n
```

### 2.3 Intégrer dans l'application

**Fichier : `src/main.jsx`**

```javascript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './i18n' // Ajouter cette ligne

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

### 2.4 Créer les fichiers JSON de base (vides)

Créer la structure de dossiers et fichiers JSON vides pour chaque namespace :

```bash
mkdir -p src/i18n/locales/fr src/i18n/locales/en

# Créer les fichiers FR
echo '{}' > src/i18n/locales/fr/common.json
echo '{}' > src/i18n/locales/fr/auth.json
echo '{}' > src/i18n/locales/fr/validation.json
echo '{}' > src/i18n/locales/fr/menu.json
echo '{}' > src/i18n/locales/fr/cart.json
echo '{}' > src/i18n/locales/fr/orders.json
echo '{}' > src/i18n/locales/fr/reservations.json
echo '{}' > src/i18n/locales/fr/profile.json
echo '{}' > src/i18n/locales/fr/contact.json
echo '{}' > src/i18n/locales/fr/admin.json
echo '{}' > src/i18n/locales/fr/errors.json

# Créer les fichiers EN (copie)
cp src/i18n/locales/fr/*.json src/i18n/locales/en/
```

### 2.5 Créer un composant LanguageSwitcher

**Fichier : `src/components/common/LanguageSwitcher.jsx`**

```jsx
import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'

const LanguageSwitcher = () => {
  const { i18n } = useTranslation()

  const languages = [
    { code: 'fr', label: 'FR', flag: '🇫🇷' },
    { code: 'en', label: 'EN', flag: '🇬🇧' }
  ]

  const currentLang = i18n.language?.substring(0, 2) || 'fr'

  const toggleLanguage = () => {
    const newLang = currentLang === 'fr' ? 'en' : 'fr'
    i18n.changeLanguage(newLang)
  }

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-1 px-2 py-1 text-sm text-gray-600 hover:text-primary-600 transition-colors"
      aria-label="Change language"
    >
      <Globe className="w-4 h-4" />
      <span>{currentLang.toUpperCase()}</span>
    </button>
  )
}

export default LanguageSwitcher
```

### 2.6 Tester la configuration

Créer un composant de test temporaire :

```jsx
import { useTranslation } from 'react-i18next'

const I18nTest = () => {
  const { t, i18n } = useTranslation()

  return (
    <div className="p-4">
      <p>Current language: {i18n.language}</p>
      <button onClick={() => i18n.changeLanguage('fr')}>FR</button>
      <button onClick={() => i18n.changeLanguage('en')}>EN</button>
      <p>{t('common:test', 'Test default')}</p>
    </div>
  )
}
```

### ✅ PAUSE - Vérification Phase 1

- [ ] `npm run dev` fonctionne sans erreur
- [ ] Pas de warning i18n dans la console
- [ ] Le LanguageSwitcher change bien la langue
- [ ] La langue est persistée dans localStorage (`i18nextLng`)

---

## 3. Phase 2 : Messages de validation

**Durée estimée : 2-3 heures**

Cette phase est un "quick win" car les validations sont déjà centralisées.

### 3.1 Extraire les messages de formValidators.js

**Fichier actuel : `src/utils/formValidators.js`**

Messages à extraire :
```javascript
// Email
'Email is required'
'Invalid email address'

// Password
'Password is required'
'Password must be at least 6 characters'

// Name
'Name is required'
'Name must be at least 2 characters'

// Phone
'Invalid phone number format (ex: 0612345678)'
'Phone number is required for pickup orders'

// Message/Subject
'Message is required'
'Message must be at least 10 characters'
'Subject is required'

// Reservation
'Number of guests is required'
'At least 1 guest required'
'Maximum 20 guests'
'Date is required'
'Time slot is required'

// Password confirmation
'Passwords do not match'
'Please confirm your password'
'Current password is required'
```

### 3.2 Créer le fichier de traduction validation

**Fichier : `src/i18n/locales/fr/validation.json`**

```json
{
  "email": {
    "required": "L'email est requis",
    "invalid": "Adresse email invalide"
  },
  "password": {
    "required": "Le mot de passe est requis",
    "minLength": "Le mot de passe doit contenir au moins 6 caractères",
    "mismatch": "Les mots de passe ne correspondent pas",
    "confirmRequired": "Veuillez confirmer votre mot de passe",
    "currentRequired": "Le mot de passe actuel est requis"
  },
  "name": {
    "required": "Le nom est requis",
    "minLength": "Le nom doit contenir au moins 2 caractères"
  },
  "phone": {
    "invalid": "Format de téléphone invalide (ex: 0612345678)",
    "required": "Le numéro de téléphone est requis pour les commandes à emporter"
  },
  "message": {
    "required": "Le message est requis",
    "minLength": "Le message doit contenir au moins 10 caractères"
  },
  "subject": {
    "required": "Le sujet est requis"
  },
  "reservation": {
    "guestsRequired": "Le nombre de convives est requis",
    "guestsMin": "Au moins 1 convive requis",
    "guestsMax": "Maximum 20 convives",
    "dateRequired": "La date est requise",
    "timeRequired": "Le créneau horaire est requis"
  }
}
```

**Fichier : `src/i18n/locales/en/validation.json`**

```json
{
  "email": {
    "required": "Email is required",
    "invalid": "Invalid email address"
  },
  "password": {
    "required": "Password is required",
    "minLength": "Password must be at least 6 characters",
    "mismatch": "Passwords do not match",
    "confirmRequired": "Please confirm your password",
    "currentRequired": "Current password is required"
  },
  "name": {
    "required": "Name is required",
    "minLength": "Name must be at least 2 characters"
  },
  "phone": {
    "invalid": "Invalid phone number format (ex: 0612345678)",
    "required": "Phone number is required for pickup orders"
  },
  "message": {
    "required": "Message is required",
    "minLength": "Message must be at least 10 characters"
  },
  "subject": {
    "required": "Subject is required"
  },
  "reservation": {
    "guestsRequired": "Number of guests is required",
    "guestsMin": "At least 1 guest required",
    "guestsMax": "Maximum 20 guests",
    "dateRequired": "Date is required",
    "timeRequired": "Time slot is required"
  }
}
```

### 3.3 Modifier formValidators.js

**Fichier : `src/utils/formValidators.js`**

```javascript
import i18n from '../i18n'

// Helper pour obtenir les traductions
const t = (key) => i18n.t(`validation:${key}`)

export const validationRules = {
  email: {
    required: t('email.required'),
    pattern: {
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      message: t('email.invalid')
    }
  },

  password: {
    required: t('password.required'),
    minLength: {
      value: 6,
      message: t('password.minLength')
    }
  },

  passwordRequired: {
    required: t('password.required')
  },

  name: {
    required: t('name.required'),
    minLength: {
      value: 2,
      message: t('name.minLength')
    }
  },

  phone: {
    pattern: {
      value: /^0[1-9][0-9]{8}$/,
      message: t('phone.invalid')
    }
  },

  phoneRequired: {
    required: t('phone.required'),
    pattern: {
      value: /^0[1-9][0-9]{8}$/,
      message: t('phone.invalid')
    }
  },

  message: {
    required: t('message.required'),
    minLength: {
      value: 10,
      message: t('message.minLength')
    }
  },

  subject: {
    required: t('subject.required')
  },

  guests: {
    required: t('reservation.guestsRequired'),
    min: {
      value: 1,
      message: t('reservation.guestsMin')
    },
    max: {
      value: 20,
      message: t('reservation.guestsMax')
    }
  },

  date: {
    required: t('reservation.dateRequired')
  },

  time: {
    required: t('reservation.timeRequired')
  }
}

export const validatePasswordMatch = (value, password) => {
  return value === password || t('password.mismatch')
}

export const getPasswordConfirmRules = (password) => ({
  required: t('password.confirmRequired'),
  validate: (value) => validatePasswordMatch(value, password)
})
```

**Note importante** : Cette approche a une limitation - les messages sont évalués au chargement du module. Pour une traduction dynamique, il faut utiliser une fonction :

```javascript
// Alternative avec fonction (recommandée)
export const getValidationRules = () => ({
  email: {
    required: i18n.t('validation:email.required'),
    // ...
  }
})
```

### ✅ PAUSE - Vérification Phase 2

- [ ] Les messages de validation s'affichent en français
- [ ] En changeant la langue, les nouveaux messages sont en anglais
- [ ] Tester sur Login, Register, Contact, Reservations
- [ ] Commit : `feat(i18n): add validation messages translations`

---

## 4. Phase 3 : Hooks et toasts

**Durée estimée : 3-4 heures**

### 4.1 Inventaire des toasts par hook

| Hook | Fichier | Toasts |
|------|---------|--------|
| useAuth | `src/hooks/useAuth.js` | 5 messages |
| useCart | `src/hooks/useCart.js` | 5 messages |
| useOrders | `src/hooks/useOrders.js` | 3 messages |
| useReservations | `src/hooks/useReservations.js` | 7 messages |

### 4.2 Créer les traductions pour les toasts

**Fichier : `src/i18n/locales/fr/common.json`** (toasts partagés)

```json
{
  "toast": {
    "success": {
      "login": "Connexion réussie !",
      "logout": "Déconnexion réussie",
      "register": "Inscription réussie ! Bienvenue !",
      "profileUpdated": "Profil mis à jour avec succès !",
      "passwordChanged": "Mot de passe modifié avec succès",
      "accountDeleted": "Compte supprimé avec succès",
      "itemAdded": "{{name}} ajouté au panier",
      "itemRemoved": "{{name}} retiré du panier",
      "cartCleared": "Panier vidé",
      "orderPlaced": "Commande passée avec succès !",
      "orderCancelled": "Commande annulée",
      "reservationCreated": "Réservation créée avec succès !",
      "reservationUpdated": "Réservation mise à jour",
      "reservationCancelled": "Réservation annulée",
      "messageSent": "Message envoyé avec succès !",
      "verificationSent": "Email de vérification envoyé ! Vérifiez votre boîte de réception."
    },
    "error": {
      "loginRequired": "Veuillez vous connecter pour ajouter des articles au panier",
      "loginRequiredReservation": "Vous devez être connecté pour créer une réservation",
      "generic": "Une erreur est survenue",
      "orderFailed": "Erreur lors du traitement de la commande",
      "reservationFailed": "Erreur lors de la création de la réservation",
      "messageFailed": "Erreur lors de l'envoi du message. Veuillez réessayer.",
      "verificationFailed": "Échec de l'envoi de l'email de vérification"
    }
  }
}
```

**Fichier : `src/i18n/locales/en/common.json`**

```json
{
  "toast": {
    "success": {
      "login": "Successfully logged in!",
      "logout": "Successfully logged out",
      "register": "Registration successful! Welcome!",
      "profileUpdated": "Profile updated successfully!",
      "passwordChanged": "Password changed successfully",
      "accountDeleted": "Account deleted successfully",
      "itemAdded": "{{name}} added to cart",
      "itemRemoved": "{{name}} removed from cart",
      "cartCleared": "Cart cleared",
      "orderPlaced": "Order placed successfully!",
      "orderCancelled": "Order cancelled",
      "reservationCreated": "Reservation created successfully!",
      "reservationUpdated": "Reservation updated",
      "reservationCancelled": "Reservation cancelled",
      "messageSent": "Message sent successfully!",
      "verificationSent": "Verification email sent! Check your inbox."
    },
    "error": {
      "loginRequired": "Please log in to add items to your cart",
      "loginRequiredReservation": "You must be logged in to create a reservation",
      "generic": "An error occurred",
      "orderFailed": "Error processing order",
      "reservationFailed": "Error creating reservation",
      "messageFailed": "Error sending message. Please try again.",
      "verificationFailed": "Failed to resend verification email"
    }
  }
}
```

### 4.3 Modifier les hooks

**Exemple : `src/hooks/useAuth.js`**

```javascript
import { useTranslation } from 'react-i18next'

export const useAuth = () => {
  const { t } = useTranslation()
  // ...

  const login = async (credentials) => {
    const result = await authStore.login(credentials)

    if (result.success) {
      toast.success(t('common:toast.success.login'))
      navigate('/')
    } else if (!result.details) {
      toast.error(result.error) // Erreur API - garder le message du backend ou traduire
    }

    return result
  }

  // ...
}
```

**Exemple : `src/hooks/useCart.js`**

```javascript
import { useTranslation } from 'react-i18next'

export const useCart = () => {
  const { t } = useTranslation()
  // ...

  const addItem = (item) => {
    if (!isAuthenticated) {
      toast.error(t('common:toast.error.loginRequired'))
      return
    }

    cartStore.addItem(item)
    toast.success(t('common:toast.success.itemAdded', { name: item.name }))
    // ...
  }

  // ...
}
```

### 4.4 Liste des fichiers à modifier

1. `src/hooks/useAuth.js`
   - `toast.success('Successfully logged in!')` → `t('common:toast.success.login')`
   - `toast.success('Successfully logged out')` → `t('common:toast.success.logout')`
   - `toast.success('Registration successful! Welcome!')` → `t('common:toast.success.register')`
   - `toast.success('Profile updated successfully!')` → `t('common:toast.success.profileUpdated')`
   - `toast.success('Account deleted successfully')` → `t('common:toast.success.accountDeleted')`

2. `src/hooks/useCart.js`
   - `toast.error('Please log in...')` → `t('common:toast.error.loginRequired')`
   - `toast.success('{{name}} added to cart')` → `t('common:toast.success.itemAdded', { name })`
   - `toast.success('{{name}} removed from cart')` → `t('common:toast.success.itemRemoved', { name })`
   - `toast.success('Cart cleared')` → `t('common:toast.success.cartCleared')`

3. `src/hooks/useOrders.js`
   - Messages de succès/erreur pour les commandes

4. `src/hooks/useReservations.js`
   - Messages de succès/erreur pour les réservations

### ✅ PAUSE - Vérification Phase 3

- [ ] Tous les toasts s'affichent dans la bonne langue
- [ ] Les interpolations ({{name}}) fonctionnent
- [ ] Tester : login, logout, ajout panier, création réservation
- [ ] Commit : `feat(i18n): translate toast messages in hooks`

---

## 5. Phase 4 : Pages d'authentification

**Durée estimée : 4-5 heures**

### 5.1 Fichiers concernés

| Page | Fichier | Strings estimées |
|------|---------|------------------|
| Login | `src/pages/auth/Login.jsx` | 20+ |
| Register | `src/pages/auth/Register.jsx` | 25+ |
| ForgotPassword | `src/pages/auth/ForgotPassword.jsx` | 15+ |
| ResetPassword | `src/pages/auth/ResetPassword.jsx` | 15+ |
| VerifyEmail | `src/pages/auth/VerifyEmail.jsx` | 10+ |

### 5.2 Créer le fichier auth.json

**Fichier : `src/i18n/locales/fr/auth.json`**

```json
{
  "login": {
    "title": "Connexion",
    "subtitle": "Connectez-vous à votre compte",
    "field": {
      "email": "Adresse email",
      "emailPlaceholder": "votre@email.com",
      "password": "Mot de passe",
      "passwordPlaceholder": "Minimum 6 caractères"
    },
    "rememberMe": "Se souvenir de moi",
    "forgotPassword": "Mot de passe oublié ?",
    "submit": "Se connecter",
    "submitting": "Connexion...",
    "noAccount": "Pas encore de compte ?",
    "createAccount": "Créer un compte",
    "demoCredentials": {
      "title": "Identifiants de démo",
      "admin": "Admin",
      "user": "Utilisateur"
    },
    "error": {
      "accountLocked": "Compte verrouillé",
      "accountLockedMessage": "Votre compte a été temporairement verrouillé suite à trop de tentatives de connexion.",
      "retryAfter": "Réessayez dans {{minutes}} minute(s)"
    }
  },
  "register": {
    "title": "Créer un compte",
    "subtitle": "Rejoignez RestOh pour commander et réserver",
    "field": {
      "name": "Nom complet",
      "namePlaceholder": "Jean Dupont",
      "email": "Adresse email",
      "emailPlaceholder": "votre@email.com",
      "password": "Mot de passe",
      "passwordPlaceholder": "Minimum 6 caractères",
      "confirmPassword": "Confirmer le mot de passe",
      "confirmPasswordPlaceholder": "Répétez votre mot de passe"
    },
    "terms": {
      "text": "En créant un compte, vous acceptez nos",
      "link": "Conditions d'utilisation"
    },
    "submit": "Créer mon compte",
    "submitting": "Création en cours...",
    "haveAccount": "Déjà un compte ?",
    "login": "Se connecter",
    "success": {
      "title": "Compte créé avec succès !",
      "emailSent": "Nous avons envoyé un email de vérification à :",
      "checkInbox": "Veuillez vérifier votre boîte de réception et cliquer sur le lien de vérification pour activer votre compte.",
      "spamNote": "L'email devrait arriver dans quelques minutes. N'oubliez pas de vérifier vos spams !",
      "continueWithout": "Continuer sans vérifier",
      "resendEmail": "Renvoyer l'email"
    }
  },
  "forgotPassword": {
    "title": "Mot de passe oublié ?",
    "subtitle": "Entrez votre email pour recevoir un lien de réinitialisation",
    "field": {
      "email": "Adresse email",
      "emailPlaceholder": "votre@email.com"
    },
    "submit": "Envoyer le lien",
    "submitting": "Envoi en cours...",
    "backToLogin": "Retour à la connexion",
    "success": {
      "title": "Vérifiez votre email",
      "message": "Si un compte existe avec l'adresse",
      "instructions": "vous recevrez un lien de réinitialisation.",
      "validityNote": "Le lien est valide pendant 30 minutes.",
      "spamNote": "N'oubliez pas de vérifier vos spams !",
      "returnToLogin": "Retour à la connexion",
      "sendAnother": "Envoyer un autre lien"
    }
  },
  "resetPassword": {
    "title": "Réinitialiser le mot de passe",
    "subtitle": "Choisissez un nouveau mot de passe",
    "field": {
      "newPassword": "Nouveau mot de passe",
      "newPasswordPlaceholder": "Minimum 6 caractères",
      "confirmPassword": "Confirmer le mot de passe",
      "confirmPasswordPlaceholder": "Répétez votre mot de passe"
    },
    "submit": "Réinitialiser",
    "submitting": "Réinitialisation...",
    "success": {
      "title": "Mot de passe réinitialisé !",
      "message": "Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.",
      "redirecting": "Redirection vers la connexion...",
      "goToLogin": "Aller à la connexion"
    },
    "error": {
      "expired": "Ce lien a expiré",
      "expiredMessage": "Les liens de réinitialisation sont valides 30 minutes.",
      "requestNew": "Demander un nouveau lien"
    }
  },
  "verifyEmail": {
    "verifying": "Vérification en cours...",
    "success": {
      "title": "Email vérifié !",
      "message": "Votre adresse email a été vérifiée avec succès.",
      "redirecting": "Redirection..."
    },
    "error": {
      "title": "Échec de la vérification",
      "invalidToken": "Le lien de vérification est invalide ou a expiré.",
      "tryAgain": "Réessayer"
    }
  }
}
```

### 5.3 Modifier les pages

**Exemple : `src/pages/auth/Login.jsx`**

```jsx
import { useTranslation } from 'react-i18next'

const Login = () => {
  const { t } = useTranslation('auth')

  return (
    <div>
      <h1>{t('login.title')}</h1>
      <p>{t('login.subtitle')}</p>

      <form>
        <label>{t('login.field.email')}</label>
        <input
          placeholder={t('login.field.emailPlaceholder')}
          {...register('email', validationRules.email)}
        />

        <label>{t('login.field.password')}</label>
        <input
          placeholder={t('login.field.passwordPlaceholder')}
          {...register('password', validationRules.password)}
        />

        <label>
          <input type="checkbox" {...register('rememberMe')} />
          {t('login.rememberMe')}
        </label>

        <Link to="/forgot-password">{t('login.forgotPassword')}</Link>

        <button type="submit" disabled={isLoading}>
          {isLoading ? t('login.submitting') : t('login.submit')}
        </button>
      </form>

      <p>
        {t('login.noAccount')} <Link to="/register">{t('login.createAccount')}</Link>
      </p>
    </div>
  )
}
```

### 5.4 Checklist des pages auth

- [ ] `Login.jsx` - Tous les textes traduits
- [ ] `Register.jsx` - Tous les textes traduits
- [ ] `ForgotPassword.jsx` - Tous les textes traduits
- [ ] `ResetPassword.jsx` - Tous les textes traduits
- [ ] `VerifyEmail.jsx` - Tous les textes traduits

### ✅ PAUSE - Vérification Phase 4

- [ ] Toutes les pages auth fonctionnent en FR et EN
- [ ] Les erreurs de validation s'affichent correctement
- [ ] Les états de succès (email envoyé, compte créé) sont traduits
- [ ] Commit : `feat(i18n): translate authentication pages`

---

## 6. Phase 5 : Pages utilisateur

**Durée estimée : 5-6 heures**

### 6.1 Fichiers concernés

| Page | Fichier | Strings estimées |
|------|---------|------------------|
| Menu | `src/pages/menu/Menu.jsx` | 30+ |
| Checkout | `src/pages/checkout/Checkout.jsx` | 40+ |
| Orders | `src/pages/orders/Orders.jsx` | 25+ |
| Reservations | `src/pages/reservations/Reservations.jsx` | 35+ |
| Profile | `src/pages/profile/Profile.jsx` | 35+ |
| Contact | `src/pages/contact/Contact.jsx` | 30+ |
| Home | `src/pages/home/Home.jsx` | 20+ |

### 6.2 Créer les fichiers de traduction

#### menu.json

```json
{
  "title": "Notre Menu",
  "subtitle": "Découvrez notre sélection de plats préparés avec des ingrédients frais et de qualité",
  "search": {
    "placeholder": "Rechercher un plat..."
  },
  "filter": {
    "allDishes": "Tous les plats",
    "allCuisines": "Toutes les cuisines",
    "sortByPrice": "Trier par prix"
  },
  "sort": {
    "name": "Par nom",
    "priceAsc": "Prix croissant",
    "priceDesc": "Prix décroissant"
  },
  "cuisine": {
    "continental": "Continental",
    "asian": "Asiatique",
    "lao": "Laotien"
  },
  "category": {
    "appetizer": "Entrées",
    "main": "Plats",
    "dessert": "Desserts",
    "beverage": "Boissons"
  },
  "item": {
    "addToCart": "Ajouter au panier",
    "preparationTime": "{{time}} min",
    "allergens": "Allergènes",
    "noReviews": "Pas encore d'avis",
    "reviews": "{{count}} avis"
  },
  "empty": {
    "title": "Aucun plat trouvé",
    "message": "Essayez de modifier vos critères de recherche ou filtres",
    "resetFilters": "Réinitialiser les filtres"
  },
  "info": {
    "title": "Informations importantes",
    "delivery": "Livraison",
    "deliveryFree": "Gratuite à partir de 25€",
    "allergies": "Allergies",
    "allergiesNote": "Informez-nous de vos allergies lors de la commande"
  }
}
```

#### cart.json

```json
{
  "title": "Votre panier",
  "empty": {
    "title": "Votre panier est vide",
    "message": "Découvrez nos délicieux plats et ajoutez-les à votre panier !",
    "viewMenu": "Voir le menu"
  },
  "item": {
    "each": "{{price}} l'unité",
    "unavailable": "INDISPONIBLE",
    "deleted": "SUPPRIMÉ",
    "notIncluded": "Non inclus dans le total"
  },
  "unavailableAlert": "{{count}} article(s) indisponible(s) dans votre panier",
  "summary": {
    "originalTotal": "Total initial :",
    "availableTotal": "Total disponible ({{count}} articles) :",
    "totalToPay": "Total à payer :"
  },
  "actions": {
    "continueShopping": "Continuer mes achats",
    "emptyCart": "Vider le panier",
    "order": "Commander - {{total}}"
  }
}
```

#### orders.json (utilisateur)

```json
{
  "title": "Mes Commandes",
  "subtitle": "Suivez l'état de vos commandes",
  "empty": {
    "title": "Aucune commande",
    "message": "Vous n'avez pas encore passé de commande.",
    "orderNow": "Commander maintenant"
  },
  "status": {
    "pending": "En attente",
    "confirmed": "Confirmée",
    "preparing": "En préparation",
    "ready": "Prête",
    "delivered": "Livrée",
    "cancelled": "Annulée"
  },
  "type": {
    "pickup": "À emporter",
    "delivery": "Livraison"
  },
  "payment": {
    "card": "Carte bancaire",
    "cash": "Espèces",
    "paid": "Payé",
    "pending": "En attente"
  },
  "details": {
    "orderNumber": "Commande #{{number}}",
    "date": "Date",
    "items": "Articles",
    "total": "Total",
    "status": "Statut",
    "deliveryAddress": "Adresse de livraison",
    "pickupTime": "Heure de retrait"
  },
  "actions": {
    "viewDetails": "Voir les détails",
    "cancel": "Annuler",
    "reorder": "Commander à nouveau"
  }
}
```

#### reservations.json (utilisateur)

```json
{
  "title": "Mes Réservations",
  "subtitle": "Gérez vos réservations de table",
  "newReservation": "Nouvelle réservation",
  "empty": {
    "title": "Aucune réservation",
    "message": "Vous n'avez pas encore de réservation.",
    "bookNow": "Réserver une table"
  },
  "status": {
    "pending": "En attente",
    "confirmed": "Confirmée",
    "seated": "Installé",
    "completed": "Terminée",
    "cancelled": "Annulée",
    "noShow": "Non présenté"
  },
  "form": {
    "title": "Réserver une table",
    "editTitle": "Modifier la réservation",
    "date": "Date",
    "datePlaceholder": "Sélectionnez une date",
    "time": "Heure",
    "timePlaceholder": "Sélectionnez un créneau",
    "guests": "Nombre de convives",
    "guestsPlaceholder": "Combien de personnes ?",
    "specialRequests": "Demandes spéciales",
    "specialRequestsPlaceholder": "Allergies, occasion spéciale, préférences...",
    "submit": "Réserver",
    "submitting": "Réservation en cours...",
    "update": "Modifier",
    "updating": "Modification en cours..."
  },
  "slots": {
    "lunch": "Déjeuner",
    "dinner": "Dîner",
    "unavailable": "Créneau indisponible"
  },
  "details": {
    "reservationNumber": "Réservation #{{number}}",
    "date": "Date",
    "time": "Heure",
    "guests": "{{count}} convive(s)",
    "table": "Table(s)",
    "status": "Statut",
    "specialRequests": "Demandes spéciales"
  },
  "actions": {
    "edit": "Modifier",
    "cancel": "Annuler",
    "viewDetails": "Voir les détails"
  },
  "rules": {
    "editRestriction": "Seules les réservations confirmées peuvent être modifiées",
    "editTimeLimit": "Modification impossible moins d'1 heure avant",
    "cancelTimeLimit": "Annulation impossible moins de 2 heures avant",
    "pastBooking": "Impossible de réserver dans le passé"
  }
}
```

### 6.3 Modifier les pages

Procéder page par page, en suivant le même pattern que pour les pages auth.

### 6.4 Checklist des pages utilisateur

- [ ] `Home.jsx` - Traduit
- [ ] `Menu.jsx` - Traduit
- [ ] `Checkout.jsx` - Traduit
- [ ] `Orders.jsx` - Traduit
- [ ] `Reservations.jsx` - Traduit
- [ ] `Profile.jsx` - Traduit
- [ ] `Contact.jsx` - Traduit

### ✅ PAUSE - Vérification Phase 5

- [ ] Navigation complète en FR et EN
- [ ] Checkout fonctionne avec tous les textes traduits
- [ ] Création de réservation fonctionne
- [ ] Profil complet (info + sécurité) traduit
- [ ] Commit : `feat(i18n): translate user pages`

---

## 7. Phase 6 : Pages admin

**Durée estimée : 5-6 heures**

### 7.1 Fichiers concernés

| Page | Fichier | Strings estimées |
|------|---------|------------------|
| Dashboard | `src/pages/admin/Dashboard.jsx` | 50+ |
| MenuManagement | `src/pages/admin/MenuManagement.jsx` | 45+ |
| OrdersManagement | `src/pages/admin/OrdersManagement.jsx` | 40+ |
| ReservationsManagement | `src/pages/admin/ReservationsManagement.jsx` | 35+ |
| ContactsManagement | `src/pages/admin/ContactsManagement.jsx` | 25+ |
| UsersManagement | `src/pages/admin/UsersManagement.jsx` | 30+ |

### 7.2 Créer admin.json

```json
{
  "dashboard": {
    "title": "Tableau de bord",
    "subtitle": "Vue d'ensemble de votre restaurant",
    "stats": {
      "todayRevenue": "Chiffre d'affaires du jour",
      "todayOrders": "Commandes du jour",
      "todayReservations": "Réservations du jour",
      "activeUsers": "Utilisateurs actifs"
    },
    "comparison": {
      "vsLastWeek": "vs semaine dernière",
      "vsLastMonth": "vs mois dernier",
      "increase": "+{{value}}%",
      "decrease": "-{{value}}%"
    },
    "sections": {
      "orders": "Commandes",
      "reservations": "Réservations",
      "revenue": "Revenus",
      "menu": "Menu"
    },
    "period": {
      "today": "Aujourd'hui",
      "thisMonth": "Ce mois",
      "lastMonth": "Mois dernier"
    }
  },
  "menu": {
    "title": "Gestion du menu",
    "stats": "{{total}} articles | {{available}} disponibles",
    "newItem": "Nouvel article",
    "search": "Rechercher un article...",
    "filter": {
      "allCategories": "Toutes les catégories"
    },
    "form": {
      "title": "Nouvel article",
      "editTitle": "Modifier l'article",
      "name": "Nom",
      "namePlaceholder": "ex: Pizza Margherita",
      "price": "Prix",
      "pricePlaceholder": "15.90",
      "description": "Description",
      "descriptionPlaceholder": "Décrivez le plat, ses ingrédients principaux...",
      "category": "Catégorie",
      "cuisine": "Type de cuisine",
      "preparationTime": "Temps de préparation (min)",
      "image": "Image",
      "allergens": "Allergènes",
      "isAvailable": "Disponible",
      "isVegetarian": "Végétarien",
      "submit": "Ajouter",
      "update": "Modifier"
    },
    "item": {
      "available": "Disponible",
      "unavailable": "Indisponible",
      "edit": "Modifier",
      "delete": "Supprimer",
      "enable": "Activer",
      "disable": "Désactiver"
    },
    "empty": {
      "title": "Aucun article trouvé",
      "noData": "Commencez par ajouter votre premier article",
      "noMatch": "Essayez d'ajuster vos filtres",
      "addItem": "Ajouter un article"
    },
    "confirm": {
      "delete": "Êtes-vous sûr de vouloir supprimer \"{{name}}\" ?"
    }
  },
  "orders": {
    "title": "Gestion des commandes",
    "tabs": {
      "recent": "Récentes (15 jours)",
      "history": "Historique"
    },
    "filter": {
      "allStatuses": "Tous les statuts",
      "today": "Aujourd'hui",
      "search": "Entrer le numéro de commande"
    },
    "refresh": "Actualiser",
    "updated": "Mis à jour il y a {{time}}",
    "table": {
      "order": "Commande",
      "customer": "Client",
      "items": "Articles",
      "total": "Total",
      "type": "Type",
      "payment": "Paiement",
      "status": "Statut",
      "actions": "Actions"
    },
    "details": {
      "title": "Détails commande #{{number}}",
      "customer": "Client",
      "contact": "Contact",
      "address": "Adresse",
      "items": "Articles commandés",
      "timeline": "Historique"
    },
    "empty": {
      "title": "Aucune commande trouvée",
      "message": "Les commandes apparaîtront ici"
    },
    "pagination": {
      "showing": "Page {{current}} sur {{total}}"
    }
  },
  "reservations": {
    "title": "Gestion des réservations",
    "tabs": {
      "recent": "Récentes (15 jours + à venir)",
      "history": "Historique"
    },
    "filter": {
      "allStatuses": "Tous les statuts",
      "today": "Aujourd'hui",
      "search": "Entrer le numéro de réservation"
    },
    "refresh": "Actualiser",
    "updated": "Mis à jour il y a {{time}}",
    "table": {
      "reservation": "Réservation",
      "customer": "Client",
      "date": "Date",
      "time": "Heure",
      "guests": "Convives",
      "tables": "Tables",
      "status": "Statut",
      "actions": "Actions"
    },
    "details": {
      "title": "Détails réservation",
      "customer": "Client",
      "contact": "Contact",
      "specialRequests": "Demandes spéciales"
    },
    "empty": {
      "title": "Aucune réservation trouvée",
      "message": "Les réservations apparaîtront ici"
    }
  },
  "contacts": {
    "title": "Messages de contact",
    "filter": {
      "allStatuses": "Tous les statuts",
      "new": "Nouveaux",
      "read": "Lus",
      "replied": "Répondus"
    },
    "table": {
      "from": "De",
      "subject": "Sujet",
      "date": "Date",
      "status": "Statut",
      "actions": "Actions"
    },
    "status": {
      "new": "Nouveau",
      "read": "Lu",
      "replied": "Répondu"
    },
    "actions": {
      "markAsRead": "Marquer comme lu",
      "markAsReplied": "Marquer comme répondu",
      "delete": "Supprimer"
    },
    "empty": {
      "title": "Aucun message",
      "message": "Les messages de contact apparaîtront ici"
    }
  },
  "users": {
    "title": "Gestion des utilisateurs",
    "stats": "{{total}} utilisateurs",
    "search": "Rechercher un utilisateur...",
    "table": {
      "user": "Utilisateur",
      "email": "Email",
      "role": "Rôle",
      "status": "Statut",
      "joined": "Inscription",
      "actions": "Actions"
    },
    "role": {
      "admin": "Administrateur",
      "user": "Utilisateur"
    },
    "status": {
      "active": "Actif",
      "inactive": "Inactif",
      "verified": "Vérifié",
      "unverified": "Non vérifié"
    },
    "empty": {
      "title": "Aucun utilisateur trouvé"
    }
  },
  "common": {
    "actions": "Actions",
    "view": "Voir",
    "edit": "Modifier",
    "delete": "Supprimer",
    "save": "Enregistrer",
    "cancel": "Annuler",
    "close": "Fermer",
    "confirm": "Confirmer",
    "loading": "Chargement...",
    "noData": "Aucune donnée"
  }
}
```

### 7.3 Checklist des pages admin

- [ ] `Dashboard.jsx` - Traduit
- [ ] `MenuManagement.jsx` - Traduit
- [ ] `OrdersManagement.jsx` - Traduit
- [ ] `ReservationsManagement.jsx` - Traduit
- [ ] `ContactsManagement.jsx` - Traduit
- [ ] `UsersManagement.jsx` - Traduit

### ✅ PAUSE - Vérification Phase 6

- [ ] Dashboard affiche toutes les stats en FR/EN
- [ ] CRUD menu fonctionne avec messages traduits
- [ ] Changement de statut commandes/réservations traduit
- [ ] Modals de détails traduits
- [ ] Commit : `feat(i18n): translate admin pages`

---

## 8. Phase 7 : Composants communs

**Durée estimée : 3-4 heures**

### 8.1 Fichiers concernés

| Composant | Fichier | Strings estimées |
|-----------|---------|------------------|
| Header | `src/components/layout/Header.jsx` | 10+ |
| Footer | `src/components/layout/Footer.jsx` | 20+ |
| CartModal | `src/components/common/CartModal.jsx` | 15+ |
| DeleteAccountModal | `src/components/profile/DeleteAccountModal.jsx` | 25+ |
| InlineAlert | `src/components/common/InlineAlert.jsx` | 5+ |
| EmailVerificationBanner | `src/components/common/EmailVerificationBanner.jsx` | 10+ |

### 8.2 Ajouter au common.json

```json
{
  "header": {
    "home": "Accueil",
    "menu": "Menu",
    "reservations": "Réservations",
    "orders": "Commandes",
    "contact": "Contact",
    "profile": "Mon profil",
    "admin": "Administration",
    "login": "Connexion",
    "logout": "Déconnexion"
  },
  "footer": {
    "about": {
      "title": "À propos",
      "description": "RestOh, votre restaurant de qualité depuis 2020. Cuisine française et internationale préparée avec passion."
    },
    "hours": {
      "title": "Horaires d'ouverture",
      "weekdays": "Lundi - Vendredi",
      "weekend": "Samedi - Dimanche",
      "lunch": "{{start}} - {{end}}",
      "dinner": "{{start}} - {{end}}",
      "closed": "Fermé"
    },
    "contact": {
      "title": "Contact",
      "address": "123 Rue de la Gastronomie",
      "city": "75001 Paris, France",
      "phone": "01 42 34 56 78",
      "email": "contact@restoh.fr"
    },
    "social": {
      "title": "Suivez-nous"
    },
    "copyright": "© {{year}} RestOh. Tous droits réservés."
  },
  "deleteAccount": {
    "title": "Supprimer mon compte",
    "warning": {
      "title": "Cette action est irréversible !",
      "consequences": [
        "Votre compte sera définitivement supprimé",
        "Toutes vos données personnelles seront effacées",
        "Vos commandes et réservations seront anonymisées"
      ]
    },
    "blocked": {
      "title": "Suppression impossible",
      "message": "Vous ne pouvez pas supprimer votre compte actuellement.",
      "reason": "Vous avez une commande en livraison non payée.",
      "action": "Vous pourrez supprimer votre compte une fois la livraison terminée."
    },
    "confirmReservations": {
      "title": "Réservations actives",
      "message": "Vous avez {{count}} réservation(s) active(s) qui seront annulées :",
      "confirm": "Je confirme l'annulation de mes réservations"
    },
    "form": {
      "confirmText": "Tapez DELETE pour confirmer",
      "confirmPlaceholder": "Tapez DELETE",
      "password": "Mot de passe",
      "passwordPlaceholder": "Votre mot de passe actuel"
    },
    "submit": "Supprimer définitivement",
    "submitting": "Suppression...",
    "cancel": "Annuler"
  },
  "emailVerification": {
    "title": "Email non vérifié",
    "message": "Votre adresse email n'a pas encore été vérifiée.",
    "action": "Renvoyer l'email de vérification",
    "sending": "Envoi..."
  },
  "buttons": {
    "save": "Enregistrer",
    "cancel": "Annuler",
    "delete": "Supprimer",
    "edit": "Modifier",
    "close": "Fermer",
    "confirm": "Confirmer",
    "back": "Retour",
    "next": "Suivant",
    "submit": "Envoyer",
    "loading": "Chargement..."
  },
  "errors": {
    "generic": "Une erreur est survenue",
    "notFound": "Page non trouvée",
    "unauthorized": "Accès non autorisé",
    "networkError": "Erreur de connexion"
  }
}
```

### 8.3 Checklist des composants

- [ ] `Header.jsx` - Navigation traduite
- [ ] `Footer.jsx` - Informations traduites
- [ ] `CartModal.jsx` - Tous les textes traduits
- [ ] `DeleteAccountModal.jsx` - Tous les états traduits
- [ ] `EmailVerificationBanner.jsx` - Traduit
- [ ] Autres composants communs

### ✅ PAUSE - Vérification Phase 7

- [ ] Header/Footer en FR et EN
- [ ] CartModal complet
- [ ] DeleteAccountModal (tous les états : initial, blocked, confirm-reservations)
- [ ] Commit : `feat(i18n): translate common components`

---

## 9. Phase 8 : Services et statuts

**Durée estimée : 2-3 heures**

### 9.1 Fichiers concernés

- `src/services/orders/orderService.js`
- `src/services/reservations/reservationService.js`

### 9.2 Créer des fonctions de traduction pour les statuts

**Fichier : `src/utils/statusTranslations.js`**

```javascript
import i18n from '../i18n'

export const getOrderStatusLabel = (status) => {
  return i18n.t(`orders:status.${status}`, status)
}

export const getReservationStatusLabel = (status) => {
  return i18n.t(`reservations:status.${status}`, status)
}

export const getPaymentMethodLabel = (method) => {
  return i18n.t(`orders:payment.${method}`, method)
}

export const getOrderTypeLabel = (type) => {
  return i18n.t(`orders:type.${type}`, type)
}

export const getCategoryLabel = (category) => {
  return i18n.t(`menu:category.${category}`, category)
}

export const getCuisineLabel = (cuisine) => {
  return i18n.t(`menu:cuisine.${cuisine}`, cuisine)
}
```

### 9.3 Modifier les services

**Exemple : `src/services/orders/orderService.js`**

```javascript
import { getOrderStatusLabel, getPaymentMethodLabel } from '../../utils/statusTranslations'

export const getStatusDisplayInfo = (status) => {
  const statusConfig = {
    pending: { color: 'yellow', icon: Clock },
    confirmed: { color: 'blue', icon: CheckCircle },
    preparing: { color: 'orange', icon: ChefHat },
    ready: { color: 'green', icon: Package },
    delivered: { color: 'emerald', icon: CheckCircle },
    cancelled: { color: 'red', icon: XCircle }
  }

  return {
    ...statusConfig[status],
    label: getOrderStatusLabel(status) // Traduit dynamiquement
  }
}
```

### ✅ PAUSE - Vérification Phase 8

- [ ] Les statuts s'affichent dans la bonne langue partout
- [ ] Les badges de statut sont traduits
- [ ] Les selects de statut admin sont traduits
- [ ] Commit : `feat(i18n): translate status labels and enums`

---

## 10. Phase 9 : Layout et navigation

**Durée estimée : 1-2 heures**

### 10.1 Intégrer le LanguageSwitcher dans le Header

**Fichier : `src/components/layout/Header.jsx`**

```jsx
import LanguageSwitcher from '../common/LanguageSwitcher'

const Header = () => {
  const { t } = useTranslation()

  return (
    <header>
      <nav>
        <Link to="/">{t('common:header.home')}</Link>
        <Link to="/menu">{t('common:header.menu')}</Link>
        {/* ... */}
      </nav>

      <div className="flex items-center gap-4">
        <LanguageSwitcher />
        {/* User menu */}
      </div>
    </header>
  )
}
```

### 10.2 Vérifier les titres de page (document.title)

Si vous utilisez un hook ou composant pour les titres de page, les traduire également.

### ✅ PAUSE - Vérification Phase 9

- [ ] Sélecteur de langue visible et fonctionnel
- [ ] Navigation complète traduite
- [ ] Titres de page traduits (si applicable)
- [ ] Commit : `feat(i18n): add language switcher to header`

---

## 11. Phase 10 : Tests et QA

**Durée estimée : 2-3 jours**

### 11.1 Tests manuels

#### Parcours utilisateur complet en FR

- [ ] Page d'accueil
- [ ] Inscription
- [ ] Vérification email
- [ ] Connexion
- [ ] Navigation menu
- [ ] Ajout au panier
- [ ] Checkout complet
- [ ] Création réservation
- [ ] Modification réservation
- [ ] Annulation réservation
- [ ] Profil (affichage + édition)
- [ ] Changement mot de passe
- [ ] Suppression compte (tous les cas)
- [ ] Contact
- [ ] Déconnexion

#### Parcours admin complet en FR

- [ ] Dashboard
- [ ] Gestion menu (CRUD)
- [ ] Gestion commandes
- [ ] Gestion réservations
- [ ] Gestion contacts
- [ ] Gestion utilisateurs

#### Répéter en EN

- [ ] Tous les parcours ci-dessus en anglais

### 11.2 Tests automatisés

Ajouter des tests pour vérifier que les clés de traduction existent :

```javascript
// __tests__/i18n/translations.test.js
import fr from '../../i18n/locales/fr/common.json'
import en from '../../i18n/locales/en/common.json'

describe('Translations', () => {
  it('should have same keys in FR and EN', () => {
    const frKeys = Object.keys(fr).sort()
    const enKeys = Object.keys(en).sort()
    expect(frKeys).toEqual(enKeys)
  })

  it('should not have empty values in FR', () => {
    const checkEmpty = (obj, path = '') => {
      Object.entries(obj).forEach(([key, value]) => {
        if (typeof value === 'object') {
          checkEmpty(value, `${path}.${key}`)
        } else {
          expect(value).not.toBe('')
        }
      })
    }
    checkEmpty(fr)
  })
})
```

### 11.3 Vérifications spéciales

- [ ] Pluralisations correctes (1 article vs 2 articles)
- [ ] Interpolations ({{name}}, {{count}}, etc.)
- [ ] Dates formatées selon la locale
- [ ] Prix formatés selon la locale
- [ ] Pas de texte tronqué (boutons, labels)
- [ ] Pas de texte hardcodé oublié

### ✅ PAUSE - Vérification Phase 10

- [ ] Tous les parcours testés en FR et EN
- [ ] Aucun texte hardcodé restant
- [ ] Aucune clé manquante
- [ ] Tests automatisés passent
- [ ] Commit : `test(i18n): add translation tests`

---

## 12. Phase 11 : Backend (optionnel)

**Cette phase est optionnelle et dépend des besoins futurs.**

### 12.1 Messages d'erreur API

Actuellement, le backend renvoie des messages d'erreur en texte. Pour l'i18n :

**Option A : Codes d'erreur (recommandé)**

```javascript
// Backend renvoie
{ success: false, code: 'INVALID_EMAIL', error: 'Invalid email' }

// Frontend traduit
const errorMessage = t(`errors:${result.code}`, result.error)
```

**Option B : Messages dans les deux langues**

```javascript
// Backend renvoie
{
  success: false,
  error: {
    fr: 'Email invalide',
    en: 'Invalid email'
  }
}
```

### 12.2 Contenu du menu

Si les noms/descriptions de plats doivent être traduits :

**Structure de données**

```javascript
// Option A : Champs séparés
{
  name_fr: 'Pizza Margherita',
  name_en: 'Margherita Pizza',
  description_fr: 'Tomate, mozzarella, basilic',
  description_en: 'Tomato, mozzarella, basil'
}

// Option B : Objet de traduction
{
  name: { fr: 'Pizza Margherita', en: 'Margherita Pizza' },
  description: { fr: '...', en: '...' }
}
```

### 12.3 Emails transactionnels

Templates d'emails à créer en FR et EN :
- Confirmation d'inscription
- Vérification email
- Réinitialisation mot de passe
- Confirmation de commande
- Confirmation de réservation

---

## 13. Checklist finale

### Configuration

- [ ] i18next installé et configuré
- [ ] Détection de langue automatique
- [ ] Persistance du choix utilisateur
- [ ] LanguageSwitcher dans le header

### Traductions FR

- [ ] `common.json` complet
- [ ] `auth.json` complet
- [ ] `validation.json` complet
- [ ] `menu.json` complet
- [ ] `cart.json` complet
- [ ] `orders.json` complet
- [ ] `reservations.json` complet
- [ ] `profile.json` complet
- [ ] `contact.json` complet
- [ ] `admin.json` complet
- [ ] `errors.json` complet

### Traductions EN

- [ ] Tous les fichiers traduits en anglais
- [ ] Vérification par un anglophone natif (idéalement)

### Code

- [ ] Hooks migrés (useAuth, useCart, useOrders, useReservations)
- [ ] Pages auth migrées
- [ ] Pages utilisateur migrées
- [ ] Pages admin migrées
- [ ] Composants communs migrés
- [ ] Services de statuts migrés

### Tests

- [ ] Tests manuels FR
- [ ] Tests manuels EN
- [ ] Tests automatisés
- [ ] Aucune régression fonctionnelle

### Documentation

- [ ] README mis à jour
- [ ] CLAUDE.md mis à jour

---

## 14. Annexes

### 14.1 Commandes utiles

```bash
# Rechercher les textes hardcodés restants
grep -r "\"[A-Z][a-z]" src/pages src/components --include="*.jsx" | grep -v "import\|export\|className"

# Compter les clés de traduction
cat src/i18n/locales/fr/*.json | jq 'keys | length'

# Vérifier les clés manquantes entre FR et EN
diff <(cat src/i18n/locales/fr/common.json | jq -S .) <(cat src/i18n/locales/en/common.json | jq -S .)
```

### 14.2 Ressources

- [react-i18next documentation](https://react.i18next.com/)
- [i18next documentation](https://www.i18next.com/)
- [Interpolation](https://www.i18next.com/translation-function/interpolation)
- [Pluralization](https://www.i18next.com/translation-function/plurals)

### 14.3 Estimation de temps par phase

| Phase | Description | Durée estimée |
|-------|-------------|---------------|
| 1 | Setup et configuration | 2-3h |
| 2 | Messages de validation | 2-3h |
| 3 | Hooks et toasts | 3-4h |
| 4 | Pages authentification | 4-5h |
| 5 | Pages utilisateur | 5-6h |
| 6 | Pages admin | 5-6h |
| 7 | Composants communs | 3-4h |
| 8 | Services et statuts | 2-3h |
| 9 | Layout et navigation | 1-2h |
| 10 | Tests et QA | 16-24h |
| 11 | Backend (optionnel) | Variable |
| **Total** | | **44-60h (12-16 jours)** |

---

**Document créé le** : Décembre 2024
**Dernière mise à jour** : Décembre 2024
**Version** : 1.0
