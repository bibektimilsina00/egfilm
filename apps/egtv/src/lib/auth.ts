import { createAuth, registerUser, getUserByEmail } from '@egfilm/auth/server';

const { handlers, auth, signIn, signOut } = createAuth({
    signInPage: '/login',
    protectedPaths: ['/favorites'],
});

export { handlers, auth, signIn, signOut, registerUser, getUserByEmail };
