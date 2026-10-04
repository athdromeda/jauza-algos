import { equatorialJ2000 } from "@jauza/core/position";
import type {
  AlgorithmAdapter,
  BodyConfig,
  ExtendedAlgorithmMetadata,
  GeocentricEcliptic,
} from "@jauza/core";
import { cspice } from "./engine.js";
import { EPHEMERIS_MAP } from "./kernels.js";
import type { AberrationCorrection, BodyPosition } from "./types.js";

const bodyConfig = (
  body: "MOON" | "SUN",
  compute: (jd: number, abcorr: AberrationCorrection) => BodyPosition,
): BodyConfig => ({
  outputType: "EQUATORIAL",
  origin: "earth",
  system: "equatorial",
  reference: equatorialJ2000,
  formula: ({ jd }) => compute(jd, "NONE") as GeocentricEcliptic,
  apparentFormula: ({ jd }) => compute(jd, "CN+S") as GeocentricEcliptic,
  distanceUnit: "km",
});

const metadata = (name: string): ExtendedAlgorithmMetadata => ({
  timeScale: "UTC",
  epoch: "j2000",
  validity: {
    note: `${name} ephemeris (ICRS ≈ FK5/J2000); UTC conversion uses naif0012.tls and does not account for leap seconds after 2016-12-31`,
  },
  // The dedicated apparent source uses CSPICE "CN+S": converged Newtonian
  // light-time plus stellar aberration. NAIF does not include relativistic
  // (gravitational) light deflection, so it is deliberately not claimed.
  corrections: ["light-time", "stellar-aberration"],
});

export const jplDe = {
  load(name: string): AlgorithmAdapter<GeocentricEcliptic> {
    const bsp = EPHEMERIS_MAP[name];
    if (!bsp) {
      throw new Error(
        `Unknown JPL DE ephemeris "${name}". Supported: ${Object.keys(EPHEMERIS_MAP).join(", ")}`,
      );
    }
    void cspice.start(name);
    return {
      name: "JplDe",
      metadata: metadata(name),
      bodies: ["MOON", "SUN"],
      MOON: bodyConfig("MOON", (jd, abcorr) => cspice.computeMoon(jd, abcorr)),
      SUN: bodyConfig("SUN", (jd, abcorr) => cspice.computeSun(jd, abcorr)),
    };
  },
  get ready(): Promise<void> {
    if (!cspice.ready) {
      throw new Error("jplDe.load(name) must be called before jplDe.ready");
    }
    return cspice.ready;
  },
};

export { CspiceNotReadyError } from "./engine.js";
