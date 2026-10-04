import { Time, DMS, HMS, acos, asin, atan, cos, sin, tan } from "@jauza/core";
import type { HilalFn, RukyatData } from "@jauza/core";
import { ephemerisFor } from "./ephemeris.js";
import { defaultRouter, type SeriesRouter } from "./series.js";
import { refractionAt } from "./refraction.js";

const HORIZON_REFRACTION = 34.5 / 60; // 34′30″
const DIP_COEFFICIENT = 0.0293;

const clamp = (x: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, x));

// h = -(SD + 34′30″ + Dip), Dip = 0.0293*sqrt(h).
const horizonTarget = (sdDeg: number, elevation: number) =>
  -(sdDeg + HORIZON_REFRACTION + DIP_COEFFICIENT * Math.sqrt(elevation));

// Absolute azimuth counted from north
function azimuth(tDeg: number, decDeg: number, latDeg: number): number {
  const a = -sin(latDeg) / tan(tDeg) + (cos(latDeg) * tan(decDeg)) / sin(tDeg);
  const az = 270 + atan(a);
  return ((az % 360) + 360) % 360;
}

export function createHilal(router: SeriesRouter): HilalFn {
  return ({ observer, conjunction }) => {
    const series = router.seriesFor(conjunction.ut);
    const eph = ephemerisFor(series);
    const phi = observer.lat;
    const lng = observer.lng;
    const elevation = observer.h;
    const utJd = conjunction.ut;

    const tz = Math.round(lng / 15);
    const conjTime = new Time(utJd, { timezone: tz });
    const dayStart = new Time(
      conjTime.year,
      conjTime.month,
      conjTime.day,
      0,
      0,
      0,
      { timezone: tz }
    );

    let t = utJd;
    let tSunDeg = 0;
    let ghurubHours = 0;
    for (let i = 0; i < 3; i++) {
      const s = eph.sunRow(t);
      const hTarget = horizonTarget(s.sdDeg, elevation);
      const cosT =
        (sin(hTarget) - sin(phi) * sin(s.decDeg)) / (cos(phi) * cos(s.decDeg));
      tSunDeg = acos(clamp(cosT, -1, 1));
      ghurubHours = 12 - s.eotSec / 3600 + tSunDeg / 15 - lng / 15;
      t = dayStart.jd + (tz + ghurubHours) / 24;
    }
    const sunsetJd = t;
    const sunset = new Time(sunsetJd);

    // Moon and sun data at sunset
    const s = eph.sunRow(sunsetJd);
    const m = eph.moonRow(sunsetJd);
    const raSun = s.raDeg;
    const decSun = s.decDeg;
    const raMoon = m.raDeg;
    const decMoon = m.decDeg;
    const sdMoon = m.sdDeg;
    const hpMoon = m.parallaxDeg;

    const tMoonDeg = (((raSun - raMoon + tSunDeg) % 360) + 360) % 360;

    const sinHMoon =
      sin(phi) * sin(decMoon) + cos(phi) * cos(decMoon) * cos(tMoonDeg);
    const hMoon = asin(clamp(sinHMoon, -1, 1));
    const parallax = cos(hMoon) * hpMoon;

    const refraction = refractionAt(hMoon - parallax + sdMoon);
    const dip = DIP_COEFFICIENT * Math.sqrt(elevation);

    const moonAltUpper = hMoon - parallax + sdMoon + refraction + dip;
    const moonAltCenter = moonAltUpper - sdMoon;

    const sinNF = (sin(phi) * sin(decMoon)) / (cos(phi) * cos(decMoon));
    const nf = asin(clamp(sinNF, -1, 1));
    const pnf = cos(nf) * hpMoon;
    const sbsh = 90 + nf;
    const sbsCorrection = sdMoon + HORIZON_REFRACTION + dip;
    const sbs =
      sbsh >= 90
        ? 90 + nf - pnf + sbsCorrection
        : 90 + nf + pnf - sbsCorrection;

    const lagHours = (sbs - tMoonDeg) / 15;
    const moonsetJd = sunsetJd + lagHours / 24;
    const moonset = new Time(moonsetJd);

    const azSun = azimuth(tSunDeg, decSun, phi);
    const azMoon = azimuth(tMoonDeg, decMoon, phi);
    const azMoonset = azimuth(sbs, decMoon, phi);
    let moonPosition = azMoon - azSun;
    moonPosition = ((((moonPosition + 180) % 360) + 360) % 360) - 180;

    const cosJB =
      sin(decSun) * sin(decMoon) +
      cos(decSun) * cos(decMoon) * cos(raSun - raMoon);
    const elongation = acos(clamp(cosJB, -1, 1));

    return {
      sunset,
      sunAzimuth: new DMS(azSun),
      moonAlt: new DMS(moonAltCenter),
      moonAzimuth: new DMS(azMoon),
      moonPosition: new DMS(Math.abs(moonPosition)),
      elongation: new DMS(elongation),
      crescentCondition: moonPosition < 0 ? "Tilted North" : "Tilted South",
      lag: new HMS(lagHours),
      moonset,
      moonsetAzimuth: new DMS(azMoonset),
      illumination: m.fib * 100,
      age: new HMS((sunsetJd - utJd) * 24),
      moonAltGeometric: new DMS(hMoon),
      moonAltParallax: new DMS(parallax),
      moonAltRefraction: new DMS(refraction),
      moonAltDip: new DMS(dip),
      moonAltUpper: new DMS(moonAltUpper),
    } satisfies RukyatData;
  };
}

export const hilal = createHilal(defaultRouter);
