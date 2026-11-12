import { describe, expect, it } from 'vitest'
import { getInitials } from './initials'

describe('getInitials', () => {
  it('returns two letters from a full name', () => {
    expect(getInitials('Alice Nguyen')).toBe('AN')
  })

  it('uses the first two characters of a single name', () => {
    expect(getInitials('Alice')).toBe('AL')
  })

  it('ignores extra whitespace', () => {
    expect(getInitials('  Bob   Martinez  ')).toBe('BM')
  })

  it('returns a fallback for empty input', () => {
    expect(getInitials('')).toBe('?')
    expect(getInitials('   ')).toBe('?')
  })
})
