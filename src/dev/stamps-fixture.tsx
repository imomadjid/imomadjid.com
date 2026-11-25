import { useEffect, useMemo, useState } from 'react'

import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { cn } from '#/lib/utils'

import type { Candidate } from '../../tools/stamps/candidate.ts'
import { countries } from '../../tools/stamps/countries.ts'
import type { CountryKey } from '../../tools/stamps/countries.ts'

// Picks the Guestbook's stamps from what tools/stamps/fetch.ts listed on Wikimedia Commons. Tap a
// stamp to keep it; Copy keep list gives the text for tools/stamps/keep/<country>.txt, which
// tools/stamps/import.ts turns into site assets. Picks persist in this browser until then.

const candidateFiles = import.meta.glob<Candidate[]>('../../tools/stamps/candidates/*.json', {
  import: 'default',
})
const keepFiles = import.meta.glob<string>('../../tools/stamps/keep/*.txt', {
  query: '?raw',
  import: 'default',
  eager: true,
})

const countryKeys = Object.keys(countries).filter((key): key is CountryKey => key in countries)

function fileFor(key: CountryKey, dir: 'candidates' | 'keep', extension: string) {
  return `../../tools/stamps/${dir}/${key}.${extension}`
}

function repoKeepList(key: CountryKey) {
  const text = keepFiles[fileFor(key, 'keep', 'txt')] ?? ''
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
}

function storageKey(key: CountryKey) {
  return `stamp-keep:${key}`
}

function loadKept(key: CountryKey) {
  try {
    const saved = localStorage.getItem(storageKey(key))
    if (saved) return new Set<string>(JSON.parse(saved))
  } catch {
    // Storage blocked or unreadable: start from the repo's list.
  }
  return new Set(repoKeepList(key))
}

type Show = 'all' | 'kept' | 'unkept'
type ColnectFilter = 'all' | 'hide' | 'only'

export function StampsFixture() {
  const [country, setCountry] = useState<CountryKey>('id')
  const [loaded, setLoaded] = useState<{ country: CountryKey; list: Candidate[] }>()
  const [kept, setKept] = useState<Set<string>>(() => new Set())
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [search, setSearch] = useState('')
  const [colnect, setColnect] = useState<ColnectFilter>('all')
  const [show, setShow] = useState<Show>('all')
  const [copyText, setCopyText] = useState<string>()
  const [copied, setCopied] = useState(false)

  const load = candidateFiles[fileFor(country, 'candidates', 'json')]
  const missing = !load
  const candidates = loaded?.country === country ? loaded.list : undefined

  // Picks load with the list, after hydration, since only the browser has localStorage.
  useEffect(() => {
    if (!load) return
    let current = true
    void load().then((list) => {
      if (!current) return
      setLoaded({ country, list })
      setKept(loadKept(country))
    })
    return () => {
      current = false
    }
  }, [country, load])

  function toggle(file: string) {
    const next = new Set(kept)
    if (!next.delete(file)) next.add(file)
    setKept(next)
    setCopied(false)
    try {
      localStorage.setItem(storageKey(country), JSON.stringify([...next]))
    } catch {
      // Picks then last only until reload.
    }
  }

  function revert() {
    try {
      localStorage.removeItem(storageKey(country))
    } catch {
      // Nothing saved to clear.
    }
    setKept(new Set(repoKeepList(country)))
  }

  const keepText = useMemo(() => {
    const files = [...kept].sort((a, b) => a.localeCompare(b))
    return `# Commons files kept for ${countries[country].name}, one per line.\n${files.join('\n')}\n`
  }, [kept, country])

  async function copy() {
    try {
      await navigator.clipboard.writeText(keepText)
      setCopied(true)
      setCopyText(undefined)
    } catch {
      setCopyText(keepText)
    }
  }

  const visible = useMemo(() => {
    const fromYear = Number(from) || 0
    const toYear = Number(to) || Number.POSITIVE_INFINITY
    const needle = search.trim().toLowerCase()
    return (candidates ?? []).filter((stamp) => {
      if (stamp.year < fromYear || stamp.year > toYear) return false
      if (colnect === 'hide' && stamp.colnect) return false
      if (colnect === 'only' && !stamp.colnect) return false
      if (show === 'kept' && !kept.has(stamp.file)) return false
      if (show === 'unkept' && kept.has(stamp.file)) return false
      if (!needle) return true
      const haystack = [stamp.title, stamp.series ?? '', ...stamp.themes].join(' ').toLowerCase()
      return haystack.includes(needle)
    })
  }, [candidates, from, to, search, colnect, show, kept])

  const byYear = useMemo(() => {
    const groups = new Map<number, Candidate[]>()
    for (const stamp of visible) groups.set(stamp.year, [...(groups.get(stamp.year) ?? []), stamp])
    return [...groups.entries()]
  }, [visible])

  const repoList = repoKeepList(country)
  const changed = repoList.length !== kept.size || repoList.some((file) => !kept.has(file))

  return (
    <div className="space-y-8 pb-24">
      <header className="max-w-3xl space-y-1">
        <h1 className="text-display font-medium">Stamps</h1>
        <p className="text-body text-muted-foreground">
          Every stamp Wikimedia Commons lists for a country, from tools/stamps/fetch.ts. Tap the
          ones the Guestbook should use: landmarks, food, animals, scenes. Copy keep list gives the
          text for tools/stamps/keep/{country}.txt.
        </p>
      </header>

      <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
        <Segment
          label="Country"
          value={country}
          options={countryKeys.map((key) => [key, countries[key].name])}
          onChange={setCountry}
        />
        <fieldset className="space-y-1">
          <legend className="mb-1 block text-caption text-muted-foreground">Years</legend>
          <span className="flex items-center gap-2">
            <Input
              size="compact"
              inputMode="numeric"
              placeholder="From"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              className="w-20"
              aria-label="From year"
            />
            <Input
              size="compact"
              inputMode="numeric"
              placeholder="To"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              className="w-20"
              aria-label="To year"
            />
          </span>
        </fieldset>
        <div className="space-y-1">
          <label htmlFor="stamp-search" className="block text-caption text-muted-foreground">
            Title, series or theme
          </label>
          <Input
            id="stamp-search"
            size="compact"
            placeholder="Fauna, Bali, batik…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-56"
          />
        </div>
        <Segment
          label="Colnect scans"
          value={colnect}
          options={[
            ['all', 'Include'],
            ['hide', 'Hide'],
            ['only', 'Only'],
          ]}
          onChange={setColnect}
        />
        <Segment
          label="Show"
          value={show}
          options={[
            ['all', 'All'],
            ['kept', 'Kept'],
            ['unkept', 'Not kept'],
          ]}
          onChange={setShow}
        />
      </div>

      {missing && (
        <p className="text-body text-muted-foreground">
          No candidates yet. Run <code>bun tools/stamps/fetch.ts {country}</code>.
        </p>
      )}
      {!missing && !candidates && <p className="text-body text-muted-foreground">Loading…</p>}

      {candidates && (
        <p className="text-body text-muted-foreground tabular-nums">
          {visible.length.toLocaleString()} of {candidates.length.toLocaleString()} stamps shown ·{' '}
          {kept.size.toLocaleString()} kept
        </p>
      )}

      {byYear.map(([year, stamps]) => (
        <section
          key={year}
          className="space-y-3 [contain-intrinsic-size:auto_480px] [content-visibility:auto]"
        >
          <h2 className="border-b border-border pb-2 text-title font-medium tabular-nums">
            {year}
            <span className="ml-2 text-body text-muted-foreground">{stamps.length}</span>
          </h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(132px,1fr))] gap-3">
            {stamps.map((stamp) => (
              <StampTile
                key={stamp.file}
                stamp={stamp}
                kept={kept.has(stamp.file)}
                onToggle={toggle}
              />
            ))}
          </div>
        </section>
      ))}

      <div className="fixed inset-x-0 bottom-0 z-40 flex flex-wrap items-center justify-end gap-2 border-t border-border bg-surface-1 py-3 pr-20 pl-4">
        <span className="mr-auto text-body text-muted-foreground tabular-nums">
          {kept.size} kept{changed ? ' · differs from the repo list' : ''}
        </span>
        {changed && (
          <Button variant="tertiary" size="compact" onClick={revert}>
            Revert to repo list
          </Button>
        )}
        <Button size="compact" onClick={() => void copy()} disabled={kept.size === 0}>
          {copied ? 'Copied' : 'Copy keep list'}
        </Button>
        {copyText && (
          <textarea
            key={copyText}
            readOnly
            defaultValue={copyText}
            aria-label="Keep list"
            className="h-32 w-full rounded-lg border border-border bg-transparent p-2 font-mono text-caption"
            onFocus={(event) => event.currentTarget.select()}
          />
        )}
      </div>
    </div>
  )
}

