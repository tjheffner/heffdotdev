import { defineConfig } from '@hyzer-labs/ui/config'

/**
 * Design tokens for heffner.dev.
 *
 * Three named themes, one per visual area, activated by `data-theme` on
 * <body> (set during SSR in hooks.server.ts, kept in sync on client-side
 * navigation by the root layout). `data-theme` is the theming axis.
 * `data-group` is the app-level CSS barrier it has always been: it gates whole
 * stylesheets (global.css, christmas.css) to a route group, a different job
 * from swapping a palette.
 *
 * Christmas has no theme. It is a standalone page with its own stylesheet and
 * no hyzer components, so it renders under the `main` theme and overrides what
 * it wants.
 *
 * A theme takes every token group, not only color, so the site's spacing
 * rhythm, density grid and font stacks are authored here too. What stays in CSS
 * is what a token sheet cannot express: `@font-face`, and the resume's
 * `@media print` type scale.
 *
 * Regenerate with `npm run tokens`. `npm run tokens:check` is the CI gate.
 */
export default defineConfig({
  output: './src/hyzer-tokens.css',

  /**
   * :root defaults. What a page gets with no `data-theme`, and what the main
   * site is built on. Every theme below inherits these and overrides only what
   * it changes.
   */
  tokens: {
    typography: {
      /**
       * The two site faces. `@font-face` still lives in global.css and
       * resume.css, because a token sheet declares custom properties and does
       * not load fonts. Nothing else names the families any more.
       */
      fontFamily: {
        sans: "'Mulish', sans-serif",
        serif: "'Merriweather', serif",
      },
      /**
       * Authored in `em`, not the shipped `rem`, because that is what the
       * site's scale has always been: a heading inside a scaled block (the
       * .prose blockquote) scales with it rather than snapping back to the
       * root. A custom property holding `em` resolves against the element the
       * declaration applies to, so the token carries that behavior intact. Only
       * global.css reads these; the component theme sheet is not imported.
       */
      fontSize: {
        sm: '0.8448em',
        lg: '1.401em',
        xl: '1.6583em',
        '2xl': '2.75em',
      },
    },

    /**
     * The site rhythm, from https://complementary.space/. Two distances: near
     * for related things, away for unrelated, both off one grid unit.
     *
     * The ladder runs one rung tighter than the shipped default. The site's
     * body-level near has always been 5 units, not 10. Each rung is the `near`
     * at that nesting depth, and `away` is the depth above's `near`, so setting
     * the three rungs reproduces the old global.css cascade. Depth 4 keeps the
     * shipped default, since nothing nests `data-density-shift` that deep (the
     * deepest is the ToC panel at three).
     */
    density: {
      unit: '0.4rem', // ~10pt grid
      ladder: {
        depth1: 'calc(var(--hz-density) * 5)',
        depth2: 'calc(var(--hz-density) * 2)',
        depth3: 'calc(var(--hz-density) * 1)',
      },
    },
  },

  themes: {
    /**
     * The main site, now the sole source of its own palette. global.css used to
     * declare the same four hues as --c-accent/-secondary/-text/-background and
     * this block only mirrored them. The site's CSS reads these tokens
     * directly, so there is nothing left to keep in step.
     */
    main: {
      palette: {
        // Authored in oklch, the way the site has always written them. The
        // contrast checker parses oklch(), so these grade in CI like any hex.
        // All four sit inside the sRGB gamut, so nothing here is clipped.
        primary: 'oklch(57.057% 0.21474 14.568)', // was --c-accent
        secondary: 'oklch(48.821% 0.21724 264.392)', // was --c-secondary
        black: 'oklch(27.9% 0.041 260.031)', // was --c-text
        white: 'oklch(96.8% 0.007 247.896)', // was --c-background
        // The two washes: the same hue at quarter alpha, for table row banding
        // and inline-code backgrounds. Relative color pins them to the hue
        // above instead of restating it, and declaring them in this block (not
        // :root) makes `from` resolve against this theme's primary rather than
        // the shipped default.
        primaryTint:
          'oklch(from var(--hz-palette-primary) l c h / calc(alpha - 0.75))',
        secondaryTint:
          'oklch(from var(--hz-palette-secondary) l c h / calc(alpha - 0.75))',
        // Darkened from the shipped #6b7280, which lands at 4.41:1 on our
        // surface. The stock hue is tuned against pure white and our background
        // is a shade darker. Not a brand color; nothing on the site paints with
        // it today.
        gray: '#646b78',
      },
      color: {
        surface: 'var(--hz-palette-white)',
        text: 'var(--hz-palette-black)',
        border: 'var(--hz-palette-primary)',
        // The page background is already a light blue-gray, so the quiet
        // surface reads as raised white rather than a darker mix (the base
        // default). A design call, and it buys back the contrast the darker mix
        // was costing every intent painted on top of it.
        surfaceMuted: '#ffffff',
      },
      intent: {
        primary: 'var(--hz-palette-primary)',
        secondary: 'var(--hz-palette-secondary)',
      },
    },

    /**
     * The resume: white paper, black ink, no brand color. Print is the primary
     * medium, so the palette is flat. resume.css still owns the type scale,
     * because it is print-tuned and a token sheet has no `@media print`.
     */
    resume: {
      space: {
        /**
         * Every list on the resume is a Stack or Cluster with gap="xs". `em`,
         * not the root's `rem`, so the rhythm tracks font-size. The print block
         * leans on that when it shrinks the type, and overrides this one token
         * again there.
         */
        xs: '0.5em',
      },
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
     * Values are lifted from the --pg-* block in PlaygroundShell.svelte, which
     * now points at these roles instead of repeating the hexes.
     */
    playground: {
      typography: {
        // The playgrounds are instrument panels: everything is mono, so the
        // theme retargets the face rather than every rule naming a stack.
        fontFamily: {
          mono: "ui-monospace, 'SF Mono', 'Cascadia Code', Menlo, Consolas, monospace",
        },
      },
      palette: {
        primary: '#ff6b35',
        // Accent hover/active state, and the slider track. Neither maps onto a
        // structural role, so they are palette entries of their own.
        primaryBright: '#ff8a5c',
        track: '#2a2a31',
        // The status hues, relit for a near-black surface. The shipped ones are
        // tuned to pass on light backgrounds and drop to ~3:1 here. The
        // playgrounds do not use these intents today, but a theme has to be
        // coherent before it is used, or the first Alert is unreadable. Values
        // are the library's own dark-theme hues.
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
