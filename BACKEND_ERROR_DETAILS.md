# Backend Error Details Specification

Ce document définit quand et comment le backend doit remplir le champ `details` des réponses d'erreur pour permettre au frontend d'afficher des notifications intelligentes.

## Format Standard d'Erreur

```json
{
  "success": false,
  "error": "Message principal pour l'utilisateur",
  "code": "ERROR_CODE",
  "details": {
    // Données structurées pour améliorer l'UX
  }
}
```

---

## 📅 Cas 1 : Tables indisponibles (Réservations)

### Endpoint
`POST /api/reservations`

### Scénario
L'utilisateur essaie de réserver des tables qui sont déjà occupées.

### Réponse Backend
```json
{
  "success": false,
  "error": "Tables 5 and 6 are no longer available",
  "code": "TABLES_UNAVAILABLE",
  "details": {
    "unavailableTables": [5, 6],
    "reason": "Already reserved by another customer",
    "suggestedTables": [7, 8, 9],
    "suggestions": [
      {
        "tables": [7, 8],
        "totalCapacity": 6,
        "description": "Similar location, window view"
      },
      {
        "tables": [9, 10],
        "totalCapacity": 6,
        "description": "Quieter area"
      }
    ]
  }
}
```

### Usage Frontend
```jsx
// Le frontend affichera un InlineAlert avec suggestions cliquables
<InlineAlert type="warning">
  <p>Tables 5 and 6 are no longer available</p>
  <div className="mt-2">
    <p className="text-sm">Alternative suggestions:</p>
    <button onClick={() => selectTables([7, 8])}>
      Tables 7 & 8 (6 seats, window view)
    </button>
  </div>
</InlineAlert>
```

---

## 🔒 Cas 2 : Erreur de permissions (403)

### Scénario
L'utilisateur essaie d'accéder à une ressource admin sans permissions.

### Réponse Backend
```json
{
  "success": false,
  "error": "You do not have the necessary permissions",
  "code": "FORBIDDEN",
  "details": {
    "requiredRole": "admin",
    "currentRole": "user",
    "resource": "/api/orders/admin",
    "message": "This feature is only available to restaurant administrators"
  }
}
```

### Usage Frontend
```jsx
// Banner persistant avec explication claire
<InlineAlert type="error" persistent>
  <p className="font-semibold">Access Denied</p>
  <p className="text-sm">
    This feature requires <strong>admin</strong> permissions.
    Contact your administrator for access.
  </p>
</InlineAlert>
```

---

## 🌐 Cas 3 : Erreur réseau / Serveur indisponible (500)

### Scénario
Le serveur est temporairement indisponible ou en maintenance.

### Réponse Backend
```json
{
  "success": false,
  "error": "Server temporarily unavailable",
  "code": "SERVER_ERROR",
  "details": {
    "retryAfter": 30,
    "message": "Our servers are experiencing high traffic. Please try again in a moment.",
    "statusPage": "https://status.restoh.com"
  }
}
```

### Usage Frontend
```jsx
// Banner avec action "Retry" et countdown
<InlineAlert type="error" persistent>
  <p>Server temporarily unavailable</p>
  <p className="text-sm">Retry in {countdown}s...</p>
  <button onClick={retry}>Retry Now</button>
</InlineAlert>
```

---

## 🔄 Cas 4 : Conflit - Email déjà utilisé (409)

### Endpoint
`POST /api/auth/register`

### Scénario
L'email est déjà enregistré.

### Réponse Backend
```json
{
  "success": false,
  "error": "This email is already registered",
  "code": "EMAIL_ALREADY_EXISTS",
  "details": {
    "field": "email",
    "value": "user@example.com",
    "suggestion": "Try logging in instead, or use password reset if you forgot your password",
    "actions": {
      "login": "/login",
      "resetPassword": "/reset-password"
    }
  }
}
```