function Segment<Value extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: Value
  options: [Value, string][]
  onChange: (value: Value) => void
}) {
  return (
    <fieldset className="space-y-1">
      <legend className="mb-1 block text-caption text-muted-foreground">{label}</legend>
      <span className="flex gap-1">
        {options.map(([option, text]) => (
          <Button
            key={option}
            size="compact"
            variant={option === value ? 'secondary' : 'ghost'}
            aria-pressed={option === value}
            onClick={() => onChange(option)}
          >
            {text}
          </Button>
        ))}
      </span>
    </fieldset>
  )
}

function StampTile({
  stamp,
  kept,
  onToggle,
}: {
  stamp: Candidate
  kept: boolean
  onToggle: (file: string) => void
}) {
  const details = [
    stamp.issued,
    stamp.series,
    stamp.themes.join(', '),
    stamp.license,
    stamp.colnect ? 'Colnect scan' : stamp.source,
  ].filter(Boolean)

  return (
    <button
      type="button"
      aria-pressed={kept}
      onClick={() => onToggle(stamp.file)}
      title={[stamp.title, ...details].join('\n')}
      className={cn(
        'group flex flex-col gap-2 rounded-xl p-2 text-left transition-colors',
        kept ? 'bg-hover ring-2 ring-foreground' : 'hover:bg-hover',
      )}
    >
      <span className="flex aspect-square items-center justify-center overflow-hidden rounded-md bg-hover">
        <img
          src={stamp.thumb}
          alt=""
          loading="lazy"
          decoding="async"
          width={stamp.width}
          height={stamp.height}
          className={cn(
            'max-h-full max-w-full object-contain transition-opacity',
            !kept && 'opacity-90 group-hover:opacity-100',
          )}
        />
      </span>
      <span className="line-clamp-2 text-caption">{stamp.title}</span>
      <span className="flex items-center gap-1.5 text-caption text-muted-foreground">
        {kept && <span className="font-medium text-foreground">Kept</span>}
        {stamp.colnect && <span>Colnect</span>}
        {stamp.themes[0] && <span className="truncate">{stamp.themes[0]}</span>}
      </span>
    </button>
  )
}
