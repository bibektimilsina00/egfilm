// Minimal declarations for @prisma/client to satisfy TypeScript when Prisma types are not present.
// These are intentionally narrow and only cover the types the codebase imports directly.
// Once you run `npx prisma generate` in the project the real types will be available and you can
// delete this file.
declare module '@prisma/client' {
    // Basic Prisma namespace placeholder
    export namespace Prisma {
        // Basic where input placeholder used in blogService
        export type BlogPostWhereInput = any;
    }

    // Minimal BlogPost shape used in service typings
    export interface BlogPost {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        mediaId: number | null;
        mediaType: string | null;
        title: string;
        mediaTitle: string | null;
        slug: string;
        excerpt: string;
        content: string;
        keywords: string[];
        tags: string[];
        status: string;
        viewCount: number;
        publishedAt: Date | null;
        authorId: string | null;
        // Additional fields used in UI/SEO
        ogImage?: string | null;
        featuredImage: string | null;
        mediaBackdropPath?: string | null;
        mediaPosterPath?: string | null;
        mediaGenres?: string[] | null;
        mediaRating?: number | null;
        mediaOverview?: string | null;
        category: string;
        readingTime: number;
        mediaCast: any[] | null;
        metaTitle?: string | null;
        metaDescription?: string | null;
    }

    // Minimal PrismaClient placeholder to allow imports if necessary elsewhere
    export class PrismaClient {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        constructor(options?: any);
        // Minimal subset used in the project (blogPost crud)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        blogPost: any;
        // Other commonly used models in the project
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        watchRoom: any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        user: any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        watchlist: any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        watchlistItem: any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        continueWatching: any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        notification: any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        blogComment: any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        blogLike: any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        blogGenerationProgress: any;
        // Room participant / chat models
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        roomParticipant: any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        chatMessage: any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        systemNotification: any;
    }

    export { PrismaClient as PrismaClient };
    // Export a loose Prisma namespace/type for imports like `import type { Prisma } from '@prisma/client'`
    export type Prisma = any;
}
