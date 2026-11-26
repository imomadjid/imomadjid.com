# Postmark pictorials: what to draw

The plan for `src/dev/postmark-pictorials.tsx`, region first. Cloudflare places a visitor's region (a US state, an Indonesian province) more reliably than their city, a region's drawings reach every city in it, and the list of regions is finite. So:

1. **Breadth:** one drawing for every region of a country we cover, so no visitor from it falls back to the country's drawings.
2. **Depth:** three or four for the regions that send visitors, with city drawings on top only for cities that send many.
3. **Country drawings** stand in for a region not drawn yet, and are dealt to every region less often.

Each line is one drawing, under the scope it goes in (`region:US:California`, as Cloudflare names the region). A drawing that also stands for its country lists both scopes. Every subject still needs its "why it belongs" line checked when it's drawn (`pictorial-style.md`), and two drawings of one subject must be different compositions. _(have)_ marks drawings that exist.

## United States

**Country** (`country:US`): bison on the prairie; red barn with a windmill.

**Breadth, one per state:**

| State         | Subject                               | State          | Subject                              |
| ------------- | ------------------------------------- | -------------- | ------------------------------------ |
| Alabama       | Saturn V rocket, Huntsville           | Montana        | Mountain goat, Glacier               |
| Alaska        | Denali                                | Nebraska       | Chimney Rock                         |
| Arizona       | Saguaro                               | Nevada         | Hoover Dam (also Arizona)            |
| Arkansas      | Thorncrown Chapel, Eureka Springs     | New Hampshire  | Mount Washington and its cog railway |
| California    | Half Dome _(have)_                    | New Jersey     | Lucy the Elephant, Margate           |
| Colorado      | Maroon Bells                          | New Mexico     | Balloons over the Sandias            |
| Connecticut   | Charles W. Morgan whaleship, Mystic   | New York       | Statue of Liberty _(have)_           |
| Delaware      | Breakwater East End Lighthouse, Lewes | North Carolina | Wright Flyer, Kitty Hawk             |
| D.C.          | Capitol dome                          | North Dakota   | Badlands buttes                      |
| Florida       | Alligator in the Everglades           | Ohio           | Buckeye nut and leaf                 |
| Georgia       | Peach, cut to show its stone          | Oklahoma       | Scissor-tailed flycatcher            |
| Hawaii        | Diamond Head                          | Oregon         | Crater Lake and Wizard Island        |
| Idaho         | Shoshone Falls                        | Pennsylvania   | Liberty Bell                         |
| Illinois      | Chicago Water Tower                   | Rhode Island   | Rhode Island Red hen                 |
| Indiana       | Covered bridge, Parke County          | South Carolina | Angel Oak                            |
| Iowa          | The American Gothic house, Eldon      | South Dakota   | Corn Palace, Mitchell                |
| Kansas        | Sunflower                             | Tennessee      | Parthenon, Nashville                 |
| Kentucky      | Thoroughbred horse                    | Texas          | The Alamo _(have)_                   |
| Louisiana     | Brown pelican                         | Utah           | Delicate Arch                        |
| Maine         | Portland Head Light                   | Vermont        | Sugar maple with a sap bucket        |
| Maryland      | Blue crab _(have)_                    | Virginia       | Monticello                           |
| Massachusetts | Old North Church steeple              | Washington     | Mount Rainier                        |
| Michigan      | Mackinac Bridge                       | West Virginia  | New River Gorge Bridge               |
| Minnesota     | Common loon                           | Wisconsin      | Holstein cow                         |
| Mississippi   | Magnolia blossom                      | Wyoming        | Old Faithful                         |
| Missouri      | Gateway Arch                          |                |                                      |

**Depth, first:**

- **California:** Joshua tree; giant sequoia; California poppy.
- **San Francisco** (`city:san-francisco`): Golden Gate tower _(have)_; the whole span from the side _(have)_; cable car _(have)_; Painted Ladies; Coit Tower.
- **New York:** Brooklyn Bridge; Flatiron Building; Niagara Falls.
- **Texas:** longhorn; bluebonnets; oil pumpjack.
- **Washington:** orca; state ferry.

