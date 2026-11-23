import { useId } from 'react'

const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif"

// Geometry is traced from the 600 x 370 product photo, one viewBox unit per photo pixel.
// The lens rings are not concentric: the photo looks slightly up the barrel, so each ring
// carries its own centre.
const LX = 329.3

// Baseline circle of the engraved ring text, and its length per degree.
const TEXT_CY = 217.8
const TEXT_R = 72.9
const PER_DEGREE = (2 * Math.PI * TEXT_R) / 360

// Words on the lens ring with their start and end angles, clockwise from nine o'clock.
const RING_TEXT: [word: string, from: number, to: number][] = [
  ['FUJINON', 16.8, 59.6],
  ['ASPHERICAL', 69.3, 130.6],
  ['LENS', 139.6, 162.9],
  ['SUPER', 180, 204.4],
  ['EBC', 209.7, 224],
  ['XC', 229.9, 239.6],
  ['13-33mm', 245.1, 281.5],
  ['1:3.5-6.3', 287, 320.3],
  ['OIS', 326, 338.8],
  ['⌀49', 344.7, 359.4],
]

type Stop = [offset: number, color: string, opacity?: number]

function Stops({ stops }: { stops: Stop[] }) {
  return stops.map(([offset, color, opacity]) => (
    <stop key={offset} offset={offset} stopColor={color} stopOpacity={opacity} />
  ))
}

// Knurled cylinder seen side-on: base color, ridges, then the round shading.
function Dial({
  x,
  y,
  w,
  h,
  fill,
  knurl,
  shade,
}: {
  x: number
  y: number
  w: number
  h: number
  fill: string
  knurl: string
  shade: string
}) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={2} fill={fill} />
      <rect x={x} y={y + 1.5} width={w} height={h - 1.5} rx={1.5} fill={knurl} />
      <rect x={x} y={y} width={w} height={h} rx={2} fill={shade} />
      <rect x={x + 2} y={y} width={w - 4} height={1.4} rx={0.7} fill="#fff" opacity={0.25} />
    </g>
  )
}

const ref = (id: string, name: string) => `${id}-${name}`
const url = (id: string, name: string) => `url(#${id}-${name})`

