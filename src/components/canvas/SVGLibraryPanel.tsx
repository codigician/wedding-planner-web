import { useId, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Upload } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { SVG_ASSETS, SVG_ASSET_CATEGORIES, type SvgAsset } from './svg-assets'

// ─── types ────────────────────────────────────────────────────────────────────

interface SVGLibraryPanelProps {
  onAddAsset: (asset: SvgAsset) => void
}

// ─── component ────────────────────────────────────────────────────────────────

export function SVGLibraryPanel({ onAddAsset }: SVGLibraryPanelProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string>(SVG_ASSET_CATEGORIES[0])
  const [warning, setWarning] = useState<string | null>(null)
  const fileInputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = SVG_ASSETS.filter((a) => a.category === activeCategory)

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    if (file.size > 500_000) {
      setWarning('SVG is large (>500KB). It will be stored as-is in the canvas.')
    } else {
      setWarning(null)
    }

    const reader = new FileReader()
    reader.onload = (ev) => {
      const src = ev.target?.result as string
      if (!src) return
      onAddAsset({
        id: `upload-${Date.now()}`,
        name: file.name.replace(/\.svg$/i, ''),
        category: 'Decor',
        src,
        defaultWidth: 120,
        defaultHeight: 120,
      })
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className={cn(
      'flex flex-col shrink-0 border-r border-border bg-card transition-all duration-200 overflow-hidden',
      collapsed ? 'w-8' : 'w-48',
    )}>
      {/* collapse toggle */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="flex items-center justify-center h-8 hover:bg-muted transition-colors border-b border-border"
        title={collapsed ? 'Expand asset panel' : 'Collapse asset panel'}
      >
        {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
      </button>

      {!collapsed && (
        <>
          {/* category tabs */}
          <div className="flex border-b border-border">
            {SVG_ASSET_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  'flex-1 text-xs py-1.5 transition-colors',
                  activeCategory === cat
                    ? 'text-violet-700 font-semibold border-b-2 border-violet-500 -mb-px'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* asset grid */}
          <ScrollArea className="flex-1">
            <div className="grid grid-cols-2 gap-1.5 p-2">
              {filtered.map((asset) => (
                <button
                  key={asset.id}
                  onClick={() => onAddAsset(asset)}
                  title={`Add ${asset.name}`}
                  className="flex flex-col items-center gap-1 rounded-lg border border-border bg-background p-1.5 hover:border-violet-400 hover:bg-violet-50 transition-colors group"
                >
                  <img
                    src={asset.src}
                    alt={asset.name}
                    className="w-12 h-12 object-contain"
                    draggable={false}
                  />
                  <span className="text-[10px] text-muted-foreground group-hover:text-violet-700 leading-tight text-center">
                    {asset.name}
                  </span>
                </button>
              ))}
            </div>
          </ScrollArea>

          {/* upload */}
          <div className="border-t border-border p-2 flex flex-col gap-1.5">
            {warning && (
              <p className="text-[10px] text-amber-600 leading-tight">{warning}</p>
            )}
            <label
              htmlFor={fileInputId}
              className="flex items-center justify-center gap-1.5 cursor-pointer rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium ring-offset-background hover:bg-accent hover:text-accent-foreground w-full"
            >
              <Upload className="size-3.5" />
              Upload SVG
            </label>
            <input
              ref={inputRef}
              id={fileInputId}
              type="file"
              accept=".svg,image/svg+xml"
              className="sr-only"
              onChange={handleUpload}
            />
          </div>
        </>
      )}
    </div>
  )
}
