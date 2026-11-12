import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ConfirmDialog } from './ConfirmDialog'

afterEach(() => {
  cleanup()
})

describe('ConfirmDialog', () => {
  it('renders title and message', () => {
    render(
      <ConfirmDialog
        title="Delete task"
        message="This cannot be undone."
        onConfirm={() => undefined}
        onCancel={() => undefined}
      />,
    )

    expect(screen.getByRole('alertdialog')).toBeTruthy()
    expect(screen.getByText('Delete task')).toBeTruthy()
    expect(screen.getByText('This cannot be undone.')).toBeTruthy()
  })

  it('calls onConfirm and onCancel', () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()

    render(
      <ConfirmDialog
        title="Delete task"
        message="Remove it?"
        confirmLabel="Delete task"
        cancelLabel="Keep task"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Delete task' }))
    fireEvent.click(screen.getByRole('button', { name: 'Keep task' }))

    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})
