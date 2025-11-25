# ⚡ Configuration Rapide Vercel - SWIIM MIDDLEWARE

## 🎯 Votre Configuration Supabase

**Project Reference** : `gnqfzndhbjmpzagsvldc`  
**Supabase URL** : `https://gnqfzndhbjmpzagsvldc.supabase.co`

## 📋 Variables à Configurer dans Vercel

### 1. DATABASE_URL (OBLIGATOIRE - Port 6543)

**⚠️ IMPORTANT : Utilisez le port 6543 pour le Connection Pooler**

#### Comment obtenir l'URL correcte :

1. Allez sur https://supabase.com
2. Ouvrez votre projet `gnqfzndhbjmpzagsvldc`
3. **Settings** → **Database**
4. Faites défiler jusqu'à **"Connection Pooling"**
5. Sélectionnez le mode **"Session"**
6. **Copiez l'URL complète** qui ressemble à :
   ```
   postgresql://postgres.gnqfzndhbjmpzagsvldc:[PASSWORD]@aws-1-eu-north-1.pooler.supabase.com:6543/postgres
   ```
   ⚠️ **Notez le port :6543** (pas :5432 !)

7. Dans Vercel :
   - **Settings** → **Environment Variables**
   - Ajoutez/Modifiez `DATABASE_URL`
   - Collez l'URL que vous venez de copier
   - **Environments** : Tous (Production, Preview, Development)

### 2. NEXT_PUBLIC_SUPABASE_URL (Optionnel)

Si vous utilisez le client Supabase JavaScript côté client :

```
NEXT_PUBLIC_SUPABASE_URL=https://gnqfzndhbjmpzagsvldc.supabase.co
```

### 3. NEXT_PUBLIC_SUPABASE_ANON_KEY (Optionnel)

```
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImducWZ6bmRoYmptcHphZ3N2bGRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NzYxODEsImV4cCI6MjA3OTE1MjE4MX0.FXD_cAiV2XkeY8WDkWgfUwurwKlS9o7vsaAUVu3H7Ow
```

## ✅ Vérification Rapide

### Format DATABASE_URL correct :
```
postgresql://postgres.gnqfzndhbjmpzagsvldc:[PASSWORD]@aws-1-eu-north-1.pooler.supabase.com:6543/postgres
```

✅ Port **6543** (Connection Pooler)  
✅ Hostname contient `.pooler.supabase.com`  
✅ Format `postgres.[REF]` avant le `@`

### Format DATABASE_URL incorrect (à éviter) :
```
postgresql://postgres.gnqfzndhbjmpzagsvldc:[PASSWORD]@aws-1-eu-north-1.pooler.supabase.com:5432/postgres
```

❌ Port **5432** (ne fonctionne pas avec pooler)  
❌ C'est ce qui cause l'erreur "Can't reach database server"

## 🚀 Après Configuration

1. Vercel redéploiera automatiquement
2. Testez : `https://votre-site.vercel.app/api/health-db`
3. Devrait retourner : `{"ok": true, ...}`

## 📝 Résumé

| Variable | Valeur | Obligatoire |
|----------|--------|-------------|
| `DATABASE_URL` | URL Connection Pooler (port 6543) | ✅ OUI |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://gnqfzndhbjmpzagsvldc.supabase.co` | ⚠️ Optionnel |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (voir ci-dessus) | ⚠️ Optionnel |

## 🔍 Problème Actuel

Votre erreur indique que vous utilisez le port **5432** au lieu de **6543** :

```
Can't reach database server at `aws-1-eu-north-1.pooler.supabase.com:5432`
```

**Solution** : Changez le port de `:5432` à `:6543` dans votre `DATABASE_URL` dans Vercel.

