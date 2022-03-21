module.exports = {
	content: [
		'./src/**/*.svelte',
		// may also want to include HTML files
		'./src/**/*.html'
	],
	darkMode: 'class',
	theme: {
		extend: {
			colors: {
				accent: 'var(--brand-accent)',
				alternate: 'var(--brand-alternate)'
			},
			typography: (theme) => ({
				DEFAULT: {
					css: {
						'--tw-prose-bullets': theme('colors.black'),
						'--tw-prose-th-borders': theme('colors.accent'),
						'--tw-prose-td-borders': theme('colors.accent'),
						// these customizations are explained here https://youtu.be/-FzemNMcOGs
						blockquote: {
							borderLeft: '3px solid theme("colors.accent")',
							fontSize: 'inherit',
							fontStyle: 'inherit',
							fontWeight: 'medium'
						},
						'blockquote p:first-of-type::before': {
							content: ''
						},
						'blockquote p:last-of-type::after': {
							content: ''
						},
						'code::before': false,
						'code::after': false,
						code: {
							'border-radius': '0.25rem',
							padding: '0.15rem 0.3rem',
							borderWidth: '2px',
							borderColor: 'rgba(0,0,0,0.1)'
						},
						'a code': {
							color: 'unset'
						},
						'a strong': {
							color: 'currentColor'
						},
						'li, ul, ol': {
							margin: 0
						},
						'li > img': {
							margin: 0,
							display: 'inline'
						},
						'ol > li::marker': {
							color: 'var(--tw-prose-body)'
						},
						'ul > li::marker': {
							color: 'var(--tw-prose-body)'
						},
						tfoot: {
							borderTopWidth: '1px',
							borderColor: 'var(--tw-prose-th-borders)'
						},
						mark: {
							padding: '0.25rem',
							background: theme('colors.indigo.300'),
							color: 'var(--tw-prose-body)'
						}
					}
				},
				// for dark:prose-invert
				invert: {
					css: {
						'--tw-prose-th-borders': theme('colors.blue.300'),
						'--tw-prose-td-borders': theme('colors.gray.600'),
						mark: {
							background: theme('colors.blue.300'),
							color: theme('colors.slate.900')
						},
						hr: {
							borderColor: theme('colors.accent')
						}
					}
				}
			})
		}
	},
	variants: {},
	plugins: [require('@tailwindcss/typography')]
};
