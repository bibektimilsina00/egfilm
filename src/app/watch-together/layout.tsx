import { Metadata } from 'next'
import { generateWatchTogetherMetadata } from '@/lib/seo'

type Props = {
    searchParams: Promise<{ room?: string }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
    const params = await searchParams
    return generateWatchTogetherMetadata(params.room)
}

export default function WatchTogetherLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
