/**
 * Data coverage: the bundled ephemeris tables span JD 2456658.5–2461406.5
 * (2014-01-01 → 2027-01-01) with a single data gap (2015-01-01 → 2017-01-01);
 * Conventions:
 * - "Real" values are pre-rounding, pre-ihtiyat computed times.
 * - 2014–2022 editions report azimuths as degrees North of West;
 *   2023+ editions report absolute azimuths.
 * - "Jarak Busur" (≤2022) and "Elongasi Geosentrik" (2023+) are the geocentric elongation.
 */

export type HMS = [h: number, m: number, s: number];
export type Angle = { d: number; m: number; s: number; sign: 1 | -1 };

export const hms = (h: number, m: number, s: number): HMS => [h, m, s];
export const dms = (
  d: number,
  m: number,
  s: number,
  sign: 1 | -1 = 1
): Angle => ({ d: Math.abs(d), m, s, sign });

export const toHours = ([h, m, s]: HMS): number => h + m / 60 + s / 3600;
export const toDegrees = ({ d, m, s, sign }: Angle): number =>
  sign * (d + m / 60 + s / 3600);

/** Azimuth: raw md value, flagged whether it is expressed as North of West. */
export type Azimuth = { angle: Angle; northOfWest: boolean };
export const az = (angle: Angle, northOfWest: boolean): Azimuth => ({
  angle,
  northOfWest,
});
export const azimuthDeg = ({ angle, northOfWest }: Azimuth): number =>
  northOfWest ? 270 + toDegrees(angle) : toDegrees(angle);

export type Observer = { lat: number; lng: number; h: number };

export const JAKARTA: Observer = { lat: -6.166667, lng: 106.816667, h: 0 };
export const PELABUHAN_RATU: Observer = {
  lat: -7.0290556,
  lng: 106.5577222,
  h: 52.685,
};
export const CIBEAS: Observer = { lat: -7.0738889, lng: 106.5311111, h: 137 };

// ---------------------------------------------------------------------------
// Shalat times in Jakarta, Real column (pre-rounding, pre-ihtiyat).
// ---------------------------------------------------------------------------

export type SalatTime =
  | "zuhur"
  | "asar"
  | "maghrib"
  | "isha"
  | "subuh"
  | "imsak"
  | "terbit"
  | "dhuha";

export type SalatCase = {
  label: string;
  year: number;
  month: number;
  day: number;
  observer: Observer;
  /** 2014 edition used h dhuha = 3°30′; later editions 4°30′. */
  dhuhaAlt?: number;
  /** 2014 edition computed imsak at h = -22°; later editions 10 min before subuh. */
  imsakAlt?: number;
  expected: Record<SalatTime, HMS>;
};

