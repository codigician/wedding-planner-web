import { useEffect, useRef, useState } from 'react'
import { AlertCircle, Loader2, Pencil, UserRound, Users, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type { AssignmentStatus } from '@/hooks/useGuestAssignment'
import type { Guest } from '@/types/guest'
import type { VenueTable } from '@/types/venue'

// ─── types ────────────────────────────────────────────────────────────────────

interface GuestSidebarProps {
  guests: Guest[]
  tables: VenueTable[]
  selectedTableId: string | null
  statusMap: Record<string, AssignmentStatus>
  onAssignGuest: (guestId: string) => void
  onRemoveGuest: (tableId: string, guestId: string) => void
  onRenameTable: (tableId: string, label: string) => void
}

// ─── table name editor ────────────────────────────────────────────────────────

function TableNameEditor({
  table,
  onRename,
}: {
  table: VenueTable
  onRename: (label: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(table.label ?? '')
  const inputRef = useRef<HTMLInputElement>(null)

  // Sync draft if the table label changes externally
  useEffect(() => {
    if (!editing) setDraft(table.label ?? '')
  }, [table.label, editing])

  function startEdit() {
    setDraft(table.label ?? '')
    setEditing(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  function commit() {
    const trimmed = draft.trim()
    onRename(trimmed)
    setEditing(false)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') commit()
    if (e.key === 'Escape') setEditing(false)
  }

  if (editing) {
    return (
      <Input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={onKeyDown}
        placeholder={`Table ${table.tableNumber}`}
        className="h-7 text-sm font-semibold"
        autoFocus
      />
    )
  }

  return (
    <button
      type="button"
      onClick={startEdit}
      className="group flex items-center gap-1.5 text-left"
    >
      <span className="text-sm font-semibold leading-tight">
        {table.label || `Table ${table.tableNumber}`}
      </span>
      <Pencil className="size-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  )
}

// ─── seated guest row ─────────────────────────────────────────────────────────

function SeatedGuestRow({
  guest,
  tableId,
  status,
  onRemove,
}: {
  guest: Guest
  tableId: string
  status: AssignmentStatus
  onRemove: (tableId: string, guestId: string) => void
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/40 group">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-semibold text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
        {guest.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium leading-tight">{guest.name}</p>
        {guest.mealPreference && (
          <p className="truncate text-xs capitalize text-muted-foreground">{guest.mealPreference}</p>
        )}
      </div>
      {status === 'loading' && <Loader2 className="size-3.5 shrink-0 animate-spin text-purple-500" />}
      {status === 'error'   && <AlertCircle className="size-3.5 shrink-0 text-destructive" aria-label="Failed" />}
      <button
        type="button"
        aria-label={`Remove ${guest.name}`}
        onClick={() => onRemove(tableId, guest.id)}
        className="size-5 shrink-0 flex items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
      >
        <X className="size-3.5" />
      </button>
    </div>
  )
}

// ─── unassigned guest row ─────────────────────────────────────────────────────

function UnassignedGuestRow({
  guest,
  isSelectable,
  status,
  onClick,
}: {
  guest: Guest
  isSelectable: boolean
  status: AssignmentStatus
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={!isSelectable || status === 'loading'}
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-60',
        isSelectable
          ? 'hover:bg-purple-50 dark:hover:bg-purple-950/20 cursor-pointer'
          : 'cursor-default',
      )}
    >
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-semibold text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
        {guest.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium leading-tight">{guest.name}</p>
        {guest.mealPreference && (
          <p className="truncate text-xs capitalize text-muted-foreground">{guest.mealPreference}</p>
        )}
      </div>
      {status === 'loading' && <Loader2 className="size-3.5 shrink-0 animate-spin text-purple-500" />}
      {status === 'error'   && <AlertCircle className="size-3.5 shrink-0 text-destructive" aria-label="Failed" />}
    </button>
  )
}

// ─── main sidebar ─────────────────────────────────────────────────────────────

export function GuestSidebar({
  guests,
  tables,
  selectedTableId,
  statusMap,
  onAssignGuest,
  onRemoveGuest,
  onRenameTable,
}: GuestSidebarProps) {
  const selectedTable = tables.find((t) => t.id === selectedTableId) ?? null

  const assignedIds = new Set(tables.flatMap((t) => t.assignedGuests))
  const unassigned = guests.filter((g) => !assignedIds.has(g.id))

  const seatedGuests = selectedTable
    ? selectedTable.assignedGuests
        .map((id) => guests.find((g) => g.id === id))
        .filter((g): g is Guest => g !== undefined)
    : []

  const isFull = selectedTable != null &&
    selectedTable.assignedGuests.length >= selectedTable.capacity

  const seatsLeft = selectedTable
    ? selectedTable.capacity - selectedTable.assignedGuests.length
    : 0

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      {/* ── header ── */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Users className="size-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold">Guests</h2>
        <Badge variant="outline" className="ml-auto text-xs">
          {guests.length - assignedIds.size} unseated
        </Badge>
      </div>

      <ScrollArea className="flex-1">

        {/* ── table detail panel (only when a table is selected) ── */}
        {selectedTable && (
          <div className="px-3 pt-3 pb-2 space-y-2">
            {/* Table name + capacity bar */}
            <div className="flex items-center justify-between gap-2">
              <TableNameEditor
                table={selectedTable}
                onRename={(label) => onRenameTable(selectedTable.id, label)}
              />
              <Badge
                variant="outline"
                className={cn('shrink-0 text-xs font-mono', isFull && 'border-destructive text-destructive')}
              >
                {selectedTable.assignedGuests.length}/{selectedTable.capacity}
              </Badge>
            </div>

            {/* Capacity progress bar */}
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  isFull ? 'bg-destructive' : 'bg-purple-500',
                )}
                style={{ width: `${Math.min(100, (selectedTable.assignedGuests.length / selectedTable.capacity) * 100)}%` }}
              />
            </div>

            {/* Seated guest list */}
            {seatedGuests.length > 0 ? (
              <div className="space-y-0.5 pt-1">
                {seatedGuests.map((guest) => (
                  <SeatedGuestRow
                    key={guest.id}
                    guest={guest}
                    tableId={selectedTable.id}
                    status={statusMap[guest.id] ?? 'idle'}
                    onRemove={onRemoveGuest}
                  />
                ))}
              </div>
            ) : (
              <p className="py-2 text-center text-xs text-muted-foreground">
                No guests seated yet
              </p>
            )}

            <Separator className="mt-1" />

            {/* Prompt */}
            <p className={cn(
              'text-xs',
              isFull ? 'text-destructive' : 'text-purple-600 dark:text-purple-400',
            )}>
              {isFull
                ? 'Table is full'
                : `${seatsLeft} seat${seatsLeft !== 1 ? 's' : ''} available — click a guest below to seat them`}
            </p>
          </div>
        )}

        {/* ── unassigned guests ── */}
        <section className="px-2 pb-3">
          {!selectedTable && (
            <div className="flex items-center gap-1.5 px-2 py-2">
              <UserRound className="size-3.5 text-muted-foreground" />
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Unassigned guests
              </span>
            </div>
          )}

          {!selectedTable && (
            <p className="px-2 pb-2 text-xs text-muted-foreground">
              Select a table on the canvas to start seating guests
            </p>
          )}

          {unassigned.length === 0 ? (
            <p className="px-3 py-4 text-center text-xs text-muted-foreground">
              All guests have been seated 🎉
            </p>
          ) : (
            unassigned.map((guest) => (
              <UnassignedGuestRow
                key={guest.id}
                guest={guest}
                isSelectable={!!selectedTable && !isFull}
                status={statusMap[guest.id] ?? 'idle'}
                onClick={() => onAssignGuest(guest.id)}
              />
            ))
          )}
        </section>

      </ScrollArea>

      {/* ── deselect hint ── */}
      {selectedTable && (
        <div className="border-t border-border px-4 py-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-muted-foreground"
            onClick={() => {/* parent controls selection */}}
          >
            Click canvas to deselect table
          </Button>
        </div>
      )}
    </aside>
  )
}
