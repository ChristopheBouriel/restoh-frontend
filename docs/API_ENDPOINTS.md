# API Endpoints Documentation - RestOh Backend

Ce document liste tous les endpoints API nécessaires pour le backend RestOh.

## Base URL
```
http://localhost:3000/api
```

---

## 🔐 Authentication (`/api/auth`)

### POST `/api/auth/register`
**Description:** Créer un nouveau compte utilisateur
**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "phone": "0612345678"
}
```
**Response (201):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "phone": "0612345678"
  },
  "token": "jwt-token-here"
}
```

### POST `/api/auth/login`
**Description:** Connexion utilisateur
**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  },
  "token": "jwt-token-here"
}
```

### POST `/api/auth/logout`
**Description:** Déconnexion (optionnel si JWT sans refresh tokens)
**Headers:** `Authorization: Bearer {token}`
**Response (200):**
```json
{
  "success": true,
  "message": "Déconnexion réussie"
}
```

### POST `/api/auth/refresh`
**Description:** Rafraîchir le token JWT
**Body:**
```json
{
  "refreshToken": "refresh-token-here"
}
```
**Response (200):**
```json
{
  "success": true,
  "token": "new-jwt-token",
  "refreshToken": "new-refresh-token"
}
```

### GET `/api/auth/me`
**Description:** Récupérer les infos de l'utilisateur connecté
**Headers:** `Authorization: Bearer {token}`
**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "phone": "0612345678"
  }
}
```

