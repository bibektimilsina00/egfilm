import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

/**
 * Loading skeleton for media cards in grids
 */
export function MediaCardSkeleton() {
  return (
    <Card className="bg-gray-900/50 border-gray-800 overflow-hidden py-0 gap-0">
      <div className="aspect-[2/3] relative">
        <Skeleton className="w-full h-full bg-gray-800" />
      </div>
    </Card>
  );
}

/**
 * Loading skeleton for media grid sections
 */
export function MediaGridSkeleton({
  title = '',
  count = 12
}: {
  title?: string;
  count?: number;
}) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <Skeleton className="w-6 h-6 bg-gray-800" />
        {title ? (
          <h2 className="text-2xl md:text-3xl font-bold text-white">{title}</h2>
        ) : (
          <Skeleton className="h-8 w-48 bg-gray-800" />
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Array.from({ length: count }, (_, i) => (
          <MediaCardSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}

/**
 * Loading skeleton for hero section
 */
export function HeroSkeleton() {
  return (
    <section className="relative h-[70vh] md:h-[80vh] flex items-end">
      <div className="absolute inset-0">
        <Skeleton className="w-full h-full bg-gray-800" />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-transparent to-transparent" />
      </div>

      <div className="relative container mx-auto px-4 pb-16 md:pb-24 z-10">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="w-5 h-5 bg-gray-700" />
            <Skeleton className="h-4 w-32 bg-gray-700" />
          </div>

          <Skeleton className="h-12 md:h-16 w-full max-w-lg mb-4 bg-gray-700" />
          <div className="space-y-2 mb-6">
            <Skeleton className="h-4 w-full bg-gray-700" />
            <Skeleton className="h-4 w-4/5 bg-gray-700" />
            <Skeleton className="h-4 w-3/5 bg-gray-700" />
          </div>

          <div className="flex flex-wrap gap-4">
            <Skeleton className="h-12 w-32 bg-gray-700" />
            <Skeleton className="h-12 w-32 bg-gray-700" />
            <Skeleton className="h-8 w-24 bg-gray-700" />
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Full page loading skeleton for homepage
 */
export function HomePageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-950">
      <HeroSkeleton />
      <main className="container mx-auto px-4 py-12 space-y-12">
        <MediaGridSkeleton title="Trending Movies" />
        <MediaGridSkeleton title="Trending TV Shows" />
        <MediaGridSkeleton title="Popular Movies" />
        <MediaGridSkeleton title="Top Rated Movies" />
      </main>
    </div>
  );
}