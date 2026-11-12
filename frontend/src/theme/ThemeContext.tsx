import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { normalizeHex } from '../utils/accent'

export type Theme = 'light' | 'dark'

export const ACCENT_PRESETS = [
  { id: 'ocean', label: 'Ocean', value: '#0e7490' },
  { id: 'teal', label: 'Teal', value: '#0f8f78' },
  { id: 'forest', label: 'Forest', value: '#2f6b3b' },
  { id: 'sunset', label: 'Sunset', value: '#c45c26' },
  { id: 'violet', label: 'Violet', value: '#6b5b95' },
  { id: 'rose', label: 'Rose', value: '#b42318' },
] as const

export const DEFAULT_ACCENT = ACCENT_PRESETS[0].value

interface ThemeContextValue {
  theme: Theme
  accent: string
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
  setAccent: (accent: string) => void
}

const THEME_KEY = 'ttb-theme'
const ACCENT_KEY = 'ttb-accent'
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

function readStoredTheme(): Theme | null {
  const stored = localStorage.getItem(THEME_KEY)
  return stored === 'light' || stored === 'dark' ? stored : null
}

function readStoredAccent(): string {
  const stored = localStorage.getItem(ACCENT_KEY)
  return stored ? normalizeHex(stored) ?? DEFAULT_ACCENT : DEFAULT_ACCENT
}

function getSystemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme)
}

function applyAccent(accent: string) {
  const root = document.documentElement
  root.style.setProperty('--accent', accent)
  root.style.setProperty('--accent-deep', `color-mix(in srgb, ${accent} 72%, black)`)
  root.style.setProperty('--accent-soft', `color-mix(in srgb, ${accent} 18%, transparent)`)
  root.style.setProperty('--bg-1', `color-mix(in srgb, ${accent} 16%, transparent)`)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') {
      return 'light'
    }
    const initial = readStoredTheme() ?? getSystemTheme()
    applyTheme(initial)
    return initial
  })

  const [accent, setAccentState] = useState<string>(() => {
    if (typeof window === 'undefined') {
      return DEFAULT_ACCENT
    }
    const initial = readStoredAccent()
    applyAccent(initial)
    return initial
  })

  useEffect(() => {
    applyTheme(theme)
    applyAccent(accent)
  }, [theme, accent])

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (event: MediaQueryListEvent) => {
      if (!readStoredTheme()) {
        setThemeState(event.matches ? 'dark' : 'light')
      }
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  const setTheme = useCallback((next: Theme) => {
    localStorage.setItem(THEME_KEY, next)
    setThemeState(next)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const next = current === 'light' ? 'dark' : 'light'
      localStorage.setItem(THEME_KEY, next)
      return next
    })
  }, [])

  const setAccent = useCallback((next: string) => {
    const normalized = normalizeHex(next)
    if (!normalized) {
      return
    }
    localStorage.setItem(ACCENT_KEY, normalized)
    setAccentState(normalized)
  }, [])

  const value = useMemo(
    () => ({ theme, accent, toggleTheme, setTheme, setAccent }),
    [theme, accent, toggleTheme, setTheme, setAccent],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
