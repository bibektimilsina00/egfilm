import { createAuth, registerUser, getUserByEmail } from '@egfilm/auth/server';

const { handlers, auth, signIn, signOut } = createAuth({
    signInPage: '/login',
    protectedPaths: ['/dashboard', '/watchlist', '/watch-party'],
});

export { handlers, auth, signIn, signOut, registerUser, getUserByEmail };