### PUT `/api/auth/profile`
**Description:** Mettre à jour le profil utilisateur
**Headers:** `Authorization: Bearer {token}`
**Body:**
```json
{
  "name": "John Updated",
  "phone": "0698765432"
}
```
**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Updated",
    "phone": "0698765432"
  }
}
```

### PUT `/api/auth/change-password`
**Description:** Changer le mot de passe
**Headers:** `Authorization: Bearer {token}`
**Body:**
```json
{
  "currentPassword": "oldpass123",
  "newPassword": "newpass456"
}
```
**Response (200):**
```json
{
  "success": true,
  "message": "Mot de passe modifié avec succès"
}
```

### DELETE `/api/auth/account`
**Description:** Supprimer le compte (RGPD)
**Headers:** `Authorization: Bearer {token}`
**Body:**
```json
{
  "password": "password123"
}
```
**Response (200):**
```json
{
  "success": true,
  "message": "Compte supprimé avec succès"
}
```

---

## 🍕 Menu (`/api/menu`)

### GET `/api/menu/items`
**Description:** Liste tous les items du menu
**Query params:** `?category=pizza` (optionnel)
**Response (200):**
```json
{
  "success": true,
  "items": [
    {
      "id": "uuid",
      "name": "Pizza Margherita",
      "description": "Tomate, mozzarella, basilic",
      "price": 15.90,
      "category": "pizza",
      "image": "pizza-margherita.jpg",
      "available": true
    }
  ]
}
```

### GET `/api/menu/categories`
**Description:** Liste toutes les catégories
**Response (200):**
```json
{
  "success": true,
  "categories": [
    { "id": "pizza", "name": "Pizzas", "icon": "pizza" },
    { "id": "pasta", "name": "Pâtes", "icon": "utensils" }
  ]
}
```

### POST `/api/menu/items` [ADMIN]
**Description:** Créer un nouvel item
**Headers:** `Authorization: Bearer {token}`
**Body:**
```json
{
  "name": "Pizza Pepperoni",
  "description": "Tomate, mozzarella, pepperoni",
  "price": 17.50,
  "category": "pizza",
  "image": "pizza-pepperoni.jpg"
}
```
**Response (201):**
```json
{
  "success": true,
  "item": { "id": "uuid", ... }
}
```

### PUT `/api/menu/items/:id` [ADMIN]
**Description:** Modifier un item
**Headers:** `Authorization: Bearer {token}`
**Response (200):**
```json
{
  "success": true,
  "item": { "id": "uuid", ... }
}
```

### DELETE `/api/menu/items/:id` [ADMIN]
**Description:** Supprimer un item
**Headers:** `Authorization: Bearer {token}`
**Response (200):**
```json
{
  "success": true,
  "message": "Item supprimé"
}
```

---

## 🛒 Orders (`/api/orders`)

### GET `/api/orders`
**Description:** Liste des commandes de l'utilisateur connecté
**Headers:** `Authorization: Bearer {token}`
**Response (200):**
```json
{
  "success": true,
  "orders": [
    {
      "id": "uuid",
      "userId": "uuid",
      "items": [
        {
          "id": "item-uuid",
          "name": "Pizza Margherita",
          "price": 15.90,
          "quantity": 2,
          "image": "pizza-margherita.jpg"
        }
      ],
      "totalAmount": 31.80,
      "status": "pending",
      "paymentMethod": "card",
      "isPaid": true,
      "deliveryAddress": "123 Rue Example",
      "phone": "0612345678",
      "notes": "Sonnez 2 fois",
      "createdAt": "2024-01-20T14:30:00Z",
      "updatedAt": "2024-01-20T14:30:00Z"
    }
  ]
}
```

### GET `/api/orders/admin` [ADMIN]
**Description:** Liste TOUTES les commandes (admin)
**Headers:** `Authorization: Bearer {token}`
**Query params:**
- `?status=pending` (optionnel)
- `?userId=uuid` (optionnel)
- `?date=2024-01-20` (optionnel)

**Response (200):**
```json
{
  "success": true,
  "orders": [...]
}
```

### GET `/api/orders/:id`
**Description:** Détails d'une commande
**Headers:** `Authorization: Bearer {token}`
**Response (200):**
```json
{
  "success": true,
  "order": { ... }
}
```

### POST `/api/orders`
**Description:** Créer une nouvelle commande
**Headers:** `Authorization: Bearer {token}`
**Body:**
```json
{
  "items": [
    { "id": "item-uuid", "quantity": 2 }
  ],
  "deliveryAddress": "123 Rue Example",
  "phone": "0612345678",
  "paymentMethod": "card",
  "notes": "Sonnez 2 fois"
}
```
**Response (201):**
```json
{
  "success": true,
  "orderId": "uuid",
  "order": { ... }
}
```

### PATCH `/api/orders/:id/status` [ADMIN]
**Description:** Changer le statut d'une commande
**Headers:** `Authorization: Bearer {token}`
**Body:**
```json
{
  "status": "confirmed"
}
```
**Response (200):**
```json
{
  "success": true,
  "order": { ... }
}
```
**Note:** Si status='delivered' ET paymentMethod='cash' ET isPaid=false → Automatiquement passer isPaid à true

---

## 📅 Reservations (`/api/reservations`)

### GET `/api/reservations`
**Description:** Liste des réservations de l'utilisateur connecté
**Headers:** `Authorization: Bearer {token}`
**Response (200):**
```json
{
  "success": true,
  "reservations": [
    {
      "id": "uuid",
      "userId": "uuid",
      "userName": "John Doe",
      "userEmail": "john@example.com",
      "phone": "0612345678",
      "date": "2024-01-25",
      "time": "19:30",
      "guests": 4,
      "status": "confirmed",
      "tableNumber": 12,
      "specialRequests": "Table près de la fenêtre",
      "createdAt": "2024-01-20T14:30:00Z",
      "updatedAt": "2024-01-20T14:30:00Z"
    }
  ]
}
```

### GET `/api/reservations/admin` [ADMIN]
**Description:** Liste TOUTES les réservations (admin)
**Headers:** `Authorization: Bearer {token}`
**Query params:**
- `?status=pending` (optionnel)
- `?date=2024-01-25` (optionnel)

**Response (200):**
```json
{
  "success": true,
  "reservations": [...]
}
```

### GET `/api/reservations/:id`
**Description:** Détails d'une réservation
**Headers:** `Authorization: Bearer {token}`
**Response (200):**
```json
{
  "success": true,
  "reservation": { ... }
}
```

### POST `/api/reservations`
**Description:** Créer une nouvelle réservation
**Headers:** `Authorization: Bearer {token}`
**Body:**
```json
{
  "date": "2024-01-25",
  "time": "19:30",
  "guests": 4,
  "phone": "0612345678",
  "specialRequests": "Table près de la fenêtre"
}
```
**Response (201):**
```json
{
  "success": true,
  "reservationId": "uuid",
  "reservation": { ... }
}
```

### PATCH `/api/reservations/:id/status` [ADMIN]
**Description:** Changer le statut d'une réservation
**Headers:** `Authorization: Bearer {token}`
**Body:**
```json
{
  "status": "confirmed"
}
```
**Response (200):**
```json
{
  "success": true,
  "reservation": { ... }
}
```

### PATCH `/api/reservations/:id/table` [ADMIN]
**Description:** Assigner une table à une réservation
**Headers:** `Authorization: Bearer {token}`
**Body:**
```json
{
  "tableNumber": 12
}
```
**Response (200):**
```json
{
  "success": true,
  "reservation": { ... }
}
```
**Note:** Si status='pending' lors de l'assignation → automatiquement passer à 'confirmed'

---

## 📧 Contacts (`/api/contacts`)

### POST `/api/contacts`
**Description:** Envoyer un message de contact
**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Question réservation",
  "message": "Bonjour, je voudrais savoir..."
}
```
**Response (201):**
```json
{
  "success": true,
  "contactId": "uuid",
  "message": "Message envoyé avec succès"
}
```

