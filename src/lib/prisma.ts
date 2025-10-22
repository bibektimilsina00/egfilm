// @ts-expect-error - Prisma client types
import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Validate DATABASE_URL exists
if (!process.env.DATABASE_URL) {
    throw new Error(
        '❌ DATABASE_URL is not defined. Please check your .env.local or .env file.\n' +
        'Expected format: postgresql://user:password@host:port/database'
    );
}

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
