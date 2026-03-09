import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Circle, RectangleHorizontal, Trash2, Upload } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useGuestAssignment } from '@/hooks/useGuestAssignment'
import type { Guest } from '@/types/guest'
import type { TableShape, VenueTable } from '@/types/venue'
import { GuestSidebar } from '@/components/guest-sidebar'
import { FloorPlanCanvas, useContainerSize } from './FloorPlanCanvas'
import { subscribeEvent, updateEventTables } from '@/lib/firebase/events'
import { subscribeGuests, addGuest as addGuestToFirestore, updateGuest, deleteGuest } from '@/lib/firebase/guests'
import type { WeddingEvent } from '@/types/event'

// ─── helpers ─────────────────────────────────────────────────────────────────

let _tableCounter = 0
function makeTable(shape: TableShape, x: number, y: number): VenueTable {
  _tableCounter += 1
  return {
    id: `table-${_tableCounter}-${Date.now()}`,
    tableNumber: _tableCounter,
    shape,
    x,
    y,
    radius: 42,
    width: 100,
    height: 64,
    capacity: shape === 'round' ? 8 : 6,
    assignedGuests: [],
  }
}

// Simple debounce utility
function debounce<T extends unknown[]>(fn: (...args: T) => void, ms: number) {
  let timer: ReturnType<typeof setTimeout>
  return (...args: T) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }
}

// ─── component ───────────────────────────────────────────────────────────────

interface VenueFloorPlannerProps {
  eventId: string
}

