# Postmark pictorials: what to draw

The plan for `src/dev/postmark-pictorials.tsx`, region first. Cloudflare places a visitor's region (a US state, an Indonesian province) more reliably than their city, a region's drawings reach every city in it, and the list of regions is finite. So:

1. **Breadth:** one drawing for every region of a country we cover, so no visitor from it falls back to the country's drawings.
2. **Depth:** three or four for the regions that send visitors, with city drawings on top only for cities that send many.
3. **Country drawings** stand in for a region not drawn yet, and only there: a region with a drawing of its own never deals its country's, so depth comes from more drawings of the region, not the country.

Each line is one drawing, under the scope it goes in (`region:US:California`, as Cloudflare names the region). A drawing that also stands for its country lists both scopes. Every subject still needs its "why it belongs" line checked when it's drawn (`pictorial-style.md`), and two drawings of one subject must be different compositions. _(have)_ marks drawings that exist.

## United States

**Country** (`country:US`): bison on the prairie _(have)_; red barn with a windmill.

**Breadth, one per state:**

| State         | Subject                                        | State          | Subject                                       |
| ------------- | ---------------------------------------------- | -------------- | --------------------------------------------- |
| Alabama       | Saturn V rocket, Huntsville _(have)_           | Montana        | Mountain goat, Glacier _(have)_               |
| Alaska        | Denali _(have)_                                | Nebraska       | Chimney Rock _(have)_                         |
| Arizona       | Saguaro _(have)_                               | Nevada         | Hoover Dam (also Arizona) _(have)_            |
| Arkansas      | The Old Mill, North Little Rock _(have)_       | New Hampshire  | Mount Washington and its cog railway _(have)_ |
| California    | Half Dome _(have)_                             | New Jersey     | Lucy the Elephant, Margate _(have)_           |
| Colorado      | Maroon Bells _(have)_                          | New Mexico     | Balloons over the Sandias _(have)_            |
| Connecticut   | Charles W. Morgan whaleship, Mystic _(have)_   | New York       | Statue of Liberty _(have)_                    |
| Delaware      | Breakwater East End Lighthouse, Lewes _(have)_ | North Carolina | Wright Flyer, Kitty Hawk _(have)_             |
| D.C.          | Capitol dome _(have)_                          | North Dakota   | Badlands buttes _(have)_                      |
| Florida       | Alligator in the Everglades _(have)_           | Ohio           | Buckeye nut and leaf _(have)_                 |
| Georgia       | Peach, cut to show its stone _(have)_          | Oklahoma       | Scissor-tailed flycatcher _(have)_            |
| Hawaii        | Diamond Head _(have)_                          | Oregon         | Crater Lake and Wizard Island _(have)_        |
| Idaho         | Shoshone Falls _(have)_                        | Pennsylvania   | Liberty Bell _(have)_                         |
| Illinois      | Chicago Water Tower _(have)_                   | Rhode Island   | Rhode Island Red hen _(have)_                 |
| Indiana       | Covered bridge, Parke County _(have)_          | South Carolina | Angel Oak _(have)_                            |
| Iowa          | The American Gothic house, Eldon _(have)_      | South Dakota   | Corn Palace, Mitchell _(have)_                |
| Kansas        | Sunflower _(have)_                             | Tennessee      | Parthenon, Nashville _(have)_                 |
| Kentucky      | Thoroughbred horse _(have)_                    | Texas          | The Alamo _(have)_                            |
| Louisiana     | Brown pelican _(have)_                         | Utah           | Delicate Arch _(have)_                        |
| Maine         | Portland Head Light _(have)_                   | Vermont        | Sugar maple with a sap bucket _(have)_        |
| Maryland      | Blue crab _(have)_                             | Virginia       | Monticello _(have)_                           |
| Massachusetts | Old North Church steeple _(have)_              | Washington     | Mount Rainier _(have)_                        |
| Michigan      | Mackinac Bridge _(have)_                       | West Virginia  | New River Gorge Bridge _(have)_               |
| Minnesota     | Common loon _(have)_                           | Wisconsin      | Holstein cow _(have)_                         |
| Mississippi   | Magnolia blossom _(have)_                      | Wyoming        | Old Faithful _(have)_                         |
| Missouri      | Gateway Arch _(have)_                          |                |                                               |

**Depth, first:**

- **California:** Joshua tree; giant sequoia; California poppy.
- **San Francisco** (`city:san-francisco`): Golden Gate tower _(have)_; the whole span from the side _(have)_; cable car _(have)_; Painted Ladies; Coit Tower.
- **New York:** Brooklyn Bridge; Flatiron Building; Niagara Falls.
- **Texas:** longhorn; bluebonnets; oil pumpjack.
- **Washington:** orca; state ferry.

