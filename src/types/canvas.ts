// ─── base ─────────────────────────────────────────────────────────────────────

export interface BaseElement {
  id: string
  x: number
  y: number
  width: number
  height: number
  /** Rotation in degrees. */
  rotation: number
}

// ─── svg / raster image ───────────────────────────────────────────────────────

export interface SvgElement extends BaseElement {
  type: 'svg'
  /** Base64 data URL (data:image/svg+xml;...) or object URL. */
  src: string
  name: string
}

// ─── text ─────────────────────────────────────────────────────────────────────

export interface TextElement extends BaseElement {
  type: 'text'
  content: string
  fontSize: number
  fontFamily: string
  fill: string
  bold: boolean
  italic: boolean
}

// ─── table ────────────────────────────────────────────────────────────────────

export type TableShape = 'circle' | 'rectangle' | 'ellipse'

export interface TableElement extends BaseElement {
  type: 'table'
  shape: TableShape
  tableNumber: number
  /** Optional custom label displayed instead of the table number. */
  label?: string
  capacity: number
  assignedGuests: string[]
}

// ─── union ────────────────────────────────────────────────────────────────────

export type CanvasElement = SvgElement | TextElement | TableElement

// ─── active tool ─────────────────────────────────────────────────────────────

export type CanvasTool = 'select' | 'pan' | 'text'
