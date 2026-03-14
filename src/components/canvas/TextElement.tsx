import { forwardRef } from 'react'
import { Group, Rect, Text } from 'react-konva'
import type Konva from 'konva'
import type { TextElement } from '@/types/canvas'

// ─── types ────────────────────────────────────────────────────────────────────

interface TextCanvasElementProps {
  element: TextElement
  isSelected: boolean
  onSelect: (id: string) => void
  onDragEnd: (id: string, x: number, y: number) => void
  onStartEditing: (id: string) => void
}

// ─── component ────────────────────────────────────────────────────────────────

export const TextCanvasElement = forwardRef<Konva.Group, TextCanvasElementProps>(
  function TextCanvasElement({ element, isSelected, onSelect, onDragEnd, onStartEditing }, ref) {
    return (
      <Group
        ref={ref}
        id={element.id}
        x={element.x}
        y={element.y}
        width={element.width}
        height={element.height}
        rotation={element.rotation}
        draggable
        shadowEnabled={isSelected}
        shadowColor="#a21caf"
        shadowBlur={8}
        shadowOpacity={0.35}
        onClick={() => onSelect(element.id)}
        onTap={() => onSelect(element.id)}
        onDblClick={() => onStartEditing(element.id)}
        onDblTap={() => onStartEditing(element.id)}
        onDragEnd={(e) => onDragEnd(element.id, e.target.x(), e.target.y())}
      >
        {/* Invisible hit-rect — Konva Groups have no hit area unless a child is listening */}
        <Rect
          x={-element.width / 2}
          y={-element.height / 2}
          width={element.width}
          height={element.height}
          fill="transparent"
        />
        <Text
          x={-element.width / 2}
          y={-element.height / 2}
          width={element.width}
          height={element.height}
          text={element.content}
          fontSize={element.fontSize}
          fontFamily={element.fontFamily}
          fontStyle={[element.italic ? 'italic' : '', element.bold ? 'bold' : ''].filter(Boolean).join(' ') || 'normal'}
          fill={element.fill}
          wrap="word"
          align="center"
          verticalAlign="middle"
          listening={false}
        />
      </Group>
    )
  },
)
