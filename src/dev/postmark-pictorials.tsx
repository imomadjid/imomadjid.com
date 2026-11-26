import type { ReactNode } from 'react'

// Pictorials for the Guestbook postmarks, drawn as a postmark's die would cut it, in one ink. Each
// belongs to the places its `scopes` name, at three levels: a city (`city:<place key>`), a region
// (`region:<country code>:<region>`, as Cloudflare names it) and a country (`country:<code>`). A
// visitor's pictorial is dealt from every drawing their city, region and country have
// (postmark-deal.ts), so a subject can have several drawings, each a different composition.
// tools/postmarks/pictorial-style.md is the style guide every new drawing follows (canvas, the
// three stroke weights, detail budget, subject rules, review checklist), and
// postmark-pictorials.test.ts enforces what markup can show. `ink` is the drawing's ink box, which
// lettering clears instead of the whole 100 x 100 box; the Pictorials sheet on /dev/postmarks
// measures it. A place without a pictorial falls back to its map outline.

export type Pictorial = {
  // What the drawing shows, for the postmark's accessible name.
  subject: string
  // The places it stands for, most specific first.
  scopes: readonly string[]
  ink: readonly [x: number, y: number, width: number, height: number]
  // `id` keeps mask ids unique when several postmarks share a page.
  draw: (id: string) => ReactNode
}

