import React, { createContext, useContext, useState, useEffect } from 'react';

type FontSize = 'small' | 'medium' | 'large' | 'extra-large';

interface AccessibilityContextType {
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  highContrast: boolean;
  setHighContrast: (enabled: boolean) => void;
  screenReaderOptimized: boolean;
  setScreenReaderOptimized: (enabled: boolean) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [fontSize, setFontSizeState] = useState<FontSize>(() => {
    return (localStorage.getItem('ez-font-size') as FontSize) || 'medium';
  });
  const [highContrast, setHighContrastState] = useState(() => {
    return localStorage.getItem('ez-high-contrast') === 'true';
  });
  const [screenReaderOptimized, setScreenReaderOptimizedState] = useState(() => {
    return localStorage.getItem('ez-screen-reader') === 'true';
  });

  const setFontSize = (size: FontSize) => {
    setFontSizeState(size);
    localStorage.setItem('ez-font-size', size);
  };

  const setHighContrast = (enabled: boolean) => {
    setHighContrastState(enabled);
    localStorage.setItem('ez-high-contrast', String(enabled));
  };

  const setScreenReaderOptimized = (enabled: boolean) => {
    setScreenReaderOptimizedState(enabled);
    localStorage.setItem('ez-screen-reader', String(enabled));
  };

  useEffect(() => {
    const root = document.documentElement;
    const sizes: Record<FontSize, string> = {
      'small': '14px',
      'medium': '16px',
      'large': '18px',
      'extra-large': '20px'
    };
    root.style.setProperty('--base-font-size', sizes[fontSize]);
    
    if (highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
  }, [fontSize, highContrast]);

  return (
    <AccessibilityContext.Provider value={{ 
      fontSize, 
      setFontSize, 
      highContrast, 
      setHighContrast,
      screenReaderOptimized,
      setScreenReaderOptimized
    }}>
      <div className={`accessibility-root font-size-${fontSize}`}>
        {children}
      </div>
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};
