"use client"

import { useEffect, useMemo, useRef } from "react"

import { type CounterFormat, formatCounterValue } from "@/lib/domain/finance"

type CountUpProps = {
  to: number
  from?: number
  duration?: number
  className?: string
  format?: CounterFormat
}

export function CountUp({ to, from = 0, duration = 0.85, className, format = "number" }: CountUpProps) {
  const ref = useRef<HTMLSpanElement | null>(null)
  const initialValue = useMemo(() => formatCounterValue(from, format), [from, format])

  useEffect(() => {
    const start = performance.now()
    let frame = 0

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / (duration * 1000))
      const eased = 1 - Math.pow(1 - progress, 3)
      const value = from + (to - from) * eased

      if (ref.current) {
        ref.current.textContent = formatCounterValue(value, format)
      }

      if (progress < 1) {
        frame = requestAnimationFrame(tick)
      }
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [to, from, duration, format])

  return (
    <span className={className} ref={ref}>
      {initialValue}
    </span>
  )
}
