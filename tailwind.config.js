/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // SoliVana semantic tokens (per SOLIVANA_BUILD_SPEC.md §1.2)
        brown: '#331D01',
        accent: '#EC9247',
        coffeeText: '#786455',
        coffee: '#B49F90',
        coffeeLight: '#F0EDED',
        paper: '#FFFFFF',
        soft: '#FFF8F0',

        // Legacy Resonance tokens — remapped to SoliVana palette so existing
        // class names keep rendering without a JSX refactor.
        'brown-primary': '#331D01',
        'peach-cream': '#F0EDED',
        'sage-green': '#EC9247',
        'sage-light': '#F0EDED',
        'dark-navy': '#331D01',
        'pale-cream': '#FFF8F0',
        'cyan-glow': '#EC9247',
        'yellow-glow': '#EC9247',
        'magenta-glow': '#EC9247',
        'green-accent': '#EC9247',
        'warm-pulse': '#EC9247',

        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: {
        // SoliVana semantic tokens
        hero: ['Jost', 'system-ui', 'sans-serif'],
        heading: ['Montserrat', 'system-ui', 'sans-serif'],
        body: ['Poppins', 'system-ui', 'sans-serif'],

        // Legacy Resonance tokens — remapped to SoliVana stack.
        playfair: ['Jost', 'system-ui', 'sans-serif'],
        'dm-sans': ['Poppins', 'system-ui', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      borderRadius: {
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xs: "calc(var(--radius) - 6px)",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        'card': '0 2px 8px rgba(51,29,1,0.04)',
        'card-hover': '0 8px 24px rgba(51,29,1,0.08)',
        'sage-glow': '0 4px 16px rgba(236,146,71,0.25)',
        'accent-glow': '0 4px 16px rgba(236,146,71,0.25)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "caret-blink": {
          "0%,70%,100%": { opacity: "1" },
          "20%,50%": { opacity: "0" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(40px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(236,146,71,0.2)" },
          "50%": { boxShadow: "0 0 40px rgba(236,146,71,0.4)" },
        },
        "orbit-pulse": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.08)" },
        },
        "border-gradient-rotate": {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        "hero-clip-reveal": {
          "0%": { clipPath: "inset(0 100% 0 0)" },
          "100%": { clipPath: "inset(0 0% 0 0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "sine-drift": {
          "0%": { transform: "translateX(-5%)" },
          "50%": { transform: "translateX(5%)" },
          "100%": { transform: "translateX(-5%)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "caret-blink": "caret-blink 1.25s ease-out infinite",
        "fade-in-up": "fade-in-up 0.8s cubic-bezier(0.22, 1, 0.4, 1) forwards",
        "pulse-glow": "pulse-glow 2.5s ease-in-out infinite",
        "orbit-pulse": "orbit-pulse 2.5s cubic-bezier(0.34, 1.56, 0.64, 1) infinite",
        "border-gradient-rotate": "border-gradient-rotate 4s linear infinite",
        "hero-clip-reveal": "hero-clip-reveal 0.8s cubic-bezier(0.22, 1, 0.4, 1) 0.2s forwards",
        "fade-in": "fade-in 0.6s cubic-bezier(0.22, 1, 0.4, 1) forwards",
        "sine-drift": "sine-drift 20s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
