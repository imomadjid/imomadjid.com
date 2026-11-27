# Postmark pictorials: style guide

Every postmark in the postmark footer carries a pictorial of the visitor's place, drawn as a postmark die would cut it: one ink, line first, a single subject. Many hands (people and agents) will add pictorials over time. On a shared wall they must look as if one engraver cut them all, so this guide is a contract, not a mood.

The look comes from Japan Post's scenic postmarks (風景印, fūkeiin) and Deutsche Post's special handstamps, thickened for a screen. Postal dies print lines of 0.2–0.4 mm on a 35 mm stamp, which would vanish on a 64 px screen tile, so every line here is about 2–2.5 times the die's relative weight.

The eight drawings in `src/dev/postmark-pictorials.tsx` are the reference set. When this guide and the reference set seem to disagree, match the reference set and fix the guide.

## The canvas

- `viewBox="0 0 100 100"`, one ink: `currentColor`. The postmark sets the colour, so never name one.
- Each entry in `pictorials` has a key of its own (`bandung`, or `san-francisco-lombard` for a second drawing) and:
  - `subject`: what it shows, in a few words (`'Gedung Sate, Bandung'`). It becomes part of the postmark's accessible name.
  - `scopes`: the places it stands for, most specific first. `city:<place key>` for a city, `region:<country code>:<region>` for a region as Cloudflare names it (`region:ID:West Java`), `country:<code>` for a country (`country:SG`). A drawing can list several scopes (Borobudur stands for Central Java and Indonesia). A visitor is dealt from every drawing their city and region have, each weighted by its level (city 4, region 3), so a drawing scoped to a region turns up for every city in it. The region's map outline counts as one of the region's drawings, and the country's drawings come only for a visitor Cloudflare knows no region for. Scope a built landmark of one city (a bridge, a tower, a museum) to that city's place keys (`city:us-illinois-chicago`, as the ledger keys a place: country code, region and city in lowercase with hyphens), never to its region, or it turns up in towns across the state that aren't that city; natural features and state symbols (a mountain, a bird, a crop) are the region's. Regions are the main unit: Cloudflare places a visitor's region more reliably than their city, and `tools/postmarks/subjects.md` lists what to draw for each.
  - `ink`: the box `[x, y, w, h]` the drawing's ink covers, strokes included. Lettering clears this box instead of the whole square, so a wrong box lets text run into the drawing. The review sheet measures it for you.
  - `draw(id)`: the drawing. Prefix any `id` with the one passed in (`` `${id}-cut` ``), because many postmarks share a page.
- The drawing inherits `pictorialStroke`: no fill, stroke `currentColor` at 3.4, round caps and round joins. Rubber rounds every corner anyway, so never use butt caps or miter joins.
- Allowed elements: `path`, `circle`, `ellipse`, `rect`, `line`, `polyline`, `polygon`, `g`, and `mask` with `defs` for cutting one shape around another.
- Never use text, gradients, opacity, filters, `style`, patterns, images or a second colour. Inside a `mask`, `#fff` and `#000` are the only colours.

## Line weights

Use exactly three weights. The step between them is what reads as printed rather than drawn.

| Weight                | Use                                                                                                          |
| --------------------- | ------------------------------------------------------------------------------------------------------------ |
| **3.4** (the default) | The subject's contour and its focal structure: a building's outline, a tower's legs, an animal's silhouette. |
| **2.4**               | Secondary structure, background, water, ground detail, a second plane.                                       |
| **1.8** or **1.6**    | Short interior ticks only: window mullions, suspender cables, clock hands, fur marks. Never a long line.     |

Nothing thinner, ever. A stroke inside a `mask` (the black cut around an overlapping shape) may be any width, usually 5–6.

## Composition

- **One subject.** Add at most two supporting elements: a ground or water line, a mountain behind, the sun. If a place needs two landmarks to be recognised, it needs a different subject.
- **The subject fills the frame.** It should stand at least 50 units tall, centred, its mass slightly below the middle.
- **Ground it.** Most subjects stand on a ground or water line at y 82–92. That anchors the drawing inside a round frame and leaves the postmark's lower lettering a clear band.
- **Margins.** Keep 4 units clear on every side. The exceptions are ground, water, cables and eaves, which may run to the edge so they can meet a frame.
- **Frontal and symmetrical** for architecture. Three-quarter perspective blurs under the ink texture and reads as a mistake. Animals and plants sit in clear profile or a frontal pose.

## Detail budget

| Measure                               | Range                                                                   |
| ------------------------------------- | ----------------------------------------------------------------------- |
| Drawn elements (outside masks)        | 10–27; the test allows 8–30                                             |
| Ink coverage at 200 px                | about 14–26%                                                            |
| Solid accents (`fill="currentColor"`) | Each at least 3 units across, all together at most about 12% of the box |
| Gap between parallel strokes          | At least 3 units. The ink filter closes anything under about 2.5.       |

