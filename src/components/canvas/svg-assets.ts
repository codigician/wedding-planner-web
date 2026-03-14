// Pre-built wedding venue SVG assets as data URLs.
// Tables (circle/rectangle/ellipse) are NOT here — they are added via the toolbar.

function svgUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

export interface SvgAsset {
  id: string
  name: string
  category: 'Decor' | 'Service' | 'Outdoor'
  src: string
  defaultWidth: number
  defaultHeight: number
}

// ─── SVG definitions ──────────────────────────────────────────────────────────

const FLOWER_ARRANGEMENT = svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <path d="M40 78 Q36 88 42 92 H58 Q64 88 60 78Z" fill="#92400e"/>
  <line x1="50" y1="78" x2="50" y2="60" stroke="#15803d" stroke-width="2.5"/>
  <line x1="50" y1="68" x2="41" y2="60" stroke="#15803d" stroke-width="1.5"/>
  <ellipse cx="50" cy="32" rx="5" ry="9" fill="#f9a8d4"/>
  <ellipse cx="50" cy="54" rx="5" ry="9" fill="#f9a8d4"/>
  <ellipse cx="38" cy="43" rx="9" ry="5" fill="#f9a8d4"/>
  <ellipse cx="62" cy="43" rx="9" ry="5" fill="#f9a8d4"/>
  <ellipse cx="41" cy="35" rx="5" ry="9" transform="rotate(-45 41 35)" fill="#fbcfe8"/>
  <ellipse cx="59" cy="35" rx="5" ry="9" transform="rotate(45 59 35)" fill="#fbcfe8"/>
  <ellipse cx="41" cy="51" rx="5" ry="9" transform="rotate(45 41 51)" fill="#fbcfe8"/>
  <ellipse cx="59" cy="51" rx="5" ry="9" transform="rotate(-45 59 51)" fill="#fbcfe8"/>
  <circle cx="50" cy="43" r="7" fill="#fbbf24"/>
  <circle cx="50" cy="43" r="3" fill="#d97706"/>
</svg>`)

const WEDDING_ARCH = svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect x="12" y="35" width="10" height="60" rx="5" fill="#d97706"/>
  <rect x="78" y="35" width="10" height="60" rx="5" fill="#d97706"/>
  <path d="M17 35 Q17 5 50 5 Q83 5 83 35" fill="none" stroke="#d97706" stroke-width="10" stroke-linecap="round"/>
  <circle cx="26" cy="18" r="7" fill="#f9a8d4"/>
  <circle cx="26" cy="18" r="3" fill="#fbbf24"/>
  <circle cx="50" cy="8" r="7" fill="#fda4af"/>
  <circle cx="50" cy="8" r="3" fill="#fbbf24"/>
  <circle cx="74" cy="18" r="7" fill="#f9a8d4"/>
  <circle cx="74" cy="18" r="3" fill="#fbbf24"/>
  <line x1="17" y1="35" x2="17" y2="65" stroke="#15803d" stroke-width="2"/>
  <line x1="83" y1="35" x2="83" y2="65" stroke="#15803d" stroke-width="2"/>
</svg>`)

const CAKE_STAND = svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <ellipse cx="50" cy="90" rx="30" ry="6" fill="#d1d5db"/>
  <rect x="47" y="82" width="6" height="10" fill="#9ca3af"/>
  <rect x="30" y="68" width="40" height="20" rx="4" fill="#fce7f3"/>
  <rect x="30" y="68" width="40" height="6" rx="4" fill="#fbcfe8"/>
  <rect x="36" y="48" width="28" height="22" rx="4" fill="#fce7f3"/>
  <rect x="36" y="48" width="28" height="6" rx="4" fill="#f9a8d4"/>
  <rect x="41" y="30" width="18" height="20" rx="4" fill="#fce7f3"/>
  <rect x="41" y="30" width="18" height="6" rx="4" fill="#f9a8d4"/>
  <circle cx="50" cy="28" r="5" fill="#fbbf24"/>
  <line x1="44" y1="60" x2="44" y2="60" stroke="#f43f5e" stroke-width="2"/>
  <line x1="50" y1="60" x2="50" y2="60" stroke="#f43f5e" stroke-width="2"/>
  <line x1="56" y1="60" x2="56" y2="60" stroke="#f43f5e" stroke-width="2"/>
