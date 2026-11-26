import type { PostmarkPlace } from './postmark-kit'

// Real places whose names are hard to letter, for the combination sweep on /dev/postmarks: the
// longest, the widest (M and W), stacked Vietnamese accents, cedillas and ogoneks that drop below
// the baseline, long regions, and names short enough to set at a slot's largest size. They have
// no pictorial and share one placeholder outline, so lettering clears the outline's whole square,
// the most it ever has to.

// A rounded blob standing in for a map outline.
const outline =
  'M50 6C71 6 92 20 94 42C96 62 84 80 66 90C52 97 34 96 21 86C8 76 4 58 8 42C12 22 30 6 50 6Z'

const place = (
  key: string,
  name: string,
  region: string,
  country: string,
  countryCode: string,
): PostmarkPlace => ({ key, name, region, country, countryCode, outline })

export const stressPlaces: PostmarkPlace[] = [
  place('thiruvananthapuram', 'Thiruvananthapuram', 'Kerala', 'India', 'IN'),
  place('llanfairpwllgwyngyll', 'Llanfairpwllgwyngyll', 'Wales', 'United Kingdom', 'GB'),
  place('wloclawek', 'Włocławek', 'Kuyavian-Pomeranian Voivodeship', 'Poland', 'PL'),
  place('sao-jose-dos-campos', 'São José dos Campos', 'São Paulo', 'Brazil', 'BR'),
  place(
    'saint-remy-de-provence',
    'Saint-Rémy-de-Provence',
    "Provence-Alpes-Côte d'Azur",
    'France',
    'FR',
  ),
  place('ho-chi-minh', 'Hồ Chí Minh', 'Hồ Chí Minh', 'Việt Nam', 'VN'),
  place('canakkale', 'Çanakkale', 'Çanakkale', 'Türkiye', 'TR'),
  place('zurich', 'Zürich', 'Zürich', 'Switzerland', 'CH'),
  place('bandar-seri-begawan', 'Bandar Seri Begawan', 'Brunei-Muara', 'Brunei', 'BN'),
  place('ise', 'Ise', 'Mie', 'Japan', 'JP'),
  place('y', 'Y', 'Hauts-de-France', 'France', 'FR'),
]
