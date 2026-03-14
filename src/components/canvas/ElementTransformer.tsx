import { useEffect, useRef } from 'react'
import { Transformer } from 'react-konva'
import type Konva from 'konva'

// ─── types ────────────────────────────────────────────────────────────────────

export interface TransformResult {
  id: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  /** Raw scaleX from the Konva node — parent uses this to compute new dimensions. */
  scaleX: number
  /** Raw scaleY from the Konva node. */
  scaleY: number
}

interface ElementTransformerProps {
  selectedIds: string[]
  nodeRefs: React.MutableRefObject<Map<string, Konva.Node>>
  onTransformEnd: (result: TransformResult) => void
}

// ─── component ────────────────────────────────────────────────────────────────

export function ElementTransformer({ selectedIds, nodeRefs, onTransformEnd }: ElementTransformerProps) {
  const trRef = useRef<Konva.Transformer>(null)

  useEffect(() => {
    const tr = trRef.current
    if (!tr) return
    const nodes = selectedIds.flatMap((id) => {
      const n = nodeRefs.current.get(id)
      return n ? [n] : []
    })
    tr.nodes(nodes)
    tr.getLayer()?.batchDraw()
  }, [selectedIds, nodeRefs])

  function handleTransformEnd() {
    const tr = trRef.current
    if (!tr) return

    for (const node of tr.nodes()) {
      const scaleX = node.scaleX()
      const scaleY = node.scaleY()

      // Normalise scale so React re-renders at scale=1 with new real dimensions
      node.scaleX(1)
      node.scaleY(1)

      onTransformEnd({
        id: node.id(),
        x: Math.round(node.x()),
        y: Math.round(node.y()),
        width: Math.round(node.width() * scaleX),
        height: Math.round(node.height() * scaleY),
        rotation: Math.round(node.rotation()),
        scaleX,
        scaleY,
      })
    }
  }

  return (
    <Transformer
      ref={trRef}
      rotateEnabled={true}
      enabledAnchors={[
        'top-left', 'top-center', 'top-right',
        'middle-left', 'middle-right',
        'bottom-left', 'bottom-center', 'bottom-right',
      ]}
      boundBoxFunc={(_, newBox) => ({
        ...newBox,
        width: Math.max(20, newBox.width),
        height: Math.max(20, newBox.height),
      })}
      onTransformEnd={handleTransformEnd}
    />
  )
}
