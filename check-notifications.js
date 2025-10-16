const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkNotifications() {
    try {
        console.log('\n📬 Checking Notifications...\n');

        const notifications = await prisma.notification.findMany({
            include: {
                fromUser: {
                    select: { name: true, email: true }
                },
                toUser: {
                    select: { name: true, email: true }
                }
            }
        });

        console.log(`Found ${notifications.length} notifications:\n`);

        notifications.forEach((n, i) => {
            console.log(`${i + 1}. ${n.type} - ${n.title}`);
            console.log(`   From: ${n.fromUser.name} (${n.fromUser.email})`);
            console.log(`   To: ${n.toUser.name} (${n.toUser.email})`);
            console.log(`   Message: ${n.message}`);
            console.log(`   Room Code: ${n.roomCode || 'N/A'}`);
            console.log(`   Read: ${n.isRead}`);
            console.log(`   Created: ${n.createdAt}`);
            console.log('');
        });

        console.log('\n👥 Checking Users...\n');

        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                _count: {
                    select: {
                        sentNotifications: true,
                        receivedNotifications: true
                    }
                }
            }
        });

        users.forEach((u) => {
            console.log(`- ${u.name} (${u.email})`);
            console.log(`  ID: ${u.id}`);
            console.log(`  Sent: ${u._count.sentNotifications}, Received: ${u._count.receivedNotifications}`);
            console.log('');
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkNotifications();
