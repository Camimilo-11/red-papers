# Mobile transition verification

The transition was tested in Playwright with Edge Chromium, `isMobile`, `hasTouch`, `deviceScaleFactor: 3`, and CPU throttled 4×. Round-trip videos and eight key frames per viewport were saved in this folder.

| Area | Result | Measurement / change |
|---|---|---|
| Welcome → ECAA | Pass | One Motion progression from 0 to 1; FLIP logos, expanding circular tint, spark, graph, text, and panel staged in phases. Nominal duration: 0.9 s. |
| Mascot and logos | Pass | `base.webp` prevents a gap while the mascot loads; it fades into the ECAA artwork. White logo backgrounds disappear during the mobile transition. Blank frames: 0; missing logos during transition: 0. |
| Reversal and pending intent | Pass | Return lasts 0.6 s; the earlier callback is invalidated on reversal. An extra gesture during entry ends at ECBI at both sizes. An interrupted return ends with the welcome page fully visible. |
| School titles | Pass | Outgoing title leaves before the next enters. Frames with two titles above 40% opacity: 0. |
| Screen and navigation | Pass | No horizontal overflow in samples; direct jumps to YTLC and ECAA verified at both sizes. |
| Reduced motion | Pass | 229 ms fade; no circular `clip-path`. |
| Performance with CPU 4× | Partial | Across runs: 54.4–56.2 FPS at 390×844 and 56.3–56.9 FPS at 360×740. Return averaged 60.1 FPS; the largest recorded interval was 116.5/83.3 ms. No long tasks (>50 ms). |
| Desktop 1366×768 | Pass | Welcome and ECAA compared with HEAD: zero pixel differences in deterministic captures. CSS motion was paused and the animated SVG motif was hidden for the comparison. |
| Build and types | Pass | `npm run build` and `npm run lint` completed successfully. |

Entry did not sustain 60 FPS in the CPU 4× simulation. The largest frame interval coincided with the graph and mascot's first paint; there were no long JavaScript tasks.
