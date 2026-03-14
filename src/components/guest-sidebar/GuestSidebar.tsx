import { useEffect, useRef, useState } from 'react'
import { AlertCircle, ChevronLeft, ChevronRight, Loader2, Minus, Pencil, Plus, Search, Trash2, UserPlus, UserRound, Users, X } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type { AssignmentStatus } from '@/hooks/useGuestAssignment'
import type { Guest, MealPreference, RsvpStatus } from '@/types/guest'
import type { TableElement as VenueTable } from '@/types/canvas'

// ─── props ────────────────────────────────────────────────────────────────────

interface GuestSidebarProps {
  guests: Guest[]
  tables: VenueTable[]
  selectedTableId: string | null
  statusMap: Record<string, AssignmentStatus>
  onAssignGuest: (guestId: string) => void
  onRemoveGuest: (tableId: string, guestId: string) => void
  onRenameTable: (tableId: string, label: string) => void
  onUpdateCapacity: (tableId: string, capacity: number) => void
  onAddGuest: (guest: Guest) => void | Promise<void>
  onEditGuest: (guestId: string, data: Omit<Guest, 'id'>) => void | Promise<void>
  onDeleteGuest: (guestId: string) => void | Promise<void>
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
}

// ─── table name editor ────────────────────────────────────────────────────────

function TableNameEditor({ table, onRename }: { table: VenueTable; onRename: (l: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(table.label ?? '')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (!editing) setDraft(table.label ?? '') }, [table.label, editing])

  function commit() { onRename(draft.trim()); setEditing(false) }

  if (editing) {
    return (
      <Input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
        placeholder={`Table ${table.tableNumber}`}
        className="h-7 text-sm font-semibold"
        autoFocus
      />
    )
  }

  return (
    <button type="button" onClick={() => { setDraft(table.label ?? ''); setEditing(true) }}
      className="group flex items-center gap-1.5 text-left min-w-0">
      <span className="truncate text-sm font-semibold">
        {table.label || `Table ${table.tableNumber}`}
      </span>
      <Pencil className="size-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  )
}

// ─── capacity editor ──────────────────────────────────────────────────────────

function CapacityEditor({
  table,
  onUpdate,
}: {
  table: VenueTable
  onUpdate: (capacity: number) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(table.capacity))
  const min = table.assignedGuests.length  // can't shrink below seated count

  useEffect(() => { if (!editing) setDraft(String(table.capacity)) }, [table.capacity, editing])

  function commit(raw: string) {
    const n = parseInt(raw, 10)
    if (!isNaN(n)) onUpdate(Math.max(min, n))
    setEditing(false)
  }

  return (
    <div className="flex shrink-0 items-center gap-0.5">
      <button
        type="button"
        aria-label="Decrease capacity"
        disabled={table.capacity <= min}
        onClick={() => onUpdate(Math.max(min, table.capacity - 1))}
        className="flex size-5 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:pointer-events-none"
      >
        <Minus className="size-3" />
      </button>

      {editing ? (
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => commit(draft)}
          onKeyDown={(e) => { if (e.key === 'Enter') commit(draft); if (e.key === 'Escape') setEditing(false) }}
          className="h-5 w-8 px-0 text-center text-xs font-mono"
          autoFocus
        />
      ) : (
        <button
          type="button"
          aria-label="Edit capacity"
          onClick={() => { setDraft(String(table.capacity)); setEditing(true) }}
          className="w-8 text-center text-xs font-mono font-semibold hover:underline"
        >
          {table.capacity}
        </button>
      )}

      <button
        type="button"
        aria-label="Increase capacity"
        onClick={() => onUpdate(table.capacity + 1)}
        className="flex size-5 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <Plus className="size-3" />
      </button>
    </div>
  )
}

// ─── seated guest row (inside table panel) ────────────────────────────────────

