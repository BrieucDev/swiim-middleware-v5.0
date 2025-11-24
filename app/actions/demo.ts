'use server';

import { PrismaClient } from '@prisma/client';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { Pool } from 'pg';


// Create a fresh Prisma instance for this action to avoid prepared statement conflicts
// This is necessary in serverless environments with connection pooling
function getFreshPrismaClient() {
    return new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["error"] : ["error"],
    });
}

const categories = ['Livres', 'Hi-Tech', 'Gaming', 'Vinyles', 'Accessoires', 'Musique', 'Cinéma'];
const firstNames = ['Jean', 'Marie', 'Pierre', 'Sophie', 'Antoine', 'Camille', 'Lucas', 'Emma'];
const lastNames = ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand'];

function randomChoice<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number): number {
    return Math.random() * (max - min) + min;
}

function randomDate(start: Date, end: Date): Date {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

export async function generateDemoData() {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: 'Unauthorized' };
    }

    const userId = session.user.id;
    const client = getFreshPrismaClient();

    try {
        // 1. Create a Store if none exists
        let store = await client.store.findFirst({ where: { userId } });
        if (!store) {
            store = await client.store.create({
                data: {
                    name: 'Magasin Démo',
                    city: 'Paris',
                    address: '123 Rue de la Démo',
                    userId,
                },
            });
        }

        // 2. Create POS Terminal
        const terminal = await client.posTerminal.create({
            data: {
                name: 'TPE Démo 1',
                identifier: `DEMO-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
                storeId: store.id,
                status: 'ACTIF',
            },
        });

        // 3. Create Customers
        const customers = [];
        for (let i = 0; i < 10; i++) {
            const firstName = randomChoice(firstNames);
            const lastName = randomChoice(lastNames);
            const customer = await client.customer.create({
                data: {
                    firstName,
                    lastName,
                    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${Math.random().toString(36).substring(2, 5)}@demo.com`,
                },
            });
            customers.push(customer);
        }

        // 4. Create Receipts
        const now = new Date();
        const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        for (let i = 0; i < 50; i++) {
            const customer = Math.random() < 0.7 ? randomChoice(customers) : null;
            const receiptDate = randomDate(startDate, now);
            const numItems = randomInt(1, 5);
            let subtotal = 0;
            const lineItems = [];

            for (let j = 0; j < numItems; j++) {
                const quantity = randomInt(1, 2);
                const unitPrice = randomFloat(10, 100);
                lineItems.push({
                    category: randomChoice(categories),
                    productName: `Produit Démo ${randomInt(1, 100)}`,
                    quantity,
                    unitPrice,
                });
                subtotal += quantity * unitPrice;
            }

            await client.receipt.create({
                data: {
                    posId: terminal.id,
                    storeId: store.id,
                    customerId: customer?.id,
                    status: 'EMIS',
                    totalAmount: subtotal,
                    currency: 'EUR',
                    createdAt: receiptDate,
                    lineItems: {
                        create: lineItems,
                    },
                },
            });
        }

        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Demo data generation failed:', error);
        return { error: 'Failed to generate demo data' };
    }
}

// Retry function with fresh Prisma instance for each attempt
async function retryQueryWithFreshClient<T>(
    queryFn: (client: PrismaClient) => Promise<T>,
    maxRetries: number = 3,
    delay: number = 200
): Promise<T> {
    for (let i = 0; i < maxRetries; i++) {
        const client = getFreshPrismaClient();
        try {
            const result = await queryFn(client);
            await client.$disconnect();
            return result;
        } catch (error: any) {
            await client.$disconnect().catch(() => {}); // Ignore disconnect errors
            const errorMessage = error?.message || String(error)
            const isPreparedStatementError = errorMessage.includes('prepared statement') && 
                                           (errorMessage.includes('already exists') || /s\d+/.test(errorMessage))
            
            if (isPreparedStatementError && i < maxRetries - 1) {
                console.log(`[Retry] Prepared statement error, attempt ${i + 1}/${maxRetries}, waiting ${delay * (i + 1)}ms...`)
                await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
                continue
            }
            throw error
        }
    }
    throw new Error('Max retries exceeded')
}