## Indonesia

**Country** (`country:ID`): Borobudur (also Central Java); Komodo dragon (also East Nusa Tenggara); Rafflesia.

**Breadth, first wave** (the six provinces on Java, then Bali, North Sumatra and South Sulawesi):

- **Jakarta:** Museum Fatahillah _(have, West Jakarta)_; Monas _(have)_; Istiqlal Mosque; ondel-ondel; bajaj.
- **West Java:** Gedung Sate _(have)_; Tangkuban Perahu crater; angklung.
  - **Depok** (`city:depok`): starfruit cross-section _(have)_; Masjid Kubah Emas _(have)_; UI Central Library.
  - **Bandung** (`city:bandung`): Gedung Merdeka; Pasupati bridge.
- **Banten:** Masjid Agung Banten; Javan rhino, Ujung Kulon.
- **Central Java:** Borobudur; Lawang Sewu, Semarang.
- **Yogyakarta:** Tugu before Merapi _(have)_; Prambanan; Taman Sari; Kraton pavilion.
- **East Java:** Mount Bromo; Suramadu bridge; Tugu Pahlawan, Surabaya.
- **Bali:** candi bentar gate; Jatiluwih rice terraces.
- **North Sumatra:** Istana Maimun, Medan; Batak house on Lake Toba.
- **South Sulawesi:** Toraja tongkonan; pinisi schooner.

The other provinces follow, one each, once the first wave is drawn.

## Other countries

Country drawings first, then the regions that send visitors.

- **Japan:** Mount Fuji _(have)_; cherry blossom branch; five-storey pagoda; maneki-neko.
  - **Tokyo:** Kaminarimon gate, its lantern without lettering. **Shibuya** (`city:shibuya`): Hachikō _(have)_; the Scramble crossing from above.
- **United Kingdom:** England: Stonehenge. Scotland: Highland cow.
  - **London** (`city:london`): Elizabeth Tower _(have)_; Tower Bridge; St Paul's dome.
- **Singapore** (`country:SG`): Supertrees _(have)_; shophouse row; Vanda Miss Joaquim orchid; Sultan Mosque; Cavenagh Bridge.
- **Malaysia:** hibiscus; rhinoceros hornbill. Kuala Lumpur: Sultan Abdul Samad Building.
- **Australia:** kangaroo; koala. New South Wales: Sydney Harbour Bridge. Victoria: Twelve Apostles.
- **India:** Taj Mahal; auto-rickshaw; peacock. Maharashtra: Gateway of India.
- **Netherlands:** windmill; tulip field; bicycle. North Holland: Amsterdam canal houses.
- **Germany:** half-timbered house. Berlin: Brandenburg Gate. Bavaria: Neuschwanstein. North Rhine-Westphalia: Cologne Cathedral.
- **France:** Mont-Saint-Michel; Pont du Gard. Île-de-France: Eiffel Tower by day; Arc de Triomphe.
- **South Korea:** hanok house; rose of Sharon. Seoul: Gyeongbokgung gate. North Gyeongsang: Cheomseongdae.
- **Philippines:** jeepney; Banaue rice terraces; Chocolate Hills; tarsier.
- **Canada:** moose; canoe on a spruce lake. Quebec: Château Frontenac.

## Not on the list

Tried and dropped, because they don't read at 64 px: the starfruit on the branch (without its cut star, a side-view starfruit reads as a bell pepper or okra) and Lombard Street from above (its switchbacks in plan read as a coil spring).

Left out under the style guide's never-draw rules: the Sydney Opera House, Marina Bay Sands, the Petronas Towers, Tokyo Tower, Tokyo Skytree, the Space Needle, the Empire State Building, the Hollywood sign, Churchill Downs' twin spires, Cloud Gate, the Transamerica Pyramid, the K6 phone box, the Shinkansen and the Merlion (protected designs); Uluru and Taos Pueblo (their peoples restrict images of them); the Eiffel Tower lit at night; torii gates and the lotus (religious symbols); the Garuda and the maple leaf (national emblems).