// Gradients for the top plate, hump, leatherette, base plate, dials, and lugs.
function PlatePaint({ id }: { id: string }) {
  return (
    <>
      <linearGradient id={ref(id, 'face')} x1="0" y1="0" x2="1" y2="0">
        <Stops
          stops={[
            [0, '#444442'],
            [1, '#4b4b49'],
          ]}
        />
      </linearGradient>
      {/* Rounded ends of the top plate: bright where they meet the face, dark at the rim. */}
      <linearGradient id={ref(id, 'capL')} x1="0" y1="0" x2="1" y2="0">
        <Stops
          stops={[
            [0, '#262626'],
            [0.1, '#343433'],
            [0.24, '#717170'],
            [0.4, '#9a9a97'],
            [0.57, '#b2b2af'],
            [0.75, '#c8c7c5'],
            [0.9, '#d2d1ce'],
            [1, '#d1d0cc'],
          ]}
        />
      </linearGradient>
      <linearGradient id={ref(id, 'capR')} x1="0" y1="0" x2="1" y2="0">
        <Stops
          stops={[
            [0, '#c8c7c4'],
            [0.21, '#c1c1be'],
            [0.38, '#aaaaa7'],
            [0.55, '#949592'],
            [0.72, '#757574'],
            [0.84, '#3a3a3a'],
            [1, '#2d2d2d'],
          ]}
        />
      </linearGradient>
      <linearGradient id={ref(id, 'humpTop')} x1="0" y1="0" x2="0" y2="1">
        <Stops
          stops={[
            [0, '#979895'],
            [0.15, '#a2a39e'],
            [1, '#aaaaa8'],
          ]}
        />
      </linearGradient>
      <linearGradient
        id={ref(id, 'humpFace')}
        gradientUnits="userSpaceOnUse"
        x1="0"
        y1="69"
        x2="0"
        y2="100"
      >
        <Stops
          stops={[
            [0, '#60605f'],
            [0.88, '#585856'],
            [0.9, '#4c4c4b'],
            [1, '#4d4d4c'],
          ]}
        />
      </linearGradient>
      {/* Leatherette across the body: dark edge, grip face, finger valley, then the flat. */}
      <linearGradient
        id={ref(id, 'leather')}
        gradientUnits="userSpaceOnUse"
        x1="67.7"
        y1="0"
        x2="529.3"
        y2="0"
      >
        <Stops
          stops={[
            [0, '#0a0a0a'],
            [0.016, '#0e0e0e'],
            [0.024, '#282828'],
            [0.12, '#262626'],
            [0.1225, '#060606'],
            [0.16, '#040404'],
            [0.19, '#0b0b0b'],
            [0.205, '#171717'],
            [0.22, '#1e1e1e'],
            [0.3, '#202020'],
            [0.34, '#242424'],
            [0.99, '#262626'],
            [1, '#161616'],
          ]}
        />
      </linearGradient>
      <linearGradient id={ref(id, 'valleyTop')} x1="0" y1="0" x2="0" y2="1">
        <Stops
          stops={[
            [0, '#222', 1],
            [0.5, '#222', 0.8],
            [1, '#222', 0],
          ]}
        />
      </linearGradient>
      <linearGradient
        id={ref(id, 'base')}
        gradientUnits="userSpaceOnUse"
        x1="67.7"
        y1="0"
        x2="493.8"
        y2="0"
      >
        <Stops
          stops={[
            [0, '#2a2a2a'],
            [0.008, '#303030'],
            [0.018, '#3c3c3c'],
            [0.028, '#494949'],
            [0.04, '#585857'],
            [0.06, '#5c5c5b'],
            [0.115, '#515150'],
            [0.155, '#555554'],
            [0.168, '#7a7a79'],
            [0.186, '#8f908e'],
            [0.205, '#7a7a79'],
            [0.217, '#505050'],
            [0.264, '#494949'],
            [0.38, '#363636'],
            [0.45, '#323232'],
            [0.62, '#323232'],
            [0.8, '#3e3e3e'],
            [0.94, '#4c4c4c'],
            [1, '#505050'],
          ]}
        />
      </linearGradient>
      <linearGradient id={ref(id, 'baseCap')} x1="0" y1="0" x2="1" y2="0">
        <Stops
          stops={[
            [0, '#b9b9b7'],
            [0.76, '#abaaa8'],
            [0.82, '#4a4a49'],
            [1, '#3a3a39'],
          ]}
        />
      </linearGradient>
      <linearGradient id={ref(id, 'round')} x1="0" y1="0" x2="1" y2="0">
        <Stops
          stops={[
            [0, '#000', 0.5],
            [0.22, '#000', 0.12],
            [0.62, '#fff', 0.2],
            [0.82, '#fff', 0.04],
            [1, '#000', 0.38],
          ]}
        />
      </linearGradient>
      <linearGradient id={ref(id, 'lug')} x1="0" y1="0" x2="1" y2="1">
        <Stops
          stops={[
            [0, '#a3a3a2'],
            [1, '#c2c2c0'],
          ]}
        />
      </linearGradient>
    </>
  )
}

