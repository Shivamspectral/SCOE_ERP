/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)', foreground: 'var(--foreground)',
        card: { DEFAULT: 'var(--card)', foreground: 'var(--card-foreground)' },
        popover: { DEFAULT: 'var(--popover)', foreground: 'var(--popover-foreground)' },
        primary: { DEFAULT: 'var(--primary)', foreground: 'var(--primary-foreground)' },
        secondary: { DEFAULT: 'var(--secondary)', foreground: 'var(--secondary-foreground)' },
        muted: { DEFAULT: 'var(--muted)', foreground: 'var(--muted-foreground)' },
        accent: { DEFAULT: 'var(--accent)', foreground: 'var(--accent-foreground)' },
        destructive: { DEFAULT: 'var(--destructive)', foreground: '#ffffff' },
        success: { DEFAULT: 'var(--success)', foreground: 'var(--success-foreground)' },
        warning: { DEFAULT: 'var(--warning)', foreground: 'var(--warning-foreground)' },
        border: 'var(--border)', input: 'var(--input)', ring: 'var(--ring)', cream: 'var(--cream)',
        chart: { 1: 'var(--chart-1)', 2: 'var(--chart-2)', 3: 'var(--chart-3)', 4: 'var(--chart-4)', 5: 'var(--chart-5)' },
        sidebar: { DEFAULT: 'var(--sidebar)', foreground: 'var(--sidebar-foreground)', primary: 'var(--sidebar-primary)', 'primary-foreground': 'var(--sidebar-primary-foreground)', accent: 'var(--sidebar-accent)', 'accent-foreground': 'var(--sidebar-accent-foreground)', border: 'var(--sidebar-border)', ring: 'var(--sidebar-ring)' },
      },
      fontFamily: { sans: ['Inter', 'sans-serif'], display: ["'Source Serif 4'", 'serif'] },
      borderRadius: { lg: 'var(--radius)', md: 'calc(var(--radius) - 2px)', sm: 'calc(var(--radius) - 4px)' },
      keyframes: { 'fade-in-up': { '0%': { opacity: '0', transform: 'translateY(6px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } } },
      animation: { 'fade-in-up': 'fade-in-up 0.35s both' },
    },
  },
  plugins: [],
};
