'use client'

// components/session/ProcessingPoller.tsx
// Polls /api/sessions/[id] every few seconds until status is 'done' or 'error'
// Uses router.refresh() instead of window.location.reload()
// so the auth session cookie is NEVER lost

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface ProcessingPollerProps {
    sessionId: string
    intervalMs?: number
}

export function ProcessingPoller({
    sessionId,
    intervalMs = 3000,
}: ProcessingPollerProps) {
    const router = useRouter()
    const attempts = useRef(0)
    const MAX_ATTEMPTS = 40 // 40 × 3s = 2 minutes max before giving up

    useEffect(() => {
        const interval = setInterval(async () => {
            attempts.current += 1

            // Give up after 2 minutes — something went wrong server-side
            if (attempts.current > MAX_ATTEMPTS) {
                clearInterval(interval)
                console.warn('[Scribe] ProcessingPoller: max attempts reached, stopping')
                router.refresh()
                return
            }

            try {
                const res = await fetch(`/api/sessions/${sessionId}`, {
                    cache: 'no-store', // always get fresh status, never cached
                })

                if (!res.ok) {
                    console.warn(`[Scribe] ProcessingPoller: got ${res.status}, will retry`)
                    return // don't stop on bad response — just retry next interval
                }

                const { session } = await res.json()

                if (session?.status === 'done' || session?.status === 'error') {
                    clearInterval(interval)
                    // router.refresh() re-fetches server component data
                    // WITHOUT a full page reload — auth cookies stay intact
                    router.refresh()
                }
            } catch {
                // Network error — silently retry
                console.warn('[Scribe] ProcessingPoller: fetch failed, retrying...')
            }
        }, intervalMs)

        return () => clearInterval(interval)
    }, [sessionId, intervalMs, router])

    return null // no UI — background only
}