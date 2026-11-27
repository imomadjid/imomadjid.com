import type { ReactNode } from 'react'

// Pictorials for the postmark footer's postmarks, drawn as a postmark's die would cut it, in one ink. Each
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
    scopes: ['city:bandung'],
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
  // The Golden Gate Bridge's south tower, toll plaza and southern approach are in the City and County of San Francisco (Presidio), and the bridge is the city's most recognised landmark.
  'san-francisco-span': {
    subject: 'Golden Gate Bridge, the whole span from the side',
    scopes: ['city:san-francisco'],
    ink: [0.3, 10.3, 99.4, 82.2],
    draw: (_id) => (
      <>
        <path d="M30.5 12 Q 50 100, 69.5 12" />
        <path d="M22.5 12 Q 13 44, 4 60 M77.5 12 Q 87 44, 96 60" />
        <path
          d="M36 33.3 V62 M43 50.3 V62 M50 56 V62 M57 50.3 V62 M64 33.3 V62"
          strokeWidth="1.6"
        />
        <path d="M12 42.9 V62 M17 29.3 V62 M88 42.9 V62 M83 29.3 V62" strokeWidth="1.6" />
        <path d="M22.5 82 V12 H30.5 V82" />
        <path d="M69.5 82 V12 H77.5 V82" />
        <path d="M22.5 24 H30.5 M22.5 38 H30.5 M22.5 50 H30.5" strokeWidth="2.4" />
        <path d="M69.5 24 H77.5 M69.5 38 H77.5 M69.5 50 H77.5" strokeWidth="2.4" />
        <path d="M2 64 H98" />
        <path d="M19 82 H34 M66 82 H81" />
        <path
          d="M8 89 C 12 86, 16 92, 20 89 S 28 86, 32 89 S 40 92, 44 89 M56 89 C 60 86, 64 92, 68 89 S 76 86, 80 89 S 88 92, 92 89"
          strokeWidth="2.4"
        />
      </>
    ),
  },
  // The Dian Al-Mahri (Golden Dome) Mosque stands on Jalan Raya Meruyung, Kelurahan Meruyung, Kecamatan Limo, Kota Depok; it has five domes and six minarets.
  'depok-kubah-emas': {
    subject: 'Masjid Kubah Emas, Depok',
    scopes: ['city:depok'],
    ink: [2.3, 7.1, 95.4, 82.6],
    draw: (_id) => (
      <>
        <path d="M4 88 H96" />
        <path d="M24 88 V62 H76 V88 M21 62 H79" />
        <path
          d="M46.5 88 V77 C 46.5 73.5, 48.5 71, 50 69 C 51.5 71, 53.5 73.5, 53.5 77 V88"
          strokeWidth="2.4"
        />
        <path
          d="M29 84 V77 C 29 74, 30.5 73, 31.5 71.5 C 32.5 73, 34 74, 34 77 V84 Z M37 84 V77 C 37 74, 38.5 73, 39.5 71.5 C 40.5 73, 42 74, 42 77 V84 Z M58 84 V77 C 58 74, 59.5 73, 60.5 71.5 C 61.5 73, 63 74, 63 77 V84 Z M66 84 V77 C 66 74, 67.5 73, 68.5 71.5 C 69.5 73, 71 74, 71 77 V84 Z"
          fill="currentColor"
          stroke="none"
        />
        <path d="M39 62 V52 M61 62 V52" strokeWidth="2.4" />
        <path d="M38 52 H62" />
        <path d="M39 52 C 36 46, 36 35, 42 29 C 46 26, 49 23, 50 18 C 51 23, 54 26, 58 29 C 64 35, 64 46, 61 52" />
        <path d="M50 18 V12" strokeWidth="2.4" />
        <circle cx="50" cy="9.5" r="2.4" fill="currentColor" stroke="none" />
        <path d="M25 62 V57 M31 62 V57 M69 62 V57 M75 62 V57" strokeWidth="2.4" />
        <path d="M24 57 C 23 52, 25 49, 28 46 C 31 49, 33 52, 32 57 Z M68 57 C 67 52, 69 49, 72 46 C 75 49, 77 52, 76 57 Z" />
        <circle cx="28" cy="43" r="1.7" fill="currentColor" stroke="none" />
        <circle cx="72" cy="43" r="1.7" fill="currentColor" stroke="none" />
        <path d="M9 88 V38 M17 88 V38 M83 88 V38 M91 88 V38" />
        <path d="M6 38 H20 M80 38 H94" />
        <path d="M10 38 V28 M16 38 V28 M84 38 V28 M90 38 V28" strokeWidth="2.4" />
        <path d="M9 28 C 9 22, 13 21, 13 17 C 13 21, 17 22, 17 28 Z M83 28 C 83 22, 87 21, 87 17 C 87 21, 91 22, 91 28 Z" />
        <circle cx="13" cy="14" r="1.7" fill="currentColor" stroke="none" />
        <circle cx="87" cy="14" r="1.7" fill="currentColor" stroke="none" />
      </>
    ),
  },
  // Half Dome stands in Yosemite National Park, Mariposa County, California, at the east end of Yosemite Valley. Seen from the valley floor to the west, its sheer northwest face is on the left.
  'california-half-dome': {
    subject: 'Half Dome, Yosemite',
    scopes: ['region:US:California'],
    ink: [0.3, 10.5, 99.4, 82.7],
    draw: (id) => (
      <>
        <defs>
          <mask id={`${id}-pines`}>
            <rect width="100" height="100" fill="#fff" />
            <path
              d="M15 50 L6 82 H24 Z M85 57 L77 82 H93 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="7"
            />
          </mask>
        </defs>
        <g mask={`url(#${id}-pines)`}>
          <path d="M4 70 C 14 64, 24 59, 31 54 V19 L44 13 C 58 10, 72 16, 80 28 C 86 37, 88 46, 90 52 C 92 56, 94 58, 96 59" />
          <path d="M44 13 C 47 26, 49 40, 50 61" strokeWidth="2.4" />
          <path d="M58 17 C 67 19, 73 25, 77 33" strokeWidth="2.4" />
          <path
            d="M4 69.5 C 14 66, 26 66, 36 68 C 48 70, 58 64, 70 66 C 80 68, 88 64, 96 65.5"
            strokeWidth="2.4"
          />
        </g>
        <path
          d="M31 22.2 L36.9 16.3 M31 28.5 L44.5 15.1 M31 34.9 L45.6 20.3 M31 41.3 L46.5 25.7 M31 47.6 L47.4 31.3 M31 54 L48.1 36.9 M35.7 55.7 L48.7 42.6 M40.3 57.4 L49.2 48.5 M45 59.1 L49.6 54.5"
          strokeWidth="1.8"
        />
        <path d="M15 50 L10.5 59 H13 L8.5 68 H12 L7 77 H23 L18 68 H21.5 L17 59 H19.5 Z" />
        <path d="M15 77 V86" />
        <path d="M85 57 L81.5 64 H84 L80 71 H82.5 L78 78 H92 L87.5 71 H90 L86 64 H88.5 Z" />
        <path d="M85 78 V86" />
        <path d="M2 86 H98" />
        <path d="M30 92 H46" strokeWidth="2.4" />
        <path d="M54 92 H70" strokeWidth="2.4" />
      </>
    ),
  },
  // Mount Fuji stands on the border of Shizuoka and Yamanashi prefectures. It is Japan's highest peak (3,776 m) and its best-known natural landmark, and visitors from anywhere in Japan recognise it.
  'japan-fuji': {
    subject: 'Mount Fuji',
    scopes: ['country:JP'],
    ink: [0.3, 11.3, 99.4, 82.9],
    draw: (_id) => (
      <>
        <path d="M4 80 C 22 75, 33 57, 39 25 L43 23.5 L46.5 25 L50 23 L53.5 25 L57 23.5 L61 25 C 67 57, 78 75, 96 80" />
        <path
          d="M33.3 47 L36.7 55 L40 48 L43.3 58 L46.7 48 L50 56 L53.3 48 L56.7 58 L60 48 L63.3 55 L66.7 47"
          strokeWidth="2.4"
        />
        <path
          d="M30.1 54.9 L33.8 51.3 M11.4 80 L36.6 54.9 M36.9 54.6 L40.8 50.6 M17.8 80 L42.4 55.3 M45.1 52.7 L47.6 50.2 M24.2 80 L49.5 54.7 M51.3 52.8 L54 50.1 M30.5 80 L55.6 54.9 M36.9 80 L62.9 54 M43.2 80 L69.4 53.8 M49.6 80 L71.5 58.2 M56 80 L73.8 62.2 M62.3 80 L76.3 66 M68.7 80 L79.2 69.5 M75.1 80 L82.4 72.6 M81.4 80 L86 75.4 M87.8 80 L90.1 77.7"
          strokeWidth="1.8"
        />
        <path d="M44.5 29.5 L42.8 36.5" strokeWidth="1.8" />
        <path d="M50 28 V35" strokeWidth="1.8" />
        <path d="M55.5 29.5 L57.2 36.5" strokeWidth="1.8" />
        <path d="M2 80 H98" />
        <path d="M8 87 C 12 84, 16 90, 20 87 S 28 84, 32 87" strokeWidth="2.4" />
        <path d="M68 87 C 72 84, 76 90, 80 87 S 88 84, 92 87" strokeWidth="2.4" />
        <path d="M24 93 H40" strokeWidth="2.4" />
        <path d="M60 93 H76" strokeWidth="2.4" />
        <path
          d="M66 18 C 66 13.5, 72 12.5, 74.5 15.5 C 76.5 11, 85 11.5, 85 18 Z"
          strokeWidth="2.4"
        />
      </>
    ),
  },
  // The Statue of Liberty stands on Liberty Island, which belongs to New York State (New York County) under the 1834 New York–New Jersey compact, though New Jersey's waters surround it.
  'new-york-liberty': {
    subject: 'Statue of Liberty, New York',
    scopes: [
      'city:us-new-york-new-york',
      'city:brooklyn',
      'city:us-new-york-manhattan',
      'city:us-new-york-queens',
      'city:us-new-york-bronx',
      'city:us-new-york-the-bronx',
      'city:us-new-york-staten-island',
    ],
    ink: [2.3, 4.1, 95.4, 92],
    draw: (id) => (
      <>
        <defs>
          <mask id={`${id}-arm`}>
            <rect width="100" height="100" fill="#fff" />
            <path d="M36.5 15 L42.5 33" stroke="#000" strokeWidth="11" />
          </mask>
          <mask id={`${id}-tab`}>
            <rect width="100" height="100" fill="#fff" />
            <polygon
              points="55.5 39 62 37 64 50 57.5 52"
              fill="#000"
              stroke="#000"
              strokeWidth="7"
            />
          </mask>
        </defs>
        <path
          d="M36 5 C 38.5 7, 39 8.8, 38.5 10 H33.5 C 33 8.8, 33.5 7, 36 5 Z"
          fill="currentColor"
          strokeWidth="1.6"
        />
        <path d="M32.5 11.5 H39.5 L38 14 H34 Z" />
        <path d="M36.5 15 L42.5 33" />
        <circle cx="50" cy="25.5" r="4" />
        <path
          d="M45.7 21.9 L40.4 17.5 M47.6 20.4 L44.7 14.2 M50 19.9 V13 M52.4 20.4 L55.3 14.2 M54.3 21.9 L59.6 17.5 M55.4 24.1 L62.1 22.5"
          strokeWidth="2.4"
          mask={`url(#${id}-arm)`}
        />
        <g mask={`url(#${id}-tab)`}>
          <path d="M41 57 C 41.5 46, 42 38, 43 33 C 45 31.5, 47.5 30.5, 50 30.5 C 52.5 30.5, 55 31.5, 57 33 C 58 40, 58.5 46, 59 57" />
          <path
            d="M44 37.5 C 48 39.5, 52 42, 57 46 M49.5 45.5 C 49.5 49.5, 50 53.5, 50.5 57"
            strokeWidth="2.4"
          />
        </g>
        <polygon points="55.5 39 62 37 64 50 57.5 52" />
        <path d="M58 44 L62.5 42.8" strokeWidth="1.8" />
        <path d="M35 57 H65" />
        <path d="M37 57 V63 H63 V57" />
        <path d="M39 63 L38 80 M61 63 L62 80" />
        <rect x="44" y="68" width="3" height="7" fill="currentColor" stroke="none" />
        <rect x="53" y="68" width="3" height="7" fill="currentColor" stroke="none" />
        <path d="M35 88 V80 H65 V88" />
        <path d="M4 88 H96" />
        <path
          d="M8 94 C 12 91, 16 97, 20 94 S 28 91, 32 94 M68 94 C 72 91, 76 97, 80 94 S 88 91, 92 94"
          strokeWidth="2.4"
        />
      </>
    ),
  },
  // The blue crab (Callinectes sapidus) has been Maryland's official state crustacean since 1989 and is the signature catch of its Chesapeake Bay.
  'maryland-crab': {
    subject: 'Blue crab, Maryland',
    scopes: ['region:US:Maryland'],
    ink: [5.8, 12, 88.4, 77.1],
    draw: (_id) => (
      <>
        <g transform="translate(0 2)">
          <path d="M50 36.5 C 45 36.5, 41 37, 38 38.5 C 33 40.5, 28 43, 24.5 44.5 L7.5 45.5 L24 49 C 29 55, 37 60, 44 61 H50 M 50 36.5 C 55 36.5 59 37 62 38.5 C 67 40.5 72 43 75.5 44.5 L 92.5 45.5 L 76 49 C 71 55 63 60 56 61 H 50" />
          <path d="M37 41 L26.5 33.5 L25 27 M 63 41 L 73.5 33.5 L 75 27" />
          <path d="M23.1 25.6 C 22.4 21.3, 26.0 16.5, 28.8 14.9 C 31.5 12.5, 34.9 11.3, 38.2 11.9 C 35.7 13.1, 33.8 14.9, 33.5 17.7 C 36.5 17.5, 39.4 17.8, 42.1 19.2 C 39.2 20.1, 37.2 21.1, 35.3 22.2 C 33.8 24.9, 30.8 27.6, 26.9 28.4 Z M 76.9 25.6 C 77.6 21.3 74 16.5 71.2 14.9 C 68.5 12.5 65.1 11.3 61.8 11.9 C 64.3 13.1 66.2 14.9 66.5 17.7 C 63.5 17.5 60.6 17.8 57.9 19.2 C 60.8 20.1 62.8 21.1 64.7 22.2 C 66.2 24.9 69.2 27.6 73.1 28.4 Z" />
          <path d="M46 37 L44.5 33.5 M 54 37 L 55.5 33.5" strokeWidth="2.4" />
          <circle cx="44" cy="32.2" r="2" fill="currentColor" stroke="none" />
          <circle cx="56" cy="32.2" r="2" fill="currentColor" stroke="none" />
          <path
            d="M28.5 51 L17 55 L9.5 62 M31.5 55 L20 61.5 L13.5 70 M35 57.5 L25.5 66 L20.5 75.5 M71.5 51 L83 55 L90.5 62 M68.5 55 L80 61.5 L86.5 70 M65 57.5 L74.5 66 L79.5 75.5"
            strokeWidth="2.4"
          />
          <path d="M41.5 60 L36 70 L33.5 75 M 58.5 60 L 64 70 L 66.5 75" strokeWidth="2.4" />
          <ellipse
            cx="31.5"
            cy="80.5"
            rx="3.6"
            ry="6"
            transform="rotate(22 31.5 80.5)"
            fill="currentColor"
            strokeWidth="1.6"
          />
          <ellipse
            cx="68.5"
            cy="80.5"
            rx="3.6"
            ry="6"
            transform="rotate(-22 68.5 80.5)"
            fill="currentColor"
            strokeWidth="1.6"
          />
        </g>
      </>
    ),
  },
  // The Alamo church stands at 300 Alamo Plaza in downtown San Antonio, Bexar County, Texas, and is the state's best-known landmark.
  'texas-alamo': {
    subject: 'The Alamo, San Antonio',
    scopes: ['city:us-texas-san-antonio'],
    ink: [2.3, 20.3, 95.4, 74.9],
    draw: (_id) => (
      <>
        <path d="M4 88 H96" />
        <path d="M12 88 V42 H28 C 36 42, 38 30, 42 25 C 45 21, 55 21, 58 25 C 62 30, 64 42, 72 42 H88 V88" />
        <path
          d="M36 42 C 40 40, 42 34, 45 30 C 47 27.5, 53 27.5, 55 30 C 58 34, 60 40, 64 42"
          strokeWidth="2.4"
        />
        <path d="M12 64 H88" strokeWidth="2.4" />
        <path d="M20 88 V42 M36 88 V42 M64 88 V42 M80 88 V42" strokeWidth="2.4" />
        <path d="M42 88 V74 A8 8 0 0 1 58 74 V88" />
        <path d="M46.8 88 V76 A3.2 3.2 0 0 1 53.2 76 V88 Z" fill="currentColor" stroke="none" />
        <path
          d="M25 82 V73 A3 3 0 0 1 31 73 V82 Z M69 82 V73 A3 3 0 0 1 75 73 V82 Z M25 59 V50 A3 3 0 0 1 31 50 V59 Z M69 59 V50 A3 3 0 0 1 75 50 V59 Z"
          fill="currentColor"
          stroke="none"
        />
        <path d="M46 59 V50 A4 4 0 0 1 54 50 V59 Z" fill="currentColor" stroke="none" />
        <path d="M8 94 H30 M38 94 H62 M70 94 H92" strokeWidth="2.4" />
      </>
    ),
  },
  // Monas stands in Merdeka Square, Gambir, Central Jakarta, inside DKI Jakarta province, and is the capital's defining landmark, so it can stand for every Jakarta city at region scope.
  'jakarta-monas': {
    subject: 'Monas, Jakarta',
    scopes: ['region:ID:Jakarta'],
    ink: [2.3, 4.4, 95.4, 90.8],
    draw: (_id) => (
      <>
        <path d="M4 88 H96" />
        <path d="M12 88 V81 H88 V88" />
        <path d="M32 81 C 30 75, 22 71, 12 68 H88 C 78 71, 70 75, 68 81" />
        <path d="M25 74.5 H75" strokeWidth="2.4" />
        <path d="M42 68 L45.5 27 H54.5 L58 68" />
        <path d="M50 64 V44" strokeWidth="2.4" />
        <path d="M42 27 H58 V20 H42 Z" />
        <path
          d="M45 20 C 45 17.5, 46.5 16.5, 50 16.5 C 53.5 16.5, 55 17.5, 55 20"
          strokeWidth="2.4"
        />
        <path
          d="M46.8 16 C 45 12.5, 46.5 9.5, 49.5 5.2 C 50 8, 51 9, 52.3 10 C 52.4 9, 52.8 8.2, 53.4 7.6 C 55.4 10.6, 55.2 13.6, 53.2 16 Z"
          fill="currentColor"
          strokeWidth="1.6"
        />
        <path d="M8 94 H30 M38 94 H62 M70 94 H92" strokeWidth="2.4" />
      </>
    ),
  },
  // San Francisco's cable cars (Powell-Hyde, Powell-Mason and California Street lines) are run by the city's SFMTA on the city's own streets and are a designated National Historic Landmark of the city.
  'san-francisco-cable-car': {
    subject: 'Cable car, San Francisco',
    scopes: ['city:san-francisco'],
    ink: [1.3, 20.3, 97.4, 70.9],
    draw: (_id) => (
      <>
        <path d="M5 37 C 5 32, 9 30, 14 30 H86 C 91 30, 95 32, 95 37" />
        <path d="M27 30 V22 H73 V30" />
        <path d="M38.5 23.5 V28.5 M50 23.5 V28.5 M61.5 23.5 V28.5" strokeWidth="1.8" />
        <path d="M27 30 V61 M73 30 V61" />
        <path d="M9 34 V70 M91 34 V70" />
        <path d="M18 31 V61 M82 31 V61" strokeWidth="2.4" />
        <rect x="32.3" y="38" width="5.4" height="13" fill="currentColor" stroke="none" />
        <rect x="42.3" y="38" width="5.4" height="13" fill="currentColor" stroke="none" />
        <rect x="52.3" y="38" width="5.4" height="13" fill="currentColor" stroke="none" />
        <rect x="62.3" y="38" width="5.4" height="13" fill="currentColor" stroke="none" />
        <path d="M9 61 H91 M9 70 H91" />
        <path d="M13.5 61 V46" strokeWidth="2.4" />
        <circle cx="13.5" cy="45" r="1.8" fill="currentColor" stroke="none" />
        <circle cx="18" cy="76.5" r="3.6" />
        <circle cx="31" cy="76.5" r="3.6" />
        <circle cx="69" cy="76.5" r="3.6" />
        <circle cx="82" cy="76.5" r="3.6" />
        <path d="M3 83 H97" />
        <path d="M14 90 H38 M62 90 H86" strokeWidth="2.4" />
      </>
    ),
  },
  // The Great Mosque of Banten stands in Banten Lama (Kasemen, Kota Serang), the old capital of the Banten Sultanate in Banten province. Its five-tiered tumpang roof and lighthouse-like minaret are the province's best-known landmark.
  'banten-masjid-agung': {
    subject: 'Masjid Agung Banten',
    scopes: ['city:id-banten-serang'],
    ink: [2.3, 8, 95.4, 87.2],
    draw: (_id) => (
      <>
        <path d="M4 88 H96" />
        <path d="M14 88 V78 H58 V88" />
        <path d="M31 88 V82 A5 5 0 0 1 41 82 V88" strokeWidth="2.4" />
        <path d="M18 86 V81 H24 V86 Z M48 86 V81 H54 V86 Z" fill="currentColor" stroke="none" />
        <path d="M5 78 L21 67 H51 L67 78 Z" />
        <path d="M24 67 V63 M48 67 V63" strokeWidth="2.4" />
        <path d="M15 63 L27 55 H45 L57 63 Z" />
        <path d="M29 55 V51 M43 55 V51" strokeWidth="2.4" />
        <path d="M21 51 L31 44 H41 L51 51 Z" />
        <path d="M32 44 V38 M40 44 V38" strokeWidth="2.4" />
        <path d="M26 38 L33 33 H39 L46 38 Z" />
        <path d="M34 33 V29 M38 33 V29" strokeWidth="2.4" />
        <path d="M30 29 L36 23 L42 29 Z" />
        <path d="M36 23 V18" strokeWidth="2.4" />
        <circle cx="36" cy="16" r="2" fill="currentColor" stroke="none" />
        <path d="M75 88 L78 36 H88 L91 88" />
        <path d="M73 88 V83 H93 V88" strokeWidth="2.4" />
        <path d="M76.8 60 H89.2" strokeWidth="2.4" />
        <path d="M74 36 H92 V32 H74 Z" />
        <path d="M79 32 V23 H87 V32" />
        <path d="M79 23 C 79 17, 83 15, 83 13 C 83 15, 87 17, 87 23" />
        <circle cx="83" cy="10" r="2" fill="currentColor" stroke="none" />
        <path
          d="M81.5 47 V53 H84.5 V47 Z M81.5 68 V74 H84.5 V68 Z"
          fill="currentColor"
          stroke="none"
        />
        <path d="M8 94 H30 M42 94 H62 M70 94 H92" strokeWidth="2.4" />
      </>
    ),
  },
  // Ujung Kulon National Park, at the western tip of Pandeglang Regency in Banten, is the last home of the Javan rhinoceros (Rhinoceros sondaicus).
  'banten-rhino': {
    subject: 'Javan rhino, Ujung Kulon',
    scopes: ['region:ID:Banten'],
    ink: [0.3, 28.3, 99.4, 64.9],
    draw: (_id) => (
      <>
        <path d="M55 75.5 V86 H47.5 M71 75.5 V86 H78.5" strokeWidth="2.4" />
        <path d="M4 68 C 4.5 64, 6 61, 8.5 59 C 8.5 53, 10.5 47, 15 43 C 14 48, 15 52, 18.5 55 C 21.5 53, 24.5 49, 27 45.5 C 26 40, 27 35, 30 32.5 C 33 33.5, 34.5 36.5, 33.5 40.5 C 39 33, 46 30, 56 30 C 68 30, 78 31, 84 35 C 90 39, 92 47, 92 55 C 92 63, 90 72, 90 86 H 79 L 78 74 C 70 76, 54 76, 48 74 L 47 86 H 36 L 36 72.5 C 32 73, 28 74.5, 24 75 C 17 75.5, 11 74, 7.5 71.5 C 6 70.5, 4.5 69.5, 4 68 Z" />
        <path d="M33.5 41 C 29.5 48, 29 58, 33 67" strokeWidth="2.4" />
        <path d="M49 31 C 44 40, 42 52, 44 60 C 45 64, 47 66, 51 67" />
        <path d="M76 31.5 C 71 40, 70 52, 72 62 C 73 66, 75 68, 78.5 69" />
        <path d="M80 64 C 84 60.5, 88 59.5, 91.8 60" strokeWidth="2.4" />
        <path d="M91.5 45 C 94.5 49, 95.5 54, 94.5 59" strokeWidth="2.4" />
        <circle cx="22" cy="60" r="1.8" fill="currentColor" stroke="none" />
        <path d="M9 69.5 C 11 70.3, 13 70.4, 15 69.8" strokeWidth="1.8" />
        <path d="M2 86 H98" />
        <path
          d="M18 86 C 17 83, 14 80.5, 11 80 M18 86 C 19 82.5, 22 80.5, 25 80"
          strokeWidth="2.4"
        />
        <path d="M20 92 H44 M56 92 H80" strokeWidth="2.4" />
      </>
    ),
  },
  // Mount Bromo and Mount Batok stand in the Tengger caldera of Bromo Tengger Semeru National Park, which spans Probolinggo, Pasuruan, Malang and Lumajang regencies in East Java.
  'east-java-bromo': {
    subject: 'Mount Bromo',
    scopes: ['region:ID:East Java'],
    ink: [0.3, 7.6, 99.4, 87.6],
    draw: (id) => (
      <>
        <defs>
          <mask id={`${id}-batok`}>
            <rect width="100" height="100" fill="#fff" />
            <path
              d="M44 81 C 53 72, 60 52, 63.5 37 C 65.5 29.5, 74.5 29.5, 76.5 37 C 80 52, 87 72, 96 81 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="7"
            />
          </mask>
        </defs>
        <g mask={`url(#${id}-batok)`}>
          <path d="M4 81 C 11 74, 15 60, 17 46 L 21.5 42.5 L 26 45 L 31 41.5 L 35.5 44.5 L 41 42 C 44 56, 50 70, 61 80" />
          <path d="M17 46 C 23 52.5, 36 52, 41 42" strokeWidth="2.4" />
          <path
            d="M12 72 C 16 66, 19 59, 21 53 M25 71 C 26.5 65, 27.5 60, 28 55"
            strokeWidth="2.4"
          />
        </g>
        <path
          d="M27 39 C 23 33, 30 28, 26 22 C 22 17, 27 12, 23 6 M33 38 C 36 32, 42 29, 40 22 C 38 17, 43 13, 43 7"
          strokeDasharray="0.1 5"
        />
        <path d="M44 81 C 53 72, 60 52, 63.5 37 C 65.5 29.5, 74.5 29.5, 76.5 37 C 80 52, 87 72, 96 81" />
        <path d="M70 34.5 V78" strokeWidth="2.4" />
        <path
          d="M66.5 36.5 C 64 52, 61 66, 57.5 78 M73.5 36.5 C 76 52, 79 66, 82.5 78"
          strokeWidth="2.4"
        />
        <path
          d="M63 53 C 60.5 64, 56.5 72, 51 78.5 M77 53 C 79.5 64, 83.5 72, 89 78.5"
          strokeWidth="2.4"
        />
        <path d="M2 81 H98" />
        <path d="M8 88 H38 M54 88 H92" strokeWidth="2.4" />
        <path d="M22 94 H44 M58 94 H78" strokeWidth="2.4" />
      </>
    ),
  },
  // The Suramadu Bridge links Surabaya on Java with Bangkalan on Madura across the Madura Strait, and both ends lie in East Java. It is Indonesia's longest bridge, with cable-stayed spans of 192-434-192 m.
  'east-java-suramadu': {
    subject: 'Suramadu Bridge',
    scopes: ['city:id-east-java-surabaya', 'city:id-east-java-bangkalan'],
    ink: [0.3, 6.3, 99.4, 88.9],
    draw: (_id) => (
      <>
        <path
          d="M31 15 L47 58 M31 21 L41.5 58 M31 27 L36 58 M25 15 L9 58 M25 21 L14.5 58 M25 27 L20 58"
          strokeWidth="1.6"
        />
        <path
          d="M69 15 L53 58 M69 21 L58.5 58 M69 27 L64 58 M75 15 L91 58 M75 21 L85.5 58 M75 27 L80 58"
          strokeWidth="1.6"
        />
        <path d="M24 56 L25 13 L28 8 L31 13 L32 56" />
        <path d="M23.8 67 L23.5 80 M32.2 67 L32.5 80" />
        <path d="M68 56 L69 13 L72 8 L75 13 L76 56" />
        <path d="M67.8 67 L67.5 80 M76.2 67 L76.5 80" />
        <path d="M2 58 H98 M2 64.5 H98" />
        <path d="M19 80 H37 M63 80 H81" />
        <path d="M8 64.5 V78 M92 64.5 V78" strokeWidth="2.4" />
        <path
          d="M6 88 C 10 85, 14 91, 18 88 S 26 85, 30 88 S 38 91, 42 88 M58 88 C 62 85, 66 91, 70 88 S 78 85, 82 88 S 90 91, 94 88"
          strokeWidth="2.4"
        />
        <path d="M40 94 H60" strokeWidth="2.4" />
      </>
    ),
  },
  // The Heroes Monument stands on Jalan Pahlawan in central Surabaya, East Java, beside the East Java Governor's Office. It is the city's emblem of the Battle of Surabaya (10 November 1945).
  'east-java-tugu-pahlawan': {
    subject: 'Tugu Pahlawan, Surabaya',
    scopes: ['city:id-east-java-surabaya'],
    ink: [2.3, 4.8, 95.4, 88.4],
    draw: (_id) => (
      <>
        <path d="M4 86 H96" />
        <path d="M22 86 V79 H78 V86" />
        <path d="M30 79 V72 H70 V79" />
        <path d="M33 72 C 37.5 70, 39 67, 39 62 L 44 14 C 44.5 4, 55.5 4, 56 14 L 61 62 C 61 67, 62.5 70, 67 72" />
        <path d="M47.5 67 V35" strokeWidth="1.8" />
        <path d="M52.5 67 V35" strokeWidth="1.8" />
        <path d="M40.2 50 H59.8" strokeWidth="2.4" />
        <path d="M42.5 28 H57.5" strokeWidth="2.4" />
        <path d="M8 92 H28" strokeWidth="2.4" />
        <path d="M38 92 H62" strokeWidth="2.4" />
        <path d="M72 92 H92" strokeWidth="2.4" />
      </>
    ),
  },
  // Tangkuban Perahu is the stratovolcano on the border of West Bandung and Subang regencies, north of Bandung in West Java. Its name ('upturned boat') comes from the Sundanese Sangkuriang legend.
  'west-java-tangkuban-perahu': {
    subject: 'Tangkuban Perahu',
    scopes: ['region:ID:West Java'],
    ink: [2.3, 4.3, 95.4, 88.9],
    draw: (id) => (
      <>
        <defs>
          <mask id={`${id}-cut`}>
            <rect width="100" height="100" fill="#fff" />
            <path
              d="M6 86 C 11.5 77.2, 16 65.1, 19.5 53 C 21.5 45.8, 23.5 42.4, 28 42 C 34 41.6, 39 41.6, 43 41.8 C 45 45.7, 50 45.7, 52 42 C 57 42.2, 62 42.7, 66 43.8 C 72 45.7, 76 50.8, 80 58.5 C 84 66.2, 88 78.3, 94 86 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="7"
            />
          </mask>
        </defs>
        <g mask={`url(#${id}-cut)`}>
          <path
            d="M6 56 C 8.5 48, 10.5 40, 13 33 C 14.5 29.4, 16.5 29.4, 18 33 C 20.5 40, 24 48, 30 56"
            strokeWidth="2.4"
          />
        </g>
        <path d="M6 86 C 11.5 77.2, 16 65.1, 19.5 53 C 21.5 45.8, 23.5 42.4, 28 42 C 34 41.6, 39 41.6, 43 41.8 C 45 45.7, 50 45.7, 52 42 C 57 42.2, 62 42.7, 66 43.8 C 72 45.7, 76 50.8, 80 58.5 C 84 66.2, 88 78.3, 94 86" />
        <path
          d="M41 36 C 38 32, 43 28, 40 23 C 38 19, 42 15, 40 10 C 39.5 9.5, 40.5 8.5, 40 6.5"
          strokeWidth="2.4"
          strokeDasharray="0.1 4.5"
        />
        <path
          d="M46 38 C 47.5 34, 44.5 30, 46 25 C 47 21, 45 17, 46 12 C 46.5 10, 45.5 9, 46 8.5"
          strokeWidth="2.4"
          strokeDasharray="0.1 4.5"
        />
        <path
          d="M51 37 C 48 32, 53 28, 50 23 C 48 19, 52 14, 50 9 C 49.5 8, 50.5 7, 50 5.5"
          strokeWidth="2.4"
          strokeDasharray="0.1 4.5"
        />
        <path
          d="M56 36 C 59 32, 55 28, 58 23 C 60 19, 57 15, 59 11 C 60 9, 58 8.5, 59 6.5"
          strokeWidth="2.4"
          strokeDasharray="0.1 4.5"
        />
        <path d="M4 86 H96" />
        <path d="M8 92 H24" strokeWidth="2.4" />
        <path d="M36 92 H64" strokeWidth="2.4" />
        <path d="M76 92 H92" strokeWidth="2.4" />
      </>
    ),
  },
  // Ondel-ondel are the giant Betawi street puppets of Jakarta, named one of the city's Betawi cultural icons by Jakarta Governor Regulation 11/2017.
  'jakarta-ondel-ondel': {
    subject: 'Ondel-ondel',
    scopes: ['region:ID:Jakarta'],
    ink: [2.3, 6.3, 95.4, 85.4],
    draw: (id) => (
      <>
        <defs>
          <mask id={`${id}-man`}>
            <rect width="100" height="100" fill="#fff" />
            <circle cx="23" cy="33" r="2.7" fill="#000" stroke="none" />
            <circle cx="31" cy="33" r="2.7" fill="#000" stroke="none" />
            <path
              d="M20.2 38.8 C 20.6 43, 24.2 44.6, 27 40.6 C 29.8 44.6, 33.4 43, 33.8 38.8"
              fill="none"
              stroke="#000"
              strokeWidth="3.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </mask>
        </defs>
        <path d="M4 90 H96" />
        <path
          d="M18.5 23.9 L9.1 20.5 M20.5 20.7 L13.3 13.8 M23.5 18.7 L19.6 9.5 M27.0 18.0 L27.0 8.0 M30.5 18.7 L34.4 9.5 M33.5 20.7 L40.7 13.8 M35.5 23.9 L44.9 20.5"
          strokeWidth="2.4"
        />
        <path d="M9.1 20.5 h0 M13.3 13.8 h0 M19.6 9.5 h0 M27.0 8.0 h0 M34.4 9.5 h0 M40.7 13.8 h0 M44.9 20.5 h0" />
        <path d="M16 29 C 20 22.5, 34 22.5, 38 29" />
        <ellipse cx="27" cy="37" rx="10" ry="11.5" fill="currentColor" mask={`url(#${id}-man)`} />
        <path d="M23 50 C 18 51, 14 52.5, 14 58 C 14 70, 12 80, 12 90 M31 50 C 36 51, 40 52.5, 40 58 C 40 70, 42 80, 42 90" />
        <path d="M13.4 71 H40.6" strokeWidth="2.4" />
        <path d="M20.6 54.9 L39.6 65" strokeWidth="2.4" />
        <path
          d="M64.5 23.9 L55.1 20.5 M66.5 20.7 L59.3 13.8 M69.5 18.7 L65.6 9.5 M73.0 18.0 L73.0 8.0 M76.5 18.7 L80.4 9.5 M79.5 20.7 L86.7 13.8 M81.5 23.9 L90.9 20.5"
          strokeWidth="2.4"
        />
        <path d="M55.1 20.5 h0 M59.3 13.8 h0 M65.6 9.5 h0 M73.0 8.0 h0 M80.4 9.5 h0 M86.7 13.8 h0 M90.9 20.5 h0" />
        <path d="M62 29 C 66 22.5, 80 22.5, 84 29" />
        <ellipse cx="73" cy="37" rx="10" ry="11.5" />
        <path
          d="M66.8 35 C 68 32.8, 70.4 32.8, 71.2 35 C 70.4 37.2, 68 37.2, 66.8 35 Z"
          fill="currentColor"
          stroke="none"
        />
        <path
          d="M74.8 35 C 76 32.8, 78.4 32.8, 79.2 35 C 78.4 37.2, 76 37.2, 74.8 35 Z"
          fill="currentColor"
          stroke="none"
        />
        <path d="M70.6 42.6 H75.4" strokeWidth="2.4" />
        <path d="M69 50 C 64 51, 60 52.5, 60 58 C 60 70, 58 80, 58 90 M77 50 C 82 51, 86 52.5, 86 58 C 86 70, 88 80, 88 90" />
        <path d="M59.4 71 H86.6" strokeWidth="2.4" />
        <path d="M66.6 54.9 L85.6 65" strokeWidth="2.4" />
      </>
    ),
  },
  // Monticello, Thomas Jefferson's house, stands at 931 Thomas Jefferson Parkway outside Charlottesville in Albemarle County, Virginia; its west front is the building on the reverse of the US nickel.
  'virginia-monticello': {
    subject: 'Monticello',
    scopes: ['city:us-virginia-charlottesville'],
    ink: [2.3, 24.8, 95.4, 70.4],
    draw: (_id) => (
      <>
        <path d="M4 88 H96" />
        <path d="M10 88 V58 H31 M69 58 H90 V88" />
        <path d="M7 58 H31 M69 58 H93" strokeWidth="2.4" />
        <path d="M10 52 H33 M67 52 H90" strokeWidth="2.4" />
        <path
          d="M15 58 V52 M22 58 V52 M29 58 V52 M71 58 V52 M78 58 V52 M85 58 V52"
          strokeWidth="1.8"
        />
        <path
          d="M15 80 V66 H19 V80 Z M24 80 V66 H28 V80 Z M72 80 V66 H76 V80 Z M81 80 V66 H85 V80 Z"
          fill="currentColor"
          stroke="none"
        />
        <path
          d="M15 63 V60 H19 V63 Z M24 63 V60 H28 V63 Z M72 63 V60 H76 V63 Z M81 63 V60 H85 V63 Z"
          fill="currentColor"
          stroke="none"
        />
        <path d="M33 52 V42 M67 52 V42" strokeWidth="2.4" />
        <path d="M31 42 H69" strokeWidth="2.4" />
        <path d="M33 42 L37.5 34 L44 29.5 H56 L62.5 34 L67 42" />
        <path d="M44 29.5 L43 39 M56 29.5 L57 39" strokeWidth="1.8" />
        <path d="M47 29.5 V26 H53 V29.5" strokeWidth="2.4" />
        <path d="M29 56 L50 44 L71 56 Z" />
        <circle cx="50" cy="35.5" r="2.2" fill="currentColor" stroke="none" />
        <circle cx="50" cy="51.5" r="1.8" fill="currentColor" stroke="none" />
        <path d="M34 84 V59 M44 84 V59 M56 84 V59 M66 84 V59" />
        <path d="M30 59 H70" strokeWidth="2.4" />
        <path d="M47.5 84 V75 A2.5 2.5 0 0 1 52.5 75 V84 Z" fill="currentColor" stroke="none" />
        <path d="M29 84 H71" />
        <path d="M8 94 H30 M38 94 H62 M70 94 H92" strokeWidth="2.4" />
      </>
    ),
  },
  // Borobudur stands in Borobudur district, Magelang Regency, Central Java; it is a UNESCO World Heritage Site and Indonesia's best-known monument.
  borobudur: {
    subject: 'Borobudur',
    scopes: ['region:ID:Central Java', 'country:ID'],
    ink: [2.3, 10.3, 95.4, 84.9],
    draw: (_id) => (
      <>
        <path d="M4 88 H96" />
        <path d="M6 88 V81 H12 V74 H18 V67 H24 V60 H76 V67 H82 V74 H88 V81 H94 V88" />
        <path
          d="M12 81 H45 M55 81 H88 M18 74 H45 M55 74 H82 M24 67 H45 M55 67 H76"
          strokeWidth="2.4"
        />
        <path d="M45 88 V60 M55 88 V60" strokeWidth="2.4" />
        <path
          d="M29 60 C 29 56.75, 30.65 55, 32 55 C 33.35 55, 35 56.75, 35 60 M32 55 V53 M38 60 C 38 56.75, 39.65 55, 41 55 C 42.35 55, 44 56.75, 44 60 M41 55 V53 M47 60 C 47 56.75, 48.65 55, 50 55 C 51.35 55, 53 56.75, 53 60 M50 55 V53 M56 60 C 56 56.75, 57.65 55, 59 55 C 60.35 55, 62 56.75, 62 60 M59 55 V53 M65 60 C 65 56.75, 66.65 55, 68 55 C 69.35 55, 71 56.75, 71 60 M68 55 V53"
          strokeWidth="2.4"
        />
        <path d="M28 50 H72" strokeWidth="2.4" />
        <path
          d="M30.5 50 C 30.5 46.75, 32.15 45, 33.5 45 C 34.85 45, 36.5 46.75, 36.5 50 M33.5 45 V43 M63.5 50 C 63.5 46.75, 65.15 45, 66.5 45 C 67.85 45, 69.5 46.75, 69.5 50 M66.5 45 V43"
          strokeWidth="2.4"
        />
        <path d="M40 50 C 40 39, 44 32, 50 32 C 56 32, 60 39, 60 50" />
        <path d="M46 32 V28 H54 V32" strokeWidth="2.4" />
        <path d="M48 28 L50 12 L52 28" />
        <path d="M12 94 H34 M42 94 H58 M66 94 H88" strokeWidth="2.4" />
      </>
    ),
  },
  // Lawang Sewu, the former Dutch East Indies railway company (NIS) office, stands on Jalan Pemuda at Tugu Muda in Semarang, the capital of Central Java.
  'central-java-lawang-sewu': {
    subject: 'Lawang Sewu, Semarang',
    scopes: ['city:id-central-java-semarang'],
    ink: [2.3, 15.8, 95.4, 79.4],
    draw: (_id) => (
      <>
        <path d="M4 88 H96" />
        <path d="M6.5 88 V58 H32 M68 58 H93.5 V88" />
        <path d="M4 58 L10 51 H32 M68 51 H90 L96 58" strokeWidth="2.4" />
        <path d="M6.5 73.5 H32 M68 73.5 H93.5" strokeWidth="2.4" />
        <path
          d="M9.5 71 V64.5 A1.5 1.5 0 0 1 12.5 63 V71 Z M15.5 71 V64.5 A1.5 1.5 0 0 1 18.5 63 V71 Z M21.5 71 V64.5 A1.5 1.5 0 0 1 24.5 63 V71 Z M27.5 71 V64.5 A1.5 1.5 0 0 1 30.5 63 V71 Z M87.5 71 V64.5 A1.5 1.5 0 0 1 90.5 63 V71 Z M81.5 71 V64.5 A1.5 1.5 0 0 1 84.5 63 V71 Z M75.5 71 V64.5 A1.5 1.5 0 0 1 78.5 63 V71 Z M69.5 71 V64.5 A1.5 1.5 0 0 1 72.5 63 V71 Z"
          fill="currentColor"
          stroke="none"
        />
        <path
          d="M9.5 86 V78.5 A1.5 1.5 0 0 1 12.5 77.5 V86 Z M15.5 86 V78.5 A1.5 1.5 0 0 1 18.5 77.5 V86 Z M21.5 86 V78.5 A1.5 1.5 0 0 1 24.5 77.5 V86 Z M27.5 86 V78.5 A1.5 1.5 0 0 1 30.5 77.5 V86 Z M87.5 86 V78.5 A1.5 1.5 0 0 1 90.5 77.5 V86 Z M81.5 86 V78.5 A1.5 1.5 0 0 1 84.5 77.5 V86 Z M75.5 86 V78.5 A1.5 1.5 0 0 1 78.5 77.5 V86 Z M69.5 86 V78.5 A1.5 1.5 0 0 1 72.5 77.5 V86 Z"
          fill="currentColor"
          stroke="none"
        />
        <path d="M32 88 V36 H40 V88 M60 88 V36 H68 V88" />
        <path d="M30.5 36 H41.5 M58.5 36 H69.5" strokeWidth="2.4" />
        <path d="M33 36 V30 M39 36 V30 M61 36 V30 M67 36 V30" strokeWidth="2.4" />
        <path d="M32 30 C 32 25, 34 22.5, 36 22.5 C 38 22.5, 40 25, 40 30 Z M60 30 C 60 25, 62 22.5, 64 22.5 C 66 22.5, 68 25, 68 30 Z" />
        <path d="M36 22.5 V17 M64 22.5 V17" strokeWidth="2.4" />
        <path
          d="M34.5 51 V42.5 A1.5 1.5 0 0 1 37.5 42.5 V51 Z M62.5 51 V42.5 A1.5 1.5 0 0 1 65.5 42.5 V51 Z"
          fill="currentColor"
          stroke="none"
        />
        <path d="M40 54 L44 47 H56 L60 54 Z" />
        <path d="M44 88 V76 A6 6 0 0 1 56 76 V88" strokeWidth="2.4" />
        <path
          d="M45.5 68 V60.5 A1.5 1.5 0 0 1 48.5 60.5 V68 Z M51.5 68 V60.5 A1.5 1.5 0 0 1 54.5 60.5 V68 Z"
          fill="currentColor"
          stroke="none"
        />
        <path d="M10 94 H30 M38 94 H62 M70 94 H90" strokeWidth="2.4" />
      </>
    ),
  },
  // The Prambanan temple compound's main gate and address are on Jalan Raya Solo–Yogyakarta, Bokoharjo, Prambanan district, Sleman Regency, Special Region of Yogyakarta. The site straddles the border with Klaten, Central Java.
  'yogyakarta-prambanan': {
    subject: 'Prambanan',
    scopes: ['region:ID:Yogyakarta'],
    ink: [2.3, 14.8, 95.4, 80.4],
    draw: (_id) => (
      <>
        <path d="M4 88 H96" />
        <path d="M33 88 L33 81 L40 81 L40 64 L40 64 L40 59 L38.2 56.9 L40.6 54.3 L41.6 55.5 L41.6 55.5 L41.6 51 L39.8 48.9 L42.2 46.3 L43.2 47.5 L43.2 47.5 L43.2 43.5 L41.4 41.4 L43.8 38.8 L44.7 40 L44.7 40 L44.7 36.5 L42.9 34.4 L45.3 31.8 L46.1 33 L46.1 33 L46.1 30 L44.3 27.9 L46.7 25.3 L47.6 26.5 C 47.6 21.5, 50 20.5, 50 16.5 C 50 20.5, 52.4 21.5, 52.4 26.5 L53.3 25.3 L55.7 27.9 L53.9 30 L53.9 33 L53.9 33 L54.7 31.8 L57.1 34.4 L55.3 36.5 L55.3 40 L55.3 40 L56.2 38.8 L58.6 41.4 L56.8 43.5 L56.8 47.5 L56.8 47.5 L57.8 46.3 L60.2 48.9 L58.4 51 L58.4 55.5 L58.4 55.5 L59.4 54.3 L61.8 56.9 L60 59 L60 64 L60 64 L60 81 L67 81 L67 88" />
        <path
          d="M42.1 55.5 H57.9 M43.7 47.5 H56.3 M45.3 40 H54.7 M46.8 33 H53.2"
          strokeWidth="2.4"
        />
        <path d="M47 81 V73 A3 3 0 0 1 53 73 V81 Z" fill="currentColor" stroke="none" />
        <path d="M45 88 V81 M55 88 V81" strokeWidth="2.4" />
        <path d="M7.46 88 L7.46 83.66 L11.8 83.66 L11.8 74.36 L11.8 74.36 L11.8 72.59 L10 70.49 L12.4 67.89 L12.79 69.09 L12.79 69.09 L12.79 67.63 L10.99 65.53 L13.39 62.93 L13.78 64.13 L13.78 64.13 L13.78 62.98 L11.98 60.88 L14.38 58.28 L14.71 59.48 L14.71 59.48 L14.71 58.64 L12.91 56.54 L15.31 53.94 L15.89 55.14 C 15.89 52.35, 18 51.79, 18 49.56 C 18 51.79, 20.11 52.35, 20.11 55.14 L20.69 53.94 L23.09 56.54 L21.29 58.64 L21.29 59.48 L21.29 59.48 L21.62 58.28 L24.02 60.88 L22.22 62.98 L22.22 64.13 L22.22 64.13 L22.61 62.93 L25.01 65.53 L23.21 67.63 L23.21 69.09 L23.21 69.09 L23.6 67.89 L26 70.49 L24.2 72.59 L24.2 74.36 L24.2 74.36 L24.2 83.66 L28.54 83.66 L28.54 88" />
        <path d="M13.33 69.09 H22.67 M14.32 64.13 H21.68 M15.31 59.48 H20.69" strokeWidth="2.4" />
        <path
          d="M16.14 83.66 V78.7 A1.86 1.86 0 0 1 19.86 78.7 V83.66 Z"
          fill="currentColor"
          stroke="none"
        />
        <path d="M14.9 88 V83.66 M21.1 88 V83.66" strokeWidth="2.4" />
        <path d="M71.46 88 L71.46 83.66 L75.8 83.66 L75.8 74.36 L75.8 74.36 L75.8 72.59 L74 70.49 L76.4 67.89 L76.79 69.09 L76.79 69.09 L76.79 67.63 L74.99 65.53 L77.39 62.93 L77.78 64.13 L77.78 64.13 L77.78 62.98 L75.98 60.88 L78.38 58.28 L78.71 59.48 L78.71 59.48 L78.71 58.64 L76.91 56.54 L79.31 53.94 L79.89 55.14 C 79.89 52.35, 82 51.79, 82 49.56 C 82 51.79, 84.11 52.35, 84.11 55.14 L84.69 53.94 L87.09 56.54 L85.29 58.64 L85.29 59.48 L85.29 59.48 L85.62 58.28 L88.02 60.88 L86.22 62.98 L86.22 64.13 L86.22 64.13 L86.61 62.93 L89.01 65.53 L87.21 67.63 L87.21 69.09 L87.21 69.09 L87.6 67.89 L90 70.49 L88.2 72.59 L88.2 74.36 L88.2 74.36 L88.2 83.66 L92.54 83.66 L92.54 88" />
        <path d="M77.33 69.09 H86.67 M78.32 64.13 H85.68 M79.31 59.48 H84.69" strokeWidth="2.4" />
        <path
          d="M80.14 83.66 V78.7 A1.86 1.86 0 0 1 83.86 78.7 V83.66 Z"
          fill="currentColor"
          stroke="none"
        />
        <path d="M78.9 88 V83.66 M85.1 88 V83.66" strokeWidth="2.4" />
        <path d="M10 94 H30 M38 94 H62 M70 94 H90" strokeWidth="2.4" />
      </>
    ),
  },
  // Bajaj auto-rickshaws have worked Jakarta's streets since the 1970s, and in Jakarta 'bajaj' is the everyday word for the vehicle, so the drawing stands for DKI Jakarta. It shows no maker's badge.
  'jakarta-bajaj': {
    subject: 'Bajaj (auto-rickshaw), Jakarta',
    scopes: ['region:ID:Jakarta'],
    ink: [0.3, 19.3, 99.4, 70.4],
    draw: (_id) => (
      <>
        <path d="M2 88 H98" />
        <path d="M15 21 H77" />
        <path d="M77 21 A 16 52 0 0 1 93 73 H27.5" />
        <path d="M21 21 L17 45" />
        <path d="M15.5 45 H31 L27.5 73 H19.5 Z" />
        <circle cx="23.3" cy="52" r="2" fill="currentColor" stroke="none" />
        <circle cx="23.5" cy="83" r="4.5" />
        <circle cx="78" cy="82" r="5.2" />
        <path d="M15 76.3 A 10.5 10.5 0 0 1 32 76.3" strokeWidth="2.4" />
        <path d="M71 21 V55 A 9 18 0 0 1 62 73" />
        <path d="M31 45 L35 38.5 M32.5 38.5 H38.5" strokeWidth="2.4" />
        <path d="M35.5 59 H43.5 M39.5 59 V73" strokeWidth="2.4" />
        <path d="M49 59 H59 C 60.5 59, 61 58, 61 56 V40" strokeWidth="2.4" />
        <path
          d="M77 29 H80.5 C 83.5 29, 85.5 32.5, 86 38 V40 H77 Z"
          fill="currentColor"
          stroke="none"
        />
      </>
    ),
  },
  // Istiqlal Mosque stands on Jalan Taman Wijaya Kusuma, Pasar Baru, Sawah Besar, Central Jakarta. It is Indonesia's national mosque, designed by Friedrich Silaban, with a 45 m dome and a single minaret.
  'jakarta-istiqlal': {
    subject: 'Istiqlal Mosque, Jakarta',
    scopes: ['region:ID:Jakarta'],
    ink: [2.3, 4.8, 95.4, 84.9],
    draw: (_id) => (
      <>
        <path d="M4 88 H96" />
        <path d="M5 88 V75 H95 V88" strokeWidth="2.4" />
        <path
          d="M8 83.6 V78.9 H12.5 V83.6 Z M16 83.6 V78.9 H20.5 V83.6 Z M24 83.6 V78.9 H28.5 V83.6 Z M32 83.6 V78.9 H36.5 V83.6 Z M40 83.6 V78.9 H44.5 V83.6 Z M48 83.6 V78.9 H52.5 V83.6 Z M56 83.6 V78.9 H60.5 V83.6 Z M64 83.6 V78.9 H68.5 V83.6 Z M72 83.6 V78.9 H76.5 V83.6 Z M80 83.6 V78.9 H84.5 V83.6 Z M88 83.6 V78.9 H92.5 V83.6 Z"
          fill="currentColor"
          stroke="none"
        />
        <path d="M16 75 V51 H64 V75" />
        <path d="M13 51 H67" />
        <path
          d="M20.5 55 h5 v6 h-5 Z M29.5 55 h5 v6 h-5 Z M38.5 55 h5 v6 h-5 Z M47.5 55 h5 v6 h-5 Z M56.5 55 h5 v6 h-5 Z M20.5 65 h5 v6 h-5 Z M29.5 65 h5 v6 h-5 Z M47.5 65 h5 v6 h-5 Z M56.5 65 h5 v6 h-5 Z"
          fill="currentColor"
          stroke="none"
        />
        <path d="M36.5 75 V66 H43.5 V75" strokeWidth="2.4" />
        <path d="M18 51 C 18 38, 28 29, 40 29 C 52 29, 62 38, 62 51" />
        <path d="M19.6 44.5 H60.4" strokeWidth="2.4" />
        <path d="M40 29 V20" strokeWidth="2.4" />
        <circle cx="40" cy="18" r="2.2" fill="currentColor" stroke="none" />
        <path d="M81 75 V31 M88 75 V31" />
        <path d="M78 31 H91" />
        <path d="M81 31 V22 H88 V31" strokeWidth="2.4" />
        <path d="M84.5 25 V28" strokeWidth="1.8" />
        <path d="M82.5 22 L84.5 6 L86.5 22" strokeWidth="2.4" />
        <path d="M81 50 H88" strokeWidth="2.4" />
      </>
    ),
  },
  // Half-timbered (Fachwerk) townhouses are found across Germany, and the German Timber-Frame Road (Deutsche Fachwerkstraße) links over a hundred such towns in several states. Visitors from anywhere in Germany would recognise one.
  'germany-fachwerk': {
    subject: 'Half-timbered house',
    scopes: ['country:DE'],
    ink: [2.3, 5.3, 95.4, 84.4],
    draw: (_id) => (
      <>
        <path d="M4 88 H96" />
        <path d="M24 88 V68 M76 88 V68" />
        <path d="M19 66 V47 M81 66 V47" />
        <path d="M12 49 L50 7 L88 49" />
        <path d="M17 47 H83 M17 67 H83" />
        <path d="M50 66 V47" strokeWidth="2.4" />
        <path d="M50 58 L38 66 M50 58 L62 66 M50 54 L42 47 M50 54 L58 47" strokeWidth="2.4" />
        <rect x="26" y="51" width="8" height="10" strokeWidth="2.4" />
        <rect x="66" y="51" width="8" height="10" strokeWidth="2.4" />
        <path d="M30 51 V61 M26 56 H34 M70 51 V61 M66 56 H74" strokeWidth="1.6" />
        <path d="M32.5 28 H67.5" strokeWidth="2.4" />
        <path d="M28 47 L41 28 M72 47 L59 28" strokeWidth="2.4" />
        <rect x="45" y="33.5" width="10" height="7.5" strokeWidth="2.4" />
        <path d="M50 33.5 V41" strokeWidth="1.6" />
        <path d="M37 88 V67 M63 88 V67" strokeWidth="2.4" />
        <path d="M45 88 V74 H55 V88" strokeWidth="2.4" />
        <rect x="28.5" y="72" width="4.5" height="8" fill="currentColor" stroke="none" />
        <rect x="67" y="72" width="4.5" height="8" fill="currentColor" stroke="none" />
        <path d="M37 75 L45 67 M63 75 L55 67" strokeWidth="2.4" />
      </>
    ),
  },
  // The Grimms' tale 'Die Bremer Stadtmusikanten' (KHM 27) is the Free Hanseatic City of Bremen's emblem story. Bremen is a city-state, so it is its own region.
  'bremen-musicians': {
    subject: 'The Town Musicians of Bremen',
    scopes: ['region:DE:Bremen'],
    ink: [2.3, 6.8, 95.4, 82.9],
    draw: (id) => (
      <>
        <defs>
          <mask id={`${id}-donkey`}>
            <rect width="100" height="100" fill="#fff" />
            <path d="M55 62.5 V58 M70 60.5 V57" stroke="#000" strokeWidth="9" />
          </mask>
        </defs>
        <path d="M4 88 H96" />
        <path
          mask={`url(#${id}-donkey)`}
          d="M35 75 H72 C 79 75, 82 72, 82 67 C 82 63, 78 60, 73 60 C 64 60, 56 62.5, 47 59.5 L34 41 L15 50 C 11 52, 11 58, 15 59 L25 58 C 28 58, 30 56, 30 54 L34 66 C 35 69, 35 72, 35 75 Z"
        />
        <path d="M31 41.5 C 27 36, 25.5 30, 26 25 C 30 28.5, 33 34, 34 41" strokeWidth="2.4" />
        <path
          d="M35.5 43 C 34 37, 34 31, 35.5 27 C 38.5 31, 39.5 37, 38.5 43.5"
          strokeWidth="2.4"
        />
        <circle cx="24" cy="48" r="1.9" fill="currentColor" stroke="none" />
        <path d="M37 75 L36 87 M76 74 L78.5 80.5 L76 87" />
        <path d="M43 75 V87 M69 75 V87" strokeWidth="2.4" />
        <path d="M82 66 C 85 69, 86 72, 86 77" strokeWidth="2.4" />
        <path d="M56 55 H67 C 69.5 55, 71 53, 71 51 L72.5 44.5 C 73.5 41, 76.5 39.5, 79.5 41 L84.5 44.5 C 85.5 45.5, 85 47, 83.5 47 L78 48 C 76 48.5, 75 50, 74 52 M71 47 H56 C 53.5 47, 52 49, 52 51 C 52 53, 53.5 55, 56 55" />
        <circle cx="84" cy="45.6" r="1.8" fill="currentColor" stroke="none" />
        <path
          d="M76.5 41 C 74 42.5, 73.5 46, 75 49 C 77 47.5, 78 44.5, 77.5 41.5 Z"
          fill="currentColor"
          strokeWidth="1.6"
        />
        <path d="M55 55 V62 M70 55 V60.5" />
        <path d="M52.5 49.5 C 49.5 48.5, 47.5 46.5, 46.5 43.5" />
        <path d="M57 47 V42 C 57 35, 60.5 31, 65 31 C 69.5 31, 72.5 35, 72.5 42 V47" />
        <circle cx="53.5" cy="36" r="4" />
        <path d="M51 33 L50.5 28 L53.5 31 M55 31 L57 27.5 L57 33" strokeWidth="2.4" />
        <path
          d="M71.5 35.5 C 75.5 35.5, 78.5 33, 78 30 C 77.5 28, 75.5 28, 75.5 30"
          strokeWidth="2.4"
        />
        <path d="M 66.5 31 V 26 M 60.5 15.5 C 59.5 21.5 62.5 25.5 67 25.5 C 71 25.5 73.5 23 73.5 19.5 L 72.5 15.5 C 74 14.5 74 12.5 72.5 11.5 C 71 10 69 10.5 68.5 12.5 L 68 15.5 C 65.5 16.5 63 16.5 60.5 15.5 C 59.5 12.5 60 10 61.5 8.5 C 62.5 11.5 63 13.5 62.5 16.5" />
        <path d="M 73.5 12.5 L 77 14 L 73.5 15" strokeWidth="2.4" />
        <circle cx="70.5" cy="9.1" r="1.9" fill="currentColor" stroke="none" />
      </>
    ),
  },
  // The candi bentar (split gate) is the outer gateway of Balinese temples and compounds, an architectural form particular to Bali province; drawn as architecture, with no figures or offerings.
  'bali-candi-bentar': {
    subject: 'Candi bentar gate, Bali',
    scopes: ['region:ID:Bali'],
    ink: [2.3, 8.3, 95.4, 87.4],
    draw: (_id) => (
      <>
        <path d="M4 90 H96" />
        <path d="M8 90 V81 H42 M58 81 H92 V90" strokeWidth="2.4" />
        <path d="M42 81 V10 H38.5 V15 L35.5 17 V23 L32.5 25 V31 L29.5 33 V39 L26.5 41 V47 L20 49 V54 H18 V76 L14 78 V81" />
        <path d="M58 81 V10 H61.5 V15 L64.5 17 V23 L67.5 25 V31 L70.5 33 V39 L73.5 41 V47 L80 49 V54 H82 V76 L86 78 V81" />
        <path
          d="M35.5 23 H42 M32.5 31 H42 M29.5 39 H42 M26.5 47 H42 M58 23 H64.5 M58 31 H67.5 M58 39 H70.5 M58 47 H73.5"
          strokeWidth="2.4"
        />
        <path d="M20 54 H42 M58 54 H80 M18 76 H42 M58 76 H82" strokeWidth="2.4" />
        <path d="M25 72 V64 A4 4 0 0 1 33 64 V72 Z" fill="currentColor" stroke="none" />
        <path d="M67 72 V64 A4 4 0 0 1 75 64 V72 Z" fill="currentColor" stroke="none" />
        <path d="M45 90 V81 M55 90 V81" strokeWidth="2.4" />
        <path d="M45 85.5 H55" strokeWidth="1.8" />
        <path d="M8 94.5 H30 M38 94.5 H62 M70 94.5 H92" strokeWidth="2.4" />
      </>
    ),
  },
  // Jatiluwih is in Penebel district, Tabanan Regency, Bali, below Mount Batukaru, and is part of UNESCO's Cultural Landscape of Bali Province (subak system, inscribed 2012).
  'bali-jatiluwih': {
    subject: 'Jatiluwih rice terraces',
    scopes: ['region:ID:Bali'],
    ink: [2.3, 15.6, 95.4, 78.1],
    draw: (_id) => (
      <>
        <path d="M4 18.5 C 9.5 17, 11 17, 16 18.5 C 18 19.5, 19.4 25.2, 20 32 C 23.7 32, 27.1 32.4, 30.5 33 C 32.5 34, 33.9 40.2, 34.5 47 C 38.2 47, 41.6 47.4, 45 48 C 47 49, 48.4 55.2, 49 62 C 52.7 62, 56.1 62.4, 59.5 63 C 61.5 64, 62.9 70.2, 63.5 77 C 67.2 77, 70.6 77.4, 74 78 C 76 79, 77.4 85.7, 78 92" />
        <path d="M20 32 C 15.2 32.3, 9.6 33.1, 4 34.5" strokeWidth="2.4" />
        <path d="M34.5 47 C 25.4 47.3, 14.7 48.1, 4 49.5" strokeWidth="2.4" />
        <path d="M49 62 C 35.5 62.3, 19.8 63.1, 4 64.5" strokeWidth="2.4" />
        <path d="M63.5 77 C 45.7 77.2, 24.8 77.4, 4 78" strokeWidth="2.4" />
        <path d="M6.5 27.5 L5.5 24.5 M9 27.5 V24 M11.5 27.5 L12.5 24.5" strokeWidth="1.6" />
        <path
          d="M7.5 43 L6.5 40 M10 43 V39.5 M12.5 43 L13.5 40 M20 41.9 L19 38.9 M22.5 41.9 V38.4 M25 41.9 L26 38.9"
          strokeWidth="1.6"
        />
        <path
          d="M8.5 58.1 L7.5 55.1 M11 58.1 V54.6 M13.5 58.1 L14.5 55.1 M22.5 57 L21.5 54 M25 57 V53.5 M27.5 57 L28.5 54 M35.5 56.9 L34.5 53.9 M38 56.9 V53.4 M40.5 56.9 L41.5 53.9"
          strokeWidth="1.6"
        />
        <path
          d="M10.5 72.4 L9.5 69.4 M13 72.4 V68.9 M15.5 72.4 L16.5 69.4 M26.5 72 L25.5 69 M29 72 V68.5 M31.5 72 L32.5 69 M39.5 71.6 L38.5 68.6 M42 71.6 V68.1 M44.5 71.6 L45.5 68.6 M50.5 71.9 L49.5 68.9 M53 71.9 V68.4 M55.5 71.9 L56.5 68.9"
          strokeWidth="1.6"
        />
        <path
          d="M13.5 86.3 L12.5 83.3 M16 86.3 V82.8 M18.5 86.3 L19.5 83.3 M28.5 86.1 L27.5 83.1 M31 86.1 V82.6 M33.5 86.1 L34.5 83.1 M43.5 85.9 L42.5 82.9 M46 85.9 V82.4 M48.5 85.9 L49.5 82.9 M58.5 86 L57.5 83 M61 86 V82.5 M63.5 86 L64.5 83"
          strokeWidth="1.6"
        />
        <path d="M86 92 C 86 75.2, 85 62.6, 82 50" />
        <path d="M82 50 C 76 44, 69 44, 64 48" />
        <path d="M82 50 C 79 42, 73 38, 67 38" strokeWidth="2.4" />
        <path d="M82 50 C 85.5 42, 89 40, 93 41.5" strokeWidth="2.4" />
        <path d="M82 50 C 87.5 47, 91 51, 92.5 56" />
        <circle cx="80.6" cy="54" r="2" fill="currentColor" stroke="none" />
        <circle cx="85" cy="54.6" r="2" fill="currentColor" stroke="none" />
        <path d="M4 92 H96" />
      </>
    ),
  },
  // Maimun Palace, built in 1888 by the Sultan of Deli, stands on Jalan Brigjend Katamso in Medan, the capital of North Sumatra, and is the city's best-known landmark.
  'north-sumatra-istana-maimun': {
    subject: 'Istana Maimun, Medan',
    scopes: ['city:id-north-sumatra-medan'],
    ink: [2.3, 9.4, 95.4, 80.3],
    draw: (_id) => (
      <>
        <path d="M4 88 H96" />
        <path d="M8 88 V62 H38 M62 62 H92 V88" />
        <path d="M4 62 L10 55 H38 M62 55 H90 L96 62" strokeWidth="2.4" />
        <path d="M8 80 H38 M62 80 H92" strokeWidth="2.4" />
        <path
          d="M12.7 75.5 V71 C 12.7 68.8, 13.9 68, 14.9 67 C 15.9 68, 17.1 68.8, 17.1 71 V75.5 Z M20.8 75.5 V71 C 20.8 68.8, 22 68, 23 67 C 24 68, 25.2 68.8, 25.2 71 V75.5 Z M28.9 75.5 V71 C 28.9 68.8, 30.1 68, 31.1 67 C 32.1 68, 33.3 68.8, 33.3 71 V75.5 Z M66.7 75.5 V71 C 66.7 68.8, 67.9 68, 68.9 67 C 69.9 68, 71.1 68.8, 71.1 71 V75.5 Z M74.8 75.5 V71 C 74.8 68.8, 76 68, 77 67 C 78 68, 79.2 68.8, 79.2 71 V75.5 Z M82.9 75.5 V71 C 82.9 68.8, 84.1 68, 85.1 67 C 86.1 68, 87.3 68.8, 87.3 71 V75.5 Z"
          fill="currentColor"
          stroke="none"
        />
        <path d="M38 88 V48 H62 V88" />
        <path d="M35 48 H65" />
        <path
          d="M40 88 L44.5 80 V74 C 44.5 71, 47.5 69.5, 50 67.5 C 52.5 69.5, 55.5 71, 55.5 74 V80 L60 88 M44.5 80 H55.5"
          strokeWidth="2.4"
        />
        <path
          d="M43 64 V58 C 43 56, 44 55, 45 54 C 46 55, 47 56, 47 58 V64 Z M53 64 V58 C 53 56, 54 55, 55 54 C 56 55, 57 56, 57 58 V64 Z"
          fill="currentColor"
          stroke="none"
        />
        <path d="M41 48 V41.4 H59 V48" strokeWidth="2.4" />
        <path d="M40 41.4 H60" />
        <path d="M42 41.4 C 39 35.4, 41 29.4, 46 26.4 C 48.5 24.9, 50 22.4, 50 19.4 C 50 22.4, 51.5 24.9, 54 26.4 C 59 29.4, 61 35.4, 58 41.4" />
        <path d="M50 19.4 V13.4" strokeWidth="2.4" />
        <circle cx="50" cy="11.4" r="2" fill="currentColor" stroke="none" />
        <path d="M35 48 V45.5 M65 48 V45.5" strokeWidth="2.4" />
      </>
    ),
  },
  // The rumah bolon is the traditional house of the Toba Batak, whose homeland is around Lake Toba and Samosir in North Sumatra province.
  'north-sumatra-batak-house': {
    subject: 'Batak house, Lake Toba',
    scopes: ['region:ID:North Sumatra'],
    ink: [2.3, 6.3, 95.4, 90.1],
    draw: (_id) => (
      <>
        <path d="M5 8 C 24 27, 38 31, 50 31 C 62 31, 76 27, 95 8 C 85 18, 82 36, 82 54 C 70 58, 30 58, 18 54 C 18 36, 15 18, 5 8 Z" />
        <path d="M29 32.8 C 35 36.2, 42 38, 50 38 C 58 38, 65 36.2, 71 32.8" strokeWidth="2.4" />
        <path
          d="M27 50 V44 M34 50 V44 M42 50 V44 M50 50 V44 M58 50 V44 M66 50 V44 M73 50 V44"
          strokeWidth="1.8"
        />
        <path d="M23 56.5 L 25.5 74 H74.5 L77 56.5" />
        <path d="M24.6 67.7 H75.4" strokeWidth="2.4" />
        <path
          d="M31 67.7 L34 62.7 L37 67.7 M47 67.7 L50 62.7 L53 67.7 M63 67.7 L66 62.7 L69 67.7"
          strokeWidth="1.8"
        />
        <path d="M30 74 V86 M43 74 V86 M57 74 V86 M70 74 V86" />
        <path d="M30 80 H70" strokeWidth="2.4" />
        <path d="M4 86 H96" />
        <path
          d="M8 93.5 C 12 91.3, 16 95.7, 20 93.5 S 28 91.3, 32 93.5 S 40 95.7, 44 93.5 M56 93.5 C 60 91.3, 64 95.7, 68 93.5 S 76 91.3, 80 93.5 S 88 95.7, 92 93.5"
          strokeWidth="2.4"
        />
      </>
    ),
  },
  // The tongkonan is the ancestral house of the Toraja people of Tana Toraja and North Toraja regencies, South Sulawesi; its upswept boat-shaped roof and the buffalo horns stacked on the front post (tulak somba) are the province's best-known architectural image.
  'south-sulawesi-tongkonan': {
    subject: 'Toraja tongkonan',
    scopes: ['region:ID:South Sulawesi'],
    ink: [2.3, 6.3, 95.4, 86.9],
    draw: (id) => (
      <>
        <defs>
          <mask id={`${id}-horns`}>
            <rect width="100" height="100" fill="#fff" />
            <polygon
              points="74.50 46.00 74.05 47.16 73.69 48.24 73.41 49.23 73.22 50.15 73.11 51.01 73.08 51.82 73.13 52.59 73.27 53.33 73.50 54.03 73.81 54.70 74.21 55.33 74.70 55.92 75.25 56.45 75.85 56.92 76.51 57.34 77.20 57.71 77.92 58.03 78.65 58.30 79.40 58.52 80.14 58.70 80.88 58.83 81.61 58.93 82.32 58.98 83.00 59.00 83.68 58.98 84.39 58.93 85.12 58.83 85.86 58.70 86.60 58.52 87.35 58.30 88.08 58.03 88.80 57.71 89.49 57.34 90.15 56.92 90.75 56.45 91.30 55.92 91.79 55.33 92.19 54.70 92.50 54.03 92.73 53.33 92.87 52.59 92.92 51.82 92.89 51.01 92.78 50.15 92.59 49.23 92.31 48.24 91.95 47.16 91.50 46.00 91.93 47.17 92.22 48.26 92.39 49.26 92.44 50.17 92.37 50.99 92.21 51.71 91.96 52.33 91.64 52.84 91.27 53.26 90.86 53.60 90.42 53.86 89.95 54.06 89.45 54.21 88.93 54.32 88.39 54.40 87.83 54.45 87.25 54.48 86.65 54.48 86.04 54.48 85.43 54.46 84.81 54.44 84.20 54.42 83.59 54.41 83.00 54.40 82.41 54.41 81.80 54.42 81.19 54.44 80.57 54.46 79.96 54.48 79.35 54.48 78.75 54.48 78.17 54.45 77.61 54.40 77.07 54.32 76.55 54.21 76.05 54.06 75.58 53.86 75.14 53.60 74.73 53.26 74.36 52.84 74.04 52.33 73.79 51.71 73.63 50.99 73.56 50.17 73.61 49.26 73.78 48.26 74.07 47.17"
              fill="#000"
              stroke="#000"
              strokeWidth="8.5"
            />
            <polygon
              points="74.50 65.00 74.05 66.16 73.69 67.24 73.41 68.23 73.22 69.15 73.11 70.01 73.08 70.82 73.13 71.59 73.27 72.33 73.50 73.03 73.81 73.70 74.21 74.33 74.70 74.92 75.25 75.45 75.85 75.92 76.51 76.34 77.20 76.71 77.92 77.03 78.65 77.30 79.40 77.52 80.14 77.70 80.88 77.83 81.61 77.93 82.32 77.98 83.00 78.00 83.68 77.98 84.39 77.93 85.12 77.83 85.86 77.70 86.60 77.52 87.35 77.30 88.08 77.03 88.80 76.71 89.49 76.34 90.15 75.92 90.75 75.45 91.30 74.92 91.79 74.33 92.19 73.70 92.50 73.03 92.73 72.33 92.87 71.59 92.92 70.82 92.89 70.01 92.78 69.15 92.59 68.23 92.31 67.24 91.95 66.16 91.50 65.00 91.93 66.17 92.22 67.26 92.39 68.26 92.44 69.17 92.37 69.99 92.21 70.71 91.96 71.33 91.64 71.84 91.27 72.26 90.86 72.60 90.42 72.86 89.95 73.06 89.45 73.21 88.93 73.32 88.39 73.40 87.83 73.45 87.25 73.48 86.65 73.48 86.04 73.48 85.43 73.46 84.81 73.44 84.20 73.42 83.59 73.41 83.00 73.40 82.41 73.41 81.80 73.42 81.19 73.44 80.57 73.46 79.96 73.48 79.35 73.48 78.75 73.48 78.17 73.45 77.61 73.40 77.07 73.32 76.55 73.21 76.05 73.06 75.58 72.86 75.14 72.60 74.73 72.26 74.36 71.84 74.04 71.33 73.79 70.71 73.63 69.99 73.56 69.17 73.61 68.26 73.78 67.26 74.07 66.17"
              fill="#000"
              stroke="#000"
              strokeWidth="8.5"
            />
          </mask>
        </defs>
        <path d="M6 8 C 14 22, 28 28, 50 28 C 72 28, 86 22, 94 8 C 91 21, 83 34, 72 42 H 28 C 17 34, 9 21, 6 8 Z" />
        <path d="M13 21 C 23 29, 35 33, 50 33 C 65 33, 77 29, 87 21" strokeWidth="2.4" />
        <path d="M30 42 V60 H66 V42" />
        <path d="M30 51 H66" strokeWidth="2.4" />
        <path d="M36 44 V49 M42 44 V49 M48 44 V49 M54 44 V49 M60 44 V49" strokeWidth="1.8" />
        <g mask={`url(#${id}-horns)`}>
          <path d="M33 60 V86 M44 60 V86 M52 60 V86 M63 60 V86" />
          <path d="M83 34 V86" />
        </g>
        <path d="M33 72 H63" strokeWidth="2.4" />
        <polygon
          points="74.50 46.00 74.05 47.16 73.69 48.24 73.41 49.23 73.22 50.15 73.11 51.01 73.08 51.82 73.13 52.59 73.27 53.33 73.50 54.03 73.81 54.70 74.21 55.33 74.70 55.92 75.25 56.45 75.85 56.92 76.51 57.34 77.20 57.71 77.92 58.03 78.65 58.30 79.40 58.52 80.14 58.70 80.88 58.83 81.61 58.93 82.32 58.98 83.00 59.00 83.68 58.98 84.39 58.93 85.12 58.83 85.86 58.70 86.60 58.52 87.35 58.30 88.08 58.03 88.80 57.71 89.49 57.34 90.15 56.92 90.75 56.45 91.30 55.92 91.79 55.33 92.19 54.70 92.50 54.03 92.73 53.33 92.87 52.59 92.92 51.82 92.89 51.01 92.78 50.15 92.59 49.23 92.31 48.24 91.95 47.16 91.50 46.00 91.93 47.17 92.22 48.26 92.39 49.26 92.44 50.17 92.37 50.99 92.21 51.71 91.96 52.33 91.64 52.84 91.27 53.26 90.86 53.60 90.42 53.86 89.95 54.06 89.45 54.21 88.93 54.32 88.39 54.40 87.83 54.45 87.25 54.48 86.65 54.48 86.04 54.48 85.43 54.46 84.81 54.44 84.20 54.42 83.59 54.41 83.00 54.40 82.41 54.41 81.80 54.42 81.19 54.44 80.57 54.46 79.96 54.48 79.35 54.48 78.75 54.48 78.17 54.45 77.61 54.40 77.07 54.32 76.55 54.21 76.05 54.06 75.58 53.86 75.14 53.60 74.73 53.26 74.36 52.84 74.04 52.33 73.79 51.71 73.63 50.99 73.56 50.17 73.61 49.26 73.78 48.26 74.07 47.17"
          fill="currentColor"
          strokeWidth="1.6"
        />
        <polygon
          points="74.50 65.00 74.05 66.16 73.69 67.24 73.41 68.23 73.22 69.15 73.11 70.01 73.08 70.82 73.13 71.59 73.27 72.33 73.50 73.03 73.81 73.70 74.21 74.33 74.70 74.92 75.25 75.45 75.85 75.92 76.51 76.34 77.20 76.71 77.92 77.03 78.65 77.30 79.40 77.52 80.14 77.70 80.88 77.83 81.61 77.93 82.32 77.98 83.00 78.00 83.68 77.98 84.39 77.93 85.12 77.83 85.86 77.70 86.60 77.52 87.35 77.30 88.08 77.03 88.80 76.71 89.49 76.34 90.15 75.92 90.75 75.45 91.30 74.92 91.79 74.33 92.19 73.70 92.50 73.03 92.73 72.33 92.87 71.59 92.92 70.82 92.89 70.01 92.78 69.15 92.59 68.23 92.31 67.24 91.95 66.16 91.50 65.00 91.93 66.17 92.22 67.26 92.39 68.26 92.44 69.17 92.37 69.99 92.21 70.71 91.96 71.33 91.64 71.84 91.27 72.26 90.86 72.60 90.42 72.86 89.95 73.06 89.45 73.21 88.93 73.32 88.39 73.40 87.83 73.45 87.25 73.48 86.65 73.48 86.04 73.48 85.43 73.46 84.81 73.44 84.20 73.42 83.59 73.41 83.00 73.40 82.41 73.41 81.80 73.42 81.19 73.44 80.57 73.46 79.96 73.48 79.35 73.48 78.75 73.48 78.17 73.45 77.61 73.40 77.07 73.32 76.55 73.21 76.05 73.06 75.58 72.86 75.14 72.60 74.73 72.26 74.36 71.84 74.04 71.33 73.79 70.71 73.63 69.99 73.56 69.17 73.61 68.26 73.78 67.26 74.07 66.17"
          fill="currentColor"
          strokeWidth="1.6"
        />
        <path d="M4 86 H96" />
        <path d="M12 92 H40 M60 92 H88" strokeWidth="2.4" />
      </>
    ),
  },
  // The pinisi is the Bugis-Makassar two-masted schooner built at Tana Beru, Bulukumba, South Sulawesi; UNESCO inscribed the 'Pinisi, art of boatbuilding in South Sulawesi' on its Intangible Cultural Heritage list in 2017.
  'south-sulawesi-pinisi': {
    subject: 'Pinisi schooner',
    scopes: ['region:ID:South Sulawesi'],
    ink: [0.8, 4.3, 98.4, 88.8],
    draw: (_id) => (
      <>
        <path d="M7 51 H 13 C 26 60, 52 64, 80 59 C 78 68, 72 76, 63 79 H 27 C 18 76, 12 67, 10 58 Z" />
        <path d="M11 61 C 27 68, 55 70, 77 66" strokeWidth="2.4" />
        <path d="M78 60 L 94 52" strokeWidth="2.4" />
        <path d="M32 59 V6 M54 62 V10" />
        <path d="M31 20 L 16 11 L 16 47 L 31 51 Z" strokeWidth="2.4" />
        <path d="M53 24 L 39 16 L 39 52 L 53 54 Z" strokeWidth="2.4" />
        <path d="M57 10 L 93 50 L 87 52.5 Z" strokeWidth="2.4" />
        <path d="M57 22 L 82 52 L 75 54 Z" strokeWidth="2.4" />
        <path d="M57 34 L 71 54 L 64 55 Z" strokeWidth="2.4" />
        <path
          d="M2 84 C 8 81, 12 87, 18 84 S 28 81, 34 84 S 44 87, 50 84 S 60 81, 66 84 S 76 87, 82 84 S 92 81, 98 84"
          strokeWidth="2.4"
        />
        <path
          d="M14 91 C 19 88, 23 94, 28 91 S 37 88, 42 91 M58 91 C 63 88, 67 94, 72 91 S 81 88, 86 91"
          strokeWidth="2.4"
        />
      </>
    ),
  },
  // The Komodo dragon lives wild only in Komodo National Park (Komodo, Rinca, Padar and nearby islands, West Manggarai Regency, East Nusa Tenggara) and on Flores; it is one of Indonesia's national animals and a UNESCO World Heritage park emblem.
  komodo: {
    subject: 'Komodo dragon',
    scopes: ['region:ID:East Nusa Tenggara', 'country:ID'],
    ink: [2.8, 8.8, 94.4, 79.4],
    draw: (id) => (
      <>
        <defs>
          <mask id={`${id}-cut`}>
            <rect width="100" height="100" fill="#fff" />
            <path
              d="M 5.0 81.76 C 16.0 80.64 26.0 71.68 33.0 60.48 C 36.0 56.0 39.0 53.76 43.0 52.64 L 47.0 71.12 C 41.0 70.56 36.0 73.36 30.0 77.28 C 22.0 81.76 12.0 82.88 5.0 81.76 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="8"
            />
          </mask>
        </defs>
        <path d="M20 87 C 21 70, 21 50, 19 30" strokeWidth="2.4" mask={`url(#${id}-cut)`} />
        <path
          d="M19 30 C 13 22, 8 22, 5 24 M19 30 C 14 17, 18 12, 21 10 M19 30 C 24 18, 31 16, 35 18 M19 30 C 26 26, 31 28, 33 31 M19 30 C 12 28, 8 31, 7 34"
          strokeWidth="2.4"
        />
        <path d="M 5.0 81.76 C 16.0 80.64 26.0 71.68 33.0 60.48 C 36.0 56.0 39.0 53.76 43.0 52.64 C 51.0 49.28 60.0 49.28 67.0 51.52 C 71.0 51.52 74.0 49.28 79.0 48.72 C 85.0 48.16 90.0 49.84 92.0 52.64 C 93.5 54.88 92.5 57.68 90.0 58.24 C 86.0 59.36 82.0 59.36 78.0 61.04 C 75.5 64.96 72.0 67.76 67.0 68.88 C 61.0 71.12 53.0 71.68 47.0 71.12 C 41.0 70.56 36.0 73.36 30.0 77.28 C 22.0 81.76 12.0 82.88 5.0 81.76 Z" />
        <path d="M 68.0 68.88 C 71.0 72.24 70.0 76.16 71.0 79.52 C 71.5 81.76 73.5 83.44 77.0 84.0 H 65.0 C 64.0 80.64 61.5 78.4 59.0 75.6 C 57.5 73.92 58.0 72.24 59.5 71.12" />
        <path d="M 48.0 71.12 C 52.0 72.24 55.0 75.04 54.0 77.84 C 53.0 80.08 51.0 82.32 55.0 84.0 H 43.0 C 43.0 80.64 42.0 77.84 39.5 73.92" />
        <path
          d="M 56.0 71.68 C 54.5 75.6 55.0 79.52 56.0 84.0 M 33.0 75.6 C 32.5 78.96 32.0 81.2 34.0 84.0"
          strokeWidth="2.4"
        />
        <path d="M 77.0 84.0 L 80.0 82.32 M 55.0 84.0 L 58.0 82.32" strokeWidth="2.4" />
        <path d="M 92.0 56.56 C 88.0 57.12 84.0 56.56 80.0 55.44" strokeWidth="1.8" />
        <path
          d="M 92.5 54.88 L 94.5 56.56 M 94.5 56.56 L 96.0 54.32 M 94.5 56.56 L 96.0 59.36"
          strokeWidth="2.4"
        />
        <circle cx="83.0" cy="52.08" r="1.9" fill="currentColor" stroke="none" />
        <path d="M4 87 H96" strokeWidth="2.4" />
      </>
    ),
  },
  // Rafflesia arnoldii is one of Indonesia's three national flowers, named puspa langka (the rare flower) by Presidential Decree No. 4 of 1993; it grows in the rainforests of Sumatra (Bengkulu) and Borneo.
  rafflesia: {
    subject: 'Rafflesia',
    scopes: ['country:ID'],
    ink: [8, 8.7, 84, 81.6],
    draw: (_id) => (
      <>
        <path d="M37.07 34.20 C 25.89 2.57, 74.11 2.57, 62.93 34.20 C 89.56 13.79, 104.46 59.65, 70.92 58.80 C 98.56 77.82, 59.55 106.16, 50.00 74.00 C 40.45 106.16, 1.44 77.82, 29.08 58.80 C -4.46 59.65, 10.44 13.79, 37.07 34.20 Z" />
        <circle cx="50" cy="52" r="19" />
        <circle cx="50" cy="52" r="11" strokeWidth="2.4" />
        <circle cx="50.00" cy="18.50" r="2.4" fill="currentColor" stroke="none" />
        <circle cx="43.40" cy="25.20" r="2" fill="currentColor" stroke="none" />
        <circle cx="57.00" cy="24.60" r="1.8" fill="currentColor" stroke="none" />
        <circle cx="81.86" cy="41.65" r="2.4" fill="currentColor" stroke="none" />
        <circle cx="73.45" cy="37.44" r="2" fill="currentColor" stroke="none" />
        <circle cx="78.22" cy="50.19" r="1.8" fill="currentColor" stroke="none" />
        <circle cx="69.69" cy="79.10" r="2.4" fill="currentColor" stroke="none" />
        <circle cx="71.09" cy="69.80" r="2" fill="currentColor" stroke="none" />
        <circle cx="60.44" cy="78.28" r="1.8" fill="currentColor" stroke="none" />
        <circle cx="30.31" cy="79.10" r="2.4" fill="currentColor" stroke="none" />
        <circle cx="39.59" cy="77.56" r="2" fill="currentColor" stroke="none" />
        <circle cx="28.23" cy="70.05" r="1.8" fill="currentColor" stroke="none" />
        <circle cx="18.14" cy="41.65" r="2.4" fill="currentColor" stroke="none" />
        <circle cx="22.47" cy="50.00" r="2" fill="currentColor" stroke="none" />
        <circle cx="26.10" cy="36.88" r="1.8" fill="currentColor" stroke="none" />
        <path
          d="M48.40 47.00 a 1.6 1.6 0 1 0 3.2 0 a 1.6 1.6 0 1 0 -3.2 0 Z M53.16 50.45 a 1.6 1.6 0 1 0 3.2 0 a 1.6 1.6 0 1 0 -3.2 0 Z M51.34 56.05 a 1.6 1.6 0 1 0 3.2 0 a 1.6 1.6 0 1 0 -3.2 0 Z M45.46 56.05 a 1.6 1.6 0 1 0 3.2 0 a 1.6 1.6 0 1 0 -3.2 0 Z M43.64 50.45 a 1.6 1.6 0 1 0 3.2 0 a 1.6 1.6 0 1 0 -3.2 0 Z"
          fill="currentColor"
          stroke="none"
        />
      </>
    ),
  },
  // The American bison was made the national mammal of the United States by the National Bison Legacy Act, signed 9 May 2016.
  'us-bison': {
    subject: 'Bison on the prairie',
    scopes: ['country:US'],
    ink: [0.3, 12.1, 99.4, 80.1],
    draw: (_id) => (
      <>
        <path d="M13 65 C 10.5 60, 11.5 52, 14.5 46 C 16.5 41, 20.5 37, 26 37 C 28.5 37, 30.5 37.5, 32 36.5 C 33.5 26, 37 16, 45 14 C 54 12.5, 60 25, 68 32 C 75 38, 84 38, 87.5 44 C 90 50, 89 57, 86 61 L 85.5 84 H 80 L 79 68.5 C 70 69.5, 60 68.5, 52 66 L 51 84 H 45 L 43.5 71.5 C 40 73, 37 74.5, 34 74.5 C 31.5 75.5, 29.5 77, 27 78 C 25 75.5, 23 72.5, 21.5 69.5 C 18 70.5, 14.5 69, 13 65 Z" />
        <path d="M24.5 38 C 21.5 36, 21.5 31.5, 24.5 29" />
        <circle cx="19.5" cy="50" r="2" fill="currentColor" stroke="none" />
        <path d="M31 38.5 C 33.5 48, 33 58, 29.5 68" strokeWidth="2.4" />
        <path d="M59 22.5 C 55 36, 54.5 52, 56 66.5" strokeWidth="2.4" />
        <path d="M37.5 74 V84" strokeWidth="2.4" />
        <path d="M73 69.2 V84" strokeWidth="2.4" />
        <path d="M88 46 C 93.5 48.5, 94.5 54, 93 60.5" strokeWidth="2.4" />
        <path
          d="M39 29 L 43 26 M38 42 L 42 39 M46 36 L 50 33 M38 55 L 42 52 M46 49 L 50 46"
          strokeWidth="1.8"
        />
        <path d="M2 84 H98" />
        <path
          d="M66 84 C 65 81, 62.5 79, 60 78.5 M66 84 C 67 80.5, 69.5 79, 72 78.5"
          strokeWidth="2.4"
        />
        <path d="M18 91 H42 M58 91 H82" strokeWidth="2.4" />
      </>
    ),
  },
  // The Saturn V was developed at NASA's Marshall Space Flight Center on Redstone Arsenal, Huntsville, Alabama, and a full-size Saturn V stands upright at the U.S. Space & Rocket Center there (One Tranquility Base, Huntsville).
  'alabama-saturn-v': {
    subject: 'Saturn V rocket, Huntsville',
    scopes: ['city:us-alabama-huntsville'],
    ink: [2.3, 4.4, 95.4, 90.8],
    draw: (_id) => (
      <>
        <path d="M48.6 10.5 V7.6 L50 5.2 L51.4 7.6 V10.5 Z" fill="currentColor" strokeWidth="1.6" />
        <path d="M48.8 13.8 L50 10.5 L51.2 13.8" strokeWidth="1.8" />
        <path d="M45 19 L50 13.8 L55 19 Z" />
        <path d="M45 19 V24 L43.5 30 V40 L40 44 V84 M55 19 V24 L56.5 30 V40 L60 44 V84" />
        <path d="M45 24 H55 M43.5 30 H56.5 M40 44 H60 M40 58 H60" strokeWidth="2.4" />
        <rect x="43.5" y="30" width="6.5" height="6" fill="currentColor" stroke="none" />
        <rect x="50" y="44" width="10" height="5" fill="currentColor" stroke="none" />
        <rect x="40" y="58" width="10" height="6" fill="currentColor" stroke="none" />
        <rect x="50" y="68" width="10" height="12" fill="currentColor" stroke="none" />
        <path d="M40 84 H60" />
        <path d="M40 72 L30 81 V88 H40 V84 M60 72 L70 81 V88 H60 V84" />
        <path d="M47 84 H53 L54 88 H46 Z" fill="currentColor" strokeWidth="1.6" />
        <path d="M4 88 H96" />
        <path d="M14 94 H36 M64 94 H86" strokeWidth="2.4" />
      </>
    ),
  },
  // Denali (6,190 m), North America's highest peak, stands in Denali National Park and Preserve in interior Alaska.
  'alaska-denali': {
    subject: 'Denali',
    scopes: ['region:US:Alaska'],
    ink: [0.3, 9.6, 99.4, 82.6],
    draw: (_id) => (
      <>
        <path d="M7 73.2 L13 63.5 L17 65 L23 53 L28 55 C 31 42, 35 26, 39.5 14 C 41.5 10.5, 45 10.5, 47 13.5 L52 23 C 54 26.5, 57 26.5, 59 23.5 L63 19.5 C 65 17.5, 67 17.5, 69 20 C 71 23, 72.5 25.5, 74 27.5 L78 26.5 L83 37 L86.5 36 C 88 50, 89.5 63, 93 71.8" />
        <path d="M4 75 C 16 67, 32 67, 48 72 C 62 67, 80 66, 96 73" strokeWidth="2.4" />
        <path
          d="M33.5 60 C 35.5 52, 37.5 43, 40 35 L42.5 39 L45 25.5 L48 31 L51 31 L55 41 L59.5 33 L64 29.5 L67 35 L71 34 L74 43 L77 40 C 79 42, 80 45, 80.5 50"
          strokeWidth="2.4"
        />
        <path d="M42 48 L40.5 56" strokeWidth="1.8" />
        <path d="M48 45 L46.5 52" strokeWidth="1.8" />
        <path d="M66 44 L64.5 51" strokeWidth="1.8" />
        <path d="M78 55 L76.5 62" strokeWidth="1.8" />
        <path d="M2 84 H98" />
        <path d="M16 91 H40" strokeWidth="2.4" />
        <path d="M60 91 H84" strokeWidth="2.4" />
      </>
    ),
  },
  // The saguaro (Carnegiea gigantea) grows only in the Sonoran Desert, mostly in southern Arizona (Saguaro National Park, Tucson), and its blossom has been Arizona's state flower since 1931.
  'arizona-saguaro': {
    subject: 'Saguaro',
    scopes: ['region:US:Arizona'],
    ink: [2.3, 4.7, 95.4, 88.5],
    draw: (_id) => (
      <>
        <path d="M41 86 V63 C 30 63, 23 60, 23 51 V34 C 23 27.5, 34 27.5, 34 34 V50 C 34 53, 37 55, 41 55 V22 C 41 11, 59 11, 59 22 V61 C 63 61, 66 60, 66 56 V43 C 66 36.5, 77 36.5, 77 43 V58 C 77 66, 70 69, 59 69 V86" />
        <path d="M47 16 V84 M53 16 V84" strokeWidth="1.8" />
        <path d="M28.5 33 V55" strokeWidth="1.8" />
        <path d="M71.5 42 V62" strokeWidth="1.8" />
        <circle cx="44" cy="8.5" r="1.8" fill="currentColor" stroke="none" />
        <circle cx="50" cy="6.5" r="1.8" fill="currentColor" stroke="none" />
        <circle cx="56" cy="8.5" r="1.8" fill="currentColor" stroke="none" />
        <circle cx="80" cy="18" r="7" strokeWidth="2.4" />
        <path d="M4 86 H96" />
        <path d="M10 81 C 14 75, 20 75, 24 81 M76 81 C 80 76, 86 76, 90 81" strokeWidth="2.4" />
        <path d="M16 92 H40 M60 92 H84" strokeWidth="2.4" />
      </>
    ),
  },
  // The Old Mill (1933, Dionicio Rodriguez's faux-bois concrete) stands in T.R. Pugh Memorial Park, Lakeshore Drive, North Little Rock, Pulaski County, Arkansas, and is the state's best-known postcard view (the opening of Gone with the Wind).
  'arkansas-old-mill': {
    subject: 'The Old Mill, North Little Rock',
    scopes: ['city:us-arkansas-north-little-rock', 'city:us-arkansas-little-rock'],
    ink: [0.3, 24.3, 99.4, 68.2],
    draw: (id) => (
      <>
        <defs>
          <mask id={`${id}-wheel`}>
            <rect width="100" height="100" fill="#fff" stroke="none" />
            <circle cx="76" cy="65" r="20.5" fill="#000" stroke="none" />
          </mask>
          <mask id={`${id}-water`}>
            <rect width="100" height="80.5" fill="#fff" stroke="none" />
          </mask>
        </defs>
        <g mask={`url(#${id}-wheel)`}>
          <path d="M26.5 82 L28 72 L28.5 62 L30.5 41.5 M59.5 41.5 L60.5 56 L61.5 68 L63.5 82" />
          <path d="M19 53 L45 26 L71 53" />
          <path
            d="M28 76 H40 M51.5 76 H63 M28.5 70 H35 M38.5 70 H50 M53.5 70 H62"
            strokeWidth="2.4"
          />
          <path d="M34 76 V70 M58 76 V70 M44 70 V66" strokeWidth="1.8" />
        </g>
        <path
          d="M41.5 40 Q45 36 48.5 39.5 L48 44.5 L41.5 44.5 Z"
          fill="currentColor"
          stroke="none"
        />
        <path d="M34 51 L39.5 50.5 L39.5 57.5 L34.5 57.5 Z" fill="currentColor" stroke="none" />
        <path d="M50 54 L55 54.5 L54.5 61 L50 61 Z" fill="currentColor" stroke="none" />
        <path d="M43 82 V78 Q46.5 74.5 50 77.5 V82 Z" fill="currentColor" stroke="none" />
        <g mask={`url(#${id}-water)`}>
          <circle cx="76" cy="65" r="17" />
          <circle cx="76" cy="65" r="10.5" strokeWidth="2.4" />
          <path
            d="M76 48 V54.5 M84.5 50.3 L81.3 55.9 M90.7 56.5 L85.1 59.8 M93 65 H86.5 M90.7 73.5 L85.1 70.3 M84.5 79.7 L81.3 74.1 M76 82 V75.5 M67.5 79.7 L70.8 74.1 M61.3 73.5 L66.9 70.3 M59 65 H65.5 M61.3 56.5 L66.9 59.8 M67.5 50.3 L70.8 55.9"
            strokeWidth="1.8"
          />
          <path d="M76 55 V75 M67.3 60 L84.7 70 M67.3 70 L84.7 60" strokeWidth="1.8" />
        </g>
        <circle cx="76" cy="65" r="2.6" fill="currentColor" stroke="none" />
        <path d="M7 82 C 11 73, 19 73, 23 82" />
        <path d="M6 73 C 11 68.5, 18 68, 24 72" strokeWidth="2.4" />
        <path
          d="M9.5 71.5 L10.5 76.5 M15.5 69 L15 74 L16.5 76 M20.5 69.5 L21.5 75.5 M12.5 69.5 L11.5 67.5 M18.5 68.5 L19.5 66.5"
          strokeWidth="1.8"
        />
        <path d="M2 82 H98" />
        <path
          d="M8 89 C 12 86, 16 92, 20 89 S 28 86, 32 89 S 40 92, 44 89 M56 89 C 60 86, 64 92, 68 89 S 76 86, 80 89 S 88 92, 92 89"
          strokeWidth="2.4"
        />
      </>
    ),
  },
  // The Maroon Bells (Maroon Peak and North Maroon Peak) rise above Maroon Lake in the White River National Forest, Pitkin County, Colorado, about 12 miles west of Aspen. They are among the most photographed mountains in North America.
  'colorado-maroon-bells': {
    subject: 'Maroon Bells',
    scopes: ['region:US:Colorado'],
    ink: [0.3, 10.3, 99.4, 73.9],
    draw: (id) => (
      <>
        <defs>
          <mask id={`${id}-trees`}>
            <rect width="100" height="100" fill="#fff" />
            <path
              d="M13 38 L5 64 H21 Z M87 40 L79.5 64 H94.5 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="7"
            />
          </mask>
        </defs>
        <g mask={`url(#${id}-trees)`}>
          <path d="M4 64 L18 47 L29 30 L38 12 L45 22 L50 28 L55 21 L62 13 L71 30 L82 47 L96 63" />
          <path d="M34 25 L38 23 L42 24 M57 24 L61 22 L66 24" strokeWidth="2.4" />
          <path d="M28 36 L34 33 L40 34 L45 32 M54 33 L60 31 L66 33 L71 32" strokeWidth="2.4" />
          <path d="M20 49 L28 44 L36 45 L44 42 L52 43 L60 41 L68 43 L78 46" strokeWidth="2.4" />
          <path d="M24 57 L32 53 L42 54 L50 52 L58 54 L66 52 L74 55" strokeWidth="2.4" />
          <path d="M50 28 L49 37" strokeWidth="1.8" />
        </g>
        <path d="M13 38 L10 45 H12 L7.5 53 H10 L5 61 H21 L16 53 H18.5 L14 45 H16 Z" />
        <path d="M87 40 L84 47 H86 L82 54 H84.5 L80 61 H94 L89.5 54 H92 L88 47 H90 Z" />
        <path d="M13 61 V64 M87 61 V64" />
        <path d="M2 64 H98" />
        <path d="M28 71 H72 M36 77 H64 M44 83 H56" strokeWidth="2.4" />
        <path d="M6 71 H20 M80 71 H94" strokeWidth="2.4" />
      </>
    ),
  },
  // The Charles W. Morgan (1841), the last surviving wooden whaleship and a National Historic Landmark, is berthed at Mystic Seaport Museum in Mystic, New London County, Connecticut.
  'connecticut-charles-morgan': {
    subject: 'Charles W. Morgan whaleship, Mystic',
    scopes: [
      'city:us-connecticut-mystic',
      'city:us-connecticut-groton',
      'city:us-connecticut-stonington',
    ],
    ink: [0.8, 11.3, 98.4, 77.8],
    draw: (id) => (
      <>
        <defs>
          <mask id={`${id}-hull`}>
            <rect width="100" height="100" fill="#fff" stroke="none" />
            <path
              d="M2 73 C 8 70, 12 76, 18 73 S 28 70, 34 73 S 44 76, 50 73 S 60 70, 66 73 S 76 76, 82 73 S 92 70, 98 73 V100 H2 Z"
              fill="#000"
              stroke="none"
            />
            <path
              d="M31.5 53 C 35 54.5, 43 54.5, 46.5 53 C 45 57.5, 42 59, 39 59 C 36 59, 33 57.5, 31.5 53 Z M53.5 53 C 57 54.5, 65 54.5, 68.5 53 C 67 57.5, 64 59, 61 59 C 58 59, 55 57.5, 53.5 53 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="6"
            />
          </mask>
        </defs>
        <g transform="translate(0 6)">
          <path
            d="M8 56 C 30 60, 66 60, 90 54 C 88 64, 84 71, 78 76 H11 Z"
            mask={`url(#${id}-hull)`}
          />
          <path d="M28 58 V16 M50 59 V7 M72 58 V12" mask={`url(#${id}-hull)`} />
          <path d="M89 55 L93.5 50.5" />
          <path d="M72 13 L93.5 50.5 M50 8 L72 13" strokeWidth="2.4" />
          <path
            d="M41 47 H59 M42 37 H58 M43.5 28 H56.5 M45 20 H55 M46 13 H54 M63 46 H81 M64 36 H80 M65.5 27 H78.5 M67 19 H77"
            strokeWidth="2.4"
          />
          <path d="M28 24 L13 17 M28 47 H10" strokeWidth="2.4" />
          <path
            d="M31.5 53 C 35 54.5, 43 54.5, 46.5 53 C 45 57.5, 42 59, 39 59 C 36 59, 33 57.5, 31.5 53 Z M53.5 53 C 57 54.5, 65 54.5, 68.5 53 C 67 57.5, 64 59, 61 59 C 58 59, 55 57.5, 53.5 53 Z"
            strokeWidth="2.4"
          />
          <path d="M33.5 53.5 V49 M44.5 53.5 V49 M55.5 53.5 V49 M66.5 53.5 V49" strokeWidth="1.8" />
          <rect x="16" y="63.5" width="4" height="3.6" fill="currentColor" stroke="none" />
          <rect x="23" y="63.5" width="4" height="3.6" fill="currentColor" stroke="none" />
          <rect x="30" y="63.5" width="4" height="3.6" fill="currentColor" stroke="none" />
          <rect x="37" y="63.5" width="4" height="3.6" fill="currentColor" stroke="none" />
          <rect x="44" y="63.5" width="4" height="3.6" fill="currentColor" stroke="none" />
          <rect x="51" y="63.5" width="4" height="3.6" fill="currentColor" stroke="none" />
          <rect x="58" y="63.5" width="4" height="3.6" fill="currentColor" stroke="none" />
          <rect x="65" y="63.5" width="4" height="3.6" fill="currentColor" stroke="none" />
          <rect x="72" y="63.5" width="4" height="3.6" fill="currentColor" stroke="none" />
          <path
            d="M2 73 C 8 70, 12 76, 18 73 S 28 70, 34 73 S 44 76, 50 73 S 60 70, 66 73 S 76 76, 82 73 S 92 70, 98 73"
            strokeWidth="2.4"
          />
          <path
            d="M14 81 C 19 78, 23 84, 28 81 S 37 78, 42 81 M58 81 C 63 78, 67 84, 72 81 S 81 78, 86 81"
            strokeWidth="2.4"
          />
        </g>
      </>
    ),
  },
  // The Delaware Breakwater East End Light (1885), a cast-iron sparkplug tower with its keeper's quarters built in, stands on the Delaware Breakwater off Cape Henlopen at Lewes, Sussex County, Delaware, and was conveyed to the State of Delaware in 1999.
  'delaware-breakwater-light': {
    subject: 'Breakwater East End Lighthouse, Lewes',
    scopes: ['city:us-delaware-lewes'],
    ink: [0.3, 5.6, 99.4, 85.9],
    draw: (_id) => (
      <>
        <path d="M22 80 L25 62 H75 L78 80" />
        <path d="M25 69 H75" strokeWidth="2.4" />
        <path d="M32 62 L37 31 M68 62 L63 31" />
        <path d="M34.6 46 H65.4" strokeWidth="2.4" />
        <rect x="40" y="51" width="4.5" height="6" fill="currentColor" stroke="none" />
        <rect x="55.5" y="51" width="4.5" height="6" fill="currentColor" stroke="none" />
        <rect x="47.8" y="36" width="4.4" height="6" fill="currentColor" stroke="none" />
        <path d="M32 31 H68" />
        <path d="M35 31 V25 H65 V31" strokeWidth="2.4" />
        <path d="M41 31 V25 M59 31 V25" strokeWidth="1.8" />
        <path d="M42 25 V17 H58 V25" />
        <path d="M47.5 25 V17 M52.5 25 V17" strokeWidth="1.8" />
        <path d="M40 17 L50 10 L60 17" />
        <circle cx="50" cy="7.6" r="2" fill="currentColor" stroke="none" />
        <path d="M2 80 H98" />
        <path d="M2 74.5 H21.5 M78.5 74.5 H98" strokeWidth="2.4" />
        <path d="M8 74.5 V80 M15 74.5 V80 M85 74.5 V80 M92 74.5 V80" strokeWidth="1.8" />
        <path
          d="M8 88 C 12 85, 16 91, 20 88 S 28 85, 32 88 S 40 91, 44 88 M56 88 C 60 85, 64 91, 68 88 S 76 85, 80 88 S 88 91, 92 88"
          strokeWidth="2.4"
        />
      </>
    ),
  },
  // The U.S. Capitol stands on Capitol Hill at First Street SE/NE in Washington, D.C., and is the District's most recognised landmark.
  'dc-capitol': {
    subject: 'U.S. Capitol dome',
    scopes: ['region:US:District of Columbia'],
    ink: [2.3, 5.2, 95.4, 90],
    draw: (_id) => (
      <>
        <path d="M4 88 H96" />
        <path d="M8 88 V68 H30 M70 68 H92 V88" />
        <path d="M6 68 H30 M70 68 H94" strokeWidth="2.4" />
        <path
          d="M13 85 V79 H17.4 V85 Z M21 85 V79 H25.4 V85 Z M74.6 85 V79 H79 V85 Z M82.6 85 V79 H87 V85 Z M13 76 V72.5 H17.4 V76 Z M21 76 V72.5 H25.4 V76 Z M74.6 76 V72.5 H79 V76 Z M82.6 76 V72.5 H87 V76 Z"
          fill="currentColor"
          stroke="none"
        />
        <path d="M30 88 V64 H70 V88" />
        <path d="M33 64 L50 57 L67 64" />
        <path
          d="M36.25 83 V65 M41.75 83 V65 M47.25 83 V65 M52.75 83 V65 M58.25 83 V65 M63.75 83 V65"
          strokeWidth="2.4"
        />
        <path d="M33 84 H67" />
        <path d="M30 53 H70 M30 42 H70" />
        <path d="M32 53 V42 M68 53 V42" strokeWidth="2.4" />
        <path d="M37 51 V44 M43 51 V44 M50 51 V44 M57 51 V44 M63 51 V44" strokeWidth="1.8" />
        <path d="M34 42 V36 H66 V42" strokeWidth="2.4" />
        <path d="M34 36 C 34 26, 41 20, 46 19.5 H54 C 59 20, 66 26, 66 36" />
        <path
          d="M42 36 C 42 29, 43.5 23.5, 46 20.5 M58 36 C 58 29, 56.5 23.5, 54 20.5 M50 36 V20"
          strokeWidth="1.8"
        />
        <path d="M46.5 19.5 V14 H53.5 V19.5" strokeWidth="2.4" />
        <path d="M48.5 13 L49.2 6 H50.8 L51.5 13 Z" fill="currentColor" strokeWidth="1.6" />
        <path d="M8 94 H30 M38 94 H62 M70 94 H92" strokeWidth="2.4" />
      </>
    ),
  },
  // The American alligator is Florida's official state reptile (1987), and Everglades National Park in south Florida is its best-known habitat.
  'florida-alligator': {
    subject: 'Alligator, Everglades',
    scopes: ['region:US:Florida'],
    ink: [2.3, 22.8, 95.4, 73.2],
    draw: (id) => (
      <>
        <defs>
          <mask id={`${id}-cut`}>
            <rect width="100" height="100" fill="#fff" />
            <path
              d="M6 69 C 3.6 65.6, 4.4 60.2, 8.5 59.5 C 9.5 56, 13 55.8, 14.2 59 C 18 58.5, 21 56.8, 23 53.6 C 23.5 48.2, 30.5 47.7, 31 52.5 C 35 51.4, 40 49.3, 45 47.9 Q 48 42.5, 51 46.9 Q 54 41.7, 57 46.6 Q 60 41.7, 63 46.9 Q 66 42.5, 69 47.9 C 77 50.1, 85 55.5, 93.5 63.4 C 85 62.3, 78 62.3, 69 63.6 C 58 66.3, 44 67, 34 65.6 C 26 65, 16 69, 6 69 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="7"
            />
          </mask>
        </defs>
        <g mask={`url(#${id}-cut)`}>
          <path
            d="M78 78 C 76 62, 72 48, 65 34 M80 78 C 80 60, 81 42, 84 24 M82 78 C 84 64, 88 52, 94 42"
            strokeWidth="2.4"
          />
          <path
            d="M19 78 C 17 64, 13 52, 7 42 M21 78 C 21 60, 23 46, 27 34 M23 78 C 27 68, 33 58, 40 52"
            strokeWidth="2.4"
          />
        </g>
        <path d="M6 69 C 3.6 65.6, 4.4 60.2, 8.5 59.5 C 9.5 56, 13 55.8, 14.2 59 C 18 58.5, 21 56.8, 23 53.6 C 23.5 48.2, 30.5 47.7, 31 52.5 C 35 51.4, 40 49.3, 45 47.9 Q 48 42.5, 51 46.9 Q 54 41.7, 57 46.6 Q 60 41.7, 63 46.9 Q 66 42.5, 69 47.9 C 77 50.1, 85 55.5, 93.5 63.4 C 85 62.3, 78 62.3, 69 63.6 C 58 66.3, 44 67, 34 65.6 C 26 65, 16 69, 6 69 Z" />
        <path d="M8 64.7 C 15 65, 22 63.6, 29.5 59.5" strokeWidth="2.4" />
        <circle cx="27.2" cy="53.2" r="1.9" fill="currentColor" stroke="none" />
        <path d="M39 66 L 34.5 72 L 39 78 M61 65 C 66 69, 66 73, 61.5 78" />
        <path d="M45 56.5 C 56 55, 69 54.5, 84 57.5" strokeWidth="2.4" strokeDasharray="0.1 4.5" />
        <path d="M4 78 H96" />
        <path
          d="M8 85.5 C 12 82.5, 16 88.5, 20 85.5 S 28 82.5, 32 85.5 M60 85.5 C 64 82.5, 68 88.5, 72 85.5 S 80 82.5, 84 85.5"
          strokeWidth="2.4"
        />
        <path
          d="M24 92.5 C 28 89.5, 32 95.5, 36 92.5 S 44 89.5, 48 92.5 S 56 95.5, 60 92.5 S 68 89.5, 72 92.5"
          strokeWidth="2.4"
        />
      </>
    ),
  },
  // Georgia is nicknamed 'the Peach State', and the peach is its official state fruit (1995).
  'georgia-peach': {
    subject: 'Peach',
    scopes: ['region:US:Georgia'],
    ink: [2.3, 8.6, 95.4, 83.1],
    draw: (id) => (
      <>
        <defs>
          <mask id={`${id}-cut`}>
            <rect width="100" height="100" fill="#fff" />
            <circle cx="66" cy="66" r="21" fill="#000" stroke="#000" strokeWidth="7" />
          </mask>
        </defs>
        <g mask={`url(#${id}-cut)`}>
          <path d="M38 27 C 30 21, 12 25, 12 48 C 12 66, 25 75, 38 75 C 52 75, 64 64, 64 48 C 64 26, 46 21, 38 27 Z" />
          <path d="M38 27 C 29 35, 27 52, 32 71" strokeWidth="2.4" />
        </g>
        <path d="M38 27 C 38 23, 39 20, 41 17" />
        <path
          d="M41 17 C 46 10, 56 8, 63 10.5 C 58 17.5, 48 20, 41 17 Z"
          fill="currentColor"
          strokeWidth="1.6"
        />
        <path
          d="M39.5 19 C 34 12.5, 25 10.5, 18 12.5 C 23 19, 32 21.5, 39.5 19 Z"
          strokeWidth="2.4"
        />
        <path d="M37 18 C 31 16.5, 26 15, 22 13.5" strokeWidth="1.6" />
        <circle cx="66" cy="66" r="21" />
        <path d="M66 49 C 77.5 53.5, 80 71, 66 83 C 52 71, 54.5 53.5, 66 49 Z" strokeWidth="2.4" />
        <path
          d="M66 55.5 C 72.5 59, 73.5 70, 66 77.5 C 58.5 70, 59.5 59, 66 55.5 Z"
          fill="currentColor"
          strokeWidth="1.6"
        />
        <path d="M4 90 H96" />
      </>
    ),
  },
  // Diamond Head (Lēʻahi) is a tuff cone on the southeast edge of Waikīkī in Honolulu, Oʻahu, protected as Diamond Head State Monument.
  'hawaii-diamond-head': {
    subject: 'Diamond Head',
    scopes: ['region:US:Hawaii'],
    ink: [2.3, 21.3, 95.4, 70.4],
    draw: (id) => (
      <>
        <defs>
          <mask id={`${id}-cut`}>
            <rect width="100" height="100" fill="#fff" />
            <path
              d="M12 90 C 15 74, 16 56, 14 36 M14 36 C 9.5 31.5, 7 33, 6 38 M14 36 C 10 28.5, 7.5 27, 6 28 M14 36 C 13.5 29, 16.5 24.5, 21.5 23 M14 36 C 18.5 30, 24 29, 28.5 31.5 M14 36 C 20 35, 24.5 37.5, 26.5 42.5"
              stroke="#000"
              strokeWidth="10"
            />
          </mask>
        </defs>
        <g mask={`url(#${id}-cut)`}>
          <path d="M 6 68 C 14 64.34 23 55.8 30 49.7 C 34 46.04 38 42.99 42 41.77 C 47 40.55 50 39.33 54 39.7 C 58 39.94 61 37.5 64 35.06 C 67 32.62 69 27.13 72 25.3 C 74 24.32 75.6 25.91 77 28.96 C 81 38.72 86 53.36 94 68" />
          <path d="M4 68 H96" strokeWidth="2.4" />
        </g>
        <path
          d="M56 46 L56.5 56 M62 43.6 L63 55 M68 37.5 L69.5 53 M74 32.6 L76.5 51 M80 41.2 L83 55"
          strokeWidth="2.4"
        />
        <path d="M32 54 L31 59 M38 50.5 L37 57 M44 48 L43.5 56 M50 46.5 V56" strokeWidth="1.8" />
        <path d="M12 90 C 15 74, 16 56, 14 36 M14 36 C 9.5 31.5, 7 33, 6 38 M14 36 C 10 28.5, 7.5 27, 6 28 M14 36 C 13.5 29, 16.5 24.5, 21.5 23 M14 36 C 18.5 30, 24 29, 28.5 31.5 M14 36 C 20 35, 24.5 37.5, 26.5 42.5" />
        <path
          d="M16.2 78 L 13.7 79 M16.4 67 L 13.9 68 M16.2 56 L 13.7 57 M15.4 45 L 12.9 46"
          strokeWidth="1.8"
        />
        <path
          d="M32 76 C 36 73, 40 79, 44 76 S 52 73, 56 76 S 64 79, 68 76 S 76 73, 80 76 S 88 79, 92 76"
          strokeWidth="2.4"
        />
        <path d="M28 83 H42 M50 83 H64 M72 83 H86" strokeWidth="2.4" />
        <path d="M4 90 H96" />
      </>
    ),
  },
  // Shoshone Falls is on the Snake River about 5 miles east of Twin Falls, in Twin Falls County, Idaho.
  'idaho-shoshone-falls': {
    subject: 'Shoshone Falls',
    scopes: ['region:US:Idaho'],
    ink: [0.3, 18.3, 99.4, 74.2],
    draw: (_id) => (
      <>
        <path d="M2 20 H13 L18 27 L20 36 L18 50 L21 62 L18 74" />
        <path d="M98 20 H87 L82 27 L80 36 L82 50 L79 62 L82 74" />
        <path d="M2 32 H13 M5 44 H13 M2 56 H13.5 M8 68 H13" strokeWidth="2.4" />
        <path d="M98 32 H87 M95 44 H87 M98 56 H86.5 M92 68 H87" strokeWidth="2.4" />
        <path d="M20 36 C 36 43, 64 43, 80 36" />
        <path d="M33.5 39.9 L35.5 35 L38.5 33 L41 35.5 L42 40.9 M58 40.9 L59 35.5 L61.5 33 L64.5 35 L66.5 39.9" />
        <path d="M24 26 C 40 27.5, 60 27.5, 76 26" strokeWidth="2.4" strokeDasharray="0.1 4.5" />
        <path
          d="M25.5 38 V55 M31.5 39.5 V62 M44 41.1 V65 M50 41.3 V60 M56 41.1 V66 M68.5 39.5 V61 M74.5 38 V55"
          strokeWidth="2.4"
        />
        <path
          d="M27 77 C 25 72, 31 68, 35 71 C 37 66, 46 66, 49 70 C 52 66, 63 66, 65 71 C 69 68, 75 72, 73 77"
          strokeWidth="2.4"
          strokeDasharray="0.1 4.5"
        />
        <path d="M2 82 H98" />
        <path
          d="M10 89 C 14 86, 18 92, 22 89 S 30 86, 34 89 S 42 92, 46 89 M54 89 C 58 86, 62 92, 66 89 S 74 86, 78 89 S 86 92, 90 89"
          strokeWidth="2.4"
        />
      </>
    ),
  },
  // The Chicago Water Tower stands at 806 N Michigan Avenue in Chicago, Cook County, Illinois.
  'illinois-water-tower': {
    subject: 'Chicago Water Tower',
    scopes: ['city:us-illinois-chicago'],
    ink: [2.3, 5.8, 95.4, 89.4],
    draw: (_id) => (
      <>
        <path d="M4 88 H96" />
        <path d="M31 88 V68 H69 V88" />
        <path d="M22 88 V56 M31 68 V56 M69 68 V56 M78 88 V56" />
        <path d="M20.5 56 H32.5 M67.5 56 H79.5" strokeWidth="2.4" />
        <path d="M23.5 56 L26.5 46 L29.5 56 M70.5 56 L73.5 46 L76.5 56" strokeWidth="2.4" />
        <path d="M31 64.5 H36 V68 M69 64.5 H64 V68" strokeWidth="2.4" />
        <path d="M42 68 V32 H58 V68" />
        <path d="M35 32 H65" />
        <path
          d="M37 32 V27 M63 32 V27 M35.5 27 L37 21 L38.5 27 M61.5 27 L63 21 L64.5 27"
          strokeWidth="2.4"
        />
        <path d="M43.5 32 V16 M56.5 32 V16" />
        <path d="M42.5 16 H57.5" strokeWidth="2.4" />
        <path d="M46.5 16 L50 7.5 L53.5 16" />
        <path
          d="M48.25 27 V22.25 A1.75 1.75 0 0 1 51.75 22.25 V27 Z"
          fill="currentColor"
          stroke="none"
        />
        <path d="M44.5 88 V80 A5.5 5.5 0 0 1 55.5 80 V88 Z" fill="currentColor" stroke="none" />
        <path d="M48 60 V53 A2 2 0 0 1 52 53 V60 Z" fill="currentColor" stroke="none" />
        <path d="M48 46 V39 A2 2 0 0 1 52 39 V46 Z" fill="currentColor" stroke="none" />
        <path
          d="M36.5 82 V75 A2.25 2.25 0 0 1 41 75 V82 Z M59 82 V75 A2.25 2.25 0 0 1 63.5 75 V82 Z"
          fill="currentColor"
          stroke="none"
        />
        <path d="M8 94 H30 M38 94 H62 M70 94 H92" strokeWidth="2.4" />
      </>
    ),
  },
  // Parke County, Indiana has 31 historic covered bridges, most built with Burr arch trusses, and calls itself the Covered Bridge Capital of the World.
  'indiana-covered-bridge': {
    subject: 'Covered bridge, Parke County',
    scopes: ['region:US:Indiana'],
    ink: [0.3, 27.3, 99.4, 67.4],
    draw: (id) => (
      <>
        <defs>
          <mask id={`${id}-arch`}>
            <rect width="100" height="100" fill="#fff" />
            <path d="M12 61 C 26 34, 74 34, 88 61" stroke="#000" strokeWidth="10" />
          </mask>
        </defs>
        <path d="M5 38 L12 29 H88 L95 38 Z" />
        <path d="M10 38 V62 H90 V38" />
        <path
          d="M16 41 V59 M21 41 V59 M26 41 V59 M31 41 V59 M36 41 V59 M41 41 V59 M46 41 V59 M51 41 V59 M56 41 V59 M61 41 V59 M66 41 V59 M71 41 V59 M76 41 V59 M81 41 V59 M86 41 V59"
          strokeWidth="1.6"
          mask={`url(#${id}-arch)`}
        />
        <path d="M12 61 C 26 34, 74 34, 88 61" />
        <path d="M2 62 H10 M90 62 H98" />
        <path d="M15 62 V80 M85 62 V80" />
        <path d="M2 80 H15 M85 80 H98" strokeWidth="2.4" />
        <path d="M4 71 H11 M89 71 H96" strokeWidth="1.8" />
        <path
          d="M20 85 C 24 83, 28 87, 32 85 S 40 83, 44 85 S 52 87, 56 85 S 64 83, 68 85 S 76 87, 80 85"
          strokeWidth="2.4"
        />
        <path
          d="M30 92 C 34 90, 38 94, 42 92 S 50 90, 54 92 S 62 94, 66 92 S 70 91, 71 91.5"
          strokeWidth="2.4"
        />
      </>
    ),
  },
  // The American Gothic House, the Carpenter Gothic house Grant Wood painted behind American Gothic (1930), is at 300 American Gothic Street in Eldon, Wapello County, Iowa.
  'iowa-american-gothic-house': {
    subject: 'American Gothic House, Eldon',
    scopes: ['region:US:Iowa'],
    ink: [2.3, 10.3, 95.4, 84.9],
    draw: (_id) => (
      <>
        <path d="M4 88 H96" />
        <path d="M18 52 L50 12 L82 52" />
        <path d="M26 47 V55 M74 47 V55" />
        <path d="M41 50 V36 C41 30, 45 26, 50 21 C55 26, 59 30, 59 36 V50 Z" />
        <path d="M50 50 V28 M41 41 H59" strokeWidth="1.8" />
        <path d="M34.5 41 V48 M65.5 41 V48" strokeWidth="1.8" />
        <path d="M18 63 L24 55 H76 L82 63 Z" />
        <path d="M26 63 V88 M39 63 V88 M61 63 V88 M74 63 V88" strokeWidth="2.4" />
        <rect x="45" y="70" width="10" height="18" fill="currentColor" stroke="none" />
        <rect x="30.5" y="67" width="4" height="11" fill="currentColor" stroke="none" />
        <rect x="65.5" y="67" width="4" height="11" fill="currentColor" stroke="none" />
        <path d="M8 94 H30 M38 94 H62 M70 94 H92" strokeWidth="2.4" />
      </>
    ),
  },
  // The wild native sunflower (Helianthus annuus) has been Kansas's official state flower since 1903, and Kansas is nicknamed the Sunflower State.
  'kansas-sunflower': {
    subject: 'Sunflower',
    scopes: ['region:US:Kansas'],
    ink: [2.3, 5.3, 95.4, 84.4],
    draw: (_id) => (
      <>
        <path d="M46.6 22.4 Q 45.8 12.9, 50.0 7.0 Q 54.2 12.9, 53.4 22.4 Q 57.4 13.8, 64.0 10.8 Q 64.7 18.0, 59.2 25.8 Q 67.0 20.3, 74.2 21.0 Q 71.2 27.6, 62.6 31.6 Q 72.1 30.8, 78.0 35.0 Q 72.1 39.2, 62.6 38.4 Q 71.2 42.4, 74.2 49.0 Q 67.0 49.7, 59.2 44.2 Q 64.7 52.0, 64.0 59.2 Q 57.4 56.2, 53.4 47.6 Q 54.2 57.1, 50.0 63.0 Q 45.8 57.1, 46.6 47.6 Q 42.6 56.2, 36.0 59.2 Q 35.3 52.0, 40.8 44.2 Q 33.0 49.7, 25.8 49.0 Q 28.8 42.4, 37.4 38.4 Q 27.9 39.2, 22.0 35.0 Q 27.9 30.8, 37.4 31.6 Q 28.8 27.6, 25.8 21.0 Q 33.0 20.3, 40.8 25.8 Q 35.3 18.0, 36.0 10.8 Q 42.6 13.8, 46.6 22.4 Z" />
        <circle cx="50" cy="35" r="13" />
        <path
          d="M39.7 37.4 L47.6 45.3 M40.0 31.4 L53.6 45.0 M42.5 27.5 L57.5 42.5 M46.4 25.0 L60.0 38.6 M52.4 24.7 L60.3 32.6"
          strokeWidth="1.8"
        />
        <path
          d="M39.7 32.6 L47.6 24.7 M40.0 38.6 L53.6 25.0 M42.5 42.5 L57.5 27.5 M46.4 45.0 L60.0 31.4 M52.4 45.3 L60.3 37.4"
          strokeWidth="1.8"
        />
        <path d="M50 63 C 49 70, 48.5 79, 50 88" />
        <path d="M49.4 76 C 41 66, 28 62, 16 66 C 23 76, 36 80, 49.4 76 Z" />
        <path d="M46.5 74.5 C 38 70, 29 68, 21 67.5" strokeWidth="1.8" />
        <path d="M49.6 70 C 57 61, 70 58, 83 62 C 76 71, 63 74, 49.6 70 Z" />
        <path d="M53 68.5 C 61 65, 70 63, 78 63" strokeWidth="1.8" />
        <path d="M4 88 H96" />
      </>
    ),
  },
  // Kentucky is the Horse Capital of the World: the Thoroughbred has been the official state horse since 1996, and the Bluegrass farms around Lexington are the centre of Thoroughbred breeding.
  'kentucky-thoroughbred': {
    subject: 'Thoroughbred horse',
    scopes: ['region:US:Kentucky'],
    ink: [2.3, 6.8, 95.4, 80.9],
    draw: (id) => (
      <>
        <defs>
          <mask id={`${id}-cut`}>
            <rect width="100" height="100" fill="#fff" />
            <path
              d="M17 27.5 C 20.5 23.5, 25 19, 29 14.5 L31.5 8.5 L34 14 C 41 17.5, 47 24, 52 31 C 56 35, 60 36.5, 65 36 C 70 35.5, 73 33, 78 33.5 C 83 34, 86 38.5, 85.5 45.5 C 85 50.5, 84 54, 84 58 L84.3 66 L82 66 C 81 61, 79.5 58, 76 56 C 70 59, 58 60, 48 58 C 46.5 61, 45.5 65, 45 69.5 H42.5 C 42.5 64, 41.5 58, 38.5 53 C 36 48, 35.5 40, 37 30 C 33 31.5, 28.5 33.2, 24 33.8 C 21 34.2, 18.5 33.6, 17.2 32 C 16.4 31, 16.3 28.7, 17 27.5 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="8"
            />
            <path
              d="M43.7 69.5 V82 L41.5 86 M83.2 66 L82.5 82 L80 86 M50 59 L50.5 70 V82 L48.5 86 M77 58 C 78 61, 79 64, 78 68 L76.5 82 L74 86 M85 38.5 C 90.5 44.5, 91 55, 88 66"
              stroke="#000"
              strokeWidth="9"
            />
          </mask>
        </defs>
        <g mask={`url(#${id}-cut)`}>
          <path d="M4 50 H88 M4 60 H88 M4 70 H84" strokeWidth="2.4" />
          <path d="M9 47 V86" strokeWidth="2.4" />
        </g>
        <path
          d="M50 59 L50.5 70 V82 L48.5 86 M77 58 C 78 61, 79 64, 78 68 L76.5 82 L74 86"
          strokeWidth="2.4"
        />
        <path d="M17 27.5 C 20.5 23.5, 25 19, 29 14.5 L31.5 8.5 L34 14 C 41 17.5, 47 24, 52 31 C 56 35, 60 36.5, 65 36 C 70 35.5, 73 33, 78 33.5 C 83 34, 86 38.5, 85.5 45.5 C 85 50.5, 84 54, 84 58 L84.3 66 L82 66 C 81 61, 79.5 58, 76 56 C 70 59, 58 60, 48 58 C 46.5 61, 45.5 65, 45 69.5 H42.5 C 42.5 64, 41.5 58, 38.5 53 C 36 48, 35.5 40, 37 30 C 33 31.5, 28.5 33.2, 24 33.8 C 21 34.2, 18.5 33.6, 17.2 32 C 16.4 31, 16.3 28.7, 17 27.5 Z" />
        <path d="M43.7 69.5 V82 L41.5 86 M83.2 66 L82.5 82 L80 86" />
        <path d="M85 38.5 C 90.5 44.5, 91 55, 88 66" />
        <path d="M86.5 44.5 C 88.5 51, 88 58, 86 62" strokeWidth="2.4" />
        <circle cx="28" cy="21" r="1.8" fill="currentColor" stroke="none" />
        <path d="M19.8 29.6 L21.4 30.8" strokeWidth="1.8" />
        <path d="M4 86 H96" />
      </>
    ),
  },
  // The brown pelican has been Louisiana's official state bird since 1966, and Louisiana is nicknamed the Pelican State.
  'louisiana-brown-pelican': {
    subject: 'Brown pelican',
    scopes: ['region:US:Louisiana'],
    ink: [2.8, 6.5, 94.4, 88.2],
    draw: (_id) => (
      <>
        <path d="M 35.9 15.1 C 37 7.8, 47.1 5.6, 50.5 12.3 C 52.7 17.4, 46 24.1, 48.2 30.8 C 50.5 37.5, 56.1 39.8, 62.8 40.9 C 74 42, 84.1 49.8, 92.5 62.2 C 85.2 64.4, 78.5 66.6, 69.5 68.9 C 60.6 71.1, 51.6 70, 46 63.3 C 41.5 57.7, 39.3 47.6, 40.4 37.5 L 40.4 30.8" />
        <path d="M 35.9 15.1 L 6.8 35.8 L 6.2 38.6" />
        <path d="M 9 37.5 C 18 44.8, 32.6 42, 40.4 30.8" />
        <path d="M 12.4 37 C 20.2 35.3, 29.2 28.6, 37 21.8" strokeWidth="1.8" />
        <path d="M 53.8 46.5 C 62.8 55.4, 75.1 59.9, 88.6 62.2" strokeWidth="2.4" />
        <path d="M 71.8 59.9 L 80.7 65 M 78.5 59.4 L 86.3 63.8" strokeWidth="1.8" />
        <path
          d="M 48.8 21.8 L 45.4 24.1 M 47.7 28.6 L 44.3 30.8 M 49.4 35.3 L 46 38.1"
          strokeWidth="1.8"
        />
        <circle cx="43.2" cy="13.4" r="1.8" fill="currentColor" stroke="none" />
        <path d="M41.5 71.5 H62.5" />
        <path d="M44.5 71.5 V93 M59.5 71.5 V93" />
        <path d="M49.5 76 V81 M54.5 77 V82" strokeWidth="1.8" />
        <path
          d="M4 86 C 8 83, 12 89, 16 86 S 24 83, 28 86 S 36 89, 40 86 M64 86 C 68 83, 72 89, 76 86 S 84 83, 88 86 S 94 87, 96 86"
          strokeWidth="2.4"
        />
        <path d="M14 93 H38 M66 93 H88" strokeWidth="2.4" />
      </>
    ),
  },
  // Portland Head Light (1791) stands on Portland Head in Fort Williams Park, Cape Elizabeth, Cumberland County, Maine. It is the state's best-known lighthouse: a white conical tower joined to the red-roofed 1891 keepers' house.
  'maine-portland-head-light': {
    subject: 'Portland Head Light',
    scopes: [
      'city:us-maine-portland',
      'city:us-maine-cape-elizabeth',
      'city:us-maine-south-portland',
    ],
    ink: [2.3, 8.3, 95.4, 88.2],
    draw: (_id) => (
      <>
        <path d="M32.0 71 L36.5 26 H45.5 L50.0 71" />
        <path d="M33.5 26 H48.5" />
        <path d="M37.5 26 V18 H44.5 V26" strokeWidth="2.4" />
        <path d="M36.5 18 C 36.5 12.5, 45.5 12.5, 45.5 18" />
        <path d="M41.0 13.5 V9.5" strokeWidth="2.4" />
        <rect x="39.5" y="20" width="3" height="5" fill="currentColor" stroke="none" />
        <rect x="39.5" y="43.5" width="3" height="5" fill="currentColor" stroke="none" />
        <rect x="39.5" y="56.5" width="3" height="5" fill="currentColor" stroke="none" />
        <path d="M49.3 63 H59.0 V71" strokeWidth="2.4" />
        <path d="M59.0 71 V55 H83.0 V71" />
        <path d="M55.0 55 L61.5 44 H80.5 L87.0 55 Z" />
        <path
          d="M58.4 52.4 L65.2 45.6 M63.8 53.4 L71.6 45.6 M70.2 53.4 L78.0 45.6 M76.6 53.4 L81.4 48.6"
          strokeWidth="1.8"
        />
        <path d="M66.0 44 V38.5 M76.0 44 V38.5" />
        <rect x="64.0" y="60.5" width="4" height="5" fill="currentColor" stroke="none" />
        <rect x="74.0" y="60.5" width="4" height="5" fill="currentColor" stroke="none" />
        <path d="M4 86 L9.0 80.5 L14.0 81.5 L19.0 76 L25.0 72.5 L30.0 71 H89.0 L91.5 74.5 L90.5 78.5 L96 84" />
        <path d="M24.0 86 L29.0 80 L35.0 78 M66.0 77 L72.0 81 L80.0 79" strokeWidth="2.4" />
        <path
          d="M4 86 H96 M10 93 C 14 90, 18 96, 22 93 S 30 90, 34 93 S 42 96, 46 93 M54 93 C 58 90, 62 96, 66 93 S 74 90, 78 93 S 86 96, 90 93"
          strokeWidth="2.4"
        />
      </>
    ),
  },
  // Old North Church (Christ Church, 193 Salem Street, North End, Boston, Massachusetts) is where the two 'one if by land, two if by sea' lanterns were hung on 18 April 1775.
  'massachusetts-old-north-church': {
    subject: 'Old North Church steeple, Boston',
    scopes: ['city:us-massachusetts-boston'],
    ink: [2.3, 4.9, 95.4, 84.8],
    draw: (_id) => (
      <>
        <path d="M4 88 H96" />
        <path d="M22 88 V64 L39 56 M61 56 L78 64 V88" strokeWidth="2.4" />
        <path
          d="M27 82 V73.5 A3 3 0 0 1 33 73.5 V82 Z M67 82 V73.5 A3 3 0 0 1 73 73.5 V82 Z"
          fill="currentColor"
          strokeWidth="1.8"
        />
        <path d="M39 88 V52 M61 88 V52" />
        <path d="M36 52 H64" />
        <path d="M45 88 V80.5 A5 5 0 0 1 55 80.5 V88 Z" fill="currentColor" strokeWidth="1.8" />
        <path d="M46.5 72 V64 A3.5 3.5 0 0 1 53.5 64 V72 Z" strokeWidth="1.8" />
        <path d="M39.5 52 V39 M60.5 52 V39" />
        <path d="M38 39 H62" strokeWidth="2.4" />
        <circle cx="46.2" cy="47.5" r="1.7" fill="currentColor" strokeWidth="1.8" />
        <circle cx="53.8" cy="47.5" r="1.7" fill="currentColor" strokeWidth="1.8" />
        <path d="M44 39 V29 M56 39 V29" />
        <path d="M42.5 29 H57.5" strokeWidth="2.4" />
        <path d="M48 37.8 V36 A2 2 0 0 1 52 36 V37.8" strokeWidth="1.8" />
        <path d="M46.5 29 V23.5 H53.5 V29" strokeWidth="2.4" />
        <path d="M46 23.5 L50 9 L54 23.5" />
        <path d="M50 9 V5.8 M50 7 H54.5" strokeWidth="1.8" />
      </>
    ),
  },
  // The Mackinac Bridge spans the Straits of Mackinac between Mackinaw City and St. Ignace and lies entirely within Michigan, which counts it among its best-known landmarks.
  'michigan-mackinac-bridge': {
    subject: 'Mackinac Bridge',
    scopes: ['region:US:Michigan'],
    ink: [0.8, 24.3, 98.4, 63.2],
    draw: (_id) => (
      <>
        <path d="M32.5 26 Q 50 74, 67.5 26" />
        <path d="M23.5 26 Q 17 46, 11 56 M76.5 26 Q 83 46, 89 56" />
        <path
          d="M38.5 41.3 V56 M44.2 49.5 V56 M55.8 49.5 V56 M61.5 41.3 V56 M18 46.5 V56 M82 46.5 V56"
          strokeWidth="1.6"
        />
        <path d="M23.5 76 V26 H32.5 V76" />
        <path d="M67.5 76 V26 H76.5 V76" />
        <path d="M23.5 36 H32.5 M23.5 46 H32.5 M67.5 36 H76.5 M67.5 46 H76.5" strokeWidth="2.4" />
        <path d="M2 62 L11 56 H89 L98 62 M2 68 L11 62 H89 L98 68" strokeWidth="2.4" />
        <path
          d="M12 62 L15 56 L18 62 M36 62 L39 56 L42 62 L45 56 L48 62 L51 56 L54 62 L57 56 L60 62 L63 56 L64 62 M82 62 L85 56 L88 62"
          strokeWidth="1.6"
        />
        <path d="M8 64 V76 M92 64 V76" strokeWidth="2.4" />
        <path d="M2 76 H98" strokeWidth="2.4" />
        <path
          d="M8 84 C 12 81, 16 87, 20 84 S 28 81, 32 84 S 40 87, 44 84 M56 84 C 60 81, 64 87, 68 84 S 76 81, 80 84 S 88 87, 92 84"
          strokeWidth="2.4"
        />
      </>
    ),
  },
  // The common loon has been Minnesota's official state bird since 1961.
  'minnesota-loon': {
    subject: 'Common loon',
    scopes: ['region:US:Minnesota'],
    ink: [4.3, 23.3, 93.4, 66.2],
    draw: (id) => (
      <>
        <defs>
          <mask id={`${id}-eye`}>
            <rect width="100" height="100" fill="#fff" />
            <circle cx="23" cy="30" r="1.6" fill="#000" />
          </mask>
        </defs>
        <path
          d="M16 32 C 17 27, 22 24.5, 27 24.5 C 32 24.5, 35 28, 35.5 33 C 36 36, 37 39, 38.5 41 L 24.5 43.5 C 23.5 41, 21 39, 17 37.5 Z"
          fill="currentColor"
          strokeWidth="2.4"
          mask={`url(#${id}-eye)`}
        />
        <path d="M16 32 L 6.5 36 L 17 37.5" />
        <path d="M38.5 41 C 40 44, 42 46, 46 47 C 56 48, 68 45.5, 78 48.5 C 86 51, 92 59, 92 66 C 92 68, 91.5 69, 91 70 M24.5 43.5 C 24 51, 25 62, 30 70" />
        <path d="M28 46 V49.5 M32 46.5 V50 M36 47 V50.5" strokeWidth="1.8" />
        <path d="M44 59 C 58 54, 76 54.5, 90 61" strokeWidth="2.4" />
        <path d="M50 52.5 C 60 50.5, 72 50, 84 53.5" strokeWidth="2.4" strokeDasharray="0.1 4.8" />
        <path d="M52 65 C 60 62.5, 72 62, 84 65.5" strokeWidth="2.4" strokeDasharray="0.1 4.8" />
        <path d="M6 70 H96" />
        <path d="M12 78 C 16 75, 20 81, 24 78 S 32 75, 36 78 S 44 81, 48 78" strokeWidth="2.4" />
        <path d="M54 86 C 58 83, 62 89, 66 86 S 74 83, 78 86 S 86 89, 90 86" strokeWidth="2.4" />
      </>
    ),
  },
  // The southern magnolia is Mississippi's state flower (1952) and state tree (1938), and Mississippi is nicknamed the Magnolia State.
  'mississippi-magnolia': {
    subject: 'Magnolia blossom',
    scopes: ['region:US:Mississippi'],
    ink: [8.8, 22, 82.4, 71.7],
    draw: (id) => (
      <>
        <defs>
          <mask id={`${id}-m1`}>
            <rect width="100" height="100" fill="#fff" />
            <path
              d="M 47 71 C 40.5 65.5, 39 60.8, 39.5 56.6 C 41.1 53.4, 45.8 52.5, 50 52.5 C 54.2 52.5, 58.9 53.4, 60.5 56.6 C 61 60.8, 59.5 65.5, 53 71 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="9"
            />
          </mask>
          <mask id={`${id}-m2`}>
            <rect width="100" height="100" fill="#fff" />
            <path
              d="M 47 71 C 40.5 65.5, 39 60.8, 39.5 56.6 C 41.1 53.4, 45.8 52.5, 50 52.5 C 54.2 52.5, 58.9 53.4, 60.5 56.6 C 61 60.8, 59.5 65.5, 53 71 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="9"
            />
            <path
              d="M 43.8 71.3 C 34.7 71.8, 28.9 69.8, 24.6 66.2 C 22.1 62.6, 23.8 58.1, 26.1 54.6 C 28.5 51.1, 32.1 47.9, 36.4 48.8 C 41.2 51.5, 45.3 56.1, 48.2 64.7 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="9"
            />
          </mask>
          <mask id={`${id}-m3`}>
            <rect width="100" height="100" fill="#fff" />
            <path
              d="M 47 71 C 40.5 65.5, 39 60.8, 39.5 56.6 C 41.1 53.4, 45.8 52.5, 50 52.5 C 54.2 52.5, 58.9 53.4, 60.5 56.6 C 61 60.8, 59.5 65.5, 53 71 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="9"
            />
            <path
              d="M 43.8 71.3 C 34.7 71.8, 28.9 69.8, 24.6 66.2 C 22.1 62.6, 23.8 58.1, 26.1 54.6 C 28.5 51.1, 32.1 47.9, 36.4 48.8 C 41.2 51.5, 45.3 56.1, 48.2 64.7 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="9"
            />
            <path
              d="M 51.8 64.7 C 54.7 56.1, 58.8 51.5, 63.6 48.8 C 67.9 47.9, 71.5 51.1, 73.9 54.6 C 76.2 58.1, 77.9 62.6, 75.4 66.2 C 71.1 69.8, 65.3 71.8, 56.2 71.3 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="9"
            />
            <path d="M43 37.5 L 57 32.5 M43 31.5 L 57 26.5" stroke="#000" strokeWidth="2" />
          </mask>
          <mask id={`${id}-m4`}>
            <rect width="100" height="100" fill="#fff" />
            <path
              d="M 47 71 C 40.5 65.5, 39 60.8, 39.5 56.6 C 41.1 53.4, 45.8 52.5, 50 52.5 C 54.2 52.5, 58.9 53.4, 60.5 56.6 C 61 60.8, 59.5 65.5, 53 71 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="9"
            />
            <path
              d="M 43.8 71.3 C 34.7 71.8, 28.9 69.8, 24.6 66.2 C 22.1 62.6, 23.8 58.1, 26.1 54.6 C 28.5 51.1, 32.1 47.9, 36.4 48.8 C 41.2 51.5, 45.3 56.1, 48.2 64.7 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="9"
            />
            <path
              d="M 51.8 64.7 C 54.7 56.1, 58.8 51.5, 63.6 48.8 C 67.9 47.9, 71.5 51.1, 73.9 54.6 C 76.2 58.1, 77.9 62.6, 75.4 66.2 C 71.1 69.8, 65.3 71.8, 56.2 71.3 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="9"
            />
            <path
              d="M45 41 C 44 33, 46 25.5, 50 25.5 C 54 25.5, 56 33, 55 41 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="8"
            />
          </mask>
          <mask id={`${id}-m5`}>
            <rect width="100" height="100" fill="#fff" />
            <path
              d="M 47 71 C 40.5 65.5, 39 60.8, 39.5 56.6 C 41.1 53.4, 45.8 52.5, 50 52.5 C 54.2 52.5, 58.9 53.4, 60.5 56.6 C 61 60.8, 59.5 65.5, 53 71 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="9"
            />
            <path
              d="M 43.8 71.3 C 34.7 71.8, 28.9 69.8, 24.6 66.2 C 22.1 62.6, 23.8 58.1, 26.1 54.6 C 28.5 51.1, 32.1 47.9, 36.4 48.8 C 41.2 51.5, 45.3 56.1, 48.2 64.7 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="9"
            />
            <path
              d="M 51.8 64.7 C 54.7 56.1, 58.8 51.5, 63.6 48.8 C 67.9 47.9, 71.5 51.1, 73.9 54.6 C 76.2 58.1, 77.9 62.6, 75.4 66.2 C 71.1 69.8, 65.3 71.8, 56.2 71.3 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="9"
            />
            <path
              d="M45 41 C 44 33, 46 25.5, 50 25.5 C 54 25.5, 56 33, 55 41 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="8"
            />
            <path
              d="M43.5 42 L 41 46 M47.8 43.5 L 47.2 47.5 M52.2 43.5 L 52.8 47.5 M56.5 42 L 59 46"
              fill="#000"
              stroke="#000"
              strokeWidth="6"
            />
          </mask>
          <mask id={`${id}-m6`}>
            <rect width="100" height="100" fill="#fff" />
            <path
              d="M 47 71 C 40.5 65.5, 39 60.8, 39.5 56.6 C 41.1 53.4, 45.8 52.5, 50 52.5 C 54.2 52.5, 58.9 53.4, 60.5 56.6 C 61 60.8, 59.5 65.5, 53 71 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="9"
            />
            <path
              d="M 43.8 71.3 C 34.7 71.8, 28.9 69.8, 24.6 66.2 C 22.1 62.6, 23.8 58.1, 26.1 54.6 C 28.5 51.1, 32.1 47.9, 36.4 48.8 C 41.2 51.5, 45.3 56.1, 48.2 64.7 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="9"
            />
            <path
              d="M 51.8 64.7 C 54.7 56.1, 58.8 51.5, 63.6 48.8 C 67.9 47.9, 71.5 51.1, 73.9 54.6 C 76.2 58.1, 77.9 62.6, 75.4 66.2 C 71.1 69.8, 65.3 71.8, 56.2 71.3 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="9"
            />
            <path
              d="M45 41 C 44 33, 46 25.5, 50 25.5 C 54 25.5, 56 33, 55 41 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="8"
            />
            <path
              d="M43.5 42 L 41 46 M47.8 43.5 L 47.2 47.5 M52.2 43.5 L 52.8 47.5 M56.5 42 L 59 46"
              fill="#000"
              stroke="#000"
              strokeWidth="6"
            />
            <path
              d="M 41.4 59 C 31.2 63, 23 63.5, 15.8 61.9 C 10.7 59.6, 9.7 54.7, 10.3 50.5 C 10.9 46.4, 13.1 41.9, 18.7 41.1 C 26.1 41.6, 33.8 44.3, 42.6 51 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="9"
            />
          </mask>
          <mask id={`${id}-m7`}>
            <rect width="100" height="100" fill="#fff" />
            <path
              d="M 47 71 C 40.5 65.5, 39 60.8, 39.5 56.6 C 41.1 53.4, 45.8 52.5, 50 52.5 C 54.2 52.5, 58.9 53.4, 60.5 56.6 C 61 60.8, 59.5 65.5, 53 71 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="9"
            />
            <path
              d="M 43.8 71.3 C 34.7 71.8, 28.9 69.8, 24.6 66.2 C 22.1 62.6, 23.8 58.1, 26.1 54.6 C 28.5 51.1, 32.1 47.9, 36.4 48.8 C 41.2 51.5, 45.3 56.1, 48.2 64.7 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="9"
            />
            <path
              d="M 51.8 64.7 C 54.7 56.1, 58.8 51.5, 63.6 48.8 C 67.9 47.9, 71.5 51.1, 73.9 54.6 C 76.2 58.1, 77.9 62.6, 75.4 66.2 C 71.1 69.8, 65.3 71.8, 56.2 71.3 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="9"
            />
            <path
              d="M45 41 C 44 33, 46 25.5, 50 25.5 C 54 25.5, 56 33, 55 41 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="8"
            />
            <path
              d="M43.5 42 L 41 46 M47.8 43.5 L 47.2 47.5 M52.2 43.5 L 52.8 47.5 M56.5 42 L 59 46"
              fill="#000"
              stroke="#000"
              strokeWidth="6"
            />
            <path
              d="M 41.4 59 C 31.2 63, 23 63.5, 15.8 61.9 C 10.7 59.6, 9.7 54.7, 10.3 50.5 C 10.9 46.4, 13.1 41.9, 18.7 41.1 C 26.1 41.6, 33.8 44.3, 42.6 51 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="9"
            />
            <path
              d="M 57.4 51 C 66.2 44.3, 73.9 41.6, 81.3 41.1 C 86.9 41.9, 89.1 46.4, 89.7 50.5 C 90.3 54.7, 89.3 59.6, 84.2 61.9 C 77 63.5, 68.8 63, 58.6 59 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="9"
            />
          </mask>
          <mask id={`${id}-m8`}>
            <rect width="100" height="100" fill="#fff" />
            <path
              d="M 47 71 C 40.5 65.5, 39 60.8, 39.5 56.6 C 41.1 53.4, 45.8 52.5, 50 52.5 C 54.2 52.5, 58.9 53.4, 60.5 56.6 C 61 60.8, 59.5 65.5, 53 71 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="9"
            />
            <path
              d="M 43.8 71.3 C 34.7 71.8, 28.9 69.8, 24.6 66.2 C 22.1 62.6, 23.8 58.1, 26.1 54.6 C 28.5 51.1, 32.1 47.9, 36.4 48.8 C 41.2 51.5, 45.3 56.1, 48.2 64.7 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="9"
            />
            <path
              d="M 51.8 64.7 C 54.7 56.1, 58.8 51.5, 63.6 48.8 C 67.9 47.9, 71.5 51.1, 73.9 54.6 C 76.2 58.1, 77.9 62.6, 75.4 66.2 C 71.1 69.8, 65.3 71.8, 56.2 71.3 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="9"
            />
            <path
              d="M45 41 C 44 33, 46 25.5, 50 25.5 C 54 25.5, 56 33, 55 41 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="8"
            />
            <path
              d="M43.5 42 L 41 46 M47.8 43.5 L 47.2 47.5 M52.2 43.5 L 52.8 47.5 M56.5 42 L 59 46"
              fill="#000"
              stroke="#000"
              strokeWidth="6"
            />
            <path
              d="M 41.4 59 C 31.2 63, 23 63.5, 15.8 61.9 C 10.7 59.6, 9.7 54.7, 10.3 50.5 C 10.9 46.4, 13.1 41.9, 18.7 41.1 C 26.1 41.6, 33.8 44.3, 42.6 51 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="9"
            />
            <path
              d="M 57.4 51 C 66.2 44.3, 73.9 41.6, 81.3 41.1 C 86.9 41.9, 89.1 46.4, 89.7 50.5 C 90.3 54.7, 89.3 59.6, 84.2 61.9 C 77 63.5, 68.8 63, 58.6 59 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="9"
            />
            <path
              d="M 40.3 49.6 C 32.7 44.8, 28.8 39.7, 26.9 34.3 C 26.6 29.8, 30.2 26.8, 33.8 25.2 C 37.5 23.5, 42.1 22.8, 45.2 26.1 C 48 31.2, 49.2 37.5, 47.7 46.4 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="9"
            />
          </mask>
          <mask id={`${id}-m9`}>
            <rect width="100" height="100" fill="#fff" />
            <path
              d="M 47 71 C 40.5 65.5, 39 60.8, 39.5 56.6 C 41.1 53.4, 45.8 52.5, 50 52.5 C 54.2 52.5, 58.9 53.4, 60.5 56.6 C 61 60.8, 59.5 65.5, 53 71 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="9"
            />
            <path
              d="M 43.8 71.3 C 34.7 71.8, 28.9 69.8, 24.6 66.2 C 22.1 62.6, 23.8 58.1, 26.1 54.6 C 28.5 51.1, 32.1 47.9, 36.4 48.8 C 41.2 51.5, 45.3 56.1, 48.2 64.7 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="9"
            />
            <path
              d="M 51.8 64.7 C 54.7 56.1, 58.8 51.5, 63.6 48.8 C 67.9 47.9, 71.5 51.1, 73.9 54.6 C 76.2 58.1, 77.9 62.6, 75.4 66.2 C 71.1 69.8, 65.3 71.8, 56.2 71.3 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="9"
            />
            <path
              d="M45 41 C 44 33, 46 25.5, 50 25.5 C 54 25.5, 56 33, 55 41 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="8"
            />
            <path
              d="M43.5 42 L 41 46 M47.8 43.5 L 47.2 47.5 M52.2 43.5 L 52.8 47.5 M56.5 42 L 59 46"
              fill="#000"
              stroke="#000"
              strokeWidth="6"
            />
            <path
              d="M 41.4 59 C 31.2 63, 23 63.5, 15.8 61.9 C 10.7 59.6, 9.7 54.7, 10.3 50.5 C 10.9 46.4, 13.1 41.9, 18.7 41.1 C 26.1 41.6, 33.8 44.3, 42.6 51 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="9"
            />
            <path
              d="M 57.4 51 C 66.2 44.3, 73.9 41.6, 81.3 41.1 C 86.9 41.9, 89.1 46.4, 89.7 50.5 C 90.3 54.7, 89.3 59.6, 84.2 61.9 C 77 63.5, 68.8 63, 58.6 59 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="9"
            />
            <path
              d="M 40.3 49.6 C 32.7 44.8, 28.8 39.7, 26.9 34.3 C 26.6 29.8, 30.2 26.8, 33.8 25.2 C 37.5 23.5, 42.1 22.8, 45.2 26.1 C 48 31.2, 49.2 37.5, 47.7 46.4 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="9"
            />
            <path
              d="M 52.3 46.4 C 50.8 37.5, 52 31.2, 54.8 26.1 C 57.9 22.8, 62.5 23.5, 66.2 25.2 C 69.8 26.8, 73.4 29.8, 73.1 34.3 C 71.2 39.7, 67.3 44.8, 59.7 49.6 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="9"
            />
          </mask>
          <mask id={`${id}-m10`}>
            <rect width="100" height="100" fill="#fff" />
            <path
              d="M 47 71 C 40.5 65.5, 39 60.8, 39.5 56.6 C 41.1 53.4, 45.8 52.5, 50 52.5 C 54.2 52.5, 58.9 53.4, 60.5 56.6 C 61 60.8, 59.5 65.5, 53 71 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="9"
            />
            <path
              d="M 43.8 71.3 C 34.7 71.8, 28.9 69.8, 24.6 66.2 C 22.1 62.6, 23.8 58.1, 26.1 54.6 C 28.5 51.1, 32.1 47.9, 36.4 48.8 C 41.2 51.5, 45.3 56.1, 48.2 64.7 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="9"
            />
            <path
              d="M 51.8 64.7 C 54.7 56.1, 58.8 51.5, 63.6 48.8 C 67.9 47.9, 71.5 51.1, 73.9 54.6 C 76.2 58.1, 77.9 62.6, 75.4 66.2 C 71.1 69.8, 65.3 71.8, 56.2 71.3 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="9"
            />
            <path
              d="M45 41 C 44 33, 46 25.5, 50 25.5 C 54 25.5, 56 33, 55 41 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="8"
            />
            <path
              d="M43.5 42 L 41 46 M47.8 43.5 L 47.2 47.5 M52.2 43.5 L 52.8 47.5 M56.5 42 L 59 46"
              fill="#000"
              stroke="#000"
              strokeWidth="6"
            />
            <path
              d="M 41.4 59 C 31.2 63, 23 63.5, 15.8 61.9 C 10.7 59.6, 9.7 54.7, 10.3 50.5 C 10.9 46.4, 13.1 41.9, 18.7 41.1 C 26.1 41.6, 33.8 44.3, 42.6 51 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="9"
            />
            <path
              d="M 57.4 51 C 66.2 44.3, 73.9 41.6, 81.3 41.1 C 86.9 41.9, 89.1 46.4, 89.7 50.5 C 90.3 54.7, 89.3 59.6, 84.2 61.9 C 77 63.5, 68.8 63, 58.6 59 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="9"
            />
            <path
              d="M 40.3 49.6 C 32.7 44.8, 28.8 39.7, 26.9 34.3 C 26.6 29.8, 30.2 26.8, 33.8 25.2 C 37.5 23.5, 42.1 22.8, 45.2 26.1 C 48 31.2, 49.2 37.5, 47.7 46.4 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="9"
            />
            <path
              d="M 52.3 46.4 C 50.8 37.5, 52 31.2, 54.8 26.1 C 57.9 22.8, 62.5 23.5, 66.2 25.2 C 69.8 26.8, 73.4 29.8, 73.1 34.3 C 71.2 39.7, 67.3 44.8, 59.7 49.6 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="9"
            />
            <path d="M50 72 C 50 79, 51 85, 54 92" fill="#000" stroke="#000" strokeWidth="6.5" />
            <path d="M 44.2 75.2 L 13.6 84.5" stroke="#000" strokeWidth="2" />
          </mask>
          <mask id={`${id}-m11`}>
            <rect width="100" height="100" fill="#fff" />
            <path
              d="M 47 71 C 40.5 65.5, 39 60.8, 39.5 56.6 C 41.1 53.4, 45.8 52.5, 50 52.5 C 54.2 52.5, 58.9 53.4, 60.5 56.6 C 61 60.8, 59.5 65.5, 53 71 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="9"
            />
            <path
              d="M 43.8 71.3 C 34.7 71.8, 28.9 69.8, 24.6 66.2 C 22.1 62.6, 23.8 58.1, 26.1 54.6 C 28.5 51.1, 32.1 47.9, 36.4 48.8 C 41.2 51.5, 45.3 56.1, 48.2 64.7 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="9"
            />
            <path
              d="M 51.8 64.7 C 54.7 56.1, 58.8 51.5, 63.6 48.8 C 67.9 47.9, 71.5 51.1, 73.9 54.6 C 76.2 58.1, 77.9 62.6, 75.4 66.2 C 71.1 69.8, 65.3 71.8, 56.2 71.3 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="9"
            />
            <path
              d="M45 41 C 44 33, 46 25.5, 50 25.5 C 54 25.5, 56 33, 55 41 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="8"
            />
            <path
              d="M43.5 42 L 41 46 M47.8 43.5 L 47.2 47.5 M52.2 43.5 L 52.8 47.5 M56.5 42 L 59 46"
              fill="#000"
              stroke="#000"
              strokeWidth="6"
            />
            <path
              d="M 41.4 59 C 31.2 63, 23 63.5, 15.8 61.9 C 10.7 59.6, 9.7 54.7, 10.3 50.5 C 10.9 46.4, 13.1 41.9, 18.7 41.1 C 26.1 41.6, 33.8 44.3, 42.6 51 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="9"
            />
            <path
              d="M 57.4 51 C 66.2 44.3, 73.9 41.6, 81.3 41.1 C 86.9 41.9, 89.1 46.4, 89.7 50.5 C 90.3 54.7, 89.3 59.6, 84.2 61.9 C 77 63.5, 68.8 63, 58.6 59 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="9"
            />
            <path
              d="M 40.3 49.6 C 32.7 44.8, 28.8 39.7, 26.9 34.3 C 26.6 29.8, 30.2 26.8, 33.8 25.2 C 37.5 23.5, 42.1 22.8, 45.2 26.1 C 48 31.2, 49.2 37.5, 47.7 46.4 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="9"
            />
            <path
              d="M 52.3 46.4 C 50.8 37.5, 52 31.2, 54.8 26.1 C 57.9 22.8, 62.5 23.5, 66.2 25.2 C 69.8 26.8, 73.4 29.8, 73.1 34.3 C 71.2 39.7, 67.3 44.8, 59.7 49.6 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="9"
            />
            <path d="M50 72 C 50 79, 51 85, 54 92" fill="#000" stroke="#000" strokeWidth="6.5" />
            <path
              d="M 48 74 C 40.9 85, 23.5 89.6, 9.7 85.7 C 18.9 74.7, 36 68.8, 48 74 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="6.5"
            />
            <path d="M 55.8 75.2 L 86.4 84.5" stroke="#000" strokeWidth="2" />
          </mask>
        </defs>
        <path
          d="M 52 74 C 64 68.8, 81.1 74.7, 90.3 85.7 C 76.5 89.6, 59.1 85, 52 74 Z"
          fill="currentColor"
          strokeWidth="1.8"
          mask={`url(#${id}-m11)`}
        />
        <path
          d="M 48 74 C 40.9 85, 23.5 89.6, 9.7 85.7 C 18.9 74.7, 36 68.8, 48 74 Z"
          fill="currentColor"
          strokeWidth="1.8"
          mask={`url(#${id}-m10)`}
        />
        <path d="M50 72 C 50 79, 51 85, 54 92" mask={`url(#${id}-m9)`} />
        <path
          d="M 52.3 46.4 C 50.8 37.5, 52 31.2, 54.8 26.1 C 57.9 22.8, 62.5 23.5, 66.2 25.2 C 69.8 26.8, 73.4 29.8, 73.1 34.3 C 71.2 39.7, 67.3 44.8, 59.7 49.6"
          mask={`url(#${id}-m8)`}
        />
        <path
          d="M 40.3 49.6 C 32.7 44.8, 28.8 39.7, 26.9 34.3 C 26.6 29.8, 30.2 26.8, 33.8 25.2 C 37.5 23.5, 42.1 22.8, 45.2 26.1 C 48 31.2, 49.2 37.5, 47.7 46.4"
          mask={`url(#${id}-m7)`}
        />
        <path
          d="M 57.4 51 C 66.2 44.3, 73.9 41.6, 81.3 41.1 C 86.9 41.9, 89.1 46.4, 89.7 50.5 C 90.3 54.7, 89.3 59.6, 84.2 61.9 C 77 63.5, 68.8 63, 58.6 59"
          strokeWidth="2.4"
          mask={`url(#${id}-m6)`}
        />
        <path
          d="M 41.4 59 C 31.2 63, 23 63.5, 15.8 61.9 C 10.7 59.6, 9.7 54.7, 10.3 50.5 C 10.9 46.4, 13.1 41.9, 18.7 41.1 C 26.1 41.6, 33.8 44.3, 42.6 51"
          strokeWidth="2.4"
          mask={`url(#${id}-m5)`}
        />
        <path
          d="M43.5 42 L 41 46 M47.8 43.5 L 47.2 47.5 M52.2 43.5 L 52.8 47.5 M56.5 42 L 59 46"
          strokeWidth="1.8"
          mask={`url(#${id}-m4)`}
        />
        <path
          d="M45 41 C 44 33, 46 25.5, 50 25.5 C 54 25.5, 56 33, 55 41 Z"
          fill="currentColor"
          strokeWidth="1.8"
          mask={`url(#${id}-m3)`}
        />
        <path
          d="M 51.8 64.7 C 54.7 56.1, 58.8 51.5, 63.6 48.8 C 67.9 47.9, 71.5 51.1, 73.9 54.6 C 76.2 58.1, 77.9 62.6, 75.4 66.2 C 71.1 69.8, 65.3 71.8, 56.2 71.3"
          mask={`url(#${id}-m2)`}
        />
        <path
          d="M 43.8 71.3 C 34.7 71.8, 28.9 69.8, 24.6 66.2 C 22.1 62.6, 23.8 58.1, 26.1 54.6 C 28.5 51.1, 32.1 47.9, 36.4 48.8 C 41.2 51.5, 45.3 56.1, 48.2 64.7"
          mask={`url(#${id}-m1)`}
        />
        <path d="M 47 71 C 40.5 65.5, 39 60.8, 39.5 56.6 C 41.1 53.4, 45.8 52.5, 50 52.5 C 54.2 52.5, 58.9 53.4, 60.5 56.6 C 61 60.8, 59.5 65.5, 53 71" />
      </>
    ),
  },
  // The Gateway Arch stands on the Mississippi riverfront in downtown St. Louis, Missouri (Gateway Arch National Park), with the Old Courthouse on its axis to the west.
  'missouri-gateway-arch': {
    subject: 'Gateway Arch, St. Louis',
    scopes: ['city:us-missouri-st-louis', 'city:us-missouri-saint-louis'],
    ink: [1.3, 4.3, 97.4, 90.2],
    draw: (_id) => (
      <>
        <path d="M11.0 84.0 C11.9 79.6, 14.7 65.3, 16.6 57.8 C18.4 50.3, 20.3 44.4, 22.1 39.0 C24.0 33.7, 25.9 29.4, 27.7 25.7 C29.6 21.9, 31.4 19.0, 33.3 16.5 C35.1 13.9, 37.0 12.0, 38.9 10.5 C40.7 8.9, 42.6 7.8, 44.4 7.1 C46.3 6.3, 48.1 6.0, 50.0 6.0 C51.9 6.0, 53.7 6.3, 55.6 7.1 C57.4 7.8, 59.3 8.9, 61.1 10.5 C63.0 12.0, 64.9 13.9, 66.7 16.5 C68.6 19.0, 70.4 21.9, 72.3 25.7 C74.1 29.4, 76.0 33.7, 77.9 39.0 C79.7 44.4, 81.6 50.3, 83.4 57.8 C85.3 65.3, 88.1 79.6, 89.0 84.0" />
        <path d="M24.0 84.0 C24.6 80.3, 26.5 68.2, 27.7 61.9 C29.0 55.5, 30.2 50.5, 31.4 45.9 C32.7 41.4, 33.9 37.8, 35.1 34.6 C36.4 31.5, 37.6 29.0, 38.9 26.8 C40.1 24.7, 41.3 23.1, 42.6 21.8 C43.8 20.5, 45.0 19.6, 46.3 18.9 C47.5 18.3, 48.8 18.0, 50.0 18.0 C51.2 18.0, 52.5 18.3, 53.7 18.9 C55.0 19.6, 56.2 20.5, 57.4 21.8 C58.7 23.1, 59.9 24.7, 61.1 26.8 C62.4 29.0, 63.6 31.5, 64.9 34.6 C66.1 37.8, 67.3 41.4, 68.6 45.9 C69.8 50.5, 71.0 55.5, 72.3 61.9 C73.5 68.2, 75.4 80.3, 76.0 84.0" />
        <path
          d="M17.5 84.0 C18.3 80.0, 20.6 66.8, 22.1 59.9 C23.7 52.9, 25.2 47.4, 26.8 42.5 C28.3 37.5, 29.9 33.6, 31.4 30.2 C33.0 26.7, 34.5 24.0, 36.1 21.7 C37.6 19.3, 39.2 17.6, 40.7 16.1 C42.3 14.7, 43.8 13.7, 45.4 13.0 C46.9 12.3, 48.5 12.0, 50.0 12.0 C51.5 12.0, 53.1 12.3, 54.6 13.0 C56.2 13.7, 57.7 14.7, 59.3 16.1 C60.8 17.6, 62.4 19.3, 63.9 21.7 C65.5 24.0, 67.0 26.7, 68.6 30.2 C70.1 33.6, 71.7 37.5, 73.2 42.5 C74.8 47.4, 76.3 52.9, 77.9 59.9 C79.4 66.8, 81.7 80.0, 82.5 84.0"
          strokeWidth="2.4"
        />
        <path d="M38 84 V75 H62 V84" strokeWidth="2.4" />
        <path d="M36 75 H64" strokeWidth="2.4" />
        <path d="M44 75 V70 H56 V75" strokeWidth="2.4" />
        <path d="M44 70 C 44 63, 56 63, 56 70" strokeWidth="2.4" />
        <path d="M50 64.5 V61" strokeWidth="2.4" />
        <path d="M43 84 V78 M48 84 V78 M52 84 V78 M57 84 V78" strokeWidth="1.8" />
        <path d="M3 84 H97" />
        <path
          d="M8 91 C 12 88, 16 94, 20 91 S 28 88, 32 91 S 40 94, 44 91 M56 91 C 60 88, 64 94, 68 91 S 76 88, 80 91 S 88 94, 92 91"
          strokeWidth="2.4"
        />
      </>
    ),
  },
  // Glacier National Park lies in northwest Montana, and the mountain goat is the park's emblem animal, seen on its ledges around Logan Pass.
  'montana-mountain-goat': {
    subject: 'Mountain goat, Glacier',
    scopes: ['region:US:Montana'],
    ink: [0.3, 4.8, 99.4, 88.4],
    draw: (id) => (
      <>
        <defs>
          <mask id={`${id}-goat`}>
            <rect width="100" height="100" fill="#fff" />
            <path
              d="M9 34 C 10 30, 13 26, 18 23 L24 23 C 27 25, 31 23, 38 21 C 46 21, 52 27, 60 28 L74 28 C 80 29, 83 34, 82 40 L81 51 L80 63 L76 58 L72 62 L66 55 L60 60 L52 56 L45 61 L38 56 L34 63 L30 58 C 28 50, 26 46, 22.5 41 L15.5 55 L13.5 39 C 10.5 37.5, 9 36, 9 34 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="7"
            />
          </mask>
        </defs>
        <g mask={`url(#${id}-goat)`}>
          <path d="M30 34 L44 14 L52 22 L66 6 L82 26 L96 38" strokeWidth="2.4" />
          <path d="M62 11 L65 15 L69 12" strokeWidth="2.4" />
        </g>
        <path d="M9 34 C 10 30, 13 26, 18 23 L24 23 C 27 25, 31 23, 38 21 C 46 21, 52 27, 60 28 L74 28 C 80 29, 83 34, 82 40 L81 51 L80 63 L76 58 L72 62 L66 55 L60 60 L52 56 L45 61 L38 56 L34 63 L30 58 C 28 50, 26 46, 22.5 41 L15.5 55 L13.5 39 C 10.5 37.5, 9 36, 9 34 Z" />
        <path d="M29 59 L25.5 79 M35.5 58 L33.5 79 M69 58 L71.5 68 L68.5 79 M77 59 L80 68 L77.5 79" />
        <rect
          x="23.6"
          y="77.5"
          width="3.8"
          height="3.5"
          rx="0.6"
          fill="currentColor"
          stroke="none"
        />
        <rect
          x="31.6"
          y="77.5"
          width="3.8"
          height="3.5"
          rx="0.6"
          fill="currentColor"
          stroke="none"
        />
        <rect
          x="66.6"
          y="77.5"
          width="3.8"
          height="3.5"
          rx="0.6"
          fill="currentColor"
          stroke="none"
        />
        <rect
          x="75.6"
          y="77.5"
          width="3.8"
          height="3.5"
          rx="0.6"
          fill="currentColor"
          stroke="none"
        />
        <path
          d="M18 23.5 C 18.5 17, 21 12, 25 8 C 24.5 14, 23.5 19, 23 23.5 Z"
          fill="currentColor"
          strokeWidth="1.6"
        />
        <circle cx="16" cy="29" r="1.8" fill="currentColor" stroke="none" />
        <path
          d="M44 33 L46 37 M53 33 L55 37 M62 35 L64 39 M71 35 L73 39 M48 43 L50 47 M57 43 L59 47 M66 44 L68 48"
          strokeWidth="1.8"
        />
        <path
          d="M28 65 L24.5 67.5 M35 64.5 L38.5 67 M70.5 64 L67 66.5 M79.5 65 L83 67.5"
          strokeWidth="1.8"
        />
        <path d="M2 82 H82 L85 85 V88 L89 91.5 H98" />
        <path
          d="M80 87 L74 88 L71 91.5 M12 86.5 L18 88 L20 91.5 M42 86.5 L49 87.5 L52 91"
          strokeWidth="2.4"
        />
      </>
    ),
  },
  // Chimney Rock National Historic Site is in Morrill County near Bayard, Nebraska, the best-known landmark of the Oregon Trail, and it is on Nebraska's state quarter.
  'nebraska-chimney-rock': {
    subject: 'Chimney Rock',
    scopes: ['region:US:Nebraska'],
    ink: [0.3, 7.8, 99.4, 83.9],
    draw: (id) => (
      <>
        <defs>
          <mask id={`${id}-wagon`}>
            <rect width="100" height="100" fill="#fff" />
            <path
              d="M14 82 L10 70 C 12 67.5, 15 68, 17 69 C 21 66.5, 29 66.5, 33 69 C 35 68, 38 67.5, 40 70 L36 82 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="7"
            />
          </mask>
        </defs>
        <g mask={`url(#${id}-wagon)`}>
          <path d="M6 74 C 18 72, 28 67, 33 60 C 37 54, 39.5 50, 42.5 48" />
          <path d="M2 74 H98" strokeWidth="2.4" />
        </g>
        <path d="M58 48 C 61 50, 63 54, 67 60 C 72 67, 82 72, 94 74" />
        <path
          d="M44.5 53 L43 60 M55.5 53 L57 60 M39 63 L36.5 69.5 M50 59 V64 M61 63 L63.5 69.5"
          strokeWidth="2.4"
        />
        <path d="M42 48 L43 36 L44 24 L45 16 L46 11.5 C 47 9.5, 49.5 9, 50.5 10.5 L52 9.5 C 54 10, 55 13, 55 15 L56 26 L57 38 L58 48" />
        <path d="M44.5 24 H55.5 M43.5 37 H56.5" strokeWidth="1.8" />
        <path d="M2 90 H98" />
        <path d="M14 82 H36" strokeWidth="2.4" />
        <path
          d="M14 82 L10 70 C 12 67.5, 15 68, 17 69 C 21 66.5, 29 66.5, 33 69 C 35 68, 38 67.5, 40 70 L36 82"
          strokeWidth="2.4"
        />
        <path d="M19.5 69 V81 M30.5 69 V81" strokeWidth="1.8" />
        <circle cx="17" cy="86.5" r="3.5" strokeWidth="2.4" />
        <circle cx="32" cy="85.5" r="4.5" strokeWidth="2.4" />
        <path d="M13 84 L6 88" strokeWidth="2.4" />
        <path d="M74 89 L71.5 84 M79 89 V83 M84 89 L86.5 84" strokeWidth="2.4" />
      </>
    ),
  },
  // Hoover Dam spans Black Canyon of the Colorado River on the state line between Clark County, Nevada and Mohave County, Arizona.
  'nevada-hoover-dam': {
    subject: 'Hoover Dam',
    scopes: ['region:US:Nevada', 'region:US:Arizona'],
    ink: [0.3, 4.2, 99.4, 86.3],
    draw: (id) => (
      <>
        <defs>
          <mask id={`${id}-face`}>
            <rect width="100" height="100" fill="#000" />
            <path
              d="M24 42 C 38 39, 62 39, 76 42 L73 52 L70 60 L68 67 H32 L30 60 L27 52 Z"
              fill="#fff"
              stroke="#000"
              strokeWidth="6"
            />
          </mask>
        </defs>
        <g mask={`url(#${id}-face)`}>
          <path
            d="M27 68 L22 63 M33.4 68 L22 56.6 M39.8 68 L22 50.2 M46.2 68 L22 43.8 M52.6 68 L22 37.4 M59 68 L28 37 M65.4 68 L34.4 37 M71.8 68 L40.8 37 M78.2 68 L47.2 37 M80 63.4 L53.6 37 M80 57 L60 37 M80 50.6 L66.4 37 M80 44.2 L72.8 37 M80 37.8 L79.2 37"
            strokeWidth="1.8"
          />
        </g>
        <path d="M24 37 L25 44 L27 52 L30 60 L32 67" />
        <path d="M76 37 L75 44 L73 52 L70 60 L68 67" />
        <path
          d="M5 7 H9 L10 13 L13 14 L14 20 L17 22 L17 24 L14 31 L15 40 L11 45 L13 53 L12 60 L16 66 V71"
          strokeWidth="2.4"
        />
        <path
          d="M95 7 H91 L90 13 L87 14 L86 20 L83 22 L83 24 L86 31 L85 40 L89 45 L87 53 L88 60 L84 66 V71"
          strokeWidth="2.4"
        />
        <path d="M17 24 H83 M17 24 L21 29 L24 37 M83 24 L79 29 L76 37" strokeWidth="2.4" />
        <path
          d="M37 28.8 C 40 27, 43 30.6, 46 28.8 S 52 27, 55 28.8 S 61 30.6, 64 28.8"
          strokeWidth="2.4"
        />
        <path d="M23 24 V12 M31 24 V10 M69 24 V10 M77 24 V12" strokeWidth="2.4" />
        <path
          d="M20.5 12 H25.5 V9 H24.4 V7 H21.6 V9 H20.5 Z M28.5 10 H33.5 V7 H32.4 V5 H29.6 V7 H28.5 Z M66.5 10 H71.5 V7 H70.4 V5 H67.6 V7 H66.5 Z M74.5 12 H79.5 V9 H78.4 V7 H75.6 V9 H74.5 Z"
          fill="currentColor"
          strokeWidth="1.6"
        />
        <path d="M24 37 C 38 34, 62 34, 76 37" />
        <path d="M24.5 41.5 C 38 38.5, 62 38.5, 75.5 41.5" strokeWidth="2.4" />
        <path d="M16 80 V71 L32 67 H44 V80 M84 80 V71 L68 67 H56 V80" />
        <rect x="22" y="73" width="4" height="4.5" fill="currentColor" stroke="none" />
        <rect x="32" y="73" width="4" height="4.5" fill="currentColor" stroke="none" />
        <rect x="64" y="73" width="4" height="4.5" fill="currentColor" stroke="none" />
        <rect x="74" y="73" width="4" height="4.5" fill="currentColor" stroke="none" />
        <path d="M2 80 H16 M84 80 H98" />
        <path d="M46 75 C 48 73, 50 77, 52 75 S 54 73, 55 74" strokeWidth="2.4" />
        <path
          d="M28 87 C 32 84, 36 90, 40 87 S 48 84, 52 87 S 60 90, 64 87 S 70 85, 72 86"
          strokeWidth="2.4"
        />
      </>
    ),
  },
  // The Mount Washington Cog Railway climbs the western slope of Mount Washington in Coos County, New Hampshire, from Marshfield Base Station to the summit.
  'new-hampshire-mount-washington': {
    subject: 'Mount Washington Cog Railway',
    scopes: ['region:US:New Hampshire'],
    ink: [2.3, 9.1, 96.9, 82.6],
    draw: (_id) => (
      <>
        <path d="M4.0 90.0 L 96.0 48.0" />
        <path d="M62 65.3 V82.6 M74 59.8 V80.7 M86 54.4 V78.7" strokeWidth="2.4" />
        <path d="M50 86.0 L 98 78.3" strokeWidth="2.4" />
        <path d="M7.7 81.2 L 39.5 66.6" />
        <circle cx="14.5" cy="81.7" r="3.2" strokeWidth="2.4" />
        <circle cx="35.4" cy="72.1" r="3.2" strokeWidth="2.4" />
        <rect x="14.5" y="53.9" width="24" height="12" rx="5" />
        <path d="M20.5 67.4 V73.8" strokeWidth="2.4" />
        <path d="M31.5 53.9 L 30.0 45.9 H37.0 L 35.5 53.9" strokeWidth="2.4" />
        <path
          d="M33.5 40.9 C 32.5 34.9, 27.5 30.9, 22.5 27.9 S 15.5 20.9, 9.5 17.9"
          strokeWidth="2.4"
          strokeDasharray="0.1 4.5"
        />
        <path d="M8.2 80.0 V47.9 H14.0 V77.3" />
        <path d="M5.7 45.4 H16.5" strokeWidth="2.4" />
        <rect x="8.6" y="51.9" width="5" height="6" fill="currentColor" stroke="none" />
        <path d="M43.1 65.0 L 75.9 50.0 V35.0 L 43.1 50.0 Z" strokeWidth="2.4" />
        <rect x="47.7" y="51.5" width="4.5" height="5" fill="currentColor" stroke="none" />
        <rect x="54.2" y="48.5" width="4.5" height="5" fill="currentColor" stroke="none" />
        <rect x="60.8" y="45.5" width="4.5" height="5" fill="currentColor" stroke="none" />
        <rect x="67.3" y="42.5" width="4.5" height="5" fill="currentColor" stroke="none" />
        <path d="M45.9 63.7 L 47.8 68.0 M73.2 51.3 L 75.1 55.6" strokeWidth="1.8" />
        <path
          d="M52 27 C 60 22, 66 14, 72 11 C 77 9, 80 12, 84 16 C 88 20, 92 22, 96 23"
          strokeWidth="2.4"
        />
      </>
    ),
  },
  // Lucy the Elephant, the six-storey elephant-shaped building from 1881, stands on the beach at 9200 Atlantic Avenue in Margate City, Atlantic County, New Jersey.
  'new-jersey-lucy': {
    subject: 'Lucy the Elephant, Margate',
    scopes: ['city:us-new-jersey-margate-city'],
    ink: [2.3, 5.5, 95.4, 84.2],
    draw: (_id) => (
      <>
        <path d="M4 88 H96" />
        <path d="M18 50 C 17 40, 26 34, 40 34 C 50 34, 60 35, 64 34 C 67 31, 70 30, 74 30 C 82 30, 87 35, 87 42 C 87 47, 86 50, 85 54 C 84 64, 85 74, 90 80 C 92 83, 96 83, 96 79 M 90.5 77 C 84 71, 79 63, 79 56 C 77 59, 75 61, 73 62 V 88 H 60 V 67 C 52 69, 43 69, 35 67 V 88 H 22 V 64 C 19 61, 18 56, 18 50" />
        <path d="M90.5 77 C 93 76, 96 77, 96 79" strokeWidth="2.4" />
        <path d="M45 68.5 V88 H52 V68.5" strokeWidth="2.4" />
        <path d="M74 35 C 66 37, 64 50, 70 57 C 74 59, 78 55, 78 49" strokeWidth="2.4" />
        <circle cx="81" cy="39" r="1.8" fill="currentColor" stroke="none" />
        <path d="M18 51 C 14 55, 14 60, 15 64" strokeWidth="2.4" />
        <path d="M35 34 V30 H57 V34.5" strokeWidth="2.4" />
        <path d="M38 30 V23 M46 30 V23 M54 30 V23" strokeWidth="2.4" />
        <path d="M33 23 H59 C 56 20, 51 16, 46 14 C 41 16, 36 20, 33 23 Z" />
        <path d="M46 14 V9" strokeWidth="2.4" />
        <circle cx="46" cy="7.5" r="2" fill="currentColor" stroke="none" />
        <path d="M27 50 V46 A2.25 2.25 0 0 1 31.5 46 V50 Z" fill="currentColor" stroke="none" />
        <path d="M37 50 V46 A2.25 2.25 0 0 1 41.5 46 V50 Z" fill="currentColor" stroke="none" />
        <path d="M47 50 V46 A2.25 2.25 0 0 1 51.5 46 V50 Z" fill="currentColor" stroke="none" />
        <path d="M57 50 V46 A2.25 2.25 0 0 1 61.5 46 V50 Z" fill="currentColor" stroke="none" />
      </>
    ),
  },
  // The Albuquerque International Balloon Fiesta is held every October in Albuquerque, New Mexico, and its balloons rise in front of the Sandia Mountains along the city's eastern edge.
  'new-mexico-balloons': {
    subject: 'Balloons over the Sandias',
    scopes: ['city:us-new-mexico-albuquerque'],
    ink: [0.8, 5.8, 98.4, 82.9],
    draw: (id) => (
      <>
        <defs>
          <mask id={`${id}-cut`}>
            <rect width="100" height="100" fill="#fff" stroke="none" />
            <path
              d="M53 66 C 45 58, 39 49, 39 40 C 39 28, 48 20, 60 20 C 72 20, 81 28, 81 40 C 81 49, 75 58, 67 66 L 64 72 V 77 H 56 V 72 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="7"
            />
          </mask>
        </defs>
        <path
          d="M2 74 L 6 68 L 11 62 L 16 57 L 21 59 L 26 54 L 32 57 L 38 56 L 46 60 L 58 65 L 72 70 L 86 74 L 98 76"
          strokeWidth="2.4"
          mask={`url(#${id}-cut)`}
        />
        <path d="M11 62 L 13 70 M21 59 L 22 66 M32 57 L 31 64" strokeWidth="1.8" />
        <path d="M4 87 H96" />
        <path d="M53 66 C 45 58, 39 49, 39 40 C 39 28, 48 20, 60 20 C 72 20, 81 28, 81 40 C 81 49, 75 58, 67 66 Z" />
        <path d="M60 20 C 51 26, 49 50, 56 66 M60 20 C 69 26, 71 50, 64 66" strokeWidth="2.4" />
        <path d="M54 66 L 57 72 M66 66 L 63 72" strokeWidth="1.8" />
        <rect x="56" y="72" width="8" height="5" rx="1" fill="currentColor" strokeWidth="1.8" />
        <path d="M18 39 C 14 35, 11 31, 11 25 C 11 18, 15 13, 22 13 C 29 13, 33 18, 33 25 C 33 31, 30 35, 26 39 Z" />
        <path d="M22 13 C 17 18, 17 32, 20 39 M22 13 C 27 18, 27 32, 24 39" strokeWidth="2.4" />
        <path d="M19 39 L 20.5 43 M25 39 L 23.5 43" strokeWidth="1.8" />
        <rect x="19.5" y="43" width="5" height="4" rx="0.8" fill="currentColor" strokeWidth="1.6" />
        <path
          d="M86 22 C 83.5 19.5, 82 17, 82 14 C 82 10, 84.5 7, 88 7 C 91.5 7, 94 10, 94 14 C 94 17, 92.5 19.5, 90 22 Z"
          strokeWidth="2.4"
        />
        <path d="M88 7 V22" strokeWidth="1.6" />
        <rect x="86.5" y="24.5" width="3" height="3" fill="currentColor" strokeWidth="1.6" />
      </>
    ),
  },
  // The Wright brothers made the first powered flights on 17 December 1903 at Kill Devil Hills near Kitty Hawk, Dare County, North Carolina, now the Wright Brothers National Memorial.
  'north-carolina-wright-flyer': {
    subject: 'Wright Flyer, Kitty Hawk',
    scopes: ['region:US:North Carolina'],
    ink: [0.3, 10.3, 99.4, 79.5],
    draw: (_id) => (
      <>
        <rect x="6" y="38" width="88" height="14" rx="2" />
        <rect x="37" y="12" width="26" height="7" rx="1.5" />
        <path d="M44 38 L 46 19 M56 38 L 54 19" strokeWidth="2.4" />
        <path d="M40 52 L 46 66 M60 52 L 54 66" strokeWidth="2.4" />
        <path d="M46 63 V72 M54 63 V72" />
        <path d="M21 58.5 H37 M63 58.5 H79" strokeWidth="2.4" />
        <path
          d="M14 38 V52 M22 38 V52 M30 38 V52 M70 38 V52 M78 38 V52 M86 38 V52"
          strokeWidth="1.6"
        />
        <ellipse cx="42.5" cy="45" rx="2.3" ry="2.3" fill="currentColor" stroke="none" />
        <rect x="53.2" y="42.7" width="4.6" height="4.6" rx="1" fill="currentColor" stroke="none" />
        <path d="M2 88 C 18 82, 34 80, 52 83 C 68 86, 84 90, 98 87" />
      </>
    ),
  },
  // Theodore Roosevelt National Park lies in the North Dakota badlands of Billings and McKenzie counties, along the Little Missouri River. Its buttes show banded clay and sandstone layers with dark lignite coal seams.
  'north-dakota-badlands': {
    subject: 'Badlands buttes, Theodore Roosevelt National Park',
    scopes: ['region:US:North Dakota'],
    ink: [0.3, 30, 99.4, 65.2],
    draw: (id) => (
      <>
        <defs>
          <mask id={`${id}-in`}>
            <rect width="100" height="100" fill="#000" />
            <path
              d="M4 82 C 10 80, 13 74, 14 66 C 15 58, 16 54, 17 50 V 44 H 33 V 50 C 35 55, 37 60, 40 64 C 41 66, 43 66, 44 64 C 46 56, 47 46, 49.5 37 C 51.5 30, 58.5 30, 60.5 37 C 62 44, 64 54, 66 60 C 67 63, 69 63, 70 61 C 72 55, 75 49, 80 49 C 85 49, 88 54, 89 60 C 90 70, 91 79, 96 82 Z"
              fill="#fff"
            />
          </mask>
        </defs>
        <g mask={`url(#${id}-in)`}>
          <path d="M4 52 C 24 51, 40 53, 60 51.5 S 84 52, 96 51" strokeWidth="2.4" />
          <path d="M4 58 C 24 57, 40 59, 60 57.5 S 84 58, 96 57" strokeWidth="2.4" />
          <path
            d="M4 63.2 C 24 62.2, 40 64.2, 60 62.7 S 84 63.2, 96 62.2 V 66 C 84 67, 72 66.2, 60 66.5 S 24 66, 4 67 Z"
            fill="currentColor"
            stroke="none"
          />
          <path d="M4 73 C 24 72, 40 74, 60 72.5 S 84 73, 96 72" strokeWidth="2.4" />
        </g>
        <path d="M4 82 C 10 80, 13 74, 14 66 C 15 58, 16 54, 17 50 V 44 H 33 V 50 C 35 55, 37 60, 40 64 C 41 66, 43 66, 44 64 C 46 56, 47 46, 49.5 37 C 51.5 30, 58.5 30, 60.5 37 C 62 44, 64 54, 66 60 C 67 63, 69 63, 70 61 C 72 55, 75 49, 80 49 C 85 49, 88 54, 89 60 C 90 70, 91 79, 96 82" />
        <path d="M14 44 H 36" />
        <path d="M2 82 H 98" />
        <path d="M8 89 C 14 87, 20 87, 26 89 S 38 91, 44 89" strokeWidth="2.4" />
        <path d="M56 89 C 62 87, 68 87, 74 89 S 86 91, 92 89" strokeWidth="2.4" />
        <path d="M30 94 H 70" strokeWidth="2.4" />
      </>
    ),
  },
  // The Ohio buckeye (Aesculus glabra) has been Ohio's state tree since 1953, and Ohio is nicknamed the Buckeye State after its nut.
  'ohio-buckeye': {
    subject: 'Ohio buckeye nut and leaf',
    scopes: ['region:US:Ohio'],
    ink: [11.3, 9.5, 79.6, 80.7],
    draw: (id) => (
      <>
        <defs>
          <mask id={`${id}-nut`}>
            <rect width="100" height="100" fill="#fff" stroke="none" />
            <circle cx="33" cy="68" r="20" fill="#000" stroke="none" />
          </mask>
          <mask id={`${id}-shell`}>
            <circle cx="33" cy="68" r="15" fill="#fff" stroke="none" />
            <ellipse
              cx="28"
              cy="73"
              rx="9"
              ry="8"
              transform="rotate(-25 28 73)"
              fill="#000"
              stroke="#000"
              strokeWidth="6"
            />
            <path d="M38 57.5 C 41.5 58.5, 44.5 61, 45.8 64.5" stroke="#000" strokeWidth="5" />
          </mask>
        </defs>
        <g transform="translate(-4 1)">
          <g mask={`url(#${id}-nut)`}>
            <path
              transform="rotate(-150 57 46)"
              d="M60 46 C 63 41.5, 70 39.5, 78 40.5 C 84 41.5, 86 44, 88 46 C 86 48, 84 50.5, 78 51.5 C 70 52.5, 63 50.5, 60 46 Z"
            />
            <path
              transform="rotate(-150 57 46)"
              d="M66 46 C 69 45.7, 72 45.7, 76 46"
              strokeWidth="1.8"
            />
            <path
              transform="rotate(-105 57 46)"
              d="M60 46 C 63 41, 72 38.5, 82 39.5 C 89 40.5, 92 44, 94 46 C 92 48, 89 51.5, 82 52.5 C 72 53.5, 63 51, 60 46 Z"
            />
            <path
              transform="rotate(-105 57 46)"
              d="M66 46 C 70 45.6, 74 45.6, 78 46"
              strokeWidth="1.8"
            />
            <path
              transform="rotate(-58 57 46)"
              d="M60 46 C 63 41, 72 38.5, 82 39.5 C 89 40.5, 92 44, 94 46 C 92 48, 89 51.5, 82 52.5 C 72 53.5, 63 51, 60 46 Z"
            />
            <path
              transform="rotate(-58 57 46)"
              d="M66 46 C 70 45.6, 74 45.6, 78 46"
              strokeWidth="1.8"
            />
            <path
              transform="rotate(-12 57 46)"
              d="M60 46 C 63 41, 72 38.5, 82 39.5 C 89 40.5, 92 44, 94 46 C 92 48, 89 51.5, 82 52.5 C 72 53.5, 63 51, 60 46 Z"
            />
            <path
              transform="rotate(-12 57 46)"
              d="M66 46 C 70 45.6, 74 45.6, 78 46"
              strokeWidth="1.8"
            />
            <path
              transform="rotate(32 57 46)"
              d="M60 46 C 63 41.5, 70 39.5, 78 40.5 C 84 41.5, 86 44, 88 46 C 86 48, 84 50.5, 78 51.5 C 70 52.5, 63 50.5, 60 46 Z"
            />
            <path
              transform="rotate(32 57 46)"
              d="M66 46 C 69 45.7, 72 45.7, 76 46"
              strokeWidth="1.8"
            />
            <path d="M57 46 C 58 58, 61 72, 67 88" strokeWidth="2.4" />
          </g>
          <circle cx="33" cy="68" r="16" />
          <path
            mask={`url(#${id}-shell)`}
            d="M25.5 50 L -10.5 86 M31.9 50 L -4.1 86 M38.3 50 L 2.3 86 M44.6 50 L 8.6 86 M51.0 50 L 15.0 86 M57.4 50 L 21.4 86 M63.7 50 L 27.7 86 M70.1 50 L 34.1 86 M76.5 50 L 40.5 86"
            strokeWidth="1.8"
          />
          <ellipse cx="28" cy="73" rx="9" ry="8" transform="rotate(-25 28 73)" strokeWidth="2.4" />
        </g>
      </>
    ),
  },
  // The scissor-tailed flycatcher has been Oklahoma's official state bird since 1951.
  'oklahoma-flycatcher': {
    subject: 'Scissor-tailed flycatcher on a fence wire',
    scopes: ['region:US:Oklahoma'],
    ink: [0.8, 11.3, 98.4, 80.4],
    draw: (id) => (
      <>
        <defs>
          <mask id={`${id}-wire`}>
            <rect width="100" height="100" fill="#fff" stroke="none" />
            <polygon
              points="48.9 37.6 47.9 38.9 46.9 40.3 45.8 41.7 44.6 43.1 43.4 44.5 42.1 46.0 40.7 47.4 39.3 48.9 37.8 50.4 36.3 52.0 34.7 53.5 33.0 55.1 31.3 56.7 29.5 58.4 27.6 60.0 25.7 61.7 23.7 63.4 21.7 65.1 19.6 66.8 17.6 68.8 15.7 70.9 13.7 73.1 11.8 75.4 10.0 78.0 10.0 78.0 12.8 76.6 15.4 75.0 17.8 73.3 20.1 71.6 22.3 69.9 24.3 67.9 26.2 66.0 28.0 64.1 29.8 62.2 31.5 60.4 33.1 58.6 34.8 56.9 36.3 55.2 37.8 53.5 39.3 51.8 40.7 50.2 42.1 48.6 43.4 47.0 44.6 45.5 45.8 44.0 46.9 42.6 48.0 41.2 49.1 39.8 50.1 38.4"
              fill="#000"
              stroke="#000"
              strokeWidth="7"
            />
            <polygon
              points="50.3 39.4 50.1 41.3 49.9 43.1 49.6 45.0 49.2 46.8 48.8 48.7 48.4 50.5 47.9 52.4 47.3 54.2 46.7 56.0 46.1 57.8 45.3 59.6 44.6 61.4 43.8 63.2 42.9 65.0 42.0 66.8 41.0 68.6 40.0 70.3 39.0 72.1 37.9 73.8 37.0 75.7 36.2 77.7 35.4 79.7 34.5 81.7 34.0 84.0 34.0 84.0 35.9 82.6 37.5 81.0 38.9 79.3 40.3 77.6 41.5 75.8 42.4 73.9 43.2 71.9 44.1 70.0 44.8 68.1 45.6 66.2 46.3 64.2 46.9 62.3 47.5 60.4 48.1 58.5 48.6 56.6 49.1 54.7 49.6 52.8 50.0 50.9 50.4 49.0 50.7 47.1 51.0 45.2 51.3 43.3 51.5 41.5 51.7 39.6"
              fill="#000"
              stroke="#000"
              strokeWidth="7"
            />
            <path
              d="M80 21.5 L 73 19 C 71.5 15, 68 13, 64.5 13 C 60 13, 57 16.5, 56.5 21 C 56 27, 53 32, 48.5 37 C 52 40.5, 56 42, 60 42 C 66 42, 70 37, 71.5 31 C 72.5 27.5, 73 25, 73 23 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="6"
            />
          </mask>
        </defs>
        <g mask={`url(#${id}-wire)`}>
          <path d="M2 44 Q 46 47.5, 86 44.5" strokeWidth="2.4" />
          <path d="M2 62 Q 46 65.5, 86 62.5" strokeWidth="2.4" />
        </g>
        <path d="M86 30 V 90" />
        <path d="M86 44.5 L 98 44 M86 62.5 L 98 62" strokeWidth="2.4" />
        <path d="M4 90 H 96" />
        <path d="M80 21.5 L 73 19 C 71.5 15, 68 13, 64.5 13 C 60 13, 57 16.5, 56.5 21 C 56 27, 53 32, 48.5 37 C 52 40.5, 56 42, 60 42 C 66 42, 70 37, 71.5 31 C 72.5 27.5, 73 25, 73 23 Z" />
        <polygon
          points="48.9 37.6 47.9 38.9 46.9 40.3 45.8 41.7 44.6 43.1 43.4 44.5 42.1 46.0 40.7 47.4 39.3 48.9 37.8 50.4 36.3 52.0 34.7 53.5 33.0 55.1 31.3 56.7 29.5 58.4 27.6 60.0 25.7 61.7 23.7 63.4 21.7 65.1 19.6 66.8 17.6 68.8 15.7 70.9 13.7 73.1 11.8 75.4 10.0 78.0 10.0 78.0 12.8 76.6 15.4 75.0 17.8 73.3 20.1 71.6 22.3 69.9 24.3 67.9 26.2 66.0 28.0 64.1 29.8 62.2 31.5 60.4 33.1 58.6 34.8 56.9 36.3 55.2 37.8 53.5 39.3 51.8 40.7 50.2 42.1 48.6 43.4 47.0 44.6 45.5 45.8 44.0 46.9 42.6 48.0 41.2 49.1 39.8 50.1 38.4"
          fill="currentColor"
          strokeWidth="1.6"
        />
        <polygon
          points="50.3 39.4 50.1 41.3 49.9 43.1 49.6 45.0 49.2 46.8 48.8 48.7 48.4 50.5 47.9 52.4 47.3 54.2 46.7 56.0 46.1 57.8 45.3 59.6 44.6 61.4 43.8 63.2 42.9 65.0 42.0 66.8 41.0 68.6 40.0 70.3 39.0 72.1 37.9 73.8 37.0 75.7 36.2 77.7 35.4 79.7 34.5 81.7 34.0 84.0 34.0 84.0 35.9 82.6 37.5 81.0 38.9 79.3 40.3 77.6 41.5 75.8 42.4 73.9 43.2 71.9 44.1 70.0 44.8 68.1 45.6 66.2 46.3 64.2 46.9 62.3 47.5 60.4 48.1 58.5 48.6 56.6 49.1 54.7 49.6 52.8 50.0 50.9 50.4 49.0 50.7 47.1 51.0 45.2 51.3 43.3 51.5 41.5 51.7 39.6"
          fill="currentColor"
          strokeWidth="1.6"
        />
        <path
          d="M60 24 C 63 27, 64.5 32, 62 36 C 59 39.5, 55 40.5, 51.5 40 C 56 36, 59 31, 60 24 Z"
          fill="currentColor"
          strokeWidth="1.6"
        />
        <circle cx="66" cy="19.5" r="1.8" fill="currentColor" stroke="none" />
        <path d="M59 42 L 58 45.5 M64 41 L 64 45.5" strokeWidth="1.8" />
      </>
    ),
  },
  // Crater Lake fills the caldera of Mount Mazama in Crater Lake National Park, Klamath County, Oregon. Wizard Island is the cinder cone rising from its west side, seen at the left from Rim Village.
  'oregon-crater-lake': {
    subject: 'Crater Lake and Wizard Island',
    scopes: ['region:US:Oregon'],
    ink: [0.3, 34.3, 99.4, 53.4],
    draw: (id) => (
      <>
        <defs>
          <mask id={`${id}-front`}>
            <rect width="100" height="100" fill="#fff" stroke="none" />
            <path
              d="M88 36 L 83.5 45 H 86 L 81.5 54 H 84 L 79.5 64 H 82.5 L 78.5 76 H 97.5 L 93.5 64 H 96.5 L 92 54 H 94.5 L 90 45 H 92.5 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="7"
            />
            <path
              d="M2 86 C 16 83, 30 84, 46 85.5 C 62 87, 78 84, 98 85 V 100 H 2 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="6"
            />
          </mask>
          <mask id={`${id}-back`}>
            <rect width="100" height="100" fill="#fff" stroke="none" />
            <path
              d="M88 36 L 83.5 45 H 86 L 81.5 54 H 84 L 79.5 64 H 82.5 L 78.5 76 H 97.5 L 93.5 64 H 96.5 L 92 54 H 94.5 L 90 45 H 92.5 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="7"
            />
            <path
              d="M2 86 C 16 83, 30 84, 46 85.5 C 62 87, 78 84, 98 85 V 100 H 2 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="6"
            />
            <path
              d="M14 68 C 19.5 64, 24 56, 27 46.5 L 30 46.5 L 32 49.5 L 35 49.5 L 37 46.5 L 40 46.5 C 43 56, 47.5 64, 53 68 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="7"
            />
            <path d="M9 68 H 58" stroke="#000" strokeWidth="7" />
          </mask>
        </defs>
        <g mask={`url(#${id}-back)`}>
          <path
            d="M4 41.5 L 9 39 L 15 37.5 L 21 35.5 L 26 36.5 L 32 38.5 L 39 38 L 46 39.5 L 53 38.5 L 60 39.5 L 67 38 L 74 39 L 81 38 L 88 39.5 L 96 40.5"
            strokeWidth="2.4"
          />
          <path
            d="M8 42.5 L 7.5 48 M16 40 L 15 48.5 M23.5 38.5 L 23 46 M34 41.5 L 34.5 48 M45 42 L 44.5 49.5 M56 41.5 L 56.5 47.5 M65 41 L 64.5 49 M75 42 L 75.5 48"
            strokeWidth="1.8"
          />
          <path d="M4 54 H 96" strokeWidth="2.4" />
          <path
            d="M6 59.5 H 10 M47 59.5 H 51 M56 59.5 H 60 M65 59.5 H 69 M74 59.5 H 78"
            strokeWidth="2.4"
          />
          <path d="M60 65.5 H 66 M71 65.5 H 77" strokeWidth="2.4" />
          <path d="M6 74 H 14 M20 74 H 28 M34 74 H 42 M48 74 H 56 M62 74 H 70" strokeWidth="2.4" />
          <path d="M10 80.5 H 21 M28 80.5 H 39 M46 80.5 H 57 M64 80.5 H 75" strokeWidth="2.4" />
        </g>
        <g mask={`url(#${id}-front)`}>
          <path d="M14 68 C 19.5 64, 24 56, 27 46.5 L 30 46.5 L 32 49.5 L 35 49.5 L 37 46.5 L 40 46.5 C 43 56, 47.5 64, 53 68" />
          <path d="M9 68 H 58" strokeWidth="2.4" />
        </g>
        <path d="M2 86 C 16 83, 30 84, 46 85.5 C 62 87, 78 84, 98 85" />
        <path d="M88 36 L 83.5 45 H 86 L 81.5 54 H 84 L 79.5 64 H 82.5 L 78.5 76 H 97.5 L 93.5 64 H 96.5 L 92 54 H 94.5 L 90 45 H 92.5 Z" />
        <path d="M88 76 V 85" />
      </>
    ),
  },
  // The Liberty Bell hangs in the Liberty Bell Center, Independence National Historical Park, 526 Market St, Philadelphia, Pennsylvania.
  'pennsylvania-liberty-bell': {
    subject: 'Liberty Bell',
    scopes: ['city:us-pennsylvania-philadelphia'],
    ink: [7.3, 8.3, 85.4, 81.4],
    draw: (_id) => (
      <>
        <path d="M9 10 H91 L88 22 H12 Z" />
        <path d="M25 16 H75" strokeWidth="1.8" />
        <path d="M18 12.5 V19.5 M82 12.5 V19.5" strokeWidth="1.8" />
        <path d="M40 22 V27 M60 22 V27" strokeWidth="2.4" />
        <path d="M44 21 H56 V27 H44 Z" fill="currentColor" strokeWidth="1.6" />
        <path d="M32 33 C 32 28, 40 26.5, 50 26.5 C 60 26.5, 68 28, 68 33 C 68 52, 71 67, 82 77 C 85.5 80, 86.5 82.5, 84 85 C 72 89, 28 89, 16 85 C 13.5 82.5, 14.5 80, 18 77 C 29 67, 32 52, 32 33 Z" />
        <path d="M32.2 37.5 Q 50 40 67.8 37.5 M32.4 43 Q 50 45.5 67.6 43" strokeWidth="2.4" />
        <path d="M19.5 77 Q 50 82.5 80.5 77" strokeWidth="2.4" />
        <path
          d="M57.5 85.5 L55 79 L58 72 L54.5 65.5 L57.5 59 L55 52.5 L56.5 47.5"
          strokeWidth="2.4"
        />
        <path d="M56 86.5 L58 80 L55.8 75.5 L59 72 Z" fill="currentColor" strokeWidth="1.6" />
      </>
    ),
  },
  // The Rhode Island Red is Rhode Island's official state bird (adopted 1954), a breed developed in the state.
  'rhode-island-red': {
    subject: 'Rhode Island Red hen',
    scopes: ['region:US:Rhode Island'],
    ink: [6.3, 16.7, 87.4, 74],
    draw: (_id) => (
      <>
        <path d="M8 89 H92" />
        <path d="M37 27 C 35 22.5, 28 22, 26 27.5 L 19.5 31.5 L 26 33.5 C 26.5 37, 28 39.5, 30 41.5 C 25.5 47, 23.5 56, 27.5 64 C 32.5 72.5, 44 77, 56 76 C 68 75, 78.5 68, 83 57 C 87 48, 88 38, 85 27 C 80 30, 74 37, 68 43 C 58 47.5, 46 44, 41 37.5 C 39 34, 38 30.5, 37 27 Z" />
        <path
          d="M26 24.5 L 26.5 19 L 29.5 22 L 31.5 17.5 L 33.5 21.5 L 36.5 18.5 L 36.5 24.5 C 33 22.5, 29 22.5, 26 24.5 Z"
          fill="currentColor"
          strokeWidth="1.6"
        />
        <path
          d="M25.5 34.5 C 24 38.5, 26 41.5, 28.5 40 C 29 37.5, 27.5 35.5, 25.5 34.5 Z"
          fill="currentColor"
          strokeWidth="1.6"
        />
        <circle cx="30.5" cy="29" r="1.7" fill="currentColor" stroke="none" />
        <path d="M30 41.5 C 34 45, 38 45, 41 37.5" strokeWidth="2.4" />
        <path
          d="M44 53 C 50 46, 63 46, 71 51 C 73.5 53, 75 56, 76 59 C 72 58, 70 60, 67 62 C 64 60, 62 63, 58 64 C 56 61, 52 63, 49 61 C 46 59, 44 56, 44 53 Z"
          strokeWidth="2.4"
        />
        <path d="M54 55 C 59 53, 64 54, 69 57" strokeWidth="1.8" />
        <path d="M73 41 C 77 36, 80 33, 84 30.5 M76 47 C 79 43, 82 39.5, 86 37" strokeWidth="1.8" />
        <path
          d="M30 52 L 33 54.5 L 36 52 M31 59 L 34 61.5 L 37 59 M37 66 L 40 68.5 L 43 66"
          strokeWidth="1.8"
        />
        <path d="M48 75.5 L 47 86 M58 75.5 L 59 86" strokeWidth="2.4" />
        <path d="M41 88.5 L 47 86 L 52 88.5 M53.5 88.5 L 59 86 L 65 88.5" strokeWidth="2.4" />
      </>
    ),
  },
  // The Angel Oak stands at 3688 Angel Oak Rd on Johns Island, Charleston County, South Carolina, in a park owned by the City of Charleston.
  'south-carolina-angel-oak': {
    subject: 'Angel Oak',
    scopes: ['region:US:South Carolina'],
    ink: [2.3, 29, 95.4, 60.7],
    draw: (_id) => (
      <>
        <path d="M4 88 H96" />
        <path d="M12 45 C 7.5 44, 7.5 39, 11 37.5 C 11 34, 15 32, 19 34 C 21 30.5, 27 30.5, 30 33 C 33 30, 39 30, 42 33 C 45 30, 52 30, 55 33 C 58 30, 64 30, 67 33 C 70 30.5, 76 30.5, 79 33.5 C 83 32, 89 34, 89 37.5 C 92.5 39, 92.5 44, 88 45 C 84 47, 79 45, 75 46 C 71 48, 66 46, 62 47 C 58 48, 54 46, 50 47 C 46 48, 42 46, 38 47 C 34 48, 29 46, 25 46 C 21 47, 16 46, 12 45 Z" />
        <path d="M35 88 C 41 86, 43 81, 43 76 M65 88 C 59 86, 57 81, 57 76" />
        <path d="M43 76 C 39 70, 32 70, 25 71 C 18 72, 13 69, 9 65" />
        <path d="M57 76 C 61 70, 68 69, 74 70 C 80 71, 84 66, 91 64" />
        <path d="M50 71 C 46 63, 40 60, 32 61 C 25 62, 19 58, 14 49" />
        <path d="M50 71 C 54 63, 60 59, 68 60 C 76 61, 81 57, 86 49" />
        <path d="M42 82 C 36 80, 32 87, 26 87 C 20 87, 16 83, 10 82" />
        <path d="M58 81 C 64 79, 70 80, 76 79 C 81 78, 85 76, 88 74" />
        <path d="M33 61 C 30 57, 28 52, 27 47 M67 60 C 70 57, 72 52, 73 47" strokeWidth="2.4" />
        <path d="M40 61 C 41 57, 41 52, 43 48 M60 60 C 59 57, 59 52, 57 48" strokeWidth="2.4" />
        <path
          d="M18 70 V83 M41 63 V72 M61 62 V71 M84 68 V81"
          strokeWidth="2.4"
          strokeDasharray="0.1 4.5"
        />
      </>
    ),
  },
  // The Corn Palace stands at 604 N Main St in Mitchell, South Dakota, and its murals are redone in corn every year.
  'south-dakota-corn-palace': {
    subject: 'Corn Palace, Mitchell',
    scopes: ['city:us-south-dakota-mitchell'],
    ink: [2.3, 17.8, 95.4, 71.9],
    draw: (_id) => (
      <>
        <path d="M4 88 H96" />
        <path d="M11.5 88 V48 M11.5 54 H36 M88.5 88 V48 M88.5 54 H64" />
        <path d="M36 88 V40 H43 V88 M57 88 V40 H64 V88" />
        <path d="M43 60 H57" strokeWidth="2.4" />
        <path d="M5.5 88 V48 H11.5 M94.5 88 V48 H88.5" strokeWidth="2.4" />
        <path d="M34 40 C 32 35, 35 31, 39.5 25.5 C 44 31, 47 35, 45 40 Z M55 40 C 53 35, 56 31, 60.5 25.5 C 65 31, 68 35, 66 40 Z" />
        <path
          d="M5.5 48 C 5.2 45, 6.4 42, 8.5 39.5 C 10.6 42, 11.8 45, 11.5 48 Z M88.5 48 C 88.2 45, 89.4 42, 91.5 39.5 C 93.6 42, 94.8 45, 94.5 48 Z"
          strokeWidth="2.4"
        />
        <path d="M39.5 33 V40 M60.5 33 V40" strokeWidth="1.8" />
        <path
          d="M39.5 25.5 V19 M60.5 25.5 V19 M8.5 39.5 V34.5 M91.5 39.5 V34.5"
          strokeWidth="2.4"
        />
        <path d="M46.5 88 V80 A3.5 3.5 0 0 1 53.5 80 V88 Z" fill="currentColor" stroke="none" />
        <path
          d="M20.75 78 C 20.25 70, 20.75 62, 22.75 59 C 23.25 58.4, 24.25 58.4, 24.75 59 C 26.75 62, 27.25 70, 26.75 78"
          strokeWidth="2.4"
        />
        <path
          d="M23.75 84 C 19.75 82, 16.95 76, 16.55 67 C 19.35 70, 22.25 76, 23.75 84 Z M23.75 84 C 27.75 82, 30.55 76, 30.95 67 C 28.15 70, 25.25 76, 23.75 84 Z"
          fill="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M73.25 78 C 72.75 70, 73.25 62, 75.25 59 C 75.75 58.4, 76.75 58.4, 77.25 59 C 79.25 62, 79.75 70, 79.25 78"
          strokeWidth="2.4"
        />
        <path
          d="M76.25 84 C 72.25 82, 69.45 76, 69.05 67 C 71.85 70, 74.75 76, 76.25 84 Z M76.25 84 C 80.25 82, 83.05 76, 83.45 67 C 80.65 70, 77.75 76, 76.25 84 Z"
          fill="currentColor"
          strokeWidth="1.8"
        />
      </>
    ),
  },
  // Nashville's full-scale Parthenon replica stands in Centennial Park, Nashville, Tennessee (2500 West End Ave), and is the city's best-known landmark.
  'tennessee-parthenon': {
    subject: 'The Parthenon, Nashville',
    scopes: ['city:us-tennessee-nashville'],
    ink: [0.3, 15.8, 99.4, 75.9],
    draw: (_id) => (
      <>
        <path d="M2 90 H98" />
        <path d="M9 90 V84 H91 V90" strokeWidth="2.4" />
        <path d="M12 84 V78 H88 V84" strokeWidth="2.4" />
        <path d="M15 78 V48.5 M25 78 V48.5 M35 78 V48.5 M45 78 V48.5 M55 78 V48.5 M65 78 V48.5 M75 78 V48.5 M85 78 V48.5" />
        <path
          d="M12 48.5 H18 M22 48.5 H28 M32 48.5 H38 M42 48.5 H48 M52 48.5 H58 M62 48.5 H68 M72 48.5 H78 M82 48.5 H88"
          strokeWidth="2.4"
        />
        <path d="M9 46.5 H91" />
        <path d="M10 46.5 V32 M90 46.5 V32" strokeWidth="2.4" />
        <path d="M10 40.5 H90" strokeWidth="2.4" />
        <path
          d="M15 36.8 V35.8 M25 36.8 V35.8 M35 36.8 V35.8 M45 36.8 V35.8 M55 36.8 V35.8 M65 36.8 V35.8 M75 36.8 V35.8 M85 36.8 V35.8"
          strokeWidth="1.8"
        />
        <path d="M6 32 H94 L50 17.5 Z" />
      </>
    ),
  },
  // Delicate Arch is in Arches National Park near Moab, Utah, and it appears on Utah's standard license plate.
  'utah-delicate-arch': {
    subject: 'Delicate Arch',
    scopes: ['region:US:Utah'],
    ink: [0.3, 17.6, 99.4, 79.1],
    draw: (id) => (
      <>
        <defs>
          <mask id={`${id}-cut`}>
            <rect width="100" height="100" fill="#fff" />
            <path
              d="M28 79 C 32.5 78, 35 76, 35 72.5 C 35 69, 30 66, 27 61 C 22.5 54, 22 43, 25.5 35 C 29 26, 36 20.5, 45 19.5 C 56 18.5, 67 22.5, 75 25.5 C 81.5 28, 82.5 36, 82 46 C 81.5 57, 82 68, 84 79 Z M44 79 C 41.5 77, 41 75, 41 72.5 C 41 68, 45.5 63, 46 55 C 46.5 46, 51 37.5, 58.5 33 C 64 29.5, 71 30.5, 74 35 C 76.5 39, 76.5 45, 76 52 C 75.5 61, 75.5 70, 76.5 79 Z"
              fillRule="evenodd"
              fill="#000"
              stroke="#000"
              strokeWidth="7"
            />
          </mask>
          <mask id={`${id}-rock`}>
            <path
              d="M28 79 C 32.5 78, 35 76, 35 72.5 C 35 69, 30 66, 27 61 C 22.5 54, 22 43, 25.5 35 C 29 26, 36 20.5, 45 19.5 C 56 18.5, 67 22.5, 75 25.5 C 81.5 28, 82.5 36, 82 46 C 81.5 57, 82 68, 84 79 Z M44 79 C 41.5 77, 41 75, 41 72.5 C 41 68, 45.5 63, 46 55 C 46.5 46, 51 37.5, 58.5 33 C 64 29.5, 71 30.5, 74 35 C 76.5 39, 76.5 45, 76 52 C 75.5 61, 75.5 70, 76.5 79 Z"
              fillRule="evenodd"
              fill="#fff"
              stroke="#000"
              strokeWidth="9"
            />
          </mask>
        </defs>
        <g mask={`url(#${id}-cut)`}>
          <path d="M4 62 L10 57 L16 60 L22 55" strokeWidth="2.4" strokeDasharray="0.1 4.5" />
          <path
            d="M44 64 C 52 63, 60 61, 68 60 L76 57"
            strokeWidth="2.4"
            strokeDasharray="0.1 4.5"
          />
          <path d="M82 52 L88 46 L96 54" strokeWidth="2.4" strokeDasharray="0.1 4.5" />
        </g>
        <path
          d="M-60.0 100 L40.0 0 M-53.6 100 L46.4 0 M-47.3 100 L52.7 0 M-40.9 100 L59.1 0 M-34.5 100 L65.5 0 M-28.2 100 L71.8 0 M-21.8 100 L78.2 0 M-15.5 100 L84.5 0 M-9.1 100 L90.9 0 M-2.7 100 L97.3 0 M3.6 100 L103.6 0 M10.0 100 L110.0 0 M16.4 100 L116.4 0 M22.7 100 L122.7 0 M29.1 100 L129.1 0 M35.5 100 L135.5 0 M41.8 100 L141.8 0 M48.2 100 L148.2 0 M54.6 100 L154.6 0 M60.9 100 L160.9 0 M67.3 100 L167.3 0 M73.6 100 L173.6 0"
          strokeWidth="1.8"
          mask={`url(#${id}-rock)`}
        />
        <path d="M2 87 C 11 86, 17 80, 26 79 H 84 C 90 79, 94 83, 98 84" />
        <path d="M28 79 C 32.5 78, 35 76, 35 72.5 C 35 69, 30 66, 27 61 C 22.5 54, 22 43, 25.5 35 C 29 26, 36 20.5, 45 19.5 C 56 18.5, 67 22.5, 75 25.5 C 81.5 28, 82.5 36, 82 46 C 81.5 57, 82 68, 84 79" />
        <path d="M44 79 C 41.5 77, 41 75, 41 72.5 C 41 68, 45.5 63, 46 55 C 46.5 46, 51 37.5, 58.5 33 C 64 29.5, 71 30.5, 74 35 C 76.5 39, 76.5 45, 76 52 C 75.5 61, 75.5 70, 76.5 79" />
        <path d="M18 91.5 C 32 89.5, 42 89, 50 89 C 58 89, 68 89.5, 82 91.5" strokeWidth="2.4" />
        <path d="M30 95.5 C 36 94.6, 42 94.2, 47 94" strokeWidth="2.4" />
        <path d="M53 94 C 58 94.2, 64 94.6, 70 95.5" strokeWidth="2.4" />
      </>
    ),
  },
  // Vermont is the top maple-syrup producer in the US, and the sugar maple is its official state tree; a spile with a hanging sap pail is the traditional sugaring setup.
  'vermont-sugar-maple': {
    subject: 'Sugar maple with a sap bucket',
    scopes: ['region:US:Vermont'],
    ink: [0.3, 5.8, 99.4, 88.4],
    draw: (id) => (
      <>
        <defs>
          <mask id={`${id}-cut`}>
            <rect width="100" height="100" fill="#fff" />
            <path d="M53 57 L56.5 82.5 H73.5 L77 57 Z" fill="#000" stroke="#000" strokeWidth="7" />
            <path
              d="M53 57 C 53 48, 58 42.5, 65 42.5 C 72 42.5, 77 48, 77 57"
              stroke="#000"
              strokeWidth="6"
            />
          </mask>
        </defs>
        <g mask={`url(#${id}-cut)`}>
          <path d="M28 88 C 32 80, 34 70, 34 54 C 34 46, 31 40, 24 33" />
          <path d="M50 88 C 47 80, 46 70, 46 54 C 46 46, 50 40, 58 33" />
        </g>
        <path d="M34 50 C 36 42, 40 36, 41 26" />
        <path d="M24 33 L14 26 M24 33 L20 17 M41 26 L36 11 M41 26 L49 13 M58 33 L64 19 M58 33 L75 27" />
        <path
          d="M17 28 L8 31 M20 17 L16 9 M49 13 L55 7 M64 19 L62 9 M75 27 L83 20 M75 27 L88 31"
          strokeWidth="2.4"
        />
        <path d="M47 39.5 L64.5 43" />
        <path d="M53 57 C 53 48, 58 42.5, 65 42.5 C 72 42.5, 77 48, 77 57" strokeWidth="2.4" />
        <path d="M51.5 57 H78.5 M53 57 L56.5 82.5 H73.5 L77 57" />
        <path d="M54.1 63.5 H75.9" strokeWidth="2.4" />
        <path
          d="M65 46.5 C 66.5 48.3, 67.2 49.6, 67.2 50.7 A 2.2 2.2 0 0 1 62.8 50.7 C 62.8 49.6, 63.5 48.3, 65 46.5 Z"
          fill="currentColor"
          strokeWidth="1.6"
        />
        <path d="M2 88 C 14 86, 22 88, 28 88 H 50 C 62 88, 78 85, 98 87" />
        <path d="M10 93 C 22 91, 30 92, 40 93 M58 93 C 68 91, 80 91, 90 93" strokeWidth="2.4" />
      </>
    ),
  },
  // Mount Rainier is in Mount Rainier National Park, Pierce County, Washington. It is the state's highest peak and appears on Washington's standard license plate and its state quarter.
  'washington-rainier': {
    subject: 'Mount Rainier',
    scopes: ['region:US:Washington'],
    ink: [0.3, 12.3, 99.4, 77.9],
    draw: (id) => (
      <>
        <defs>
          <mask id={`${id}-trees`}>
            <rect width="100" height="100" fill="#fff" />
            <path
              d="M14 40 L6 70 H22 Z M26 52 L21 70 H31 Z M85 44 L78 70 H92 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="7"
            />
          </mask>
        </defs>
        <g mask={`url(#${id}-trees)`}>
          <path d="M3 64 C 12 57, 19 48, 26 37 C 30 30, 34 24, 38 20 C 40.5 18, 42.5 18, 44.5 16.5 C 46.5 15, 49 14, 52 14 C 55 14, 57 15.5, 59 17 C 61 18.5, 63 18.5, 65 20.5 C 67 22.5, 68.5 25, 70 27.5 L 73.5 26 L 76.5 31 C 83 41, 90 54, 97 62" />
          <path
            d="M26.5 38 L32 48 L36 43 L41 54 L46 45 L51.5 57 L57 46 L61 51 L65.5 43 L70.5 50 L77.5 37"
            strokeWidth="2.4"
          />
          <path d="M40 25 L36.5 31 M64 25 L67.5 31" strokeWidth="1.8" />
          <path
            d="M3 66 C 10 64, 16 61, 22 61 C 30 61, 34 64, 40 64 M60 64 C 68 64, 74 61, 80 61 C 88 61, 92 63, 97 65"
            strokeWidth="2.4"
          />
        </g>
        <path d="M14 40 L11 48 H13 L8 57 H10.5 L6 67 H22 L17.5 57 H20 L15 48 H17 Z" />
        <path d="M26 52 L23.5 58.5 H25 L21.5 67 H30.5 L27 58.5 H28.5 Z" strokeWidth="2.4" />
        <path d="M85 44 L82 51 H84 L79.5 59 H82 L78 67 H92 L88 59 H90.5 L86 51 H88 Z" />
        <path d="M14 67 V70 M26 67 V70 M85 67 V70" />
        <path d="M2 70 H98" />
        <path d="M24 77 H76 M34 83 H66 M44 89 H56" strokeWidth="2.4" />
        <path d="M6 77 H16 M84 77 H94" strokeWidth="2.4" />
      </>
    ),
  },
  // The New River Gorge Bridge carries US 19 over the New River near Fayetteville, Fayette County, West Virginia, and is the subject of West Virginia's 2005 state quarter.
  'west-virginia-new-river-gorge': {
    subject: 'New River Gorge Bridge',
    scopes: ['region:US:West Virginia'],
    ink: [0.8, 22.3, 98.4, 73.8],
    draw: (_id) => (
      <>
        <path d="M2 32 L17 62 L36 88 M98 32 L83 62 L64 88" strokeWidth="2.4" />
        <path d="M4 24 H96" />
        <path d="M7 28.5 H93" strokeWidth="2.4" />
        <path d="M17 62 Q 50 12 83 62" />
        <path d="M19 57 Q 50 3 81 57" />
        <path
          d="M17 62 L24 49 L31 45.3 L38 34 L44 37.8 L50 30 L56 37.8 L62 34 L69 45.3 L76 49 L83 62"
          strokeWidth="1.6"
        />
        <path d="M31 28.5 V40.1 M38 28.5 V34 M62 28.5 V34 M69 28.5 V40.1" strokeWidth="2.4" />
        <path
          d="M9 28.5 V46 M15.5 28.5 V59 M24 28.5 V49 M91 28.5 V46 M84.5 28.5 V59 M76 28.5 V49"
          strokeWidth="2.4"
        />
        <path
          d="M3 44 L12 62 L24 78 M97 44 L88 62 L76 78"
          strokeWidth="2.4"
          strokeDasharray="0.1 4.5"
        />
        <path d="M28 88 H72" />
        <path d="M36 94 C 40 91, 44 97, 48 94 S 56 91, 60 94" strokeWidth="2.4" />
      </>
    ),
  },
  // Wisconsin calls itself America's Dairyland (the slogan on its licence plates) and made the dairy cow its official state domestic animal in 1971; the Holstein is the main breed in its herds.
  'wisconsin-holstein': {
    subject: 'Holstein cow',
    scopes: ['region:US:Wisconsin'],
    ink: [2.3, 25.2, 95.4, 67],
    draw: (_id) => (
      <>
        <path d="M25 29 C 30 30, 33 32, 37 32 H71 C 75 32, 78 32, 80 34 C 83 38, 83 46, 81 54 C 80 60, 79 72, 80 84 H75 C 75 76, 74 70, 73 65 C 72 70, 68 71, 64 70 C 61 69, 60 66, 59 63 C 54 64, 50 64, 45 63 C 44 70, 44 78, 44 84 H39 C 39 76, 38 68, 36 63 C 33 61, 30 58, 29 54 C 28 51, 27 49, 25.5 48 C 22 50, 18 52, 13 52 C 9.5 52, 7.5 50, 8 47 C 10 41, 14 34, 18 30 C 20 28.5, 22.5 28.5, 25 29 Z" />
        <path d="M24 31.5 C 27 27.5, 31 26, 34 26.5 C 33 30, 29 32.5, 25 33.5" strokeWidth="2.4" />
        <path d="M80 35 C 84 40, 86 50, 86 64" strokeWidth="2.4" />
        <path
          d="M86 63 C 88 66, 88 70, 86 72 C 84 70, 84 66, 86 63 Z"
          fill="currentColor"
          strokeWidth="1.8"
        />
        <path d="M51 63.5 V84" strokeWidth="2.4" />
        <path d="M64 70 V74 M68.5 70.5 V74" strokeWidth="1.8" />
        <path
          d="M37 32 H47 C 48 36, 50 39, 49 43 C 48 47, 45 49, 43 53 C 40 54, 37 51, 37.5 47 C 35 44, 35.5 38, 37 32 Z"
          fill="currentColor"
          stroke="none"
        />
        <path
          d="M56 32 H66 C 67 37, 64 39, 66 43 C 68 48, 64 54, 59 55 C 55 55, 53 51, 55 47 C 56 43, 53 39, 56 32 Z"
          fill="currentColor"
          stroke="none"
        />
        <path
          d="M73 39 C 76 37, 79.5 40, 79 45 C 78.5 50, 77 52, 74 51 C 72 49, 75 45, 73 39 Z"
          fill="currentColor"
          stroke="none"
        />
        <circle cx="19" cy="37" r="1.8" fill="currentColor" stroke="none" />
        <path d="M11 46.5 L13 47.5" strokeWidth="1.8" />
        <path d="M4 84 H96" />
        <path d="M18 91 H42 M58 91 H82" strokeWidth="2.4" />
      </>
    ),
  },
  // Old Faithful is in the Upper Geyser Basin of Yellowstone National Park, Teton County, in the Wyoming part of the park.
  'wyoming-old-faithful': {
    subject: 'Old Faithful',
    scopes: ['region:US:Wyoming'],
    ink: [2.3, 5.9, 95.4, 81.8],
    draw: (_id) => (
      <>
        <path d="M4 86 H96" />
        <path d="M24 86 C 31 82, 37 78, 44 77 H56 C 63 78, 69 82, 76 86" />
        <path d="M47 77 C 47 71, 45.5 67, 46 61 C 46.5 55, 43.5 51, 43.5 45 C 43.5 39, 40 36, 38.5 30 C 33.5 30, 30.5 25.5, 32.5 21.5 C 33.5 19.5, 35 18, 36.5 18.5" />
        <path d="M53 77 C 53 71, 54.5 67, 54 61 C 53.5 55, 56.5 51, 56.5 45 C 56.5 39, 60 36, 61.5 30 C 63.5 26, 61.5 22, 64 19 C 66 16.5, 69.5 16.5, 71 19" />
        <path d="M42.5 15 C 41 11, 44 8, 48 10 C 49.5 6.8, 55 6.8, 57 10 C 59 10, 60.5 11.5, 60.5 13.5" />
        <path d="M50 71 V65 M48.5 57 V50 M51.5 46 V38 M46.5 33 V25 M54 31 V21" strokeWidth="1.8" />
        <path
          d="M35.5 34 C 31.5 41, 29.5 51, 29.5 63"
          strokeWidth="2.4"
          strokeDasharray="0.1 4.5"
        />
        <path
          d="M64.5 34 C 68.5 41, 70.5 51, 70.5 63"
          strokeWidth="2.4"
          strokeDasharray="0.1 4.5"
        />
        <path d="M63 8 C 69 6.5, 75 7.5, 81 10.5" strokeWidth="2.4" strokeDasharray="0.1 4.5" />
        <path d="M74 19 C 79 17, 84 14, 90 13.5" strokeWidth="2.4" strokeDasharray="0.1 4.5" />
        <path d="M66 27 C 73 28, 82 26, 91 23" strokeWidth="2.4" strokeDasharray="0.1 4.5" />
        <path
          d="M16 86 V82 M16 82 L9.5 82 L14 75.5 L11 75.5 L16 66 L21 75.5 L18 75.5 L22.5 82 Z"
          strokeWidth="2.4"
        />
        <path
          d="M84 86 V82 M84 82 L77.5 82 L82 75.5 L79 75.5 L84 66 L89 75.5 L86 75.5 L90.5 82 Z"
          strokeWidth="2.4"
        />
      </>
    ),
  },
  // Kaminarimon is the outer gate of Sensō-ji at 2-3-1 Asakusa, Taitō, Tokyo, and its giant red lantern is one of the city's best-known sights.
  'tokyo-kaminarimon': {
    subject: 'Kaminarimon, Asakusa',
    scopes: ['region:JP:Tokyo'],
    ink: [1.3, 9.8, 97.4, 83.4],
    draw: (_id) => (
      <>
        <path d="M28 16 H72 C 76 25, 86 31, 97 29 C 93 33, 86 34.5, 78 34.5 H22 C 14 34.5, 7 33, 3 29 C 14 31, 24 25, 28 16 Z" />
        <path d="M28 16 L25.5 11.5 M72 16 L74.5 11.5" />
        <path d="M39 21 V29 M50 21 V29 M61 21 V29" strokeWidth="1.8" />
        <path d="M12 41 H88" />
        <path
          d="M15 35 V38 M22 35 V38 M29 35 V38 M71 35 V38 M78 35 V38 M85 35 V38"
          strokeWidth="1.8"
        />
        <path d="M14 41 V86 M31 41 V86 M69 41 V86 M86 41 V86" />
        <path d="M50 41 V44" strokeWidth="2.4" />
        <rect x="41" y="44" width="18" height="4" rx="1" fill="currentColor" stroke="none" />
        <path d="M41 48 C 36.5 55, 36.5 69, 41 76 H59 C 63.5 69, 63.5 55, 59 48" />
        <path
          d="M39.5 55 C 46 57, 54 57, 60.5 55 M39 62 C 46 64, 54 64, 61 62 M39.5 69 C 46 71, 54 71, 60.5 69"
          strokeWidth="1.8"
        />
        <rect x="39.5" y="76" width="21" height="4.5" rx="1" fill="currentColor" stroke="none" />
        <path d="M14 56 H31 M69 56 H86" strokeWidth="2.4" />
        <path d="M22.5 56 V86 M77.5 56 V86" strokeWidth="2.4" />
        <path d="M3 86 H97" />
        <path d="M8 92 H30 M38 92 H62 M70 92 H92" strokeWidth="2.4" />
      </>
    ),
  },
  // Stonehenge stands on Salisbury Plain near Amesbury, Wiltshire, England; it is a UNESCO World Heritage Site in England's care through English Heritage.
  'england-stonehenge': {
    subject: 'Stonehenge',
    scopes: ['region:GB:England'],
    ink: [0.3, 24, 99.4, 69.2],
    draw: (id) => (
      <>
        <defs>
          <mask id={`${id}-cut`}>
            <rect width="100" height="100" fill="#fff" />
            <path
              d="M32.5 86 L34 36 H45 L46 86 Z M52 86 L53 36 H64 L66 86 Z M30 34 V26 H68 V34 Z M71 86 L73 78 H92.5 L94 86 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="7"
            />
          </mask>
        </defs>
        <g mask={`url(#${id}-cut)`} strokeWidth="2.4">
          <path d="M6.5 86 L7.5 57 C 7.5 54, 9 53, 11 53.5 L15 54 C 17 54.3, 18 55.5, 17.8 57.5 L18.5 86" />
          <path d="M22 86 L22.5 57 C 22.7 55, 24 53.8, 26 54 H29.5 C 31.5 54, 32.3 55.5, 32.3 57.5 L33 86" />
          <path d="M6 52 L6.5 48.5 C 6.8 46.8, 8 46, 10 46 C 18.5 45.3, 27.5 45.3, 35 46.3 C 36.5 46.5, 37.3 47.5, 37.1 49 L36.5 52 Z" />
          <path d="M70 86 L70.5 58 C 70.6 56, 72 55, 74 55.2 L77.5 55.6 C 79.5 55.8, 80.5 57, 80.3 59 L81 86" />
          <path d="M68.5 54.5 L69 50 C 69.2 48.5, 70.5 47.5, 72 47.6 L86 48.4 C 87.8 48.5, 88.6 49.5, 88.2 51 L87.2 55 Z" />
          <path d="M83 86 L85.5 63 C 85.8 61, 87.2 60.2, 89 60.8 L92.5 62 C 94 62.6, 94.5 63.8, 94.3 65.5 L93 86" />
        </g>
        <path d="M2 86 H98" />
        <path d="M32.5 86 L34 39 C 34.2 36.8, 35.5 35.6, 37.5 35.7 L42.5 36 C 44.5 36.2, 45.3 37.5, 45.2 39.5 L46 86" />
        <path d="M52 86 L53 39.5 C 53.1 37.5, 54.5 36.2, 56.5 36.2 H61 C 63 36.3, 64 37.5, 64.1 39.5 L66 86" />
        <path d="M30.5 34.5 L30 30 C 29.9 28, 31 26.8, 33 26.6 C 44 25.4, 55 25.6, 65.5 26.6 C 67.5 26.8, 68.5 28, 68.3 30 L68 34.5 Z" />
        <path d="M71 86 L72.5 80.5 C 73 78.8, 74.2 78, 76 77.8 C 81 77.2, 86 77.4, 90 78.2 C 91.8 78.6, 92.8 79.6, 93.2 81.2 L94 86" />
        <path
          d="M39.5 52 C 40 55, 39 58, 39.5 61 M58.5 64 C 59 67, 58 70, 58.5 73"
          strokeWidth="1.8"
        />
        <path d="M12 92 H36 M64 92 H88" strokeWidth="2.4" />
      </>
    ),
  },
  // Highland cattle (Bò Ghàidhealach) are a breed native to the Scottish Highlands and Western Isles, and a widely recognised emblem of Scotland.
  'scotland-highland-cow': {
    subject: 'Highland cow',
    scopes: ['region:GB:Scotland'],
    ink: [5.7, 15.3, 88.6, 77.9],
    draw: (id) => (
      <>
        <defs>
          <mask id={`${id}-cut`}>
            <rect width="100" height="100" fill="#fff" />
            <path
              d="M30 43 C 29 31, 38 23.5, 50 23.5 C 62 23.5, 71 31, 70 43 L 68 60 H 32 Z M31 50 C 26 48, 21 49, 17 53 C 21 57, 27 57, 32 55 Z M69 50 C 74 48, 79 49, 83 53 C 79 57, 73 57, 68 55 Z"
              fill="#000"
              stroke="#000"
              strokeWidth="7"
            />
          </mask>
        </defs>
        <g mask={`url(#${id}-cut)`}>
          <path d="M34 38 C 26 38, 18 35, 14 30 C 11 26, 9.5 22, 9 17 C 6 25, 7 35, 15 39.5 C 21 43, 28 45, 34 47 Z" />
          <path d="M66 38 C 74 38, 82 35, 86 30 C 89 26, 90.5 22, 91 17 C 94 25, 93 35, 85 39.5 C 79 43, 72 45, 66 47 Z" />
          <path
            d="M22 58 C 18 62, 15 67, 13 72 C 15.5 72.5, 17 73.5, 18 75.5 C 14 79, 11.5 84, 10 90 M78 58 C 82 62, 85 67, 87 72 C 84.5 72.5, 83 73.5, 82 75.5 C 86 79, 88.5 84, 90 90"
            strokeWidth="2.4"
          />
        </g>
        <path d="M30 43 C 29 31, 38 23.5, 50 23.5 C 62 23.5, 71 31, 70 43 C 70.5 50, 70 55, 68 60 C 66 56.5, 64 54, 62 52.5 C 61.5 56, 60.5 59, 58.5 62 C 57 59, 55.5 57, 54 55.5 C 53.5 59, 52 62, 50 64.5 C 48 62, 46.5 59, 46 55.5 C 44.5 57, 43 59, 41.5 62 C 39.5 59, 38.5 56, 38 52.5 C 36 54, 34 56.5, 32 60 C 30 55, 29.5 50, 30 43 Z" />
        <path
          d="M38 33 C 36 40, 39 45, 37 51 M44 30 C 42 37, 45 43, 43 50 M50 30 C 48 37, 52 44, 50 52 M56 30 C 58 37, 55 43, 57 50 M62 33 C 64 40, 61 45, 63 51"
          strokeWidth="1.8"
        />
        <path d="M37.5 60 C 38 64, 38.5 68, 39 72 C 39.5 79, 43 83, 50 83 C 57 83, 60.5 79, 61 72 C 61.5 68, 62 64, 62.5 60" />
        <path d="M40.5 72 C 46 69.5, 54 69.5, 59.5 72" strokeWidth="2.4" />
        <ellipse
          cx="45.2"
          cy="76.5"
          rx="2.4"
          ry="1.6"
          transform="rotate(-20 45.2 76.5)"
          fill="currentColor"
          stroke="none"
        />
        <ellipse
          cx="54.8"
          cy="76.5"
          rx="2.4"
          ry="1.6"
          transform="rotate(20 54.8 76.5)"
          fill="currentColor"
          stroke="none"
        />
        <path d="M31 50 C 26 48, 21 49, 17 53 C 21 57, 27 57, 32 55" />
        <path d="M69 50 C 74 48, 79 49, 83 53 C 79 57, 73 57, 68 55" />
        <path
          d="M41 85 C 40 88, 38.5 90, 36 92 M50 86 C 50 88, 49.5 90, 48 92 M59 85 C 60 88, 61.5 90, 64 92"
          strokeWidth="2.4"
        />
        <path
          d="M22 66 C 23 69, 23 72, 22 75 M29 64 C 30 68, 30 71, 29 75 M23 81 C 24 84, 24 86, 23 89 M30 80 C 31 83, 31 86, 30 89 M78 66 C 77 69, 77 72, 78 75 M71 64 C 70 68, 70 71, 71 75 M77 81 C 76 84, 76 86, 77 89 M70 80 C 69 83, 69 86, 70 89"
          strokeWidth="1.8"
        />
      </>
    ),
  },
  // Hibiscus rosa-sinensis, the bunga raya, was declared Malaysia's national flower in 1960.
  'malaysia-hibiscus': {
    subject: 'Hibiscus (bunga raya)',
    scopes: ['country:MY'],
    ink: [7.3, 7.6, 84.4, 86.6],
    draw: (id) => (
      <>
        <defs>
          <mask id={`${id}-cut`}>
            <rect width="100" height="100" fill="#fff" />
            <path d="M52 41 L81 16" stroke="#000" strokeWidth="9" />
          </mask>
        </defs>
        <path d="M46 80 C 45 85, 43 89, 40 93" strokeWidth="2.4" />
        <path d="M60 74 C 68 70, 80 72, 90 80 C 80 88, 68 88, 60 74 Z" />
        <path d="M63 75.5 C 71 77, 78 79, 86 80" strokeWidth="1.8" />
        <path d="M27 74 C 17 74, 9 82, 9 92 C 20 93, 29 86, 27 74 Z" />
        <path d="M25 77.5 C 21 81, 16.5 85.5, 13 89.5" strokeWidth="1.8" />
        <g mask={`url(#${id}-cut)`}>
          <path d="M39.7 30.7 Q 36.6 15.8, 45.6 15.0 Q 50.5 12.1, 54.6 15.4 Q 60.6 15.0, 63.2 21.0 Q 69.4 27.3, 58.9 36.9 Q 72.1 29.4, 75.6 37.6 Q 79.9 41.5, 78.0 46.4 Q 80.3 52.0, 75.3 56.3 Q 71.3 64.1, 58.9 57.1 Q 70.1 67.4, 63.4 73.2 Q 61.0 78.5, 55.7 78.2 Q 51.2 82.1, 45.6 78.7 Q 36.9 77.3, 39.7 63.3 Q 33.4 77.2, 25.7 72.6 Q 20.0 72.0, 18.6 66.9 Q 13.5 63.7, 15.0 57.3 Q 13.7 48.6, 27.8 47.0 Q 12.7 45.3, 14.7 36.6 Q 13.5 31.0, 18.0 28.1 Q 19.4 22.2, 25.9 21.7 Q 33.8 17.7, 39.7 30.7 Z" />
          <path
            d="M43.0 40.8 L40.2 32.1 M50.3 43.2 L57.7 37.8 M50.3 50.8 L57.7 56.2 M43.0 53.2 L40.2 61.9 M38.5 47.0 L29.3 47.0"
            strokeWidth="2.4"
          />
          <path
            d="M55 47 L63 47 M48.1 56.5 L50.6 64.1 M36.9 52.9 L30.4 57.6 M36.9 41.1 L30.4 36.4"
            strokeWidth="1.8"
          />
        </g>
        <circle cx="45" cy="47" r="4.4" fill="currentColor" stroke="none" />
        <path d="M45 47 L79 18" />
        <path d="M79 18 L85 18.5 M79 18 L78.2 10.6 M79 18 L84.5 12" strokeWidth="1.8" />
        <circle cx="86" cy="18.6" r="2" fill="currentColor" stroke="none" />
        <circle cx="78" cy="9.6" r="2" fill="currentColor" stroke="none" />
        <circle cx="85.3" cy="11.3" r="2" fill="currentColor" stroke="none" />
      </>
    ),
  },
  // The red kangaroo is native to Australia's interior and is Australia's best-known national animal (here drawn as a natural animal, not the coat-of-arms supporter or any logo).
  'australia-kangaroo': {
    subject: 'Red kangaroo',
    scopes: ['country:AU'],
    ink: [7.4, 9.5, 92.3, 85.7],
    draw: (_id) => (
      <>
        <circle cx="25" cy="27" r="14" strokeWidth="2.4" />
        <path d="M84 25.5 C 85 27.5, 83 29, 80 29.2 C 75.5 29.5, 71 31, 67 32.6 C 64 34, 62.5 37, 62.5 41 C 62.5 46, 68 50, 68 56 C 68 63, 64 67, 62 71 C 61 75, 59.5 78.5, 55 79.5 C 59 80.5, 63 83, 66.5 84.5 C 69 85.5, 69 88, 66.5 88 H 41 C 39 88, 38 86.5, 38 84.5 C 38 82.5, 38 81, 37 80 C 31 80.5, 25 86, 20.5 88 L 15 88 C 12.5 88, 10.5 87, 9.5 85.5 C 8.5 84, 9.5 82.5, 11.5 82.5 C 17 81.5, 23 78, 28 74 C 24 70, 22.5 62, 26 56 C 31 49, 39 45, 44 40 C 49 35, 53 28, 55.5 22.5 L 54 12.5 C 54.3 11.3, 55.8 11, 56.4 12 L 60.5 19.6 C 65 18.5, 70 19.5, 74 21.5 C 78 23, 82 24, 84 25.5 Z" />
        <path
          d="M62.5 19 L 63 11.5 C 63.3 10.5, 64.5 10.5, 65 11.3 L 66.5 19.2"
          strokeWidth="2.4"
        />
        <circle cx="66.5" cy="23.8" r="2.1" fill="currentColor" stroke="none" />
        <circle cx="84.6" cy="26.4" r="2.4" fill="currentColor" stroke="none" />
        <path d="M60.5 21.5 C 61.5 25.5, 61 29, 59.5 33" strokeWidth="2.4" />
        <path d="M63 44 C 66.5 45.5, 69 48, 70 51.5 L 72.5 52.5" />
        <path d="M67.5 54.5 C 70 56, 71.5 58, 72.2 61 L 74.7 61.8" strokeWidth="2.4" />
        <path d="M29.5 60 C 46 53.5, 61 61, 62.5 75" strokeWidth="2.4" />
        <path d="M28 74 C 31.5 76, 34.5 78, 37 80" strokeWidth="2.4" />
        <path d="M67.5 61 C 64 62, 61.5 64, 60.5 67" strokeWidth="2.4" />
        <path d="M18 88 H98" />
        <path
          d="M76 88 C 76 85, 78 83, 80 82 M82 88 C 82 85, 83 83, 85 82.5 M88 88 C 88 86, 89 84.5, 90.5 84 M14 94 H44 M56 94 H86"
          strokeWidth="2.4"
        />
      </>
    ),
  },
  // The Taj Mahal stands in Agra, Uttar Pradesh, India; it is a UNESCO World Heritage Site and India's best-known building.
  'india-taj-mahal': {
    subject: 'Taj Mahal',
    scopes: ['country:IN'],
    ink: [1.3, 5.3, 97.4, 84.4],
    draw: (_id) => (
      <>
        <path d="M3 88 H97" />
        <path d="M5 82 H95" strokeWidth="2.4" />
        <path d="M24 82 V52 H39 M61 52 H76 V82" />
        <path d="M39 82 V48 H61 V82" strokeWidth="2.4" />
        <path
          d="M45 82 V67 C 45 62, 47.5 59.5, 50 57 C 52.5 59.5, 55 62, 55 67 V82 Z"
          fill="currentColor"
          stroke="none"
        />
        <path
          d="M28.5 65 V60 C 28.5 58, 30 57, 31.5 56 C 33 57, 34.5 58, 34.5 60 V65 Z M65.5 65 V60 C 65.5 58, 67 57, 68.5 56 C 70 57, 71.5 58, 71.5 60 V65 Z M28.5 78 V73 C 28.5 71, 30 70, 31.5 69 C 33 70, 34.5 71, 34.5 73 V78 Z M65.5 78 V73 C 65.5 71, 67 70, 68.5 69 C 70 70, 71.5 71, 71.5 73 V78 Z"
          fill="currentColor"
          stroke="none"
        />
        <path d="M40 48 V41 H60 V48" />
        <path d="M40 41 C 33 35, 34 24, 44 19.5 C 47.5 18, 49.5 16, 50 12 C 50.5 16, 52.5 18, 56 19.5 C 66 24, 67 35, 60 41" />
        <path d="M50 12 V6.5" strokeWidth="2.4" />
        <path d="M26 52 V46 M31 52 V46 M69 52 V46 M74 52 V46" strokeWidth="2.4" />
        <path d="M25 46 C 25 40.5, 32 40.5, 32 46 Z M68 46 C 68 40.5, 75 40.5, 75 46 Z" />
        <path d="M28.5 41.5 V37.5 M71.5 41.5 V37.5" strokeWidth="2.4" />
        <path d="M7.5 82 L9 38 M16.5 82 L15 38 M83.5 82 L85 38 M92.5 82 L91 38" />
        <path d="M7 66 H17 M83 66 H93 M7.6 52 H16.4 M83.6 52 H92.4" strokeWidth="1.8" />
        <path d="M7.5 38 H16.5 M83.5 38 H92.5" />
        <path d="M9 38 C 9 32, 15 32, 15 38 M85 38 C 85 32, 91 32, 91 38" strokeWidth="2.4" />
        <path d="M12 33.5 V28.5 M88 33.5 V28.5" strokeWidth="2.4" />
      </>
    ),
  },
  // Windmills are the Netherlands' best-known national image; the 19 mills at Kinderdijk in South Holland are a UNESCO World Heritage Site.
  'netherlands-windmill': {
    subject: 'Windmill',
    scopes: ['country:NL'],
    ink: [1.3, 6.4, 97.4, 88.1],
    draw: (id) => (
      <>
        <defs>
          <mask id={`${id}-cut`}>
            <rect width="100" height="100" fill="#fff" />
            <g transform="rotate(45 50 38)" stroke="#000" strokeWidth="6">
              <path d="M50 38 V2" />
              <rect x="50" y="2" width="7" height="23" fill="#000" />
            </g>
            <g transform="rotate(135 50 38)" stroke="#000" strokeWidth="6">
              <path d="M50 38 V2" />
              <rect x="50" y="2" width="7" height="23" fill="#000" />
            </g>
            <g transform="rotate(225 50 38)" stroke="#000" strokeWidth="6">
              <path d="M50 38 V2" />
              <rect x="50" y="2" width="7" height="23" fill="#000" />
            </g>
            <g transform="rotate(315 50 38)" stroke="#000" strokeWidth="6">
              <path d="M50 38 V2" />
              <rect x="50" y="2" width="7" height="23" fill="#000" />
            </g>
          </mask>
        </defs>
        <g mask={`url(#${id}-cut)`}>
          <path d="M36 84 L42 44 M64 84 L58 44" />
          <path d="M30 64 H70" />
          <path d="M33 64 L38.5 69 M67 64 L61.5 69" strokeWidth="1.8" />
          <path d="M37 44 H63" />
          <path d="M38 44 C 38 21, 62 21, 62 44" />
        </g>
        <rect x="47.5" y="52" width="5" height="6" fill="currentColor" stroke="none" />
        <path d="M45.5 84 V77 A4.5 4.5 0 0 1 54.5 77 V84 Z" fill="currentColor" stroke="none" />
        <g transform="rotate(45 50 38)">
          <path d="M50 38 V2" />
          <path d="M50 25 H57 V2 H50" strokeWidth="2.4" />
          <path d="M50 19.5 H57 M50 13.5 H57 M50 7.5 H57" strokeWidth="1.6" />
        </g>
        <g transform="rotate(135 50 38)">
          <path d="M50 38 V2" />
          <path d="M50 25 H57 V2 H50" strokeWidth="2.4" />
          <path d="M50 19.5 H57 M50 13.5 H57 M50 7.5 H57" strokeWidth="1.6" />
        </g>
        <g transform="rotate(225 50 38)">
          <path d="M50 38 V2" />
          <path d="M50 25 H57 V2 H50" strokeWidth="2.4" />
          <path d="M50 19.5 H57 M50 13.5 H57 M50 7.5 H57" strokeWidth="1.6" />
        </g>
        <g transform="rotate(315 50 38)">
          <path d="M50 38 V2" />
          <path d="M50 25 H57 V2 H50" strokeWidth="2.4" />
          <path d="M50 19.5 H57 M50 13.5 H57 M50 7.5 H57" strokeWidth="1.6" />
        </g>
        <circle cx="50" cy="38" r="3" fill="currentColor" stroke="none" />
        <path d="M3 84 H97" />
        <path
          d="M8 91 C 12 88, 16 94, 20 91 S 28 88, 32 91 S 40 94, 44 91 M56 91 C 60 88, 64 94, 68 91 S 76 88, 80 91 S 88 94, 92 91"
          strokeWidth="2.4"
        />
      </>
    ),
  },
  // Mont-Saint-Michel is a tidal island commune in Manche, Normandy, France; it is a UNESCO World Heritage Site and one of France's most-visited landmarks.
  'france-mont-saint-michel': {
    subject: 'Mont-Saint-Michel',
    scopes: ['country:FR'],
    ink: [1.8, 7.5, 96.4, 87.7],
    draw: (_id) => (
      <>
        <path
          d="M3 87 C 7 84, 11 90, 15 87 S 23 84, 27 87 S 35 90, 39 87 S 47 84, 51 87 S 59 90, 63 87 S 71 84, 75 87 S 83 90, 87 87 S 95 84, 97 86"
          strokeWidth="2.4"
        />
        <path d="M4 94 H26 M34 94 H66 M74 94 H96" strokeWidth="2.4" />
        <path d="M6 80 V72 H88 V80 Z" />
        <path d="M8 72 V63 H15 V72" />
        <path d="M76 72 V66 H82 V72" />
        <path d="M20 72 C 24 62, 31 52, 40 44 H66 V72" />
        <path d="M48 44 V72" strokeWidth="2.4" />
        <path
          d="M53 56 V50.5 L54.5 49 L56 50.5 V56 Z M59 56 V50.5 L60.5 49 L62 50.5 V56 Z M53 67 V61.5 L54.5 60 L56 61.5 V67 Z M59 67 V61.5 L60.5 60 L62 61.5 V67 Z"
          fill="currentColor"
          stroke="none"
        />
        <path d="M27 72 V67 L30 64 L33 67 V72 M36 60 V56 L39 53 L42 56 V60 Z" strokeWidth="2.4" />
        <path d="M41 44 V39 L44 35 H60 L63 39 V44" />
        <path d="M48.5 35 V27 H55.5 V35" />
        <path d="M48.5 27 L52 12 L55.5 27" />
        <circle cx="52" cy="9.2" r="1.7" fill="currentColor" stroke="none" />
      </>
    ),
  },
  // The hanok is Korea's traditional house; Bukchon and Jeonju hanok villages make it a national image every Korean visitor would recognise.
  'korea-hanok': {
    subject: 'Hanok house',
    scopes: ['country:KR'],
    ink: [1.3, 14.3, 97.4, 74.4],
    draw: (_id) => (
      <>
        <path d="M3 87 H97" />
        <path d="M13 87 V78 H87 V87" />
        <path d="M19 78 V45 M81 78 V45 M37 78 V45 M63 78 V45" />
        <path d="M19 51 H81" strokeWidth="2.4" />
        <path d="M43.5 78 V51 M50 78 V51 M56.5 78 V51 M37 60 H63 M37 69 H63" strokeWidth="1.6" />
        <rect x="25" y="57" width="6" height="10" strokeWidth="2.4" />
        <rect x="69" y="57" width="6" height="10" strokeWidth="2.4" />
        <path d="M28 57 V67 M25 62 H31 M72 57 V67 M69 62 H75" strokeWidth="1.6" />
        <path d="M3 33 C 11 40, 25 44, 50 44 C 75 44, 89 40, 97 33" />
        <path d="M23 16 C 26 19.5, 29 20.5, 33 20.5 H67 C 71 20.5, 74 19.5, 77 16" />
        <path d="M31 20.5 C 25 28, 14 32.5, 3 33 M69 20.5 C 75 28, 86 32.5, 97 33" />
        <path
          d="M36.5 26 V37.5 M43.25 26 V38.5 M50 26 V38.5 M56.75 26 V38.5 M63.5 26 V37.5"
          strokeWidth="1.8"
        />
      </>
    ),
  },
  // The jeepney grew out of WWII surplus Willys jeeps rebuilt into long-bodied public-transport vehicles. It is the Philippines' most common form of public transport and a widely recognised national cultural symbol ("King of the Road").
  'philippines-jeepney': {
    subject: 'Jeepney',
    scopes: ['country:PH'],
    ink: [0.3, 32.8, 99.4, 54.9],
    draw: (_id) => (
      <>
        <path d="M2 86 H98" />
        <path d="M31 41 C 31 37, 33 34.5, 36.5 34.5 H92 V41 Z" />
        <path d="M6.5 72 C 6.5 67, 8 64, 13 64 H26 C 31 64, 33.5 67, 34 72 H64 A 13.5 13.5 0 0 1 88 72 H92 V41" />
        <path d="M36 57.5 H11.5 C 10 57.5, 9.5 58.5, 9.5 60 V64.5" />
        <path d="M36 41 V57.5" />
        <path d="M42 41 V57.5" strokeWidth="1.8" />
        <path d="M48 41 V72" />
        <path d="M48 52 H92" />
        <path
          d="M54.3 41 V52 M60.6 41 V52 M66.9 41 V52 M73.1 41 V52 M79.4 41 V52 M85.7 41 V52"
          strokeWidth="2.4"
        />
        <path d="M52 58.5 H88.5" strokeWidth="2.4" />
        <circle cx="20" cy="78" r="7" />
        <circle cx="76" cy="78" r="7" />
        <circle cx="20" cy="78" r="2" fill="currentColor" stroke="none" />
        <circle cx="76" cy="78" r="2" fill="currentColor" stroke="none" />
        <path d="M12.5 57.5 L 11.5 50.5 M18 57.5 L 18.5 50" strokeWidth="1.8" />
      </>
    ),
  },
  // The moose (Alces alces) is native to every Canadian province and territory except Prince Edward Island and is one of Canada's most recognised wildlife icons. It is not an official national symbol; the beaver is.
  'canada-moose': {
    subject: 'Moose',
    scopes: ['country:CA'],
    ink: [0.3, 9.8, 99.4, 81.4],
    draw: (_id) => (
      <>
        <path d="M30 35 C 25 37, 19 39.5, 14 41.5 C 10.5 43, 9 45.5, 9.5 48 C 10 50.5, 12 51, 14.5 50.5 C 14 52, 14 53.5, 15.5 54.5 C 19 55.5, 24 54.5, 28.5 53 C 28.5 57, 29 61, 30.5 64 C 32.5 61.5, 33.5 58.5, 33.5 55 C 35 55, 36 55.5, 37 56 C 38.5 58, 40 60, 41.5 62 L 42.5 84 H 47.5 L 48.5 60 C 55 60.5, 63 60, 70 58.5 C 72 60, 73.5 63, 74.5 67 L 75.5 84 H 80.5 L 79.5 66 L 80.5 56 C 82 51, 83 46, 81.5 42 C 79 38, 74 37.5, 68 36 C 60 34, 54 29, 46 30 C 41 31, 37 33.5, 33 34.5 Z" />
        <path d="M32 33 C 39 31, 47 28, 53 25 L 58.5 21.5 L 58 16.5 L 55 18.5 L 53.5 13 L 50 16.5 L 47.5 11.5 L 44.5 16 L 41 12.5 L 39 17 L 35.5 15 C 35 21, 34 26, 31 31.5" />
        <path
          d="M28.5 33.5 C 23 31.5, 16.5 29, 11.5 26 L 7.5 22.5 L 7.5 17.5 L 10.5 20 L 11.5 14.5 L 14.5 18 L 16.5 13 L 19 17.5 L 22 14 L 23.5 18.5 L 26.5 17.5 C 26.5 23, 27.5 28, 29.5 32"
          strokeWidth="2.4"
        />
        <circle cx="23" cy="42.5" r="1.9" fill="currentColor" stroke="none" />
        <path d="M12 45.5 L 13.5 47.5" strokeWidth="1.8" />
        <path d="M46 30.5 C 49 40, 49 50, 47 59" strokeWidth="2.4" />
        <path d="M55 61 L 56 84 M66 60 L 66.5 84" strokeWidth="2.4" />
        <path d="M51 33 L 54 30.5 M56 35.5 L 59 33 M51 40 L 54 37.5" strokeWidth="1.8" />
        <path
          d="M90.5 50 L 87.5 57 H 89 L 87 65 H 88.5 L 86.5 73.5 H 94.5 L 92.5 65 H 94 L 92 57 H 93.5 Z"
          strokeWidth="2.4"
        />
        <path d="M90.5 73.5 V84" strokeWidth="2.4" />
        <path d="M12 64 L 9.5 70 H 11 L 8 77 H 16 L 13 70 H 14.5 Z" strokeWidth="2.4" />
        <path d="M12 77 V84" strokeWidth="2.4" />
        <path d="M2 84 H98" />
        <path d="M10 90 H34 M42 90 H66 M74 90 H92" strokeWidth="2.4" />
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
