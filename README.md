# RestOh Frontend

Application React de gestion de restaurant moderne avec système de commandes en ligne, réservations et panel d'administration.

## Technologies

- **React 18** - Bibliothèque UI
- **Vite** - Build tool ultra-rapide
- **Zustand** - Gestion d'état avec persistance
- **React Router** - Navigation
- **Tailwind CSS** - Styling utility-first
- **Axios** - Client HTTP (cookies HTTP-only)
- **React Hot Toast** - Notifications
- **Lucide React** - Icônes modernes
- **Vitest** - Tests unitaires et d'intégration
- **React Testing Library** - Tests de composants

## 📋 Prérequis

- **Node.js** 22.x ou supérieur
- **npm** 9.x ou supérieur
- Backend RestOh en cours d'exécution (voir repository backend)

## 🛠️ Installation

1. **Cloner le repository**
```bash
git clone https://github.com/ChristopheBouriel/restoh-frontend.git
cd restoh-frontend
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer les variables d'environnement**
```bash
cp .env.example .env
```

Éditer `.env` et configurer l'URL de votre backend :
```env
VITE_API_URL=http://localhost:3000/api
```

4. **Lancer en mode développement**
```bash
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

## Scripts disponibles

```bash
npm run dev          # Lancer le serveur de développement
npm run build        # Build de production
npm run preview      # Preview du build de production
npm run lint         # Linter le code avec ESLint
npm test             # Lancer les tests (1200+ tests)
npm run test:ui      # Interface Vitest UI
npm run test:watch   # Mode watch
npm run test:coverage # Couverture de code
```

## Structure du projet

```
restoh-frontend/
├── src/
│   ├── api/              # Couche API (axios + endpoints)
│   │   ├── apiClient.js
│   │   ├── authApi.js
│   │   ├── ordersApi.js
│   │   ├── reservationsApi.js
│   │   ├── menuApi.js
│   │   ├── contactsApi.js
│   │   ├── emailApi.js
│   │   ├── reviewsApi.js
│   │   └── restaurantReviewsApi.js
│   ├── services/         # Couche Service (logique métier)
│   │   ├── menu/         # MenuService
│   │   ├── reservations/ # ReservationService
│   │   ├── orders/       # OrderService
│   │   └── auth/         # AuthService
│   ├── components/       # Composants réutilisables
│   ├── constants/        # Constantes et enums
│   ├── contexts/         # React Contexts
│   ├── hooks/            # Custom hooks
│   ├── pages/            # Pages/Routes
│   ├── store/            # Zustand stores
│   ├── utils/            # Fonctions utilitaires
│   ├── __tests__/        # Tests unitaires et d'intégration
│   ├── App.jsx
│   └── main.jsx
├── public/               # Ressources statiques
├── .env.example          # Exemple de configuration
├── API_ENDPOINTS.md      # Documentation des endpoints backend
└── CLAUDE.md            # Instructions pour Claude Code
```

## 🔑 Fonctionnalités principales

### Pour les clients
- ✅ Consultation du menu par catégories
- ✅ Ajout au panier avec persistance
- ✅ Passage de commande (paiement carte/espèces)
- ✅ Suivi des commandes en temps réel
- ✅ Réservation de tables
- ✅ Gestion du profil utilisateur
- ✅ Suppression de compte (RGPD)

### Pour les administrateurs
- ✅ Dashboard avec statistiques
- ✅ Gestion complète du menu
- ✅ Gestion des commandes (statuts, paiements)
- ✅ Gestion des réservations (assignation tables)
- ✅ Messagerie contact
- ✅ Gestion des utilisateurs

## Authentification

L'application utilise des cookies HTTP-only pour l'authentification :

- **Session** : Gérée par cookies HTTP-only côté backend (sécurisé)
- **État local** : `user` et `isAuthenticated` persistés dans localStorage
- **Auto-logout** : Redirection vers `/login` si session expirée
- **Pages publiques** : Login, register, reset-password ne déclenchent pas de redirection

## 🎨 Personnalisation

### Tailwind CSS
Modifier `tailwind.config.js` pour personnaliser les couleurs, fonts, etc.

### Constantes
Éditer `src/constants/index.js` pour modifier les routes, statuts, etc.

## Tests

Le projet dispose de plus de 1200 tests couvrant :
- **Stores** : authStore, ordersStore, reservationsStore, menuStore, cartStore, contactsStore
- **Services** : MenuService, ReservationService, OrderService, AuthService
- **Composants** : Pages, formulaires, navigation

```bash
npm test              # Tous les tests
npm run test:ui       # Interface Vitest
npm run test:coverage # Couverture de code
npm run test:watch    # Mode watch
```

## 📡 Intégration Backend

Ce frontend est conçu pour fonctionner avec le backend RestOh.

**Documentation complète des endpoints** : voir `API_ENDPOINTS.md`

**URL du backend** : Configurable via `VITE_API_URL` dans `.env`

### Exemple de connexion au backend local
```env
VITE_API_URL=http://localhost:3000/api
```

### Exemple de connexion au backend de production
```env
VITE_API_URL=https://api.restoh.com/api
```

## 🚢 Déploiement

### Build de production
```bash
npm run build
```

Le dossier `dist/` contiendra les fichiers optimisés.

### Déploiement sur Vercel/Netlify
1. Connecter votre repository GitHub
2. Configurer les variables d'environnement :
   - `VITE_API_URL` = URL de votre backend de production
3. Build command : `npm run build`
4. Output directory : `dist`

## 🐛 Debugging

### Mode Debug
Activer les logs détaillés dans `.env` :
```env
VITE_DEBUG=true
```

### Console du navigateur
Les erreurs API sont loggées dans la console avec :
- Code d'erreur HTTP
- Message d'erreur
- Détails supplémentaires

## 📝 Conventions de code

- **Composants** : PascalCase (`UserProfile.jsx`)
- **Hooks** : camelCase avec préfixe `use` (`useAuth.js`)
- **Stores** : camelCase avec suffixe `Store` (`authStore.js`)
- **API** : camelCase avec suffixe `Api` (`authApi.js`)
- **Constants** : UPPER_SNAKE_CASE

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit (`git commit -m 'feat: Add amazing feature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT.

## 🆘 Support

Pour toute question ou problème :
- Ouvrir une issue sur GitHub
- Consulter la documentation `API_ENDPOINTS.md`
- Voir les instructions dans `CLAUDE.md` pour le développement

## Roadmap

- [x] Tests unitaires complets (1200+ tests)
- [ ] Tests E2E avec Playwright/Cypress
- [ ] PWA (Progressive Web App)
- [ ] Internationalisation (i18n)
- [ ] Mode sombre
- [ ] Notifications push
- [ ] Export PDF des factures
- [ ] Analytics avancées

---

**Développé avec ❤️ pour RestOh**
