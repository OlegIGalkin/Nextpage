import { describe, expect, it } from 'vitest'
import { formatQueryMessage, formatSourceBlock } from '../src/shared/format'

describe('formatSourceBlock', () => {
  it('formats url, quoted title, and quoted snippet', () => {
    expect(formatSourceBlock('Example Page', 'A short description from the SERP.', 'https://example.com/page'))
      .toBe(
        '\nUse the following source: https://example.com/page\nSource Title: "Example Page"\nSource Snippet: "A short description from the SERP."\n'
      )
  })

  it('omits the snippet line when the snippet is empty', () => {
    expect(formatSourceBlock('Example Page', '   ', 'https://example.com/page')).toBe(
      '\nUse the following source: https://example.com/page\nSource Title: "Example Page"\n'
    )
  })

  it('collapses whitespace in title and snippet', () => {
    expect(formatSourceBlock('  Example\n  Page  ', 'A  short\ndescription', 'https://example.com')).toBe(
      '\nUse the following source: https://example.com\nSource Title: "Example Page"\nSource Snippet: "A short description"\n'
    )
  })

  it('falls back to Source when the title is blank', () => {
    expect(formatSourceBlock('  ', 'Hello', 'https://example.com')).toBe(
      '\nUse the following source: https://example.com\nSource Title: "Source"\nSource Snippet: "Hello"\n'
    )
  })

  it('uses Russian format strings when language is ru', () => {
    expect(formatSourceBlock('Example Page', 'A short description', 'https://example.com', 'ru')).toBe(
      '\nИспользуй следующий источник: https://example.com\nНазвание источника: "Example Page"\nФрагмент источника: "A short description"\n'
    )
  })

  it('uses the Russian fallback title when the title is blank', () => {
    expect(formatSourceBlock('  ', 'Hello', 'https://example.com', 'ru')).toBe(
      '\nИспользуй следующий источник: https://example.com\nНазвание источника: "Источник"\nФрагмент источника: "Hello"\n'
    )
  })

  it('falls back to English for an unknown language', () => {
    expect(formatSourceBlock('Example Page', 'Hello', 'https://example.com', 'xx')).toBe(
      '\nUse the following source: https://example.com\nSource Title: "Example Page"\nSource Snippet: "Hello"\n'
    )
  })
})

describe('formatQueryMessage', () => {
  it('formats the search query', () => {
    expect(formatQueryMessage('  best  laptops\n')).toBe('\nMy message to you is: best laptops\n')
  })

  it('returns empty string for a blank query', () => {
    expect(formatQueryMessage('   ')).toBe('')
  })

  it('uses Russian format strings when language is ru', () => {
    expect(formatQueryMessage('best laptops', 'ru')).toBe('\nМоё сообщение тебе: best laptops\n')
  })

  it('falls back to English for an unknown language', () => {
    expect(formatQueryMessage('best laptops', 'xx')).toBe('\nMy message to you is: best laptops\n')
  })
})