### Usage Frontend
```jsx
// Erreur inline dans le formulaire avec actions
<div className="text-red-600 text-sm mt-1">
  This email is already registered.
  <div className="mt-2 space-x-2">
    <Link to="/login" className="underline">Login instead?</Link>
    <Link to="/reset-password" className="underline">Forgot password?</Link>
  </div>
</div>
```

---

## ⏰ Cas 5 : Réservation trop proche de l'heure actuelle

### Endpoint
`POST /api/reservations`

### Scénario
L'utilisateur essaie de réserver dans moins de 2 heures.

### Réponse Backend
```json
{
  "success": false,
  "error": "Reservations must be made at least 2 hours in advance",
  "code": "RESERVATION_TOO_LATE",
  "details": {
    "requestedTime": "2024-01-25T19:30:00Z",
    "minimumAdvance": 7200,
    "earliestAvailable": "2024-01-25T21:30:00Z",
    "message": "For last-minute reservations, please call us directly at +33 1 23 45 67 89"
  }
}
```

### Usage Frontend
```jsx
<InlineAlert type="warning">
  <p>Reservations require at least 2 hours notice</p>
  <p className="text-sm mt-1">
    For urgent bookings, call us:
    <a href="tel:+33123456789" className="font-semibold ml-1">
      +33 1 23 45 67 89
    </a>
  </p>
</InlineAlert>
```

---

## 🚫 Cas 6 : Annulation impossible (réservation < 2h)

### Endpoint
`PATCH /api/reservations/:id/status`

### Scénario
L'utilisateur essaie d'annuler une réservation qui commence dans moins de 2h.

### Réponse Backend
```json
{
  "success": false,
  "error": "Cannot cancel reservation less than 2 hours before scheduled time",
  "code": "CANCELLATION_TOO_LATE",
  "details": {
    "reservationTime": "2024-01-25T19:30:00Z",
    "currentTime": "2024-01-25T18:45:00Z",
    "hoursRemaining": 0.75,
    "policy": "Free cancellation is available up to 2 hours before your reservation",
    "contactPhone": "+33 1 23 45 67 89",
    "message": "Please contact us directly to discuss your reservation"
  }
}
```

### Usage Frontend
```jsx
<InlineAlert type="error" persistent>
  <p className="font-semibold">Cannot cancel at this time</p>
  <p className="text-sm">Your reservation is in 45 minutes</p>
  <p className="text-sm mt-2">
    Please call us to discuss:
    <a href="tel:+33123456789" className="font-semibold">
      +33 1 23 45 67 89
    </a>
  </p>
</InlineAlert>
```

---

## 📦 Cas 7 : Validation complexe (capacité dépassée)

### Endpoint
`POST /api/reservations`

### Scénario
Les tables sélectionnées ne peuvent pas accueillir le nombre de personnes.

### Réponse Backend
```json
{
  "success": false,
  "error": "Selected tables exceed maximum capacity",
  "code": "CAPACITY_EXCEEDED",
  "details": {
    "requestedGuests": 4,
    "selectedTables": [1, 2, 3],
    "totalCapacity": 6,
    "maxAllowed": 5,
    "rule": "Total capacity must not exceed party size + 1",
    "suggestedCombinations": [
      {
        "tables": [5, 6],
        "capacity": 4,
        "fits": true
      },
      {
        "tables": [13],
        "capacity": 4,
        "fits": true
      }
    ]
  }
}
```

---

## ✅ Règles d'Implémentation Backend

### Quand remplir `details` ?

```javascript
// ❌ NE PAS remplir pour :
- Erreurs de validation simples (champ requis, format email invalide)
- Erreurs 404 basiques (ressource non trouvée)
- Succès (success: true)

// ✅ REMPLIR pour :
- Erreurs où des alternatives/suggestions existent
- Erreurs nécessitant une action spécifique de l'utilisateur
- Erreurs avec contexte métier important (permissions, timing, disponibilité)
- Erreurs où l'utilisateur peut corriger avec plus d'infos
```