// Gradients for the lens, running from the lit upper right to the shaded lower left.
function LensPaint({ id }: { id: string }) {
  return (
    <>
      <linearGradient
        id={ref(id, 'mount')}
        gradientUnits="userSpaceOnUse"
        x1="0"
        y1="100"
        x2="0"
        y2="111"
      >
        <Stops
          stops={[
            [0, '#202020', 1],
            [1, '#202020', 0],
          ]}
        />
      </linearGradient>
      <linearGradient id={ref(id, 'barrel')} x1="0.56" y1="0" x2="0.44" y2="1">
        <Stops
          stops={[
            [0.07, '#686868'],
            [0.34, '#707070'],
            [0.5, '#5b5b5b'],
            [0.63, '#3e3e3e'],
            [0.76, '#222'],
            [0.98, '#0a0a0a'],
          ]}
        />
      </linearGradient>
      <linearGradient id={ref(id, 'step')} x1="0.7" y1="0" x2="0.35" y2="1">
        <Stops
          stops={[
            [0, '#2a2a2a'],
            [0.6, '#1c1c1c'],
            [1, '#141414'],
          ]}
        />
      </linearGradient>
      <linearGradient id={ref(id, 'lip')} x1="0.7" y1="0" x2="0.3" y2="1">
        <Stops
          stops={[
            [0, '#666', 1],
            [0.6, '#555', 0.8],
            [1, '#333', 0],
          ]}
        />
      </linearGradient>
      <linearGradient id={ref(id, 'lipIn')} x1="0.7" y1="0" x2="0.3" y2="1">
        <Stops
          stops={[
            [0, '#555', 0],
            [0.4, '#5c5c5c', 0.9],
            [1, '#666', 1],
          ]}
        />
      </linearGradient>
      <linearGradient id={ref(id, 'inner')} x1="0.5" y1="0" x2="0.5" y2="1">
        <Stops
          stops={[
            [0, '#1c1c1c'],
            [1, '#1f1f1f'],
          ]}
        />
      </linearGradient>
      <linearGradient id={ref(id, 'rimShade')} x1="0" y1="0" x2="0" y2="1">
        <Stops
          stops={[
            [0, '#000', 0.55],
            [0.55, '#000', 0.5],
            [0.85, '#000', 0],
          ]}
        />
      </linearGradient>
      <linearGradient id={ref(id, 'coneShade')} x1="0.35" y1="0" x2="0.6" y2="1">
        <Stops
          stops={[
            [0, '#000', 0.4],
            [0.4, '#000', 0],
          ]}
        />
      </linearGradient>
      <radialGradient id={ref(id, 'cone')} cx="0.5" cy="0.52" r="0.5">
        <Stops
          stops={[
            [0.84, '#6a6a6a'],
            [0.92, '#505050'],
            [1, '#464646'],
          ]}
        />
      </radialGradient>
      <radialGradient id={ref(id, 'glass')} cx="0.5" cy="0.5" r="0.5" fx="0.6" fy="0.38">
        <Stops
          stops={[
            [0, '#3d4246'],
            [0.5, '#282a2c'],
            [1, '#1f2021'],
          ]}
        />
      </radialGradient>
      <radialGradient id={ref(id, 'sheen')} cx="0.5" cy="0.5" r="0.5">
        <Stops
          stops={[
            [0, '#e4eaf0', 0.5],
            [1, '#e4eaf0', 0],
          ]}
        />
      </radialGradient>
    </>
  )
}

// Occlusion, switch, and ground gradients, the knurl pattern, body clip, and text ring.
function SharedPaint({ id }: { id: string }) {
  return (
    <>
      <radialGradient id={ref(id, 'occlude')} cx="0.5" cy="0.5" r="0.5">
        <Stops
          stops={[
            [0.8, '#000', 0.5],
            [1, '#000', 0],
          ]}
        />
      </radialGradient>
      <linearGradient id={ref(id, 'switch')} x1="0.1" y1="0.35" x2="0.9" y2="0.75">
        <Stops
          stops={[
            [0, '#020202'],
            [0.3, '#0b0b0b'],
            [0.55, '#2f2f2f'],
            [1, '#4c4c4c'],
          ]}
        />
      </linearGradient>
      <radialGradient id={ref(id, 'ground')} cx="0.5" cy="0.5" r="0.5">
        <Stops
          stops={[
            [0, '#000', 0.55],
            [0.55, '#000', 0.22],
            [1, '#000', 0],
          ]}
        />
      </radialGradient>
      <pattern id={ref(id, 'knurl')} width="3.2" height="8" patternUnits="userSpaceOnUse">
        <rect width="1.3" height="8" fill="#000" opacity="0.34" />
      </pattern>
      <clipPath id={ref(id, 'body')}>
        <rect x="67.75" y="68" width="461.5" height="276.8" rx="3" />
      </clipPath>
      <path
        id={ref(id, 'ring')}
        d={`M${LX - TEXT_R} ${TEXT_CY}a${TEXT_R} ${TEXT_R} 0 1 1 ${2 * TEXT_R} 0a${TEXT_R} ${TEXT_R} 0 1 1 ${-2 * TEXT_R} 0`}
        fill="none"
      />
    </>
  )
}

// Contact shadow, offset down-left. Dark walls need it denser to register.
function ContactShadow({ id }: { id: string }) {
  return (
    <g className="opacity-60 dark:opacity-100">
      <ellipse cx="285" cy="353" rx="262" ry="20" fill={url(id, 'ground')} />
      <ellipse cx="291" cy="347.5" rx="226" ry="7" fill={url(id, 'ground')} />
    </g>
  )
}

