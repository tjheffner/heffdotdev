/**
 * heffner.dev's own syntax theme.
 *
 * Anchored to the site's own hues: navy for plain text, its blue for
 * functions, its gray for punctuation. The six syntax hues are spread around
 * the wheel so neighboring token types never land in the same family.
 *
 * `editor.background` is declared so the contrast numbers below mean
 * something, but a transformer strips it from the emitted markup and
 * code-block.css paints `--hz-color-surface-muted` instead. Every color here
 * clears WCAG AA (>= 4.5) on that surface, and the blog-post axe scan
 * enforces it.
 */

/** The surface these are graded against: what --hz-color-surface-muted is. */
export const CODE_SURFACE = '#ffffff'

const NAVY = '#1d293d' // 14.62  the site's text color
const MUTED = '#6b6382' // 5.63  comments, a purple-shifted gray
const GRAY = '#646b78' // 5.36  the site's gray, punctuation
const RUST = '#9a3412' // 7.31  numbers and constants     hue  15
const GREEN = '#15803d' // 5.02  strings                  hue 142
const CYAN = '#0e7490' // 5.36  type and class names      hue 193
const BLUE = '#1d4ed8' // 6.70  the site's secondary, functions  hue 225
const PURPLE = '#7e22ce' // 6.98  keywords                hue 272
const PINK = '#be185d' // 6.04  storage: const, let, type, export  hue 335

/** Every color above, for the contrast assertion in the theme's own test. */
export const CODE_COLORS = [
  NAVY,
  MUTED,
  GRAY,
  RUST,
  GREEN,
  CYAN,
  BLUE,
  PURPLE,
  PINK,
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
      settings: { foreground: GREEN },
    },
    // template literals read as strings; their ${} punctuation does not
    {
      scope: ['string.template', 'punctuation.definition.template-expression'],
      settings: { foreground: GREEN },
    },

    {
      scope: [
        'constant.numeric',
        'constant.language',
        'constant.character',
        'constant.other',
        'support.constant',
      ],
      settings: { foreground: RUST },
    },

    {
      scope: ['keyword', 'keyword.control', 'keyword.other'],
      settings: { foreground: PURPLE },
    },
    // storage keeps a hue of its own. folded into the keyword purple,
    // `export const` read as one long word.
    {
      scope: ['storage', 'storage.type', 'storage.modifier'],
      settings: { foreground: PINK },
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
      settings: { foreground: CYAN },
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
      settings: { foreground: CYAN },
    },
    {
      scope: [
        'support.type.property-name',
        'meta.object-literal.key',
        'entity.name.tag.yaml',
      ],
      settings: { foreground: BLUE },
    },
    { scope: ['string.regexp'], settings: { foreground: GREEN } },
    // php and js sigil-prefixed variables stay plain text, not punctuation
    {
      scope: ['variable.other.php', 'punctuation.definition.variable'],
      settings: { foreground: NAVY },
    },
  ],
}

export default shikiTheme
