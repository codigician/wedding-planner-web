import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Layer } from 'react-konva'
import type Konva from 'konva'
import { subscribeEventCanvas, updateEventCanvas } from '@/lib/firebase/canvas'
import { subscribeEvent } from '@/lib/firebase/events'
import { subscribeGuests, addGuest as addGuestToFirestore, updateGuest, deleteGuest } from '@/lib/firebase/guests'
import { useGuestAssignment } from '@/hooks/useGuestAssignment'
import { GuestSidebar } from '@/components/guest-sidebar'
import type { CanvasElement, CanvasTool, SvgElement, TableElement, TableShape, TextElement } from '@/types/canvas'
import type { Guest } from '@/types/guest'
import type { WeddingEvent } from '@/types/event'
import { InfiniteStage } from './InfiniteStage'
import { CanvasToolbar } from './CanvasToolbar'
import { SVGLibraryPanel } from './SVGLibraryPanel'
import { SVGCanvasElement } from './SVGElement'
import { TextCanvasElement } from './TextElement'
import { TableCanvasElement } from './TableElement'
import { ElementTransformer, type TransformResult } from './ElementTransformer'
import type { SvgAsset } from './svg-assets'

// ─── constants ────────────────────────────────────────────────────────────────

const ZOOM_STEP = 0.15
const DEFAULT_SCALE = 1

// ─── helpers ──────────────────────────────────────────────────────────────────

function debounce<T extends unknown[]>(fn: (...args: T) => void, ms: number) {
  let timer: ReturnType<typeof setTimeout>
  return (...args: T) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms) }
}

let _elemCounter = 0
function nextId(prefix: string) {
  _elemCounter += 1
  return `${prefix}-${_elemCounter}-${Date.now()}`
}

// ─── hooks ────────────────────────────────────────────────────────────────────

