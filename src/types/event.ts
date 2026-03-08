import type { VenueTable } from './venue'

/** Current lifecycle state of a wedding event. */
export type EventStatus = 'draft' | 'confirmed' | 'completed' | 'cancelled'

/**
 * Core domain model for a wedding event stored in Firestore.
 *
 * The `id` field mirrors the Firestore document ID and is
 * populated by the converter — it is NOT stored inside the
 * document itself.
 */
export interface WeddingEvent {
  /** Firestore document ID (populated by the converter, not stored in the document). */
  id: string
  /** Display name for the event (e.g. "Smith & Jones Wedding"). */
  name: string
  /** ISO-8601 date string of the wedding day (e.g. "2026-06-14"). */
  date: string
  /** Name of the venue. */
  venueName: string
  /** All tables laid out on the venue floor plan for this event. */
  tables: VenueTable[]
  /** Lifecycle status of the event. */
  status: EventStatus
  /** Firestore server timestamp — set on creation, never updated. */
  createdAt: Date
  /** Firestore server timestamp — updated on every write. */
  updatedAt: Date
}

/**
 * Shape of the raw Firestore document (no `id` field, dates as Timestamps).
 * Used internally by the converter.
 */
export type WeddingEventDocument = Omit<WeddingEvent, 'id' | 'createdAt' | 'updatedAt'> & {
  createdAt: import('firebase/firestore').Timestamp
  updatedAt: import('firebase/firestore').Timestamp
}
