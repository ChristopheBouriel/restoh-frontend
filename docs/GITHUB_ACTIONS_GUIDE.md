# Guide GitHub Actions - RestOh Frontend

Ce guide explique étape par étape comment mettre en place un workflow CI (Continuous Integration) avec GitHub Actions pour le projet RestOh Frontend.

## Table des matières

1. [Qu'est-ce que GitHub Actions ?](#1-quest-ce-que-github-actions-)
2. [Concepts clés](#2-concepts-clés)
3. [Structure des fichiers](#3-structure-des-fichiers)
4. [Création du workflow CI](#4-création-du-workflow-ci)
5. [Explication détaillée du workflow](#5-explication-détaillée-du-workflow)
6. [Vérification et premier lancement](#6-vérification-et-premier-lancement)
7. [Lecture des résultats](#7-lecture-des-résultats)
8. [Badges de statut](#8-badges-de-statut)
9. [Évolutions possibles](#9-évolutions-possibles)
10. [Dépannage](#10-dépannage)

---

## 1. Qu'est-ce que GitHub Actions ?

GitHub Actions est un service d'automatisation intégré à GitHub. Il permet d'exécuter des scripts automatiquement en réponse à des événements sur ton repository (push, pull request, etc.).

**Cas d'usage typiques :**
- Lancer les tests à chaque push
- Vérifier le linting du code
- Construire l'application
- Déployer automatiquement

**Avantages :**
- Gratuit pour les repositories publics (2000 minutes/mois pour les privés)
- Intégré directement à GitHub (pas de service externe)
- Configuration en YAML (lisible et versionnable)

---

## 2. Concepts clés

### Workflow
Un **workflow** est un processus automatisé configurable. Il est défini dans un fichier YAML dans `.github/workflows/`.

### Event (Événement)
Un **event** est ce qui déclenche le workflow. Exemples :
- `push` : quand du code est poussé
- `pull_request` : quand une PR est ouverte/mise à jour
- `schedule` : à intervalle régulier (cron)
- `workflow_dispatch` : déclenchement manuel

### Job
Un **job** est un ensemble d'étapes qui s'exécutent sur une même machine virtuelle. Plusieurs jobs peuvent s'exécuter en parallèle.

### Step (Étape)
Une **step** est une tâche individuelle dans un job. Chaque step peut :
- Exécuter une commande shell (`run`)
- Utiliser une action pré-faite (`uses`)

### Action
Une **action** est un bloc réutilisable. Exemples :
- `actions/checkout@v4` : clone le repository
- `actions/setup-node@v4` : installe Node.js
- `actions/cache@v4` : met en cache des fichiers

### Runner
Un **runner** est la machine virtuelle qui exécute le job. GitHub fournit des runners gratuits :
- `ubuntu-latest` (Linux)
- `windows-latest`
- `macos-latest`

---

## 3. Structure des fichiers

Les workflows doivent être placés dans le dossier `.github/workflows/` à la racine du projet :

```
restoh-frontend/
├── .github/
│   └── workflows/
│       └── ci.yml          # Notre workflow CI
├── src/
├── package.json
└── ...
```

Le nom du fichier (`ci.yml`) peut être n'importe quoi, mais doit avoir l'extension `.yml` ou `.yaml`.

---

## 4. Création du workflow CI

### Étape 1 : Créer le dossier

```bash
mkdir -p .github/workflows
```

### Étape 2 : Créer le fichier workflow

Créer le fichier `.github/workflows/ci.yml` avec le contenu suivant :

```yaml
# Nom du workflow (affiché dans l'onglet Actions de GitHub)
name: CI

# Événements qui déclenchent le workflow
on:
  # Déclenché à chaque push sur main
  push:
    branches: [main]
  # Déclenché à chaque pull request vers main
  pull_request:
    branches: [main]
  # Permet de lancer manuellement depuis l'interface GitHub
  workflow_dispatch:

# Définition des jobs
jobs:
  # Job principal : test
  test:
    # Machine virtuelle utilisée
    runs-on: ubuntu-latest

    # Étapes du job
    steps:
      # Étape 1 : Récupérer le code du repository
      - name: Checkout code
        uses: actions/checkout@v4

      # Étape 2 : Installer Node.js
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      # Étape 3 : Installer les dépendances
      - name: Install dependencies
        run: npm ci

      # Étape 4 : Linter le code
      - name: Lint
        run: npm run lint

      # Étape 5 : Lancer les tests unitaires
      - name: Run tests
        run: npm test

      # Étape 6 : Construire l'application
      - name: Build
        run: npm run build
```

### Étape 3 : Commit et push

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add GitHub Actions workflow"
git push
```

Dès que tu push, GitHub détecte automatiquement le workflow et l'exécute.

---

## 5. Explication détaillée du workflow

### Section `name`

```yaml
name: CI
```

Nom affiché dans l'onglet "Actions" de GitHub. Choisis un nom descriptif.

### Section `on`

```yaml
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  workflow_dispatch:
```

Définit **quand** le workflow se déclenche :

| Événement | Quand ? |
|-----------|---------|
| `push` sur `main` | À chaque commit poussé sur main |
| `pull_request` vers `main` | À chaque PR ouverte/mise à jour vers main |
| `workflow_dispatch` | Bouton "Run workflow" dans l'interface GitHub |

**Pourquoi ces choix ?**
- `push` sur `main` : Vérifie que main reste toujours fonctionnel
- `pull_request` : Vérifie le code AVANT de le merger
- `workflow_dispatch` : Pratique pour tester/débugger le workflow

### Section `jobs`

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
```

- `test` : Nom du job (peut être n'importe quoi)
- `runs-on: ubuntu-latest` : Utilise une VM Linux Ubuntu (gratuit, rapide)

### Les étapes (`steps`)

#### Étape 1 : Checkout

```yaml
- name: Checkout code
  uses: actions/checkout@v4
```

Clone ton repository dans la VM. Sans cette étape, la VM est vide !

#### Étape 2 : Setup Node.js

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '22'
    cache: 'npm'
```

- `node-version: '22'` : Installe Node.js 22 (comme dans ton `package.json`)
- `cache: 'npm'` : Met en cache `node_modules` pour accélérer les prochains runs

#### Étape 3 : Install dependencies

```yaml
- name: Install dependencies
  run: npm ci
```

`npm ci` (et non `npm install`) car :
- Plus rapide
- Respecte exactement `package-lock.json`
- Supprime `node_modules` avant d'installer (environnement propre)

#### Étape 4 : Lint

```yaml
- name: Lint
  run: npm run lint
```

Vérifie le code avec ESLint. Si des erreurs, le workflow échoue.

#### Étape 5 : Tests

```yaml
- name: Run tests
  run: npm test
```

Lance les 1620+ tests unitaires avec Vitest.

#### Étape 6 : Build

```yaml
- name: Build
  run: npm run build
```

Vérifie que l'application compile correctement pour la production.

---

## 6. Vérification et premier lancement

### Après le push

1. Va sur ton repository GitHub
2. Clique sur l'onglet **"Actions"**
3. Tu verras ton workflow "CI" en cours d'exécution (point jaune)

### États possibles

| Icône | État | Signification |
|-------|------|---------------|
| 🟡 | In progress | Le workflow s'exécute |
| ✅ | Success | Toutes les étapes ont réussi |
| ❌ | Failure | Au moins une étape a échoué |
| ⚪ | Cancelled | Le workflow a été annulé |

### Lancement manuel

1. Onglet "Actions"
2. Clique sur "CI" dans la liste à gauche
3. Bouton "Run workflow" à droite
4. Sélectionne la branche et clique "Run workflow"

---

## 7. Lecture des résultats

### Vue d'ensemble

Dans l'onglet Actions, clique sur un run pour voir :
- Le statut de chaque job
- La durée totale
- Le commit qui a déclenché le run

### Détails d'un job

Clique sur le job "test" pour voir :
- Chaque étape avec son statut
- Le temps d'exécution de chaque étape
- Les logs détaillés

### Logs d'une étape

Clique sur une étape (ex: "Run tests") pour voir :
- La sortie complète de la commande
- Les erreurs éventuelles
- Le code de sortie

### En cas d'échec

1. Clique sur le run échoué
2. Clique sur le job échoué
3. Trouve l'étape avec ❌
4. Lis les logs pour comprendre l'erreur
5. Corrige le code localement
6. Push la correction

---

## 8. Badges de statut

Tu peux ajouter un badge dans ton README pour afficher le statut du CI :

### Récupérer l'URL du badge

1. Onglet "Actions"
2. Clique sur "CI" (le workflow)
3. Bouton "..." en haut à droite
4. "Create status badge"
5. Copie le Markdown

### Ajouter au README

```markdown
# RestOh Frontend

![CI](https://github.com/ChristopheBouriel/restoh-frontend/actions/workflows/ci.yml/badge.svg)

Modern React restaurant management application...
```

Le badge affichera :
- Vert "passing" si le dernier run a réussi
- Rouge "failing" si le dernier run a échoué

---

## 9. Évolutions possibles

### 9.1 Tests sur plusieurs versions de Node

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [20, 22]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
      # ...
```

### 9.2 Rapport de couverture de code

```yaml
- name: Run tests with coverage
  run: npm run test:coverage

- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v4
  with:
    files: ./coverage/lcov.info
```

### 9.3 Tests E2E (avancé)

Pour les tests Playwright, tu aurais besoin soit de :
- Mocker le backend
- Lancer un backend de test dans le CI
- Utiliser un service de staging

Exemple basique (sans backend) :

```yaml
e2e:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '22'
    - run: npm ci
    - run: npx playwright install --with-deps
    - run: npm run e2e
      env:
        VITE_API_URL: http://localhost:3000/api
```

### 9.4 Déploiement automatique

```yaml
deploy:
  needs: test  # Attend que les tests passent
  runs-on: ubuntu-latest
  if: github.ref == 'refs/heads/main'  # Seulement sur main
  steps:
    - uses: actions/checkout@v4
    - run: npm ci
    - run: npm run build
    # Déploiement vers Vercel, Netlify, etc.
```

---

## 10. Dépannage

### Erreur "npm ci" échoue

**Cause possible** : `package-lock.json` pas à jour ou absent.

**Solution** :
```bash
rm -rf node_modules package-lock.json
npm install
git add package-lock.json
git commit -m "fix: update package-lock.json"
git push
```

### Tests qui passent en local mais échouent dans le CI

**Causes possibles** :
- Variables d'environnement manquantes
- Dépendances système manquantes
- Tests dépendants du temps/timezone

**Solutions** :
- Ajouter les variables dans le workflow avec `env:`
- Vérifier que les tests sont isolés et déterministes

### Le workflow ne se déclenche pas

**Causes possibles** :
- Fichier YAML mal formaté
- Mauvais chemin (doit être `.github/workflows/`)
- Branche non couverte par `on:`

**Solution** :
- Valide le YAML avec un linter
- Vérifie le chemin du fichier
- Utilise `workflow_dispatch` pour tester manuellement

### Workflow trop lent

**Solutions** :
- Utiliser le cache npm (déjà fait avec `cache: 'npm'`)
- Paralléliser les jobs
- Exclure les fichiers inutiles du checkout

---

## Résumé

1. **Créer** `.github/workflows/ci.yml`
2. **Configurer** les événements déclencheurs (`on:`)
3. **Définir** les étapes (checkout, setup, install, lint, test, build)
4. **Push** pour activer
5. **Vérifier** dans l'onglet Actions
6. **Ajouter** le badge au README

Le workflow s'exécutera automatiquement à chaque push et PR, garantissant que le code reste fonctionnel.

---

**Prochaine étape** : Créer le fichier `.github/workflows/ci.yml` et le tester !
