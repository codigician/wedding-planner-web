/** Shape variants a table can take on the venue floor plan. */
export type TableShape = 'round' | 'rectangle' | 'oval' | 'square'

export interface VenueTable {
  id: string
  tableNumber: number | string
  /** Optional custom name displayed instead of the table number (e.g. "Head Table"). */
  label?: string
  shape: TableShape
  x: number
  y: number
  capacity: number
  radius: number
  width: number
  height: number
  assignedGuests: string[]
}
