import { describe, it, expect } from "vitest";
import { CspiceEngine } from "../../src/engine.js";
import { HORIZONS_CELLS } from "./fixtures/horizons.js";

// Measured worst-case deviations (engine vs Horizons):
// - 1962+ epochs match to < 1e-4° / < 0.1 km.
// - Pre-1962 epochs (1700, 1850) show up to ~0.006° RA / ~2 km — the UT1-vs-UTC
//   time-convention offset between Horizons and the leap-seconds kernel.
const RA_TOL_DEG = 0.02;
const DEC_TOL_DEG = 0.02;
const R_TOL_KM = 5;

describe("validation: positions against JPL Horizons (DE440 ICRF geometric)", () => {
  it("matches Horizons reference cells across the DE440 range", async () => {
    const engine = new CspiceEngine();
    await engine.start("de440-slim");

    for (const cell of HORIZONS_CELLS) {
      const got =
        cell.body === "SUN"
          ? engine.computeSun(cell.jd)
          : engine.computeMoon(cell.jd);

      const dRa = got.lambda - cell.raDeg;
      const dDec = got.beta - cell.decDeg;
      const dR = got.r - cell.rKm;

      expect(
        Math.abs(dRa),
        `${cell.body} ${cell.utc}: ra ${got.lambda.toFixed(5)}° vs ${cell.raDeg.toFixed(5)}° (Δ${dRa.toFixed(5)}°)`,
      ).toBeLessThan(RA_TOL_DEG);
      expect(
        Math.abs(dDec),
        `${cell.body} ${cell.utc}: dec ${got.beta.toFixed(5)}° vs ${cell.decDeg.toFixed(5)}° (Δ${dDec.toFixed(5)}°)`,
      ).toBeLessThan(DEC_TOL_DEG);
      expect(
        Math.abs(dR),
        `${cell.body} ${cell.utc}: r ${got.r.toFixed(1)} km vs ${cell.rKm.toFixed(1)} km (Δ${dR.toFixed(1)} km)`,
      ).toBeLessThan(R_TOL_KM);
    }
  }, 300_000);
});