### Structure recommandée de `details`

```typescript
interface ErrorDetails {
  // Contexte de l'erreur
  field?: string              // Champ concerné (pour erreurs formulaire)
  value?: any                 // Valeur problématique
  reason?: string             // Raison technique détaillée

  // Données métier
  requiredRole?: string       // Rôle requis (403)
  currentRole?: string        // Rôle actuel
  unavailableTables?: number[] // Tables indisponibles

  // Suggestions / Actions
  message?: string            // Message explicatif supplémentaire
  suggestion?: string         // Suggestion textuelle
  suggestedTables?: number[]  // Tables alternatives
  suggestions?: Array<{       // Suggestions structurées
    tables: number[]
    capacity: number
    description?: string
  }>
  actions?: {                 // Actions disponibles
    [key: string]: string     // label: url/endpoint
  }

  // Métadonnées
  retryAfter?: number         // Secondes avant retry (429, 503)
  contactPhone?: string       // Téléphone support
  statusPage?: string         // URL page de status
}
```

---

## 🔍 Exemples d'Implémentation Backend

### Express.js Example

```javascript
// middleware/errorHandler.js
const createDetailedError = (type, data) => {
  const errorDetails = {
    TABLES_UNAVAILABLE: {
      error: `Tables ${data.tables.join(', ')} are no longer available`,
      code: 'TABLES_UNAVAILABLE',
      details: {
        unavailableTables: data.tables,
        reason: data.reason,
        suggestedTables: data.suggestions
      }
    },
    // ... autres types
  }

  return errorDetails[type] || {
    error: 'An error occurred',
    code: 'UNKNOWN_ERROR',
    details: {}
  }
}

// Dans le controller
app.post('/api/reservations', async (req, res) => {
  try {
    const { tables, guests, date, time } = req.body

    // Vérifier disponibilité
    const unavailable = await checkTableAvailability(tables, date, time)

    if (unavailable.length > 0) {
      const suggestions = await findAlternativeTables(guests, date, time)

      return res.status(409).json({
        success: false,
        ...createDetailedError('TABLES_UNAVAILABLE', {
          tables: unavailable,
          reason: 'Already reserved',
          suggestions
        })
      })
    }

    // ... créer réservation
  } catch (error) {
    // Erreur générique
    res.status(500).json({
      success: false,
      error: 'Server error',
      code: 'SERVER_ERROR',
      details: {
        retryAfter: 30,
        message: 'Please try again in a moment'
      }
    })
  }
})
```

---

## 📋 Checklist pour le Backend

- [ ] Endpoint `/api/reservations` : Ajouter `suggestedTables` quand tables indisponibles
- [ ] Endpoint `/api/reservations` : Ajouter détails quand capacité dépassée
- [ ] Endpoint `/api/reservations` : Ajouter infos contact quand annulation impossible
- [ ] Erreurs 403 : Ajouter `requiredRole` et `currentRole`
- [ ] Erreurs 409 (email exists) : Ajouter `actions` avec liens
- [ ] Erreurs 500 : Ajouter `retryAfter` et message approprié
- [ ] Erreurs réseau : Gérer timeout et fournir guidance

---

## 🎯 Priorités d'Implémentation

### 🔴 Priorité HAUTE (UX critique)
1. Tables indisponibles → Suggestions d'alternatives
2. Capacité dépassée → Suggestions de tables
3. Erreur serveur → Bouton retry avec countdown

### 🟠 Priorité MOYENNE (Nice to have)
4. Erreur permissions → Explication claire du rôle requis
5. Email déjà utilisé → Actions (login/reset password)
6. Annulation tardive → Infos de contact

### 🟡 Priorité BASSE (Amélioration progressive)
7. Validation complexe avec suggestions détaillées
8. Messages personnalisés selon le contexte
