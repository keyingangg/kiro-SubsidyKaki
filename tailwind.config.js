/** @type {import('tailwindcss').Config} */
const config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        orange: {
          50:  "#FFF3E0",
          100: "#FFE0B2",
          400: "#FFA726",
          500: "#F77F00",
          600: "#E65100",
          700: "#BF360C",
        },
        teal: {
          50:  "#E0F7F5",
          100: "#B2EBE6",
          200: "#80DEDB",
          400: "#26C6DA",
          500: "#00B8A9",
          600: "#00897B",
          700: "#1A7070",
          800: "#135555",
        },
        navy: {
          50:  "#E3EDF7",
          100: "#B9D0E9",
          500: "#1A5490",
          600: "#154278",
          700: "#0F2F5C",
          900: "#091E3A",
        },
        success: {
          50:  "#E6F7F2",
          400: "#2DB887",
          500: "#06A77D",
          600: "#058060",
        },
        danger: {
          50:  "#FDECEA",
          400: "#F05060",
          500: "#E63946",
          600: "#C62828",
        },
        neutral: {
          0:   "#FFFFFF",
          50:  "#F8F9FA",
          100: "#F1F3F4",
          200: "#E8EAED",
          300: "#D0D0D0",
          400: "#9AA0A6",
          500: "#80868B",
          600: "#4A4A4A",
          700: "#3C3C3C",
          900: "#1A1A1A",
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'xs':   ['0.8125rem', { lineHeight: '1.5' }],
        'sm':   ['0.9375rem', { lineHeight: '1.5' }],
        'base': ['1.0625rem', { lineHeight: '1.6' }],
        'lg':   ['1.25rem',   { lineHeight: '1.5' }],
        'xl':   ['1.5rem',    { lineHeight: '1.3' }],
        '2xl':  ['1.75rem',   { lineHeight: '1.2' }],
        '3xl':  ['2.125rem',  { lineHeight: '1.1' }],
      },
      borderRadius: {
        DEFAULT: '10px',
        'lg': '14px',
        'xl': '18px',
        '2xl': '24px',
        'full': '9999px',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.06)',
        'card-md': '0 2px 8px rgba(0,0,0,0.10), 0 8px 24px rgba(0,0,0,0.07)',
        'btn-orange': '0 4px 14px rgba(247,127,0,0.35)',
        'btn-teal': '0 4px 14px rgba(26,112,112,0.35)',
      },
    },
  },
  plugins: [],
}

export default config
