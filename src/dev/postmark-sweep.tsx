import { useEffect, useRef, useState } from 'react'

import { Postmark } from './postmark'
import { checkClearance } from './postmark-clearance'
import { accepts, families } from './postmark-kit'
import type { Family, PostmarkPlace, Style } from './postmark-kit'

// Every combination of style choices each family accepts, for one place at a time, checked by
// the clearance check. Each combination gets its own design seed, so families' variants (ground
// chord, double banner, square seal, frame) and the classic shapes vary across the grid. Ink
// can't move lettering, so the sweep keeps one.

function combinations(family: Family): Style[] {
  const list = accepts(family)
  const ink = list.ink[0] ?? 'red'
  const all: Style[] = []
  for (const weight of list.weight) {
    for (const tracking of list.tracking) {
      for (const date of list.date) {
        for (const ornament of list.ornament) {
          for (const border of list.border) {
            all.push({ ink, weight, tracking, date, ornament, border })
          }
        }
      }
    }
  }
  return all
}

const grid = families.flatMap((family) => combinations(family).map((style) => ({ family, style })))

export function PostmarkSweep({ places }: { places: readonly PostmarkPlace[] }) {
  const [placeKey, setPlaceKey] = useState('')
  const [visitor, setVisitor] = useState(0)
  const root = useRef<HTMLDivElement>(null)
  const [result, setResult] = useState<ReturnType<typeof checkClearance>>()
  const place = places.find((candidate) => candidate.key === placeKey)

  useEffect(() => {
    let current = true
    if (!place) return undefined
    void document.fonts.ready.then(() => {
      if (current && root.current) setResult(checkClearance(root.current))
    })
    return () => {
      current = false
    }
  }, [place, visitor])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-caption text-muted-foreground">
          Place
          <select
            data-sweep-place
            className="h-8 rounded-full border border-border bg-surface-1 px-3 text-body text-foreground"
            value={placeKey}
            onChange={(event) => {
              setResult(undefined)
              setPlaceKey(event.target.value)
            }}
          >
            <option value="">Choose a place to sweep</option>
            {places.map((option) => (
              <option key={option.key} value={option.key}>
                {option.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-caption text-muted-foreground">
          Visitor
          <input
            data-sweep-visitor
            type="number"
            min={0}
            className="h-8 w-24 rounded-full border border-border bg-surface-1 px-3 text-body text-foreground tabular-nums"
            value={visitor}
            onChange={(event) => {
              setResult(undefined)
              setVisitor(Number(event.target.value) || 0)
            }}
          />
        </label>
        <p data-sweep-status className="pb-1.5 text-body text-muted-foreground tabular-nums">
          {!place
            ? `${grid.length} combinations across ${families.length} families`
            : !result
              ? 'Checking…'
              : result.clashed === 0
                ? `All ${result.checked} combinations clear`
                : `${result.clashed} of ${result.checked} combinations clash`}
        </p>
      </div>
      {result && result.messages.length > 0 && (
        <ul data-sweep-clashes className="space-y-1 text-body text-red-600 dark:text-red-400">
          {result.messages.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}
      {place && (
        <div ref={root} className="flex flex-wrap items-center gap-3">
          {grid.map(({ family, style }, index) => (
            <Postmark
              key={`${family}:${Object.values(style).join(':')}`}
              place={place}
              family={family}
              choices={style}
              visitor={visitor}
              salt={index}
              outline
              size={72}
            />
          ))}
        </div>
      )}
    </div>
  )
}
