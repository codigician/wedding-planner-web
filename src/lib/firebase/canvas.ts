import { doc, onSnapshot, updateDoc, serverTimestamp, type Unsubscribe } from 'firebase/firestore'
import { db } from './config'
import type { CanvasElement } from '@/types/canvas'

export function subscribeEventCanvas(
  eventId: string,
  onUpdate: (elements: CanvasElement[]) => void,
): Unsubscribe {
  return onSnapshot(doc(db, 'events', eventId), (snapshot) => {
    if (!snapshot.exists()) { onUpdate([]); return }
    const data = snapshot.data() as Record<string, unknown>
    onUpdate((data.canvasElements as CanvasElement[]) ?? [])
  })
}

export async function updateEventCanvas(eventId: string, elements: CanvasElement[]): Promise<void> {
  await updateDoc(doc(db, 'events', eventId), {
    canvasElements: elements,
    updatedAt: serverTimestamp(),
  })
}
