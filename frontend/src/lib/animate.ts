/**
 * Animation utilities — HICC Workforce Platform
 * Countup, entrance stagger, progress fill, spring toast
 */

import { useEffect, useRef, useState } from 'react'

/** Count up a number from 0 to target over duration ms */
export function useCountUp(target: number, duration = 900, startOnMount = true): number {
  const [value, setValue] = useState(0)
  const rafRef = useRef<number>(0)
  const startRef = useRef<number>(0)

  useEffect(() => {
    if (!startOnMount) return
    const start = performance.now()
    startRef.current = start

    const tick = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(target * eased))
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target, duration, startOnMount])

  return value
}

/** Entrance animation — returns style with opacity + translateY */
export function useEntrance(delay = 0): React.CSSProperties {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setReady(true), delay)
    return () => clearTimeout(t)
  }, [delay])
  return {
    opacity: ready ? 1 : 0,
    transform: ready ? 'translateY(0)' : 'translateY(14px)',
    transition: `opacity 0.45s ease ${delay}ms, transform 0.45s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
  }
}

/** Staggered entrance for a list — returns array of styles */
export function useStagger(count: number, baseDelay = 0, step = 55): React.CSSProperties[] {
  const [ready, setReady] = useState<boolean[]>(new Array(count).fill(false))

  useEffect(() => {
    const timers = Array.from({ length: count }, (_, i) =>
      setTimeout(() => {
        setReady(prev => {
          const next = [...prev]; next[i] = true; return next
        })
      }, baseDelay + i * step)
    )
    return () => timers.forEach(clearTimeout)
  }, [count, baseDelay, step])

  return ready.map(r => ({
    opacity: r ? 1 : 0,
    transform: r ? 'translateY(0)' : 'translateY(12px)',
    transition: 'opacity 0.4s ease, transform 0.4s cubic-bezier(0.22,1,0.36,1)',
  }))
}

/** Progress bar fill — returns width% that animates from 0 to target */
export function useProgressFill(target: number, delay = 100): number {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setWidth(target), delay)
    return () => clearTimeout(t)
  }, [target, delay])
  return width
}

/** Word-by-word text reveal — returns array of visible booleans */
export function useWordReveal(text: string, startDelay = 400, wordDelay = 120): boolean[] {
  const words = text.split(' ')
  const [visible, setVisible] = useState<boolean[]>(new Array(words.length).fill(false))

  useEffect(() => {
    const timers = words.map((_, i) =>
      setTimeout(() => {
        setVisible(prev => { const n = [...prev]; n[i] = true; return n })
      }, startDelay + i * wordDelay)
    )
    return () => timers.forEach(clearTimeout)
  }, [text, startDelay, wordDelay])

  return visible
}
