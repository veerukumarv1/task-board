import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { UserMenu } from './UserMenu'

afterEach(() => {
  cleanup()
})

const user = {
  id: 1,
  name: 'Alice Nguyen',
  email: 'alice@acme.test',
  tenant_id: 1,
  tenant: {
    id: 1,
    name: 'Acme Corp',
    slug: 'acme',
  },
}

describe('UserMenu', () => {
  it('shows avatar initials and opens profile details', () => {
    render(<UserMenu user={user} onLogout={() => undefined} />)

    expect(screen.getByRole('button', { name: 'Open account menu' }).textContent).toContain('AN')

    fireEvent.click(screen.getByRole('button', { name: 'Open account menu' }))

    expect(screen.getByText('Alice Nguyen')).toBeTruthy()
    expect(screen.getByText('alice@acme.test')).toBeTruthy()
    expect(screen.getByText('Acme Corp')).toBeTruthy()
  })

  it('calls logout from the menu', () => {
    const onLogout = vi.fn()
    render(<UserMenu user={user} onLogout={onLogout} />)

    fireEvent.click(screen.getByRole('button', { name: 'Open account menu' }))
    fireEvent.click(screen.getByRole('menuitem', { name: /sign out/i }))

    expect(onLogout).toHaveBeenCalledTimes(1)
  })
})