// Strap lugs: a tab with an eyelet, open to the wall behind.
function Lugs({ id }: { id: string }) {
  return (
    <>
      <path
        fillRule="evenodd"
        fill={url(id, 'lug')}
        d="M68.5 107.65H59.8a14.05 14.05 0 0 0 0 28.1H68.5ZM52.2 121.7a4.85 4.85 0 1 0 9.7 0a4.85 4.85 0 1 0-9.7 0Z"
      />
      <circle cx="57.05" cy="121.7" r="5.5" fill="none" stroke="#4a4a49" strokeWidth="1.3" />
      <path
        fillRule="evenodd"
        fill={url(id, 'lug')}
        d="M528.5 107.85H537.2a14.05 14.05 0 0 1 0 28.1H528.5ZM535.15 121.9a4.6 4.6 0 1 0 9.2 0a4.6 4.6 0 1 0-9.2 0Z"
      />
      <circle cx="539.75" cy="121.9" r="5.25" fill="none" stroke="#4a4a49" strokeWidth="1.3" />
    </>
  )
}

// Top dials and shutter button, behind the top plate's edge.
function TopDials({ id }: { id: string }) {
  return (
    <>
      <Dial
        x={72}
        y={58.15}
        w={58}
        h={12}
        fill="#7a7a78"
        knurl={url(id, 'knurl')}
        shade={url(id, 'round')}
      />
      <g>
        <rect x="131" y="54" width="41.5" height="15" rx="2" fill="#646463" />
        <rect x="131" y="54" width="41.5" height="15" rx="2" fill={url(id, 'round')} />
        <rect x="139.5" y="48.1" width="26" height="6.5" rx="2" fill="#7b7b7a" />
        <rect x="139.5" y="48.1" width="26" height="6.5" rx="2" fill={url(id, 'round')} />
      </g>
      <rect x="170" y="59" width="6.5" height="10" fill="#2a2a2a" />
      <path d="M174.5 61H248.7L251 66v3h-74.5Z" fill="#515150" />
      <path d="M174.5 61H248.7L251 66v3h-74.5Z" fill={url(id, 'round')} />
      <Dial
        x={171.5}
        y={42.25}
        w={77.5}
        h={19.25}
        fill="#868684"
        knurl={url(id, 'knurl')}
        shade={url(id, 'round')}
      />
      <path d="M424.4 59.5H498.6L497 69H426Z" fill="#60605f" />
      <path d="M424.4 59.5H498.6L497 69H426Z" fill={url(id, 'round')} />
      <Dial
        x={424.4}
        y={42.2}
        w={74.25}
        h={18}
        fill="#868684"
        knurl={url(id, 'knurl')}
        shade={url(id, 'round')}
      />
      <Dial
        x={499.5}
        y={55}
        w={14.7}
        h={11}
        fill="#8a8a88"
        knurl={url(id, 'knurl')}
        shade={url(id, 'round')}
      />
      <rect x="411" y="63" width="10.3" height="6" fill="#464646" />
      <rect x="409" y="67" width="12.3" height="2" fill="#8c8c8a" />
      {/* Top edge of the right end cap beside the rear dial, in the cap's own silver */}
      <rect x="498" y="66.2" width="26.5" height="2" fill={url(id, 'capR')} />
    </>
  )
}

// Viewfinder hump: hot-shoe rails and the sloped top face.
function HumpTop({ id }: { id: string }) {
  return (
    <>
      <rect x="290" y="18.5" width="15" height="4.5" rx="1" fill="#343434" />
      <rect x="354.5" y="18.5" width="14.5" height="4.5" rx="1" fill="#343434" />
      <path
        d="M281 21.75H378.3L409.7 68H249.8Z"
        fill={url(id, 'humpTop')}
        stroke="#161616"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </>
  )
}

// Everything inside the body outline: top plate, leatherette, and base plate.
function Body({ id }: { id: string }) {
  return (
    <g clipPath={url(id, 'body')}>
      {/* Top plate: charcoal face between two rounded silver ends */}
      <rect x="67" y="68" width="463" height="70" fill={url(id, 'face')} />
      <rect x="102.8" y="69" width="391.2" height="2" fill="#b4b4b2" />
      <rect x="67.75" y="68" width="35.05" height="70" fill={url(id, 'capL')} />
      <rect x="494.05" y="68" width="35.2" height="70" fill={url(id, 'capR')} />
      <rect x="67" y="68" width="463" height="1.7" fill="#1e1e1e" />

      {/* Leatherette with the grip and its finger valley */}
      <rect x="67" y="137.4" width="463" height="190" fill={url(id, 'leather')} />
      <rect x="122" y="137.4" width="44" height="50" fill={url(id, 'valleyTop')} />

      {/* Lens occlusion, cast down-left onto the leatherette and top plate */}
      <circle cx={LX - 9} cy="229" r="131" fill={url(id, 'occlude')} />

      {/* Lens release button */}
      <circle cx="238.5" cy="313" r="16.5" fill="#070707" />
      <circle cx="233.4" cy="315.2" r="8.4" fill="#1d1d1d" />

      {/* Base plate */}
      <rect x="67" y="327.35" width="427" height="18" fill={url(id, 'base')} />
      <rect x="494.05" y="327.35" width="35.2" height="18" fill={url(id, 'baseCap')} />
      <rect x="67" y="343.1" width="463" height="2" fill="#0d0d0d" />
    </g>
  )
}

