import { forwardRef } from 'react'
import { Circle, Ellipse, Group, Rect, Text } from 'react-konva'
import type Konva from 'konva'
import type { TableElement } from '@/types/canvas'

// ─── constants ────────────────────────────────────────────────────────────────

const SEAT_R = 5
const SEAT_GAP = 4

// ─── helpers ──────────────────────────────────────────────────────────────────

function seatColor(index: number, assigned: number) {
  return index < assigned
    ? { fill: '#a855f7', stroke: '#7c3aed' }
    : { fill: '#f3e8ff', stroke: '#c084fc' }
}

function CircleSeats({ capacity, assigned, cx, cy, radius }: {
  capacity: number; assigned: number; cx: number; cy: number; radius: number
}) {
  const dist = radius + SEAT_R + SEAT_GAP
  return Array.from({ length: capacity }, (_, i) => {
    const angle = (2 * Math.PI * i) / capacity - Math.PI / 2
    const { fill, stroke } = seatColor(i, assigned)
    return (
      <Circle
        key={i}
        x={cx + Math.cos(angle) * dist}
        y={cy + Math.sin(angle) * dist}
        radius={SEAT_R}
        fill={fill}
        stroke={stroke}
        strokeWidth={1.5}
        listening={false}
      />
    )
  })
}

function EllipseSeats({ capacity, assigned, cx, cy, rx, ry }: {
  capacity: number; assigned: number; cx: number; cy: number; rx: number; ry: number
}) {
  const distRx = rx + SEAT_R + SEAT_GAP
  const distRy = ry + SEAT_R + SEAT_GAP
  return Array.from({ length: capacity }, (_, i) => {
    const angle = (2 * Math.PI * i) / capacity - Math.PI / 2
    const { fill, stroke } = seatColor(i, assigned)
    return (
      <Circle
        key={i}
        x={cx + Math.cos(angle) * distRx}
        y={cy + Math.sin(angle) * distRy}
        radius={SEAT_R}
        fill={fill}
        stroke={stroke}
        strokeWidth={1.5}
        listening={false}
      />
    )
  })
}

function RectSeats({ capacity, assigned, x, y, w, h }: {
  capacity: number; assigned: number; x: number; y: number; w: number; h: number
}) {
  const topCount = Math.ceil(capacity / 2)
  const botCount = capacity - topCount
  const nodes: React.ReactNode[] = []
  let idx = 0

  // top edge seats
  const topStep = w / (topCount + 1)
  for (let i = 0; i < topCount; i++) {
    const { fill, stroke } = seatColor(idx++, assigned)
    nodes.push(
      <Circle
        key={`t${i}`}
        x={x + topStep * (i + 1)}
        y={y - SEAT_R - SEAT_GAP}
        radius={SEAT_R} fill={fill} stroke={stroke} strokeWidth={1.5} listening={false}
      />,
    )
  }

  // bottom edge seats
  const botStep = w / (botCount + 1)
  for (let i = 0; i < botCount; i++) {
    const { fill, stroke } = seatColor(idx++, assigned)
    nodes.push(
      <Circle
        key={`b${i}`}
        x={x + botStep * (i + 1)}
        y={y + h + SEAT_R + SEAT_GAP}
        radius={SEAT_R} fill={fill} stroke={stroke} strokeWidth={1.5} listening={false}
      />,
    )
  }
  return <>{nodes}</>
}

// ─── types ────────────────────────────────────────────────────────────────────

interface TableElementProps {
  element: TableElement
  isSelected: boolean
  onSelect: (id: string) => void
  onDragEnd: (id: string, x: number, y: number) => void
}

// ─── component ────────────────────────────────────────────────────────────────

export const TableCanvasElement = forwardRef<Konva.Group, TableElementProps>(
  function TableCanvasElement({ element, isSelected, onSelect, onDragEnd }, ref) {
    const { id, shape, x, y, width, height, capacity, assignedGuests, tableNumber, label } = element
    const assigned = assignedGuests.length

    const fill   = isSelected ? '#f0abfc' : '#e9d5ff'
    const stroke = isSelected ? '#a21caf' : '#7c3aed'
    const sw     = isSelected ? 3 : 2
    const shadow = isSelected
      ? { shadowEnabled: true, shadowColor: '#a21caf', shadowBlur: 10, shadowOpacity: 0.45 }
      : { shadowEnabled: false }

    const numLabel   = label ?? `#${tableNumber}`
    const countLabel = `${assigned}/${capacity}`

    // All shapes drawn centered around (0, 0) in the group's local space
    const cx = 0
    const cy = 0

    return (
      <Group
        ref={ref}
        id={id}
        x={x}
        y={y}
        width={width}
        height={height}
        draggable
        onClick={() => onSelect(id)}
        onTap={() => onSelect(id)}
        onDragEnd={(e) => onDragEnd(id, e.target.x(), e.target.y())}
      >
        {shape === 'circle' && (() => {
          const r = Math.min(width, height) / 2
          return (
            <>
              <CircleSeats capacity={capacity} assigned={assigned} cx={cx} cy={cy} radius={r} />
              <Circle x={cx} y={cy} radius={r} fill={fill} stroke={stroke} strokeWidth={sw} {...shadow} />
              <Text x={cx - r} y={cy - r} width={r * 2} height={r} text={numLabel}
                fontSize={Math.max(10, Math.min(14, r / 3))} fontStyle="bold"
                fill="#4c1d95" align="center" verticalAlign="bottom" listening={false} />
              <Text x={cx - r} y={cy} width={r * 2} height={r} text={countLabel}
                fontSize={Math.max(9, Math.min(12, r / 3.5))}
                fill="#6d28d9" align="center" verticalAlign="top" listening={false} />
            </>
          )
        })()}

        {shape === 'rectangle' && (() => {
          const rx = -width / 2
          const ry = -height / 2
          return (
            <>
              <RectSeats capacity={capacity} assigned={assigned} x={rx} y={ry} w={width} h={height} />
              <Rect x={rx} y={ry} width={width} height={height}
                fill={fill} stroke={stroke} strokeWidth={sw} cornerRadius={6} {...shadow} />
              <Text x={rx} y={ry} width={width} height={height / 2} text={numLabel}
                fontSize={Math.max(10, Math.min(14, width / 7))} fontStyle="bold"
                fill="#4c1d95" align="center" verticalAlign="bottom" listening={false} />
              <Text x={rx} y={cy} width={width} height={height / 2} text={countLabel}
                fontSize={Math.max(9, Math.min(12, width / 8))}
                fill="#6d28d9" align="center" verticalAlign="top" listening={false} />
            </>
          )
        })()}

        {shape === 'ellipse' && (() => {
          const rx = width / 2
          const ry = height / 2
          return (
            <>
              <EllipseSeats capacity={capacity} assigned={assigned} cx={cx} cy={cy} rx={rx} ry={ry} />
              <Ellipse x={cx} y={cy} radiusX={rx} radiusY={ry}
                fill={fill} stroke={stroke} strokeWidth={sw} {...shadow} />
              <Text x={cx - rx} y={cy - ry} width={rx * 2} height={ry} text={numLabel}
                fontSize={Math.max(10, Math.min(14, rx / 3))} fontStyle="bold"
                fill="#4c1d95" align="center" verticalAlign="bottom" listening={false} />
              <Text x={cx - rx} y={cy} width={rx * 2} height={ry} text={countLabel}
                fontSize={Math.max(9, Math.min(12, rx / 3.5))}
                fill="#6d28d9" align="center" verticalAlign="top" listening={false} />
            </>
          )
        })()}
      </Group>
    )
  },
)
