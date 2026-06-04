interface IconProps {
  size?: number
  className?: string
}

export function AppleLogo({ size = 24, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  )
}

export function AndroidLogo({ size = 24, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.523 15.341a1 1 0 01-1-1v-4.682a1 1 0 012 0v4.682a1 1 0 01-1 1m-11.046 0a1 1 0 01-1-1v-4.682a1 1 0 012 0v4.682a1 1 0 01-1 1M7.021 8.114l-1.3-2.244a.25.25 0 01.432-.25l1.316 2.274A7.584 7.584 0 0112 7.063c1.497 0 2.891.43 4.031 1.171l1.315-2.274a.25.25 0 01.432.25l-1.3 2.244A7.545 7.545 0 0119.5 14.5H4.5a7.545 7.545 0 012.521-6.386M9.5 11.5a1 1 0 100 2 1 1 0 000-2m5 0a1 1 0 100 2 1 1 0 000-2" />
    </svg>
  )
}

export function SamsungLogo({ size = 24, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.5 7.5h-1.75v-.75c0-.414-.336-.75-.75-.75h-4c-.414 0-.75.336-.75.75V11c0 .414.336.75.75.75h3.25c1.105 0 2 .895 2 2v1.5c0 1.105-.895 2-2 2h-4c-1.105 0-2-.895-2-2v-.75h1.75v.75c0 .414.336.75.75.75h3.5c.414 0 .75-.336.75-.75v-1.5c0-.414-.336-.75-.75-.75H9.5c-1.105 0-2-.895-2-2V9.5c0-1.105.895-2 2-2h4c1.105 0 2 .895 2 2v1z"/>
    </svg>
  )
}

export function PhoneCaseLogo({ size = 24, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <rect x="5" y="2" width="14" height="20" rx="3" />
      <rect x="3" y="5" width="18" height="14" rx="2" strokeDasharray="2 2" />
      <circle cx="12" cy="18.5" r="1" fill="currentColor" stroke="none"/>
    </svg>
  )
}

export function ScreenProtectorLogo({ size = 24, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="M12 2l8 4v6c0 4.4-3.4 8.5-8 10-4.6-1.5-8-5.6-8-10V6l8-4z" />
      <path d="M8.5 12l2.5 2.5 4.5-4.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function ChargerLogo({ size = 24, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M11.5 2L7 13h4l-.5 9 9-12h-5l1.5-8z"/>
    </svg>
  )
}

export function WrenchToolsLogo({ size = 24, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function MotorolaLogo({ size = 24, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.93 0 3.68.72 5.01 1.9L7.9 16.99A6.947 6.947 0 015 12c0-3.87 3.13-7 7-7zm0 14c-1.93 0-3.68-.72-5.01-1.9l9.11-9.09A6.947 6.947 0 0119 12c0 3.87-3.13 7-7 7z"/>
    </svg>
  )
}

// Retorna o ícone correto baseado na marca
export function BrandIcon({ brand, size = 20, className = '' }: { brand: string; size?: number; className?: string }) {
  const b = brand.toLowerCase()
  if (b.includes('apple') || b.includes('iphone')) return <AppleLogo size={size} className={className} />
  if (b.includes('samsung')) return <SamsungLogo size={size} className={className} />
  if (b.includes('motorola') || b.includes('moto')) return <MotorolaLogo size={size} className={className} />
  if (b.includes('android') || b.includes('google')) return <AndroidLogo size={size} className={className} />
  return <PhoneCaseLogo size={size} className={className} />
}
