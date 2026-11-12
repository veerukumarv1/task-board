import { useTheme } from '../theme/ThemeContext'
import { IconButton } from './IconButton'
import { MoonIcon, SunIcon } from './icons'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const next = theme === 'light' ? 'dark' : 'light'

  return (
    <IconButton
      label={`Switch to ${next} mode`}
      className="theme-toggle"
      onClick={toggleTheme}
    >
      {theme === 'light' ? <MoonIcon /> : <SunIcon />}
    </IconButton>
  )
}
