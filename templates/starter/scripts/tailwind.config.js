const plugin = tailwind.plugin;

tailwind.config = {
	content: [
		'./pages/*.{html}',
		'./components/*.{html}',
		'./style/*.{css}',
	],
	darkMode: ['class'],
	theme: {
		extend: {
			// fontFamily: {
			// 	sans: ['DM Sans', 'sans-serif'],
			// },
			colors: {

				/* Palette */
				"50": "color-mix(in srgb, var(--color-50) calc(<alpha-value> * 100%), transparent)",
				"100": "color-mix(in srgb, var(--color-100) calc(<alpha-value> * 100%), transparent)",
				"200": "color-mix(in srgb, var(--color-200) calc(<alpha-value> * 100%), transparent)",
				"300": "color-mix(in srgb, var(--color-300) calc(<alpha-value> * 100%), transparent)",
				"400": "color-mix(in srgb, var(--color-400) calc(<alpha-value> * 100%), transparent)",
				"500": "color-mix(in srgb, var(--color-500) calc(<alpha-value> * 100%), transparent)",
				"600": "color-mix(in srgb, var(--color-600) calc(<alpha-value> * 100%), transparent)",
				"700": "color-mix(in srgb, var(--color-700) calc(<alpha-value> * 100%), transparent)",
				"800": "color-mix(in srgb, var(--color-800) calc(<alpha-value> * 100%), transparent)",
				"900": "color-mix(in srgb, var(--color-900) calc(<alpha-value> * 100%), transparent)",
				"950": "color-mix(in srgb, var(--color-950) calc(<alpha-value> * 100%), transparent)",

				/* Overlays */
				"overlay-dark": "color-mix(in srgb, var(--color-overlay-dark) calc(<alpha-value> * 100%), transparent)",
				"overlay-light": "color-mix(in srgb, var(--color-overlay-light) calc(<alpha-value> * 100%), transparent)",

				/* Theme */
				"page": "color-mix(in srgb, var(--color-page) calc(<alpha-value> * 100%), transparent)",
				"surface-1": "color-mix(in srgb, var(--color-surface-1) calc(<alpha-value> * 100%), transparent)",
				"surface-2": "color-mix(in srgb, var(--color-surface-2) calc(<alpha-value> * 100%), transparent)",
				"surface-3": "color-mix(in srgb, var(--color-surface-3) calc(<alpha-value> * 100%), transparent)",
				"form": "color-mix(in srgb, var(--color-field-surface) calc(<alpha-value> * 100%), transparent)",
				"popover": "color-mix(in srgb, var(--color-popover-surface) calc(<alpha-value> * 100%), transparent)",
				"stark": "color-mix(in srgb, var(--color-text-stark) calc(<alpha-value> * 100%), transparent)",
				"main": "color-mix(in srgb, var(--color-text-stark) calc(<alpha-value> * 100%), transparent)",
				"neutral": "color-mix(in srgb, var(--color-text-neutral) calc(<alpha-value> * 100%), transparent)",
				"subtle": "color-mix(in srgb, var(--color-text-subtle) calc(<alpha-value> * 100%), transparent)",
				"line": "color-mix(in srgb, var(--color-line) calc(<alpha-value> * 100%), transparent)",
				"primary": "color-mix(in srgb, var(--color-primary) calc(<alpha-value> * 100%), transparent)",
				"primary-inverse": "color-mix(in srgb, var(--color-primary-inverse) calc(<alpha-value> * 100%), transparent)",
				"primary-text": "color-mix(in srgb, var(--color-primary-text) calc(<alpha-value> * 100%), transparent)",
				"accent": "color-mix(in srgb, var(--color-accent) calc(<alpha-value> * 100%), transparent)",
				"accent-inverse": "color-mix(in srgb, var(--color-accent-inverse) calc(<alpha-value> * 100%), transparent)",
				"accent-text": "color-mix(in srgb, var(--color-accent-text) calc(<alpha-value> * 100%), transparent)",
				"danger": "color-mix(in srgb, var(--color-danger) calc(<alpha-value> * 100%), transparent)",
				"danger-inverse": "color-mix(in srgb, var(--color-danger-inverse) calc(<alpha-value> * 100%), transparent)",
				"danger-text": "color-mix(in srgb, var(--color-danger-text) calc(<alpha-value> * 100%), transparent)",
			},
			textColor: {
				"primary": "var(--color-primary-text)",
				"accent": "var(--color-accent-text)",
			},
			spacing: {
				"2xs": "var(--spacing-2xs)",
				"xs": "var(--spacing-xs)",
				"sm": "var(--spacing-sm)",
				"md": "var(--spacing-md)",
				"lg": "var(--spacing-lg)",
				"xl": "var(--spacing-xl)",
				"2xl": "var(--spacing-2xl)",
				"form": "var(--spacing-field-padding)",
				"form-size": "var(--spacing-field-height)",
				"content": "var(--spacing-content-width)",
				"viewport": "var(--spacing-viewport-padding)",
			},
			borderRadius: {
				"2xs": "var(--radius-2xs)",
				"xs": "var(--radius-xs)",
				"sm": "var(--radius-sm)",
				"md": "var(--radius-md)",
				"lg": "var(--radius-lg)",
				"xl": "var(--radius-xl)",
				"2xl": "var(--radius-2xl)",
				"3xl": "var(--radius-3xl)",
				"4xl": "var(--radius-4xl)",
			},
		}
	}
}