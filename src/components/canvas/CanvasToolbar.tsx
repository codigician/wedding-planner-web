import {
  ChevronDown,
  ChevronUp,
  ChevronsDown,
  ChevronsUp,
  CircleDashed,
  Hand,
  MousePointer2,
  RectangleHorizontal,
  RotateCcw,
  Trash2,
  Type,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type { CanvasTool, TableShape } from '@/types/canvas'

// ─── types ────────────────────────────────────────────────────────────────────

interface CanvasToolbarProps {
  eventName?: string
  activeTool: CanvasTool
  scale: number
  hasSelection: boolean
  onToolChange: (tool: CanvasTool) => void
  onAddTable: (shape: TableShape) => void
  onZoomIn: () => void
  onZoomOut: () => void
  onResetView: () => void
  onDeleteSelected: () => void
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function ToolButton({
  active,
  onClick,
  title,
  children,
}: {
  active?: boolean
  onClick: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <Button
      variant={active ? 'secondary' : 'ghost'}
      size="sm"
      title={title}
      onClick={onClick}
      className={cn('gap-1.5 px-2', active && 'ring-1 ring-violet-400')}
    >
      {children}
    </Button>
  )
}

// ─── component ────────────────────────────────────────────────────────────────

export function CanvasToolbar({
  eventName,
  activeTool,
  scale,
  hasSelection,
  onToolChange,
  onAddTable,
  onZoomIn,
  onZoomOut,
  onResetView,
  onDeleteSelected,
}: CanvasToolbarProps) {
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 shadow-sm">
      {/* event name */}
      {eventName && (
        <>
          <span className="text-sm font-semibold text-foreground truncate max-w-[180px]">{eventName}</span>
          <Separator orientation="vertical" className="h-6" />
        </>
      )}

      {/* ── selection tools ── */}
      <ToolButton active={activeTool === 'select'} onClick={() => onToolChange('select')} title="Select (V)">
        <MousePointer2 className="size-4" />
        <span className="text-xs">Select</span>
      </ToolButton>

      <ToolButton active={activeTool === 'pan'} onClick={() => onToolChange('pan')} title="Pan canvas (H)">
        <Hand className="size-4" />
        <span className="text-xs">Pan</span>
      </ToolButton>

      <ToolButton active={activeTool === 'text'} onClick={() => onToolChange('text')} title="Add text (T)">
        <Type className="size-4" />
        <span className="text-xs">Text</span>
      </ToolButton>

      <Separator orientation="vertical" className="h-6" />

      {/* ── add tables ── */}
      <span className="text-xs text-muted-foreground font-medium">Tables:</span>

      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => onAddTable('circle')} title="Add circle table">
        <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="8" cy="8" r="6" />
        </svg>
        <span className="text-xs">Circle</span>
      </Button>

      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => onAddTable('rectangle')} title="Add rectangle table">
        <RectangleHorizontal className="size-4" />
        <span className="text-xs">Rectangle</span>
      </Button>

      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => onAddTable('ellipse')} title="Add ellipse table">
        <CircleDashed className="size-4" />
        <span className="text-xs">Ellipse</span>
      </Button>

      <Separator orientation="vertical" className="h-6" />

      {/* ── zoom ── */}
      <Button variant="ghost" size="sm" onClick={onZoomOut} title="Zoom out">
        <ZoomOut className="size-4" />
      </Button>

      <Badge
        variant="outline"
        className="font-mono text-xs cursor-pointer select-none px-2"
        onClick={onResetView}
        title="Reset view"
      >
        {Math.round(scale * 100)}%
      </Badge>

      <Button variant="ghost" size="sm" onClick={onZoomIn} title="Zoom in">
        <ZoomIn className="size-4" />
      </Button>

      <Button variant="ghost" size="sm" onClick={onResetView} title="Reset view">
        <RotateCcw className="size-4" />
      </Button>

      <Separator orientation="vertical" className="h-6" />

      {/* ── delete ── */}
      <Button
        variant="destructive"
        size="sm"
        className="gap-1.5"
        disabled={!hasSelection}
        onClick={onDeleteSelected}
        title="Delete selected (Del)"
      >
        <Trash2 className="size-4" />
        <span className="text-xs">Delete</span>
      </Button>
    </div>
  )
}

// ─── context menu ─────────────────────────────────────────────────────────────

interface ContextMenuProps {
  x: number
  y: number
  layerIndex: number
  layerTotal: number
  onBringToFront: () => void
  onBringForward: () => void
  onSendBackward: () => void
  onSendToBack: () => void
  onDelete: () => void
  onClose: () => void
}

export function CanvasContextMenu({
  x,
  y,
  layerIndex,
  layerTotal,
  onBringToFront,
  onBringForward,
  onSendBackward,
  onSendToBack,
  onDelete,
  onClose,
}: ContextMenuProps) {
  function action(fn: () => void) {
    return () => { fn(); onClose() }
  }

  const atTop = layerIndex === layerTotal - 1
  const atBottom = layerIndex === 0

  return (
    <div
      className="absolute z-50 min-w-[180px] rounded-lg border border-border bg-popover shadow-lg py-1 text-sm text-popover-foreground"
      style={{ left: x, top: y }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="px-3 py-1.5 text-xs text-muted-foreground font-medium border-b border-border mb-1">
        Layer {layerIndex + 1} of {layerTotal}
      </div>

      <button
        className="flex w-full items-center gap-2.5 px-3 py-1.5 hover:bg-accent disabled:opacity-40 disabled:pointer-events-none"
        disabled={atTop}
        onClick={action(onBringToFront)}
      >
        <ChevronsUp className="size-3.5 shrink-0" /> Bring to Front
      </button>
      <button
        className="flex w-full items-center gap-2.5 px-3 py-1.5 hover:bg-accent disabled:opacity-40 disabled:pointer-events-none"
        disabled={atTop}
        onClick={action(onBringForward)}
      >
        <ChevronUp className="size-3.5 shrink-0" /> Bring Forward
      </button>
      <button
        className="flex w-full items-center gap-2.5 px-3 py-1.5 hover:bg-accent disabled:opacity-40 disabled:pointer-events-none"
        disabled={atBottom}
        onClick={action(onSendBackward)}
      >
        <ChevronDown className="size-3.5 shrink-0" /> Send Backward
      </button>
      <button
        className="flex w-full items-center gap-2.5 px-3 py-1.5 hover:bg-accent disabled:opacity-40 disabled:pointer-events-none"
        disabled={atBottom}
        onClick={action(onSendToBack)}
      >
        <ChevronsDown className="size-3.5 shrink-0" /> Send to Back
      </button>

      <div className="my-1 border-t border-border" />

      <button
        className="flex w-full items-center gap-2.5 px-3 py-1.5 hover:bg-destructive/10 text-destructive"
        onClick={action(onDelete)}
      >
        <Trash2 className="size-3.5 shrink-0" /> Delete
      </button>
    </div>
  )
}
