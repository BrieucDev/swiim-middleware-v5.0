-- ============================================================================
-- COMPLETE DATABASE SETUP FOR SWIIM MIDDLEWARE
-- Execute this script in Supabase SQL Editor
-- ============================================================================
-- This script creates all tables and relationships needed for:
-- - Magasins (Stores)
-- - TPE/Clés (PosTerminal - Payment Terminals)
-- - Tickets (Receipts)
-- - Analytics (uses all tables above)
-- ============================================================================

-- Enable UUID extension (if needed)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE 1: User (for authentication)
-- ============================================================================
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "companyName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

-- ============================================================================
-- TABLE 2: Store (Magasins)
-- ============================================================================
CREATE TABLE IF NOT EXISTS "Store" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "address" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Store_userId_idx" ON "Store"("userId");

-- Foreign Key: Store → User
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Store_userId_fkey'
    ) THEN
        ALTER TABLE "Store" ADD CONSTRAINT "Store_userId_fkey" 
            FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- ============================================================================
-- TABLE 3: PosTerminal (TPE/Clés - Payment Terminals)
-- ============================================================================
CREATE TABLE IF NOT EXISTS "PosTerminal" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "lastSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PosTerminal_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PosTerminal_identifier_key" ON "PosTerminal"("identifier");
CREATE INDEX IF NOT EXISTS "PosTerminal_storeId_idx" ON "PosTerminal"("storeId");

-- Foreign Key: PosTerminal → Store
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'PosTerminal_storeId_fkey'
    ) THEN
        ALTER TABLE "PosTerminal" ADD CONSTRAINT "PosTerminal_storeId_fkey" 
            FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- ============================================================================
-- TABLE 4: Customer (Clients)
-- ============================================================================
CREATE TABLE IF NOT EXISTS "Customer" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Customer_email_key" ON "Customer"("email");

-- ============================================================================
-- TABLE 5: Receipt (Tickets)
-- ============================================================================
-- This is the main table that connects everything:
-- - Links to Store (magasin)
-- - Links to PosTerminal (TPE/clé)
-- - Links to Customer (client)
-- ============================================================================
CREATE TABLE IF NOT EXISTS "Receipt" (
    "id" TEXT NOT NULL,
    "posId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "customerId" TEXT,
    "status" TEXT NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Receipt_pkey" PRIMARY KEY ("id")
);

-- Indexes for better query performance (analytics)
CREATE INDEX IF NOT EXISTS "Receipt_posId_idx" ON "Receipt"("posId");
CREATE INDEX IF NOT EXISTS "Receipt_storeId_idx" ON "Receipt"("storeId");
CREATE INDEX IF NOT EXISTS "Receipt_customerId_idx" ON "Receipt"("customerId");
CREATE INDEX IF NOT EXISTS "Receipt_createdAt_idx" ON "Receipt"("createdAt");
CREATE INDEX IF NOT EXISTS "Receipt_status_idx" ON "Receipt"("status");

-- Foreign Keys: Receipt → PosTerminal, Store, Customer
DO $$ 
BEGIN
    -- Receipt → PosTerminal (TPE/Clé)
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Receipt_posId_fkey') THEN
        ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_posId_fkey" 
            FOREIGN KEY ("posId") REFERENCES "PosTerminal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    -- Receipt → Store (Magasin)
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Receipt_storeId_fkey') THEN
        ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_storeId_fkey" 
            FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    -- Receipt → Customer (Client) - Optional, so SET NULL on delete
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Receipt_customerId_fkey') THEN
        ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_customerId_fkey" 
            FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- ============================================================================
-- TABLE 6: ReceiptLineItem (Ligne de ticket)
-- ============================================================================
CREATE TABLE IF NOT EXISTS "ReceiptLineItem" (
    "id" TEXT NOT NULL,
    "receiptId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "ReceiptLineItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ReceiptLineItem_receiptId_idx" ON "ReceiptLineItem"("receiptId");
CREATE INDEX IF NOT EXISTS "ReceiptLineItem_category_idx" ON "ReceiptLineItem"("category");

-- Foreign Key: ReceiptLineItem → Receipt
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ReceiptLineItem_receiptId_fkey') THEN
        ALTER TABLE "ReceiptLineItem" ADD CONSTRAINT "ReceiptLineItem_receiptId_fkey" 
            FOREIGN KEY ("receiptId") REFERENCES "Receipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- ============================================================================
-- LOYALTY PROGRAM TABLES (Optional - for fidelité feature)
-- ============================================================================

-- Table: LoyaltyProgram
CREATE TABLE IF NOT EXISTS "LoyaltyProgram" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "pointsPerEuro" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "conversionRate" INTEGER NOT NULL DEFAULT 100,
    "conversionValue" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "bonusCategories" JSONB,
    "pointsExpiryDays" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoyaltyProgram_pkey" PRIMARY KEY ("id")
);

