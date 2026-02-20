"use client"

import { useEffect, useMemo, useState } from "react"

const CELL_SIZE = 20
const RULER_X = 22
const RULER_Y = 34

type CursorState = {
  x: number
  y: number
  col: string
  row: number
  visible: boolean
}

function getColumnLabel(index: number) {
  let label = ""
  let cursor = index + 1

  while (cursor > 0) {
    const rem = (cursor - 1) % 26
    label = String.fromCharCode(65 + rem) + label
    cursor = Math.floor((cursor - 1) / 26)
  }

  return label
}

export function CoordinateOverlay() {
  const [grid, setGrid] = useState({ cols: 0, rows: 0 })
  const [cursor, setCursor] = useState<CursorState>({
    x: RULER_Y,
    y: RULER_X,
    col: "A",
    row: 1,
    visible: false,
  })

  useEffect(() => {
    const updateGrid = () => {
      setGrid({
        cols: Math.ceil(window.innerWidth / CELL_SIZE),
        rows: Math.ceil(window.innerHeight / CELL_SIZE),
      })
    }

    updateGrid()
    window.addEventListener("resize", updateGrid)

    return () => {
      window.removeEventListener("resize", updateGrid)
    }
  }, [])

  useEffect(() => {
    let frame = 0

    const onMove = (event: MouseEvent) => {
      if (frame) {
        window.cancelAnimationFrame(frame)
      }

      frame = window.requestAnimationFrame(() => {
        if (event.clientX <= RULER_Y || event.clientY <= RULER_X) {
          setCursor((prev) => (prev.visible ? { ...prev, visible: false } : prev))
          return
        }

        const colIndex = Math.max(0, Math.floor((event.clientX - RULER_Y) / CELL_SIZE))
        const rowIndex = Math.max(0, Math.floor((event.clientY - RULER_X) / CELL_SIZE))

        setCursor({
          x: RULER_Y + colIndex * CELL_SIZE,
          y: RULER_X + rowIndex * CELL_SIZE,
          col: getColumnLabel(colIndex),
          row: rowIndex + 1,
          visible: true,
        })
      })
    }

    window.addEventListener("mousemove", onMove, { passive: true })

    return () => {
      window.removeEventListener("mousemove", onMove)
      if (frame) {
        window.cancelAnimationFrame(frame)
      }
    }
  }, [])

  const columns = useMemo(() => Array.from({ length: grid.cols }, (_, index) => getColumnLabel(index)), [grid.cols])
  const rows = useMemo(() => Array.from({ length: grid.rows }, (_, index) => index + 1), [grid.rows])

  const accentPixels = useMemo(
    () =>
      Array.from({ length: 44 }, (_, index) => ({
        id: index,
        x: (index * 17 + 11) % 100,
        y: (index * 29 + 7) % 100,
        alpha: 0.08 + ((index % 5) * 0.03),
      })),
    []
  )

  return (
    <div className="coord-overlay" aria-hidden>
      <div className="coord-corner" />
      <div className="coord-ruler-x">
        {columns.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <div className="coord-ruler-y">
        {rows.map((row) => (
          <span key={row}>{row}</span>
        ))}
      </div>
      <div className="coord-grid-layer" />
      <div className="coord-pixel-field">
        {accentPixels.map((pixel) => (
          <span
            key={pixel.id}
            className="coord-pixel"
            style={{
              left: `${pixel.x}%`,
              top: `${pixel.y}%`,
              opacity: pixel.alpha,
            }}
          />
        ))}
      </div>
      <div
        className={`coord-cursor${cursor.visible ? " is-visible" : ""}`}
        style={{ transform: `translate(${cursor.x}px, ${cursor.y}px)` }}
      />
      <div className="coord-readout">
        X: {cursor.col} | Y: {cursor.row}
      </div>
    </div>
  )
}
