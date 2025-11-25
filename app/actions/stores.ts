'use server'

import { retryWithFreshClient } from '@/lib/prisma'
import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'

export async function createDemoStores() {
  try {
    // Vérifier s'il y a déjà des magasins
    const existingStores = await retryWithFreshClient(async (prisma: PrismaClient) => {
      return await prisma.store.findMany()
    })
    if (existingStores.length > 0) {
      return {
        success: false,
        message: `Il existe déjà ${existingStores.length} magasin(s) dans la base de données.`,
      }
    }

    // Créer des magasins de démonstration
    const stores = await retryWithFreshClient(async (prisma: PrismaClient) => {
      return await Promise.all([
        prisma.store.create({
        data: {
          name: 'FNAC Bastille',
          city: 'Paris',
          address: '4 Place de la Bastille, 75011 Paris',
        },
      }),
      prisma.store.create({
        data: {
          name: 'FNAC La Défense',
          city: 'Puteaux',
          address: 'CNIT, La Défense, 92000 Puteaux',
        },
      }),
      prisma.store.create({
        data: {
          name: 'FNAC Ternes',
          city: 'Paris',
          address: '26-30 Avenue des Ternes, 75017 Paris',
        },
      }),
      prisma.store.create({
        data: {
          name: 'FNAC Lyon Part-Dieu',
          city: 'Lyon',
          address: '85 Rue de la République, 69002 Lyon',
        },
      }),
      ])
    })

    // Revalider la page des magasins
    revalidatePath('/magasins')

    return {
      success: true,
      message: `${stores.length} magasin(s) créé(s) avec succès !`,
      stores,
    }
  } catch (error) {
    console.error('Error creating demo stores:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erreur lors de la création des magasins',
    }
  }
}