// Feet under the base plate.
function Feet() {
  return (
    <>
      <rect x="74" y="343.5" width="7" height="3.15" rx="0.8" fill="#0a0a0a" />
      <rect x="96" y="343.5" width="7" height="3.15" rx="0.8" fill="#0a0a0a" />
      <rect x="509.5" y="343.5" width="7" height="3.15" rx="0.8" fill="#0a0a0a" />
    </>
  )
}

// Hump front face, flaring down around the lens mount, with the wordmark.
function HumpFront({ id }: { id: string }) {
  return (
    <>
      {/* Bevel strips either side, the face, and its shadow on the plate below */}
      <path
        d="M243.7 69.3H249.5L238.95 118H235.6ZM410.4 69.3H415.3L421.4 100L423 118H419.7Z"
        fill="#242424"
      />
      <path d="M249.5 69.3H410.4L416.25 100H242.85Z" fill={url(id, 'humpFace')} />
      <path
        d="M249.5 69.3L234.7 137.4M410.4 69.3L423.4 137.4M243.7 69.3L235.6 118M415.3 69.3L421 100L422.6 118"
        fill="none"
        stroke="#a8a8a6"
        strokeWidth="1.5"
      />
      <path d="M241.4 100H417.5L419.6 111H239Z" fill={url(id, 'mount')} />
      <rect x="251" y="67.3" width="157.6" height="2" fill="#d4d4d2" />
      <text
        x="281.05"
        y="92.4"
        fontFamily={SANS}
        fontSize="20.5"
        fontWeight="700"
        textLength="96.65"
        lengthAdjust="spacingAndGlyphs"
        fill="#f0f0ee"
      >
        FUJIFILM
      </text>
    </>
  )
}

// Front command dial in its slot, AF-assist lamp, and the model name.
function FrontControls({ id }: { id: string }) {
  return (
    <>
      {/* Front command dial in its slot */}
      <rect x="137.5" y="98.7" width="51" height="18.1" rx="3" fill="#0a0a0a" />
      <rect x="137.5" y="101.6" width="2.4" height="12.4" fill="#5a5a58" />
      <rect x="186.6" y="101.6" width="1.9" height="12.4" fill="#5a5a58" />
      <rect x="141.5" y="101.5" width="44" height="13" rx="2" fill="#3b3b3b" />
      <rect x="141.5" y="101.5" width="44" height="13" rx="2" fill={url(id, 'knurl')} />
      <rect x="141.5" y="101.5" width="44" height="13" rx="2" fill={url(id, 'round')} />

      {/* AF-assist lamp */}
      <circle cx="217.15" cy="106.8" r="9.7" fill="#111" />
      <circle cx="217.15" cy="106.8" r="7" fill="#2c2c2a" />
      <circle cx="217.15" cy="106.8" r="4.6" fill="#c4c17c" />
      <circle cx="218.3" cy="105.7" r="2" fill="#ebe7b4" opacity="0.7" />

      <text
        x="429.2"
        y="109.8"
        fontFamily={SANS}
        fontSize="13"
        fontWeight="400"
        textLength="63"
        lengthAdjust="spacingAndGlyphs"
        fill="#dededc"
      >
        X-T30
      </text>
    </>
  )
}

// Focus-mode switch.
function FocusSwitch({ id }: { id: string }) {
  return (
    <>
      <circle cx="460" cy="287" r="34" fill={url(id, 'occlude')} />
      <circle cx="471.3" cy="281.4" r="22.9" fill={url(id, 'switch')} />
      <ellipse cx="467" cy="282.75" rx="12" ry="10.25" fill="#161616" />
      <rect x="466.6" y="264" width="2.5" height="12.6" rx="0.8" fill="#d6d6d4" />
      <text fontFamily={SANS} fontSize="6" fontWeight="500" fill="#cfcfcd" textAnchor="middle">
        <tspan x="450.3" y="272.7">
          M
        </tspan>
        <tspan x="457.8" y="266.4">
          C
        </tspan>
        <tspan x="467.6" y="262.2">
          S
        </tspan>
      </text>
    </>
  )
}

