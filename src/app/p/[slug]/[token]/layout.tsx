import type { Metadata } from 'next'
import PwaHeadLinks from '@/components/app/PwaHeadLinks'
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

  return {
    appleWebApp: {
      capable: true,
      title: practice?.name ?? 'Effinic',
    },
  }
}

export default async function NursePracticeLayout({
  children,
  params,
}: LayoutProps) {
  const { slug, token } = await params
  const manifestPath = `/p/${slug}/${token}/manifest.webmanifest`

  return (
    <>
      <PwaHeadLinks manifestHref={manifestPath} />
      {children}
    </>
  )
}
