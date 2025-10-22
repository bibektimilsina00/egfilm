import { Metadata } from 'next'
import { generateSearchMetadata } from '@/lib/seo'

type Props = {
    searchParams: Promise<{ q?: string }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
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