</svg>`)

const GIFT_TABLE = svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect x="5" y="72" width="90" height="12" rx="3" fill="#7c3aed"/>
  <rect x="5" y="82" width="6" height="14" rx="2" fill="#6d28d9"/>
  <rect x="89" y="82" width="6" height="14" rx="2" fill="#6d28d9"/>
  <rect x="30" y="42" width="40" height="32" rx="3" fill="#f9a8d4"/>
  <rect x="47" y="42" width="6" height="32" fill="#f472b6"/>
  <rect x="30" y="56" width="40" height="6" fill="#f472b6"/>
  <path d="M50 42 Q40 30 35 35 Q30 40 50 42Z" fill="#fb7185"/>
  <path d="M50 42 Q60 30 65 35 Q70 40 50 42Z" fill="#fb7185"/>
  <rect x="60" y="50" width="20" height="16" rx="2" fill="#bfdbfe"/>
  <rect x="67" y="50" width="4" height="16" fill="#93c5fd"/>
  <rect x="60" y="56" width="20" height="4" fill="#93c5fd"/>
</svg>`)

const STAGE = svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect x="5" y="35" width="90" height="45" rx="4" fill="#374151"/>
  <rect x="5" y="35" width="90" height="8" rx="4" fill="#4b5563"/>
  <rect x="5" y="78" width="18" height="14" rx="2" fill="#374151"/>
  <rect x="38" y="78" width="24" height="14" rx="2" fill="#374151"/>
  <rect x="77" y="78" width="18" height="14" rx="2" fill="#374151"/>
  <ellipse cx="25" cy="55" rx="6" ry="10" fill="#fbbf24" opacity="0.7"/>
  <ellipse cx="50" cy="55" rx="6" ry="10" fill="#fbbf24" opacity="0.7"/>
  <ellipse cx="75" cy="55" rx="6" ry="10" fill="#fbbf24" opacity="0.7"/>
  <rect x="45" y="12" width="10" height="25" fill="#6b7280"/>
  <ellipse cx="50" cy="10" rx="8" ry="5" fill="#9ca3af"/>
</svg>`)

const DANCE_FLOOR = svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect x="5" y="5" width="90" height="90" rx="4" fill="#e5e7eb"/>
  <rect x="5" y="5" width="22" height="22" fill="#c4b5fd"/>
  <rect x="27" y="5" width="22" height="22" fill="#e5e7eb"/>
  <rect x="49" y="5" width="22" height="22" fill="#c4b5fd"/>
  <rect x="71" y="5" width="24" height="22" fill="#e5e7eb"/>
  <rect x="5" y="27" width="22" height="22" fill="#e5e7eb"/>
  <rect x="27" y="27" width="22" height="22" fill="#c4b5fd"/>
  <rect x="49" y="27" width="22" height="22" fill="#e5e7eb"/>
  <rect x="71" y="27" width="24" height="22" fill="#c4b5fd"/>
  <rect x="5" y="49" width="22" height="22" fill="#c4b5fd"/>
  <rect x="27" y="49" width="22" height="22" fill="#e5e7eb"/>
  <rect x="49" y="49" width="22" height="22" fill="#c4b5fd"/>
  <rect x="71" y="49" width="24" height="22" fill="#e5e7eb"/>
  <rect x="5" y="71" width="22" height="24" fill="#e5e7eb"/>
  <rect x="27" y="71" width="22" height="24" fill="#c4b5fd"/>
  <rect x="49" y="71" width="22" height="24" fill="#e5e7eb"/>
  <rect x="71" y="71" width="24" height="24" fill="#c4b5fd"/>
  <rect x="5" y="5" width="90" height="90" rx="4" fill="none" stroke="#a78bfa" stroke-width="2"/>
</svg>`)

