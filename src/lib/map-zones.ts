/**
 * The Resistance network as a schematic, not a survey.
 *
 * Coordinates are in a 100 × 72 viewBox so they read as percentages while
 * editing. Every node is grounded in a place the archive already names — the
 * Treasure Room, the submerged Satcomm tower, the Yamuna embankments — rather
 * than inventing new geography.
 *
 * `lore` must match a file in src/content/lore. `status` drives the styling:
 *   active — the node still answers
 *   dark   — known, but silent since 2073
 *   lost   — destroyed, flooded, or raided
 */

export type ZoneStatus = 'active' | 'dark' | 'lost';

export interface Zone {
  id: string;
  label: string;
  note: string;
  x: number;
  y: number;
  status: ZoneStatus;
  lore?: string;
}

export const zones: Zone[] = [
  {
    id: 'treasure-room',
    label: 'The Treasure Room',
    note: 'Archive vault. Raided in 2072, never entirely lost. Where all Salt Lamps reconnect.',
    x: 50,
    y: 36,
    status: 'active',
    lore: 'the-treasure-room',
  },
  {
    id: 'satcomm-tower',
    label: 'Submerged Satcomm Tower',
    note: "Rooftop relay used to intercept broadcasts. Rohan Kapoor's last known location.",
    x: 76,
    y: 20,
    status: 'lost',
    lore: 'rohan-kapoor',
  },
  {
    id: 'yamuna-embankments',
    label: 'Yamuna Embankments',
    note: 'Four embankments failed in 2069. Thousands displaced. Delhi drowned.',
    x: 74,
    y: 52,
    status: 'lost',
    lore: 'the-collapse',
  },
  {
    id: 'salt-relay',
    label: 'Deactivated Salt Relay',
    note: 'Obj-V078 was recovered here, beside a relay that had already stopped answering.',
    x: 26,
    y: 20,
    status: 'dark',
    lore: 'obj-v078',
  },
  {
    id: 'the-schools',
    label: 'The Schools',
    note: 'Virtual Layer Flooring laid for story-triggered playback. Walk it the way a child does.',
    x: 22,
    y: 50,
    status: 'active',
    lore: 'virtual-layer-flooring',
  },
  {
    id: 'relief-zones',
    label: 'Militarised Relief Zones',
    note: 'Coastal evacuation camps after 2055. Cooling suits, third-hand and humming.',
    x: 50,
    y: 64,
    status: 'dark',
    lore: 'cooling-suits',
  },
  {
    id: 'rooftops',
    label: 'The Rooftops',
    note: 'Where most of the listening was done, above the waterline and below the drones.',
    x: 62,
    y: 8,
    status: 'active',
    lore: 'the-resistance',
  },
  {
    id: 'curriculum-office',
    label: 'Curriculum Division',
    note: 'Where the 2061 rewrite was authored and unauthorised records were deleted.',
    x: 34,
    y: 8,
    status: 'lost',
    lore: 'p-a-i',
  },
];

/** Lamp routes between zones, as [from, to] zone ids. */
export const routes: Array<[string, string]> = [
  ['treasure-room', 'salt-relay'],
  ['treasure-room', 'satcomm-tower'],
  ['treasure-room', 'the-schools'],
  ['treasure-room', 'relief-zones'],
  ['treasure-room', 'yamuna-embankments'],
  ['salt-relay', 'curriculum-office'],
  ['satcomm-tower', 'rooftops'],
  ['rooftops', 'curriculum-office'],
  ['the-schools', 'relief-zones'],
  ['relief-zones', 'yamuna-embankments'],
];

export const statusLabel: Record<ZoneStatus, string> = {
  active: 'Still answering',
  dark: 'Silent since 2073',
  lost: 'Flooded or raided',
};
