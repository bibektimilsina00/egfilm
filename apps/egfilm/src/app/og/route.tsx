import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const title = searchParams.get('title') || 'Egfilm'
    const subtitle = searchParams.get('subtitle') || 'Discover Movies & TV Shows'

    return new ImageResponse(
        (
            <div
                style={{
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#000000',
                    backgroundImage: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 120,
                        height: 120,
                        borderRadius: '50%',
                        backgroundColor: '#3b82f6',
                        marginBottom: 40,
                    }}
                >
                    <svg
                        width="60"
                        height="60"
                        viewBox="0 0 24 24"
                        fill="white"
                        style={{ marginLeft: 4 }}
                    >
                        <path d="M8 5v14l11-7z" />
                    </svg>
                </div>

                <h1
                    style={{
                        fontSize: 60,
                        fontWeight: 'bold',
                        color: 'white',
                        textAlign: 'center',
                        margin: '0 40px 20px 40px',
                        lineHeight: 1.1,
                    }}
                >
                    {title}
                </h1>

                <p
                    style={{
                        fontSize: 28,
                        color: '#9ca3af',
                        textAlign: 'center',
                        margin: '0 40px',
                        lineHeight: 1.4,
                    }}
                >
                    {subtitle}
                </p>

                <div
                    style={{
                        position: 'absolute',
                        bottom: 40,
                        right: 40,
                        fontSize: 20,
                        color: '#6b7280',
                    }}
                >
                    Egfilm
                </div>
            </div>
        ),
        {
            width: 1200,
            height: 630,
        }
    )
}