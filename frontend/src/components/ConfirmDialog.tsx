import { useEffect } from 'react'
import { IconButton } from './IconButton'
import { CloseIcon } from './icons'

interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'danger' | 'default'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onCancel])

  return (
    <div className="modal-backdrop" onClick={onCancel} role="presentation">
      <div
        className="modal modal--confirm"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal__header">
          <h2 id="confirm-title">{title}</h2>
          <IconButton label="Close" className="modal__close" onClick={onCancel}>
            <CloseIcon />
          </IconButton>
        </div>

        <p id="confirm-message" className="confirm-dialog__message">
          {message}
        </p>

        <div className="confirm-dialog__actions">
          <button className="btn btn--ghost" type="button" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            className={`btn ${tone === 'danger' ? 'btn--danger-solid' : 'btn--primary'}`}
            type="button"
            onClick={onConfirm}
            autoFocus
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
