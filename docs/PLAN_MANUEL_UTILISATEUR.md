# Plan d'Action - Manuel Utilisateur RestOh

## Vue d'ensemble du projet

**Objectif** : Créer un manuel utilisateur professionnel et complet pour l'application RestOh, illustré de captures d'écran pertinentes.

**Livrable final** : Un document Markdown structuré avec images, exportable en PDF si nécessaire.

**Durée estimée** : 2-3 sessions de travail

---

## Phase 1 : Préparation (15 min)

### 1.1 Configuration de l'environnement
- [ ] Créer la structure de dossiers pour le manuel
  ```
  docs/
  └── user-manual/
      ├── images/
      │   ├── 01-home/
      │   ├── 02-menu/
      │   ├── 03-cart/
      │   ├── 04-checkout/
      │   ├── 05-reservations/
      │   ├── 06-orders/
      │   ├── 07-reviews/
      │   ├── 08-profile/
      │   ├── 09-auth/
      │   └── 10-admin/
      └── USER_MANUAL.md
  ```

### 1.2 Lancement de l'application
- [ ] Démarrer le serveur de développement (`npm run dev`)
- [ ] Vérifier que le backend est accessible
- [ ] Préparer les comptes de test :
  - Compte client standard
  - Compte administrateur

### 1.3 Configuration du navigateur Playwright
- [ ] Définir la résolution d'écran (1280x800 recommandé)
- [ ] Naviguer vers l'application

---

## ⏸️ PAUSE 1 - Vérification

> **Checkpoint** : L'environnement est-il prêt ?
> - Serveur frontend lancé sur http://localhost:5173
> - Backend accessible
> - Dossiers créés
>
> ✅ Si oui, passer à la Phase 2

---

## Phase 2 : Captures - Parcours Visiteur (30 min)

### 2.1 Page d'accueil (5 captures)
- [ ] **home-hero.png** : Section héro avec titre et boutons CTA
- [ ] **home-popular.png** : Carousel des plats populaires
- [ ] **home-strengths.png** : Section "Pourquoi choisir RestOh"
- [ ] **home-chef-picks.png** : Recommandations du chef
- [ ] **home-reviews.png** : Section avis clients

### 2.2 Navigation (2 captures)
- [ ] **nav-desktop.png** : Barre de navigation desktop
- [ ] **nav-mobile.png** : Menu hamburger mobile (resize à 375px)

### 2.3 Menu (6 captures)
- [ ] **menu-overview.png** : Vue d'ensemble du menu
- [ ] **menu-filters.png** : Barre de filtres (cuisine, catégorie, tri)
- [ ] **menu-card.png** : Détail d'une carte de plat (badges, prix, allergènes)
- [ ] **menu-unavailable.png** : Plat indisponible (grisé)
- [ ] **menu-reviews-modal.png** : Modal des avis d'un plat
- [ ] **menu-add-review.png** : Formulaire d'ajout d'avis

### 2.4 Panier (4 captures)
- [ ] **cart-empty.png** : Panier vide
- [ ] **cart-items.png** : Panier avec articles
- [ ] **cart-quantity.png** : Modification de quantité
- [ ] **cart-sidebar.png** : Sidebar panier ouverte

---

## ⏸️ PAUSE 2 - Sauvegarde intermédiaire

> **Checkpoint** : Captures visiteur terminées ?
> - Vérifier que toutes les images sont bien enregistrées
> - Vérifier la qualité/lisibilité des captures
>
> ✅ Si oui, passer à la Phase 3

---

## Phase 3 : Captures - Parcours Client Authentifié (30 min)

### 3.1 Authentification (5 captures)
- [ ] **auth-login.png** : Page de connexion
- [ ] **auth-register.png** : Page d'inscription
- [ ] **auth-forgot-password.png** : Page mot de passe oublié
- [ ] **auth-verify-email.png** : Page de vérification email
- [ ] **auth-reset-password.png** : Page de réinitialisation

### 3.2 Checkout (5 captures)
- [ ] **checkout-form.png** : Formulaire de commande complet
- [ ] **checkout-delivery.png** : Options de livraison
- [ ] **checkout-pickup.png** : Options de retrait
- [ ] **checkout-payment.png** : Section paiement
- [ ] **checkout-confirmation.png** : Confirmation de commande

