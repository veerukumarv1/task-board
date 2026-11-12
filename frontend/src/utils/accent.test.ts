import { describe, expect, it } from 'vitest'
import { normalizeHex } from './accent'

describe('normalizeHex', () => {
  it('accepts full hex colors', () => {
    expect(normalizeHex('#0E7490')).toBe('#0e7490')
  })

  it('expands short hex colors', () => {
    expect(normalizeHex('#0af')).toBe('#00aaff')
  })

  it('trims whitespace', () => {
    expect(normalizeHex('  #abc  ')).toBe('#aabbcc')
  })

  it('rejects invalid values', () => {
    expect(normalizeHex('blue')).toBeNull()
    expect(normalizeHex('#gg0000')).toBeNull()
    expect(normalizeHex('#1234')).toBeNull()
  })
})
