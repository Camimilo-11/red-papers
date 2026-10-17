# Mobile footer: typography and bottom spacing

Branch: `mobile-polish`. Not merged into `main`.

Cause: `.institutional-landing-footer-group h2` forced `Georgia, 'Times New Roman', serif` in `src/index.css`.

The adjustment is limited to the footer below 760 px wide. Its headings inherit the body font family at weight 600 and 1.1rem. Other colors, margins, and content remain unchanged. The footer adds `padding-bottom: calc(24px + env(safe-area-inset-bottom))`, links at least 44 px high, 12 px vertical spacing, and a logo reduced to 85% of its previous width.

## Chromium / Edge verification

Mobile: 390×844, mobile/touch emulation, scale 3. The footer was reached from YTLC using CDP touch gestures.

| Check | Result |
|---|---|
| All three headings match `getComputedStyle(document.body).fontFamily` | Pass |
| Remaining footer text uses the same sans family | Pass |
| Headings at weight 600 and 17.6 px | Pass |
| Links: minimum height / vertical spacing | 44 px / 12 px |
| Logo width before → after | 190 → 161.5 px (85%) |
| Bottom padding without additional safe-area inset | 24 px |
| Last line fully visible after touch scroll | Pass; bottom edge at 822.81 px of 844 px |
| Horizontal overflow | None |
| Mobile CLS before → after | 0 → 0 |
| Additional 360×740 check | Correct font, links ≥ 44 px, last line visible, CLS 0, no overflow |
| Desktop footer at 1366 px: pixel difference before/after | 0 |
| Footer at 760 px boundary: pixel difference | 0 |
| Type check and build | No errors |

Computed body and footer family: `system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`.

`390-before.png` and `390-after.png` show the full footer. The `390-*-bottom.png` captures show the last line in the viewport after touch gestures. `desktop-*.png` and `760-*.png` compare areas outside the mobile scope.

Measurement detail: the existing anchor leaves mobile scroll offset at 6,700 px versus a geometric maximum of 6,716 px; the last line remains fully visible. That behavior was not changed. At 760 px, CLS is approximately 0.0944 before and 0.0947 after, caused by the welcome page and its logos, outside the footer; sources are listed in `verification.json`. The 760 px footer is pixel-identical and receives none of the new rules.

The development server logged `ResizeObserver loop completed with undelivered notifications` before and after the adjustment. The type check and build completed successfully; observers and transitions were not changed.
