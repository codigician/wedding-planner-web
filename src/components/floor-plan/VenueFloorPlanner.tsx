import { useCallback, useId, useRef, useState } from 'react'
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

// Seed data — replace with a real Firestore `guests` query when available.
const INITIAL_GUESTS: Guest[] = [
  { id: 'g1', name: 'Alice Johnson', mealPreference: 'vegetarian', rsvpStatus: 'confirmed' },
  { id: 'g2', name: 'Bob Smith', mealPreference: 'standard', rsvpStatus: 'confirmed' },
  { id: 'g3', name: 'Carol White', mealPreference: 'vegan', rsvpStatus: 'confirmed' },
  { id: 'g4', name: 'David Brown', mealPreference: 'halal', rsvpStatus: 'confirmed' },
  { id: 'g5', name: 'Eva Martinez', mealPreference: 'gluten-free', rsvpStatus: 'pending' },
  { id: 'g6', name: 'Frank Lee', mealPreference: 'standard', rsvpStatus: 'confirmed' },
  { id: 'g7', name: 'Grace Kim', mealPreference: 'kosher', rsvpStatus: 'confirmed' },
  { id: 'g8', name: 'Henry Davis', mealPreference: 'standard', rsvpStatus: 'pending' },
]

// ─── component ───────────────────────────────────────────────────────────────

/**
 * VenueFloorPlanner
 *
 * - Upload a hall background image
 * - Drop round / rectangle table sprites onto the canvas
 * - Drag tables to reposition them
 * - Selected table is highlighted; Delete key removes it
 * - Live state table shows every table's current (x, y)
 * - Guest sidebar: click a table then click a guest to assign them
 */
export function VenueFloorPlanner() {
  const fileInputId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const { width: canvasWidth, height: canvasHeight } = useContainerSize(containerRef)

  const [backgroundSrc, setBackgroundSrc] = useState<string | null>(null)
  const [tables, setTables] = useState<VenueTable[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [guests, setGuests] = useState<Guest[]>(INITIAL_GUESTS)

  const { assignGuest, removeGuest, statusMap } = useGuestAssignment(tables, setTables, selectedId)

  // ── add guest ────────────────────────────────────────────────────────────────
  const handleAddGuest = useCallback((guest: Guest) => {
    setGuests((prev) => [...prev, guest])
  }, [])

  // ── rename table ────────────────────────────────────────────────────────────
  const handleRenameTable = useCallback((id: string, label: string) => {
    setTables((prev) =>
      prev.map((t) => (t.id === id ? { ...t, label: label || undefined } : t)),
    )
  }, [])

  // ── update capacity ─────────────────────────────────────────────────────────
  const handleUpdateCapacity = useCallback((id: string, capacity: number) => {
    setTables((prev) =>
      prev.map((t) => (t.id === id ? { ...t, capacity } : t)),
    )
  }, [])

  const handleTableResize = useCallback(
    (id: string, scaleX: number, scaleY: number, newX: number, newY: number) => {
      setTables((prev) =>
        prev.map((t) => {
          if (t.id !== id) return t
          if (t.shape === 'round') {
            // For circles use the larger scale axis to keep it a circle
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
        }),
      )
    },
    [],
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
    // Reset input value so the same file can be re-selected
    e.target.value = ''
  }

  // ── add table ───────────────────────────────────────────────────────────────
  function addTable(shape: TableShape) {
    // Spawn near the center of the current canvas
    const x = canvasWidth / 2 + Math.random() * 40 - 20
    const y = canvasHeight / 2 + Math.random() * 40 - 20
    setTables((prev) => [...prev, makeTable(shape, x, y)])
  }

  // ── drag end ────────────────────────────────────────────────────────────────
  const handleDragEnd = useCallback((id: string, x: number, y: number) => {
    setTables((prev) =>
      prev.map((t) => (t.id === id ? { ...t, x: Math.round(x), y: Math.round(y) } : t)),
    )
  }, [])

  // ── delete selected ─────────────────────────────────────────────────────────
  function deleteSelected() {
    if (!selectedId) return
    setTables((prev) => prev.filter((t) => t.id !== selectedId))
    setSelectedId(null)
  }

  const selectedTable = tables.find((t) => t.id === selectedId)

  return (
    <div className="flex h-dvh flex-col gap-3 p-3 bg-background text-foreground overflow-hidden">
      {/* ── toolbar (fixed height, never grows) ── */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3 shadow-sm">
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
        <Button
          variant="secondary"
          size="sm"
          className="gap-1.5"
          onClick={() => addTable('round')}
        >
          <Circle className="size-4" />
          Add Round Table
        </Button>

        {/* Add rectangle table */}
        <Button
          variant="secondary"
          size="sm"
          className="gap-1.5"
          onClick={() => addTable('rectangle')}
        >
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

      {/* ── canvas + sidebar (fills all remaining space) ── */}
      <div className="flex min-h-0 flex-1 gap-3">
        {/* Canvas: flex-1 + min-h-0 so it never pushes past the parent */}
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
        />
      </div>
    </div>
  )
}
