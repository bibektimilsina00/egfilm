import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Validate DATABASE_URL exists (skip during build time)
const isBuilding = process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL;

if (!process.env.DATABASE_URL && !isBuilding) {
    throw new Error(
        '❌ DATABASE_URL is not defined. Please check your .env.local or .env file.\n' +
        'Expected format: postgresql://user:password@host:port/database'
    );
}

export const prisma =
    globalForPrisma.prisma ||
    (process.env.DATABASE_URL ? new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    }) : {} as PrismaClient);

if (process.env.NODE_ENV !== 'production' && process.env.DATABASE_URL) {
    globalForPrisma.prisma = prisma;
}

export default prisma;
