'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

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

    try {
        // 1. Create a Store if none exists
        let store = await prisma.store.findFirst({ where: { userId } });
        if (!store) {
            store = await prisma.store.create({
                data: {
                    name: 'Magasin Démo',
                    city: 'Paris',
                    address: '123 Rue de la Démo',
                    userId,
                },
            });
        }

        // 2. Create POS Terminal
        const terminal = await prisma.posTerminal.create({
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
            const customer = await prisma.customer.create({
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

            await prisma.receipt.create({
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

export async function generateNewTicketsAndClients() {
    try {
        // Check if DATABASE_URL is available
        if (!process.env.DATABASE_URL) {
            return { error: 'DATABASE_URL environment variable is not configured. Please configure it in your Vercel project settings (Settings → Environment Variables).' };
        }

        // Get existing stores (try with userId first, then all stores)
        let stores: Array<{ id: string; name: string; userId: string | null }> = [];
        try {
            const session = await auth();
            if (session?.user?.id) {
                stores = await prisma.store.findMany({ where: { userId: session.user.id } });
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (errorMessage.includes('DATABASE_URL') || errorMessage.includes('Environment variable not found')) {
                return { error: 'Database connection not configured. Please check your DATABASE_URL environment variable in Vercel project settings (Settings → Environment Variables).' };
            }
            console.log('Auth check failed, using all stores:', error);
        }
        
        // If no stores found with userId, get all stores
        if (stores.length === 0) {
            try {
                stores = await prisma.store.findMany();
            } catch (error) {
                console.error('Error fetching stores:', error);
                const errorMessage = error instanceof Error ? error.message : String(error);
                if (errorMessage.includes('DATABASE_URL') || errorMessage.includes('Environment variable not found')) {
                    return { error: 'Database connection not configured. Please check your DATABASE_URL environment variable in Vercel project settings (Settings → Environment Variables).' };
                }
                return { error: `Error fetching stores: ${errorMessage}` };
            }
        }
        
        if (stores.length === 0) {
            return { error: 'No stores found. Please create a store first.' };
        }

        // Get existing terminals
        let terminals = [];
        try {
            terminals = await prisma.posTerminal.findMany({
                where: { storeId: { in: stores.map(s => s.id) } },
            });
        } catch (error) {
            console.error('Error fetching terminals:', error);
            return { error: `Error fetching terminals: ${error instanceof Error ? error.message : 'Unknown error'}` };
        }
        
        if (terminals.length === 0) {
            return { error: 'No terminals found. Please create a terminal first.' };
        }

        // Get existing customers or create new ones
        let existingCustomers: Array<{ id: string; firstName: string; lastName: string; email: string }> = [];
        try {
            existingCustomers = await prisma.customer.findMany();
        } catch (error) {
            console.error('Error fetching existing customers:', error);
            // Continue anyway, we'll create new ones
        }
        const customers = [...existingCustomers];

        // Create 5-10 new customers
        const newCustomersCount = randomInt(5, 10);
        let createdCustomers = 0;
        for (let i = 0; i < newCustomersCount; i++) {
            try {
                const firstName = randomChoice(firstNames);
                const lastName = randomChoice(lastNames);
                const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${Math.random().toString(36).substring(2, 5)}@swiim.client`;
                const customer = await prisma.customer.create({
                    data: {
                        firstName,
                        lastName,
                        email,
                    },
                });
                customers.push(customer);
                createdCustomers++;
            } catch (error) {
                console.error(`Error creating customer ${i + 1}:`, error);
                // Continue with next customer
            }
        }

        // Create 20-30 new receipts
        const now = new Date();
        const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // Last 7 days

        const receiptsCount = randomInt(20, 30);
        const statuses: Array<'EMIS' | 'RECLAME' | 'REMBOURSE' | 'ANNULE'> = ['EMIS', 'RECLAME', 'REMBOURSE', 'ANNULE'];
        const statusWeights = [0.7, 0.15, 0.1, 0.05]; // Most are EMIS

        let createdReceipts = 0;
        for (let i = 0; i < receiptsCount; i++) {
            try {
                const store = randomChoice(stores);
                const storeTerminals = terminals.filter(t => t.storeId === store.id);
                if (storeTerminals.length === 0) {
                    // Skip this iteration if no terminals for this store
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

                await prisma.receipt.create({
                    data: {
                        posId: terminal.id,
                        storeId: store.id,
                        customerId: customer?.id,
                        status,
                        totalAmount: subtotal,
                        currency: 'EUR',
                        createdAt: receiptDate,
                        lineItems: {
                            create: lineItems,
                        },
                    },
                });
                createdReceipts++;
            } catch (error) {
                console.error(`Error creating receipt ${i + 1}:`, error);
                // Continue with next receipt
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