## Indonesia

**Country** (`country:ID`): Borobudur (also Central Java) _(have)_; Komodo dragon (also East Nusa Tenggara) _(have)_; Rafflesia _(have)_.

**Breadth, first wave** (the six provinces on Java, then Bali, North Sumatra and South Sulawesi):

- **Jakarta:** Museum Fatahillah _(have, West Jakarta)_; Monas _(have)_; Istiqlal Mosque _(have)_; ondel-ondel _(have)_; bajaj _(have)_.
- **West Java:** Gedung Sate _(have)_; Tangkuban Perahu crater _(have)_.
  - **Depok** (`city:depok`): starfruit cross-section _(have)_; Masjid Kubah Emas _(have)_; UI Central Library.
  - **Bandung** (`city:bandung`): Gedung Merdeka; Pasupati bridge.
- **Banten:** Masjid Agung Banten _(have)_; Javan rhino, Ujung Kulon _(have)_.
- **Central Java:** Borobudur _(have)_; Lawang Sewu, Semarang _(have)_.
- **Yogyakarta:** Tugu before Merapi _(have)_; Prambanan _(have)_; Taman Sari; Kraton pavilion.
- **East Java:** Mount Bromo _(have)_; Suramadu bridge _(have)_; Tugu Pahlawan, Surabaya _(have)_.
- **Bali:** candi bentar gate _(have)_; Jatiluwih rice terraces _(have)_.
- **North Sumatra:** Istana Maimun, Medan _(have)_; Batak house on Lake Toba _(have)_.
- **South Sulawesi:** Toraja tongkonan _(have)_; pinisi schooner _(have)_.

The other provinces follow, one each, once the first wave is drawn.

## Other countries

Country drawings first, then the regions that send visitors.

- **Japan:** Mount Fuji _(have)_; cherry blossom branch; five-storey pagoda; maneki-neko.
  - **Tokyo:** Kaminarimon gate, its lantern without lettering _(have)_. **Shibuya** (`city:shibuya`): Hachikō _(have)_; the Scramble crossing from above.
- **United Kingdom:** England: Stonehenge _(have)_. Scotland: Highland cow _(have)_.
  - **London** (`city:london`): Elizabeth Tower _(have)_; Tower Bridge; St Paul's dome.
- **Singapore** (`country:SG`): Supertrees _(have)_; shophouse row; Vanda Miss Joaquim orchid; Sultan Mosque; Cavenagh Bridge.
- **Malaysia:** hibiscus _(have)_; rhinoceros hornbill. Kuala Lumpur: Sultan Abdul Samad Building.
- **Australia:** kangaroo _(have)_; koala. New South Wales: Sydney Harbour Bridge. Victoria: Twelve Apostles.
- **India:** Taj Mahal _(have)_; auto-rickshaw; peacock. Maharashtra: Gateway of India.
- **Netherlands:** windmill _(have)_; tulip field; bicycle. North Holland: Amsterdam canal houses.
- **Germany:** half-timbered house _(have)_. Bremen: the Town Musicians _(have)_. Berlin: Brandenburg Gate. Bavaria: Neuschwanstein. North Rhine-Westphalia: Cologne Cathedral.
- **France:** Mont-Saint-Michel _(have)_; Pont du Gard. Île-de-France: Eiffel Tower by day; Arc de Triomphe.
- **South Korea:** hanok house _(have)_; rose of Sharon. Seoul: Gyeongbokgung gate. North Gyeongsang: Cheomseongdae.
- **Philippines:** jeepney _(have)_; Banaue rice terraces; Chocolate Hills; tarsier.
- **Canada:** moose _(have)_; canoe on a spruce lake. Quebec: Château Frontenac.

## Not on the list

Tried and dropped, because they don't read at 64 px: the starfruit on the branch (without its cut star, a side-view starfruit reads as a bell pepper or okra) Lombard Street from above (its switchbacks in plan read as a coil spring), and the angklung (in front view its tubes and cut tongues read as bottles, chess pawns or fingers).

Left out under the style guide's never-draw rules: the Sydney Opera House, Marina Bay Sands, the Petronas Towers, Tokyo Tower, Tokyo Skytree, the Space Needle, the Empire State Building, the Hollywood sign, Churchill Downs' twin spires, Cloud Gate, the Transamerica Pyramid, the K6 phone box, the Shinkansen, the Merlion and Thorncrown Chapel (protected designs); Uluru and Taos Pueblo (their peoples restrict images of them); the Eiffel Tower lit at night; torii gates and the lotus (religious symbols); the Garuda and the maple leaf (national emblems).