### 3.3 Mes Commandes (3 captures)
- [ ] **orders-list.png** : Liste des commandes
- [ ] **orders-detail.png** : Détail d'une commande
- [ ] **orders-status.png** : Différents statuts (badges couleur)

### 3.4 Réservations (6 captures)
- [ ] **reservations-form.png** : Formulaire de réservation
- [ ] **reservations-date-picker.png** : Sélecteur de date
- [ ] **reservations-time-slots.png** : Créneaux horaires (déjeuner/dîner)
- [ ] **reservations-table-map.png** : Plan des tables interactif
- [ ] **reservations-list.png** : Liste "Mes réservations"
- [ ] **reservations-edit.png** : Mode édition d'une réservation

### 3.5 Profil (4 captures)
- [ ] **profile-personal.png** : Onglet informations personnelles
- [ ] **profile-edit.png** : Mode édition du profil
- [ ] **profile-security.png** : Onglet sécurité (changement mot de passe)
- [ ] **profile-delete.png** : Modal de suppression de compte

### 3.6 Avis Restaurant (3 captures)
- [ ] **reviews-page.png** : Page des avis restaurant
- [ ] **reviews-stats.png** : Widget statistiques (note moyenne)
- [ ] **reviews-form.png** : Formulaire d'avis restaurant

### 3.7 Contact (2 captures)
- [ ] **contact-form.png** : Formulaire de contact
- [ ] **contact-messages.png** : Page "Mes messages"

---

## ⏸️ PAUSE 3 - Vérification captures client

> **Checkpoint** : Toutes les captures client sont faites ?
> - Environ 38 captures au total
> - Se déconnecter du compte client
>
> ✅ Si oui, passer à la Phase 4

---

## Phase 4 : Captures - Espace Administrateur (30 min)

### 4.1 Dashboard (3 captures)
- [ ] **admin-dashboard-stats.png** : Cartes statistiques principales
- [ ] **admin-dashboard-monthly.png** : Vue d'ensemble mensuelle
- [ ] **admin-dashboard-recent.png** : Activité récente (commandes/réservations)

### 4.2 Gestion des Commandes (4 captures)
- [ ] **admin-orders-list.png** : Liste des commandes avec filtres
- [ ] **admin-orders-filters.png** : Filtres Today/Status/Type
- [ ] **admin-orders-detail.png** : Modal détail commande
- [ ] **admin-orders-status-change.png** : Changement de statut

### 4.3 Gestion des Réservations (4 captures)
- [ ] **admin-reservations-list.png** : Liste des réservations
- [ ] **admin-reservations-today.png** : Filtre "Aujourd'hui"
- [ ] **admin-reservations-detail.png** : Détail d'une réservation
- [ ] **admin-reservations-status.png** : Workflow de statuts

### 4.4 Gestion du Menu (5 captures)
- [ ] **admin-menu-list.png** : Liste des plats avec filtres
- [ ] **admin-menu-add.png** : Formulaire d'ajout de plat
- [ ] **admin-menu-edit.png** : Édition d'un plat
- [ ] **admin-menu-availability.png** : Toggle disponibilité
- [ ] **admin-menu-categories.png** : Gestion des catégories

### 4.5 Gestion des Utilisateurs (2 captures)
- [ ] **admin-users-list.png** : Liste des utilisateurs
- [ ] **admin-users-detail.png** : Détail utilisateur

### 4.6 Gestion des Contacts (2 captures)
- [ ] **admin-contacts-list.png** : Liste des messages
- [ ] **admin-contacts-reply.png** : Répondre à un message

---

## ⏸️ PAUSE 4 - Vérification captures admin

> **Checkpoint** : Toutes les captures admin sont faites ?
> - Environ 20 captures supplémentaires
> - Total : ~58 captures
>
> ✅ Si oui, passer à la Phase 5

---

## Phase 5 : Rédaction du Manuel (60 min)

### 5.1 Structure du document
```markdown
# Manuel Utilisateur RestOh

## Table des matières
1. Introduction
2. Premiers pas
3. Naviguer dans l'application
4. Commander des plats
5. Réserver une table
6. Gérer son compte
7. Laisser des avis
8. Espace Administrateur
9. FAQ
10. Contact & Support
```

### 5.2 Rédaction par section

#### Section 1 : Introduction (5 min)
- [ ] Présentation de RestOh
- [ ] Public cible
- [ ] Fonctionnalités principales

