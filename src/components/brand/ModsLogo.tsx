import Image from 'next/image'

interface Props {
  width?: number
  className?: string
  priority?: boolean
}

export function ModsLogo({ width = 150, className, priority = false }: Props) {
  return (
    <Image
      src="/brand/mods/wordmark-light.svg"
      alt="MODS"
      width={width}
      height={Math.round(width * 128 / 355)}
      className={className}
      priority={priority}
    />
  )
}
