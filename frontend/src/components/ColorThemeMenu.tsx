import { useEffect, useId, useRef, useState } from 'react'
import { ACCENT_PRESETS, useTheme } from '../theme/ThemeContext'
import { IconButton } from './IconButton'
import { PaletteIcon } from './icons'

export function ColorThemeMenu() {
  const { accent, setAccent } = useTheme()
  const [open, setOpen] = useState(false)
  const [custom, setCustom] = useState(accent)
  const rootRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  useEffect(() => {
    setCustom(accent)
  }, [accent])

  useEffect(() => {
    if (!open) {
      return
    }

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div className={`color-theme${open ? ' is-open' : ''}`} ref={rootRef}>
      <IconButton
        label="Choose color theme"
        className="theme-toggle"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((current) => !current)}
      >
        <PaletteIcon />
      </IconButton>

      {open ? (
        <div className="color-theme__dropdown" id={menuId} role="menu">
          <div className="color-theme__heading">Color theme</div>
          <p className="color-theme__hint">Pick a preset or choose any accent color.</p>

          <div className="color-theme__presets" role="group" aria-label="Accent presets">
            {ACCENT_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={`color-swatch${accent === preset.value ? ' is-active' : ''}`}
                style={{ background: preset.value }}
                aria-label={preset.label}
                title={preset.label}
                role="menuitemradio"
                aria-checked={accent === preset.value}
                onClick={() => setAccent(preset.value)}
              />
            ))}
          </div>

          <label className="color-theme__custom" htmlFor="custom-accent">
            <span>Custom color</span>
            <span className="color-theme__custom-controls">
              <input
                id="custom-accent"
                type="color"
                value={custom}
                onChange={(event) => {
                  setCustom(event.target.value)
                  setAccent(event.target.value)
                }}
              />
              <input
                type="text"
                value={custom}
                onChange={(event) => setCustom(event.target.value)}
                onBlur={() => setAccent(custom)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    setAccent(custom)
                  }
                }}
                aria-label="Custom accent hex"
                spellCheck={false}
              />
            </span>
          </label>
        </div>
      ) : null}
    </div>
  )
}