export async function generateNewTicketsAndClients() {
    try {
        // Check if DATABASE_URL is available
        if (!process.env.DATABASE_URL) {
            return { error: 'DATABASE_URL environment variable is not configured. Please configure it in your Vercel project settings (Settings → Environment Variables).' };
        }

        // Test database connection first with fresh client
        const testClient = getFreshPrismaClient();
        try {
            await testClient.$connect();
            await testClient.$disconnect();
        } catch (connectionError) {
            await testClient.$disconnect().catch(() => {});
            const errorMessage = connectionError instanceof Error ? connectionError.message : String(connectionError);
            console.error('Database connection error:', errorMessage);
            if (errorMessage.includes("Can't reach database server")) {
                return { 
                    error: 'Cannot connect to database. For Vercel/serverless, you MUST use Supabase Connection Pooler, not direct connection. Get it from: Supabase Dashboard → Settings → Database → Connection string → Connection Pooling → URI. Format: postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres' 
                };
            }
            return { error: `Database connection failed: ${errorMessage}` };
        }

        // Get existing stores using direct PostgreSQL connection to avoid prepared statements
        // Use pg library directly to bypass Prisma's prepared statements completely
        let stores: Array<{ id: string; name: string; userId: string | null }> = [];
        
        try {
            const { Pool } = await import('pg');
            const pool = new Pool({
                connectionString: process.env.DATABASE_URL,
                // Use transaction mode to avoid prepared statements
                max: 1, // Single connection for this query
            });
            
            try {
                const session = await auth();
                if (session?.user?.id) {
                    const userId = session.user.id;
                    // Use direct PostgreSQL query with parameterized query (but not prepared statement)
                    const result = await pool.query(
                        'SELECT id, name, "userId" FROM "Store" WHERE "userId" = $1',
                        [userId]
                    );
                    stores = result.rows as Array<{ id: string; name: string; userId: string | null }>;
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                if (errorMessage.includes('DATABASE_URL') || errorMessage.includes('Environment variable not found')) {
                    await pool.end();
                    return { error: 'Database connection not configured. Please check your DATABASE_URL environment variable in Vercel project settings (Settings → Environment Variables).' };
                }
                console.log('Auth check failed, using all stores:', error);
            }
            
            // If no stores found with userId, get all stores
            if (stores.length === 0) {
                try {
                    const result = await pool.query('SELECT id, name, "userId" FROM "Store"');
                    stores = result.rows as Array<{ id: string; name: string; userId: string | null }>;
                } catch (error) {
                    console.error('Error fetching stores:', error);
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    await pool.end();
                    if (errorMessage.includes('DATABASE_URL') || errorMessage.includes('Environment variable not found')) {
                        return { error: 'Database connection not configured. Please check your DATABASE_URL environment variable in Vercel project settings (Settings → Environment Variables).' };
                    }
                    return { error: `Error fetching stores: ${errorMessage}` };
                }
            }
            
            // Close pool after use
            await pool.end();
        } catch (importError) {
            // Fallback to Prisma if pg is not available
            console.warn('pg library not available, falling back to Prisma:', importError);
            const session = await auth();
            if (session?.user?.id) {
                const userId = session.user.id;
                stores = await retryQueryWithFreshClient(async (client) => {
                    return await client.store.findMany({ where: { userId } });
                }, 2, 200);
            }
            if (stores.length === 0) {
                stores = await retryQueryWithFreshClient(async (client) => {
                    return await client.store.findMany();
                }, 2, 200);
            }
        }
        
        if (stores.length === 0) {
            return { error: 'No stores found. Please create a store first.' };
        }

        // Get existing terminals with fresh client
        let terminals: Array<{ id: string; storeId: string; name: string; identifier: string }> = [];
        try {
            terminals = await retryQueryWithFreshClient(async (client) => {
                return await client.posTerminal.findMany({
                    where: { storeId: { in: stores.map(s => s.id) } },
                });
            }, 3, 300);
        } catch (error) {
            console.error('Error fetching terminals:', error);
            return { error: `Error fetching terminals: ${error instanceof Error ? error.message : 'Unknown error'}` };
        }
        
        if (terminals.length === 0) {
            return { error: 'No terminals found. Please create a terminal first.' };
        }

        // Get existing customers using direct PostgreSQL connection
        let existingCustomers: Array<{ id: string; firstName: string; lastName: string; email: string }> = [];
        try {
            const { Pool } = await import('pg');
            const customerPool = new Pool({
                connectionString: process.env.DATABASE_URL,
                max: 1,
            });
            try {
                const result = await customerPool.query('SELECT id, "firstName", "lastName", email FROM "Customer"');
                existingCustomers = result.rows as Array<{ id: string; firstName: string; lastName: string; email: string }>;
            } catch (error) {
                console.error('Error fetching existing customers:', error);
                // Continue anyway, we'll create new ones
            } finally {
                await customerPool.end();
            }
        } catch (importError) {
            // Fallback to Prisma if pg is not available
            console.warn('pg library not available for customers, using Prisma:', importError);
            existingCustomers = await retryQueryWithFreshClient(async (client) => {
                return await client.customer.findMany();
            }, 2, 200);
        }
        const customers = [...existingCustomers];

        // Create 5-10 new customers in batch (much faster)
        const newCustomersCount = randomInt(5, 10);
        const newCustomersData: Array<{ firstName: string; lastName: string; email: string }> = [];
        for (let i = 0; i < newCustomersCount; i++) {
            const firstName = randomChoice(firstNames);
            const lastName = randomChoice(lastNames);
            const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${Math.random().toString(36).substring(2, 5)}@swiim.client`;
            newCustomersData.push({
                firstName,
                lastName,
                email,
            });
        }

        let createdCustomers = 0;
        if (newCustomersData.length > 0) {
            try {
                // Use createMany for batch creation (much faster) with fresh client
                await retryQueryWithFreshClient(async (client) => {
                    await client.customer.createMany({
                        data: newCustomersData,
                        skipDuplicates: true, // Skip if email already exists
                    });
                }, 3, 300);
                
                // Fetch the created customers to add to our list with fresh client
                const createdEmails = newCustomersData.map(c => c.email);
                const created = await retryQueryWithFreshClient(async (client) => {
                    return await client.customer.findMany({
                        where: { email: { in: createdEmails } },
                    });
                }, 3, 300);
                customers.push(...created);
                createdCustomers = created.length;
            } catch (error) {
                console.error('Error creating customers in batch:', error);
                // Fallback to individual creation if batch fails
                for (const customerData of newCustomersData) {
                    try {
                        const customer = await retryQueryWithFreshClient(async (client) => {
                            return await client.customer.create({ data: customerData });
                        }, 2, 200);
                        customers.push(customer);
                        createdCustomers++;
                    } catch (err) {
                        console.error('Error creating individual customer:', err);
                    }
                }
            }
        }

        // Create 20-30 new receipts using transaction for better performance
        const now = new Date();
        const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // Last 7 days

        const receiptsCount = randomInt(20, 30);
        const statuses: Array<'EMIS' | 'RECLAME' | 'REMBOURSE' | 'ANNULE'> = ['EMIS', 'RECLAME', 'REMBOURSE', 'ANNULE'];
        const statusWeights = [0.7, 0.15, 0.1, 0.05]; // Most are EMIS

        // Prepare all receipt data first
        const receiptsData = [];
        for (let i = 0; i < receiptsCount; i++) {
            const store = randomChoice(stores);
            const storeTerminals = terminals.filter(t => t.storeId === store.id);
            if (storeTerminals.length === 0) {
                continue;
            }
            const terminal = randomChoice(storeTerminals);
            const customer = customers.length > 0 && Math.random() < 0.8 ? randomChoice(customers) : null;
            const receiptDate = randomDate(startDate, now);
            const numItems = randomInt(1, 6);
            let subtotal = 0;
            const lineItems = [];

            // Weighted random status
            const rand = Math.random();
            let status: 'EMIS' | 'RECLAME' | 'REMBOURSE' | 'ANNULE' = 'EMIS';
            let cumulative = 0;
            for (let j = 0; j < statuses.length; j++) {
                cumulative += statusWeights[j];
                if (rand <= cumulative) {
                    status = statuses[j];
                    break;
                }
            }

            for (let j = 0; j < numItems; j++) {
                const quantity = randomInt(1, 3);
                const unitPrice = randomFloat(5, 150);
                lineItems.push({
                    category: randomChoice(categories),
                    productName: `Produit ${randomChoice(['Premium', 'Standard', 'Éco', 'Luxe'])} ${randomInt(1, 200)}`,
                    quantity,
                    unitPrice,
                });
                subtotal += quantity * unitPrice;
            }

            receiptsData.push({
                posId: terminal.id,
                storeId: store.id,
                customerId: customer?.id,
                status,
                totalAmount: subtotal,
                currency: 'EUR',
                createdAt: receiptDate,
                lineItems,
            });
        }

        // Create receipts in batches using transaction with fresh client
        let createdReceipts = 0;
        const batchSize = 10; // Process 10 receipts at a time
        
        for (let i = 0; i < receiptsData.length; i += batchSize) {
            const batch = receiptsData.slice(i, i + batchSize);
            try {
                await retryQueryWithFreshClient(async (client) => {
                    await client.$transaction(async (tx) => {
                        for (const receiptData of batch) {
                            const { lineItems, ...receiptDataWithoutItems } = receiptData;
                            await tx.receipt.create({
                                data: {
                                    ...receiptDataWithoutItems,
                                    lineItems: {
                                        create: lineItems,
                                    },
                                },
                            });
                            createdReceipts++;
                        }
                    }, {
                        maxWait: 10000,
                        timeout: 20000,
                    });
                }, 3, 300);
            } catch (error) {
                console.error(`Error creating receipt batch ${Math.floor(i / batchSize) + 1}:`, error);
                // Try creating individually if batch fails
                for (const receiptData of batch) {
                    try {
                        const { lineItems, ...receiptDataWithoutItems } = receiptData;
                        await retryQueryWithFreshClient(async (client) => {
                            await client.receipt.create({
                                data: {
                                    ...receiptDataWithoutItems,
                                    lineItems: {
                                        create: lineItems,
                                    },
                                },
                            });
                            createdReceipts++;
                        }, 2, 200);
                    } catch (err) {
                        console.error('Error creating individual receipt:', err);
                    }
                }
            }
        }

        revalidatePath('/');
        revalidatePath('/tickets');
        revalidatePath('/clients');
        revalidatePath('/accueil');
        
        if (createdReceipts === 0 && createdCustomers === 0) {
            return { error: 'No data was created. Please check the console for errors.' };
        }
        
        return { 
            success: true, 
            message: `Généré ${createdCustomers} nouveau${createdCustomers > 1 ? 'x' : ''} client${createdCustomers > 1 ? 's' : ''} et ${createdReceipts} nouveau${createdReceipts > 1 ? 'x' : ''} ticket${createdReceipts > 1 ? 's' : ''}` 
        };
    } catch (error) {
        console.error('Failed to generate new tickets and clients:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return { error: `Failed to generate new tickets and clients: ${errorMessage}` };
    }
}
