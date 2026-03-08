import { useCallback, useEffect, useRef, useState } from 'react'
import { Image as KonvaImage, Layer, Stage, Transformer } from 'react-konva'
import useImage from 'use-image'
import type Konva from 'konva'
import type { VenueTable } from '@/types/venue'
import { TableSprite } from './TableSprite'

// ─── types ────────────────────────────────────────────────────────────────────

interface FloorPlanCanvasProps {
  backgroundSrc: string | null
  tables: VenueTable[]
  selectedId: string | null
  canvasWidth: number
  canvasHeight: number
  onSelectTable: (id: string | null) => void
  onTableDragEnd: (id: string, x: number, y: number) => void
  onTableResize: (id: string, scaleX: number, scaleY: number, x: number, y: number) => void
}

// ─── background ───────────────────────────────────────────────────────────────

function BackgroundImage({ src, width, height }: { src: string; width: number; height: number }) {
  const [image] = useImage(src)
  return <KonvaImage image={image} width={width} height={height} />
}

// ─── canvas ───────────────────────────────────────────────────────────────────

export function FloorPlanCanvas({
  backgroundSrc,
  tables,
  selectedId,
  canvasWidth,
  canvasHeight,
  onSelectTable,
  onTableDragEnd,
  onTableResize,
}: FloorPlanCanvasProps) {
  const transformerRef = useRef<Konva.Transformer>(null)
  // Map from table id → Konva.Group node
  const nodeMap = useRef<Map<string, Konva.Group>>(new Map())

  // Register / unregister sprite nodes
  const setNodeRef = useCallback((id: string) => (node: Konva.Group | null) => {
    if (node) nodeMap.current.set(id, node)
    else nodeMap.current.delete(id)
  }, [])

  // Attach transformer to the selected node whenever selection changes
  useEffect(() => {
    const tr = transformerRef.current
    if (!tr) return
    const node = selectedId ? nodeMap.current.get(selectedId) : undefined
    tr.nodes(node ? [node] : [])
    tr.getLayer()?.batchDraw()
  }, [selectedId, tables]) // re-run when tables change (e.g. new table added)

  // Derive shape of selected table to configure keepRatio
  const selectedTable = tables.find((t) => t.id === selectedId)
  const keepRatio = selectedTable?.shape === 'round'

  function handleTransformEnd() {
    const tr = transformerRef.current
    if (!tr) return
    const node = tr.nodes()[0] as Konva.Group | undefined
    if (!node) return

    const scaleX = node.scaleX()
    const scaleY = node.scaleY()
    const newX   = node.x()
    const newY   = node.y()

    // Reset scale so stored dimensions are always "real" pixels
    node.scaleX(1)
    node.scaleY(1)

    onTableResize(node.id(), scaleX, scaleY, newX, newY)
  }

  return (
    <Stage
      width={canvasWidth}
      height={canvasHeight}
      className="rounded-lg overflow-hidden cursor-default"
      onMouseDown={(e) => {
        if (e.target === e.target.getStage()) onSelectTable(null)
      }}
    >
      <Layer>
        {backgroundSrc && (
          <BackgroundImage src={backgroundSrc} width={canvasWidth} height={canvasHeight} />
        )}

        {tables.map((table) => (
          <TableSprite
            key={table.id}
            ref={setNodeRef(table.id)}
            table={table}
            isSelected={selectedId === table.id}
            onSelect={onSelectTable}
            onDragEnd={onTableDragEnd}
          />
        ))}

        <Transformer
          ref={transformerRef}
          rotateEnabled={false}
          keepRatio={keepRatio}
          enabledAnchors={
            keepRatio
              ? ['top-left', 'top-right', 'bottom-left', 'bottom-right']
              : ['top-left', 'top-center', 'top-right', 'middle-left', 'middle-right', 'bottom-left', 'bottom-center', 'bottom-right']
          }
          boundBoxFunc={(_, newBox) => ({
            ...newBox,
            width:  Math.max(50,  newBox.width),
            height: Math.max(50, newBox.height),
          })}
          onTransformEnd={handleTransformEnd}
        />
      </Layer>
    </Stage>
  )
}

// ─── hook ─────────────────────────────────────────────────────────────────────

/** Tracks the rendered pixel size of a container element. */
export function useContainerSize(ref: React.RefObject<HTMLDivElement | null>) {
  const [size, setSize] = useState({ width: 800, height: 520 })

  useEffect(() => {
    if (!ref.current) return
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setSize({ width: Math.floor(width), height: Math.floor(height) })
    })
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [ref])

  return size
}
