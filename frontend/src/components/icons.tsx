import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

function baseProps(props: IconProps): IconProps {
  return {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
    ...props,
  }
}

export function ViewIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12s-3.5 6.5-9.5 6.5S2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  )
}

export function HideIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6a2.5 2.5 0 0 0 3.5 3.5" />
      <path d="M9.9 5.1A10.4 10.4 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16.8 16.8 0 0 1-3.2 3.6" />
      <path d="M6.1 6.1C3.9 7.8 2.5 12 2.5 12S6 18.5 12 18.5c1.1 0 2.1-.2 3-.5" />
    </svg>
  )
}

export function EditIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
    </svg>
  )
}

export function DeleteIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  )
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </svg>
  )
}

export function SunIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2.2" />
      <path d="M12 19.8V22" />
      <path d="M4.9 4.9l1.6 1.6" />
      <path d="M17.5 17.5l1.6 1.6" />
      <path d="M2 12h2.2" />
      <path d="M19.8 12H22" />
      <path d="M4.9 19.1l1.6-1.6" />
      <path d="M17.5 6.5l1.6-1.6" />
    </svg>
  )
}

export function MoonIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M21 14.5A8.5 8.5 0 0 1 9.5 3 7 7 0 1 0 21 14.5Z" />
    </svg>
  )
}

export function LogoutIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M10 7V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2v-2" />
      <path d="M15 12H3" />
      <path d="M7 8l-4 4 4 4" />
    </svg>
  )
}

export function PaletteIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M12 3a9 9 0 0 0 0 18h1.2a2.3 2.3 0 0 0 2.2-2.8 2.2 2.2 0 0 1 2.1-2.7H18a3 3 0 0 0 0-6h-.3A9 9 0 0 0 12 3Z" />
      <circle cx="7.5" cy="10" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="10.5" cy="7.2" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="14.2" cy="7.8" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="8.8" cy="13.2" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function ChevronIcon(props: IconProps) {
  return (
    <svg {...baseProps({ width: 16, height: 16, ...props })}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}