-- Table: LoyaltyTier
CREATE TABLE IF NOT EXISTS "LoyaltyTier" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "minSpend" DOUBLE PRECISION NOT NULL,
    "maxSpend" DOUBLE PRECISION,
    "benefits" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoyaltyTier_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "LoyaltyTier_programId_idx" ON "LoyaltyTier"("programId");

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LoyaltyTier_programId_fkey') THEN
        ALTER TABLE "LoyaltyTier" ADD CONSTRAINT "LoyaltyTier_programId_fkey" 
            FOREIGN KEY ("programId") REFERENCES "LoyaltyProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Table: LoyaltyAccount (links Customer to LoyaltyProgram)
CREATE TABLE IF NOT EXISTS "LoyaltyAccount" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "tierId" TEXT,
    "points" INTEGER NOT NULL DEFAULT 0,
    "totalSpend" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastActivity" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoyaltyAccount_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "LoyaltyAccount_customerId_key" ON "LoyaltyAccount"("customerId");
CREATE INDEX IF NOT EXISTS "LoyaltyAccount_programId_idx" ON "LoyaltyAccount"("programId");
CREATE INDEX IF NOT EXISTS "LoyaltyAccount_tierId_idx" ON "LoyaltyAccount"("tierId");

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LoyaltyAccount_customerId_fkey') THEN
        ALTER TABLE "LoyaltyAccount" ADD CONSTRAINT "LoyaltyAccount_customerId_fkey" 
            FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LoyaltyAccount_programId_fkey') THEN
        ALTER TABLE "LoyaltyAccount" ADD CONSTRAINT "LoyaltyAccount_programId_fkey" 
            FOREIGN KEY ("programId") REFERENCES "LoyaltyProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LoyaltyAccount_tierId_fkey') THEN
        ALTER TABLE "LoyaltyAccount" ADD CONSTRAINT "LoyaltyAccount_tierId_fkey" 
            FOREIGN KEY ("tierId") REFERENCES "LoyaltyTier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Table: LoyaltyCampaign
CREATE TABLE IF NOT EXISTS "LoyaltyCampaign" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "targetSegment" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "offerType" TEXT NOT NULL,
    "offerPayload" JSONB,
    "status" TEXT NOT NULL,
    "estimatedImpact" JSONB,
    "stats" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoyaltyCampaign_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "LoyaltyCampaign_programId_idx" ON "LoyaltyCampaign"("programId");

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LoyaltyCampaign_programId_fkey') THEN
        ALTER TABLE "LoyaltyCampaign" ADD CONSTRAINT "LoyaltyCampaign_programId_fkey" 
            FOREIGN KEY ("programId") REFERENCES "LoyaltyProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- ============================================================================
-- RELATIONSHIPS SUMMARY
-- ============================================================================
-- 
-- CORE RELATIONSHIPS FOR ANALYTICS:
-- 
-- 1. Store (Magasin)
--    ├─→ has many PosTerminal (TPE/Clés)
--    ├─→ has many Receipt (Tickets)
--    └─→ belongs to User (optional)
--
-- 2. PosTerminal (TPE/Clé)
--    ├─→ belongs to Store (Magasin)
--    └─→ has many Receipt (Tickets)
--
-- 3. Receipt (Ticket)
--    ├─→ belongs to Store (Magasin)
--    ├─→ belongs to PosTerminal (TPE/Clé)
--    ├─→ belongs to Customer (Client, optional)
--    └─→ has many ReceiptLineItem (Lignes de ticket)
--
-- 4. Customer (Client)
--    ├─→ has many Receipt (Tickets)
--    └─→ has one LoyaltyAccount (optional)
--
-- 5. Analytics queries use:
--    - Receipt JOIN Store → for store performance
--    - Receipt JOIN PosTerminal → for terminal usage
--    - Receipt JOIN Customer → for customer analytics
--    - Receipt JOIN ReceiptLineItem → for product/category analytics
--
-- ============================================================================

-- Verification query (optional - run to check all tables were created)
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.table_constraints 
     WHERE constraint_type = 'FOREIGN KEY' 
     AND table_name = t.table_name) as foreign_keys_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name IN ('User', 'Store', 'PosTerminal', 'Customer', 'Receipt', 'ReceiptLineItem')
ORDER BY table_name;