export const SALAT_CASES: SalatCase[] = [
  {
    label: "Jakarta, 17 Aug 2014",
    year: 2014,
    month: 8,
    day: 17,
    observer: JAKARTA,
    dhuhaAlt: 3.5,
    imsakAlt: -22,
    expected: {
      zuhur: hms(11, 56, 53),
      asar: hms(15, 17, 51.17),
      maghrib: hms(17, 55, 6.08),
      isha: hms(19, 5, 12.77),
      subuh: hms(4, 40, 19.42),
      imsak: hms(4, 32, 5.73),
      terbit: hms(5, 58, 39.92),
      dhuha: hms(6, 17, 17.87),
    },
  },
  {
    label: "Jakarta, 17 Aug 2017",
    year: 2017,
    month: 8,
    day: 17,
    observer: JAKARTA,
    expected: {
      zuhur: hms(11, 56, 50),
      asar: hms(15, 17, 46.31),
      maghrib: hms(17, 55, 5.33),
      isha: hms(19, 5, 10.58),
      subuh: hms(4, 40, 15.77),
      imsak: hms(4, 30, 15.77),
      terbit: hms(5, 58, 34.67),
      dhuha: hms(6, 21, 20.91),
    },
  },
  {
    label: "Jakarta, 17 Aug 2018",
    year: 2018,
    month: 8,
    day: 17,
    observer: JAKARTA,
    expected: {
      zuhur: hms(11, 56, 53),
      asar: hms(15, 17, 50.99),
      maghrib: hms(17, 55, 6.03),
      isha: hms(19, 5, 12.84),
      subuh: hms(4, 40, 19.36),
      imsak: hms(4, 30, 19.36),
      terbit: hms(5, 58, 40),
      dhuha: hms(6, 21, 26.39),
    },
  },
  {
    label: "Jakarta, 3 Jan 2019",
    year: 2019,
    month: 1,
    day: 3,
    observer: JAKARTA,
    expected: {
      zuhur: hms(11, 56, 58),
      asar: hms(15, 23, 41.06),
      maghrib: hms(18, 11, 46.54),
      isha: hms(19, 26, 59.74),
      subuh: hms(4, 17, 55.55),
      imsak: hms(4, 7, 55.55),
      terbit: hms(5, 42, 9.46),
      dhuha: hms(6, 6, 9.71),
    },
  },
  {
    label: "Jakarta, 3 Jan 2020",
    year: 2020,
    month: 1,
    day: 3,
    observer: JAKARTA,
    expected: {
      zuhur: hms(11, 56, 51),
      asar: hms(15, 23, 35.5),
      maghrib: hms(18, 11, 40.32),
      isha: hms(19, 26, 54.41),
      subuh: hms(4, 17, 46.75),
      imsak: hms(4, 7, 46.75),
      terbit: hms(5, 42, 1.68),
      dhuha: hms(6, 6, 2.19),
    },
  },
  {
    label: "Jakarta, 3 Jan 2021",
    year: 2021,
    month: 1,
    day: 3,
    observer: JAKARTA,
    expected: {
      zuhur: hms(11, 57, 11),
      asar: hms(15, 23, 51.14),
      maghrib: hms(18, 11, 57.97),
      isha: hms(19, 27, 9.36),
      subuh: hms(4, 18, 12.18),
      imsak: hms(4, 8, 12.18),
      terbit: hms(5, 42, 24.03),
      dhuha: hms(6, 6, 23.77),
    },
  },
  {
    label: "Jakarta, 3 Jan 2022",
    year: 2022,
    month: 1,
    day: 3,
    observer: JAKARTA,
    expected: {
      zuhur: hms(11, 57, 5),
      asar: hms(15, 23, 46.65),
      maghrib: hms(18, 11, 52.78),
      isha: hms(19, 27, 5.11),
      subuh: hms(4, 18, 4.3),
      imsak: hms(4, 8, 4.3),
      terbit: hms(5, 42, 17.22),
      dhuha: hms(6, 6, 17.23),
    },
  },
  {
    label: "Jakarta, 17 Aug 2023",
    year: 2023,
    month: 8,
    day: 17,
    observer: JAKARTA,
    expected: {
      zuhur: hms(11, 56, 56),
      asar: hms(15, 17, 55.44),
      maghrib: hms(17, 55, 7.53),
      isha: hms(19, 5, 15.21),
      subuh: hms(4, 40, 22.86),
      imsak: hms(4, 30, 22.86),
      terbit: hms(5, 58, 44.47),
      dhuha: hms(6, 21, 31.55),
    },
  },
  {
    label: "Jakarta, 17 Aug 2025",
    year: 2025,
    month: 8,
    day: 17,
    observer: JAKARTA,
    expected: {
      zuhur: hms(11, 56, 50),
      asar: hms(15, 17, 45.84),
      maghrib: hms(17, 55, 5.9),
      isha: hms(19, 5, 10.79),
      subuh: hms(4, 40, 15.6),
      imsak: hms(4, 30, 15.6),
      terbit: hms(5, 58, 34.1),
      dhuha: hms(6, 21, 20.21),
    },
  },
  {
    label: "Jakarta, 17 Aug 2024",
    year: 2024,
    month: 8,
    day: 17,
    observer: JAKARTA,
    expected: {
      zuhur: hms(11, 56, 46),
      asar: hms(15, 17, 40.13),
      maghrib: hms(17, 55, 3.93),
      // The 2024 edition prints 19:05:17.53, but its own arithmetic
      // (19:12:23.53 − 00:07:16) gives 19:05:07.53 so 10 s slip.
      isha: hms(19, 5, 7.53),
      subuh: hms(4, 40, 11.01),
      imsak: hms(4, 30, 11.01),
      terbit: hms(5, 58, 28.07),
      dhuha: hms(6, 21, 13.74),
    },
  },
  {
    label: "Jakarta, 17 Aug 2026",
    year: 2026,
    month: 8,
    day: 17,
    observer: JAKARTA,
    expected: {
      zuhur: hms(11, 56, 54),
      asar: hms(15, 17, 51),
      maghrib: hms(17, 55, 8),
      isha: hms(19, 5, 14),
      subuh: hms(4, 40, 20),
      imsak: hms(4, 30, 20),
      terbit: hms(5, 58, 40),
      dhuha: hms(6, 21, 27),
    },
  },
];

// ---------------------------------------------------------------------------
// Ijtima
// ---------------------------------------------------------------------------

