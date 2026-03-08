import {
  type DocumentData,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
  type SnapshotOptions,
  type WithFieldValue,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'

import type { WeddingEvent, WeddingEventDocument } from '@/types/event'

/**
 * Firestore data converter for {@link WeddingEvent}.
 *
 * Handles:
 *  - Mapping Firestore `Timestamp` fields to JS `Date` on reads.
 *  - Injecting `serverTimestamp()` for `createdAt` / `updatedAt` on writes.
 *  - Stripping the client-side `id` field from the stored document.
 */
export const weddingEventConverter: FirestoreDataConverter<WeddingEvent> = {
  toFirestore(event: WithFieldValue<WeddingEvent>): DocumentData {
    // Destructure `id` out so it is never persisted inside the document.
    const { id: _id, createdAt, ...rest } = event as WeddingEvent & { createdAt?: unknown }

    return {
      ...rest,
      // Preserve an existing createdAt on updates; set server timestamp on creation.
      createdAt: createdAt instanceof Date
        ? Timestamp.fromDate(createdAt)
        : createdAt ?? serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
  },

  fromFirestore(
    snapshot: QueryDocumentSnapshot<WeddingEventDocument>,
    options?: SnapshotOptions,
  ): WeddingEvent {
    const data = snapshot.data(options)

    return {
      id: snapshot.id,
      name: data.name,
      date: data.date,
      venueName: data.venueName,
      tables: data.tables ?? [],
      status: data.status,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    }
  },
}
