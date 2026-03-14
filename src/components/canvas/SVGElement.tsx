import { forwardRef } from 'react'
import { Image as KonvaImage } from 'react-konva'
import useImage from 'use-image'
import type Konva from 'konva'
import type { SvgElement } from '@/types/canvas'

// ─── types ────────────────────────────────────────────────────────────────────

interface SVGElementProps {
  element: SvgElement
  isSelected: boolean
  onSelect: (id: string) => void
  onDragEnd: (id: string, x: number, y: number) => void
}

// ─── component ────────────────────────────────────────────────────────────────

export const SVGCanvasElement = forwardRef<Konva.Image, SVGElementProps>(
  function SVGCanvasElement({ element, isSelected, onSelect, onDragEnd }, ref) {
    const [image] = useImage(element.src)

    return (
      <KonvaImage
        ref={ref}
        id={element.id}
        image={image}
        x={element.x}
        y={element.y}
        width={element.width}
        height={element.height}
        rotation={element.rotation}
        offsetX={element.width / 2}
        offsetY={element.height / 2}
        draggable
        shadowEnabled={isSelected}
        shadowColor="#a21caf"
        shadowBlur={10}
        shadowOpacity={0.4}
        onClick={() => onSelect(element.id)}
        onTap={() => onSelect(element.id)}
        onDragEnd={(e) => onDragEnd(element.id, e.target.x(), e.target.y())}
      />
    )
  },
)
