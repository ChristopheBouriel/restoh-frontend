# Configuration CORS pour le Backend

## Problème

Si vous voyez des erreurs CORS dans la console du navigateur comme :
```
Access to XMLHttpRequest at 'http://localhost:3001/api/...' from origin 'http://localhost:5173' has been blocked by CORS policy
```

C'est que votre backend n'est pas configuré pour accepter les requêtes du frontend.

## Solution - Backend Express

Dans votre backend, installez et configurez CORS :

### 1. Installation

```bash
npm install cors
```

### 2. Configuration

Dans votre fichier principal du backend (ex: `server.js` ou `app.js`) :

```javascript
const express = require('express')
const cors = require('cors')

const app = express()

// Configuration CORS - À METTRE AVANT LES ROUTES
app.use(cors({
  origin: 'http://localhost:5173', // URL du frontend Vite
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// Middleware pour parser le JSON
app.use(express.json())

// Vos routes ensuite
app.use('/api', routes)

// ...
```

### 3. Configuration pour la Production

Pour la production, utilisez une variable d'environnement :

```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
```

Dans votre `.env` backend :
```
FRONTEND_URL=https://votre-domaine-frontend.com
```

### 4. Configuration Multi-Origines (Développement + Production)

```javascript
const allowedOrigins = [
  'http://localhost:5173',        // Frontend dev
  'https://votre-domaine.com',    // Frontend production
]

app.use(cors({
  origin: (origin, callback) => {
    // Autoriser les requêtes sans origin (comme Postman)
    if (!origin) return callback(null, true)

    if (allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
```

## Vérification

Une fois configuré, redémarrez votre backend et rechargez le frontend. Les erreurs CORS devraient disparaître.

## Ordre d'Exécution Important

**TOUJOURS mettre `app.use(cors(...))` AVANT vos routes !**

✅ Bon ordre :
```javascript
app.use(cors(...))
app.use(express.json())
app.use('/api', routes)
```

❌ Mauvais ordre :
```javascript
app.use('/api', routes)
app.use(cors(...))  // Trop tard !
```

## Troubleshooting

### Les erreurs CORS persistent ?

1. **Vérifiez que le backend est redémarré** après la configuration CORS
2. **Vérifiez l'ordre des middlewares** (CORS doit être avant les routes)
3. **Vérifiez l'URL dans le frontend** (.env : `VITE_API_URL`)
4. **Vérifiez que le backend écoute sur le bon port** (3001)
5. **Videz le cache du navigateur** (Cmd+Shift+R / Ctrl+Shift+R)

### Erreur "Cannot find module 'cors'"

```bash
cd /chemin/vers/backend
npm install cors
```

### Erreur 401 au lieu de CORS

Si vous voyez 401 au lieu d'erreurs CORS, c'est bon signe ! CORS est configuré, mais vous avez un problème d'authentification. Vérifiez votre token JWT.
