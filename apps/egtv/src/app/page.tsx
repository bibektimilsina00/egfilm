import Link from 'next/link';
import { getCategories, getChannels } from '@egfilm/services';
import CategoryTile from '@/components/CategoryTile';
import ChannelGrid from '@/components/ChannelGrid';

export const revalidate = 86400;

export default async function Home() {
    const [categories, channels] = await Promise.all([getCategories(), getChannels()]);
    const featured = categories.slice(0, 8);
    const popular = channels.slice(0, 12);

    return (
        <div className="mx-auto max-w-6xl space-y-10 px-4 py-8">
            <section className="space-y-3">
                <h1 className="text-3xl font-bold">Live TV from around the world</h1>
                <p className="text-muted-foreground">Free channels — news, sports, movies, music and more.</p>
                <Link
                    href="/browse"
                    className="inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                    Browse all channels
                </Link>
            </section>
            <section className="space-y-3">
                <h2 className="text-xl font-semibold">Categories</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {featured.map((c) => (
                        <CategoryTile key={c.id} category={c} />
                    ))}
                </div>
            </section>
            <section className="space-y-3">
                <h2 className="text-xl font-semibold">Channels</h2>
                <ChannelGrid channels={popular} />
            </section>
        </div>
    );
}
