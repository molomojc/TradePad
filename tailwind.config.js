/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "error": "#ffb4ab",
        "on-primary-fixed": "#1b1b1b",
        "on-error-container": "#ffdad6",
        "on-tertiary-fixed-variant": "#474747",
        "secondary-container": "#4a4949",
        "inverse-on-surface": "#303030",
        "surface-bright": "#393939",
        "on-background": "var(--color-on-background)",
        "tertiary-fixed": "var(--color-tertiary-fixed)",
        "on-tertiary-fixed": "#1b1b1b",
        "on-tertiary-container": "#757575",
        "inverse-surface": "var(--color-inverse-surface)",
        "background": "var(--color-background)",
        "secondary-fixed-dim": "#c8c6c5",
        "on-primary-container": "#757575",
        "secondary": "#c8c6c5",
        "surface-container-low": "var(--color-surface-container-low)",
        "on-secondary-fixed": "#1c1b1b",
        "on-surface": "var(--color-on-surface)",
        "on-surface-variant": "var(--color-on-surface-variant)",
        "secondary-fixed": "#e5e2e1",
        "outline-variant": "var(--color-outline-variant)",
        "surface-container-high": "var(--color-surface-container-high)",
        "error-container": "#93000a",
        "on-error": "#690005",
        "on-tertiary": "#303030",
        "outline": "var(--color-outline)",
        "tertiary-fixed-dim": "#c6c6c6",
        "tertiary": "#c6c6c6",
        "primary-container": "#000000",
        "inverse-primary": "var(--color-inverse-primary)",
        "surface-tint": "var(--color-surface-tint)",
        "primary-fixed-dim": "#c6c6c6",
        "surface-dark": "var(--color-surface-dark)",
        "primary": "var(--color-primary)",
        "surface": "var(--color-surface)",
        "surface-variant": "var(--color-surface-variant)",
        "on-secondary-container": "#bab8b7",
        "on-secondary": "#313030",
        "on-secondary-fixed-variant": "#474646",
        "primary-fixed": "var(--color-primary-fixed)",
        "neon-red": "#FF2E2E"
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
      spacing: {
        "unit": "4px",
        "gutter": "24px",
        "container-max": "1280px",
        "margin-desktop": "64px",
        "margin-mobile": "20px"
      },
      fontFamily: {
        sans: ["Outfit", "sans-serif"],
        display: ["Space Grotesk", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      fontSize: {
        "body-lg": ["18px", {"lineHeight": "1.6", "fontWeight": "400"}],
        "label-mono": ["14px", {"lineHeight": "1.4", "letterSpacing": "0.05em", "fontWeight": "500"}],
        "display-lg": ["64px", {"lineHeight": "1.1", "letterSpacing": "-0.04em", "fontWeight": "700"}],
        "headline-md": ["24px", {"lineHeight": "1.3", "fontWeight": "600"}],
        "caption": ["12px", {"lineHeight": "1.4", "letterSpacing": "0.01em", "fontWeight": "500"}],
        "headline-lg": ["40px", {"lineHeight": "1.2", "letterSpacing": "-0.02em", "fontWeight": "600"}],
        "body-md": ["16px", {"lineHeight": "1.6", "fontWeight": "400"}]
      }
    },
  },
  plugins: [],
}