export type ConjunctionCase = {
  label: string;
  hijri: [year: number, month: number];
  jdeSecOfDay: number;
  utSecOfDay?: number;
};

export const CONJUNCTION_CASES: ConjunctionCase[] = [
  {
    label: "Ramadan 1435 H (2014)",
    hijri: [1435, 9],
    jdeSecOfDay: 29420.69,
  },
  {
    label: "Syawal 1435 H (2014)",
    hijri: [1435, 10],
    jdeSecOfDay: 81819.38,
  },
  {
    label: "Zulhijjah 1435 H (2014)",
    hijri: [1435, 12],
    jdeSecOfDay: 22544.65,
  },
  {
    label: "Syawal 1438 H (2017)",
    hijri: [1438, 10],
    jdeSecOfDay: 9193.07,
  },
  {
    label: "Ramadan 1439 H (2018)",
    hijri: [1439, 9],
    jdeSecOfDay: 42628.12,
  },
  {
    label: "Ramadan 1440 H (2019)",
    hijri: [1440, 9],
    jdeSecOfDay: 82106.31,
  },
  {
    label: "Ramadan 1441 H (2020)",
    hijri: [1441, 9],
    jdeSecOfDay: 8941.02,
  },
  {
    label: "Ramadan 1442 H (2021)",
    hijri: [1442, 9],
    jdeSecOfDay: 9237.53,
  },
  {
    label: "Ramadan 1443 H (2022)",
    hijri: [1443, 9],
    jdeSecOfDay: 23231.31,
  },
  {
    label: "Ramadan 1444 H (2023)",
    hijri: [1444, 9],
    jdeSecOfDay: 62740.32,
  },
  {
    label: "Ramadan 1446 H (2025)",
    hijri: [1446, 9],
    jdeSecOfDay: 2808.42,
    utSecOfDay: 2736.76,
  },
  {
    label: "Ramadan 1445 H (2024)",
    hijri: [1445, 9],
    jdeSecOfDay: 32561.5,
    utSecOfDay: 32490.28,
  },
  {
    label: "Ramadan 1447 H (2026)",
    hijri: [1447, 9],
    // Seri 2026 omits the ΔT correction entirely (DT → WIB directly), so no utSecOfDay recorded.
    jdeSecOfDay: 43261.18,
  },
];

// ---------------------------------------------------------------------------
// Awal bulan
// ---------------------------------------------------------------------------

export type HilalCase = {
  label: string;
  hijri: [year: number, month: number];
  observer: Observer;
  md: {
    sunset: HMS;
    sunAzimuth: Azimuth;
    moonAlt: number; // Tinggi Hilal center-or-upper based on moonAltLimb
    moonAltLimb: "center" | "upper";
    moonAzimuth: Azimuth;
    moonPosition: number; // + = north of sun
    elongation: number; // geocentric elongation
    lag: HMS;
    moonset: HMS;
    moonsetAzimuth: Azimuth;
    illumination: number;
    age?: HMS;
    moonAltTolDeg?: number;
  };
};

