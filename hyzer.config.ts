import { defineConfig } from '@hyzer-labs/ui/config'

/**
 * Design tokens for heffner.dev.
 *
 * Three named themes, one per visual area, activated by `data-theme` on
 * <body> (set during SSR in hooks.server.ts, kept in sync on client-side
 * navigation by the root layout). `data-theme` is the *theming* axis;
 * `data-group` stays the app-level CSS barrier it has always been — it gates
 * whole stylesheets (global.css, christmas.css) to a route group, which is a
 * different job from swapping a palette.
 *
 * Christmas is deliberately absent: it is a standalone page with its own
 * stylesheet and no hyzer components, so it needs no theme. It renders under
 * the `main` theme and simply overrides what it wants.
 *
 * Only colors can live in a named theme — the override type is
 * palette/color/intent. Type scale, spacing and density are :root-only, which
 * is why the resume's print-tuned type stays in resume.css (a token sheet
 * cannot express `@media print` type anyway) and the site's spacing rhythm
 * stays in global.css.
 *
 * Regenerate with `npm run tokens`; `npm run tokens:check` is the CI gate.
 */
export default defineConfig({
  output: './src/hyzer-tokens.css',

  themes: {
    /**
     * The main site. Mirrors the --c-* values in global.css, which remain the
     * source of truth for the site's own hand-written CSS; these give hyzer
     * components the same palette so they render in-brand out of the box.
     * Keep the two in step until --c-* is flipped over to var(--hz-*).
     */
    main: {
      palette: {
        // sRGB equivalents of global.css's oklch values — all four are inside
        // the sRGB gamut, so these are exact, not approximations. Written as
        // hex because the contrast checker cannot parse oklch() and skips the
        // pairing, which would leave this theme unverified in CI.
        primary: '#d81d4e', // oklch(57.057% 0.21474 14.568)
        secondary: '#1d4ed8', // oklch(48.821% 0.21724 264.392)
        black: '#1d293d', // oklch(27.9%   0.041   260.031)
        white: '#f1f5f9', // oklch(96.8%   0.007   247.896)
        // Darkened from the shipped #6b7280, which lands at 4.41:1 on our
        // surface — the stock hue is tuned against pure white and our
        // background is a shade darker. Not a brand color; nothing on the
        // site paints with it today.
        gray: '#646b78',
      },
      color: {
        surface: 'var(--hz-palette-white)',
        text: 'var(--hz-palette-black)',
        border: 'var(--hz-palette-primary)',
        // The page background is already a light blue-gray, so the quiet
        // surface reads as raised white rather than a darker mix (the base
        // default). That is a design call, and it also buys back the contrast
        // the darker mix was costing every intent painted on top of it.
        surfaceMuted: '#ffffff',
      },
      intent: {
        primary: 'var(--hz-palette-primary)',
        secondary: 'var(--hz-palette-secondary)',
      },
    },

    /**
     * The resume: white paper, black ink, no brand color. Print is the
     * primary medium, so the palette is deliberately flat — resume.css owns
     * the type scale, the density rhythm and every @media print rule.
     */
    resume: {
      palette: {
        primary: '#000000',
        black: '#000000',
        white: '#ffffff',
      },
      color: {
        surface: 'var(--hz-palette-white)',
        text: 'var(--hz-palette-black)',
        textMuted: '#555555',
        border: 'var(--hz-palette-black)',
      },
      intent: {
        primary: 'var(--hz-palette-black)',
      },
    },

    /**
     * The playgrounds: near-black chrome, gray hairlines, one orange accent.
     * Values are lifted verbatim from the --pg-* block in
     * PlaygroundShell.svelte, which now points at these roles instead of
     * repeating the hexes.
     */
    playground: {
      palette: {
        primary: '#ff6b35',
        // Accent hover/active state, and the slider track — neither maps onto
        // a structural role, so they are palette entries of their own.
        primaryBright: '#ff8a5c',
        track: '#2a2a31',
        // The status hues, relit for a near-black surface. The shipped ones
        // are tuned to pass on *light* backgrounds and drop to ~3:1 here. The
        // playgrounds do not use these intents today, but a theme has to be
        // coherent before it is used, or the first Alert is unreadable.
        // Values are the library's own dark-theme hues.
        gray: '#9ca3af',
        secondary: '#a78bfa',
        danger: '#f87171',
        warning: '#fbbf24',
        success: '#4ade80',
        info: '#22d3ee',
      },
      color: {
        surface: '#101015',
        surfaceMuted: '#16161c',
        text: '#e8e8ec',
        textMuted: '#8a8a93',
        border: '#26262e',
      },
      intent: {
        primary: 'var(--hz-palette-primary)',
      },
    },
  },
})
