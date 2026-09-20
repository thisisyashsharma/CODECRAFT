import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext({
  theme: 'dark',
  setTheme: () => {},
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    try {
      const savedTheme = localStorage.getItem('codecraft-theme');
      if (savedTheme === 'light' || savedTheme === 'dark') {
        return savedTheme;
      }
    } catch (e) {
      // Fallback
    }
    return 'dark'; // Default OLED dark
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('codecraft-theme', theme);
    } catch (e) {}
  }, [theme]);

  const toggleTheme = (event) => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';

    // Check for prefers-reduced-motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // If View Transitions API is not supported or user prefers reduced motion, switch instantly
    if (typeof document === 'undefined' || !document.startViewTransition || prefersReducedMotion) {
      setTheme(nextTheme);
      return;
    }

    // Determine click coordinates (or fallback to screen center)
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;

    if (event) {
      if (typeof event.clientX === 'number' && !isNaN(event.clientX) && event.clientX > 0) {
        x = event.clientX;
        y = event.clientY;
      } else if (event.currentTarget && typeof event.currentTarget.getBoundingClientRect === 'function') {
        const rect = event.currentTarget.getBoundingClientRect();
        x = rect.left + rect.width / 2;
        y = rect.top + rect.height / 2;
      }
    }

    if (isNaN(x) || isNaN(y)) {
      x = window.innerWidth / 2;
      y = window.innerHeight / 2;
    }

    // Calculate maximum radius to all four window corners
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    try {
      const transition = document.startViewTransition(() => {
        setTheme(nextTheme);
      });

      if (transition && transition.ready) {
        transition.ready
          .then(() => {
            document.documentElement.animate(
              {
                clipPath: [
                  `circle(0px at ${x}px ${y}px)`,
                  `circle(${endRadius}px at ${x}px ${y}px)`,
                ],
              },
              {
                duration: 550,
                easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
                pseudoElement: '::view-transition-new(root)',
              }
            );
          })
          .catch(() => {
            // Ignore animation errors on mobile/unsupported engines
          });
      }
    } catch (err) {
      setTheme(nextTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
export default ThemeContext;