export function VenueFloorPlanner({ eventId }: VenueFloorPlannerProps) {
  const fileInputId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const { width: canvasWidth, height: canvasHeight } = useContainerSize(containerRef)

  const [event, setEvent] = useState<WeddingEvent | null>(null)
  const [backgroundSrc, setBackgroundSrc] = useState<string | null>(null)
  const [tables, setTables] = useState<VenueTable[]>([])
  const [guests, setGuests] = useState<Guest[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const { assignGuest, removeGuest, statusMap } = useGuestAssignment(eventId, tables, setTables, selectedId)

  // Debounced save of table layout to Firestore (avoids write spam during drag)
  const saveTables = useRef(
    debounce((updated: VenueTable[]) => {
      updateEventTables(eventId, updated).catch(console.error)
    }, 600),
  ).current

  // ── subscribe to event doc (tables) ─────────────────────────────────────────
  useEffect(() => {
    const unsub = subscribeEvent(eventId, (ev) => {
      if (ev) {
        setEvent(ev)
        setTables(ev.tables)
        // Seed table counter so new tables get unique numbers
        const maxNum = ev.tables.reduce((m, t) => {
          const n = typeof t.tableNumber === 'number' ? t.tableNumber : parseInt(t.tableNumber as string, 10)
          return isNaN(n) ? m : Math.max(m, n)
        }, 0)
        _tableCounter = maxNum
      }
      setLoading(false)
    })
    return unsub
  }, [eventId])

  // ── subscribe to guests subcollection ───────────────────────────────────────
  useEffect(() => {
    const unsub = subscribeGuests(eventId, setGuests)
    return unsub
  }, [eventId])

  // ── add guest ────────────────────────────────────────────────────────────────
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

  // ── edit guest ───────────────────────────────────────────────────────────────
  const handleEditGuest = useCallback(
    async (guestId: string, data: Omit<Guest, 'id'>) => {
      await updateGuest(eventId, guestId, data)
    },
    [eventId],
  )

  // ── delete guest ─────────────────────────────────────────────────────────────
  const handleDeleteGuest = useCallback(
    async (guestId: string) => {
      // Remove from any table first, then delete the guest doc
      setTables((prev) => {
        const updated = prev.map((t) => ({
          ...t,
          assignedGuests: t.assignedGuests.filter((id) => id !== guestId),
        }))
        updateEventTables(eventId, updated).catch(console.error)
        return updated
      })
      await deleteGuest(eventId, guestId)
    },
    [eventId],
  )

  // ── rename table ────────────────────────────────────────────────────────────
  const handleRenameTable = useCallback(
    (id: string, label: string) => {
      setTables((prev) => {
        const updated = prev.map((t) => (t.id === id ? { ...t, label: label || undefined } : t))
        updateEventTables(eventId, updated).catch(console.error)
        return updated
      })
    },
    [eventId],
  )

  // ── update capacity ─────────────────────────────────────────────────────────
  const handleUpdateCapacity = useCallback(
    (id: string, capacity: number) => {
      setTables((prev) => {
        const updated = prev.map((t) => (t.id === id ? { ...t, capacity } : t))
        updateEventTables(eventId, updated).catch(console.error)
        return updated
      })
    },
    [eventId],
  )

  const handleTableResize = useCallback(
    (id: string, scaleX: number, scaleY: number, newX: number, newY: number) => {
      setTables((prev) => {
        const updated = prev.map((t) => {
          if (t.id !== id) return t
          if (t.shape === 'round') {
            const scale = Math.max(scaleX, scaleY)
            return { ...t, x: Math.round(newX), y: Math.round(newY), radius: Math.max(25, Math.round(t.radius * scale)) }
          }
          return {
            ...t,
            x: Math.round(newX),
            y: Math.round(newY),
            width:  Math.max(50, Math.round(t.width  * scaleX)),
            height: Math.max(40, Math.round(t.height * scaleY)),
          }
        })
        saveTables(updated)
        return updated
      })
    },
    [saveTables],
  )

  // ── background upload ───────────────────────────────────────────────────────
  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setBackgroundSrc((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return url
    })
    e.target.value = ''
  }

  // ── add table ───────────────────────────────────────────────────────────────
  function addTable(shape: TableShape) {
    const x = canvasWidth / 2 + Math.random() * 40 - 20
    const y = canvasHeight / 2 + Math.random() * 40 - 20
    setTables((prev) => {
      const updated = [...prev, makeTable(shape, x, y)]
      updateEventTables(eventId, updated).catch(console.error)
      return updated
    })
  }

  // ── drag end ────────────────────────────────────────────────────────────────
  const handleDragEnd = useCallback(
    (id: string, x: number, y: number) => {
      setTables((prev) => {
        const updated = prev.map((t) => (t.id === id ? { ...t, x: Math.round(x), y: Math.round(y) } : t))
        saveTables(updated)
        return updated
      })
    },
    [saveTables],
  )

  // ── delete selected ─────────────────────────────────────────────────────────
  function deleteSelected() {
    if (!selectedId) return
    setTables((prev) => {
      const updated = prev.filter((t) => t.id !== selectedId)
      updateEventTables(eventId, updated).catch(console.error)
      return updated
    })
    setSelectedId(null)
  }

  const selectedTable = tables.find((t) => t.id === selectedId)

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-violet-600 border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-3 p-3 bg-background text-foreground overflow-hidden">
      {/* ── toolbar ── */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3 shadow-sm">
        {event && (
          <>
            <span className="text-sm font-semibold text-foreground truncate max-w-[200px]">{event.name}</span>
            <Separator orientation="vertical" className="h-6" />
          </>
        )}

        {/* Upload background */}
        <label
          htmlFor={fileInputId}
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'cursor-pointer gap-1.5')}
        >
          <Upload className="size-4" />
          Upload Hall Image
        </label>
        <input
          id={fileInputId}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={handleImageUpload}
        />

        <Separator orientation="vertical" className="h-6" />

        {/* Add round table */}
        <Button variant="secondary" size="sm" className="gap-1.5" onClick={() => addTable('round')}>
          <Circle className="size-4" />
          Add Round Table
        </Button>

        {/* Add rectangle table */}
        <Button variant="secondary" size="sm" className="gap-1.5" onClick={() => addTable('rectangle')}>
          <RectangleHorizontal className="size-4" />
          Add Rectangle Table
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* Delete selected */}
        <Button
          variant="destructive"
          size="sm"
          className="gap-1.5"
          disabled={!selectedId}
          onClick={deleteSelected}
        >
          <Trash2 className="size-4" />
          Delete Selected
        </Button>

        {/* Selection info */}
        {selectedTable && (
          <Badge variant="outline" className="ml-auto font-mono text-xs">
            Table&nbsp;{selectedTable.tableNumber}&nbsp;·&nbsp;
            {selectedTable.assignedGuests.length}/{selectedTable.capacity} guests&nbsp;·&nbsp;
            x:{Math.round(selectedTable.x)}&nbsp;y:{Math.round(selectedTable.y)}
          </Badge>
        )}
      </div>

      {/* ── canvas + sidebar ── */}
      <div className="flex min-h-0 flex-1 gap-3">
        <div
          ref={containerRef}
          className="relative min-h-0 flex-1 rounded-xl border border-border bg-muted/40 shadow-inner overflow-hidden"
        >
          {!backgroundSrc && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <Upload className="size-10 opacity-30" />
              <p className="text-sm">Upload a hall image to get started</p>
            </div>
          )}
          <FloorPlanCanvas
            backgroundSrc={backgroundSrc}
            tables={tables}
            selectedId={selectedId}
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
            onSelectTable={setSelectedId}
            onTableDragEnd={handleDragEnd}
            onTableResize={handleTableResize}
          />
        </div>

        {/* Guest sidebar */}
        <GuestSidebar
          guests={guests}
          tables={tables}
          selectedTableId={selectedId}
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
