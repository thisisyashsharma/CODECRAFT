/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        titanium: {
          dark: '#0f0f0f',
          deep: '#0c0c0c',
          card: '#141414',
          cardElevated: '#161616',
          cardHover: '#1a1a1a',
          pill: '#1f1f1f',
          pillBorder: '#282828',
          pillHover: '#2a2a2a',
          borderFrost: 'rgba(255, 255, 255, 0.1)',
          borderSubtle: 'rgba(255, 255, 255, 0.06)',
          lightBg: '#ffffff',
          lightTint: '#f9fafb',
          lightPill: '#f3f4f6',
          lightPillHover: '#e5e7eb',
          lightBorder: '#e5e7eb',
          royalBlue: '#2563eb',
          royalBlueHover: '#1d4ed8',
          crimsonRed: '#ef4444',
          crimsonRedHover: '#dc2626',
          emeraldBeacon: '#10b981',
          amberSolar: '#f59e0b',
        },
      },
      transitionTimingFunction: {
        'golden': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      transitionDuration: {
        'golden': '400ms',
        'ripple': '550ms',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        searchBeam: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        slideFadeUp: {
          'from': { opacity: '0', transform: 'translateY(8px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        vtPopAndFloat: {
          '0%': { transform: 'scale(0.6) translateY(4px)', opacity: '0' },
          '25%': { transform: 'scale(1.1) translateY(-2px)', opacity: '1' },
          '60%': { transform: 'scale(1) translateY(-8px)', opacity: '1' },
          '100%': { transform: 'scale(0.9) translateY(-18px)', opacity: '0' },
        },
        vtThumbKick: {
          '0%': { transform: 'translateY(0) rotate(0deg)' },
          '25%': { transform: 'translateY(-3px) rotate(-16deg)' },
          '60%': { transform: 'translateY(1px) rotate(4deg)' },
          '100%': { transform: 'translateY(0) rotate(0deg)' },
        },
        borderBeam: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        textShimmer: {
          '0%': { backgroundPosition: '200% center' },
          '100%': { backgroundPosition: '-200% center' },
        },
      },
      animation: {
        'shimmer': 'shimmer 2s infinite ease-in-out',
        'search-beam': 'searchBeam 1.5s infinite linear',
        'slide-fade-up': 'slideFadeUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'pop-float': 'vtPopAndFloat 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'thumb-kick': 'vtThumbKick 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'border-beam': 'borderBeam 4s linear infinite',
        'text-shimmer': 'textShimmer 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
