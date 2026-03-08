/** Shape variants a table can take on the venue floor plan. */
export type TableShape = 'round' | 'rectangle' | 'oval' | 'square'

/**
 * Represents a single table placed on the venue floor plan.
 */
export interface VenueTable {
  id: string
  tableNumber: number | string
  shape: TableShape
  x: number
  y: number
  capacity: number
  /** Radius in px — used when shape === 'round'. */
  radius: number
  /** Width in px — used when shape === 'rectangle'. */
  width: number
  /** Height in px — used when shape === 'rectangle'. */
  height: number
  assignedGuests: string[]
}
