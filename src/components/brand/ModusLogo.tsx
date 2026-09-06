import type { CSSProperties } from 'react'

interface SymbolProps {
  size?: number
  className?: string
}

export function ModusSymbol({ size = 44, className }: SymbolProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      height={size}
      viewBox="0 0 64 64"
      width={size}
      fill="none"
    >
      <rect x="1" y="1" width="62" height="62" rx="19" fill="#0D211B" stroke="#315E4D" strokeWidth="2" />
      <path d="M15 47V19" stroke="#79E2AD" strokeWidth="9" strokeLinecap="round" />
      <path d="M19 20L32 37" stroke="#C9F7DF" strokeWidth="9" strokeLinecap="round" />
      <path d="M32 37L45 20" stroke="#9DECC2" strokeWidth="9" strokeLinecap="round" />
      <path d="M49 19V47" stroke="#57D697" strokeWidth="9" strokeLinecap="round" />
    </svg>
  )
}

interface LogoProps extends SymbolProps {
  descriptor?: string
  light?: boolean
  style?: CSSProperties
}

export function ModusLogo({ size = 44, descriptor = 'OPERAÇÃO DIGITAL', light = false, className, style }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-3 ${className ?? ''}`} style={style} aria-label={`MODUS — ${descriptor}`}>
      <ModusSymbol size={size} />
      <span className="flex min-w-0 flex-col leading-none">
        <span className={`font-display text-[1.18rem] font-bold tracking-[-0.035em] ${light ? 'text-[#0B1B16]' : 'text-[#F4FAF6]'}`}>
          MODUS
        </span>
        {descriptor && (
          <span className={`mt-1.5 text-[0.56rem] font-semibold uppercase tracking-[0.2em] ${light ? 'text-[#477060]' : 'text-[#86B99F]'}`}>
            {descriptor}
          </span>
        )}
      </span>
    </span>
  )
}
