import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import bcrypt from 'bcryptjs';

// This is a simple in-memory user store for demo purposes
// In production, you would use a real database
const users = new Map<string, { id: string; email: string; password: string; name: string }>();

// Create a default user for testing
users.set('demo@example.com', {
    id: '1',
    email: 'demo@example.com',
    password: bcrypt.hashSync('demo123', 10),
    name: 'Demo User',
});

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            async authorize(credentials) {
                const email = credentials.email as string;
                const password = credentials.password as string;

                const user = users.get(email);

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
    if (users.has(email)) {
        throw new Error('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
        id: Date.now().toString(),
        email,
        password: hashedPassword,
        name,
    };

    users.set(email, newUser);
    return { id: newUser.id, email: newUser.email, name: newUser.name };
}

// Helper to get user by email
export function getUserByEmail(email: string) {
    const user = users.get(email);
    if (user) {
        return { id: user.id, email: user.email, name: user.name };
    }
    return null;
}
