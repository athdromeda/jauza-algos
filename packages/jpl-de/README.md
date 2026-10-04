# @jauza/jpl-de

JPL DE Sun and Moon positions exposed as a Jauza algorithm adapter. The
package uses CSPICE and downloads the selected DE slim kernel and
`naif0012.tls` from the Jauza release CDN at runtime.

## Usage

```ts
import { jplDe } from "@jauza/jpl-de";

const algorithm = jplDe.load("de440-slim");
await jplDe.ready;

const sun = algorithm.SUN!.formula({ jd: 2448908.5 });
```

The returned coordinates are geometric equatorial J2000 right ascension and
declination, with distances in kilometres. Use the adapter with `@jauza/core`
for frame conversion and observer calculations.

The adapter also publishes a dedicated apparent source computed with CSPICE
`CN+S` (converged Newtonian light-time plus stellar aberration). Through
`@jauza/core`, `geometric()` reads the geometric `NONE` state while the
apparent accessors (`ra`, `dec`, `lambda`, `beta`) and topocentric
`alt`/`az`/`horizontal` read the `CN+S` state. Apparent results exclude
gravitational light deflection and atmospheric refraction.

Supported series are `de421-slim`, `de430-slim`, `de435-slim`, `de440-slim`,
`de440s-slim`, and `de442-slim`. Only one series can be initialized per process;
calling `load()` with a different series after initialization throws an error.

The DE440 ephemeris covers approximately 1550 through 2650. UTC conversion is
limited by the configured `naif0012.tls` leap-second data and does not account
for leap seconds after 2016-12-31. Future UTC dates therefore require updated
leap-second data for accurate time conversion.

## Requirements

- `@jauza/core` 0.1.x
- A runtime with `fetch`
