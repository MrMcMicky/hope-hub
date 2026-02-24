# HOPE Website Style Audit (v0)

- Date: 2026-02-23
- Scope: Visual and technical style extraction from `https://www.hope-baden.ch/` and `https://www.hope-baden.ch/aktuell/`
- Goal: Build reusable design material for HOPE Hub UI concept and future design system

## 1) Downloaded assets

Saved in `docs/design/assets`:
- `docs/design/assets/hope-logo-inline-2026-02-23.svg`
- `docs/design/assets/hope-favicon-2026-02-23.avif`
- `docs/design/assets/hope-favicon-300-2026-02-23.avif`

Machine-readable token snapshot:
- `docs/design/hope-brand-tokens-v0.json`

Design-system baseline built from this audit:
- `docs/design/hope-hub-design-system-v0.md`

Notes:
- The website header logo is rendered as inline SVG in the page header markup (not referenced as an external logo file).
- Use these files as internal reference material for concept/prototyping.

## 2) Typography

Detected font stacks and sources:
- Rounded display/headings: `Quicksand` (variable weight 600-700)
- Body/UI sans: `Roboto` (300, 400, 500, 700)
- Editorial/lead serif style: `Iowan Old Style` fallback stack

Font files loaded by the site theme:
- `https://www.hope-baden.ch/wp-content/themes/hope-baden/assets/fonts/Quicksand-VariableFont_wght.ttf`
- `https://www.hope-baden.ch/wp-content/themes/hope-baden/assets/fonts/Roboto-Thin.ttf`
- `https://www.hope-baden.ch/wp-content/themes/hope-baden/assets/fonts/Roboto-Regular.ttf`
- `https://www.hope-baden.ch/wp-content/themes/hope-baden/assets/fonts/Roboto-Medium.ttf`
- `https://www.hope-baden.ch/wp-content/themes/hope-baden/assets/fonts/Roboto-Bold.ttf`

Observed usage pattern:
- Navigation + headings: rounded, bold, compact leading
- Body/excerpts: sans-serif + many italic serif intros/excerpts

## 3) Color system

Theme tokens from `:root`:
- `--wp--preset--color--primary: #df4e96` (brand magenta)
- `--wp--preset--color--accent: #ffec55` (brand yellow)
- `--wp--preset--color--base: #0d404f` (deep teal text)
- `--wp--preset--color--white: #ffffff`
- `--wp--preset--color--primary-light: color-mix(...primary 10%, white)`
- `--wp--preset--color--light: color-mix(...base 3%, white)`

Useful approximations for implementation:
- `primary-light` approx: `#fcedf5`
- `light` approx: `#f8f9fa`

Logo SVG fill colors:
- `rgb(243,203,45)` -> `#f3cb2d`
- `rgb(222,88,160)` -> `#de58a0`
- `rgb(252,221,44)` -> `#fcdd2c`
- `rgb(249,238,96)` -> `#f9ee60`

## 4) Layout and spacing tokens

Global widths:
- `--wp--style--global--content-size: 900px`
- `--wp--style--global--wide-size: 1434px`

Spacing scale:
- `small: 1.5rem`
- `normal: clamp(1.75rem, 2.5vw, 2.5rem)`
- `medium: clamp(2.5rem, 3.75vw, 3.75rem)`
- `large: clamp(4.2rem, 7vw, 7rem)`

Sidebar widths:
- `--wp--custom--layout--sidebar-width: 14em`
- `--wp--custom--layout--sidebar-width-large: 21em`

## 5) Responsive behavior (observed breakpoints)

Detected media-query thresholds in main stylesheet:
- `max-width: 428px`
- `min-width: 429px`
- `max-width: 768px`
- `max-width: 1032px`
- `min-width: 1032px`
- `min-width: 1174px`
- `max-width: 1400px`
- range: `810px <= width <= 1032px`

Interpretation:
- Primary desktop breakpoint around `1032px`
- Tablet transition band roughly `810-1032px`
- Mobile compact mode below `768px`

## 6) Key UI patterns from homepage + "Aktuell"

1. Two-level navigation
- Meta nav row: `Aktuell`, `Shop`, `Angebote`, `Jobs`, `Kontakt`, `Downloads`
- Primary nav row: `Wer wir sind`, `Was wir tun`, `Wie Sie helfen`, `spenden`

2. Distinct CTA style (`spenden`)
- Light-magenta background (`primary-light`)
- Magenta text (`primary`)
- Compact pill-like spacing
- On desktop (>=1032px), extra left margin and tighter CTA padding

3. Content architecture on "Aktuell"
- Left filter sidebar with search + taxonomy chips/checkbox-like controls
- Main area with 3-column news card grid (image, bold rounded title, serif/italic excerpt)

4. Visual language
- Soft near-white backgrounds
- Deep teal text for readability
- Pink/yellow accents as recognizable HOPE identity anchors

## 7) Suggested starter tokens for HOPE Hub (product UI)

Use this as first pass, then refine in UI prototyping:

```css
:root {
  --hope-primary: #df4e96;
  --hope-primary-soft: #fcedf5;
  --hope-accent: #ffec55;
  --hope-base: #0d404f;
  --hope-surface: #ffffff;
  --hope-surface-soft: #f8f9fa;

  --hope-font-body: "Roboto", "Inter", "Helvetica Neue", Arial, sans-serif;
  --hope-font-heading: "Quicksand", "Comfortaa", "Arial Rounded MT", sans-serif;
  --hope-font-editorial: "Iowan Old Style", "Palatino Linotype", serif;

  --hope-space-1: 1.5rem;
  --hope-space-2: clamp(1.75rem, 2.5vw, 2.5rem);
  --hope-space-3: clamp(2.5rem, 3.75vw, 3.75rem);
  --hope-space-4: clamp(4.2rem, 7vw, 7rem);

  --hope-content-width: 900px;
  --hope-wide-width: 1434px;
}
```

## 8) Practical design guidance for HOPE Hub

- Keep HOPE brand continuity in shell/navigation and role landing pages.
- Use calmer, denser data screens for case/stay/billing modules than the public marketing site.
- Keep CTA semantics from current brand (pink primary actions, teal text base), but improve contrast testing for WCAG AA.
- Preserve rounded heading voice (Quicksand) for section titles only; keep form/data UI mainly in Roboto for legibility.

## 9) Sources

- `https://www.hope-baden.ch/`
- `https://www.hope-baden.ch/aktuell/`
- `https://www.hope-baden.ch/wp-content/themes/hope-baden/assets/fonts/Roboto-Regular.ttf`
- `https://www.hope-baden.ch/wp-content/themes/hope-baden/assets/fonts/Quicksand-VariableFont_wght.ttf`
