import { describe, expect, it } from 'vitest'
import { isChatProviderUrl, isIdentityProviderUrl } from '../src/shared/oauth-hosts'

describe('isIdentityProviderUrl', () => {
  it('detects Google account OAuth hosts', () => {
    expect(
      isIdentityProviderUrl('https://accounts.google.com/o/oauth2/v2/auth?client_id=abc')
    ).toBe(true)
    expect(isIdentityProviderUrl('https://accounts.google.co.uk/signin')).toBe(true)
    expect(isIdentityProviderUrl('https://accounts.youtube.com/accounts/SetSID')).toBe(true)
  })

  it('detects Google oauth paths on www.google.com', () => {
    expect(isIdentityProviderUrl('https://www.google.com/o/oauth2/v2/auth?client_id=abc')).toBe(true)
    expect(isIdentityProviderUrl('https://www.google.com/search?q=oauth')).toBe(false)
  })

  it('detects Microsoft and Apple identity hosts', () => {
    expect(isIdentityProviderUrl('https://login.microsoftonline.com/common/oauth2/v2.0/authorize')).toBe(
      true
    )
    expect(isIdentityProviderUrl('https://appleid.apple.com/auth/authorize')).toBe(true)
  })

  it('ignores ordinary chat and search URLs', () => {
    expect(isIdentityProviderUrl('https://chat.deepseek.com/sign_in')).toBe(false)
    expect(isIdentityProviderUrl('https://www.google.com/search?q=deepseek')).toBe(false)
    expect(isIdentityProviderUrl('not a url')).toBe(false)
  })
})

describe('isChatProviderUrl', () => {
  it('matches configured AI chat origins', () => {
    expect(isChatProviderUrl('https://chat.deepseek.com/a/chat')).toBe(true)
    expect(isChatProviderUrl('https://chatgpt.com/auth/callback')).toBe(true)
    expect(isChatProviderUrl('https://perplexity.ai/login/callback')).toBe(true)
  })

  it('rejects unrelated hosts', () => {
    expect(isChatProviderUrl('https://accounts.google.com/')).toBe(false)
    expect(isChatProviderUrl('https://example.com/')).toBe(false)
  })
})
