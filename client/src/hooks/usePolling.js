import { useEffect, useRef, useCallback } from 'react'

/**
 * usePolling - runs callback every `interval` ms while `enabled` is true.
 * Fires immediately on mount (or when enabled flips to true).
 */
export function usePolling(callback, interval = 2000, enabled = true) {
  const savedCallback = useRef(callback)
  const timerRef = useRef(null)

  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!enabled) {
      stop()
      return
    }

    savedCallback.current() // fire immediately
    timerRef.current = setInterval(() => savedCallback.current(), interval)

    return stop
  }, [enabled, interval, stop])
}