export const HILAL_CASES: HilalCase[] = [
  {
    label: "Ramadan 1435 H (2014), Pelabuhan Ratu",
    hijri: [1435, 9],
    observer: PELABUHAN_RATU,
    md: {
      sunset: hms(17, 49, 14.74),
      sunAzimuth: az(dms(23, 21, 40.69), true),
      moonAlt: toDegrees(dms(0, 37, 23.77)),
      moonAltLimb: "upper",
      moonAzimuth: az(dms(18, 43, 29.28), true),
      moonPosition: -toDegrees(dms(4, 38, 11.41)),
      elongation: toDegrees(dms(4, 40, 41.22)),
      lag: hms(0, 1, 56.94),
      moonset: hms(17, 51, 11.68),
      moonsetAzimuth: az(dms(18, 39, 51.23), true),
      illumination: 0.18,
    },
  },
  {
    label: "Syawal 1435 H (2014), Pelabuhan Ratu",
    hijri: [1435, 10],
    observer: PELABUHAN_RATU,
    md: {
      sunset: hms(17, 54, 57.55),
      sunAzimuth: az(dms(19, 11, 10.43), true),
      moonAlt: toDegrees(dms(3, 40, 16.08)),
      moonAltLimb: "upper",
      moonAzimuth: az(dms(13, 47, 2.37), true),
      moonPosition: -toDegrees(dms(5, 24, 8.06)),
      elongation: toDegrees(dms(6, 31, 42.63)),
      lag: hms(0, 15, 36.28),
      moonset: hms(18, 10, 33.83),
      moonsetAzimuth: az(dms(13, 16, 28.51), true),
      illumination: 0.4,
    },
  },
  {
    label: "Zulhijjah 1435 H (2014), Pelabuhan Ratu",
    hijri: [1435, 12],
    observer: PELABUHAN_RATU,
    md: {
      sunset: hms(17, 50, 21.42),
      sunAzimuth: az(dms(0, 39, 30.96, -1), true),
      moonAlt: toDegrees(dms(0, 37, 54.31)),
      moonAltLimb: "upper",
      moonAzimuth: az(dms(2, 38, 7.52, -1), true),
      moonPosition: -toDegrees(dms(1, 58, 36.56)),
      elongation: toDegrees(dms(2, 4, 31)),
      lag: hms(0, 1, 52.95),
      moonset: hms(17, 52, 14.37),
      moonsetAzimuth: az(dms(2, 41, 34.37, -1), true),
      illumination: 0.05,
    },
  },
  {
    label: "Syawal 1438 H (2017), Pelabuhan Ratu",
    hijri: [1438, 10],
    observer: PELABUHAN_RATU,
    md: {
      sunset: hms(17, 48, 37.95),
      sunAzimuth: az(dms(23, 26, 54.9), true),
      moonAlt: toDegrees(dms(3, 54, 8.53)),
      moonAltLimb: "upper",
      moonAzimuth: az(dms(20, 11, 52.15), true),
      moonPosition: -toDegrees(dms(3, 15, 2.75)),
      elongation: toDegrees(dms(5, 4, 38.5)),
      lag: hms(0, 17, 47.92),
      moonset: hms(18, 6, 25.87),
      moonsetAzimuth: az(dms(19, 35, 50.41), true),
      illumination: 0.29,
    },
  },
  {
    label: "Ramadan 1439 H (2018), Pelabuhan Ratu",
    hijri: [1439, 9],
    observer: PELABUHAN_RATU,
    md: {
      sunset: hms(17, 44, 55.61),
      sunAzimuth: az(dms(18, 55, 14.28), true),
      moonAlt: toDegrees(dms(0, 12, 15.55)),
      moonAltLimb: "upper",
      moonAzimuth: az(dms(13, 44, 2.4), true),
      moonPosition: -toDegrees(dms(5, 11, 12.42)),
      elongation: toDegrees(dms(5, 11, 26.9)),
      lag: hms(0, 0, 19.08),
      moonset: hms(17, 45, 14.93),
      moonsetAzimuth: az(dms(14, 9, 55.27), true),
      illumination: 0.18,
    },
  },
  {
    label: "Ramadan 1440 H (2019), Pelabuhan Ratu",
    hijri: [1440, 9],
    observer: PELABUHAN_RATU,
    md: {
      sunset: hms(17, 46, 41.36),
      sunAzimuth: az(dms(16, 13, 45.33), true),
      moonAlt: toDegrees(dms(5, 38, 44.34)),
      moonAltLimb: "center",
      moonAzimuth: az(dms(14, 44, 2.03), true),
      moonPosition: -toDegrees(dms(1, 29, 43.3)),
      elongation: toDegrees(dms(6, 5, 21.07)),
      lag: hms(0, 25, 28.38),
      moonset: hms(18, 12, 9.74),
      moonsetAzimuth: az(dms(13, 52, 3.21), true),
      illumination: 0.42,
      age: hms(11, 58, 15.36),
    },
  },
  {
    label: "Ramadan 1441 H (2020), Pelabuhan Ratu",
    hijri: [1441, 9],
    observer: PELABUHAN_RATU,
    md: {
      sunset: hms(17, 49, 57.25),
      sunAzimuth: az(dms(12, 43, 51.23), true),
      moonAlt: toDegrees(dms(3, 43, 10.02)),
      moonAltLimb: "center",
      moonAzimuth: az(dms(10, 50, 11.77), true),
      moonPosition: -toDegrees(dms(1, 53, 39.46)),
      elongation: toDegrees(dms(4, 10, 24.39)),
      lag: hms(0, 16, 40.73),
      moonset: hms(18, 6, 37.98),
      moonsetAzimuth: az(dms(10, 17, 50.92), true),
      illumination: 0.24,
    },
  },
  {
    label: "Ramadan 1442 H (2021), Pelabuhan Ratu",
    hijri: [1442, 9],
    observer: PELABUHAN_RATU,
    md: {
      sunset: hms(17, 54, 23.15),
      sunAzimuth: az(dms(8, 47, 13.18), true),
      moonAlt: toDegrees(dms(3, 34, 16.82)),
      moonAltLimb: "center",
      moonAzimuth: az(dms(7, 26, 33.85), true),
      moonPosition: -toDegrees(dms(1, 20, 39.33)),
      elongation: toDegrees(dms(4, 2, 49.66)),
      lag: hms(0, 15, 55.91),
      moonset: hms(18, 10, 19.43),
      moonsetAzimuth: az(dms(6, 56, 13.49), true),
      illumination: 0.21,
    },
  },
  {
    label: "Ramadan 1443 H (2022), Pelabuhan Ratu",
    hijri: [1443, 9],
    observer: PELABUHAN_RATU,
    md: {
      sunset: hms(17, 59, 36.79),
      sunAzimuth: az(dms(4, 31, 50.24), true),
      moonAlt: toDegrees(dms(2, 22, 54.65)),
      moonAltLimb: "upper",
      moonAzimuth: az(dms(2, 51, 22.04), true),
      moonPosition: -toDegrees(dms(1, 40, 28.2)),
      elongation: toDegrees(dms(2, 54, 15.97)),
      lag: hms(0, 9, 54.81),
      moonset: hms(18, 9, 31.6),
      moonsetAzimuth: az(dms(2, 33, 0.36), true),
      illumination: 0.12,
    },
  },
  {
    label: "Ramadan 1444 H (2023), Cibeas",
    hijri: [1444, 9],
    observer: CIBEAS,
    md: {
      sunset: hms(18, 5, 16.65),
      sunAzimuth: az(dms(270, 28, 40.08), false),
      moonAlt: toDegrees(dms(7, 50, 30.47)),
      moonAltLimb: "center",
      moonAzimuth: az(dms(273, 46, 9.62), false),
      moonPosition: toDegrees(dms(3, 17, 29.54)),
      elongation: toDegrees(dms(10, 14, 47.19)),
      lag: hms(0, 32, 59.19),
      moonset: hms(18, 38, 15.84),
      moonsetAzimuth: az(dms(272, 43, 2.36), false),
      illumination: 0.78,
      age: hms(17, 41, 48.75),
    },
  },
  {
    label: "Ramadan 1446 H (2025), Cibeas",
    hijri: [1446, 9],
    observer: CIBEAS,
    md: {
      sunset: hms(18, 15, 3.4),
      sunAzimuth: az(dms(262, 0, 47.68), false),
      moonAlt: toDegrees(dms(4, 19, 30.6)),
      moonAltLimb: "upper",
      moonAzimuth: az(dms(264, 2, 47.31), false),
      moonPosition: toDegrees(dms(2, 1, 59.63)),
      elongation: toDegrees(dms(6, 3, 9.46)),
      lag: hms(0, 19, 3.05),
      moonset: hms(18, 34, 6.45),
      moonsetAzimuth: az(dms(263, 28, 44.55), false),
      illumination: 0.28,
      age: hms(10, 29, 26.64),
    },
  },
  {
    label: "Ramadan 1445 H (2024), Cibeas",
    hijri: [1445, 9],
    observer: CIBEAS,
    md: {
      sunset: hms(18, 10, 40.91),
      sunAzimuth: az(dms(266, 0, 27.72), false),
      moonAlt: toDegrees(dms(0, 53, 19.81)),
      moonAltLimb: "center",
      moonAltTolDeg: 0.15,
      moonAzimuth: az(dms(264, 47, 59.35), false),
      moonPosition: -toDegrees(dms(1, 12, 24.37)),
      elongation: toDegrees(dms(2, 29, 33.04)),
      lag: hms(0, 4, 41.78),
      moonset: hms(18, 15, 22.69),
      moonsetAzimuth: az(dms(264, 39, 21.61), false),
      illumination: 0.05,
      age: hms(2, 9, 10.63),
    },
  },
  {
    label: "Ramadan 1447 H (2026), Cibeas",
    hijri: [1447, 9],
    observer: CIBEAS,
    md: {
      sunset: hms(18, 18, 42.61),
      sunAzimuth: az(dms(257, 51, 46.24), false),
      moonAlt: toDegrees(dms(0, 49, 36.44, -1)),
      moonAltLimb: "upper",
      moonAzimuth: az(dms(256, 50, 38.21), false),
      moonPosition: -toDegrees(dms(1, 1, 8.03)),
      elongation: toDegrees(dms(1, 1, 38.88)),
      lag: hms(0, -3, 27.15),
      moonset: hms(18, 15, 15.46),
      moonsetAzimuth: az(dms(256, 57, 8.64), false),
      illumination: 0.01,
      age: hms(0, -42, 18.57),
    },
  },
];
