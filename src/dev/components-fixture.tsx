import { ArrowRight, Plus, Settings, Trash2 } from 'lucide-react'
import { useState, type ReactNode } from 'react'

import { Badge, badgeColors, type BadgeColor } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Checkbox } from '#/components/ui/checkbox'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import { RadioGroup, RadioItem } from '#/components/ui/radio-group'
import { Slider } from '#/components/ui/slider'
import { Switch } from '#/components/ui/switch'
import { Textarea } from '#/components/ui/textarea'
import { Tooltip } from '#/components/ui/tooltip'
import { useShapeContext, type ShapeVariant } from '#/lib/shape-context'
import { SizeProvider, useSizeContext, type SizeVariant } from '#/lib/size-context'
import { setTheme, useTheme, type Theme } from '#/lib/theme'

const buttonVariants = ['primary', 'secondary', 'tertiary', 'ghost', 'destructive'] as const
const themes: Theme[] = ['system', 'light', 'dark']
const shapes: ShapeVariant[] = ['rounded', 'pill', 'sharp']
const sizes: SizeVariant[] = ['default', 'compact']
const badgeVariants = ['solid', 'dot', 'ghost'] as const
const sampleBadgeColors: BadgeColor[] = ['gray', 'accent', 'green', 'amber', 'red', 'violet']

export function ComponentsFixture() {
  // Shape comes from the root provider, so the switcher previews the site-wide setting.
  return (
    <SizeProvider>
      <div className="max-w-5xl space-y-14">
        <header className="space-y-4">
          <div className="space-y-1">
            <h1 className="text-display font-medium">Components</h1>
            <p className="text-body text-muted-foreground">
              Every installed Fluid Functionalism atom. Edit the sources in src/components/ui and
              the tokens in src/styles.css; this page hot-reloads.
            </p>
          </div>
          <SystemControls />
        </header>

        <ButtonMatrix />
        <BadgeSection />
        <SelectionSection />
        <TextFieldSection />
        <SliderSection />
        <TooltipSection />
      </div>
    </SizeProvider>
  )
}

function SystemControls() {
  const { shape, setShape } = useShapeContext()
  const { size, setSize } = useSizeContext()
  const theme = useTheme()

  return (
    <div className="flex flex-wrap gap-x-8 gap-y-3">
      <Segmented label="Theme" options={themes} value={theme} onChange={setTheme} />
      <Segmented label="Shape" options={shapes} value={shape} onChange={setShape} />
      <Segmented label="Size" options={sizes} value={size} onChange={setSize} />
    </div>
  )
}

function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: readonly T[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <fieldset>
      <legend className="sr-only">{label}</legend>
      <div className="flex items-center gap-2">
        <span aria-hidden="true" className="text-caption text-muted-foreground">
          {label}
        </span>
        <div className="flex gap-1">
          {options.map((option) => (
            <Button
              key={option}
              size="compact"
              variant={option === value ? 'secondary' : 'ghost'}
              aria-pressed={option === value}
              onClick={() => onChange(option)}
            >
              {option}
            </Button>
          ))}
        </div>
      </div>
    </fieldset>
  )
}

function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section className="space-y-5">
      <div className="space-y-0.5 border-b border-border pb-2">
        <h2 className="text-title font-medium">{title}</h2>
        {description && <p className="text-body text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  )
}

const buttonColumns = [
  'Label',
  'Leading icon',
  'Trailing icon',
  'Shortcut',
  'Icon only',
  'Active',
  'Loading',
  'Disabled',
]