#### Section 2 : Premiers pas (10 min)
- [ ] Créer un compte
- [ ] Se connecter
- [ ] Vérifier son email
- [ ] Récupérer son mot de passe

#### Section 3 : Navigation (5 min)
- [ ] Barre de navigation
- [ ] Menu mobile
- [ ] Accès rapides

#### Section 4 : Commander des plats (15 min)
- [ ] Parcourir le menu
- [ ] Filtrer et rechercher
- [ ] Comprendre les badges (populaire, suggestion chef)
- [ ] Ajouter au panier
- [ ] Gérer le panier
- [ ] Passer commande (livraison vs retrait)
- [ ] Modes de paiement
- [ ] Suivre sa commande

#### Section 5 : Réserver une table (10 min)
- [ ] Choisir date et heure
- [ ] Sélectionner les tables
- [ ] Comprendre les capacités
- [ ] Modifier une réservation
- [ ] Annuler une réservation
- [ ] Règles métier (délais, politique)

#### Section 6 : Gérer son compte (5 min)
- [ ] Modifier ses informations
- [ ] Changer son mot de passe
- [ ] Préférences de notification
- [ ] Supprimer son compte

#### Section 7 : Laisser des avis (5 min)
- [ ] Avis sur les plats
- [ ] Avis sur le restaurant
- [ ] Modifier/supprimer un avis

#### Section 8 : Espace Administrateur (15 min)
- [ ] Accéder au dashboard
- [ ] Gérer les commandes
- [ ] Gérer les réservations
- [ ] Gérer le menu
- [ ] Gérer les utilisateurs
- [ ] Gérer les contacts

#### Section 9 : FAQ (5 min)
- [ ] Questions fréquentes
- [ ] Résolution de problèmes courants

#### Section 10 : Contact (2 min)
- [ ] Formulaire de contact
- [ ] Informations du restaurant

---

## ⏸️ PAUSE 5 - Relecture

> **Checkpoint** : Première version rédigée ?
> - Relire le document complet
> - Vérifier la cohérence
> - Vérifier les liens vers les images
>
> ✅ Si oui, passer à la Phase 6

---

## Phase 6 : Finalisation (20 min)

### 6.1 Révision
- [ ] Corriger les fautes d'orthographe
- [ ] Vérifier la cohérence du ton
- [ ] Vérifier que toutes les images sont référencées
- [ ] Ajouter des notes et avertissements si nécessaire

### 6.2 Mise en forme
- [ ] Ajouter une table des matières cliquable
- [ ] Numéroter les sections
- [ ] Ajouter des icônes/emojis pour la lisibilité
- [ ] Créer des encadrés pour les conseils/avertissements

### 6.3 Export (optionnel)
- [ ] Générer un PDF si demandé
- [ ] Vérifier le rendu final

---

## Récapitulatif

| Phase | Durée estimée | Contenu |
|-------|---------------|---------|
| Phase 1 | 15 min | Préparation environnement |
| Phase 2 | 30 min | Captures visiteur |
| Phase 3 | 30 min | Captures client authentifié |
| Phase 4 | 30 min | Captures administrateur |
| Phase 5 | 60 min | Rédaction du manuel |
| Phase 6 | 20 min | Finalisation |
| **Total** | **~3h** | Manuel complet |

---

## Notes importantes

### Règles métier à documenter
1. **Commandes**
   - Paiement CB = payé immédiatement
   - Paiement espèces = payé à la livraison
   - Statuts : pending → confirmed → preparing → ready → delivered

2. **Réservations**
   - Annulation gratuite jusqu'à 2h avant
   - Modification jusqu'à 1h avant
   - Nouvelle réservation minimum 1h à l'avance
   - Groupes 6+ personnes : appeler

3. **Compte**
   - Vérification email recommandée
   - Suppression impossible si commande en cours non payée
   - Réservations actives annulées à la suppression

4. **Tables**
   - Capacité max = nombre de convives + 1
   - Tables occupées affichées en rouge
   - Tables trop petites affichées en gris

---

## Commandes utiles

```bash
# Lancer le serveur de développement
npm run dev

# Dossier des captures
docs/user-manual/images/

# Fichier manuel final
docs/user-manual/USER_MANUAL.md
```

---

*Plan créé le : $(date)*
*Dernière mise à jour : -*
