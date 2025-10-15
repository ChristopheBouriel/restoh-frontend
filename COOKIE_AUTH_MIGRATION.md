# Migration vers l'authentification par cookies HTTP-only

## Contexte

Le backend a été migré pour utiliser l'authentification par **cookies HTTP-only** au lieu de tokens JWT dans les headers `Authorization`. Cette approche est plus sécurisée car :

1. Les cookies HTTP-only ne peuvent pas être lus par JavaScript (protection XSS)
2. Les cookies Secure ne sont envoyés que sur HTTPS en production
3. Les cookies SameSite=Strict protègent contre les attaques CSRF

## Changements effectués dans le frontend

### 1. Configuration axios (`src/api/apiClient.js`)

**Avant :**
```javascript
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Intercepteur qui ajoutait le token JWT dans les headers
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

**Après :**
```javascript
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // ✅ CRUCIAL : Envoie automatiquement les cookies
})

// Intercepteur simplifié - plus besoin d'ajouter manuellement le token
apiClient.interceptors.request.use((config) => {
  // L'authentification est gérée automatiquement par les cookies
  return config
})
```

**Point clé :** `withCredentials: true` indique à axios d'envoyer les cookies avec chaque requête cross-origin.

### 2. Store d'authentification (`src/store/authStore.js`)

**Changements :**

1. **Suppression de l'état `token`** :
```javascript
// AVANT
user: null,
token: null,
isAuthenticated: false,

// APRÈS
user: null,
// token: null, // SUPPRIMÉ - géré par cookie HTTP-only
isAuthenticated: false,
```

2. **Mise à jour des actions `login` et `register`** :
```javascript
// AVANT
if (result.success) {
  set({
    user: result.user,
    token: result.token, // Récupération et stockage du token
    isAuthenticated: true,
    ...
  })
}

// APRÈS
if (result.success) {
  set({
    user: result.user,
    // token: result.token, // SUPPRIMÉ - cookie défini automatiquement par le serveur
    isAuthenticated: true,
    ...
  })
}
```

3. **Mise à jour du logout** :
```javascript
// AVANT
set({
  user: null,
  token: null, // Suppression du token local
  isAuthenticated: false,
})

// APRÈS
set({
  user: null,
  // token: null, // SUPPRIMÉ - cookie supprimé par le serveur
  isAuthenticated: false,
})
```

4. **Mise à jour de la persistance** :
```javascript
// AVANT
partialize: (state) => ({
  user: state.user,
  token: state.token, // Token persisté dans localStorage
  isAuthenticated: state.isAuthenticated
})

// APRÈS
partialize: (state) => ({
  user: state.user,
  // token: state.token, // SUPPRIMÉ - ne plus persister le token
  isAuthenticated: state.isAuthenticated
})
```

## Configuration requise côté backend

Pour que cette migration fonctionne, le backend doit :

### 1. Configuration CORS

```javascript
app.use(cors({
  origin: 'http://localhost:5173', // URL du frontend
  credentials: true, // ✅ CRUCIAL : Autoriser l'envoi de cookies
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
```

### 2. Configuration des cookies dans les routes d'authentification

**Login/Register :**
```javascript
res.cookie('token', jwtToken, {
  httpOnly: true,     // Protection XSS - pas accessible via JavaScript
  secure: process.env.NODE_ENV === 'production', // HTTPS uniquement en prod
  sameSite: 'strict', // Protection CSRF
  maxAge: 24 * 60 * 60 * 1000 // 24 heures
})

res.json({
  success: true,
  user: { id, name, email, role },
  // token: jwtToken, // NE PLUS ENVOYER le token dans le JSON
})
```

**Logout :**
```javascript
res.clearCookie('token', {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict'
})

res.json({ success: true, message: 'Logged out successfully' })
```

### 3. Middleware d'authentification

```javascript
const authenticate = (req, res, next) => {
  // Lire le token depuis le cookie au lieu du header Authorization
  const token = req.cookies.token

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}
```

## Avantages de cette approche

### Sécurité

1. **Protection XSS** : Les cookies HTTP-only ne peuvent pas être lus par JavaScript malveillant
2. **Protection CSRF** : Les cookies SameSite=Strict empêchent l'envoi de cookies depuis d'autres domaines
3. **HTTPS uniquement en production** : Le flag `secure` garantit que les cookies ne sont envoyés que sur HTTPS

### Simplicité

1. Le frontend n'a plus besoin de gérer manuellement les tokens
2. Pas de risque de fuite de token dans le localStorage
3. Les cookies sont automatiquement envoyés avec chaque requête

## Migration des données existantes

Si des utilisateurs ont déjà des tokens dans leur localStorage :

1. Le frontend continuera de fonctionner (les anciennes données user sont toujours là)
2. Lors de la prochaine connexion, le cookie sera défini
3. L'ancien token dans localStorage sera ignoré

**Nettoyage optionnel :**
```javascript
// Dans App.jsx au chargement
useEffect(() => {
  // Nettoyer les anciens tokens du localStorage
  const authStorage = localStorage.getItem('auth-storage')
  if (authStorage) {
    try {
      const data = JSON.parse(authStorage)
      if (data.state && data.state.token) {
        delete data.state.token
        localStorage.setItem('auth-storage', JSON.stringify(data))
      }
    } catch (error) {
      console.error('Error cleaning old auth data:', error)
    }
  }
}, [])
```

## Tests

Pour vérifier que tout fonctionne :

1. **Login** :
   - Vérifier que le cookie `token` est défini dans les DevTools (Application > Cookies)
   - Vérifier que les requêtes suivantes envoient automatiquement le cookie

2. **Navigation** :
   - Les pages protégées doivent rester accessibles
   - Les données utilisateur doivent se charger correctement

3. **Logout** :
   - Vérifier que le cookie est supprimé
   - Vérifier la redirection vers la page de login

4. **Refresh** :
   - Après un refresh, l'utilisateur doit rester connecté (tant que le cookie est valide)

## Dépannage

### Le cookie n'est pas envoyé

- Vérifier que `withCredentials: true` est dans axios
- Vérifier que `credentials: true` est dans la config CORS du backend
- Vérifier que l'URL du backend dans CORS correspond à l'URL du frontend

### Erreur CORS

- Vérifier que l'`origin` dans la config CORS backend correspond exactement à l'URL du frontend
- Vérifier que la config CORS est appliquée AVANT les routes

### Cookie non défini après login

- Vérifier que le backend utilise bien `res.cookie()` avec les bons paramètres
- Vérifier dans les DevTools Network que le header `Set-Cookie` est présent dans la réponse

## Date de migration

Migration effectuée le : 15 octobre 2025

## Fichiers modifiés

- `src/api/apiClient.js` - Configuration axios avec `withCredentials`
- `src/store/authStore.js` - Suppression de la gestion du token JWT

## Compatibilité

✅ Compatible avec le backend utilisant des cookies HTTP-only
❌ Non compatible avec l'ancien système JWT via headers
