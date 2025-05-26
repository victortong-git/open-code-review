/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // Enable class-based dark mode
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        white: '#ffffff',
        gray: {
          200: '#e5e7eb',
          300: '#d1d5db',
          700: '#374151',
          800: '#1f2937',
        },
        blue: {
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: '100%',
            color: 'inherit',
            a: {
              color: '#2563eb',
              '&:hover': {
                color: '#1d4ed8',
              },
            },
            h1: {
              color: 'inherit',
            },
            h2: {
              color: 'inherit',
            },
            h3: {
              color: 'inherit',
            },
            h4: {
              color: 'inherit',
            },
            code: {
              color: 'inherit',
            },
            blockquote: {
              color: 'inherit',
            },
            strong: {
              color: 'inherit',
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
  safelist: [
    'bg-white', 
    'dark:bg-gray-800',
    'shadow-md',
    'rounded-lg',
    'p-6',
    'p-8',
    'mb-8',
    'divide-y',
    'divide-gray-200',
    'dark:divide-gray-700',
    'bg-gray-200',
    'bg-gray-300',
    'text-gray-800',
    'dark:bg-gray-700',
    'dark:text-white',
    'dark:hover:bg-gray-600',
    'bg-blue-600',
    'bg-blue-700',
    'hover:bg-blue-700',
    'text-white',
    'hover:bg-gray-300'
  ]
}
