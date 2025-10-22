/**
 * Script to make a user an admin
 * Usage: npx tsx scripts/make-admin.ts <email>
 */

// @ts-expect-error - Prisma client types
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function makeAdmin() {
    const email = process.argv[2];

    if (!email) {
        console.error('❌ Please provide an email address');
        console.log('Usage: npx tsx scripts/make-admin.ts <email>');
        process.exit(1);
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            console.error(`❌ User with email "${email}" not found`);
            process.exit(1);
        }

        if (user.role === 'admin') {
            console.log(`✅ User "${email}" is already an admin`);
            process.exit(0);
        }

        await prisma.user.update({
            where: { email },
            data: { role: 'admin' },
        });

        console.log(`✅ Successfully made "${email}" an admin`);
        console.log(`\nYou can now access the admin panel at /admin`);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

makeAdmin();
