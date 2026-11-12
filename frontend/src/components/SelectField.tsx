import { useEffect, useId, useRef, useState } from 'react'
import { ChevronIcon } from './icons'

export interface SelectOption {
  value: string
  label: string
}

interface SelectFieldProps {
  id?: string
  label: string
  value: string
  options: SelectOption[]
  disabled?: boolean
  placeholder?: string
  onChange: (value: string) => void
}

export function SelectField({
  id,
  label,
  value,
  options,
  disabled = false,
  placeholder = 'Select…',
  onChange,
}: SelectFieldProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()
  const fieldId = id ?? listId

  const selected = options.find((option) => option.value === value)

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
        event.preventDefault()
        event.stopPropagation()
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown, true)
    }
  }, [open])

  useEffect(() => {
    if (disabled) {
      setOpen(false)
    }
  }, [disabled])

  return (
    <div className={`field select-field${open ? ' is-open' : ''}${disabled ? ' is-disabled' : ''}`} ref={rootRef}>
      <label id={`${fieldId}-label`} htmlFor={fieldId}>
        {label}
      </label>

      <button
        id={fieldId}
        type="button"
        className="select-field__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${fieldId}-label`}
        aria-controls={listId}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
      >
        <span className={selected ? undefined : 'select-field__placeholder'}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronIcon className="select-field__chevron" />
      </button>

      {open && !disabled ? (
        <ul className="select-field__menu" id={listId} role="listbox" aria-labelledby={`${fieldId}-label`}>
          {options.map((option) => {
            const isActive = option.value === value
            return (
              <li key={option.value} role="presentation">
                <button
                  type="button"
                  className={`select-field__option${isActive ? ' is-active' : ''}`}
                  role="option"
                  aria-selected={isActive}
                  onClick={() => {
                    onChange(option.value)
                    setOpen(false)
                  }}
                >
                  {option.label}
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
