# Design — nib

Locked design system. Future Hallmark runs read this file first; pages defer
to it. Amend intentionally — the file is the rule.

## System
- Genre · atmospheric
- Macrostructure · Narrative Workflow
- Theme · lumen (drop: night foundry)
- Axes · dark (L 13% / H 265 violet tilt) / classical-serif-lowercase (Instrument Serif 400, upright, all-lowercase prose) / molten brass (H 50) + coral chord (H 18)

## Tokens (canonical · `tokens.css` is the source of truth)
```css
:root {
  --color-paper:      oklch(13%  0.014 265);   /* late-night studio, violet tilt */
  --color-paper-2:    oklch(17%  0.016 265);   /* elevated card */
  --color-paper-3:    oklch(22%  0.018 263);   /* deeper hover */
  --color-ink:        oklch(96%  0.006 262);   /* headlines, near-white */
  --color-ink-2:      oklch(82%  0.010 262);   /* body */
  --color-rule:       oklch(30%  0.018 265);   /* hairline border */
  --color-rule-2:     oklch(42%  0.020 263);   /* stronger hairline */
  --color-muted:      oklch(60%  0.016 263);   /* captions, meta, labels */
  --color-accent:     oklch(76% 0.17 50);      /* molten brass */
  --color-accent-2:   oklch(68% 0.16 18);      /* coral chord — verb landmark only */
  --color-accent-ink: oklch(13% 0.014 265);    /* ink on accent fill */
  --color-focus:      oklch(76% 0.17 50);
  --color-glow:       oklch(80% 0.16 50 / 0.42);  /* brass halo — apparatus + cards only */
  --rule-blueprint:   oklch(96% 0.006 262 / 0.04); /* hero grid, 48px cells */

  --font-display: "Instrument Serif", "Tiempos Headline", ui-serif, Georgia, serif;
  --font-body:    "Geist", "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-mono:    "JetBrains Mono", "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace;

  /* 4-pt spacing scale, named: --space-3xs … --space-4xl. See tokens.css.   */
  /* Type scale: --text-xs … --text-display (clamp 3rem → 5.6rem).           */

  --ease-out:    cubic-bezier(0.16, 1, 0.3, 1);
  --ease-soft:   cubic-bezier(0.33, 1, 0.68, 1);
  --dur-short: 220ms;  --dur-long: 420ms;  --dur-pulse: 4s;

  --radius-card: 10px;  --radius-pill: 999px;  --radius-input: 8px;
}
```

## Typography law (non-negotiable — the theme's two-register split)
- All prose is **lowercase** — headlines, lede, body, buttons, nav, brand,
  footer copy. Screen readers read the HTML; CSS renders the case.
- **UPPERCASE mono** is the only uppercase surface — eyebrows
  (`00 · A CONTENT INSTRUMENT`), apparatus callouts, meter labels, tags.
- No `font-style: italic` anywhere. Emphasis = weight, accent colour, or a
  1px drawn underline. The one accent-coloured word per headline is the
  **verb/noun landmark** (coral chord + underline), never decorative.
- Three families max: Instrument Serif (display) · Geist (body) ·
  JetBrains Mono (labels). No fourth.

## CTA voice
- Primary · solid molten-brass fill · pill radius · `--space-sm --space-lg` padding · verb-first label ("start free trial")
- Secondary · hairline ghost (`--color-rule-2` border, transparent fill) · same pill radius
- Buttons hover-warm (brass → near-white), press `translateY(1px)`, instant 2px brass focus ring +3px offset

## Motion stance
- Composed: one-shot reveals (fade + 10px rise, 600ms, 60ms stagger) · one
  filament pulse (4s, 3% intensity) · verb-underline draw-in (320ms, once).
  Nothing else moves. No marquee, no parallax, no loops.
- Reduced-motion fallback · all animation collapses to static final state; reveals render fully visible.

## Signatures (what makes it nib, not a template)
- **Apparatus over orb** — one hand-built CSS instrument per page
  (filament chamber); leader-line callouts carry REAL brief values only.
- **Blueprint grid** — 48px cells at 4% opacity + one brass inner-emit
  wash on the hero; dark beat comes from the apparatus, never from blobs.
- **Meter strip** — full-bleed gaussian-envelope tick band under the hero;
  a printed readout, static.
- **Narrative Workflow stages** — `1.0 → 5.0` numbered rules, text column +
  hairline card lit from within (radial at ≤6% opacity rest / 12% hover).
- **Statement footer** — one serif sentence closes the page.
- Bans: no purple-cyan gradients, no gradient text, no aurora blobs, no
  glassmorphism, no re-drawn browser chrome, no invented metrics, no
  emoji icons, no italic headers, no centred-everything heroes.

## Exports
`tokens.css` (in this project) is the source of truth. For Tailwind v4
`@theme`, DTCG `tokens.json`, or shadcn/ui CSS variables, ask *"extend
design.md with Tailwind exports"* — Hallmark will append them per
`export-formats.md`.
