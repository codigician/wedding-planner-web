import { forwardRef } from 'react'
import { Circle, Group, Rect, Text } from 'react-konva'
import type Konva from 'konva'
import type { VenueTable } from '@/types/venue'

// ─── constants ────────────────────────────────────────────────────────────────
const SEAT_R = 5      // seat dot radius
const SEAT_GAP = 4    // gap between table edge and seat dot

// ─── seat helpers ─────────────────────────────────────────────────────────────

/** Purple-filled when occupied, light when empty */
function seatColors(index: number, assigned: number) {
  return index < assigned
    ? { fill: '#a855f7', stroke: '#7c3aed' }
    : { fill: '#f3e8ff', stroke: '#c084fc' }
}

/** Seats distributed in a ring around the circle */
function CircleSeats({
  capacity, assigned, radius,
}: { capacity: number; assigned: number; radius: number }) {
  const dist = radius + SEAT_R + SEAT_GAP
  return Array.from({ length: capacity }, (_, i) => {
    const angle = (2 * Math.PI * i) / capacity - Math.PI / 2
    const { fill, stroke } = seatColors(i, assigned)
    return (
      <Circle
        key={i}
        x={Math.cos(angle) * dist}
        y={Math.sin(angle) * dist}
        radius={SEAT_R}
        fill={fill}
        stroke={stroke}
        strokeWidth={1.5}
        listening={false}
      />
    )
  })
}

/** Seats distributed along the top and bottom edges of the rectangle */
function RectSeats({
  capacity, assigned, width, height,
}: { capacity: number; assigned: number; width: number; height: number }) {
  const topCount = Math.ceil(capacity / 2)
  const bottomCount = capacity - topCount
  const seatY = SEAT_R + SEAT_GAP
  const nodes: React.ReactNode[] = []
  let idx = 0

  const topStep = width / (topCount + 1)
  for (let i = 0; i < topCount; i++) {
    const { fill, stroke } = seatColors(idx++, assigned)
    nodes.push(
      <Circle key={`t${i}`}
        x={-width / 2 + topStep * (i + 1)} y={-height / 2 - seatY}
        radius={SEAT_R} fill={fill} stroke={stroke} strokeWidth={1.5} listening={false}
      />,
    )
  }

  const botStep = width / (bottomCount + 1)
  for (let i = 0; i < bottomCount; i++) {
    const { fill, stroke } = seatColors(idx++, assigned)
    nodes.push(
      <Circle key={`b${i}`}
        x={-width / 2 + botStep * (i + 1)} y={height / 2 + seatY}
        radius={SEAT_R} fill={fill} stroke={stroke} strokeWidth={1.5} listening={false}
      />,
    )
  }
  return <>{nodes}</>
}

// ─── main component ───────────────────────────────────────────────────────────

interface TableSpriteProps {
  table: VenueTable
  isSelected: boolean
  onSelect: (id: string) => void
  onDragEnd: (id: string, x: number, y: number) => void
}

export const TableSprite = forwardRef<Konva.Group, TableSpriteProps>(
  function TableSprite({ table, isSelected, onSelect, onDragEnd }, ref) {
    const { id, shape, radius, width, height, capacity, assignedGuests, tableNumber, label, x, y } = table

    const fill   = isSelected ? '#f0abfc' : '#e9d5ff'
    const stroke = isSelected ? '#a21caf' : '#7c3aed'
    const sw     = isSelected ? 3 : 2
    const shadow = isSelected
      ? { shadowEnabled: true, shadowColor: '#a21caf', shadowBlur: 10, shadowOpacity: 0.45 }
      : { shadowEnabled: false }

    const numLabel   = label ? label : `#${tableNumber}`
    const countLabel = `${assignedGuests.length}/${capacity}`

    return (
      <Group
        ref={ref}
        id={id}
        x={x} y={y}
        draggable
        onClick={() => onSelect(id)}
        onTap={() => onSelect(id)}
        onDragEnd={(e) => onDragEnd(id, e.target.x(), e.target.y())}
      >
        {shape === 'round' ? (
          <>
            <CircleSeats capacity={capacity} assigned={assignedGuests.length} radius={radius} />
            <Circle radius={radius} fill={fill} stroke={stroke} strokeWidth={sw} {...shadow} />
            {/* table number */}
            <Text
              x={-radius} y={-radius}
              width={radius * 2} height={radius}
              text={numLabel}
              fontSize={Math.max(10, Math.min(14, radius / 3))}
              fontStyle="bold" fill="#4c1d95"
              align="center" verticalAlign="bottom"
              listening={false}
            />
            {/* guest count */}
            <Text
              x={-radius} y={0}
              width={radius * 2} height={radius}
              text={countLabel}
              fontSize={Math.max(9, Math.min(12, radius / 3.5))}
              fill="#6d28d9"
              align="center" verticalAlign="top"
              listening={false}
            />
          </>
        ) : (
          <>
            <RectSeats capacity={capacity} assigned={assignedGuests.length} width={width} height={height} />
            <Rect
              width={width} height={height}
              offsetX={width / 2} offsetY={height / 2}
              fill={fill} stroke={stroke} strokeWidth={sw}
              cornerRadius={6} {...shadow}
            />
            {/* table number */}
            <Text
              x={-width / 2} y={-height / 2}
              width={width} height={height / 2}
              text={numLabel}
              fontSize={Math.max(10, Math.min(14, width / 7))}
              fontStyle="bold" fill="#4c1d95"
              align="center" verticalAlign="bottom"
              listening={false}
            />
            {/* guest count */}
            <Text
              x={-width / 2} y={0}
              width={width} height={height / 2}
              text={countLabel}
              fontSize={Math.max(9, Math.min(12, width / 8))}
              fill="#6d28d9"
              align="center" verticalAlign="top"
              listening={false}
            />
          </>
        )}
      </Group>
    )
  },
)
