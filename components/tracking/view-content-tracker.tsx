'use client'

import { useEffect, useRef } from 'react'
import { trackMetaEvent } from '@/lib/tracking/pixel'

interface Props {
  fieldId: string
  fieldName: string
  hourlyRate: number
}

export function ViewContentTracker({ fieldId, fieldName, hourlyRate }: Props) {
  const hasTracked = useRef(false)

  useEffect(() => {
    if (hasTracked.current) return
    hasTracked.current = true

    const eventId = `vc_${fieldId}_${Date.now()}`

    trackMetaEvent(
      'ViewContent',
      {
        content_name: fieldName,
        content_ids: [fieldId],
        content_type: 'product',
        value: Number(hourlyRate) || 0,
        currency: 'BRL',
      },
      eventId
    )
  }, [fieldId, fieldName, hourlyRate])

  return null
}