function SeatedGuestRow({
  guest, tableId, status, onRemove,
}: { guest: Guest; tableId: string; status: AssignmentStatus; onRemove: (t: string, g: string) => void }) {
  return (
    <div className="group flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/40">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-semibold text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
        {initials(guest.name)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium leading-tight">{guest.name}</p>
        {guest.mealPreference && (
          <p className="truncate text-xs capitalize text-muted-foreground">{guest.mealPreference}</p>
        )}
      </div>
      {status === 'loading' && <Loader2 className="size-3.5 shrink-0 animate-spin text-purple-500" />}
      {status === 'error'   && <AlertCircle className="size-3.5 shrink-0 text-destructive" aria-label="Failed" />}
      <button type="button" aria-label={`Remove ${guest.name}`} onClick={() => onRemove(tableId, guest.id)}
        className="flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100">
        <X className="size-3.5" />
      </button>
    </div>
  )
}

// ─── all-guests row (filtered list) ───────────────────────────────────────────

type GuestRowState = 'addable' | 'at-table' | 'other-table' | 'no-table-selected'

function AllGuestRow({
  guest, rowState, tableLabel, status, onAdd, onEdit, onDelete,
}: {
  guest: Guest
  rowState: GuestRowState
  tableLabel: string
  status: AssignmentStatus
  onAdd: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const isLoading = status === 'loading'
  const isError   = status === 'error'

  return (
    <div className="group relative flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-muted/60">
      {/* Clickable assign area */}
      <button
        type="button"
        disabled={rowState !== 'addable' || isLoading}
        onClick={rowState === 'addable' ? onAdd : undefined}
        className={cn(
          'flex flex-1 items-center gap-2.5 text-left min-w-0',
          rowState === 'addable' && !isLoading ? 'cursor-pointer' : 'cursor-default',
          (rowState === 'at-table' || rowState === 'other-table') && 'opacity-50',
        )}
        tabIndex={rowState === 'addable' ? 0 : -1}
      >
        {/* Avatar */}
        <span className={cn(
          'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
          rowState === 'addable'
            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
            : 'bg-muted text-muted-foreground',
        )}>
          {initials(guest.name)}
        </span>

        {/* Name + detail */}
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium leading-tight">{guest.name}</p>
          {guest.mealPreference && (
            <p className="truncate text-xs capitalize text-muted-foreground">{guest.mealPreference}</p>
          )}
        </div>

        {/* Status / badge */}
        {isLoading && <Loader2 className="size-3.5 shrink-0 animate-spin text-purple-500" />}
        {isError   && <AlertCircle className="size-3.5 shrink-0 text-destructive" aria-label="Failed" />}
        {!isLoading && !isError && rowState === 'at-table' && (
          <Badge variant="secondary" className="shrink-0 text-xs">Here</Badge>
        )}
        {!isLoading && !isError && rowState === 'other-table' && (
          <Badge variant="outline" className="shrink-0 truncate max-w-[5rem] text-xs">{tableLabel}</Badge>
        )}
      </button>

      {/* Edit + delete actions (visible on row hover) */}
      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          aria-label={`Edit ${guest.name}`}
          onClick={(e) => { e.stopPropagation(); onEdit() }}
          className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Pencil className="size-3" />
        </button>
        <button
          type="button"
          aria-label={`Delete ${guest.name}`}
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-destructive"
        >
          <Trash2 className="size-3" />
        </button>
      </div>
    </div>
  )
}

// ─── add guest dialog ─────────────────────────────────────────────────────────

const MEAL_OPTIONS: MealPreference[] = ['standard', 'vegetarian', 'vegan', 'halal', 'kosher', 'gluten-free']
const RSVP_OPTIONS: RsvpStatus[] = ['confirmed', 'pending', 'declined']

function AddGuestDialog({ onAdd }: { onAdd: (guest: Guest) => void | Promise<void> }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [meal, setMeal] = useState<MealPreference>('standard')
  const [rsvp, setRsvp] = useState<RsvpStatus>('confirmed')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function reset() {
    setName(''); setEmail(''); setMeal('standard'); setRsvp('confirmed'); setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    setSaving(true)
    setError('')
    try {
      await onAdd({
        id: `g-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: trimmed,
        email: email.trim() || undefined,
        mealPreference: meal,
        rsvpStatus: rsvp,
      })
      reset()
      setOpen(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add guest.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset() }}>
      <DialogTrigger
        className="ml-1 flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        aria-label="Add guest"
      >
        <UserPlus className="size-4" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add guest</DialogTitle>
        </DialogHeader>
        <form id="add-guest-form" onSubmit={handleSubmit} className="space-y-3 pt-1">
          {/* Name */}
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="ag-name">Name <span className="text-destructive">*</span></label>
            <Input
              id="ag-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              required
              autoFocus
              disabled={saving}
            />
          </div>
          {/* Email */}
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="ag-email">Email <span className="text-xs text-muted-foreground">(optional)</span></label>
            <Input
              id="ag-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="guest@example.com"
              disabled={saving}
            />
          </div>
          {/* Meal preference */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Meal preference</label>
            <Select value={meal} onValueChange={(v) => setMeal(v as MealPreference)} disabled={saving}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MEAL_OPTIONS.map((m) => (
                  <SelectItem key={m} value={m} className="capitalize">{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* RSVP */}
          <div className="space-y-1">
            <label className="text-sm font-medium">RSVP status</label>
            <Select value={rsvp} onValueChange={(v) => setRsvp(v as RsvpStatus)} disabled={saving}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RSVP_OPTIONS.map((r) => (
                  <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error && (
            <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 rounded-lg px-3 py-2">{error}</p>
          )}
        </form>
        <DialogFooter>
          <Button variant="outline" type="button" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
          <Button type="submit" form="add-guest-form" disabled={!name.trim() || saving}>
            {saving ? 'Adding…' : 'Add guest'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── edit guest dialog ────────────────────────────────────────────────────────

function EditGuestDialog({
  guest,
  open,
  onClose,
  onSave,
}: {
  guest: Guest
  open: boolean
  onClose: () => void
  onSave: (guestId: string, data: Omit<Guest, 'id'>) => void | Promise<void>
}) {
  const [name, setName] = useState(guest.name)
  const [email, setEmail] = useState(guest.email ?? '')
  const [meal, setMeal] = useState<MealPreference>(guest.mealPreference ?? 'standard')
  const [rsvp, setRsvp] = useState<RsvpStatus>(guest.rsvpStatus)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Sync fields when guest prop changes (e.g. different guest opened)
  useEffect(() => {
    setName(guest.name)
    setEmail(guest.email ?? '')
    setMeal(guest.mealPreference ?? 'standard')
    setRsvp(guest.rsvpStatus)
    setError('')
  }, [guest])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    setSaving(true)
    setError('')
    try {
      await onSave(guest.id, {
        name: trimmed,
        email: email.trim() || undefined,
        mealPreference: meal,
        rsvpStatus: rsvp,
      })
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save changes.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit guest</DialogTitle>
        </DialogHeader>
        <form id="edit-guest-form" onSubmit={handleSubmit} className="space-y-3 pt-1">
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="eg-name">Name <span className="text-destructive">*</span></label>
            <Input id="eg-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" required autoFocus disabled={saving} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="eg-email">Email <span className="text-xs text-muted-foreground">(optional)</span></label>
            <Input id="eg-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="guest@example.com" disabled={saving} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Meal preference</label>
            <Select value={meal} onValueChange={(v) => setMeal(v as MealPreference)} disabled={saving}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MEAL_OPTIONS.map((m) => <SelectItem key={m} value={m} className="capitalize">{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">RSVP status</label>
            <Select value={rsvp} onValueChange={(v) => setRsvp(v as RsvpStatus)} disabled={saving}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {RSVP_OPTIONS.map((r) => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 rounded-lg px-3 py-2">{error}</p>}
        </form>
        <DialogFooter>
          <Button variant="outline" type="button" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" form="edit-guest-form" disabled={!name.trim() || saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── delete guest confirm dialog ─────────────────────────────────────────────

function DeleteGuestDialog({
  guest,
  open,
  onClose,
  onConfirm,
}: {
  guest: Guest
  open: boolean
  onClose: () => void
  onConfirm: (guestId: string) => void | Promise<void>
}) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  async function handleDelete() {
    setDeleting(true)
    setError('')
    try {
      await onConfirm(guest.id)
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete guest.')
      setDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>Delete guest?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">{guest.name}</strong> will be permanently removed. This cannot be undone.
        </p>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={deleting}>Cancel</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
  onUpdateCapacity,
  onAddGuest,
  onEditGuest,
  onDeleteGuest,
}: GuestSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [search, setSearch] = useState('')
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null)
  const [deletingGuest, setDeletingGuest] = useState<Guest | null>(null)

  const selectedTable = tables.find((t) => t.id === selectedTableId) ?? null

  // Build a map: guestId → table it's assigned to
  const guestTableMap = new Map<string, VenueTable>()
  for (const t of tables) {
    for (const gid of t.assignedGuests) guestTableMap.set(gid, t)
  }

  const isFull = selectedTable != null &&
    selectedTable.assignedGuests.length >= selectedTable.capacity
  const seatsLeft = selectedTable ? selectedTable.capacity - selectedTable.assignedGuests.length : 0

  // Guests seated at the selected table (for the detail panel)
  const seatedGuests = selectedTable
    ? selectedTable.assignedGuests
        .map((id) => guests.find((g) => g.id === id))
        .filter((g): g is Guest => Boolean(g))
    : []

  // Filtered guest list for the search section
  const query = search.trim().toLowerCase()
  const filtered = guests.filter((g) =>
    !query || g.name.toLowerCase().includes(query),
  )

  // Guests NOT already seated at the selected table (to avoid duplication)
  const listGuests = selectedTable
    ? filtered.filter((g) => !selectedTable.assignedGuests.includes(g.id))
    : filtered

  function getRowState(guest: Guest): GuestRowState {
    const assignedTo = guestTableMap.get(guest.id)
    if (assignedTo) return 'other-table'          // always show table badge if assigned
    if (!selectedTable) return 'no-table-selected'
    if (isFull) return 'no-table-selected'         // disable add when full
    return 'addable'
  }

  function tableLabel(t: VenueTable) {
    return t.label ? t.label : `Table ${t.tableNumber}`
  }

  const totalUnseated = guests.filter((g) => !guestTableMap.has(g.id)).length

  // Build grouped structure for the guest list
  const tableGroupMap = new Map<string, { table: VenueTable; guests: Guest[] }>()
  const unassignedGuests: Guest[] = []

  for (const guest of listGuests) {
    const assignedTo = guestTableMap.get(guest.id)
    if (assignedTo) {
      if (!tableGroupMap.has(assignedTo.id)) {
        tableGroupMap.set(assignedTo.id, { table: assignedTo, guests: [] })
      }
      tableGroupMap.get(assignedTo.id)!.guests.push(guest)
    } else {
      unassignedGuests.push(guest)
    }
  }

  // Sort table groups by tableNumber for consistent ordering
  const sortedTableGroups = Array.from(tableGroupMap.values()).sort(
    (a, b) => Number(a.table.tableNumber) - Number(b.table.tableNumber),
  )

  return (
    <aside className={cn(
      'flex h-full shrink-0 flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden transition-all duration-200',
      collapsed ? 'w-8' : 'w-72',
    )}>

      {/* collapse toggle */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="flex items-center justify-center h-8 hover:bg-muted transition-colors border-b border-border shrink-0"
        title={collapsed ? 'Expand guest panel' : 'Collapse guest panel'}
      >
        {collapsed ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />}
      </button>

      {!collapsed && (<>

      {/* ── header ── */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Users className="size-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold">Guests</h2>
        <Badge variant="outline" className="ml-auto text-xs">{totalUnseated} unseated</Badge>
        <AddGuestDialog onAdd={onAddGuest} />
      </div>

      {/* ── search ── */}
      <div className="border-b border-border px-3 py-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search guests…"
            className="h-8 pl-7 text-sm"
          />
          {search && (
            <button type="button" onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0">

        {/* ── selected table panel ── */}
        {selectedTable && (
          <div className="px-3 pt-3 pb-2 space-y-2">

            {/* Name + capacity row */}
            <div className="flex items-center gap-2">
              <TableNameEditor
                table={selectedTable}
                onRename={(l) => onRenameTable(selectedTable.id, l)}
              />
              <div className="ml-auto flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground font-mono">
                  {selectedTable.assignedGuests.length}/
                </span>
                <CapacityEditor
                  table={selectedTable}
                  onUpdate={(cap) => onUpdateCapacity(selectedTable.id, cap)}
                />
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all', isFull ? 'bg-destructive' : 'bg-purple-500')}
                style={{ width: `${Math.min(100, (selectedTable.assignedGuests.length / selectedTable.capacity) * 100)}%` }}
              />
            </div>

            {/* Seated list */}
            {seatedGuests.length > 0 ? (
              <div className="space-y-0.5 pt-0.5">
                {seatedGuests.map((g) => (
                  <SeatedGuestRow key={g.id} guest={g} tableId={selectedTable.id}
                    status={statusMap[g.id] ?? 'idle'} onRemove={onRemoveGuest} />
                ))}
              </div>
            ) : (
              <p className="py-1.5 text-center text-xs text-muted-foreground">No guests seated yet</p>
            )}

            <Separator />

            <p className={cn('text-xs', isFull ? 'text-destructive' : 'text-purple-600 dark:text-purple-400')}>
              {isFull ? 'Table is full' : `${seatsLeft} seat${seatsLeft !== 1 ? 's' : ''} free — click a guest below`}
            </p>
          </div>
        )}

        {/* ── all guests list (grouped by table) ── */}
        <section className="px-2 pb-3">
          {/* Section header */}
          <div className="flex items-center gap-1.5 px-2 py-2">
            <UserRound className="size-3.5 text-muted-foreground" />
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {query ? `Results (${listGuests.length})` : 'All guests'}
            </span>
          </div>

          {!selectedTable && !query && (
            <p className="px-2 pb-2 text-xs text-muted-foreground">
              Select a table on the canvas, then click a guest to seat them
            </p>
          )}

          {listGuests.length === 0 ? (
            <p className="px-3 py-4 text-center text-xs text-muted-foreground">
              {query ? 'No guests match your search' : 'All guests are seated 🎉'}
            </p>
          ) : (
            <Accordion
              defaultValue={[
                ...sortedTableGroups.map(({ table: t }) => t.id),
                'unassigned',
              ]}
              className="space-y-0.5"
            >
              {/* Assigned groups */}
              {sortedTableGroups.map(({ table: t, guests: tGuests }) => (
                <AccordionItem key={t.id} value={t.id} className="border-0">
                  <AccordionTrigger className="rounded-md px-2 py-1.5 text-xs font-semibold hover:bg-muted/60 hover:no-underline [&>svg]:size-3.5">
                    <span className="truncate">{tableLabel(t)}</span>
                    <span className="ml-auto mr-1.5 shrink-0 tabular-nums text-muted-foreground">
                      {t.assignedGuests.length}/{t.capacity}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-1 pt-0 [&_p]:!mb-0">
                    {tGuests.map((guest) => (
                      <AllGuestRow
                        key={guest.id}
                        guest={guest}
                        rowState={getRowState(guest)}
                        tableLabel=""
                        status={statusMap[guest.id] ?? 'idle'}
                        onAdd={() => onAssignGuest(guest.id)}
                        onEdit={() => setEditingGuest(guest)}
                        onDelete={() => setDeletingGuest(guest)}
                      />
                    ))}
                  </AccordionContent>
                </AccordionItem>
              ))}

              {/* Unassigned group */}
              {unassignedGuests.length > 0 && (
                <AccordionItem value="unassigned" className="border-0">
                  <AccordionTrigger className="rounded-md px-2 py-1.5 text-xs font-semibold hover:bg-muted/60 hover:no-underline [&>svg]:size-3.5">
                    <span className="truncate">Unassigned</span>
                    <span className="ml-auto mr-1.5 shrink-0 tabular-nums text-muted-foreground">
                      {unassignedGuests.length}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-1 pt-0 [&_p]:!mb-0">
                    {unassignedGuests.map((guest) => (
                      <AllGuestRow
                        key={guest.id}
                        guest={guest}
                        rowState={getRowState(guest)}
                        tableLabel=""
                        status={statusMap[guest.id] ?? 'idle'}
                        onAdd={() => onAssignGuest(guest.id)}
                        onEdit={() => setEditingGuest(guest)}
                        onDelete={() => setDeletingGuest(guest)}
                      />
                    ))}
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          )}
        </section>

      </ScrollArea>

      {/* Edit + delete dialogs (rendered outside the scroll area) */}
      {editingGuest && (
        <EditGuestDialog
          guest={editingGuest}
          open={true}
          onClose={() => setEditingGuest(null)}
          onSave={onEditGuest}
        />
      )}
      {deletingGuest && (
        <DeleteGuestDialog
          guest={deletingGuest}
          open={true}
          onClose={() => setDeletingGuest(null)}
          onConfirm={onDeleteGuest}
        />
      )}

      </>)}
    </aside>
  )
}
