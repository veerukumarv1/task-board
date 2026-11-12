import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SelectField } from './SelectField'

afterEach(() => {
  cleanup()
})

describe('SelectField', () => {
  const options = [
    { value: 'todo', label: 'To do' },
    { value: 'done', label: 'Done' },
  ]

  it('shows the selected label', () => {
    render(
      <SelectField
        label="Status"
        value="todo"
        options={options}
        onChange={() => undefined}
      />,
    )

    expect(screen.getByRole('button', { name: /status/i }).textContent).toContain('To do')
  })

  it('opens options and reports selection', () => {
    const onChange = vi.fn()

    render(
      <SelectField
        label="Status"
        value="todo"
        options={options}
        onChange={onChange}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /status/i }))
    fireEvent.click(screen.getByRole('option', { name: 'Done' }))

    expect(onChange).toHaveBeenCalledWith('done')
  })

  it('does not open when disabled', () => {
    render(
      <SelectField
        label="Status"
        value="todo"
        options={options}
        disabled
        onChange={() => undefined}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /status/i }))
    expect(screen.queryByRole('listbox')).toBeNull()
  })
})
