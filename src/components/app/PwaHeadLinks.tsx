type PwaHeadLinksProps = {
  manifestHref: string
}

export default function PwaHeadLinks({ manifestHref }: PwaHeadLinksProps) {
  return <link rel="manifest" href={manifestHref} />
}
