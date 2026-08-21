/**
 * heffner.dev's own syntax theme.
 *
 * The shipped themes were each wrong in one of two ways: the dark ones punched
 * a hole in a light page, and the light ones brought a palette with no
 * relationship to this site's. This one is purple-leaning and anchored by the
 * site's own hues — navy for plain text, its blue for functions, its gray for
 * punctuation — so a code block reads as part of the page.
 *
 * The surface is deliberately absent. `editor.background` is declared so the
 * contrast numbers below mean something, but a transformer strips it from the
 * emitted markup and code-block.css paints `--hz-color-surface-muted` instead.
 * That is the token the main theme already uses for raised, quiet surfaces,
 * so the block follows the palette rather than pinning a hex of its own.
 *
 * Every color here clears WCAG AA (>= 4.5) on that surface — the blog-post
 * axe scan enforces it, and the ratio is noted against each one.
 */

/** The surface these are graded against: what --hz-color-surface-muted is. */
export const CODE_SURFACE = '#ffffff'

const NAVY = '#1d293d' // 14.62 — the site's own text color
const MUTED = '#6b6382' // 5.63 — comments, a purple-shifted gray
const GRAY = '#646b78' // 5.36 — the site's gray, for punctuation
const PURPLE = '#7e22ce' // 6.98 — keywords
const VIOLET = '#5b21b6' // 8.98 — storage/type modifiers
const PLUM = '#86198f' // 8.24 — strings
const FUCHSIA = '#a21caf' // 6.32 — numbers and constants
const BLUE = '#1d4ed8' // 6.70 — the site's secondary, for functions
const INDIGO = '#4338ca' // 7.90 — type and class names

/** Every hue above, for the contrast assertion in the theme's own test. */
export const CODE_COLORS = [
  NAVY,
  MUTED,
  GRAY,
  PURPLE,
  VIOLET,
  PLUM,
  FUCHSIA,
  BLUE,
  INDIGO,
]

export const shikiTheme = {
  name: 'heffnerdotdev',
  type: 'light',
  colors: {
    'editor.background': CODE_SURFACE,
    'editor.foreground': NAVY,
  },
  settings: [
    { settings: { background: CODE_SURFACE, foreground: NAVY } },

    {
      scope: ['comment', 'punctuation.definition.comment'],
      settings: { foreground: MUTED, fontStyle: 'italic' },
    },

    {
      scope: ['string', 'string.quoted', 'punctuation.definition.string'],
      settings: { foreground: PLUM },
    },
    // template literals read as strings; their ${} punctuation does not
    {
      scope: ['string.template', 'punctuation.definition.template-expression'],
      settings: { foreground: PLUM },
    },

    {
      scope: [
        'constant.numeric',
        'constant.language',
        'constant.character',
        'constant.other',
        'support.constant',
      ],
      settings: { foreground: FUCHSIA },
    },

    {
      scope: ['keyword', 'keyword.control', 'keyword.other'],
      settings: { foreground: PURPLE },
    },
    {
      scope: ['storage', 'storage.type', 'storage.modifier'],
      settings: { foreground: VIOLET },
    },

    {
      scope: [
        'entity.name.function',
        'support.function',
        'meta.function-call.generic',
      ],
      settings: { foreground: BLUE },
    },
    {
      scope: [
        'entity.name.type',
        'entity.name.class',
        'support.class',
        'support.type',
        'entity.other.inherited-class',
      ],
      settings: { foreground: INDIGO },
    },

    {
      scope: [
        'variable',
        'variable.other',
        'variable.parameter',
        'meta.definition.variable',
      ],
      settings: { foreground: NAVY },
    },

    {
      scope: ['punctuation', 'meta.brace', 'keyword.operator'],
      settings: { foreground: GRAY },
    },

    // markup languages: html tags, and css/yaml keys
    {
      scope: ['entity.name.tag', 'punctuation.definition.tag'],
      settings: { foreground: PURPLE },
    },
    {
      scope: ['entity.other.attribute-name'],
      settings: { foreground: INDIGO },
    },
    {
      scope: [
        'support.type.property-name',
        'meta.object-literal.key',
        'entity.name.tag.yaml',
      ],
      settings: { foreground: BLUE },
    },
    { scope: ['string.regexp'], settings: { foreground: PLUM } },
    // php and js sigil-prefixed variables stay plain text, not punctuation
    {
      scope: ['variable.other.php', 'punctuation.definition.variable'],
      settings: { foreground: NAVY },
    },
  ],
}

export default shikiTheme
