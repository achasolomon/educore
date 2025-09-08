/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Orange-themed color system
      colors: {
        // Primary Orange Palette
        primary: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316', // Main brand color
          600: '#ea580c', // Hover states
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
        },
        
        // Secondary colors for school context
        secondary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        
        // Academic status colors
        academic: {
          excellent: '#10b981', // Green for A grades
          good: '#3b82f6',      // Blue for B grades  
          average: '#f59e0b',   // Yellow for C grades
          poor: '#ef4444',      // Red for failing grades
          absent: '#6b7280',    // Gray for absent
        },
        
        // Semantic colors
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        
        // Neutral grays
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0a0a0a',
        },
        
        // Background colors
        background: {
          primary: '#ffffff',
          secondary: '#fafafa',
          tertiary: '#f5f5f5',
        },
        
        // Border colors
        border: {
          light: '#e5e5e5',
          medium: '#d4d4d4',
          dark: '#a3a3a3',
        }
      },
      
      // Typography
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
      },
      
      // Spacing system
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      
      // Border radius
      borderRadius: {
        'none': '0',
        'sm': '0.375rem',
        'DEFAULT': '0.5rem',
        'md': '0.5rem',
        'lg': '0.75rem',
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      
      // Box shadows with orange tints
      boxShadow: {
        'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'DEFAULT': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
        'inner': 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
        
        // Orange-tinted shadows for branded elements
        'orange': '0 4px 14px 0 rgb(249 115 22 / 0.15)',
        'orange-md': '0 8px 25px 0 rgb(249 115 22 / 0.15)',
        'orange-lg': '0 12px 40px 0 rgb(249 115 22 / 0.15)',
        
        // Colored shadows for status
        'success': '0 4px 14px 0 rgb(34 197 94 / 0.15)',
        'error': '0 4px 14px 0 rgb(239 68 68 / 0.15)',
        'warning': '0 4px 14px 0 rgb(245 158 11 / 0.15)',
      },
      
      // Animation and transitions
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'bounce-gentle': 'bounceGentle 2s infinite',
        'pulse-orange': 'pulseOrange 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        pulseOrange: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '.7' },
        }
      },
      
      // Backdrop blur
      backdropBlur: {
        'xs': '2px',
        'sm': '4px',
        'md': '8px',
        'lg': '16px',
        'xl': '24px',
        '2xl': '40px',
        '3xl': '64px',
      },
      
      // Z-index scale
      zIndex: {
        'dropdown': '1000',
        'sticky': '1020',
        'fixed': '1030',
        'modal-backdrop': '1040',
        'modal': '1050',
        'popover': '1060',
        'tooltip': '1070',
      },
      
      // Screen breakpoints
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        '3xl': '1920px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
    
    // Custom plugin for school-specific utilities
    function({ addUtilities, addComponents, theme }) {
      // Grade color utilities
      addUtilities({
        '.grade-excellent': {
          backgroundColor: theme('colors.academic.excellent'),
          color: 'white',
        },
        '.grade-good': {
          backgroundColor: theme('colors.academic.good'),
          color: 'white',
        },
        '.grade-average': {
          backgroundColor: theme('colors.academic.average'),
          color: 'white',
        },
        '.grade-poor': {
          backgroundColor: theme('colors.academic.poor'),
          color: 'white',
        },
        '.status-present': {
          backgroundColor: theme('colors.success.100'),
          color: theme('colors.success.800'),
        },
        '.status-absent': {
          backgroundColor: theme('colors.error.100'),
          color: theme('colors.error.800'),
        },
        '.status-late': {
          backgroundColor: theme('colors.warning.100'),
          color: theme('colors.warning.800'),
        },
      });
      
      // Card components
      addComponents({
        '.card': {
          backgroundColor: theme('colors.white'),
          borderRadius: theme('borderRadius.lg'),
          padding: theme('spacing.6'),
          boxShadow: theme('boxShadow.md'),
          border: `1px solid ${theme('colors.border.light')}`,
        },
        '.card-hover': {
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: theme('boxShadow.lg'),
          },
        },
        '.btn-primary': {
          backgroundColor: theme('colors.primary.500'),
          color: 'white',
          padding: `${theme('spacing.2')} ${theme('spacing.4')}`,
          borderRadius: theme('borderRadius.md'),
          fontWeight: theme('fontWeight.medium'),
          transition: 'all 0.2s ease-in-out',
          border: 'none',
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: theme('colors.primary.600'),
            transform: 'translateY(-1px)',
            boxShadow: theme('boxShadow.orange'),
          },
          '&:focus': {
            outline: 'none',
            ring: `2px solid ${theme('colors.primary.500')}`,
            ringOffset: '2px',
          },
          '&:disabled': {
            backgroundColor: theme('colors.neutral.300'),
            cursor: 'not-allowed',
            transform: 'none',
            boxShadow: 'none',
          },
        },
      });
    },
  ],
}