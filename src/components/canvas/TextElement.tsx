import { forwardRef, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Group, Text } from 'react-konva'
import type Konva from 'konva'
import type { TextElement } from '@/types/canvas'

// ─── types ────────────────────────────────────────────────────────────────────

interface TextCanvasElementProps {
  element: TextElement
  isSelected: boolean
  stageRef: React.RefObject<Konva.Stage | null>
  stageScale: number
  onSelect: (id: string) => void
  onDragEnd: (id: string, x: number, y: number) => void
  onChange: (id: string, updates: Partial<TextElement>) => void
}

// ─── inline editor overlay ────────────────────────────────────────────────────

function useInlineEditor(
  element: TextElement,
  nodeRef: React.RefObject<Konva.Text | null>,
  stageRef: React.RefObject<Konva.Stage | null>,
  stageScale: number,
  onChange: (id: string, updates: Partial<TextElement>) => void,
) {
  const [editing, setEditing] = useState(false)
  const areaRef = useRef<HTMLTextAreaElement>(null)

  function startEditing() {
    setEditing(true)
  }

  useEffect(() => {
    if (!editing) return
    const node = nodeRef.current
    const stage = stageRef.current
    if (!node || !stage) return

    const container = stage.container()
    const containerRect = container.getBoundingClientRect()
    const absPos = node.getAbsolutePosition()
    const absScale = stageScale

    const areaX = containerRect.left + absPos.x - (element.width / 2) * absScale
    const areaY = containerRect.top + absPos.y - (element.height / 2) * absScale

    const area = areaRef.current
    if (!area) return

    area.value = element.content
    area.style.position = 'fixed'
    area.style.left = `${areaX}px`
    area.style.top = `${areaY}px`
    area.style.width = `${element.width * absScale}px`
    area.style.minHeight = `${Math.max(30, element.height * absScale)}px`
    area.style.fontSize = `${element.fontSize * absScale}px`
    area.style.fontFamily = element.fontFamily
    area.style.fontWeight = element.bold ? 'bold' : 'normal'
    area.style.fontStyle = element.italic ? 'italic' : 'normal'
    area.style.color = element.fill
    area.style.background = 'rgba(255,255,255,0.95)'
    area.style.border = '1.5px solid #7c3aed'
    area.style.borderRadius = '4px'
    area.style.padding = '2px 4px'
    area.style.outline = 'none'
    area.style.resize = 'none'
    area.style.overflow = 'hidden'
    area.style.lineHeight = '1.4'
    area.style.zIndex = '9999'
    area.focus()
    area.select()
  }, [editing, element, stageRef, stageScale, nodeRef])

  function commit(value: string) {
    onChange(element.id, { content: value })
    setEditing(false)
  }

  const textareaEl = editing ? (
    <textarea
      ref={areaRef}
      onBlur={(e) => commit(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Escape') { commit(areaRef.current?.value ?? element.content); return }
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commit(areaRef.current?.value ?? element.content) }
      }}
    />
  ) : null

  // Portal to document.body so the <textarea> escapes the Konva canvas tree.
  const textareaPortal = textareaEl ? createPortal(textareaEl, document.body) : null

  return { startEditing, textareaPortal }
}

// ─── component ────────────────────────────────────────────────────────────────

export const TextCanvasElement = forwardRef<Konva.Group, TextCanvasElementProps>(
  function TextCanvasElement({ element, isSelected, stageRef, stageScale, onSelect, onDragEnd, onChange }, ref) {
    const textRef = useRef<Konva.Text>(null)
    const { startEditing, textareaPortal } = useInlineEditor(element, textRef, stageRef, stageScale, onChange)

    return (
      <>
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
          onDblClick={startEditing}
          onDblTap={startEditing}
          onDragEnd={(e) => onDragEnd(element.id, e.target.x(), e.target.y())}
        >
          <Text
            ref={textRef}
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
        {textareaPortal}
      </>
    )
  },
)
