import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from './config'
import type { Guest } from '@/types/guest'

function guestsRef(eventId: string) {
  return collection(db, 'events', eventId, 'guests')
}

function guestRef(eventId: string, guestId: string) {
  return doc(db, 'events', eventId, 'guests', guestId)
}

function toGuest(id: string, data: Record<string, unknown>): Guest {
  return {
    id,
    name: data.name as string,
    email: data.email as string | undefined,
    mealPreference: data.mealPreference as Guest['mealPreference'],
    rsvpStatus: (data.rsvpStatus as Guest['rsvpStatus']) ?? 'pending',
  }
}

export function subscribeGuests(eventId: string, onUpdate: (guests: Guest[]) => void): Unsubscribe {
  return onSnapshot(guestsRef(eventId), (snapshot) => {
    const guests = snapshot.docs.map(d => toGuest(d.id, d.data() as Record<string, unknown>))
    onUpdate(guests)
  })
}

export async function addGuest(eventId: string, guest: Omit<Guest, 'id'>): Promise<string> {
  // Firestore rejects `undefined` values — strip optional fields that weren't provided
  const data: Record<string, unknown> = {
    name: guest.name,
    rsvpStatus: guest.rsvpStatus,
  }
  if (guest.email !== undefined) data.email = guest.email
  if (guest.mealPreference !== undefined) data.mealPreference = guest.mealPreference

  const ref = await addDoc(guestsRef(eventId), data)
  return ref.id
}

export async function updateGuest(eventId: string, guestId: string, data: Partial<Omit<Guest, 'id'>>): Promise<void> {
  // Firestore rejects `undefined` values — only include fields that are defined
  const clean: Record<string, unknown> = {}
  if (data.name !== undefined) clean.name = data.name
  if (data.rsvpStatus !== undefined) clean.rsvpStatus = data.rsvpStatus
  if (data.email !== undefined) clean.email = data.email
  if (data.mealPreference !== undefined) clean.mealPreference = data.mealPreference
  await updateDoc(guestRef(eventId, guestId), clean)
}

export async function deleteGuest(eventId: string, guestId: string): Promise<void> {
  await deleteDoc(guestRef(eventId, guestId))
}
