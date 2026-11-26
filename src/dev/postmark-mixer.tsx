import { useState } from 'react'

import { Postmark } from './postmark'
import { accepts, axisValues, families, familyNames, postmarkStyle } from './postmark-kit'
import type { Axis, Family, PostmarkPlace, Style } from './postmark-kit'

// Assembles one place's postmark from a family and a choice on each style axis, as the Guestbook
// will at run time. Options a family doesn't accept are disabled; left on the place's own, an
// axis keeps its seeded choice.

const axisNames = {
  ink: 'Ink',
  weight: 'Lettering',
  tracking: 'Tracking',
  date: 'Date',
  ornament: 'Ornaments',
  border: 'Border',
} as const satisfies Record<Axis, string>

const axes: readonly Axis[] = ['ink', 'weight', 'tracking', 'date', 'ornament', 'border']

const selectClass =
  'h-8 rounded-full border border-border bg-surface-1 px-3 text-body text-foreground disabled:opacity-50'

function AxisSelect<A extends Axis>({
  axis,
  family,
  value,
  resolved,
  onChange,
}: {
  axis: A
  family: Family
  value: Style[A] | undefined
  resolved: Style[A]
  onChange: (value: Style[A] | undefined) => void
}) {
  const accepted = new Set<Style[A]>(accepts(family)[axis])
  const all: readonly Style[A][] = axisValues[axis]
  return (
    <label className="flex flex-col gap-1 text-caption text-muted-foreground">
      {axisNames[axis]}
      <select
        className={selectClass}
        value={value ?? ''}
        disabled={accepted.size < 2}
        onChange={(event) => onChange(all.find((option) => option === event.target.value))}
      >
        <option value="">{`Place's own (${resolved})`}</option>
        {all.map((option) => (
          <option key={option} value={option} disabled={!accepted.has(option)}>
            {accepted.has(option) ? option : `${option} (not accepted)`}
          </option>
        ))}
      </select>
    </label>
  )
}

export function PostmarkMixer({
  places,
  salt,
  visitors,
  outline,
}: {
  places: readonly PostmarkPlace[]
  salt: number
  visitors: number
  outline: boolean
}) {
  const [placeKey, setPlaceKey] = useState(places[0]?.key ?? '')
  const [family, setFamily] = useState<Family>('bridge')
  const [choices, setChoices] = useState<Partial<Style>>({})
  const place = places.find((candidate) => candidate.key === placeKey) ?? places[0]
  if (!place) return null
  const resolved = postmarkStyle(place.key, salt, family, choices)
  const set =
    <A extends Axis>(axis: A) =>
    (value: Style[A] | undefined) =>
      setChoices((current) => ({ ...current, [axis]: value }))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-caption text-muted-foreground">
          Place
          <select
            className={selectClass}
            value={place.key}
            onChange={(event) => setPlaceKey(event.target.value)}
          >
            {places.map((option) => (
              <option key={option.key} value={option.key}>
                {option.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-caption text-muted-foreground">
          Family
          <select
            className={selectClass}
            value={family}
            onChange={(event) =>
              setFamily(families.find((option) => option === event.target.value) ?? 'classic')
            }
          >
            {families.map((option) => (
              <option key={option} value={option}>
                {familyNames[option]}
              </option>
            ))}
          </select>
        </label>
        {axes.map((axis) => (
          <AxisSelect
            key={axis}
            axis={axis}
            family={family}
            value={choices[axis]}
            resolved={resolved[axis]}
            onChange={set(axis)}
          />
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-8">
        <Postmark
          place={place}
          family={family}
          choices={choices}
          visitor={visitors}
          salt={salt}
          outline={outline}
          size={240}
        />
        {[1, 2, 3].map((index) => (
          <Postmark
            key={index}
            place={place}
            family={family}
            choices={choices}
            visitor={visitors + index}
            salt={salt}
            outline={outline}
            size={150}
          />
        ))}
      </div>
    </div>
  )
}
