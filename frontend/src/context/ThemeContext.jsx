import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export const THEMES = [
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
  const [currentTheme, setCurrentTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('chatplay_theme') || 'purple';
    }
    return 'purple';
  });

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', currentTheme);
      localStorage.setItem('chatplay_theme', currentTheme);
    }
  }, [currentTheme]);

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

