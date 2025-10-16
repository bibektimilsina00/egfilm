import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

// Initialize database with default demo user
async function initializeDefaultUser() {
    try {
        const existingUser = await prisma.user.findUnique({
            where: { email: 'demo@example.com' }
        });

        if (!existingUser) {
            await prisma.user.create({
                data: {
                    email: 'demo@example.com',
                    password: bcrypt.hashSync('demo123', 10),
                    name: 'Demo User',
                }
            });
            console.log('✅ Default demo user created');
        }
    } catch (error) {
        console.error('Error initializing default user:', error);
    }
}

// Initialize on module load
initializeDefaultUser();

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            async authorize(credentials) {
                const email = credentials.email as string;
                const password = credentials.password as string;

                const user = await prisma.user.findUnique({
                    where: { email }
                });

                if (!user) {
                    return null;
                }

                const passwordsMatch = await bcrypt.compare(password, user.password);

                if (passwordsMatch) {
                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                    };
                }

                return null;
            },
        }),
    ],
    session: {
        strategy: 'jwt',
    },
});

// Helper function to register a new user
export async function registerUser(email: string, password: string, name: string) {
    const existingUser = await prisma.user.findUnique({
        where: { email }
    });

    if (existingUser) {
        throw new Error('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            name,
        }
    });

    return { id: newUser.id, email: newUser.email, name: newUser.name };
}

// Helper to get user by email
export async function getUserByEmail(email: string) {
    const user = await prisma.user.findUnique({
        where: { email },
        select: {
            id: true,
            email: true,
            name: true,
        }
    });

    return user;
}
