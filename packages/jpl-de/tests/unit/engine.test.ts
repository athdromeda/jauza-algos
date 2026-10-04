import { describe, it, expect } from "vitest";
import { CspiceEngine, CspiceNotReadyError } from "../../src/engine.js";

describe("CspiceEngine (before start)", () => {
  it("throws CspiceNotReadyError before the engine is started", () => {
    const engine = new CspiceEngine();
    expect(() => engine.computeMoon(2448908.5)).toThrow(CspiceNotReadyError);
    expect(() => engine.computeSun(2448908.5)).toThrow(/await jplDe.ready/);
  });

  it("reports not ready and exposes no readiness promise before start", () => {
    const engine = new CspiceEngine();
    expect(engine.isReady()).toBe(false);
    expect(engine.ready).toBeNull();
  });

  it("start() returns a promise and is idempotent for the same name", () => {
    const engine = new CspiceEngine();
    // Kick off init in the background (may hit the CDN); we never await it here,
    // so this test stays network-independent. Swallow a rejection in case the
    // background fetch fails before the process exits.
    const first = engine.start("de440-slim");
    void first.catch(() => {});
    expect(engine.start("de440-slim")).toBe(first);
  });

  it("rejects a different kernel after initialization has started", () => {
    const engine = new CspiceEngine();
    const first = engine.start("de440-slim");
    void first.catch(() => {});

    expect(() => engine.start("de421-slim")).toThrow(
      /already initialized with "de440-slim"; cannot start "de421-slim"/,
    );
  });
});
