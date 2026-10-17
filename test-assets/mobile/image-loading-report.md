# Prioritized image loading report

Tested in Chromium 151 at 390×844 with mobile touch emulation (device scale factor 3), CPU throttled 4×, Fast 3G (562 ms latency and 200 KB/s download), and cache disabled. All seven schools were traversed using a production build served on port 3004.

| Measurement | Before | After |
|---|---:|---:|
| Welcome visible with all seven logos decoded | 12.60 s | 2.47 s |
| First usable school view | 17.43 s | 6.28 s |
| Mascot images downloaded | 1,025,306 bytes up front | 502,988 bytes on demand |

The welcome page appeared 80% sooner and the school view 64% sooner. The seven critical logos total 59,662 bytes. The eight optimized mascots are 768×768 WebP files at quality 82, weigh 55,430–69,772 bytes, and reduce the total by 50.9%; originals remain preserved.

On Vite's development root route (`http://192.168.2.17:3004/`), the welcome page appeared at 2.34 s, but React's stage took 36.6 s to load in that emulation. I repeated the journey with the production build served from a temporary route on the same port: the stage was ready at 6.28 s. The production figure is the relevant one for deployment; Vite development downloads and transforms separate modules.

The base image and ECAA image were requested at 3.23 and 3.30 s. Other mascots began downloading in the background once the selector was ready. On school entry, the title, graph, and button were present even if the mascot was still loading. The journey ended with all seven mascots decoded and without a request for the portal chunk.

| School/view | Capture |
|---|---|
| Intro | [priority-intro-390.png](priority-intro-390.png) |
| Welcome | [priority-welcome-390.png](priority-welcome-390.png) |
| ECAA | [priority-eciaa-390.png](priority-eciaa-390.png) |
| ECBI | [priority-ecbi-390.png](priority-ecbi-390.png) |
| ECFN | [priority-ecfn-390.png](priority-ecfn-390.png) |
| ECTEA | [priority-ectea-390.png](priority-ectea-390.png) |
| ECMC | [priority-ecmc-390.png](priority-ecmc-390.png) |
| ECQI | [priority-ecqi-390.png](priority-ecqi-390.png) |
| YTLC | [priority-ytlc-390.png](priority-ytlc-390.png) |

`npm run lint` and `npm run build` pass. Vite emits a bundle-size warning for `PortalApp` (611.89 KB minified; 182.66 KB gzip); the chunk remains separate and is not requested during the welcome or school-selection journey.
