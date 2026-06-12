import type { Metadata } from 'next'

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
  return {
    manifest: `/api/manifest/practice/${slug}/${token}`,
  }
}

export default function NursePracticeLayout({ children }: LayoutProps) {
  return children
}
