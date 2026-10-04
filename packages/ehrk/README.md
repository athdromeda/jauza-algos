# Jauza EHRK

Jauza implementation of Ephemeris Hisab Rukyat Kemenag Calculation

## Coordinate routing

EHRK table coordinates are routed by Julian date:

- `ehrk-2014-2025` (`2456658.5 <= JD < 2461041.5`): Sun ecliptic
  longitude/latitude use mean ecliptic of date.
- `ehrk-2026` (`2461041.5 <= JD <= 2461406.5`): Sun ecliptic
  longitude/latitude use true ecliptic of date.

Sun equatorial coordinates and both Moon coordinate pairs use true-of-date in
both series. For the final hour before the 2026 boundary, values are linearly
extrapolated from the last two rows of the older series; the original 2026 row
is used exactly at the boundary, so interpolation never mixes coordinate
frames.

Higher-level conjunction or hilal calculations whose required sampling window
crosses this boundary throw instead of combining rows from the two frames.
