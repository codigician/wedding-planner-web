import { UserRound, AlertCircle, Loader2, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type { AssignmentStatus } from '@/hooks/useGuestAssignment'
import type { Guest } from '@/types/guest'
import type { VenueTable } from '@/types/venue'

interface GuestSidebarProps {
  guests: Guest[]
  tables: VenueTable[]
  selectedTableId: string | null
  statusMap: Record<string, AssignmentStatus>
  onAssignGuest: (guestId: string) => void
}

/** Returns the table number a guest is currently seated at, or null. */
function getAssignedTable(guestId: string, tables: VenueTable[]): VenueTable | null {
  return tables.find((t) => t.assignedGuests.includes(guestId)) ?? null
}

function GuestRow({
  guest,
  isAssigned,
  assignedTable,
  isSelectable,
  status,
  onClick,
}: {
  guest: Guest
  isAssigned: boolean
  assignedTable: VenueTable | null
  isSelectable: boolean
  status: AssignmentStatus
  onClick: () => void
}) {
  const isLoading = status === 'loading'
  const isError = status === 'error'

  return (
    <button
      type="button"
      disabled={isAssigned || !isSelectable || isLoading}
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
        'disabled:cursor-not-allowed',
        isAssigned
          ? 'opacity-50'
          : isSelectable
            ? 'hover:bg-purple-50 dark:hover:bg-purple-950/20 cursor-pointer'
            : 'cursor-default',
      )}
    >
      {/* Avatar */}
      <span
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
          isAssigned
            ? 'bg-muted text-muted-foreground'
            : 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
        )}
      >
        {guest.name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase()}
      </span>

      {/* Name + info */}
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium leading-tight text-foreground">{guest.name}</p>
        {assignedTable && (
          <p className="truncate text-xs text-muted-foreground">
            Table {assignedTable.tableNumber}
          </p>
        )}
        {guest.mealPreference && !assignedTable && (
          <p className="truncate text-xs text-muted-foreground capitalize">
            {guest.mealPreference}
          </p>
        )}
      </div>

      {/* Status indicators */}
      {isLoading && <Loader2 className="size-4 shrink-0 animate-spin text-purple-500" />}
      {isError && (
        <AlertCircle className="size-4 shrink-0 text-destructive" aria-label="Assignment failed" />
      )}
      {isAssigned && !isLoading && !isError && (
        <Badge variant="secondary" className="shrink-0 text-xs">
          Seated
        </Badge>
      )}
    </button>
  )
}

/**
 * GuestSidebar
 *
 * Displays two sections:
 *  - **Unassigned** — guests not yet seated at any table
 *  - **Assigned** — guests already seated (shown dimmed)
 *
 * When a table is selected on the canvas, clicking an unassigned guest
 * calls `onAssignGuest` to seat them at that table.
 */
export function GuestSidebar({
  guests,
  tables,
  selectedTableId,
  statusMap,
  onAssignGuest,
}: GuestSidebarProps) {
  const selectedTable = tables.find((t) => t.id === selectedTableId) ?? null

  const unassigned = guests.filter((g) => !tables.some((t) => t.assignedGuests.includes(g.id)))
  const assigned = guests.filter((g) => tables.some((t) => t.assignedGuests.includes(g.id)))

  const isAtCapacity =
    selectedTable != null &&
    selectedTable.assignedGuests.length >= selectedTable.capacity

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Users className="size-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold">Guest List</h2>
        <Badge variant="outline" className="ml-auto text-xs">
          {guests.length} total
        </Badge>
      </div>

      {/* Instruction banner */}
      <div
        className={cn(
          'px-4 py-2 text-xs transition-colors',
          selectedTable
            ? isAtCapacity
              ? 'bg-destructive/10 text-destructive'
              : 'bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-300'
            : 'bg-muted/60 text-muted-foreground',
        )}
      >
        {selectedTable ? (
          isAtCapacity ? (
            <>Table {selectedTable.tableNumber} is full ({selectedTable.capacity}/{selectedTable.capacity} seats)</>
          ) : (
            <>
              Table {selectedTable.tableNumber} selected &mdash;{' '}
              {selectedTable.capacity - selectedTable.assignedGuests.length} seat
              {selectedTable.capacity - selectedTable.assignedGuests.length !== 1 ? 's' : ''} left
              &nbsp;· click a guest to seat them
            </>
          )
        ) : (
          'Select a table on the canvas first'
        )}
      </div>

      <ScrollArea className="flex-1">
        {/* Unassigned section */}
        <section className="px-2 pt-3">
          <div className="flex items-center gap-1.5 px-2 pb-1">
            <UserRound className="size-3.5 text-muted-foreground" />
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Unassigned
            </span>
            <span className="ml-auto text-xs text-muted-foreground">{unassigned.length}</span>
          </div>

          {unassigned.length === 0 ? (
            <p className="px-3 py-4 text-center text-xs text-muted-foreground">
              All guests have been seated 🎉
            </p>
          ) : (
            unassigned.map((guest) => (
              <GuestRow
                key={guest.id}
                guest={guest}
                isAssigned={false}
                assignedTable={null}
                isSelectable={!!selectedTable && !isAtCapacity}
                status={statusMap[guest.id] ?? 'idle'}
                onClick={() => onAssignGuest(guest.id)}
              />
            ))
          )}
        </section>

        {assigned.length > 0 && (
          <>
            <Separator className="mx-2 my-2" />
            <section className="px-2 pb-3">
              <div className="flex items-center gap-1.5 px-2 pb-1">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Seated
                </span>
                <span className="ml-auto text-xs text-muted-foreground">{assigned.length}</span>
              </div>

              {assigned.map((guest) => (
                <GuestRow
                  key={guest.id}
                  guest={guest}
                  isAssigned
                  assignedTable={getAssignedTable(guest.id, tables)}
                  isSelectable={false}
                  status={statusMap[guest.id] ?? 'idle'}
                  onClick={() => {}}
                />
              ))}
            </section>
          </>
        )}
      </ScrollArea>
    </aside>
  )
}
