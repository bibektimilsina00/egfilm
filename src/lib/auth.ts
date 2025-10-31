import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

// NOTE: Auto-creation of demo/test users has been removed for security.
// If you need test users in development, create them via a dedicated script or seed file.

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            async authorize(credentials) {
                const email = credentials?.email as string;
                const password = credentials?.password as string;

                if (!email || !password) return null;

                const user = await prisma.user.findUnique({ where: { email } });
                if (!user) return null;

                const passwordsMatch = await bcrypt.compare(password, user.password);
                if (!passwordsMatch) return null;

                return { id: user.id, email: user.email, name: user.name, role: user.role };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            // Add role and id to JWT token on sign in
            if (user) {
                token.role = user.role;
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            // Add role and id to session from JWT token
            if (session.user) {
                session.user.role = token.role as string;
                session.user.id = token.id as string;
            }
            return session;
        },
    },
    session: { strategy: 'jwt' },
});

// Helper function to register a new user
export async function registerUser(email: string, password: string, name: string) {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new Error('User already exists');

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
        data: { email, password: hashedPassword, name },
    });

    return { id: newUser.id, email: newUser.email, name: newUser.name };
}

// Helper to get user by email
export async function getUserByEmail(email: string) {
    const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, name: true },
    });
    return user;
}
