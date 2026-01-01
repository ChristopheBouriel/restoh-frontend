# Manuel Utilisateur RestOh!

## Table des matières

1. [Introduction](#1-introduction)
2. [Premiers pas](#2-premiers-pas)
3. [Naviguer dans l'application](#3-naviguer-dans-lapplication)
4. [Commander des plats](#4-commander-des-plats)
5. [Réserver une table](#5-réserver-une-table)
6. [Gérer son compte](#6-gérer-son-compte)
7. [Laisser des avis](#7-laisser-des-avis)
8. [Espace Administrateur](#8-espace-administrateur)
9. [FAQ](#9-faq)
10. [Contact & Support](#10-contact--support)

---

## 1. Introduction

### Bienvenue sur RestOh!

RestOh! est une application web complète de gestion de restaurant qui vous permet de :
- **Consulter le menu** avec descriptions détaillées, prix et informations sur les allergènes
- **Commander des plats** en livraison ou à emporter
- **Réserver une table** avec un plan interactif du restaurant
- **Laisser des avis** sur les plats et le restaurant
- **Gérer votre compte** et suivre vos commandes

### Public cible

Cette application s'adresse à :
- **Les clients** qui souhaitent commander ou réserver facilement
- **Les administrateurs** du restaurant qui gèrent les commandes, réservations et le menu

### Fonctionnalités principales

| Fonctionnalité | Description |
|----------------|-------------|
| Menu interactif | Consultez tous les plats avec filtres par catégorie et cuisine |
| Panier intelligent | Ajoutez des articles et passez commande facilement |
| Réservations | Choisissez votre table sur un plan interactif |
| Avis | Partagez votre expérience sur les plats et le restaurant |
| Suivi de commandes | Suivez l'état de vos commandes en temps réel |
| Espace admin | Gérez l'ensemble du restaurant depuis un tableau de bord |

---

## 2. Premiers pas

### 2.1 Créer un compte

Pour profiter de toutes les fonctionnalités de RestOh!, vous devez créer un compte.

![Page d'inscription](images/09-auth/auth-register.png)

1. Cliquez sur **"Créer un compte"** depuis la page de connexion
2. Remplissez le formulaire :
   - **Nom complet** : Votre prénom et nom
   - **Adresse email** : Une adresse email valide
   - **Mot de passe** : Minimum 6 caractères
   - **Confirmation** : Retapez votre mot de passe
3. Acceptez les conditions d'utilisation
4. Cliquez sur **"Créer mon compte"**

> **Note** : Un email de vérification vous sera envoyé. Vérifiez votre boîte de réception.

### 2.2 Se connecter

![Page de connexion](images/09-auth/auth-login.png)

1. Accédez à la page de connexion
2. Entrez votre **adresse email** et **mot de passe**
3. Cochez **"Se souvenir de moi"** pour rester connecté plus longtemps (7 jours au lieu de 24h)
4. Cliquez sur **"Connexion"**

**Comptes de démonstration disponibles :**
- Admin : `admin@restoh.com` / `admin123`
- Client : `demo@test.com` / `123456`

### 2.3 Récupérer son mot de passe

![Page mot de passe oublié](images/09-auth/auth-forgot-password.png)

Si vous avez oublié votre mot de passe :

1. Cliquez sur **"Mot de passe oublié ?"** sur la page de connexion
2. Entrez votre adresse email
3. Cliquez sur **"Envoyer le lien de réinitialisation"**
4. Consultez votre boîte email et cliquez sur le lien reçu
5. Choisissez un nouveau mot de passe

---

## 3. Naviguer dans l'application

### 3.1 Page d'accueil

La page d'accueil vous présente RestOh! et vous permet d'accéder rapidement aux fonctionnalités principales.

![Section héro](images/01-home/home-hero.png)

**Éléments principaux :**
- **Bouton "Commander maintenant"** : Accès direct au menu
- **Bouton "Réserver une table"** : Accès à la page de réservation

### 3.2 Plats populaires

![Plats populaires](images/01-home/home-popular.png)

Un carousel présente les plats les plus appréciés par nos clients. Chaque carte affiche :
- L'image du plat
- Le nom et la catégorie
- Le prix
- Un bouton **"+ Panier"** pour ajouter directement

### 3.3 Pourquoi choisir RestOh!

![Nos atouts](images/01-home/home-strengths.png)

Découvrez nos quatre points forts :
- **Chefs expérimentés** : Des professionnels passionnés
- **Qualité premium** : Ingrédients frais et sélectionnés
- **Service rapide** : Commande et livraison efficaces
- **Ambiance chaleureuse** : Un cadre accueillant

### 3.4 Recommandations du Chef

![Recommandations du chef](images/01-home/home-chef-picks.png)

Les plats sélectionnés par notre chef sont identifiés par un badge **"Chef's Pick"** et présentés dans une section dédiée.

### 3.5 Avis clients

![Avis clients](images/01-home/home-reviews.png)

Consultez les derniers avis laissés par nos clients avec :
- La note moyenne du restaurant
- Les commentaires récents
- Les boutons pour voir tous les avis ou en rédiger un

### 3.6 Barre de navigation

La barre de navigation en haut de page permet d'accéder à :
- **Accueil** : Page principale
- **Menu** : Consulter tous les plats
- **Réservations** : Réserver une table
- **Icône panier** : Voir votre panier
- **Menu utilisateur** : Accéder à votre compte

---

## 4. Commander des plats

### 4.1 Parcourir le menu

![Vue d'ensemble du menu](images/02-menu/menu-overview.png)

La page Menu affiche tous les plats disponibles sous forme de cartes détaillées.

**Chaque carte présente :**
- Photo du plat
- Nom et prix
- Description
- Note moyenne et nombre d'avis
- Catégorie (entrée, plat, dessert, boisson)
- Type de cuisine
- Temps de préparation
- Allergènes (le cas échéant)
- Badges spéciaux (Popular, Chef's Pick)

### 4.2 Filtrer et rechercher

![Filtres du menu](images/02-menu/menu-filters.png)

Utilisez les filtres pour trouver rapidement ce que vous cherchez :

| Filtre | Options |
|--------|---------|
| **Recherche** | Tapez le nom d'un plat |
| **Cuisine** | Toutes, Continental, etc. |
| **Catégorie** | Toutes, Entrées, Plats, Desserts, Boissons |
| **Tri** | Par prix (croissant/décroissant) |

### 4.3 Comprendre les badges

Les plats peuvent avoir des badges spéciaux :

| Badge | Signification |
|-------|---------------|
| **Popular** | Plat très apprécié par les clients |
| **Chef's Pick** | Recommandation du chef |
| 🌱 | Plat végétarien |

### 4.4 Consulter les avis d'un plat

![Modal des avis](images/02-menu/menu-reviews-modal.png)

Cliquez sur le bouton **"Reviews"** pour voir tous les avis d'un plat :
- Note moyenne
- Liste des commentaires avec date et auteur
- Possibilité d'ajouter votre propre avis

### 4.5 Ajouter au panier

Pour ajouter un plat au panier :
1. Cliquez sur le bouton **"Add to cart"** ou **"+ Panier"**
2. Le compteur du panier s'incrémente dans la barre de navigation
3. Une notification confirme l'ajout

### 4.6 Gérer le panier

![Panier avec articles](images/03-cart/cart-items.png)

Ouvrez le panier en cliquant sur l'icône panier. Vous pouvez :
- **Modifier les quantités** avec les boutons + et -
- **Supprimer un article** en cliquant sur l'icône poubelle
- **Voir le total** mis à jour en temps réel
- **Passer commande** en cliquant sur "Checkout"

![Panier vide](images/03-cart/cart-empty.png)

Si votre panier est vide, un message vous invite à explorer le menu.

### 4.7 Passer commande

![Formulaire de commande](images/04-checkout/checkout-form.png)

Le processus de commande se déroule en plusieurs étapes :

**1. Informations de livraison :**
- Nom complet
- Téléphone
- Adresse de livraison (si livraison)

**2. Mode de réception :**

![Options de retrait](images/04-checkout/checkout-pickup.png)

- **Livraison** : Le livreur apporte votre commande à l'adresse indiquée
- **À emporter** : Vous venez chercher votre commande au restaurant

**3. Mode de paiement :**
- **Carte bancaire** : Paiement immédiat (sécurisé)
- **Espèces** : Paiement à la livraison/au retrait

**4. Validation :**
- Vérifiez le récapitulatif de votre commande
- Cliquez sur **"Confirmer la commande"**

> **Important** :
> - Livraison gratuite à partir de 25€
> - Temps de livraison moyen : 30-45 minutes

### 4.8 Suivre ses commandes

![Liste des commandes](images/06-orders/orders-list.png)

Accédez à **"Mes commandes"** depuis votre profil pour voir :
- L'historique de toutes vos commandes
- Le statut de chaque commande

![Détail d'une commande](images/06-orders/orders-detail.png)

Cliquez sur une commande pour voir le détail :
- Liste des articles commandés
- Prix et quantités
- Adresse de livraison
- Mode de paiement
- Statut actuel

**Statuts possibles :**

| Statut | Description |
|--------|-------------|
| **En attente** | Commande reçue, en attente de confirmation |
| **Confirmée** | Commande acceptée par le restaurant |
| **En préparation** | Vos plats sont en cours de préparation |
| **Prête** | Commande prête pour livraison/retrait |
| **Livrée** | Commande terminée |
| **Annulée** | Commande annulée |

---

## 5. Réserver une table

### 5.1 Formulaire de réservation

![Formulaire de réservation](images/05-reservations/reservations-form.png)

Pour réserver une table :

1. Accédez à **"Réservations"** depuis le menu
2. Remplissez le formulaire :
   - **Nombre de convives** : De 1 à 10 personnes
   - **Date** : Sélectionnez dans le calendrier
   - **Heure** : Choisissez un créneau disponible

### 5.2 Choisir la date

![Sélecteur de date](images/05-reservations/reservations-date-picker.png)

Le calendrier affiche :
- Les jours disponibles (cliquables)
- Les jours passés (grisés)
- La date du jour (surlignée)

### 5.3 Sélectionner une table

![Plan des tables](images/05-reservations/reservations-table-map.png)

Le plan interactif du restaurant vous permet de choisir votre table :

**Code couleur :**
| Couleur | Signification |
|---------|---------------|
| **Vert** | Table disponible pour votre groupe |
| **Rouge** | Table déjà réservée |
| **Gris** | Table trop petite pour votre groupe |

**Capacités des tables :**
- Tables pour 2 personnes
- Tables pour 4 personnes
- Tables pour 6 personnes
- Grandes tables (8+ personnes)

> **Règle** : Une table peut accueillir jusqu'à sa capacité maximale + 1 personne.

### 5.4 Confirmer la réservation

Après avoir sélectionné votre table :
1. Vérifiez le récapitulatif
2. Ajoutez des notes spéciales si nécessaire (anniversaire, allergies...)
3. Cliquez sur **"Confirmer la réservation"**

### 5.5 Gérer ses réservations

Depuis **"Mes réservations"** dans votre profil :

**Modifier une réservation :**
- Possible jusqu'à **1 heure avant** l'heure prévue
- Changez la date, l'heure ou le nombre de convives

**Annuler une réservation :**
- Gratuit jusqu'à **2 heures avant** l'heure prévue
- Au-delà, contactez le restaurant

### 5.6 Règles importantes

- **Délai minimum** : Réservation possible au moins 1 heure à l'avance
- **Groupes de 6+ personnes** : Nous vous recommandons d'appeler le restaurant
- **Arrivée** : Merci de vous présenter à l'heure prévue

---

## 6. Gérer son compte

### 6.1 Accéder à son profil

Cliquez sur votre nom dans la barre de navigation puis sur **"Mon profil"**.

### 6.2 Informations personnelles

![Profil personnel](images/08-profile/profile-personal.png)

Dans l'onglet **"Informations personnelles"** :
- Consultez votre nom et email
- Modifiez vos informations en cliquant sur **"Modifier"**

### 6.3 Sécurité

![Sécurité du compte](images/08-profile/profile-security.png)

Dans l'onglet **"Sécurité"** :

**Changer de mot de passe :**
1. Entrez votre mot de passe actuel
2. Entrez le nouveau mot de passe (min. 6 caractères)
3. Confirmez le nouveau mot de passe
4. Cliquez sur **"Changer le mot de passe"**

**Supprimer son compte :**
- Cliquez sur **"Supprimer mon compte"**
- Confirmez en tapant "DELETE"
- Entrez votre mot de passe

> **Attention** :
> - La suppression est **irréversible**
> - Impossible si vous avez une commande en cours non payée
> - Les réservations actives seront automatiquement annulées

---

## 7. Laisser des avis

### 7.1 Avis sur les plats

![Formulaire d'avis](images/02-menu/menu-add-review.png)

Pour noter un plat :
1. Allez sur la page Menu
2. Cliquez sur **"Reviews"** sur le plat souhaité
3. Cliquez sur **"Write a Review"**
4. Sélectionnez une note (1 à 5 étoiles)
5. Ajoutez un commentaire (optionnel)
6. Cliquez sur **"Submit Review"**

### 7.2 Avis sur le restaurant

![Page des avis restaurant](images/07-reviews/reviews-page.png)

Pour donner votre avis sur le restaurant :
1. Accédez à la page **"Avis"** depuis l'accueil
2. Cliquez sur **"Write a Review"**
3. Notez votre expérience globale
4. Décrivez votre visite
5. Publiez votre avis

![Modifier un avis](images/07-reviews/reviews-edit-form.png)

**Modifier ou supprimer votre avis :**
- Retrouvez votre avis sur la page
- Cliquez sur **"Edit"** pour le modifier
- Ou **"Delete"** pour le supprimer

---

## 8. Espace Administrateur

Cette section est réservée aux administrateurs du restaurant.

### 8.1 Accéder au tableau de bord

![Dashboard admin](images/10-admin/admin-dashboard.png)

Connectez-vous avec un compte administrateur et cliquez sur **"Admin Panel"** dans le menu utilisateur.

Le tableau de bord affiche :
- **Statistiques du jour** : Revenus, commandes, réservations
- **Comparaisons** : Avec le mois précédent et la même journée la semaine dernière
- **Activité récente** : Dernières commandes et réservations

### 8.2 Gestion des Commandes

![Liste des commandes](images/10-admin/admin-orders.png)

Gérez toutes les commandes depuis cette page :

**Fonctionnalités :**
- Filtrer par statut (En attente, Confirmée, En préparation, etc.)
- Filtrer par date (Aujourd'hui, Cette semaine, etc.)
- Rechercher une commande

![Détail d'une commande](images/10-admin/admin-order-detail.png)

**Changer le statut d'une commande :**
1. Cliquez sur une commande pour ouvrir le détail
2. Sélectionnez le nouveau statut
3. Confirmez le changement

### 8.3 Gestion des Réservations

![Liste des réservations](images/10-admin/admin-reservations.png)

Gérez toutes les réservations :
- Voir les réservations du jour
- Confirmer ou annuler une réservation
- Marquer comme "client arrivé" ou "terminée"

**Statuts des réservations :**
| Statut | Action |
|--------|--------|
| En attente | Confirmer ou annuler |
| Confirmée | Marquer comme arrivé |
| Client installé | Marquer comme terminée |
| Terminée | Archivée |

### 8.4 Gestion du Menu

![Gestion du menu](images/10-admin/admin-menu.png)

Administrez les plats du restaurant :

**Ajouter un plat :**

![Ajouter un plat](images/10-admin/admin-menu-add.png)

1. Cliquez sur **"Add New Item"**
2. Remplissez le formulaire :
   - Nom, description, prix
   - Catégorie et type de cuisine
   - Temps de préparation
   - Allergènes
   - URL de l'image
3. Activez/désactivez les badges (Popular, Chef's Pick)
4. Cliquez sur **"Save"**

**Modifier un plat :**

![Modifier un plat](images/10-admin/admin-menu-edit.png)

- Cliquez sur l'icône d'édition du plat
- Modifiez les informations
- Enregistrez

**Disponibilité :**
- Activez/désactivez un plat avec le toggle
- Les plats désactivés n'apparaissent pas dans le menu client

### 8.5 Gestion des Utilisateurs

![Liste des utilisateurs](images/10-admin/admin-users.png)

Consultez la liste de tous les utilisateurs :
- Nom, email, rôle
- Date d'inscription
- Statut de vérification email

![Détail utilisateur](images/10-admin/admin-users-detail.png)

Cliquez sur un utilisateur pour voir :
- Ses informations complètes
- Son historique de commandes
- Ses réservations

### 8.6 Gestion des Messages

![Messages de contact](images/10-admin/admin-messages.png)

Gérez les messages reçus via le formulaire de contact :

**Statuts des messages :**
| Statut | Description |
|--------|-------------|
| Nouveau | Message non lu |
| Lu | Message consulté |
| Répondu | Une réponse a été envoyée |
| Fermé | Conversation terminée |

![Répondre à un message](images/10-admin/admin-contacts-reply.png)

**Répondre à un message :**
1. Cliquez sur le message
2. Consultez l'historique de la conversation
3. Tapez votre réponse
4. Cliquez sur **"Send Reply"**

---

## 9. FAQ

### Questions fréquentes

**Q : Puis-je commander sans créer de compte ?**
> Non, un compte est nécessaire pour passer commande. Cela nous permet de vous offrir un suivi de vos commandes et de mémoriser vos préférences.

**Q : Comment annuler une commande ?**
> Contactez-nous rapidement par téléphone. L'annulation n'est possible que si la préparation n'a pas encore commencé.

**Q : La livraison est-elle gratuite ?**
> Oui, la livraison est gratuite à partir de 25€ de commande.

**Q : Puis-je modifier ma réservation ?**
> Oui, jusqu'à 1 heure avant l'heure prévue. Au-delà, contactez le restaurant.

**Q : Comment savoir si un plat contient des allergènes ?**
> Les allergènes sont indiqués sur chaque fiche produit. En cas de doute, n'hésitez pas à nous contacter.

**Q : J'ai oublié mon mot de passe, que faire ?**
> Cliquez sur "Mot de passe oublié" sur la page de connexion et suivez les instructions envoyées par email.

### Résolution de problèmes courants

**Le site ne charge pas correctement :**
- Videz le cache de votre navigateur
- Essayez un autre navigateur
- Vérifiez votre connexion internet

**Je ne reçois pas les emails :**
- Vérifiez votre dossier spam
- Assurez-vous que l'adresse email est correcte
- Contactez le support

**Mon paiement a échoué :**
- Vérifiez les informations de votre carte
- Assurez-vous d'avoir un solde suffisant
- Essayez un autre moyen de paiement

---

## 10. Contact & Support

### Informations du restaurant

| | |
|---|---|
| **Adresse** | 123 rue de la Gastronomie, 75001 Paris |
| **Téléphone** | 01 23 45 67 89 |
| **Email** | contact@restoh.fr |

### Horaires d'ouverture

| Jour | Service du midi | Service du soir |
|------|-----------------|-----------------|
| Lundi - Vendredi | 11h00 - 14h30 | 18h00 - 22h30 |
| Samedi - Dimanche | 11h00 - 22h30 | |

### Formulaire de contact

![Page de contact](images/10-contact/contact-page.png)

Pour nous contacter :
1. Accédez à la page **"Contact"** via le footer
2. Remplissez le formulaire :
   - Votre nom
   - Email
   - Sujet
   - Message
3. Cliquez sur **"Envoyer"**

Nous répondons généralement sous 24 heures ouvrées.

---

*Manuel utilisateur RestOh! - Version 1.0*
*Dernière mise à jour : Janvier 2026*
