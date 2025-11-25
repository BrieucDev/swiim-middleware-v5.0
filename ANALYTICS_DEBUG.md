# Guide de diagnostic pour la page analytique

## Problème identifié

La page analytique réelle (`/analytique/real`) ne s'affiche pas correctement. J'ai amélioré la fonction `getAnalyticsOverview` avec :

1. **Logs détaillés** à chaque étape pour identifier où ça bloque
2. **Gestion d'erreurs améliorée** avec try/catch séparés pour chaque requête
3. **Vérifications de sécurité** pour les valeurs null/undefined
4. **Conversions sécurisées** de nombres

## Étapes de diagnostic

### 1. Vérifier les logs Vercel

1. Allez sur votre dashboard Vercel
2. Ouvrez votre projet
3. Allez dans l'onglet **Logs**
4. Accédez à la page `/analytique/real`
5. Cherchez les logs qui commencent par `[Analytics]`

Vous devriez voir des logs comme :
```
[Analytics] Starting data fetch...
[Analytics] Date ranges: {...}
[Analytics] Fetching recent receipts...
[Analytics] Recent receipts fetched: X
```

### 2. Vérifier la connexion à la base de données

Si vous voyez des erreurs de connexion, vérifiez :
- Que `DATABASE_URL` est bien configuré dans Vercel (Settings → Environment Variables)
- Que vous utilisez le **Connection Pooler** de Supabase (port 6543) pour Vercel
- Format attendu : `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?sslmode=require`

### 3. Vérifier les données dans la base

Connectez-vous à Supabase et exécutez ces requêtes SQL pour vérifier :

```sql
-- Vérifier qu'il y a des tickets récents (30 derniers jours)
SELECT COUNT(*) as total_receipts
FROM "Receipt"
WHERE "createdAt" >= NOW() - INTERVAL '30 days';

-- Vérifier la structure d'un ticket
SELECT 
  id,
  "totalAmount",
  "customerId",
  status,
  "createdAt",
  "storeId"
FROM "Receipt"
LIMIT 5;

-- Vérifier les lineItems
SELECT 
  r.id as receipt_id,
  r."totalAmount",
  rli.category,
  rli."productName",
  rli.quantity,
  rli."unitPrice"
FROM "Receipt" r
LEFT JOIN "ReceiptLineItem" rli ON r.id = rli."receiptId"
LIMIT 10;

-- Vérifier les magasins
SELECT id, name FROM "Store" LIMIT 10;
```

### 4. Problèmes possibles et solutions

#### Problème : Aucun ticket trouvé
**Symptôme** : Log `[Analytics] No recent receipts found, returning empty data`

**Solution** :
- Créez des tickets de test via l'interface
- Ou utilisez le bouton "Générer des données de démonstration" si disponible

#### Problème : Erreur SQL
**Symptôme** : Erreur dans les logs avec mention de table/colonne introuvable

**Solution** :
- Vérifiez que votre schéma Prisma est à jour : `npx prisma db push`
- Vérifiez que les migrations sont appliquées : `npx prisma migrate deploy`

#### Problème : Données manquantes (null/undefined)
**Symptôme** : La page s'affiche mais avec des valeurs à 0

**Solution** :
- Vérifiez que les tickets ont bien des `lineItems` avec des `category`
- Vérifiez que les tickets ont bien un `store` associé
- Vérifiez que certains tickets ont un `customerId` pour les métriques d'identification

#### Problème : Erreur de prepared statement
**Symptôme** : Erreur mentionnant "prepared statement already exists"

**Solution** :
- La fonction utilise déjà `retryWithFreshClient` qui devrait gérer ça
- Assurez-vous d'utiliser le Connection Pooler de Supabase (port 6543)

### 5. Ajouter des données de test

Si vous n'avez pas de données, vous pouvez créer des tickets de test avec ce script SQL :

```sql
-- Créer un magasin de test
INSERT INTO "Store" (id, name, city, "createdAt", "updatedAt")
VALUES ('test-store-1', 'Magasin Test', 'Paris', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Créer un terminal de test
INSERT INTO "PosTerminal" (id, name, identifier, "storeId", status, "createdAt", "updatedAt")
VALUES ('test-pos-1', 'TPE Test', 'TPE-001', 'test-store-1', 'ACTIF', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Créer des tickets de test (30 derniers jours)
INSERT INTO "Receipt" (id, "posId", "storeId", status, "totalAmount", currency, "createdAt", "updatedAt")
SELECT 
  'receipt-' || generate_series::text,
  'test-pos-1',
  'test-store-1',
  CASE WHEN random() > 0.3 THEN 'RECLAME' ELSE 'EMIS' END,
  (random() * 100 + 10)::numeric(12,2),
  'EUR',
  NOW() - (random() * 30 || ' days')::interval,
  NOW()
FROM generate_series(1, 100);

-- Créer des lineItems pour ces tickets
INSERT INTO "ReceiptLineItem" (id, "receiptId", category, "productName", quantity, "unitPrice")
SELECT 
  'item-' || r.id || '-' || generate_series::text,
  r.id,
  (ARRAY['Livres', 'Hi-Tech', 'Gaming', 'Vinyles', 'Textile', 'Épicerie'])[floor(random() * 6 + 1)],
  'Produit ' || generate_series::text,
  floor(random() * 3 + 1),
  (random() * 50 + 5)::numeric(12,2)
FROM "Receipt" r
CROSS JOIN generate_series(1, 3)
WHERE r.id LIKE 'receipt-%'
LIMIT 300;
```

### 6. Tester localement

Pour tester localement et voir les logs en temps réel :

```bash
# Assurez-vous d'avoir DATABASE_URL dans .env.local
npm run dev

# Ouvrez http://localhost:3000/analytique/real
# Regardez les logs dans le terminal
```

## Améliorations apportées

1. **Logs détaillés** : Chaque étape est loggée pour identifier où ça bloque
2. **Gestion d'erreurs** : Chaque requête a son propre try/catch
3. **Vérifications de sécurité** : Toutes les valeurs sont vérifiées avant utilisation
4. **Conversions sécurisées** : Les nombres sont convertis avec vérification de NaN

## Prochaines étapes

1. **Vérifiez les logs Vercel** pour voir où ça bloque exactement
2. **Vérifiez vos données** avec les requêtes SQL ci-dessus
3. **Créez des données de test** si nécessaire
4. **Partagez les logs** si le problème persiste

## Si le problème persiste

Si après avoir suivi ces étapes le problème persiste, partagez :
1. Les logs Vercel (surtout ceux commençant par `[Analytics]`)
2. Le résultat des requêtes SQL de vérification
3. Le nombre de tickets dans votre base de données

