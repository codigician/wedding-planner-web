import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusIcon, CalendarIcon, MapPinIcon, LogOutIcon, HeartIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/AuthContext'
import { subscribeEvents, createEvent, deleteEvent } from '@/lib/firebase/events'
import { signOutUser } from '@/lib/firebase/auth'
import type { WeddingEvent } from '@/types/event'

export default function EventsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [events, setEvents] = useState<WeddingEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [firestoreError, setFirestoreError] = useState('')
  const [createOpen, setCreateOpen] = useState(false)

  useEffect(() => {
    if (!user) return
    const unsub = subscribeEvents(
      user.uid,
      (evts) => {
        setEvents(evts)
        setLoading(false)
        setFirestoreError('')
      },
      (err) => {
        setLoading(false)
        setFirestoreError(err.message)
      },
    )
    return unsub
  }, [user])

  async function handleSignOut() {
    await signOutUser()
    navigate('/auth')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
            <HeartIcon className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-lg">Wedding Planner</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground hidden sm:block">
            {user?.displayName ?? user?.email}
          </span>
          <Button variant="outline" size="sm" onClick={handleSignOut} className="gap-1.5">
            <LogOutIcon className="w-3.5 h-3.5" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold">Your Events</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your wedding floor plans and guest lists.</p>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <PlusIcon className="w-4 h-4" />
            New Event
          </Button>
        </div>

        {firestoreError && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900 px-4 py-3 text-sm text-red-700 dark:text-red-400">
            <strong>Could not load events:</strong> {firestoreError}
            <br />
            <span className="text-xs opacity-80">Check your Firestore security rules allow reads for authenticated users.</span>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
            <div className="w-8 h-8 rounded-full border-2 border-violet-600 border-t-transparent animate-spin" />
            <p className="text-sm">Loading your events…</p>
          </div>
        ) : events.length === 0 ? (
          <EmptyState onCreateClick={() => setCreateOpen(true)} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map(event => (
              <EventCard
                key={event.id}
                event={event}
                onClick={() => navigate(`/events/${event.id}`)}
                onDelete={() => deleteEvent(event.id)}
              />
            ))}
          </div>
        )}
      </main>

      <CreateEventDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(id) => navigate(`/events/${id}`)}
        userId={user?.uid ?? ''}
      />
    </div>
  )
}

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-violet-100 dark:bg-violet-950 flex items-center justify-center mb-4">
        <HeartIcon className="w-8 h-8 text-violet-600" />
      </div>
      <h2 className="text-lg font-semibold mb-1">No events yet</h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs">
        Create your first event to start planning your venue floor plan and guest seating.
      </p>
      <Button onClick={onCreateClick} className="gap-2">
        <PlusIcon className="w-4 h-4" />
        Create First Event
      </Button>
    </div>
  )
}

function EventCard({
  event,
  onClick,
  onDelete,
}: {
  event: WeddingEvent
  onClick: () => void
  onDelete: () => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  const statusColors: Record<string, string> = {
    draft: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    confirmed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  }

  return (
    <div
      className="group relative border rounded-xl p-5 hover:border-violet-400 hover:shadow-sm transition-all cursor-pointer bg-card"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${statusColors[event.status]}`}>
          {event.status}
        </span>
        <button
          type="button"
          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500 p-1 rounded"
          onClick={e => { e.stopPropagation(); setConfirmDelete(true) }}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <h3 className="font-semibold text-base mb-2 leading-tight">{event.name}</h3>
      <div className="space-y-1">
        {event.date && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarIcon className="w-3.5 h-3.5 flex-shrink-0" />
            {new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        )}
        {event.venueName && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPinIcon className="w-3.5 h-3.5 flex-shrink-0" />
            {event.venueName}
          </div>
        )}
      </div>
      <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
        {event.tables.length} table{event.tables.length !== 1 ? 's' : ''} · {event.tables.reduce((n, t) => n + t.assignedGuests.length, 0)} guests seated
      </div>

      {/* Confirm delete overlay */}
      {confirmDelete && (
        <div
          className="absolute inset-0 rounded-xl bg-background/90 backdrop-blur-sm flex flex-col items-center justify-center gap-3 p-4"
          onClick={e => e.stopPropagation()}
        >
          <p className="text-sm font-medium text-center">Delete this event?</p>
          <p className="text-xs text-muted-foreground text-center">This cannot be undone.</p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setConfirmDelete(false)}>Cancel</Button>
            <Button size="sm" variant="destructive" onClick={onDelete}>Delete</Button>
          </div>
        </div>
      )}
    </div>
  )
}

function CreateEventDialog({
  open,
  onClose,
  onCreated,
  userId,
}: {
  open: boolean
  onClose: () => void
  onCreated: (id: string) => void
  userId: string
}) {
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [venueName, setVenueName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError('')
    try {
      const id = await createEvent(userId, { name: name.trim(), date, venueName: venueName.trim() })
      setName(''); setDate(''); setVenueName('')
      onCreated(id)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create event.')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-md bg-background rounded-2xl shadow-xl p-6">
        <h2 className="text-lg font-semibold mb-1">Create New Event</h2>
        <p className="text-sm text-muted-foreground mb-5">Fill in the details to get started.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="event-name">Event name *</label>
            <Input
              id="event-name"
              placeholder="Smith & Jones Wedding"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="event-date">Date</label>
            <Input
              id="event-date"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="venue-name">Venue name</label>
            <Input
              id="venue-name"
              placeholder="Grand Ballroom"
              value={venueName}
              onChange={e => setVenueName(e.target.value)}
              disabled={loading}
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading || !name.trim()}>
              {loading ? 'Creating…' : 'Create Event'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
