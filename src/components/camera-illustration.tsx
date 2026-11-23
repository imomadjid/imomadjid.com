import { useId } from 'react'

const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif"

// Geometry is traced from the 600 x 370 product photo, one viewBox unit per photo pixel.
// The lens rings are not concentric: the photo looks slightly up the barrel, so each ring
// carries its own centre.
const LX = 329.3

// Baseline circle of the engraved ring text, and its length per degree.
const TEXT_CY = 217.8
const TEXT_R = 73.6
const PER_DEGREE = (2 * Math.PI * TEXT_R) / 360

// Words on the lens ring with their start and end angles, clockwise from nine o'clock.
const RING_TEXT: [word: string, from: number, to: number][] = [
  ['FUJINON', 17.3, 61.6],
  ['ASPHERICAL', 70, 130.3],
  ['LENS', 140.6, 163.2],
  ['SUPER', 180.8, 204.9],
  ['EBC', 209.7, 227.8],
  ['XC', 232.4, 243],
  ['13-33mm', 244.8, 283],
  ['1:3.5-6.3', 286, 321.5],
  ['OIS', 326, 338.3],
  ['⌀49', 343.2, 359.6],
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
        y2="137"
      >
        <Stops
          stops={[
            [0, '#60605f'],
            [0.4, '#585856'],
            [0.42, '#3b3b3a'],
            [1, '#333332'],
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
            [0.18, '#040404'],
            [0.2, '#0e0e0e'],
            [0.22, '#1b1b1b'],
            [0.3, '#1d1d1d'],
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
            [0.008, '#2f2f2f'],
            [0.016, '#565655'],
            [0.04, '#5a5a59'],
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
      <linearGradient id={ref(id, 'barrel')} x1="0.62" y1="0" x2="0.42" y2="1">
        <Stops
          stops={[
            [0, '#454545'],
            [0.45, '#545454'],
            [0.75, '#3a3a3a'],
            [0.92, '#121212'],
            [1, '#0b0b0b'],
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
            [0, '#303030'],
            [0.3, '#202020'],
            [1, '#1d1d1d'],
          ]}
        />
      </linearGradient>
      <radialGradient id={ref(id, 'cone')} cx="0.5" cy="0.52" r="0.5">
        <Stops
          stops={[
            [0.84, '#6a6a6a'],
            [0.92, '#4c4c4c'],
            [1, '#383838'],
          ]}
        />
      </radialGradient>
      <radialGradient id={ref(id, 'glass')} cx="0.5" cy="0.5" r="0.5" fx="0.6" fy="0.38">
        <Stops
          stops={[
            [0, '#2c3238'],
            [0.5, '#1c1f22'],
            [1, '#17191b'],
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
      <linearGradient id={ref(id, 'switch')} x1="0.9" y1="0.2" x2="0.1" y2="0.8">
        <Stops
          stops={[
            [0, '#454545'],
            [0.5, '#333'],
            [1, '#1c1c1c'],
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
        fill="#60605f"
        knurl={url(id, 'knurl')}
        shade={url(id, 'round')}
      />
      <g>
        <rect x="131" y="54" width="41.5" height="15" rx="2" fill="#646463" />
        <rect x="131" y="54" width="41.5" height="15" rx="2" fill={url(id, 'round')} />
        <rect x="139.5" y="48.1" width="26" height="6.5" rx="2" fill="#7b7b7a" />
        <rect x="139.5" y="48.1" width="26" height="6.5" rx="2" fill={url(id, 'round')} />
      </g>
      <path d="M174.5 61H248.5l-2 8h-70Z" fill="#515150" />
      <path d="M174.5 61H248.5l-2 8h-70Z" fill={url(id, 'round')} />
      <Dial
        x={171.5}
        y={42.25}
        w={77.5}
        h={19.25}
        fill="#6a6a69"
        knurl={url(id, 'knurl')}
        shade={url(id, 'round')}
      />
      <path d="M426 59.5H497.5l-2 9.5h-67.5Z" fill="#60605f" />
      <path d="M426 59.5H497.5l-2 9.5h-67.5Z" fill={url(id, 'round')} />
      <Dial
        x={424.4}
        y={42.2}
        w={74.25}
        h={18}
        fill="#6c6c6b"
        knurl={url(id, 'knurl')}
        shade={url(id, 'round')}
      />
      <Dial
        x={499.5}
        y={55}
        w={14.7}
        h={14}
        fill="#747473"
        knurl={url(id, 'knurl')}
        shade={url(id, 'round')}
      />
      <rect x="410" y="63" width="11" height="6" fill="#646464" />
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
        d="M279.9 21.75H378.3L409.7 68H247.4Z"
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
      <rect x="102.8" y="69.7" width="391.2" height="1.8" fill="#b4b4b2" />
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
      <path d="M248 69.3H411L421 100l5.5 37.4H231.5L238 100Z" fill={url(id, 'humpFace')} />
      <path
        d="M248 69.3L238 100l-6.5 37.4M411 69.3L421 100l5.5 37.4"
        fill="none"
        stroke="#8a8a88"
        strokeWidth="1.6"
      />
      <rect x="248" y="67.3" width="163" height="2" fill="#d4d4d2" />
      <text
        x="282.2"
        y="92.4"
        fontFamily={SANS}
        fontSize="20.5"
        fontWeight="700"
        textLength="94.25"
        lengthAdjust="spacingAndGlyphs"
        fill="#e8e8e6"
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
      <rect x="141.5" y="101.5" width="44" height="13" rx="2" fill="#3b3b3b" />
      <rect x="141.5" y="101.5" width="44" height="13" rx="2" fill={url(id, 'knurl')} />
      <rect x="141.5" y="101.5" width="44" height="13" rx="2" fill={url(id, 'round')} />

      {/* AF-assist lamp */}
      <circle cx="217.15" cy="106.8" r="9.7" fill="#111" />
      <circle cx="217.15" cy="106.8" r="7" fill="#2c2c2a" />
      <circle cx="217.15" cy="106.8" r="4.6" fill="#c4c17c" />
      <circle cx="218.3" cy="105.7" r="2" fill="#ebe7b4" opacity="0.7" />

      <text
        x="430.4"
        y="109.8"
        fontFamily={SANS}
        fontSize="13"
        fontWeight="400"
        textLength="60.8"
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
      <circle cx="469.5" cy="282.5" r="25" fill="#050505" />
      <circle cx="471.3" cy="281.4" r="22.9" fill={url(id, 'switch')} />
      <ellipse cx="467" cy="282.7" rx="12" ry="10.8" fill="#161616" />
      <rect x="466.5" y="260.5" width="2.6" height="16" rx="0.8" fill="#d6d6d4" />
      <text fontFamily={SANS} fontSize="6" fontWeight="500" fill="#cfcfcd" textAnchor="middle">
        <tspan x="450.5" y="272.5">
          M
        </tspan>
        <tspan x="458" y="266.5">
          C
        </tspan>
        <tspan x="462" y="261.5">
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
      <ellipse cx={LX} cy="219.85" rx="120.6" ry="118.85" fill={url(id, 'barrel')} />
      <ellipse cx={LX} cy="218" rx="113.5" ry="114" fill="#222" />
      <ellipse cx={LX} cy="217.5" rx="111.25" ry="111" fill="#0a0a0a" />
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
      <ellipse cx={LX} cy="216" rx="53.6" ry="55.3" fill="#030303" />
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

      <text fontFamily={SANS} fontSize="9.8" fontWeight="400" fill="#d6d6d4">
        {RING_TEXT.map(([word, from, to]) => (
          <textPath
            key={word}
            href={`#${ref(id, 'ring')}`}
            startOffset={(from * PER_DEGREE).toFixed(1)}
            textLength={((to - from) * PER_DEGREE).toFixed(1)}
            lengthAdjust="spacingAndGlyphs"
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
