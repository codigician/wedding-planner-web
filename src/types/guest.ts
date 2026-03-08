/** RSVP status values for a wedding guest. */
export type RsvpStatus = 'pending' | 'confirmed' | 'declined'

/** Meal preference options. */
export type MealPreference =
  | 'standard'
  | 'vegetarian'
  | 'vegan'
  | 'halal'
  | 'kosher'
  | 'gluten-free'

/**
 * A guest invited to the wedding.
 * Documents live in the Firestore `guests` collection.
 */
export interface Guest {
  /** Firestore document ID. */
  id: string
  /** Full display name. */
  name: string
  /** Contact e-mail (optional). */
  email?: string
  /** Dietary / meal preference. */
  mealPreference?: MealPreference
  /** Whether the guest has responded to the invitation. */
  rsvpStatus: RsvpStatus
}