export const pictorials = {
  depok: {
    subject: 'Belimbing dewa, Depok',
    scopes: ['city:depok'],
    ink: [11, 4.6, 85.8, 86.7],
    draw: (id) => (
      <>
        <defs>
          <mask id={`${id}-cut`}>
            <rect width="100" height="100" fill="#fff" />
            <polygon
              points="67.95 33.24 76.25 52.81 96.38 59.63 80.33 73.57 80.06 94.83 61.85 83.87 41.55 90.18 46.34 69.47 34.06 52.12 55.24 50.28"
              fill="#000"
              stroke="#000"
              strokeWidth="6"
            />
          </mask>
        </defs>
        <g mask={`url(#${id}-cut)`}>
          <g transform="rotate(-38 38 42)">
            <path d="M6 42 C 14 30, 26 25, 40 25 C 54 25, 66 32, 72 42 C 66 52, 54 59, 40 59 C 26 59, 14 54, 6 42 Z" />
            <path d="M7 42 C 22 33, 56 33, 71 42" strokeWidth="2.4" />
            <path d="M7 42 C 22 51, 56 51, 71 42" strokeWidth="2.4" />
            <path d="M72 42 L78 41" strokeWidth="2.4" />
          </g>
        </g>
        <path
          d="M76 12 C 82 4, 92 4, 96 8 C 92 14, 82 16, 76 12 Z"
          fill="currentColor"
          strokeWidth="1.6"
        />
        <path d="M69.5 17.5 C 72 15, 74 13, 77 12" strokeWidth="2.4" />
        <polygon points="67.23 39.19 72.85 56.47 90.49 60.79 75.79 71.47 77.14 89.59 62.44 78.91 45.63 85.79 51.24 68.51 39.5 54.64 57.67 54.64" />
        <polygon
          points="66.04 49.12 69.78 59.77 80.68 62.72 71.71 69.58 72.27 80.85 62.98 74.44 52.43 78.46 55.66 67.64 48.58 58.85 59.86 58.57"
          strokeWidth="2.4"
        />
        <ellipse
          cx="67.54"
          cy="62.19"
          rx="2.2"
          ry="1.3"
          transform="rotate(-47.12 67.54 62.19)"
          fill="currentColor"
          stroke="none"
        />
        <ellipse
          cx="68.72"
          cy="68.19"
          rx="2.2"
          ry="1.3"
          transform="rotate(24.88 68.72 68.19)"
          fill="currentColor"
          stroke="none"
        />
        <ellipse
          cx="63.38"
          cy="71.16"
          rx="2.2"
          ry="1.3"
          transform="rotate(96.88 63.38 71.16)"
          fill="currentColor"
          stroke="none"
        />
        <ellipse
          cx="58.9"
          cy="67"
          rx="2.2"
          ry="1.3"
          transform="rotate(168.88 58.9 67)"
          fill="currentColor"
          stroke="none"
        />
        <ellipse
          cx="61.47"
          cy="61.46"
          rx="2.2"
          ry="1.3"
          transform="rotate(240.88 61.47 61.46)"
          fill="currentColor"
          stroke="none"
        />
      </>
    ),
  },
  'jakarta-barat': {
    subject: 'Museum Fatahillah, Kota Tua, West Jakarta',
    scopes: ['city:jakarta-barat', 'region:ID:Jakarta'],
    ink: [2.3, 5.4, 95.4, 89.8],
    draw: (_id) => (
      <>
        <path d="M4 88 H96" />
        <path d="M10 86 V50 H90 V86" />
        <path d="M6 50 L22 37 H78 L94 50" />
        <path d="M40 86 V48 M60 86 V48" strokeWidth="2.4" />
        <path d="M36 48 L50 41 L64 48" strokeWidth="2.4" />
        <path d="M45 86 V77 A5 5 0 0 1 55 77 V86" strokeWidth="2.4" />
        <path d="M44 37 V30 H56 V37" />
        <path d="M45 30 V23 H55 V30" strokeWidth="2.4" />
        <path d="M44 23 C44 16, 56 16, 56 23" />
        <path d="M50 16 V8" />
        <circle cx="50" cy="7" r="1.6" fill="currentColor" stroke="none" />
        <path d="M48 25 V28 M52 25 V28" strokeWidth="1.8" />
        <rect x="13" y="54" width="4" height="9" fill="currentColor" stroke="none" />
        <rect x="13" y="69" width="4" height="11" fill="currentColor" stroke="none" />
        <rect x="21" y="54" width="4" height="9" fill="currentColor" stroke="none" />
        <rect x="21" y="69" width="4" height="11" fill="currentColor" stroke="none" />
        <rect x="29" y="54" width="4" height="9" fill="currentColor" stroke="none" />
        <rect x="29" y="69" width="4" height="11" fill="currentColor" stroke="none" />
        <rect x="67" y="54" width="4" height="9" fill="currentColor" stroke="none" />
        <rect x="67" y="69" width="4" height="11" fill="currentColor" stroke="none" />
        <rect x="75" y="54" width="4" height="9" fill="currentColor" stroke="none" />
        <rect x="75" y="69" width="4" height="11" fill="currentColor" stroke="none" />
        <rect x="83" y="54" width="4" height="9" fill="currentColor" stroke="none" />
        <rect x="83" y="69" width="4" height="11" fill="currentColor" stroke="none" />
        <rect x="44" y="53" width="4" height="8" fill="currentColor" stroke="none" />
        <rect x="52" y="53" width="4" height="8" fill="currentColor" stroke="none" />
        <path d="M8 94 H30 M38 94 H62 M70 94 H92" strokeWidth="2.4" />
      </>
    ),
  },
  bandung: {
    subject: 'Gedung Sate, Bandung',
    scopes: ['city:bandung', 'region:ID:West Java'],
    ink: [0.3, 4.2, 99.4, 83.5],
    draw: (_id) => (
      <>
        <path d="M3 86 H97" />
        <path d="M5 86 V66 H95 V86" />
        <path d="M2 66 L8 60 H92 L98 66" />
        <path d="M5 72 H40 M60 72 H95" strokeWidth="2.4" />
        <path d="M9 82 V75 A3 3 0 0 1 15 75 V82 Z" fill="currentColor" stroke="none" />
        <path d="M17 82 V75 A3 3 0 0 1 23 75 V82 Z" fill="currentColor" stroke="none" />
        <path d="M25 82 V75 A3 3 0 0 1 31 75 V82 Z" fill="currentColor" stroke="none" />
        <path d="M69 82 V75 A3 3 0 0 1 75 75 V82 Z" fill="currentColor" stroke="none" />
        <path d="M77 82 V75 A3 3 0 0 1 83 75 V82 Z" fill="currentColor" stroke="none" />
        <path d="M85 82 V75 A3 3 0 0 1 91 75 V82 Z" fill="currentColor" stroke="none" />
        <path d="M40 86 V52 M60 86 V52" />
        <path d="M45 86 V76 A5 5 0 0 1 55 76 V86" strokeWidth="2.4" />
        <path d="M44 66 V58 H56 V66" strokeWidth="2.4" />
        <path d="M34 52 L42 44 H58 L66 52 Z" />
        <path d="M43 44 V40 H57 V44" strokeWidth="2.4" />
        <path d="M39 40 L46 34 H54 L61 40 Z" />
        <path d="M45 34 L50 28 L55 34" />
        <path d="M50 28 V5" strokeWidth="1.6" />
        <circle cx="50" cy="8" r="1.9" fill="currentColor" stroke="none" />
        <circle cx="50" cy="11.6" r="1.9" fill="currentColor" stroke="none" />
        <circle cx="50" cy="15.2" r="1.9" fill="currentColor" stroke="none" />
        <circle cx="50" cy="18.8" r="1.9" fill="currentColor" stroke="none" />
        <circle cx="50" cy="22.4" r="1.9" fill="currentColor" stroke="none" />
        <circle cx="50" cy="26" r="1.9" fill="currentColor" stroke="none" />
      </>
    ),
  },
  yogyakarta: {
    subject: 'Tugu Yogyakarta and Merapi',
    scopes: ['city:yogyakarta', 'region:ID:Yogyakarta'],
    ink: [2.8, 4.3, 94.4, 89.4],
    draw: (_id) => (
      <>
        <path d="M4 62 C 14 60, 22 50, 30 38 C 33 33, 37 31, 40 31" strokeWidth="2.4" />
        <path d="M60 31 C 64 31, 67 33, 70 38 C 78 50, 86 60, 96 62" strokeWidth="2.4" />
        <path
          d="M40 24 C 44 20, 40 16, 45 12 M56 18 C 60 14, 57 10, 62 7"
          strokeWidth="2.4"
          strokeDasharray="0.1 4.5"
        />
        <path d="M30 92 H70 M34 92 V86 H66 V92" />
        <path d="M38 86 V80 H62 V86" />
        <path d="M41 80 L42 54 H58 L59 80" />
        <rect x="45" y="60" width="10" height="14" strokeWidth="2.4" />
        <path d="M39 54 H61 M40 50 H60" />
        <path d="M43 50 L45 30 H55 L57 50" />
        <path d="M48.5 48 L49 32 M51.5 48 L51 32" strokeWidth="1.8" />
        <path d="M43 30 H57" />
        <path d="M45 30 C 45 22, 48 14, 50 6 C 52 14, 55 22, 55 30" />
        <path d="M46.5 25 L53.5 21 M47.5 19 L52.5 15.5" strokeWidth="1.8" />
        <path d="M8 92 H22 M78 92 H92" strokeWidth="2.4" />
      </>
    ),
  },
  'san-francisco': {
    subject: 'Golden Gate Bridge tower, San Francisco',
    scopes: ['city:san-francisco'],
    ink: [0.3, 5.3, 99.4, 88.4],
    draw: (_id) => (
      <>
        <path d="M36 8 C 27 30, 15 46, 2 53" />
        <path d="M64 8 C 73 30, 85 46, 98 53" />
        <path
          d="M30.26 20.46 V60 M25.21 29.29 V60 M19.81 37.03 V60 M14.11 43.61 V60 M8.16 48.96 V60 M69.74 20.46 V60 M74.79 29.29 V60 M80.19 37.03 V60 M85.89 43.61 V60 M91.84 48.96 V60"
          strokeWidth="1.6"
        />
        <path d="M35 92 V52 L36 50 V34 L37 32 V18 L38 16 V7 H44 V92" />
        <path d="M65 92 V52 L64 50 V34 L63 32 V18 L62 16 V7 H56 V92" />
        <path d="M44 12 H56 M44 18 H56 M44 28 H56 M44 34 H56 M44 44 H56 M44 50 H56" />
        <path
          d="M48 12 V18 M52 12 V18 M48 28 V34 M52 28 V34 M48 44 V50 M52 44 V50"
          strokeWidth="1.8"
        />
        <path d="M2 60 H98 M2 65.5 H98" />
        <path
          d="M4 78 C 9 75, 13 81, 18 78 S 27 75, 32 78 M68 78 C 73 75, 77 81, 82 78 S 91 75, 96 78"
          strokeWidth="2.4"
        />
        <path
          d="M10 88 C 15 85, 19 91, 24 88 S 31 86, 34 87 M66 87 C 69 86, 73 91, 78 88 S 87 85, 92 88"
          strokeWidth="2.4"
        />
      </>
    ),
  },
  shibuya: {
    subject: 'Hachikō, Shibuya',
    scopes: ['city:shibuya'],
    ink: [8.3, 9.3, 83.4, 84.4],
    draw: (_id) => (
      <>
        <path d="M12 34 C 14 31, 19 30, 24 29 C 26 27, 27 24, 28 22 L 31 11 L 38 22 C 41 22, 44 25, 46 29 C 49 33, 52 35, 56 37 C 62 39, 68 41, 72 44 C 78 49, 80 57, 80 65 C 80 71, 79 75, 77 78 H 20 C 20 76, 22 75, 25 75 C 26 68, 26 60, 25 54 C 24 49, 23 44, 23 41 C 21 40, 18 39, 15 38.5 C 13 38, 11.5 36, 12 34 Z" />
        <path d="M66 42 C 60 36, 64 27, 72 27 C 80 27, 82 36, 76 41" strokeWidth="3.4" />
        <path d="M69 37 C 67 33, 70 30, 73 31" strokeWidth="1.8" />
        <path d="M60 56 C 70 55, 74 66, 70 78" strokeWidth="2.4" />
        <path d="M35 60 C 35 66, 35 72, 33 78" strokeWidth="2.4" />
        <path d="M38 24 C 40 31, 36 38, 28 41" strokeWidth="2.4" />
        <circle cx="25" cy="31" r="1.8" fill="currentColor" stroke="none" />
        <circle cx="12.6" cy="34.6" r="2.4" fill="currentColor" stroke="none" />
        <path d="M33 20 L 31.5 15" strokeWidth="1.8" />
        <path d="M10 78 H 90 V 92 H 10 Z" />
        <rect x="38" y="82" width="24" height="6" strokeWidth="1.8" />
      </>
    ),
  },
  london: {
    subject: 'Elizabeth Tower, London',
    scopes: ['city:london'],
    ink: [2.3, 0.3, 95.4, 93.1],
    draw: (_id) => (
      <>
        <path d="M38 82 V44 H62 V82" />
        <path d="M44 82 V48 M56 82 V48" strokeWidth="1.8" />
        <path d="M38 58 H62 M38 70 H62" strokeWidth="1.8" />
        <path d="M35 44 V24 H65 V44 Z" />
        <circle cx="50" cy="34" r="7.2" />
        <path d="M50 34 V29.5 M50 34 L53.5 35.5" strokeWidth="1.8" />
        <path d="M37 24 L40 18 H60 L63 24" />
        <path d="M42 18 V14 H58 V18" strokeWidth="2.4" />
        <path d="M42 14 L50 2 L58 14" />
        <path d="M46.5 14 L50 8 L53.5 14" strokeWidth="1.8" />
        <path d="M35 24 V19 M65 24 V19 M38 44 V40 M62 44 V40" strokeWidth="2.4" />
        <path d="M45 14 V11 M55 14 V11" strokeWidth="1.8" />
        <path d="M4 82 H96" />
        <path
          d="M8 90 C 12 87, 16 93, 20 90 S 28 87, 32 90 S 40 93, 44 90 M56 90 C 60 87, 64 93, 68 90 S 76 87, 80 90 S 88 93, 92 90"
          strokeWidth="2.4"
        />
      </>
    ),
  },
  singapore: {
    subject: 'Supertree Grove, Singapore',
    scopes: ['city:singapore', 'country:SG'],
    ink: [2.3, 8.9, 95.4, 82.8],
    draw: (_id) => (
      <>
        <path d="M4 90 H96" />
        <path d="M46 90 L48.4 30 M54 90 L51.6 30" />
        <path d="M48.4 30 L30 15 M51.6 30 L70 15" />
        <ellipse cx="50" cy="15" rx="20" ry="4.4" />
        <path d="M50 30 L41 19 M50 30 L59 19 M50 30 V19.4" strokeWidth="1.6" />
        <path d="M46.6 84 L53.2 78 L47 72 L52.8 66 L47.4 60 L52.4 54" strokeWidth="1.6" />
        <path d="M16 90 L18.4 46 M24 90 L21.6 46" />
        <path d="M18.4 46 L6 35.5 M21.6 46 L34 35.5" />
        <ellipse cx="20" cy="35.5" rx="14" ry="3.08" />
        <path d="M20 46 L13.7 38.3 M20 46 L26.3 38.3 M20 46 V38.58" strokeWidth="1.6" />
        <path d="M16.6 84 L23.2 78 L17 72 L22.8 66 L17.4 60 L22.4 54" strokeWidth="1.6" />
        <path d="M76 90 L78.4 50 M84 90 L81.6 50" />
        <path d="M78.4 50 L67 40.25 M81.6 50 L93 40.25" />
        <ellipse cx="80" cy="40.25" rx="13" ry="2.86" />
        <path d="M80 50 L74.15 42.85 M80 50 L85.85 42.85 M80 50 V43.11" strokeWidth="1.6" />
        <path d="M76.6 84 L83.2 78 L77 72 L82.8 66 L77.4 60 L82.4 54" strokeWidth="1.6" />
        <path d="M22 62 C 34 58, 40 56, 48 55 M52 55 C 60 56, 68 60, 78 64" strokeWidth="2.4" />
        <path d="M22 66 C 34 62, 40 60, 48 59 M52 59 C 60 60, 68 64, 78 68" strokeWidth="1.6" />
      </>
    ),
  },
} as const satisfies Record<string, Pictorial>

// The drawings' shared stroke style, set once on the group that holds one.
export const pictorialStroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 3.4,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const
