"use client"

import { useEffect, useMemo, useRef } from "react"

import { type CounterFormat, formatCounterValue } from "@/lib/domain/finance"

type RollingCounterProps = {
  value: number
  className?: string
  format?: CounterFormat
}

export function RollingCounter({ value, className, format = "number" }: RollingCounterProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const formatted = useMemo(() => formatCounterValue(value, format), [format, value])

  useEffect(() => {
    const node = ref.current
    if (!node) return
    node.style.transform = "translateY(-2px)"
    node.style.opacity = "0.75"
    const id = window.setTimeout(() => {
      node.style.transform = "translateY(0px)"
      node.style.opacity = "1"
    }, 40)

    return () => window.clearTimeout(id)
  }, [formatted])

  return (
    <div
      ref={ref}
      className={className}
      style={{ transition: "transform 220ms ease, opacity 220ms ease" }}
    >
      {formatted}
    </div>
  )
}
