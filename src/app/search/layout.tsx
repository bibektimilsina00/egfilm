import { Metadata } from 'next'
import { generateSearchMetadata } from '@/lib/seo'

interface SearchLayoutProps {
    searchParams: Promise<{ q?: string }>
}

export async function generateMetadata({ searchParams }: SearchLayoutProps): Promise<Metadata> {
    const params = await searchParams
    return generateSearchMetadata(params.q)
}

export default function SearchLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
