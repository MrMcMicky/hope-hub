# HOPE Hub Design System (v0)

- Date: 2026-02-23
- Scope: Product UI guidelines for HOPE Hub (operations software)
- Inputs: HOPE website style audit + HOPE Hub concept/compliance constraints

## 1) Positioning: Brand continuity without UI cloning

Principle:
- HOPE Hub should clearly belong to the same brand family as `hope-baden.ch`, but it should not mimic the public website one-to-one.

Reason:
- Public website goal: marketing, donation, public trust.
- Hub goal: fast, safe, auditable work in shift operations and sensitive case handling.

Decision:
- Keep logo, key colors, and typographic mood.
- Build an operations-first app shell with dense navigation, status visibility, fast data entry, and timeline workflow.

## 2) Brand architecture recommendation

Recommended model:
- Endorsed sub-brand: `HOPE Hub` under the main HOPE brand.

Application:
- Header: HOPE logo (small) + text `HOPE Hub`.
- Login title: `HOPE Hub - Geschuetzter Bereich`.
- Favicon/app icon: HOPE sun symbol (with optional subtle `H` mark).

## 3) Visual principles

1. Functional clarity first
- Information hierarchy must prioritize task completion and safety over decorative layout.

2. Calm confidence
- Use HOPE colors as accents, not as full-surface overload.

3. Sensitive-data context
- Use unambiguous status semantics (success/warning/danger/info) independent from brand colors.

4. Consistency across modules
- One token source, one spacing scale, one component behavior model.

## 4) Token source of truth

Primary token files:
- `src/app/tokens.css` (runtime design tokens)
- `docs/design/hope-brand-tokens-v0.json` (snapshot/reference)

Core brand values:
- Primary: `#df4e96`
- Accent: `#ffec55`
- Base text: `#0d404f`
- Surface: `#ffffff`
- Soft surface: `#f8f9fa`

Typography:
- Heading mood: Quicksand stack
- Body/UI: Roboto stack
- Editorial text: serif stack

## 5) App shell baseline (operations UI)

Required structure:
- Left or top primary navigation for module switching
- Secondary context navigation inside modules
- Content area with predictable page templates
- Sticky action region for frequent shift actions
- Global status strip for sync, alerts, and security state

Do not port from website:
- Hero-first page compositions as primary app pattern
- Marketing-style long-form landing flow for core work screens

## 6) Component rules (v0)

Buttons:
- Primary action: HOPE primary color
- Secondary action: neutral surface with subtle border
- Destructive action: danger token only

Forms:
- High contrast labels and validation states
- Error/help text always visible without hover dependency
- Keyboard-first tab order and focus ring visibility

Tables/lists:
- Dense row mode for operations views
- Sticky headers for long lists
- Inline status chips for key risk signals

Timeline:
- Chronological, append-first rendering
- Clear event type tags (note/stay/service/export/audit)
- Immutable/audited events visually distinguished

## 7) Accessibility and QA gates

Minimum gates before UI rollout:
- WCAG AA contrast for text and controls
- Keyboard navigation for all interactive elements
- Visible focus states on all controls
- Screen-reader labels for critical action buttons

## 8) Content tone

Tone:
- Friendly, clear, operational.
- Avoid ambiguous or overly promotional microcopy in work modules.

Naming pattern:
- Prefer explicit task labels (`Check-in speichern`, `Export verschluesseln`) over generic labels (`Weiter`, `Senden`).

## 9) Implementation notes for current codebase

Current status:
- Token file is now available at `src/app/tokens.css`.
- `src/app/globals.css` maps runtime theme variables to HOPE brand tokens.

Planned next step:
- Create initial component primitives (`AppShell`, `TopNav`, `StatusBadge`, `DataCard`, `FormField`) that consume these tokens only.
