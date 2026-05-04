# MRM Frontend — Claude Context

## Project Overview
Mineral Rights Management (MRM) dashboard SaaS for oil & gas land management. Built with:
- **Next.js 14** (pages router), **TypeScript** strict mode
- **Tailwind CSS 4** + **shadcn/ui** (Radix primitives, New York style)
- **Jotai** for global state, **React Hook Form** for forms
- **Flask backend** (separate repo) — GraphQL at `/graphql`, REST endpoints for auth/profile

Two distinct areas:
- **Public** — marketing pages (home, pricing, services, contact us)
- **Dashboard** — authenticated app under `pages/Dashboard/`

---

## Architecture

### API & Auth
- `src/lib/api.js` exports `API_URL` from `NEXT_PUBLIC_API_URL` env var (no trailing slash)
- All fetches require `credentials: "include"` (Flask session cookies)
- Auth flow: Login → `Dashboard/index.tsx` fetches `/profile` → stores in `userProfileAtom` → redirects to `/Login` on 401
- `/profile` shape: `{ authenticated, user: { id, username }, account: { id, name } }`
- Path alias: `@/*` → `./src/*`

### GraphQL
- Raw `fetch` — **not** Apollo Client — via an `executeGraphQL` helper defined inside each hook
- GraphQL strings live in `src/graphql/`; one file per domain (e.g. `Directory.ts`)
- Multi-step mutations follow party → address → partyAddress order
- Never add a new field to a query until the BE schema supports it

### State (Jotai atoms — `src/atoms/`)
| Atom | Type | Purpose |
|------|------|---------|
| `userProfileAtom` | `User \| null` | Logged-in user + account |
| `userLoadingAtom` | `boolean` | Profile fetch in-flight |
| `sidebarOpenAtom` | `boolean` | Sidebar collapsed state |
| `openAccordionsAtom` | `string[]` | Expanded nav accordion groups |
| `themeAtom` | `"dark" \| "light"` | Dashboard colour mode (default dark) |

---

## Dynamic Form System

Every data module uses the same three-layer pattern:

```
src/config/<module>Config.ts   →  ModuleConfig / FieldConfig
src/hooks/use<Module>.ts       →  data fetching, save, delete
pages/Dashboard/.../index.tsx  →  wires config + hook into Form + List
```

### FieldConfig conventions
- `graphqlKey` present → value included in mutation variables
- `graphqlKey` absent → UI-only field (no backend write)
- `toGraphQL` → transform the form value before sending (e.g. string[] → string)
- `required: true` → triggers react-hook-form validation + UI error display
- `dependsOn` / `dependsOnValue` → conditionally show a field

### Adding a new module
1. Create `src/config/<module>Config.ts` following `directoryConfig.ts` as the template
2. Create `src/graphql/<Module>.ts` with query + mutations
3. Create `src/hooks/use<Module>.ts` (copy `useDirectory.ts` structure)
4. Create `pages/Dashboard/DashboardDirectory/<Module>/index.tsx`
5. Add route to sidebar in `components/DashboardComponents/DashboardLayout.tsx`

---

## Theming

### How it works
- `themeAtom` drives `isLight` in `DashboardLayout`
- **Only the page content wrapper** gets `.light-theme`: `<div className={isLight ? "light-theme" : ""}>`
- Sidebar (`aside`) and appbar (`header`) always use explicit dark purple inline `style` props — they are **never** inside `.light-theme`
- `DashboardLayout` also sets `document.documentElement.dataset.theme` via `useEffect` so portal-rendered elements (Radix select dropdowns) get themed via `:root[data-theme="light"]` selectors

### CSS rules
- Light theme overrides live in `index.css` under `/* ── Light theme overrides ── */`
- **Never use `!important`** in light-theme CSS — Tailwind v4 puts utilities in `@layer utilities` which has lower cascade priority than our non-layered overrides; specificity alone is enough
- The only `!important` in the file is on `html body[data-scroll-locked]` which fights Radix UI's scroll-lock injection

### Colour palette
| Token | Value | Used for |
|-------|-------|----------|
| `purple-600` | `#9333ea` | Active tabs, selected badges, nav active, primary buttons |
| `purple-700` | `#7e22ce` | Button hover |
| Light content bg | `#e8e0f5 → #ede8f7` | Lavender gradient, light mode only |

---

## Styling Conventions
- Form inputs: `h-9`, `bg-white/5 border-purple-300/30 text-white` (dark); `.light-theme input` CSS handles light
- Cards: `bg-white/10 backdrop-blur-md border-purple-300/30`
- Section dividers: `border-t border-purple-300/30`
- No code comments unless the WHY is non-obvious (not the what)
- No `!important` in new CSS

---

## File Map

| Concern | Path |
|---------|------|
| API base URL | `src/lib/api.js` |
| User type | `src/types/user.ts` |
| Jotai atoms | `src/atoms/` |
| Module configs | `src/config/` |
| GraphQL strings | `src/graphql/` |
| Data hooks | `src/hooks/` |
| shadcn primitives | `src/components/ui/` |
| Dashboard layout + sidebar | `components/DashboardComponents/DashboardLayout.tsx` |
| Appbar | `components/DashboardComponents/DashboardHeader.tsx` |
| Generic form renderer | `components/FormComponents/Form.tsx` |
| Generic list renderer | `components/FormComponents/List.tsx` |
| Contacts tab (party contacts) | `components/FormComponents/ContactsTab.tsx` |
| Modals | `components/modals/` |
| Dashboard pages | `pages/Dashboard/DashboardDirectory/` |
| Global CSS + light theme | `index.css` |

---

## Backend (Flask — separate repo)
- Session-based auth via Flask-Login; all requests need `credentials: "include"`
- CORS configured for `http://localhost:3000` in dev
- Existing GraphQL mutations: `createParty`, `updateParty`, `deleteParty`, `createAddress`, `updateAddress`, `createPartyAddress`

---

## Pending / Known Gaps
- **Contact persons per party**: `ContactsTab.tsx` UI is complete. BE needs `createContact`, `updateContact`, `deleteContact` mutations and `contacts` field on `PartyType`. Do **not** add `contacts` to `FETCH_PARTIES` query until BE ships it.
- Address update on party edit is not yet wired (only create path is implemented in `useDirectory.ts`)