import { useRef, type ReactNode } from 'react'
import { Stage } from 'react-konva'
import type Konva from 'konva'
import type { CanvasTool } from '@/types/canvas'

// ─── constants ────────────────────────────────────────────────────────────────

const ZOOM_FACTOR = 1.1
const MIN_SCALE = 0.1
const MAX_SCALE = 8

// ─── types ────────────────────────────────────────────────────────────────────

interface StagePos { x: number; y: number }

export interface InfiniteStageHandle {
  resetView: () => void
  zoomIn: () => void
  zoomOut: () => void
  getStage: () => Konva.Stage | null
}

interface InfiniteStageProps {
  width: number
  height: number
  tool: CanvasTool
  scale: number
  position: StagePos
  onScaleChange: (scale: number) => void
  onPositionChange: (pos: StagePos) => void
  onStagePointerDown: (e: Konva.KonvaEventObject<MouseEvent>) => void
  children: ReactNode
  stageRef: React.RefObject<Konva.Stage | null>
}

// ─── component ────────────────────────────────────────────────────────────────

export function InfiniteStage({
  width,
  height,
  tool,
  scale,
  position,
  onScaleChange,
  onPositionChange,
  onStagePointerDown,
  children,
  stageRef,
}: InfiniteStageProps) {
  const isPanning = useRef(false)

  function handleWheel(e: Konva.KonvaEventObject<WheelEvent>) {
    e.evt.preventDefault()
    const stage = stageRef.current
    if (!stage) return

    const oldScale = stage.scaleX()
    const pointer = stage.getPointerPosition()
    if (!pointer) return

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    }

    const direction = e.evt.deltaY < 0 ? 1 : -1
    const newScale = Math.min(
      MAX_SCALE,
      Math.max(MIN_SCALE, oldScale * (direction > 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR)),
    )

    onScaleChange(newScale)
    onPositionChange({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    })
  }

  const cursor = tool === 'pan' ? (isPanning.current ? 'grabbing' : 'grab')
    : tool === 'text' ? 'text'
    : 'default'

  return (
    <Stage
      ref={stageRef}
      width={width}
      height={height}
      scaleX={scale}
      scaleY={scale}
      x={position.x}
      y={position.y}
      draggable={tool === 'pan'}
      onMouseDown={(e) => {
        if (tool === 'pan') isPanning.current = true
        onStagePointerDown(e)
      }}
      onMouseUp={() => { isPanning.current = false }}
      onDragEnd={(e) => {
        isPanning.current = false
        // Only update stage position when the stage itself was dragged.
        // Child node drag-end events bubble up here too; ignore those.
        if (e.target === stageRef.current) {
          onPositionChange({ x: e.target.x(), y: e.target.y() })
        }
      }}
      onWheel={handleWheel}
      style={{ cursor, display: 'block' }}
    >
      {children}
    </Stage>
  )
}
