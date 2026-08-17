# Design — nib

Locked design system. Future Hallmark runs read this file first; pages defer
to it. Amend intentionally — the file is the rule.

## System
- Genre · atmospheric (loud register)
- Macrostructure · Narrative Workflow (sticky-rail variant)
- Theme · custom retune of lumen night-foundry (v4.6: cool charcoal + single acid-green accent; serif display kept)
- Axes · dark (L 12% / H 250 cool charcoal, no violet) / classical-serif-lowercase (Instrument Serif 400, upright, all-lowercase prose) / acid green (H 145, one accent)

## Tokens (canonical · `tokens.css` is the source of truth)
```css
:root {
  --color-paper:      oklch(12%  0.010 250);   /* cool charcoal void */
  --color-paper-2:    oklch(16%  0.012 250);   /* elevated surface */
  --color-paper-3:    oklch(21%  0.014 248);   /* hover surface */
  --color-ink:        oklch(97%  0.008 250);   /* headlines, near-white */
  --color-ink-2:      oklch(80%  0.012 250);   /* body */
  --color-rule:       oklch(28%  0.012 250);   /* hairline border */
  --color-rule-2:     oklch(40%  0.014 248);   /* stronger hairline */
  --color-muted:      oklch(62%  0.014 248);   /* captions, meta, labels */
  --color-bone:       oklch(95.5% 0.008 250);  /* the document, cool light */
  --color-ink-strong: oklch(16%  0.014 250);   /* ink on bone */

  --color-accent:     oklch(78% 0.17 145);     /* acid green — the ONE accent */
  --color-accent-2:   oklch(85% 0.15 145);     /* brighter green, verb landmark */
  --color-accent-ink: oklch(12% 0.012 250);
  --color-focus:      oklch(78% 0.17 145);
  --color-glow:       oklch(80% 0.16 145 / 0.5);
  --color-glow-2:     oklch(80% 0.16 145 / 0.14);
  --color-emit:       oklch(78% 0.17 145 / 0.08);
  --color-band:       oklch(46% 0.13 145);     /* full-bleed deep-green field */
  --color-deep:       oklch(8%  0.010 250);    /* closing void */
  --color-glass:      oklch(15% 0.012 250 / 0.75);

  --font-display: "Instrument Serif", "Tiempos Headline", ui-serif, Georgia, serif;
  --font-body:    "Geist", "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-label:   "JetBrains Mono", "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace;

  /* 4-pt spacing scale, named: --space-3xs … --space-4xl. See tokens.css.   */
  /* Type scale: hero masthead 5rem max (viewport fit), counter 11rem max, punch 5.25rem. */

  --ease-out:    cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --dur-short: 220ms;  --dur-long: 420ms;

  --radius-card: 14px;  --radius-pill: 999px;  --radius-input: 8px;
}
```

## Typography law (non-negotiable — the two-register split)
- All prose is **lowercase** — headlines, lede, body, buttons, nav, brand,
  footer copy. Screen readers read the HTML; CSS renders the case.
- **UPPERCASE mono** is the only uppercase surface — status chips, stage
  labels, meta, plan names.
- No `font-style: italic` anywhere. Emphasis = weight, accent colour, or a
  1px drawn underline. One accent-coloured word per headline max (the verb
  landmark, `--color-accent-2`).
- Three families max: Instrument Serif (display) · Geist (body) ·
  JetBrains Mono (labels). No fourth.

## CTA voice
- Primary · solid acid-green fill (`--color-accent`) · pill radius · verb-first label ("start free trial") — one label per intent, used everywhere
- Secondary · hairline ghost (`--color-rule-2` border) · same pill radius
- Buttons: green → brighter green on hover with glow, press `translateY(1px)`, instant 2px green focus ring +3px offset

## Motion stance
- **Heavy smooth scroll** — lerp inertia on wheel/keys/anchors (0.09 factor),
  no dependencies, disabled under reduced-motion.
- **The live run** — hero counter ticks 0→2,340 while the document types
  itself; stamp lands; rail electrodes light in sequence. Runs once per view.
- **Fly rail** — number/verb swaps with a 260ms fade-slide ONLY on section
  change (never per scroll frame).
- **FAQ** — open/close animates `grid-template-rows` 0fr→1fr.
- **Hero shader** — WebGL dot-matrix ribbon on a defined sine path, eased
  cursor lens (green, movement-activated), gentle scroll drift. Reduced-motion:
  static frame. one ShaderMaterial, three r159 vendored locally, file://-safe.
- Section reveals are one-shot (hero grid, receipt, closing). Reduced-motion:
  everything static, fully visible.

## Signatures (what makes it nib, not a template)
- **The typing document** — a light bone paper in the hero that types the
  article live, with a giant green word counter and a coral-free rubber stamp
  ("draft ready · filed to wordpress") that lands in the corner.
- **Hero shader** — a single focused dot-matrix ribbon following a defined
  sine path across the middle; clean dark negative space everywhere else.
  Green palette, eased cursor lens, scroll drift. No grid, no full-canvas noise.
- **Narrative Workflow stages** — sticky left rail (`1.0 → 5.0` big serif
  numeral + name + dots) syncs to tall panes; text + inner-lit hairline cards.
- **Light document receipt** — full-bleed bone section with counting stats
  (2,340 / 92 / 4 / 3), sample-run labelled.
- **Deep-green punch band** — full-bleed `--color-band` field with massive
  serif statement.
- **Statement footer** — one serif sentence closes the page.
- Bans: no purple-cyan gradients, no gradient text, no aurora blobs, no
  glassmorphism, no re-drawn browser chrome, no invented metrics, no
  emoji icons, no italic headers, no centred-everything heroes, no warm
  brass/coral/violet hues (single green hue family only).

## Exports
`tokens.css` (in this project) is the source of truth. For Tailwind v4
`@theme`, DTCG `tokens.json`, or shadcn/ui CSS variables, ask *"extend
design.md with Tailwind exports"* — Hallmark will append them per
`export-formats.md`.