### GET `/api/contacts` [ADMIN]
**Description:** Liste tous les messages (admin)
**Headers:** `Authorization: Bearer {token}`
**Query params:** `?status=new` (optionnel)
**Response (200):**
```json
{
  "success": true,
  "contacts": [
    {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "subject": "Question réservation",
      "message": "Bonjour...",
      "status": "new",
      "reply": null,
      "createdAt": "2024-01-20T14:30:00Z",
      "updatedAt": "2024-01-20T14:30:00Z"
    }
  ]
}
```

### PATCH `/api/contacts/:id/status` [ADMIN]
**Description:** Changer le statut d'un message
**Headers:** `Authorization: Bearer {token}`
**Body:**
```json
{
  "status": "read"
}
```
**Response (200):**
```json
{
  "success": true,
  "contact": { ... }
}
```

### POST `/api/contacts/:id/reply` [ADMIN]
**Description:** Répondre à un message
**Headers:** `Authorization: Bearer {token}`
**Body:**
```json
{
  "reply": "Merci pour votre message..."
}
```
**Response (200):**
```json
{
  "success": true,
  "contact": { ... }
}
```

---

## 📊 Admin Stats (`/api/admin`)

### GET `/api/admin/stats` [ADMIN]
**Description:** Statistiques générales (dashboard)
**Headers:** `Authorization: Bearer {token}`
**Response (200):**
```json
{
  "success": true,
  "stats": {
    "orders": {
      "total": 150,
      "pending": 5,
      "confirmed": 10,
      "preparing": 3,
      "ready": 2,
      "delivered": 120,
      "cancelled": 10,
      "totalRevenue": 5430.50
    },
    "reservations": {
      "total": 80,
      "pending": 5,
      "confirmed": 15,
      "seated": 2,
      "completed": 50,
      "cancelled": 8,
      "todayTotal": 12,
      "todayConfirmed": 10
    },
    "contacts": {
      "total": 45,
      "new": 5,
      "read": 20,
      "replied": 20
    }
  }
}
```

---

## 🔒 Gestion des Erreurs

### Format standard des erreurs
```json
{
  "success": false,
  "error": "Message d'erreur lisible",
  "code": "ERROR_CODE",
  "details": {}
}
```

### Codes HTTP standards
- `200` - OK
- `201` - Created
- `400` - Bad Request (validation failed)
- `401` - Unauthorized (non authentifié)
- `403` - Forbidden (pas les permissions)
- `404` - Not Found
- `409` - Conflict (ex: email déjà utilisé)
- `500` - Internal Server Error

---

## 🔐 Authentification JWT

### Header Format
```
Authorization: Bearer <jwt-token>
```

### Token Payload Example
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "role": "user",
  "iat": 1234567890,
  "exp": 1234571490
}
```

### Refresh Token Strategy (Recommandé)
- Access Token: durée 15 minutes
- Refresh Token: durée 7 jours
- Stocker le refresh token en httpOnly cookie (plus sécurisé)

---

## 📝 Notes d'Implémentation

### Logique Métier Critique
1. **Paiement automatique cash** : Quand status passe à 'delivered' ET paymentMethod='cash' → isPaid=true
2. **Anonymisation RGPD** : DELETE `/api/auth/account` doit anonymiser les données dans orders/reservations, pas les supprimer
3. **Validation dates réservations** : Empêcher les réservations dans le passé
4. **Statuts valides** :
   - Orders: pending, confirmed, preparing, ready, delivered, cancelled
   - Reservations: pending, confirmed, seated, completed, cancelled
   - Contacts: new, read, replied

### Sécurité
- Toutes les routes ADMIN doivent vérifier `role === 'admin'` dans le middleware
- Hasher les mots de passe avec bcrypt (minimum 10 rounds)
- Valider tous les inputs (email, phone, dates, etc.)
- Rate limiting sur `/auth/login` et `/auth/register`
- CORS configuré correctement pour le frontend

### Performance
- Pagination sur les listes longues (orders, reservations)
- Index sur userId, status, date dans la DB
- Cache pour le menu (change rarement)
