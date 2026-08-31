import { describe, expect, it, vi } from 'vitest'
import { needsNetworkResolve, parseRedirectUrl, resolveNativeUrl } from '../src/main/link-resolver'

describe('parseRedirectUrl', () => {
  it('parses Google /url?q=', () => {
    const href =
      'https://www.google.com/url?q=https%3A%2F%2Fexample.com%2Fpage&sa=U&ved=2ahUKEwj&usg=AOv'
    expect(parseRedirectUrl(href)).toBe('https://example.com/page')
  })

  it('parses Google /url?url=', () => {
    const href = 'https://www.google.com/url?sa=t&rct=j&url=https://docs.example.org/guide&ved=2ah'
    expect(parseRedirectUrl(href)).toBe('https://docs.example.org/guide')
  })

  it('does not treat a Google search results URL as a redirect', () => {
    expect(parseRedirectUrl('https://www.google.com/search?q=https://example.com')).toBeNull()
  })

  it('parses Bing ck/a base64 u= param', () => {
    const native = 'https://example.com/page'
    const encoded = Buffer.from(native, 'utf8').toString('base64')
    const href = `https://www.bing.com/ck/a?!&&p=abc&u=a1${encoded}`
    expect(parseRedirectUrl(href)).toBe(native)
  })

  it('parses Yandex clck url= param', () => {
    const href = 'https://yandex.com/clck/jsredir?from=yandex.com&url=https%3A%2F%2Fexample.net%2Fa'
    expect(parseRedirectUrl(href)).toBe('https://example.net/a')
  })

  it('returns null for a native URL', () => {
    expect(parseRedirectUrl('https://example.com/already-native')).toBeNull()
  })

  it('returns null for an opaque Google /goto token', () => {
    const href =
      'https://www.google.com/goto?url=CAESpgEB6zswFYiyg-aeciYsbBj-X67mAzBnQNo2HKJ2iI25eIwWuOTdAw5d1d9SwH1lH5QhZ1J1hgCnF1AHwQtdMiwZALksArOzrgYvpm3iNxKo5pnyOIzhUkwlyX-jRTe6uCRDn2Z9w1wvNkfx4ppAwZmSLsVOkIgyw4EsUBlhFu5TRXuyZCxydFT2erQn0H_Lh35vxRPof5GoHmVOgVVrTRLSctGg8dGU'
    expect(parseRedirectUrl(href)).toBeNull()
  })

  it('parses Google /goto when url= is a plaintext HTTP URL', () => {
    const href = 'https://www.google.com/goto?url=https%3A%2F%2Fexample.com%2Fpage'
    expect(parseRedirectUrl(href)).toBe('https://example.com/page')
  })
})

describe('needsNetworkResolve', () => {
  it('is true for an unparsable search-engine redirect path', () => {
    expect(needsNetworkResolve('https://yandex.com/clck/jsredir?from=yandex.com&etext=abc')).toBe(true)
  })

  it('is false when the redirect can be parsed', () => {
    expect(
      needsNetworkResolve('https://www.google.com/url?q=https%3A%2F%2Fexample.com')
    ).toBe(false)
  })

  it('is false for ordinary result URLs', () => {
    expect(needsNetworkResolve('https://example.com/article')).toBe(false)
  })

  it('is true for an opaque Google /goto redirect', () => {
    expect(
      needsNetworkResolve('https://www.google.com/goto?url=CAESpgEB6zswFYiyg-aeciYsbBj')
    ).toBe(true)
  })
})

describe('resolveNativeUrl', () => {
  it('returns a parsed redirect without fetching', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const href = 'https://www.google.com/url?q=https%3A%2F%2Fexample.com%2Fdocs'
    await expect(resolveNativeUrl(href)).resolves.toBe('https://example.com/docs')
    expect(fetchSpy).not.toHaveBeenCalled()
    fetchSpy.mockRestore()
  })

  it('follows redirects when parsing is impossible', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      url: 'https://example.org/resolved',
      body: { cancel: vi.fn() }
    } as unknown as Response)

    await expect(resolveNativeUrl('https://yandex.com/clck/jsredir?etext=opaque')).resolves.toBe(
      'https://example.org/resolved'
    )
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(fetchSpy.mock.calls[0]?.[1]).toMatchObject({ method: 'GET', redirect: 'manual' })
    fetchSpy.mockRestore()
  })

  it('resolves opaque Google /goto via GET Location without HEAD', async () => {
    const goto =
      'https://www.google.com/goto?url=CAESpgEB6zswFYiyg-aeciYsbBj-X67mAzBnQNo2HKJ2iI25eIwWuOTdAw5d1d9SwH1lH5QhZ1J1hgCnF1AHwQtdMiwZALksArOzrgYvpm3iNxKo5pnyOIzhUkwlyX-jRTe6uCRDn2Z9w1wvNkfx4ppAwZmSLsVOkIgyw4EsUBlhFu5TRXuyZCxydFT2erQn0H_Lh35vxRPof5GoHmVOgVVrTRLSctGg8dGU'
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      status: 302,
      url: goto,
      headers: { get: (name: string) => (name.toLowerCase() === 'location' ? 'https://example.com/article' : null) },
      body: { cancel: vi.fn() }
    } as unknown as Response)

    await expect(resolveNativeUrl(goto)).resolves.toBe('https://example.com/article')
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(fetchSpy.mock.calls[0]?.[0]).toBe(goto)
    expect(fetchSpy.mock.calls[0]?.[1]).toMatchObject({ method: 'GET', redirect: 'manual' })
    fetchSpy.mockRestore()
  })

  it('returns the original href for already-native links', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    await expect(resolveNativeUrl('https://example.com/native')).resolves.toBe('https://example.com/native')
    expect(fetchSpy).not.toHaveBeenCalled()
    fetchSpy.mockRestore()
  })

  it('network-resolves when /url wraps an opaque Google /goto', async () => {
    const goto = 'https://www.google.com/goto?url=CAESopaqueToken'
    const outer = `https://www.google.com/url?url=${encodeURIComponent(goto)}`
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      status: 302,
      url: goto,
      headers: { get: (name: string) => (name.toLowerCase() === 'location' ? 'https://example.com/real' : null) },
      body: { cancel: vi.fn() }
    } as unknown as Response)

    await expect(resolveNativeUrl(outer)).resolves.toBe('https://example.com/real')
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(fetchSpy.mock.calls[0]?.[0]).toBe(goto)
    fetchSpy.mockRestore()
  })
})
