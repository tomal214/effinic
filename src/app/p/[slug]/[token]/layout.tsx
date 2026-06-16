import type { Metadata } from 'next'
import { getPracticeBySlugToken } from '@/lib/auth/practice'

type LayoutProps = {
  children: React.ReactNode
  params: Promise<{ slug: string; token: string }>
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; token: string }>
}): Promise<Metadata> {
  const { slug, token } = await params
  const practice = await getPracticeBySlugToken(slug, token)
  const manifestPath = `/p/${slug}/${token}/manifest.webmanifest`

  return {
    manifest: manifestPath,
    appleWebApp: {
      capable: true,
      title: practice?.name ?? 'Effinic',
    },
    other: {
      'mobile-web-app-capable': 'yes',
    },
  }
}

export default function NursePracticeLayout({ children }: LayoutProps) {
  return children
}
