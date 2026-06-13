import NextAuth, { type NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@egfilm/db';
import { createAuthConfig, type AuthFactoryOptions } from './config';

export function createAuth(opts: AuthFactoryOptions = {}) {
    const baseConfig = createAuthConfig(opts);
    const config: NextAuthConfig = {
        ...baseConfig,
        trustHost: true,
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
        session: { strategy: 'jwt' },
    };

    return NextAuth(config);
}

export async function registerUser(email: string, password: string, name: string) {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new Error('User already exists');

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
        data: { email, password: hashedPassword, name },
    });
    return { id: newUser.id, email: newUser.email, name: newUser.name };
}

export async function getUserByEmail(email: string) {
    return prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, name: true },
    });
}
