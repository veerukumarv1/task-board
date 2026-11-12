import { useEffect, useId, useRef, useState } from 'react'
import type { User } from '../types'
import { getInitials } from '../utils/initials'
import { LogoutIcon } from './icons'

interface UserMenuProps {
  user: User
  onLogout: () => void
}

export function UserMenu({ user, onLogout }: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

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
    <div className={`user-menu${open ? ' is-open' : ''}`} ref={rootRef}>
      <button
        type="button"
        className="user-avatar"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label="Open account menu"
        onClick={() => setOpen((current) => !current)}
      >
        <span aria-hidden="true">{getInitials(user.name)}</span>
      </button>

      {open ? (
        <div className="user-menu__dropdown" id={menuId} role="menu">
          <div className="user-menu__profile">
            <div className="user-avatar user-avatar--static" aria-hidden="true">
              {getInitials(user.name)}
            </div>
            <div className="user-menu__meta">
              <strong>{user.name}</strong>
              <span>{user.email}</span>
              {user.tenant?.name ? (
                <em>{user.tenant.name}</em>
              ) : null}
            </div>
          </div>

          <button
            type="button"
            className="user-menu__item"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              onLogout()
            }}
          >
            <LogoutIcon />
            <span>Sign out</span>
          </button>
        </div>
      ) : null}
    </div>
  )
}
