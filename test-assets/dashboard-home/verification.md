# Dashboard: school metrics

The dashboard opens with one “The school in numbers” block, followed by featured publications and charts. All four metrics retain their data and are shown as cards with large numbers, icons, and each school's accent color. On mobile they use a 2×2 layout. Slogans were removed from the banner and sidebar, and authenticated-profile shortcuts were compacted.

Playwright/Chromium verification: **17/17 checks passed**.

| Check | Result |
| --- | --- |
| 360×740, 390×844, 430×932 | Pass: 2×2 cards, complete text, no horizontal scrolling |
| 768×1024 | Pass: two-column grid, no overlaps |
| 1366×768, 1920×1080 | Pass: four columns, single header, publications below |
| Data for all seven schools | Pass: matches verified products |
| Faculty actions and menu | Pass: register publication/project and open My records |
| Student actions and menu | Pass: browse and open My collaborations |
| Actions at 1050 and 1100 px | Pass: icons and text do not overlap |
| Page exceptions captured by Playwright | None |
| Types and build | Pass: `npm run lint` and `npm run build` |

Screenshots: `home-desktop-1366.png` and `home-mobile-390.png`. Detailed data: `verification.json`.

The check found that the X button in the mobile header is covered by the open sidebar; this is a pre-existing condition outside this redesign. The menu can be closed through navigation or its backdrop.

The development server logged `ResizeObserver loop completed with undelivered notifications` warnings during the journeys. Playwright did not receive them as page exceptions. The project's observers are in the school-selection components, outside the metrics and actions components changed here.
