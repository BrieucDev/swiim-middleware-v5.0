# 🔧 Configuration des Variables d'Environnement Vercel

## Variables d'Environnement Requises

### 1. DATABASE_URL (Obligatoire)
**Pour la connexion à la base de données PostgreSQL via Prisma**

#### Option A : Connection Pooler (Recommandé pour Vercel/Serverless)
```
postgresql://postgres.[REF]:[PASSWORD]@aws-1-eu-north-1.pooler.supabase.com:6543/postgres
```
- ✅ **Port : 6543** (Connection Pooler)
- ✅ Évite les erreurs de prepared statements
- ✅ Optimisé pour serverless

#### Option B : Connexion directe
```
postgresql://postgres:[PASSWORD]@db.gnqfzndhbjmpzagsvldc.supabase.co:5432/postgres
```
- ⚠️ Port : 5432 (connexion directe)
- ⚠️ Peut causer des problèmes de prepared statements

**Où trouver :**
- Supabase Dashboard → Settings → Database
- Pour Pooler : Connection Pooling → Session mode (port 6543)
- Pour Directe : Connection string → URI (port 5432)

### 2. NEXT_PUBLIC_SUPABASE_URL (Optionnel - pour client Supabase)
**Pour utiliser le client Supabase JavaScript côté client**

```
NEXT_PUBLIC_SUPABASE_URL=https://gnqfzndhbjmpzagsvldc.supabase.co
```

**Où trouver :**
- Supabase Dashboard → Settings → API
- Section "Project URL"

### 3. NEXT_PUBLIC_SUPABASE_ANON_KEY (Optionnel - pour client Supabase)
**Clé publique anonyme pour le client Supabase**

```
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImducWZ6bmRoYmptcHphZ3N2bGRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NzYxODEsImV4cCI6MjA3OTE1MjE4MX0.FXD_cAiV2XkeY8WDkWgfUwurwKlS9o7vsaAUVu3H7Ow
```

**Où trouver :**
- Supabase Dashboard → Settings → API
- Section "Project API keys" → `anon` `public` key

## 📋 Configuration dans Vercel

### Étapes détaillées :

1. **Accéder aux Variables d'Environnement**
   - Allez sur https://vercel.com/dashboard
   - Sélectionnez votre projet `swiim-middleware-v5.0`
   - Cliquez sur **Settings** dans le menu
   - Cliquez sur **Environment Variables** dans le menu de gauche

2. **Ajouter DATABASE_URL** (Obligatoire)
   - Cliquez sur **Add New**
   - **Key** : `DATABASE_URL`
   - **Value** : Votre URL de connexion (voir ci-dessus)
   - **Environments** : Cochez toutes les cases (Production, Preview, Development)
   - Cliquez sur **Save**

3. **Ajouter NEXT_PUBLIC_SUPABASE_URL** (Optionnel)
   - Cliquez sur **Add New**
   - **Key** : `NEXT_PUBLIC_SUPABASE_URL`
   - **Value** : `https://gnqfzndhbjmpzagsvldc.supabase.co`
   - **Environments** : Cochez toutes les cases
   - Cliquez sur **Save**

4. **Ajouter NEXT_PUBLIC_SUPABASE_ANON_KEY** (Optionnel)
   - Cliquez sur **Add New**
   - **Key** : `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Value** : Votre clé anonyme (voir ci-dessus)
   - **Environments** : Cochez toutes les cases
   - Cliquez sur **Save**

## ⚠️ Points Importants

### Pour DATABASE_URL avec Connection Pooler :
1. **Utilisez le port 6543** (pas 5432)
2. **Format correct** : `postgresql://postgres.[REF]:[PASSWORD]@aws-1-eu-north-1.pooler.supabase.com:6543/postgres`
3. **Pas de guillemets** autour de la valeur
4. Le code ajoute automatiquement `?sslmode=require` si nécessaire

### Pour les variables NEXT_PUBLIC_* :
- ⚠️ **Attention** : Les variables `NEXT_PUBLIC_*` sont exposées côté client
- ✅ **Sécurisé** : La clé `anon` est publique par design (Supabase gère la sécurité)
- Ces variables sont optionnelles si vous n'utilisez pas le client Supabase JavaScript

## 🔄 Après avoir ajouté/modifié les variables

1. **Vercel redéploie automatiquement** lorsque vous modifiez les variables d'environnement
2. **Vérifiez le déploiement** dans le dashboard Vercel
3. **Testez la connexion** : Visitez `/api/health-db` sur votre site déployé

## ✅ Checklist

- [ ] `DATABASE_URL` configurée avec le Connection Pooler (port 6543)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` configurée (si nécessaire)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` configurée (si nécessaire)
- [ ] Toutes les variables sont appliquées à tous les environnements (Production, Preview, Development)
- [ ] Vercel a redéployé automatiquement
- [ ] La connexion à la base de données fonctionne (`/api/health-db`)

## 🔍 Vérification

### Test rapide :
1. Allez sur votre site Vercel déployé
2. Visitez : `https://votre-site.vercel.app/api/health-db`
3. Vous devriez voir :
   ```json
   {
     "ok": true,
     "message": "Database connection successful",
     "storeCount": 0
   }
   ```

### Si vous voyez une erreur :
- Vérifiez que `DATABASE_URL` est correcte
- Vérifiez que le port est **6543** (pooler) ou **5432** (directe)
- Vérifiez qu'il n'y a pas d'espaces ou de guillemets dans la valeur
- Consultez les logs Vercel pour plus de détails