// Lens: barrel, two steps, front rim, face, inner cone, the elements, then the ring text.
function Lens({ id }: { id: string }) {
  return (
    <>
      <circle
        cx={LX}
        cy="217.6"
        r="122.4"
        fill="none"
        stroke={url(id, 'rimShade')}
        strokeWidth="3.4"
      />
      <circle cx={LX} cy="217.6" r="120.8" fill={url(id, 'barrel')} />
      {/* Shade under the hump's overhang */}
      <ellipse cx={LX} cy="102" rx="46" ry="9" fill={url(id, 'occlude')} opacity="0.75" />
      <circle cx={LX} cy="217.6" r="113.6" fill="#222" />
      <ellipse cx={LX} cy="217.5" rx="111.25" ry="111" fill="#101010" />
      <ellipse cx={LX} cy="217.6" rx="110.25" ry="109.6" fill={url(id, 'step')} />
      <ellipse
        cx={LX}
        cy="217.6"
        rx="109.6"
        ry="108.95"
        fill="none"
        stroke={url(id, 'lip')}
        strokeWidth="1.3"
      />
      <ellipse cx={LX} cy="217.6" rx="102.2" ry="101.7" fill="#060606" />
      <circle cx={LX} cy="217.5" r="101.2" fill="#2b2b2b" />
      <circle cx={LX} cy="217.5" r="100.4" fill="none" stroke={url(id, 'lip')} strokeWidth="1.4" />
      <circle cx={LX} cy="217.5" r="94.6" fill="none" stroke={url(id, 'lipIn')} strokeWidth="1.4" />
      <circle cx={LX} cy="217.5" r="93.9" fill="#0c0c0c" />
      <circle cx={LX} cy="218" r="71.8" fill={url(id, 'inner')} />
      <ellipse cx={LX} cy="215" rx="61.6" ry="64" fill={url(id, 'cone')} />
      <ellipse cx={LX} cy="215" rx="61.6" ry="64" fill={url(id, 'coneShade')} />
      <ellipse cx={LX} cy="216" rx="53.6" ry="55.3" fill="#1c1c1c" />
      <ellipse cx={LX} cy="217.65" rx="53.6" ry="53.65" fill="#030303" />
      <ellipse cx={LX} cy="218" rx="50.6" ry="51" fill="#272727" />
      <circle cx={LX} cy="218" r="45.2" fill="#050505" />
      <circle cx={LX - 0.3} cy="217.5" r="43.8" fill="#131313" />
      <circle cx={LX - 0.3} cy="217.5" r="36.2" fill="#040404" />
      <circle cx={LX - 0.5} cy="217.5" r="23.9" fill={url(id, 'glass')} />
      <circle cx={LX - 4} cy="217.3" r="10.8" fill="#0c0c0c" />
      <ellipse
        cx={LX + 9}
        cy="208"
        rx="12"
        ry="7"
        fill={url(id, 'sheen')}
        transform={`rotate(-38 ${LX + 9} 208)`}
      />

      <text fontFamily={SANS} fontSize="10.1" fontWeight="300" fill="#d6d6d4">
        {RING_TEXT.map(([word, from, to]) => (
          <textPath
            key={word}
            href={`#${ref(id, 'ring')}`}
            startOffset={(from * PER_DEGREE).toFixed(1)}
            textLength={((to - from) * PER_DEGREE).toFixed(1)}
            lengthAdjust="spacing"
          >
            {word}
          </textPath>
        ))}
      </text>
    </>
  )
}

/**
 * Front view of a Fujifilm X-T30 in charcoal silver with the XC 13-33mm lens.
 * Shading is baked for a light up and to the right, in front of the wall.
 */
export function CameraIllustration({ className }: { className?: string }) {
  const id = useId().replace(/:/g, '')

  // Paint order runs back to front, so the parts cannot be regrouped by camera section.
  return (
    <svg
      viewBox="0 0 600 384"
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- inline SVG has no img tag
      role="img"
      aria-label="Fujifilm X-T30 camera"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <PlatePaint id={id} />
        <LensPaint id={id} />
        <SharedPaint id={id} />
      </defs>
      <ContactShadow id={id} />
      <Lugs id={id} />
      <TopDials id={id} />
      <HumpTop id={id} />
      <Body id={id} />
      <Feet />
      <HumpFront id={id} />
      <FrontControls id={id} />
      <FocusSwitch id={id} />
      <Lens id={id} />
    </svg>
  )
}