function useContainerSize(ref: React.RefObject<HTMLDivElement | null>) {
  const [size, setSize] = useState({ width: 0, height: 0 })

  useLayoutEffect(() => {
    if (!ref.current) return

    const measure = () => {
      if (!ref.current) return
      // getBoundingClientRect gives the actual rendered size synchronously.
      const { width, height } = ref.current.getBoundingClientRect()
      setSize({ width: Math.floor(width), height: Math.floor(height) })
    }

    measure() // run immediately so first paint has correct dimensions

    const observer = new ResizeObserver(measure)
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [ref])

  return size
}

// ─── component ────────────────────────────────────────────────────────────────

interface EventCanvasProps {
  eventId: string
}

export function EventCanvas({ eventId }: EventCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { width: canvasWidth, height: canvasHeight } = useContainerSize(containerRef)
  const stageRef = useRef<Konva.Stage>(null)
  const nodeRefs = useRef<Map<string, Konva.Node>>(new Map())

  // ── state ──────────────────────────────────────────────────────────────────
  const [event, setEvent] = useState<WeddingEvent | null>(null)
  const [elements, setElements] = useState<CanvasElement[]>([])
  const [guests, setGuests] = useState<Guest[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activeTool, setActiveTool] = useState<CanvasTool>('select')
  const [scale, setScale] = useState(DEFAULT_SCALE)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [loading, setLoading] = useState(true)
  const [tableCounter, setTableCounter] = useState(0)
  const [editingTextId, setEditingTextId] = useState<string | null>(null)

  // ── debounced save ─────────────────────────────────────────────────────────
  const saveElements = useRef(
    debounce((els: CanvasElement[]) => {
      updateEventCanvas(eventId, els).catch(console.error)
    }, 600),
  ).current

  // ── subscriptions ──────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = subscribeEvent(eventId, (ev) => {
      if (ev) setEvent(ev)
    })
    return unsub
  }, [eventId])

  useEffect(() => {
    const unsub = subscribeEventCanvas(eventId, (els) => {
      setElements(els)
      const maxNum = els
        .filter((e): e is TableElement => e.type === 'table')
        .reduce((m, t) => Math.max(m, t.tableNumber), 0)
      setTableCounter(maxNum)
      setLoading(false)
    })
    return unsub
  }, [eventId])

  useEffect(() => {
    const unsub = subscribeGuests(eventId, setGuests)
    return unsub
  }, [eventId])

  // ── guest assignment ───────────────────────────────────────────────────────
  const { assignGuest, removeGuest, statusMap } = useGuestAssignment(
    eventId,
    elements,
    setElements,
    selectedId,
  )

  // ── guest CRUD ─────────────────────────────────────────────────────────────
  const handleAddGuest = useCallback(
    async (guest: Guest) => {
      await addGuestToFirestore(eventId, {
        name: guest.name,
        email: guest.email,
        mealPreference: guest.mealPreference,
        rsvpStatus: guest.rsvpStatus,
      })
    },
    [eventId],
  )

  const handleEditGuest = useCallback(
    async (guestId: string, data: Omit<Guest, 'id'>) => updateGuest(eventId, guestId, data),
    [eventId],
  )

  const handleDeleteGuest = useCallback(
    async (guestId: string) => {
      setElements((prev) => {
        const updated: CanvasElement[] = prev.map((el) =>
          el.type === 'table'
            ? ({ ...el, assignedGuests: el.assignedGuests.filter((id) => id !== guestId) } as TableElement)
            : el,
        )
        updateEventCanvas(eventId, updated).catch(console.error)
        return updated
      })
      await deleteGuest(eventId, guestId)
    },
    [eventId],
  )

  // ── table CRUD (via sidebar) ───────────────────────────────────────────────
  const handleRenameTable = useCallback(
    (id: string, label: string) => {
      setElements((prev) => {
        const updated = prev.map((el) => el.id === id ? { ...el, label: label || undefined } : el)
        updateEventCanvas(eventId, updated).catch(console.error)
        return updated
      })
    },
    [eventId],
  )

  const handleUpdateCapacity = useCallback(
    (id: string, capacity: number) => {
      setElements((prev) => {
        const updated = prev.map((el) => el.id === id ? { ...el, capacity } : el)
        updateEventCanvas(eventId, updated).catch(console.error)
        return updated
      })
    },
    [eventId],
  )

  // ── element mutations ──────────────────────────────────────────────────────
  function updateElement(id: string, patch: Partial<CanvasElement>) {
    setElements((prev) => {
      const updated = prev.map((el) => el.id === id ? { ...el, ...patch } as CanvasElement : el)
      saveElements(updated)
      return updated
    })
  }

  function deleteSelected() {
    if (!selectedId) return
    setElements((prev) => {
      const updated = prev.filter((el) => el.id !== selectedId)
      updateEventCanvas(eventId, updated).catch(console.error)
      return updated
    })
    setSelectedId(null)
  }

  // ── add table ──────────────────────────────────────────────────────────────
  function addTable(shape: TableShape) {
    const num = tableCounter + 1
    setTableCounter(num)
    // Place in viewport center
    const stage = stageRef.current
    const cx = stage ? (canvasWidth / 2 - position.x) / scale : canvasWidth / 2
    const cy = stage ? (canvasHeight / 2 - position.y) / scale : canvasHeight / 2
    const defaults: Record<TableShape, { w: number; h: number }> = {
      circle: { w: 120, h: 120 },
      rectangle: { w: 160, h: 80 },
      ellipse: { w: 160, h: 100 },
    }
    const { w, h } = defaults[shape]
    const table: TableElement = {
      id: nextId('table'),
      type: 'table',
      shape,
      tableNumber: num,
      x: Math.round(cx),
      y: Math.round(cy),
      width: w,
      height: h,
      rotation: 0,
      capacity: shape === 'circle' ? 8 : shape === 'ellipse' ? 10 : 6,
      assignedGuests: [],
    }
    setElements((prev) => {
      const updated = [...prev, table]
      updateEventCanvas(eventId, updated).catch(console.error)
      return updated
    })
    setSelectedId(table.id)
    setActiveTool('select')
  }

  // ── add SVG asset ──────────────────────────────────────────────────────────
  function addAsset(asset: SvgAsset) {
    const stage = stageRef.current
    const cx = stage ? (canvasWidth / 2 - position.x) / scale : canvasWidth / 2
    const cy = stage ? (canvasHeight / 2 - position.y) / scale : canvasHeight / 2
    const el: SvgElement = {
      id: nextId('svg'),
      type: 'svg',
      name: asset.name,
      src: asset.src,
      x: Math.round(cx),
      y: Math.round(cy),
      width: asset.defaultWidth,
      height: asset.defaultHeight,
      rotation: 0,
    }
    setElements((prev) => {
      const updated = [...prev, el]
      updateEventCanvas(eventId, updated).catch(console.error)
      return updated
    })
    setSelectedId(el.id)
    setActiveTool('select')
  }

  // ── add text ───────────────────────────────────────────────────────────────
  function addTextAt(canvasX: number, canvasY: number) {
    const el: TextElement = {
      id: nextId('text'),
      type: 'text',
      content: 'Double-click to edit',
      x: Math.round(canvasX),
      y: Math.round(canvasY),
      width: 200,
      height: 40,
      rotation: 0,
      fontSize: 16,
      fontFamily: 'sans-serif',
      fill: '#111827',
      bold: false,
      italic: false,
    }
    setElements((prev) => {
      const updated = [...prev, el]
      updateEventCanvas(eventId, updated).catch(console.error)
      return updated
    })
    setSelectedId(el.id)
    setActiveTool('select')
  }

  // ── stage click handler ────────────────────────────────────────────────────
  function handleStagePointerDown(e: Konva.KonvaEventObject<MouseEvent>) {
    const clickedOnEmpty = e.target === e.target.getStage()
    if (!clickedOnEmpty) return

    if (activeTool === 'text') {
      const stage = stageRef.current
      if (!stage) return
      const pos = stage.getRelativePointerPosition()
      if (pos) addTextAt(pos.x, pos.y)
      return
    }

    if (activeTool === 'select') {
      setSelectedId(null)
    }
  }

  // ── transform end ──────────────────────────────────────────────────────────
  function handleTransformEnd(result: TransformResult) {
    setElements((prev) => {
      const updated = prev.map((el) => {
        if (el.id !== result.id) return el
        if (el.type === 'table' && el.shape === 'circle') {
          // keep width === height for circles
          const size = Math.max(40, Math.round(Math.min(result.width, result.height)))
          return { ...el, x: result.x, y: result.y, width: size, height: size, rotation: result.rotation }
        }
        return {
          ...el,
          x: result.x,
          y: result.y,
          width: Math.max(20, result.width),
          height: Math.max(20, result.height),
          rotation: result.rotation,
        }
      })
      saveElements(updated)
      return updated
    })
  }

  // ── drag end ───────────────────────────────────────────────────────────────
  const handleDragEnd = useCallback(
    (id: string, x: number, y: number) => {
      setElements((prev) => {
        const updated = prev.map((el) => el.id === id ? { ...el, x: Math.round(x), y: Math.round(y) } : el)
        saveElements(updated)
        return updated
      })
    },
    [saveElements],
  )

  // ── zoom controls ──────────────────────────────────────────────────────────
  function zoomIn() { setScale((s) => Math.min(8, parseFloat((s + ZOOM_STEP).toFixed(2)))) }
  function zoomOut() { setScale((s) => Math.max(0.1, parseFloat((s - ZOOM_STEP).toFixed(2)))) }
  function resetView() { setScale(DEFAULT_SCALE); setPosition({ x: 0, y: 0 }) }

  // ── keyboard shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === 'v' || e.key === 'V') setActiveTool('select')
      if (e.key === 'h' || e.key === 'H') setActiveTool('pan')
      if (e.key === 't' || e.key === 'T') setActiveTool('text')
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) deleteSelected()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  // ── register node refs ─────────────────────────────────────────────────────
  function setNodeRef(id: string) {
    return (node: Konva.Node | null) => {
      if (node) nodeRefs.current.set(id, node)
      else nodeRefs.current.delete(id)
    }
  }

  // ── derived ────────────────────────────────────────────────────────────────
  const selectedElement = elements.find((el) => el.id === selectedId)
  const selectedTable = selectedElement?.type === 'table' ? selectedElement : null
  const tablesToSidebar = elements.filter((el): el is TableElement => el.type === 'table')

  return (
    <div className="flex h-full flex-col gap-2 p-2 bg-background text-foreground overflow-hidden">
      {/* ── toolbar ── */}
      <CanvasToolbar
        eventName={event?.name}
        activeTool={activeTool}
        scale={scale}
        hasSelection={!!selectedId}
        onToolChange={setActiveTool}
        onAddTable={addTable}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onResetView={resetView}
        onDeleteSelected={deleteSelected}
      />

      {/* ── canvas area + sidebar ── */}
      <div className="flex min-h-0 flex-1 gap-2">
        {/* asset library panel */}
        <SVGLibraryPanel onAddAsset={addAsset} />

        {/* main canvas */}
        <div
          ref={containerRef}
          className="relative min-h-0 flex-1 rounded-xl border border-border bg-[#f8f7ff] shadow-inner overflow-hidden"
          style={{
            backgroundImage: 'radial-gradient(circle, #c4b5fd33 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        >
          {/* Only mount Stage once we have real pixel dimensions to avoid dead zones */}
          {canvasWidth > 0 && canvasHeight > 0 && (
            <InfiniteStage
              stageRef={stageRef}
              width={canvasWidth}
              height={canvasHeight}
              tool={activeTool}
              scale={scale}
              position={position}
              onScaleChange={setScale}
              onPositionChange={setPosition}
              onStagePointerDown={handleStagePointerDown}
            >
            <Layer>
              {elements.map((el) => {
                if (el.type === 'svg') {
                  return (
                    <SVGCanvasElement
                      key={el.id}
                      ref={setNodeRef(el.id) as React.Ref<Konva.Image>}
                      element={el}
                      isSelected={selectedId === el.id}
                      onSelect={setSelectedId}
                      onDragEnd={handleDragEnd}
                    />
                  )
                }
                if (el.type === 'text') {
                  return (
                    <TextCanvasElement
                      key={el.id}
                      ref={setNodeRef(el.id) as React.Ref<Konva.Group>}
                      element={el}
                      isSelected={selectedId === el.id}
                      onSelect={setSelectedId}
                      onDragEnd={handleDragEnd}
                      onStartEditing={setEditingTextId}
                    />
                  )
                }
                if (el.type === 'table') {
                  return (
                    <TableCanvasElement
                      key={el.id}
                      ref={setNodeRef(el.id) as React.Ref<Konva.Group>}
                      element={el}
                      isSelected={selectedId === el.id}
                      onSelect={setSelectedId}
                      onDragEnd={handleDragEnd}
                    />
                  )
                }
                return null
              })}

              <ElementTransformer
                selectedIds={selectedId ? [selectedId] : []}
                nodeRefs={nodeRefs}
                onTransformEnd={handleTransformEnd}
              />
            </Layer>
          </InfiniteStage>
          )} {/* end canvasWidth > 0 guard */}

          {/* text editing overlay — plain HTML, positioned over the canvas element */}
          {(() => {
            const el = editingTextId
              ? (elements.find((e) => e.id === editingTextId && e.type === 'text') as TextElement | undefined)
              : undefined
            if (!el) return null
            const left = el.x * scale + position.x - (el.width * scale) / 2
            const top = el.y * scale + position.y - (el.height * scale) / 2
            return (
              <textarea
                key={el.id}
                autoFocus
                defaultValue={el.content}
                onBlur={(e) => { updateElement(el.id, { content: e.target.value }); setEditingTextId(null) }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') { setEditingTextId(null); return }
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); updateElement(el.id, { content: (e.target as HTMLTextAreaElement).value }); setEditingTextId(null) }
                }}
                style={{
                  position: 'absolute',
                  left,
                  top,
                  width: el.width * scale,
                  minHeight: Math.max(30, el.height * scale),
                  fontSize: el.fontSize * scale,
                  fontFamily: el.fontFamily,
                  fontWeight: el.bold ? 'bold' : 'normal',
                  fontStyle: el.italic ? 'italic' : 'normal',
                  color: el.fill,
                  background: 'rgba(255,255,255,0.95)',
                  border: '1.5px solid #7c3aed',
                  borderRadius: 4,
                  padding: '2px 4px',
                  outline: 'none',
                  resize: 'none',
                  overflow: 'hidden',
                  lineHeight: 1.4,
                  zIndex: 20,
                  textAlign: 'center',
                }}
              />
            )
          })()}

          {/* loading overlay — rendered inside container so containerRef is always in DOM */}
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 rounded-xl">
              <div className="w-8 h-8 rounded-full border-2 border-violet-600 border-t-transparent animate-spin" />
            </div>
          )}

          {/* empty state hint */}
          {!loading && elements.length === 0 && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <p className="text-sm">Add tables from the toolbar, or pick assets from the panel on the left</p>
            </div>
          )}
        </div>

        {/* ── guest sidebar (visible when a table is selected) ── */}
        <GuestSidebar
          guests={guests}
          tables={tablesToSidebar}
          selectedTableId={selectedTable?.id ?? null}
          statusMap={statusMap}
          onAssignGuest={assignGuest}
          onRemoveGuest={removeGuest}
          onRenameTable={handleRenameTable}
          onUpdateCapacity={handleUpdateCapacity}
          onAddGuest={handleAddGuest}
          onEditGuest={handleEditGuest}
          onDeleteGuest={handleDeleteGuest}
        />
      </div>
    </div>
  )
}
