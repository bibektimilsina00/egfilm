import { Metadata } from 'next'
import { generateBlogListMetadata } from '@/lib/seo'

type Props = {
    searchParams?: Promise<{ page?: string; category?: string; tag?: string }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
    const params = searchParams ? await searchParams : {}
    const page = params.page ? parseInt(params.page) : 1
    return generateBlogListMetadata(page, params.category, params.tag)
}

export default function BlogLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
