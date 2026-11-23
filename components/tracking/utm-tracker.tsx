'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { saveUtmParams } from '@/lib/tracking/utms'

function UtmTrackerInner() {
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!searchParams) return

    const utm_source = searchParams.get('utm_source')
    const utm_medium = searchParams.get('utm_medium')
    const utm_campaign = searchParams.get('utm_campaign')
    const utm_content = searchParams.get('utm_content')
    const utm_term = searchParams.get('utm_term')
    const fbclid = searchParams.get('fbclid')
    const gclid = searchParams.get('gclid')

    if (utm_source || utm_medium || utm_campaign || utm_content || utm_term || fbclid || gclid) {
      saveUtmParams({
        utm_source: utm_source || undefined,
        utm_medium: utm_medium || undefined,
        utm_campaign: utm_campaign || undefined,
        utm_content: utm_content || undefined,
        utm_term: utm_term || undefined,
        fbclid: fbclid || undefined,
        gclid: gclid || undefined,
      })
    }
  }, [searchParams])

  return null
}

export function UtmTracker() {
  return (
    <Suspense fallback={null}>
      <UtmTrackerInner />
    </Suspense>
  )
}
