// Utilitários de captura e persistência de parâmetros de campanha (UTMs)
// Mantém as UTMs em cookies e localStorage para que não se percam na navegação

export interface UtmParams {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
  fbclid?: string
  gclid?: string
  captured_at?: string
}

const STORAGE_KEY = 'academiadogol_utms'
const COOKIE_DAYS = 30

/**
 * Salva as UTMs no localStorage e em cookies do navegador
 */
export function saveUtmParams(params: Partial<UtmParams>) {
  if (typeof window === 'undefined') return

  try {
    const existing = getStoredUtms()
    const merged: UtmParams = {
      ...existing,
      ...Object.fromEntries(
        Object.entries(params).filter(([_, v]) => typeof v === 'string' && v.trim().length > 0)
      ),
      captured_at: new Date().toISOString(),
    }

    // Grava no localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))

    // Grava em cookies para disponibilidade no Server Side (Next.js cookies())
    const maxAge = COOKIE_DAYS * 24 * 60 * 60
    const domain = window.location.hostname === 'localhost' ? '' : '; SameSite=Lax'

    if (merged.utm_source) document.cookie = `utm_source=${encodeURIComponent(merged.utm_source)}; path=/; max-age=${maxAge}${domain}`
    if (merged.utm_medium) document.cookie = `utm_medium=${encodeURIComponent(merged.utm_medium)}; path=/; max-age=${maxAge}${domain}`
    if (merged.utm_campaign) document.cookie = `utm_campaign=${encodeURIComponent(merged.utm_campaign)}; path=/; max-age=${maxAge}${domain}`
    if (merged.utm_content) document.cookie = `utm_content=${encodeURIComponent(merged.utm_content)}; path=/; max-age=${maxAge}${domain}`
    if (merged.utm_term) document.cookie = `utm_term=${encodeURIComponent(merged.utm_term)}; path=/; max-age=${maxAge}${domain}`
    if (merged.fbclid) document.cookie = `fbclid=${encodeURIComponent(merged.fbclid)}; path=/; max-age=${maxAge}${domain}`
  } catch (err) {
    console.error('[UTMs] Erro ao salvar parâmetros:', err)
  }
}

/**
 * Recupera as UTMs salvas no localStorage ou cookies
 */
export function getStoredUtms(): UtmParams {
  if (typeof window === 'undefined') return {}

  try {
    const local = localStorage.getItem(STORAGE_KEY)
    if (local) {
      const parsed = JSON.parse(local)
      if (parsed && typeof parsed === 'object') return parsed
    }

    // Fallback: lê dos cookies
    const cookies = document.cookie.split(';').reduce<Record<string, string>>((acc, c) => {
      const [k, v] = c.trim().split('=')
      if (k && v) acc[k] = decodeURIComponent(v)
      return acc
    }, {})

    return {
      utm_source: cookies.utm_source,
      utm_medium: cookies.utm_medium,
      utm_campaign: cookies.utm_campaign,
      utm_content: cookies.utm_content,
      utm_term: cookies.utm_term,
      fbclid: cookies.fbclid,
    }
  } catch {
    return {}
  }
}

/**
 * Formata as UTMs em uma string legível para inclusão em notas de reserva
 */
export function formatUtmsForNotes(utms: UtmParams): string {
  const parts: string[] = []
  if (utms.utm_source) parts.push(`Origem: ${utms.utm_source}`)
  if (utms.utm_medium) parts.push(`Meio: ${utms.utm_medium}`)
  if (utms.utm_campaign) parts.push(`Campanha: ${utms.utm_campaign}`)
  if (utms.utm_content) parts.push(`Anúncio: ${utms.utm_content}`)
  if (utms.utm_term) parts.push(`Termo: ${utms.utm_term}`)
  if (utms.fbclid) parts.push(`FBCLID: ${utms.fbclid}`)

  if (parts.length === 0) return ''
  return `[CAMPANHA: ${parts.join(' | ')}]`
}

/**
 * Extrai dados de UTM a partir da string de notas
 */
export function parseUtmsFromNotes(notes?: string | null): UtmParams | null {
  if (!notes) return null
  const match = notes.match(/\[CAMPANHA:\s*([^\]]+)\]/)
  if (!match) return null

  const content = match[1]
  const result: UtmParams = {}
  const tokens = content.split('|').map((s) => s.trim())

  for (const token of tokens) {
    const [key, ...rest] = token.split(':').map((s) => s.trim())
    const val = rest.join(':')
    if (key.toLowerCase() === 'origem') result.utm_source = val
    if (key.toLowerCase() === 'meio') result.utm_medium = val
    if (key.toLowerCase() === 'campanha') result.utm_campaign = val
    if (key.toLowerCase() === 'anúncio' || key.toLowerCase() === 'anuncio') result.utm_content = val
    if (key.toLowerCase() === 'termo') result.utm_term = val
    if (key.toUpperCase() === 'FBCLID') result.fbclid = val
  }

  return Object.keys(result).length > 0 ? result : null
}
