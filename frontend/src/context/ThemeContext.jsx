import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ThemeContext = createContext(null);

export const THEMES = [
  {
    id: 'apple-dark',
    name: 'Dark Theme',
    previewColor: '#007aff',
    accent: 'blue',
    description: 'Clean dark mode with OLED black and blue accents',
  },
  {
    id: 'purple',
    name: 'Cyberpunk Violet',
    previewColor: '#7c3aed',
    accent: 'purple',
    description: 'Original neon purple & dark cyber vibe',
  },
  {
    id: 'midnight',
    name: 'Midnight OLED',
    previewColor: '#3b82f6',
    accent: 'blue',
    description: 'Deep pitch black with electric blue glow',
  },
  {
    id: 'emerald',
    name: 'Matrix Emerald',
    previewColor: '#10b981',
    accent: 'emerald',
    description: 'Dark forest with luminous matrix green',
  },
  {
    id: 'sunset',
    name: 'Sunset Ruby',
    previewColor: '#f43f5e',
    accent: 'rose',
    description: 'Vibrant crimson with warm neon accents',
  },
  {
    id: 'ocean',
    name: 'Deep Abyss',
    previewColor: '#06b6d4',
    accent: 'cyan',
    description: 'Underwater deep navy with electric cyan',
  },
];

export const ThemeProvider = ({ children }) => {
  const { pathname } = useLocation();
  const [currentTheme, setCurrentTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('chatplay_theme');
      return THEMES.some((theme) => theme.id === saved) ? saved : 'apple-dark';
    }
    return 'apple-dark';
  });

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const isAuthPage = pathname === '/login' || pathname === '/register';
      document.documentElement.setAttribute('data-theme', isAuthPage ? 'apple-dark' : currentTheme);
      localStorage.setItem('chatplay_theme', currentTheme);
    }
  }, [currentTheme, pathname]);

  const changeTheme = (themeId) => {
    if (THEMES.some((t) => t.id === themeId)) {
      setCurrentTheme(themeId);
    }
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, changeTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
