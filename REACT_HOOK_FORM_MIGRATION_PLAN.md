# Plan de Migration vers React Hook Form

Ce document détaille les étapes pour migrer tous les formulaires de RestOh vers React Hook Form avec validation onBlur.

## Table des matières

1. [Phase 1 : Installation et configuration](#phase-1--installation-et-configuration)
2. [Phase 2 : Migration Register.jsx](#phase-2--migration-registerjsx)
3. [Phase 3 : Migration Login.jsx](#phase-3--migration-loginjsx)
4. [Phase 4 : Migration ForgotPassword.jsx](#phase-4--migration-forgotpasswordjsx)
5. [Phase 5 : Migration ResetPassword.jsx](#phase-5--migration-resetpasswordjsx)
6. [Phase 6 : Migration Contact.jsx](#phase-6--migration-contactjsx)
7. [Phase 7 : Migration Profile.jsx](#phase-7--migration-profilejsx)
8. [Phase 8 : Migration Checkout.jsx](#phase-8--migration-checkoutjsx)
9. [Phase 9 : Migration formulaire Reservations](#phase-9--migration-formulaire-reservations)
10. [Phase 10 : Nettoyage et tests finaux](#phase-10--nettoyage-et-tests-finaux)

---

## Phase 1 : Installation et configuration

### Objectif
Installer React Hook Form et créer les utilitaires de validation réutilisables.

### Étapes détaillées

#### 1.1 Installation de la dépendance
```bash
npm install react-hook-form
```

#### 1.2 Créer le fichier de validateurs `src/utils/formValidators.js`

Ce fichier centralisera toutes les règles de validation réutilisables :

```javascript
// Règles de validation pour React Hook Form

export const validationRules = {
  // Email
  email: {
    required: 'Email is required',
    pattern: {
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      message: 'Invalid email address'
    }
  },

  // Password
  password: {
    required: 'Password is required',
    minLength: {
      value: 6,
      message: 'Password must be at least 6 characters'
    }
  },

  // Name
  name: {
    required: 'Name is required',
    minLength: {
      value: 2,
      message: 'Name must be at least 2 characters'
    }
  },

  // Phone (optional but validated if provided)
  phone: {
    pattern: {
      value: /^(\+33|0)[1-9](\d{2}){4}$/,
      message: 'Invalid phone number format'
    }
  },

  // Message/Textarea
  message: {
    required: 'Message is required',
    minLength: {
      value: 10,
      message: 'Message must be at least 10 characters'
    }
  },

  // Guests (reservations)
  guests: {
    required: 'Number of guests is required',
    min: {
      value: 1,
      message: 'At least 1 guest required'
    },
    max: {
      value: 20,
      message: 'Maximum 20 guests'
    }
  }
}

// Fonction helper pour la validation de confirmation de mot de passe
export const validatePasswordMatch = (confirmPassword, password) => {
  return confirmPassword === password || 'Passwords do not match'
}
```

#### 1.3 Créer le composant `src/components/common/FormInput.jsx`

Composant réutilisable pour les inputs avec gestion d'erreur intégrée :

```javascript
import { forwardRef } from 'react'

const FormInput = forwardRef(({
  label,
  name,
  type = 'text',
  placeholder,
  error,
  icon: Icon,
  rightElement,
  className = '',
  ...props
}, ref) => {
  return (
    <div>
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="mt-1 relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400" />
          </div>
        )}
        <input
          ref={ref}
          id={name}
          name={name}
          type={type}
          placeholder={placeholder}
          className={`appearance-none block w-full ${Icon ? 'pl-10' : 'pl-3'} ${rightElement ? 'pr-10' : 'pr-3'} py-2 border-2 ${
            error ? 'border-red-300' : 'border-primary-300'
          } rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm ${className}`}
          {...props}
        />
        {rightElement && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {rightElement}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
})

FormInput.displayName = 'FormInput'

export default FormInput
```

#### 1.4 Vérification
- [ ] `npm install react-hook-form` réussi
- [ ] `src/utils/formValidators.js` créé
- [ ] `src/components/common/FormInput.jsx` créé
- [ ] Application démarre sans erreur (`npm run dev`)

---

## Phase 2 : Migration Register.jsx

### Objectif
Migrer le formulaire d'inscription avec validation onBlur pour tous les champs.

### État actuel
- 4 champs : name, email, password, confirmPassword
- Validation au submit uniquement via `AuthService.validateRegistrationData()`
- Affichage conditionnel des bordures rouge/orange
- État `formErrors` géré manuellement

### Étapes détaillées

#### 2.1 Imports à modifier

**Avant :**
```javascript
import { useState } from 'react'
```

**Après :**
```javascript
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { validationRules, validatePasswordMatch } from '../../utils/formValidators'
```

#### 2.2 Remplacer la gestion d'état du formulaire

**Avant :**
```javascript
const [formData, setFormData] = useState({
  name: '',
  email: '',
  password: '',
  confirmPassword: ''
})
const [formErrors, setFormErrors] = useState({})

const handleChange = (e) => {
  const { name, value } = e.target
  setFormData(prev => ({ ...prev, [name]: value }))
  if (formErrors[name]) {
    setFormErrors(prev => ({ ...prev, [name]: '' }))
  }
}

const validateForm = () => {
  const validation = AuthService.validateRegistrationData(formData)
  setFormErrors(validation.errors)
  return validation.isValid
}
```

**Après :**
```javascript
const {
  register,
  handleSubmit,
  watch,
  formState: { errors }
} = useForm({
  mode: 'onBlur', // Validation quand on quitte le champ
  reValidateMode: 'onChange' // Re-validation en temps réel après première erreur
})

const password = watch('password') // Pour la validation confirmPassword
```

#### 2.3 Modifier le handleSubmit

**Avant :**
```javascript
const handleSubmit = async (e) => {
  e.preventDefault()
  if (!validateForm()) return
  setInlineError(null)

  const result = await register({
    name: formData.name,
    email: formData.email,
    password: formData.password
  })
  // ...
}
```

**Après :**
```javascript
const onSubmit = async (data) => {
  setInlineError(null)

  const result = await registerUser({
    name: data.name,
    email: data.email,
    password: data.password
  })
  // ...
}

// Note: renommer la fonction register du store en registerUser pour éviter conflit
const { register: registerUser, isLoading, error } = useAuthStore()
```

#### 2.4 Modifier les inputs

**Avant (exemple pour name) :**
```jsx
<input
  id="name"
  name="name"
  type="text"
  autoComplete="name"
  required
  value={formData.name}
  onChange={handleChange}
  className={`... ${formErrors.name ? 'border-red-300' : 'border-primary-300'} ...`}
  placeholder="Your full name"
/>
{formErrors.name && (
  <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
)}
```

**Après :**
```jsx
<input
  id="name"
  type="text"
  autoComplete="name"
  {...register('name', validationRules.name)}
  className={`... ${errors.name ? 'border-red-300' : 'border-primary-300'} ...`}
  placeholder="Your full name"
/>
{errors.name && (
  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
)}
```

#### 2.5 Cas spécial : confirmPassword

```jsx
<input
  id="confirmPassword"
  type={showConfirmPassword ? 'text' : 'password'}
  autoComplete="new-password"
  {...register('confirmPassword', {
    required: 'Please confirm your password',
    validate: (value) => validatePasswordMatch(value, password)
  })}
  className={`... ${errors.confirmPassword ? 'border-red-300' : 'border-primary-300'} ...`}
  placeholder="Confirm your password"
/>
```

#### 2.6 Modifier le form tag

**Avant :**
```jsx
<form className="space-y-6" onSubmit={handleSubmit}>
```

**Après :**
```jsx
<form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
```

#### 2.7 Vérification
- [ ] Champ name : erreur affichée au blur si vide ou < 2 caractères
- [ ] Champ email : erreur affichée au blur si format invalide
- [ ] Champ password : erreur affichée au blur si < 6 caractères
- [ ] Champ confirmPassword : erreur affichée au blur si ne correspond pas
- [ ] Submit : toutes les erreurs affichées si champs non touchés
- [ ] Bordures : orange par défaut, rouge en erreur
- [ ] Flow complet : inscription réussie fonctionne toujours

---

## Phase 3 : Migration Login.jsx

### Objectif
Migrer le formulaire de connexion avec validation onBlur.

### État actuel
- 2 champs : email, password
- Pas de validation inline (uniquement erreurs serveur)
- Gestion d'erreurs via `inlineError` et `error` du store

### Étapes détaillées

#### 3.1 Imports à ajouter
```javascript
import { useForm } from 'react-hook-form'
import { validationRules } from '../../utils/formValidators'
```

#### 3.2 Remplacer la gestion d'état

**Avant :**
```javascript
const [formData, setFormData] = useState({
  email: '',
  password: ''
})

const handleChange = (e) => {
  setFormData({
    ...formData,
    [e.target.name]: e.target.value
  })
}
```

**Après :**
```javascript
const {
  register,
  handleSubmit,
  formState: { errors }
} = useForm({
  mode: 'onBlur'
})
```

#### 3.3 Modifier handleSubmit

**Avant :**
```javascript
const handleSubmit = async (e) => {
  e.preventDefault()
  setInlineError(null)
  const result = await login(formData)
  // ...
}
```

**Après :**
```javascript
const onSubmit = async (data) => {
  setInlineError(null)
  const result = await login(data)
  // ...
}
```

#### 3.4 Modifier les inputs

Pour email :
```jsx
<input
  id="email"
  type="email"
  autoComplete="email"
  {...register('email', validationRules.email)}
  className={`... ${errors.email ? 'border-red-300' : 'border-primary-300'} ...`}
  placeholder="Enter your email"
/>
{errors.email && (
  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
)}
```

Pour password :
```jsx
<input
  id="password"
  type={showPassword ? 'text' : 'password'}
  autoComplete="current-password"
  {...register('password', { required: 'Password is required' })}
  className={`... ${errors.password ? 'border-red-300' : 'border-primary-300'} ...`}
  placeholder="Enter your password"
/>
{errors.password && (
  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
)}
```

#### 3.5 Modifier le form tag
```jsx
<form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
```

#### 3.6 Vérification
- [ ] Champ email : erreur au blur si vide ou format invalide
- [ ] Champ password : erreur au blur si vide
- [ ] Erreurs serveur : toujours affichées correctement (InlineAlert)
- [ ] Login réussi : fonctionne toujours

---

## Phase 4 : Migration ForgotPassword.jsx

### Objectif
Migrer le formulaire de mot de passe oublié.

### État actuel
- 1 champ : email
- Pas de validation inline

### Étapes détaillées

#### 4.1 Imports à ajouter
```javascript
import { useForm } from 'react-hook-form'
import { validationRules } from '../../utils/formValidators'
```

#### 4.2 Remplacer la gestion d'état

**Avant :**
```javascript
const [email, setEmail] = useState('')
```

**Après :**
```javascript
const {
  register,
  handleSubmit,
  getValues,
  formState: { errors }
} = useForm({
  mode: 'onBlur'
})
```

#### 4.3 Modifier handleSubmit

**Avant :**
```javascript
const handleSubmit = async (e) => {
  e.preventDefault()
  setIsLoading(true)
  const result = await emailApi.forgotPassword(email)
  // ...
}
```

**Après :**
```javascript
const onSubmit = async (data) => {
  setIsLoading(true)
  const result = await emailApi.forgotPassword(data.email)
  if (result.success) {
    setRegisteredEmail(data.email) // Pour afficher l'email dans le message de succès
    setIsSuccess(true)
  }
  // ...
}
```

#### 4.4 Gérer l'affichage de l'email dans le message de succès

Ajouter un state pour stocker l'email :
```javascript
const [registeredEmail, setRegisteredEmail] = useState('')
```

Dans le message de succès, utiliser `registeredEmail` au lieu de `email`.

#### 4.5 Modifier l'input

```jsx
<input
  id="email"
  type="email"
  autoComplete="email"
  {...register('email', validationRules.email)}
  className={`... ${errors.email ? 'border-red-300' : 'border-primary-300'} ...`}
  placeholder="your@email.com"
/>
{errors.email && (
  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
)}
```

#### 4.6 Vérification
- [ ] Champ email : erreur au blur si vide ou format invalide
- [ ] Submit : envoi réussi fonctionne
- [ ] Message de succès : affiche le bon email

---

## Phase 5 : Migration ResetPassword.jsx

### Objectif
Migrer le formulaire de réinitialisation de mot de passe.

### État actuel
- 2 champs : password, confirmPassword
- Validation via AuthService au submit

### Étapes détaillées

#### 5.1 Imports à ajouter
```javascript
import { useForm } from 'react-hook-form'
import { validationRules, validatePasswordMatch } from '../../utils/formValidators'
```

#### 5.2 Remplacer la gestion d'état

**Avant :**
```javascript
const [password, setPassword] = useState('')
const [confirmPassword, setConfirmPassword] = useState('')
```

**Après :**
```javascript
const {
  register,
  handleSubmit,
  watch,
  formState: { errors }
} = useForm({
  mode: 'onBlur'
})

const password = watch('password')
```

#### 5.3 Modifier handleSubmit

**Avant :**
```javascript
const handleSubmit = async (e) => {
  e.preventDefault()
  setError('')

  const passwordValidation = AuthService.validatePassword(password)
  if (!passwordValidation.isValid) {
    setError(passwordValidation.error)
    return
  }

  const matchValidation = AuthService.validatePasswordMatch(password, confirmPassword)
  if (!matchValidation.isValid) {
    setError(matchValidation.error)
    return
  }

  const result = await emailApi.resetPassword(token, password)
  // ...
}
```

**Après :**
```javascript
const onSubmit = async (data) => {
  setError('')
  setIsLoading(true)

  const result = await emailApi.resetPassword(token, data.password)
  // ...
}
```

#### 5.4 Modifier les inputs

Pour password :
```jsx
<input
  id="password"
  type={showPassword ? 'text' : 'password'}
  autoComplete="new-password"
  {...register('password', validationRules.password)}
  className={`... ${errors.password ? 'border-red-300' : 'border-primary-300'} ...`}
  placeholder="Enter new password (min 6 characters)"
/>
{errors.password && (
  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
)}
```

Pour confirmPassword :
```jsx
<input
  id="confirmPassword"
  type={showConfirmPassword ? 'text' : 'password'}
  autoComplete="new-password"
  {...register('confirmPassword', {
    required: 'Please confirm your password',
    validate: (value) => validatePasswordMatch(value, password)
  })}
  className={`... ${errors.confirmPassword ? 'border-red-300' : 'border-primary-300'} ...`}
  placeholder="Confirm new password"
/>
{errors.confirmPassword && (
  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
)}
```

#### 5.5 Vérification
- [ ] Champ password : erreur au blur si < 6 caractères
- [ ] Champ confirmPassword : erreur au blur si ne correspond pas
- [ ] Reset réussi : fonctionne toujours
- [ ] Gestion token expiré : toujours fonctionnelle

---

## Phase 6 : Migration Contact.jsx

### Objectif
Migrer le formulaire de contact.

### État actuel
- 3 champs : name, email, message
- Validation basique (required)

### Étapes détaillées

#### 6.1 Analyser le fichier actuel
Lire `src/pages/contact/Contact.jsx` pour comprendre la structure exacte.

#### 6.2 Imports à ajouter
```javascript
import { useForm } from 'react-hook-form'
import { validationRules } from '../../utils/formValidators'
```

#### 6.3 Appliquer le pattern standard
- Remplacer useState par useForm
- Modifier les inputs avec register
- Ajouter les messages d'erreur

#### 6.4 Vérification
- [ ] Tous les champs : validation au blur
- [ ] Envoi du message : fonctionne toujours

---

## Phase 7 : Migration Profile.jsx

### Objectif
Migrer le formulaire d'édition de profil.

### État actuel
- Champs : name, email, phone (optionnel)
- Mode édition toggle
- Validation à définir

### Étapes détaillées

#### 7.1 Analyser le fichier actuel
Lire `src/pages/profile/Profile.jsx` pour comprendre :
- Quels champs sont éditables
- Comment le mode édition fonctionne
- Les valeurs par défaut (from user data)

#### 7.2 Utiliser defaultValues

```javascript
const {
  register,
  handleSubmit,
  reset,
  formState: { errors }
} = useForm({
  mode: 'onBlur',
  defaultValues: {
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || ''
  }
})

// Reset form when user data changes or edit mode toggles
useEffect(() => {
  if (user) {
    reset({
      name: user.name,
      email: user.email,
      phone: user.phone || ''
    })
  }
}, [user, reset])
```

#### 7.3 Vérification
- [ ] Valeurs par défaut : remplies depuis user data
- [ ] Validation au blur : fonctionne
- [ ] Annulation : reset les valeurs
- [ ] Sauvegarde : fonctionne toujours

---

## Phase 8 : Migration Checkout.jsx

### Objectif
Migrer les formulaires du checkout (customer info).

### État actuel
- Section customer info avec : name, email, phone, address (si delivery)
- Possiblement des champs conditionnels

### Étapes détaillées

#### 8.1 Analyser le fichier actuel
Lire `src/pages/checkout/Checkout.jsx` pour comprendre :
- Structure des formulaires
- Champs conditionnels (pickup vs delivery)
- Validation existante

#### 8.2 Appliquer le pattern avec champs conditionnels

```javascript
const {
  register,
  handleSubmit,
  watch,
  formState: { errors }
} = useForm({
  mode: 'onBlur'
})

const orderType = watch('orderType')

// Validation conditionnelle pour address
{...register('address', {
  required: orderType === 'delivery' ? 'Address is required for delivery' : false
})}
```

#### 8.3 Vérification
- [ ] Champs customer info : validation au blur
- [ ] Champs conditionnels : validation correcte selon type
- [ ] Checkout complet : fonctionne toujours

---

## Phase 9 : Migration formulaire Reservations

### Objectif
Migrer le formulaire de réservation (si présent dans une page publique).

### Étapes détaillées

#### 9.1 Identifier les fichiers concernés
Chercher les formulaires de réservation dans :
- `src/pages/reservations/`
- `src/components/`

#### 9.2 Appliquer le pattern standard

#### 9.3 Vérification
- [ ] Tous les champs : validation au blur
- [ ] Création réservation : fonctionne toujours

---

## Phase 10 : Nettoyage et tests finaux

### Objectif
Finaliser la migration et s'assurer que tout fonctionne.

### Étapes détaillées

#### 10.1 Supprimer le code mort
- Retirer les anciennes fonctions de validation dans AuthService si plus utilisées
- Nettoyer les imports inutilisés

#### 10.2 Tests manuels complets
- [ ] Register : flow complet inscription
- [ ] Login : flow complet connexion
- [ ] ForgotPassword : flow complet
- [ ] ResetPassword : flow complet
- [ ] Contact : envoi message
- [ ] Profile : édition profil
- [ ] Checkout : commande complète
- [ ] Reservations : création réservation

#### 10.3 Tests automatisés
```bash
npm test
```
Vérifier que tous les tests passent. Adapter les tests si nécessaire.

#### 10.4 Commit final
```bash
git add -A
git commit -m "feat: migrate all forms to React Hook Form with onBlur validation"
```

#### 10.5 Mise à jour documentation
Mettre à jour CLAUDE.md si nécessaire pour refléter l'utilisation de React Hook Form.

---

## Récapitulatif des fichiers à modifier

| Phase | Fichier | Complexité |
|-------|---------|------------|
| 1 | Installation + nouveaux fichiers | Faible |
| 2 | `src/pages/auth/Register.jsx` | Moyenne |
| 3 | `src/pages/auth/Login.jsx` | Faible |
| 4 | `src/pages/auth/ForgotPassword.jsx` | Faible |
| 5 | `src/pages/auth/ResetPassword.jsx` | Faible |
| 6 | `src/pages/contact/Contact.jsx` | Faible |
| 7 | `src/pages/profile/Profile.jsx` | Moyenne |
| 8 | `src/pages/checkout/Checkout.jsx` | Moyenne |
| 9 | Réservations (à identifier) | À déterminer |
| 10 | Nettoyage + tests | Faible |

---

## Notes importantes

1. **Commits fréquents** : Faire un commit après chaque phase réussie
2. **Tests manuels** : Tester chaque formulaire après migration
3. **Pas de régression** : S'assurer que les fonctionnalités existantes marchent toujours
4. **Cohérence visuelle** : Les bordures orange/rouge doivent être cohérentes partout

---

*Document créé le : $(date)*
*Dernière mise à jour : À compléter après chaque phase*
