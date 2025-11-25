# 🚀 Solution : Utiliser Supabase Connection Pooler

## Problème

Les erreurs `prepared statement "sXX" already exists` sont courantes en environnement serverless (Vercel) car plusieurs fonctions Lambda partagent la même connexion PostgreSQL, ce qui crée des conflits avec les prepared statements.

## ✅ Solution recommandée : Connection Pooler de Supabase

Le **Connection Pooler** de Supabase est spécialement conçu pour gérer ce type de problème en environnement serverless.

### Étapes pour activer le Connection Pooler

1. **Accéder au Connection Pooler de Supabase** :
   - Allez sur https://supabase.com
   - Ouvrez votre projet
   - Allez dans **Settings** → **Database**
   - Faites défiler jusqu'à **Connection Pooling**

2. **Copier l'URL du Connection Pooler** :
   - Choisissez le mode **Session** (recommandé pour Prisma)
   - L'URL ressemble à :
     ```
     postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
     ```

3. **Mettre à jour votre DATABASE_URL dans Vercel** :
   - Allez dans votre projet Vercel
   - **Settings** → **Environment Variables**
   - Trouvez `DATABASE_URL`
   - Remplacez-la par l'URL du Connection Pooler
   - **Important** : Utilisez le port **6543** (pooler) et non **5432** (connexion directe)

4. **Redéployer** :
   - Vercel détectera automatiquement le changement et redéploiera

### Différence entre les deux URLs

- **❌ Connexion directe** (port 5432) :
  ```
  postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
  ```
  - Problème : Les prepared statements sont partagés entre les fonctions Lambda
  - Résultat : Erreurs "prepared statement already exists"

- **✅ Connection Pooler** (port 6543) :
  ```
  postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
  ```
  - Avantage : Gère automatiquement les connexions en environnement serverless
  - Résultat : Plus d'erreurs de prepared statements

## 🔄 Alternative : Retry automatique (solution actuelle)

Le code utilise actuellement une fonction `retryWithFreshClient()` qui :
- Crée une nouvelle instance de Prisma Client pour chaque requête
- Retente automatiquement en cas d'erreur (jusqu'à 5 fois)
- Utilise un backoff exponentiel entre les tentatives

Cela fonctionne, mais le **Connection Pooler est plus efficace et plus fiable**.

## 📝 Notes

- Le Connection Pooler est **gratuit** pour les projets Supabase
- Il améliore également les performances en réutilisant les connexions
- Mode **Session** : Recommandé pour Prisma (compatible avec les transactions)
- Mode **Transaction** : Pour des requêtes plus courtes

## 🔍 Vérification

Après avoir mis à jour votre `DATABASE_URL` :
1. Redéployez votre application Vercel
2. Testez la page des magasins
3. Vérifiez qu'il n'y a plus d'erreurs de prepared statements