- Use solids as the darkest tone, on the focal point: windows, a doorway, an eye, seeds, a leaf. Never fill a large mass. Hatch it at 45° (stroke 1.8, pitch 4.5) or leave it as outline, as Deutsche Post requires for dies.
- **The squint test.** Fill the silhouette solid in your head. If that blob isn't the subject, no amount of detail will save it; choose a different view or subject.

## Depth, without shading

- **Overlap with a gap.** Break the line behind 3–4 units before it meets the shape in front. Use a `mask` holding a fattened copy of the front shape; Depok's star slice cutting its fruit is the example.
- **Weight hierarchy.** Nearer is heavier: Tugu at 3.4 in front of Merapi at 2.4.
- **Dotted lines** for smoke, haze, spray or a far ridge: `strokeDasharray="0.1 4.5"` with round caps.
- **Diminishing repetition.** Suspender cables, waves, bars, steps.
- **Height in the picture.** Distant things sit higher and smaller.

## Several drawings of a place

A city with many visitors needs several drawings, or its wall repeats. Each drawing is a different composition, never a variant of another: a second subject (Lombard Street beside the Golden Gate), or the same subject from another view (the bridge's whole span from the side, one tower from below, the span from above with the bay). Keep to frontal, side and top-down views: they're the ones a die cuts cleanly in three weights. Don't make a drawing by mirroring, cropping or adding a layer to another one; two drawings of one subject should each pass the squint test as a different blob.

## Choosing the subject

1. **It must belong to the place, and you must verify it.** Check the administrative area, not just the city. Monas is in Central Jakarta, so it can't stand for West Jakarta. Borobudur is in Magelang, so it can't stand for Yogyakarta. Write one comment line in the entry saying why the subject belongs (an official city icon, a landmark's address, a festival).
2. **Order of preference:**
   - a city's own official icon or its most-recognised landmark;
   - a building, bridge, monument or natural feature, places of worship included, drawn as architecture;
   - a plant, animal or food the place is known for;
   - a generic figure in local dress.
3. **For a country,** follow the same order, preferring something every visitor from there would recognise over the capital's skyline.
4. **Never draw:**
   - flags or coats of arms;
   - logos, mascots or trademarked designs;
   - symbols whose depiction is controlled (Singapore's Merlion, which the Singapore Tourism Board licenses);
   - a likeness of a real living person;
   - religious figures, symbols or scripture, on a place of worship or anywhere else;
   - anything that mocks the place.
5. **Original drawings only.** Draw from the subject's real geometry. Never trace or copy someone else's artwork, icons or emoji. Public-domain engravings may guide proportions.

## What the reference set teaches

| Key             | Subject            | Learn from it                                                                                                                                          |
| --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `bandung`       | Gedung Sate        | Tiered architecture with small solid windows. Its six-bead pinnacle fuses below 120 px; keep repeated beads larger than 3 units.                       |
| `jakarta-barat` | Museum Fatahillah  | A frontal facade: rows of solid windows give it tone without shading.                                                                                  |
| `london`        | Elizabeth Tower    | One vertical object, the fewest lines, with water at the base.                                                                                         |
| `san-francisco` | Golden Gate tower  | Repetition (suspenders) at 1.6 against 3.4 structure.                                                                                                  |
| `singapore`     | Supertrees         | Three of a kind at diminishing size, joined by a skyway.                                                                                               |
| `yogyakarta`    | Tugu before Merapi | Weight hierarchy, with dotted smoke for the volcano.                                                                                                   |
| `depok`         | Starfruit          | A masked overlap. The whole fruit alone reads as a cacao pod, so the cut star carries it: give a plant or food a cross-section or other telltale view. |
| `shibuya`       | Hachikō            | An animal in profile on a plinth. At 64 px the head can read as a fox, so exaggerate the feature that tells a species apart (ear set, muzzle, tail).   |

## Process

1. Pick the subject and write its "why it belongs" line.
2. Draw it in `src/dev/postmark-pictorials.tsx`, in an entry of its own with its `scopes`.
3. Open `/dev/postmarks` and find it in **Pictorials**, which shows every drawing at 64 px and 200 px beside the reference set. Check it at 64 px: that's its size on the wall.
4. Copy the **measured** ink box from the sheet into `ink`. The sheet flags any drawing whose stored box is off by more than 2 units.
5. Run `bun test src/dev/postmark-pictorials.test.ts`. It enforces the canvas, weights, colours and budgets above.
6. Look at it in a few families on the same page (Every family). The clearance line must still say the lettering clears every border.

## Review checklist

A reviewer accepts a drawing only if every answer is yes:

- [ ] Recognisable at 64 px as this place's subject, with no label.
- [ ] Next to the reference set, it looks cut by the same hand: same weights, same density, same corner rounding.
- [ ] Only the three weights; 3.4 on the contour.
- [ ] Ink coverage and element count inside the budget.
- [ ] No gap under 3 units that the ink would close.
- [ ] Grounded and centred, with margins kept.
- [ ] The subject verifiably belongs to this place, and the entry says why.
- [ ] None of the never-draw list.
- [ ] Stored ink box matches the measured one; the tests and the clearance check pass.