const BAR_COUNTER = svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect x="5" y="50" width="90" height="40" rx="4" fill="#78350f"/>
  <rect x="5" y="50" width="90" height="8" rx="4" fill="#92400e"/>
  <rect x="15" y="22" width="10" height="28" rx="3" fill="#bfdbfe"/>
  <ellipse cx="20" cy="22" rx="5" ry="3" fill="#93c5fd"/>
  <rect x="30" y="26" width="8" height="24" rx="3" fill="#d1fae5"/>
  <ellipse cx="34" cy="26" rx="4" ry="2.5" fill="#a7f3d0"/>
  <rect x="44" y="20" width="12" height="30" rx="3" fill="#fde68a"/>
  <ellipse cx="50" cy="20" rx="6" ry="3.5" fill="#fcd34d"/>
  <rect x="62" y="24" width="8" height="26" rx="3" fill="#fecaca"/>
  <ellipse cx="66" cy="24" rx="4" ry="2.5" fill="#fca5a5"/>
  <rect x="76" y="22" width="10" height="28" rx="3" fill="#e9d5ff"/>
  <ellipse cx="81" cy="22" rx="5" ry="3" fill="#d8b4fe"/>
  <line x1="5" y1="15" x2="95" y2="15" stroke="#6b7280" stroke-width="2"/>
  <line x1="5" y1="15" x2="5" y2="50" stroke="#6b7280" stroke-width="2"/>
  <line x1="95" y1="15" x2="95" y2="50" stroke="#6b7280" stroke-width="2"/>
</svg>`)

const BUFFET_TABLE = svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect x="5" y="55" width="90" height="12" rx="3" fill="#7c3aed"/>
  <rect x="5" y="65" width="6" height="22" rx="2" fill="#6d28d9"/>
  <rect x="89" y="65" width="6" height="22" rx="2" fill="#6d28d9"/>
  <circle cx="18" cy="50" r="10" fill="#fde68a" stroke="#f59e0b" stroke-width="1.5"/>
  <circle cx="18" cy="50" r="5" fill="#f59e0b"/>
  <circle cx="36" cy="48" r="10" fill="#bbf7d0" stroke="#22c55e" stroke-width="1.5"/>
  <circle cx="36" cy="48" r="5" fill="#22c55e"/>
  <circle cx="54" cy="50" r="10" fill="#fed7aa" stroke="#f97316" stroke-width="1.5"/>
  <circle cx="54" cy="50" r="5" fill="#f97316"/>
  <circle cx="72" cy="48" r="10" fill="#fecaca" stroke="#ef4444" stroke-width="1.5"/>
  <circle cx="72" cy="48" r="5" fill="#ef4444"/>
  <circle cx="88" cy="50" r="8" fill="#e9d5ff" stroke="#a855f7" stroke-width="1.5"/>
  <circle cx="88" cy="50" r="4" fill="#a855f7"/>
</svg>`)

const DJ_BOOTH = svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect x="8" y="40" width="84" height="50" rx="5" fill="#1e1b4b"/>
  <rect x="8" y="40" width="84" height="10" rx="5" fill="#2e1065"/>
  <circle cx="30" cy="65" r="14" fill="#312e81" stroke="#6366f1" stroke-width="2"/>
  <circle cx="30" cy="65" r="8" fill="#4338ca"/>
  <circle cx="30" cy="65" r="3" fill="#818cf8"/>
  <circle cx="70" cy="65" r="14" fill="#312e81" stroke="#6366f1" stroke-width="2"/>
  <circle cx="70" cy="65" r="8" fill="#4338ca"/>
  <circle cx="70" cy="65" r="3" fill="#818cf8"/>
  <rect x="46" y="52" width="8" height="20" rx="2" fill="#6366f1"/>
  <rect x="42" y="56" width="16" height="4" rx="2" fill="#818cf8"/>
  <rect x="42" y="64" width="16" height="4" rx="2" fill="#818cf8"/>
  <rect x="14" y="20" width="15" height="22" rx="2" fill="#374151"/>
  <rect x="71" y="20" width="15" height="22" rx="2" fill="#374151"/>
  <ellipse cx="21" cy="18" rx="8" ry="5" fill="#4b5563"/>
  <ellipse cx="79" cy="18" rx="8" ry="5" fill="#4b5563"/>
