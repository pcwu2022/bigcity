# 去巨城 · Big City, here I come

A responsive Traditional Chinese web app built with plain HTML, CSS, and JavaScript. No API key or runtime dependencies.

## Run

```sh
npm run dev
```

Open http://localhost:5173. Location requires HTTPS or localhost. Mobile location and orientation must be tested over HTTPS on a real phone. Open `index.html` through a server because the JavaScript uses ES modules.

```sh
npm test
npm run build
```

Deploy `dist/` to any static HTTPS host. On each page load, a dialog explains that live features need location permission. “允許定位，出發！” requests browser location access; “先看看示範” or Escape dismisses it without requesting access. The default location and movement are explicitly labeled demo data. Click 使用我的位置 for actual location tracking; 停止定位 returns to the demo. Permission denial, stale fixes, weak accuracy, offline weather, unsupported orientation, and stationary motion all have explicit fallback states.

## Calculations

- Destination: Big City Shopping Mall, 24.81000 N, 120.97750 E (approximate mall center).
- Haversine straight-line distance and initial true bearing.
- Closing speed: velocity dot unit bearing = speed × cos(heading − bearing). Native GPS speed is preferred; displacement fallback requires sufficient time, movement beyond noise, and reasonable accuracy.
- ETA only when approaching faster than 0.5 km/h, with arrival within 200 m (an approximate mall-block radius). GPS data expires after 30 seconds.
- A red “Welcome back” dialog appears on a fresh GPS fix inside 200 m, with accuracy at most 80 m. It appears once per visit, including when tracking starts inside the area, and rearms only after a reliable fix beyond 300 m. Demo, stale, and inaccurate fixes never trigger or rearm it. The native dialog supports keyboard focus, Escape, and a close button.
- Open-Meteo current model wind at the displayed location, refreshed every 10 minutes or after moving 2 km. Weather directions are FROM bearings, reversed by 180° before vector projection. Displayed wind ETA is only the time to cover the along-bearing component; crosswind misses the destination and the approximate lateral offset is shown. This is a playful constant-vector model, not physical drift simulation.
- Gravity: Newton’s F = GmM/r² with G = 6.67430e-11 SI and a fixed person mass of 80 kg. Mall mass is fixed at a hypothetical 1,000,000 metric tonnes (1e9 kg), not a measured or sourced value. It is not user configurable. Distance converts from km to metres. Results are suppressed within 200 m because the point-mass model cannot describe the building’s near field, and for stale or inaccurate live GPS.
- Meatball riding: distance / configurable speed, default 10 km/h; speed preference saved locally.
- Mall bearing and wind share one compass: the red marker points toward Big City and the translucent green radar sector shows where wind blows TO (source bearing + 180°). The sector spans a fixed 50° as a visual direction marker, not measured wind variation. Both rotate with phone heading. Wind speed, projection ETA, and weather refresh live in the same panel. Missing, loading, failed, or calm wind hides the sector. The built-in phone compass is preferred automatically on load. On iOS, the startup location button (or compass button) requests motion/orientation access within the user gesture. Unsupported devices, denial, missing readings after 2.5 seconds, and stale readings after 20 seconds use the default fixed orientation. Both iOS compass and absolute Android headings account for screen rotation; relative-only orientation is ignored. iOS headings approximate magnetic north.
- Position is processed locally. Weather requests send coordinates to Open-Meteo. Maps opens only on click.

## Population comparison

`population.js` contains 16 administrative population weights: Hsinchu City November 2024 (457,328), Hsinchu County December 2024 (594,641), total 1,051,969. These are historical household registrations, not current physical presence. The county figures are from table 1 (PDF page 5) of the county government's climate action draft hosted by the Ministry of Environment.

Each area's population is assumed uniform in a residential circle with a manually selected approximate center and radius, explicitly NOT official geographic distribution, administrative boundaries, or measured household coordinates. The circle parameters are visible in `POPULATION_AREAS`. The intersection area with a mall-centered circle of the user's distance estimates the population closer to the mall; subtracting from the total gives the number farther away. The UI rounds to 1,000 people and whole percentages, identifies demo data, and hides the estimate for stale or inaccurate live GPS. This is a coarse playful comparison, not a precise or live ranking. Circle area calculations use a local planar approximation and center separations use Haversine distance.

- [Hsinchu City November 2024 district populations](https://dep-civil.hccg.gov.tw/uploaddowndoc?file=Demographics%2F202412011022260.pdf&flag=doc)
- [Hsinchu County December 2024 township populations, table 1](https://service.cca.gov.tw/File/Get/cca/zh-tw/3wbVkIvrB2HqGIh#page=5)

## Social sharing preview

`social-preview.png` is the 1200 × 630 PNG sharing card. Open Graph and Twitter large-image metadata is embedded directly in `index.html` for crawlers without JavaScript. Image URLs and the canonical URL use the deployed origin. The native drawing source is `scripts/generate-social-preview.swift` (macOS/AppKit; run `swift scripts/generate-social-preview.swift social-preview.png` to regenerate). The committed PNG is used by normal builds, so deployment does not need Swift.

The site currently requires sign-in. Anonymous requests receive the hosting sign-in page and its metadata, so external messaging/social crawlers cannot see this custom card until the owner makes the site public. Existing access is preserved. Platforms may cache previous link previews and may require a fresh scrape after public access is enabled.

## Sources

- [Big City location](https://en.wikipedia.org/wiki/Big_City_%28shopping_mall%29)
- [Open-Meteo API documentation](https://open-meteo.com/en/docs) (current model conditions, km/h, wind direction)

Unofficial fan project; the illustration and design are original. Optional Google Fonts have system-font fallbacks.
