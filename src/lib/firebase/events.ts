import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from './config'
import type { WeddingEvent, EventStatus } from '@/types/event'
import type { VenueTable } from '@/types/venue'

function toEvent(id: string, data: Record<string, unknown>): WeddingEvent {
  return {
    id,
    name: data.name as string,
    date: data.date as string,
    venueName: data.venueName as string,
    tables: (data.tables as VenueTable[]) ?? [],
    status: (data.status as EventStatus) ?? 'draft',
    createdAt: (data.createdAt as { toDate(): Date } | null)?.toDate() ?? new Date(),
    updatedAt: (data.updatedAt as { toDate(): Date } | null)?.toDate() ?? new Date(),
  }
}

export function subscribeEvents(
  userId: string,
  onUpdate: (events: WeddingEvent[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  // Only filter by ownerId — avoids requiring a composite index.
  // Sort by createdAt in memory instead.
  const q = query(
    collection(db, 'events'),
    where('ownerId', '==', userId),
  )
  return onSnapshot(
    q,
    (snapshot) => {
      const events = snapshot.docs
        .map(d => toEvent(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      onUpdate(events)
    },
    (err) => {
      console.error('[subscribeEvents]', err)
      onError?.(err)
      onUpdate([])
    },
  )
}

export function subscribeEvent(eventId: string, onUpdate: (event: WeddingEvent | null) => void): Unsubscribe {
  return onSnapshot(doc(db, 'events', eventId), (snapshot) => {
    if (!snapshot.exists()) {
      onUpdate(null)
      return
    }
    onUpdate(toEvent(snapshot.id, snapshot.data() as Record<string, unknown>))
  })
}

export async function createEvent(
  userId: string,
  data: { name: string; date: string; venueName: string },
): Promise<string> {
  const ref = await addDoc(collection(db, 'events'), {
    ...data,
    ownerId: userId,
    tables: [],
    status: 'draft',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateEventTables(eventId: string, tables: VenueTable[]): Promise<void> {
  await updateDoc(doc(db, 'events', eventId), {
    tables,
    updatedAt: serverTimestamp(),
  })
}

export async function updateEventMeta(
  eventId: string,
  data: Partial<{ name: string; date: string; venueName: string; status: EventStatus }>,
): Promise<void> {
  await updateDoc(doc(db, 'events', eventId), { ...data, updatedAt: serverTimestamp() })
}

export async function deleteEvent(eventId: string): Promise<void> {
  await deleteDoc(doc(db, 'events', eventId))
}