function ButtonMatrix() {
  return (
    <Section
      title="Button"
      description="Rows are variants; columns are content and states. Hover and press each cell."
    >
      <div className="overflow-x-auto pb-2">
        <table className="border-separate border-spacing-x-4 border-spacing-y-3">
          <thead>
            <tr>
              <th scope="col" className="sr-only">
                Variant
              </th>
              {buttonColumns.map((column) => (
                <th
                  key={column}
                  scope="col"
                  className="text-left text-caption font-normal whitespace-nowrap text-muted-foreground"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {buttonVariants.map((variant) => (
              <tr key={variant}>
                <th
                  scope="row"
                  className="pr-2 text-left text-caption font-normal text-muted-foreground"
                >
                  {variant}
                </th>
                <td>
                  <Button variant={variant}>Save changes</Button>
                </td>
                <td>
                  <Button variant={variant} leadingIcon={Plus}>
                    New page
                  </Button>
                </td>
                <td>
                  <Button variant={variant} trailingIcon={ArrowRight}>
                    Continue
                  </Button>
                </td>
                <td>
                  <Button variant={variant} shortcut="⌘↵">
                    Send
                  </Button>
                </td>
                <td>
                  <div className="flex gap-2">
                    <Button variant={variant} size="icon" aria-label="Settings">
                      <Settings />
                    </Button>
                    <Button variant={variant} size="icon-compact" aria-label="Delete">
                      <Trash2 />
                    </Button>
                  </div>
                </td>
                <td>
                  <Button variant={variant} active>
                    Menu open
                  </Button>
                </td>
                <td>
                  <Button variant={variant} loading>
                    Saving
                  </Button>
                </td>
                <td>
                  <Button variant={variant} disabled>
                    Unavailable
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  )
}

function BadgeSection() {
  return (
    <Section title="Badge" description="Variants by color.">
      <div className="space-y-3">
        {badgeVariants.map((variant) => (
          <div key={variant} className="flex flex-wrap items-center gap-3">
            <span className="w-16 text-caption text-muted-foreground">{variant}</span>
            {sampleBadgeColors.map((color) => (
              <Badge key={color} variant={variant} color={color}>
                {color}
              </Badge>
            ))}
          </div>
        ))}
        <p className="text-caption text-muted-foreground">
          {Object.keys(badgeColors).length} colors available in badge.tsx.
        </p>
      </div>
    </Section>
  )
}

function SelectionSection() {
  const [checked, setChecked] = useState(true)
  const [enabled, setEnabled] = useState(true)
  const [plan, setPlan] = useState('monthly')

  return (
    <Section title="Selection" description="Checkbox, switch, and radio group.">
      <div className="grid gap-10 md:grid-cols-3">
        <FieldGroup>
          <Field orientation="horizontal">
            <Checkbox id="cb-controlled" checked={checked} onCheckedChange={setChecked} />
            <FieldLabel htmlFor="cb-controlled">Controlled ({checked ? 'on' : 'off'})</FieldLabel>
          </Field>
          <Field orientation="horizontal">
            <Checkbox id="cb-off" />
            <FieldLabel htmlFor="cb-off">Unchecked</FieldLabel>
          </Field>
          <Field orientation="horizontal">
            <Checkbox id="cb-mixed" indeterminate />
            <FieldLabel htmlFor="cb-mixed">Indeterminate</FieldLabel>
          </Field>
          <Field orientation="horizontal">
            <Checkbox id="cb-disabled" defaultChecked disabled />
            <FieldLabel htmlFor="cb-disabled">Disabled</FieldLabel>
          </Field>
        </FieldGroup>

        <div className="space-y-1">
          <Switch
            label="Email notifications"
            checked={enabled}
            onToggle={() => setEnabled((value) => !value)}
          />
          <Switch label="Off" checked={false} onToggle={() => {}} />
          <Switch label="Disabled" checked onToggle={() => {}} disabled />
        </div>

        <RadioGroup value={plan} onValueChange={setPlan} aria-label="Billing period">
          <RadioItem index={0} value="monthly" label="Monthly" />
          <RadioItem index={1} value="yearly" label="Yearly" />
          <RadioItem index={2} value="lifetime" label="Lifetime" />
        </RadioGroup>
      </div>
    </Section>
  )
}

function TextFieldSection() {
  return (
    <Section title="Text fields" description="Input and textarea inside Field.">
      <FieldGroup className="grid max-w-3xl gap-6 md:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="in-name">Name</FieldLabel>
          <Input id="in-name" placeholder="Imo Madjid" />
          <FieldDescription>Shown on your public profile.</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="in-email">Email</FieldLabel>
          <Input id="in-email" type="email" defaultValue="not-an-email" aria-invalid />
          <FieldError errors={[{ message: 'Enter a valid email address.' }]} />
        </Field>
        <Field>
          <FieldLabel htmlFor="in-disabled">Disabled</FieldLabel>
          <Input id="in-disabled" defaultValue="Read only value" disabled />
        </Field>
        <Field>
          <FieldLabel htmlFor="in-notes">Notes</FieldLabel>
          <Textarea id="in-notes" placeholder="Grows with its content." />
        </Field>
      </FieldGroup>
    </Section>
  )
}

function SliderSection() {
  const [single, setSingle] = useState<number | [number, number]>(40)
  const [range, setRange] = useState<number | [number, number]>([20, 70])
  const [scrub, setScrub] = useState<number | [number, number]>(0.6)

  return (
    <Section title="Slider" description="Single value, range, and the scrubber layout.">
      <div className="grid max-w-3xl gap-8 md:grid-cols-3">
        <Slider label="Volume" value={single} onChange={setSingle} showValue />
        <Slider label="Price range" value={range} onChange={setRange} showValue />
        <Slider
          label="Opacity"
          variant="scrubber"
          value={scrub}
          onChange={setScrub}
          min={0}
          max={1}
          step={0.05}
          showValue
        />
      </div>
    </Section>
  )
}

function TooltipSection() {
  return (
    <Section title="Tooltip" description="Hover or focus each trigger.">
      <div className="flex flex-wrap gap-3">
        <Tooltip content="Plain tooltip">
          <Button variant="tertiary">Hover me</Button>
        </Tooltip>
        <Tooltip content="Open settings" shortcut="⌘,">
          <Button variant="tertiary" size="icon" aria-label="Settings">
            <Settings />
          </Button>
        </Tooltip>
        <Tooltip content="Placed on the right" side="right">
          <Button variant="ghost">Right side</Button>
        </Tooltip>
      </div>
    </Section>
  )
}
