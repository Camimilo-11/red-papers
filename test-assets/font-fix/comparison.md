# Font verification

**Cause:** commit `c3302bc` removed `@import "tailwindcss"` from `src/index.css`; Preflight no longer supplied the global sans font and `--font-sans` was not applied to normal text.

For the “before” screenshots, only the two new global rules from the HTML were removed; all other rules and content are unchanged. The “after” screenshots show the font change.

| Viewport | Welcome | ECAA | ECBI | Fast 3G, empty cache |
|---|---|---|---|---|
| 360 × 740 | [before](360-welcome-before.png) · [after](360-welcome-after.png) | [before](360-ecaa-before.png) · [after](360-ecaa-after.png) | [before](360-ecbi-before.png) · [after](360-ecbi-after.png) | [capture](fast3g-360-initial.png) |
| 390 × 844 | [before](390-welcome-before.png) · [after](390-welcome-after.png) | [before](390-ecaa-before.png) · [after](390-ecaa-after.png) | [before](390-ecbi-before.png) · [after](390-ecbi-after.png) | [capture](fast3g-390-initial.png) |
| 430 × 932 | [before](430-welcome-before.png) · [after](430-welcome-after.png) | [before](430-ecaa-before.png) · [after](430-ecaa-after.png) | [before](430-ecbi-before.png) · [after](430-ecbi-after.png) | [capture](fast3g-430-initial.png) |
| 1366 × 768 | [before](1366-welcome-before.png) · [after](1366-welcome-after.png) | [before](1366-ecaa-before.png) · [after](1366-ecaa-after.png) | [before](1366-ecbi-before.png) · [after](1366-ecbi-after.png) | [capture](fast3g-1366-initial.png) |

Fast 3G profile: cache disabled, 1.6 Mbps download, and 150 ms latency. On first paint, welcome text computed as sans at all four viewport sizes; there were zero web-font requests. Build and type checks completed without errors.
