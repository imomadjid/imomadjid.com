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
    scopes: ['region:US:New York'],
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
    scopes: ['region:US:Texas'],
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
} as const satisfies Record<string, Pictorial>

// The drawings' shared stroke style, set once on the group that holds one.
export const pictorialStroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 3.4,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const
