# 🚀 Guide de Déploiement : The Welfare sur Railway

Ce guide contient toutes les étapes pour mettre en ligne l'API (Medusa) et le Storefront (Next.js) sur Railway, sans aucune perte de données.

---

## Étape 1 : Sauvegarder la base de données locale
Vous avez déjà généré le fichier `welfare_dump.sql` (ou vous pouvez lancer le script `export-db.bat` à la racine pour le re-générer). Ce fichier contient tous vos produits et descriptions IA.

---

## Étape 2 : Préparer Railway
1. Créez un compte sur [Railway.app](https://railway.app/).
2. Cliquez sur **New Project** -> **Deploy from GitHub repo**.
3. Sélectionnez votre dépôt "welfare-platform". (Laissez le déploiement échouer pour le moment, c'est normal, il manque la configuration).

---

## Étape 3 : Ajouter les bases de données (Services)
Dans votre projet Railway, cliquez sur le bouton **"+" (New)** en haut à droite, puis sélectionnez **Database** :
1. Ajoutez **PostgreSQL**
2. Ajoutez **Redis**
3. Pour Meilisearch, cliquez sur **New -> Empty Service**, nommez-le `Meilisearch`.
   - Dans les **Settings** de ce service, sous "Service Image", mettez l'image Docker : `getmeili/meilisearch:v1.11`
   - Ajoutez la variable d'environnement : `MEILI_MASTER_KEY=meilisearch_super_secret`

---

## Étape 4 : Configurer le Backend (Medusa)
Le projet Medusa a besoin de savoir où il se trouve. 
1. Cliquez sur le service que vous avez créé à partir de GitHub.
2. Allez dans les **Settings**.
3. Dans la section **Root Directory**, tapez : `/apps/api`
4. Allez dans l'onglet **Variables** et copiez-collez ceci (utilisez le bouton "Raw Editor" pour aller plus vite) :

```env
NODE_ENV=production
# Récupérez les URLs depuis les onglets "Connect" de vos services Postgres et Redis sur Railway
DATABASE_URL=postgresql://postgres:votre_mot_de_passe_railway@xxx.railway.app:5432/railway
REDIS_URL=redis://default:votre_mot_de_passe_redis@xxx.railway.app:6379

# Les clés secrètes (vous pouvez mettre n'importe quelle chaîne aléatoire longue)
JWT_SECRET=super_secret_aleatoire_jwt_12345
COOKIE_SECRET=super_secret_aleatoire_cookie_12345

# L'URL finale de votre boutique Vercel (ou Railway) et du panel admin
STORE_CORS=https://the-welfare.com
ADMIN_CORS=https://admin.the-welfare.com
AUTH_CORS=https://the-welfare.com,https://admin.the-welfare.com

# Meilisearch
MEILISEARCH_HOST=http://meilisearch.railway.internal:7700
MEILISEARCH_API_KEY=meilisearch_super_secret

# IA
OPENROUTER_API_KEY=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
```

### 🚨 GESTION DES IMAGES (TRES IMPORTANT)
Allez dans les **Settings** du backend, section **Volumes**.
1. Cliquez sur **Add Volume** -> `New Volume`
2. Montez le volume sur ce chemin exact : `/app/uploads`
*(Ceci garantira que vos images produits ne sont jamais effacées).*

---

## Étape 5 : Configurer le Storefront (Next.js)
Dans Railway, cliquez à nouveau sur **New -> Deploy from GitHub repo** et sélectionnez le MÊME dépôt.
1. Allez dans les **Settings** de ce 2ème service.
2. Dans la section **Root Directory**, tapez : `/apps/storefront`
3. Allez dans l'onglet **Variables** :

```env
NODE_ENV=production
# L'URL publique de votre backend Medusa sur Railway (générez un domaine dans les settings du backend)
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://medusa-welfare-production.up.railway.app

# Meilisearch
NEXT_PUBLIC_MEILISEARCH_HOST=http://meilisearch.railway.internal:7700
NEXT_PUBLIC_MEILISEARCH_API_KEY=meilisearch_super_secret
```

---

## Étape 6 : Importer les données
Maintenant que le backend est en ligne, vous devez importer vos produits dans la base de données Railway.
1. Ouvrez votre logiciel de base de données (ex: pgAdmin, DBeaver) ou la ligne de commande.
2. Connectez-vous à la base PostgreSQL de Railway (vous trouverez les identifiants dans l'onglet **Connect** du service Postgres sur Railway).
3. Importez le fichier `welfare_dump.sql` (que vous avez généré à l'étape 1) dans cette base de données en ligne.

Et voilà ! 🎉 Votre backend et frontend vont se compiler (Build) et être accessibles dans le monde entier.
