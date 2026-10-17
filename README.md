# SIMAPCI · Yachay Tech Research Portal

**SIMAPCI** is a web portal for exploring and organizing scientific publications, research projects, and academic profiles across Yachay Tech's seven schools. It provides a public landing page, a portal for each school, and demonstration workflows for faculty, students, the Scientific Committee, and developers.

> **Status and intended use:** this version is a static web prototype. Authentication, permissions, and records are handled in the browser; there is no application server or central database. Demo accounts and records are not institutional identities or verified institutional information. Read [Security and limitations](docs/security-and-limitations.md) before using real data.

## Features

- Responsive landing page for selecting a school.
- School dashboards with featured publications, production metrics, time trends, research lines, and faculty metrics.
- Searchable and filterable publication/project catalog, academic directory, and record details.
- Demonstration forms for registering research output, reviewing bibliographic metadata, and attaching PDF files.
- Demonstration workflows for Scientific Committee review, record corrections, project tracking, and notifications.
- Faculty and student profiles, student collaborations, and developer tools for roles and project traceability.
- CSV and Excel export, plus browser-based printing of catalogs and reports.
- An ECMC bibliographic import derived from an ORCID dataset supplied for this project. Its scope and limitations are described in [Data and provenance](docs/data-and-provenance.md) and the [ECMC source notes](src/data/README.md).

## Technology

| Area | Technology |
| --- | --- |
| UI | React 19, TypeScript, Tailwind CSS 4 |
| Development | Vite 8, TypeScript 7, Vitest 5 |
| Motion and icons | Motion, lucide-react |
| Spreadsheet export | SheetJS (`xlsx`) |
| Hosting | Static GitHub Pages site deployed with GitHub Actions |

The app uses ES modules and pins its dependency tree in `package-lock.json`. CI uses Node.js 22.

## Requirements and local setup

Install Node.js 22 and npm. From the repository root:

```bash
npm ci
npm run dev
```

Vite serves the app at `http://localhost:3000`. The development server listens on all network interfaces to support testing from another device on the same network. Do not expose that port on an untrusted network.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Starts Vite on port 3000. |
| `npm run lint` | Runs `tsc --noEmit` for TypeScript checking; it does not run ESLint. |
| `npm test` | Runs the Vitest `check-*.test.tsx` suite. |
| `npm run build` | Builds the static site into `dist/`. |
| `npm run preview` | Serves the latest `dist/` build for local review. |

See [Development and deployment](docs/development-and-deployment.md) for environment variables and production settings.

## Documentation

- [Architecture](docs/architecture.md): application structure, navigation, and module responsibilities.
- [User guide](docs/user-guide.md): workflows for visitors and portal roles.
- [Data and provenance](docs/data-and-provenance.md): schools, records, seed data, and the ECMC source.
- [Development and deployment](docs/development-and-deployment.md): local setup, configuration, and GitHub Pages.
- [Tests](docs/tests.md): automated coverage and manual verification.
- [Security and limitations](docs/security-and-limitations.md): local storage, demo authentication, and operational constraints.

## Repository layout

```text
src/
  App.tsx, PortalApp.tsx      Landing shell, school selection, and school portal
  components/                 Landing, catalog, dashboard, directory, access, and tools
  services/                   Local persistence, authentication, products, metrics, exports
  constants/                  Schools, research lines, demo accounts, and seed data
  data/                       ECMC ORCID dataset and source documentation
  types/                      Domain types
public/                       Static assets served with the site
.github/workflows/pages.yml   Checks and GitHub Pages deployment
check-*.test.tsx              Automated tests
```

Start with `src/constants/schools.ts` for school configuration, `src/services/storage.ts` for persistence, and `src/services/productService.ts` for product rules.

Some source strings, the npm package name, and generated report labels still use the historical names “SIMAPC” or “RED PAPERS”. This documentation uses **SIMAPCI** as the project name; those internal identifiers have not been renamed.