</svg>`)

const PHOTO_BOOTH = svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect x="8" y="8" width="84" height="84" rx="5" fill="#f3f4f6" stroke="#9ca3af" stroke-width="2"/>
  <rect x="16" y="16" width="68" height="68" rx="3" fill="none" stroke="#6b7280" stroke-width="3" stroke-dasharray="6 3"/>
  <rect x="5" y="5" width="10" height="10" rx="2" fill="#f9a8d4"/>
  <rect x="85" y="5" width="10" height="10" rx="2" fill="#f9a8d4"/>
  <rect x="5" y="85" width="10" height="10" rx="2" fill="#f9a8d4"/>
  <rect x="85" y="85" width="10" height="10" rx="2" fill="#f9a8d4"/>
  <circle cx="50" cy="43" r="12" fill="#e5e7eb" stroke="#9ca3af" stroke-width="2"/>
  <circle cx="50" cy="40" r="5" fill="#6b7280"/>
  <path d="M38 55 Q50 48 62 55" stroke="#9ca3af" stroke-width="2" fill="none"/>
  <rect x="32" y="62" width="36" height="6" rx="3" fill="#f9a8d4"/>
  <text x="50" y="75" text-anchor="middle" font-size="8" fill="#9ca3af" font-family="sans-serif">PHOTO BOOTH</text>
</svg>`)

const TREE = svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect x="44" y="72" width="12" height="22" rx="3" fill="#78350f"/>
  <circle cx="50" cy="38" r="32" fill="#16a34a"/>
  <circle cx="38" cy="30" r="22" fill="#15803d"/>
  <circle cx="62" cy="30" r="22" fill="#15803d"/>
  <circle cx="50" cy="22" r="22" fill="#22c55e"/>
</svg>`)

const TENT = svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <polygon points="50,8 5,75 95,75" fill="#e9d5ff" stroke="#7c3aed" stroke-width="2"/>
  <polygon points="50,8 5,75 30,75" fill="#ddd6fe"/>
  <polygon points="50,8 70,75 95,75" fill="#ddd6fe"/>
  <rect x="5" y="73" width="90" height="6" rx="2" fill="#7c3aed"/>
  <rect x="5" y="77" width="5" height="18" rx="2" fill="#6d28d9"/>
  <rect x="90" y="77" width="5" height="18" rx="2" fill="#6d28d9"/>
  <rect x="35" y="55" width="30" height="22" rx="2" fill="#c4b5fd"/>
  <path d="M35 55 Q50 45 65 55" fill="#a78bfa"/>
  <line x1="47" y1="8" x2="47" y2="0" stroke="#7c3aed" stroke-width="2"/>
  <line x1="53" y1="8" x2="53" y2="0" stroke="#7c3aed" stroke-width="2"/>
</svg>`)

// ─── exported asset list ──────────────────────────────────────────────────────

export const SVG_ASSETS: SvgAsset[] = [
  { id: 'flower-arrangement', name: 'Flowers',       category: 'Decor',   src: FLOWER_ARRANGEMENT, defaultWidth: 80,  defaultHeight: 90  },
  { id: 'wedding-arch',       name: 'Wedding Arch',  category: 'Decor',   src: WEDDING_ARCH,       defaultWidth: 100, defaultHeight: 110 },
  { id: 'cake-stand',         name: 'Cake',          category: 'Decor',   src: CAKE_STAND,         defaultWidth: 70,  defaultHeight: 90  },
  { id: 'gift-table',         name: 'Gift Table',    category: 'Decor',   src: GIFT_TABLE,         defaultWidth: 110, defaultHeight: 80  },
  { id: 'stage',              name: 'Stage',         category: 'Decor',   src: STAGE,              defaultWidth: 160, defaultHeight: 100 },
  { id: 'dance-floor',        name: 'Dance Floor',   category: 'Decor',   src: DANCE_FLOOR,        defaultWidth: 140, defaultHeight: 140 },
  { id: 'bar-counter',        name: 'Bar',           category: 'Service', src: BAR_COUNTER,        defaultWidth: 150, defaultHeight: 80  },
  { id: 'buffet-table',       name: 'Buffet',        category: 'Service', src: BUFFET_TABLE,       defaultWidth: 150, defaultHeight: 80  },
  { id: 'dj-booth',           name: 'DJ Booth',      category: 'Service', src: DJ_BOOTH,           defaultWidth: 110, defaultHeight: 80  },
  { id: 'photo-booth',        name: 'Photo Booth',   category: 'Service', src: PHOTO_BOOTH,        defaultWidth: 100, defaultHeight: 100 },
  { id: 'tree',               name: 'Tree',          category: 'Outdoor', src: TREE,               defaultWidth: 70,  defaultHeight: 80  },
  { id: 'tent',               name: 'Tent',          category: 'Outdoor', src: TENT,               defaultWidth: 130, defaultHeight: 100 },
]

export const SVG_ASSET_CATEGORIES = ['Decor', 'Service', 'Outdoor'] as const
