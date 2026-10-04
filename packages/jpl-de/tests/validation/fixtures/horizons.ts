/**
 * Validation fixtures: JPL Horizons reference positions for `@jauza/jpl-de`.
 *
 * Query (Horizons API, VECTORS ephemeris, `REF_PLANE=FRAME` → ICRF):
 *   https://ssd.jpl.nasa.gov/api/horizons.api?format=json&COMMAND='301'&OBJ_DATA='NO'
 *     &MAKE_EPHEM='YES'&EPHEM_TYPE='VECTORS'&CENTER='500@399'&REF_PLANE='FRAME'
 *     &VEC_TABLE='1'&START_TIME='<utc>'&STOP_TIME='<utc+1d>'&STEP_SIZE='1'
 * Target `301` = Moon, `10` = Sun; center `500@399` = Earth geocenter.
 *
 * Values are the GEOMETRIC state vectors (no light-time/aberration, `VEC_CORR=NONE`)
 * in the ICRF reference frame, converted to RA/Dec (degrees) and distance (km):
 *   ra = atan2(Y, X)  (in [0, 360));  dec = asin(Z / r);  r = |(X, Y, Z)|
 * The UTC instant matches jpl-de's `jdToUtcString(jd) → str2et_c` path.
 *
 * Epochs span the DE440 validity range (1550–2650). Pre-1962 epochs use UT1 on
 * the Horizons side while jpl-de feeds UTC through the leap-seconds kernel, so
 * those rows carry a documented ~0.006° / ~5 km time-convention offset; 1962+
 * epochs match to < 1e-4°.
 */

export type HorizonsCell = {
  label: string;
  /** UTC Julian Day number (midnight). */
  jd: number;
  /** Calendar instant used in the Horizons query (UTC). */
  utc: string;
  body: "SUN" | "MOON";
  /** Geocentric ICRF right ascension, degrees. */
  raDeg: number;
  /** Geocentric ICRF declination, degrees. */
  decDeg: number;
  /** Geocentric distance, km. */
  rKm: number;
};

export const HORIZONS_CELLS: readonly HorizonsCell[] = [
  {
    label: "1700-01-01",
    jd: 2341972.5,
    utc: "1700-Jan-01 00:00:00",
    body: "SUN",
    raDeg: 286.187686,
    decDeg: -22.64257,
    rKm: 147077853.627,
  },
  {
    label: "1700-01-01",
    jd: 2341972.5,
    utc: "1700-Jan-01 00:00:00",
    body: "MOON",
    raDeg: 42.966552,
    decDeg: 12.214826,
    rKm: 376097.276,
  },
  {
    label: "1850-01-01",
    jd: 2396758.5,
    utc: "1850-Jan-01 00:00:00",
    body: "SUN",
    raDeg: 283.467988,
    decDeg: -22.880598,
    rKm: 147089406.472,
  },
  {
    label: "1850-01-01",
    jd: 2396758.5,
    utc: "1850-Jan-01 00:00:00",
    body: "MOON",
    raDeg: 138.683394,
    decDeg: 15.035651,
    rKm: 361833.34,
  },
  {
    label: "1992-10-13",
    jd: 2448908.5,
    utc: "1992-Oct-13 00:00:00",
    body: "SUN",
    raDeg: 198.47417,
    decDeg: -7.82271,
    rKm: 149240080.366,
  },
  {
    label: "1992-10-13",
    jd: 2448908.5,
    utc: "1992-Oct-13 00:00:00",
    body: "MOON",
    raDeg: 30.794701,
    decDeg: 16.585176,
    rKm: 393366.689,
  },
  {
    label: "2025-06-01",
    jd: 2460827.5,
    utc: "2025-Jun-01 00:00:00",
    body: "SUN",
    raDeg: 68.811639,
    decDeg: 22.007456,
    rKm: 151687353.849,
  },
  {
    label: "2025-06-01",
    jd: 2460827.5,
    utc: "2025-Jun-01 00:00:00",
    body: "MOON",
    raDeg: 138.579729,
    decDeg: 19.29952,
    rKm: 383805.41,
  },
  {
    label: "2600-01-01",
    jd: 2670690.5,
    utc: "2600-Jan-01 00:00:00",
    body: "SUN",
    raDeg: 272.014202,
    decDeg: -23.349137,
    rKm: 147198941.601,
  },
  {
    label: "2600-01-01",
    jd: 2670690.5,
    utc: "2600-Jan-01 00:00:00",
    body: "MOON",
    raDeg: 196.330104,
    decDeg: -5.352995,
    rKm: 403858.036,
  },
];