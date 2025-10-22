/**
 * Script to list all users and their roles
 * Usage: npx tsx scripts/list-users.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listUsers() {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isActive: true,
                isBanned: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        if (users.length === 0) {
            console.log('📭 No users found');
            process.exit(0);
        }

        console.log(`\n👥 Found ${users.length} user(s):\n`);
        console.log('─'.repeat(100));

        users.forEach((user: any, index: number) => {
            const roleEmoji = user.role === 'admin' ? '👑' : user.role === 'moderator' ? '🛡️' : '👤';
            const statusEmoji = user.isBanned ? '🚫' : user.isActive ? '✅' : '⏸️';

            console.log(`${index + 1}. ${roleEmoji} ${user.email}`);
            console.log(`   Name: ${user.name}`);
            console.log(`   Role: ${user.role}`);
            console.log(`   Status: ${statusEmoji} ${user.isBanned ? 'BANNED' : user.isActive ? 'Active' : 'Inactive'}`);
            console.log(`   Created: ${user.createdAt.toLocaleDateString()}`);
            console.log('─'.repeat(100));
        });

        const adminCount = users.filter((u: any) => u.role === 'admin').length;
        const modCount = users.filter((u: any) => u.role === 'moderator').length;
        const userCount = users.filter((u: any) => u.role === 'user').length;

        console.log(`\n📊 Summary:`);
        console.log(`   👑 Admins: ${adminCount}`);
        console.log(`   🛡️  Moderators: ${modCount}`);
        console.log(`   👤 Users: ${userCount}`);
        console.log(`   📝 Total: ${users.length}\n`);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

listUsers();
