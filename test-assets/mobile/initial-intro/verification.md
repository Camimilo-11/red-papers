# Initial intro load

Verified in Chromium (Edge), touch emulation, device scale factor 3, empty cache, Fast 3G (150 ms latency, 200 KB/s download), and CPU throttled 4×.

The initial load used an HTML curtain that differed from the return intro. An extra closing `div` left the curtain outside its container and behind the white background. The 1.5-second timer also started in the `head`, before the first paint.

The markup nesting was fixed and the timer now starts after the curtain paints. React waits for that start before removing the container. A same-session reload and reduced-motion preference skip the curtain.

| Check | Result |
| --- | --- |
| 390×844: uninterrupted blue curtain | Pass: 1,775 ms (includes beginning of exit); minimum timer 1,500 ms |
| 360×740: uninterrupted blue curtain | Pass: 1,668 ms (includes beginning of exit); minimum timer 1,500 ms |
| Reload in the same session, both sizes | Pass: zero intro or blue-curtain frames |
| Return from portal, 390×844 | Pass: intro → logo → transition → welcome |
| Reduced motion, 390×844 | Pass: zero intro or blue-curtain frames |
| Final welcome page | Pass: opacity 1, no orphan curtain or horizontal overflow |
| Page errors | None |
| Types and build | Pass: `npm run lint` and `npm run build` |

Screenshots `intro-360.png`, `intro-390.png`, `welcome-360.png`, and `welcome-390.png` accompany the detailed measurements in `verification.json`. Frames and full before/after data were kept outside the repository in the temporary verification folder.
