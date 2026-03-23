import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const ThemeContext = createContext();

const AGE_GROUPS = [
  { id: '8-10', label: 'Ages 8-10', sublabel: 'Kid Mode', theme: 'kids', emoji: '🎮' },
  { id: '11-13', label: 'Ages 11-13', sublabel: 'Tween Mode', theme: 'kids', emoji: '🎯' },
  { id: '14-16', label: 'Ages 14-16', sublabel: 'Teen Mode', theme: 'teens', emoji: '🔥' },
  { id: '17-20', label: 'Ages 17-20', sublabel: 'Young Adult', theme: 'teens', emoji: '💫' },
];

const AGE_TO_BAND = {
  '8-10': 'big-bold-bright',
  '11-13': 'cool-connected',
  '14-16': 'sharp-aware',
  '17-20': 'editorial',
};

const LIGHT_THEME = {
  bg: '#ffffff',
  surface: '#ffffff',
  titleColor: '#1e2b47',
  textColor: '#828d9c',
  lightGray: '#ecf1f5',
  blockShadow: '0px 2px 10px 0px rgba(85,95,105,0.13)',
};

const DARK_THEME = {
  bg: '#393a3b',
  surface: '#302f30',
  lightGray: '#28292a',
  titleColor: '#f1f0ef',
  textColor: '#c1c1c1',
  blockShadow: 'none',
  headerBg: '#282a2b',
  toolbarBg: '#28292a',
  toolbarIconColor: '#c4c4c5',
};

function applyThemeVariables(theme) {
  const root = document.documentElement;
  const appRoot = document.getElementById('root');

  root.style.setProperty('--bg', theme.bg);
  root.style.setProperty('--surface', theme.surface);
  root.style.setProperty('--title-color', theme.titleColor);
  root.style.setProperty('--text-color', theme.textColor);
  root.style.setProperty('--light-gray', theme.lightGray);
  root.style.setProperty('--block-shadow', theme.blockShadow);
  root.style.setProperty('--header-bg', theme.headerBg || theme.bg);
  root.style.setProperty('--toolbar-bg', theme.toolbarBg || theme.bg);
  root.style.setProperty('--toolbar-icon', theme.toolbarIconColor || theme.textColor);

  root.style.background = theme.bg;
  root.style.backgroundColor = theme.bg;
  document.body.style.background = theme.bg;
  document.body.style.backgroundColor = theme.bg;
  document.body.style.color = theme.titleColor;

  if (appRoot) {
    appRoot.style.background = theme.bg;
    appRoot.style.backgroundColor = theme.bg;
    appRoot.style.color = theme.titleColor;
    appRoot.style.minHeight = '100vh';
  }
}

function applyBand(ageGroup, darkMode = false) {
  const band = AGE_TO_BAND[ageGroup] || 'cool-connected';
  document.documentElement.setAttribute('data-band', band);
  if (darkMode) {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
  return band;
}

function applyDarkMode(darkMode) {
  if (darkMode) {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.style.colorScheme = 'dark';
    document.documentElement.style.setProperty('background-color', '#1A1A1A');
    document.body.style.setProperty('background-color', '#1A1A1A');
    applyThemeVariables(DARK_THEME);
  } else {
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.style.colorScheme = 'light';
    document.documentElement.style.setProperty('background-color', '#ffffff');
    document.body.style.setProperty('background-color', '#ffffff');
    applyThemeVariables(LIGHT_THEME);
  }
}

export function ThemeProvider({ children }) {
  const [token, setTokenState] = useState(() => localStorage.getItem('token') || null);
  const [parentToken, setParentTokenState] = useState(() => localStorage.getItem('parent_token') || null);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);
  const [linkedProfiles, setLinkedProfiles] = useState([]);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved === null ? false : saved === 'true';
  });

  const ageGroup = user?.age_group || null;
  const band = ageGroup ? AGE_TO_BAND[ageGroup] || 'cool-connected' : null;
  const themeMode = ageGroup && (ageGroup === '8-10' || ageGroup === '11-13') ? 'kids' : 'teens';
  const isAuthenticated = !!token && !!user;

  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('darkMode', String(next));
      if (ageGroup) applyBand(ageGroup, next);
      applyDarkMode(next);
      return next;
    });
  }, [ageGroup]);

  const setToken = useCallback((newToken) => {
    setTokenState(newToken);
    if (newToken) {
      localStorage.setItem('token', newToken);
    } else {
      localStorage.removeItem('token');
    }
  }, []);

  const setParentToken = useCallback((newToken) => {
    setParentTokenState(newToken);
    if (newToken) {
      localStorage.setItem('parent_token', newToken);
    } else {
      localStorage.removeItem('parent_token');
    }
  }, []);

  const setUserData = useCallback((userData) => {
    setUser(userData);
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
      if (userData.age_group) {
        applyBand(userData.age_group, darkMode);
      }
    } else {
      localStorage.removeItem('user');
      document.documentElement.removeAttribute('data-band');
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setParentToken(null);
    setUserData(null);
    localStorage.removeItem('token');
    localStorage.removeItem('parent_token');
    localStorage.removeItem('user');
    localStorage.removeItem('ageGroup');
    localStorage.removeItem('userId');
    localStorage.removeItem('hasOnboarded');
    document.documentElement.removeAttribute('data-band');
  }, [setToken, setParentToken, setUserData]);

  const fetchLinkedProfiles = useCallback(async (tkn) => {
    const t = tkn || parentToken || token;
    if (!t) return;
    try {
      console.log('[ThemeContext] Fetching linked-profiles...');
      const res = await axios.get(`${BACKEND_URL}/api/auth/linked-profiles`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      console.log('[ThemeContext] linked-profiles raw:', JSON.stringify(res.data));
      let profiles = [];
      if (Array.isArray(res.data)) {
        profiles = res.data;
      } else if (Array.isArray(res.data?.profiles)) {
        profiles = res.data.profiles;
      }
      console.log('[ThemeContext] Parsed profiles count:', profiles.length);
      setLinkedProfiles(profiles);
    } catch (err) {
      console.error('[ThemeContext] LinkedProfiles fetch error:', err.response?.status, err.message);
      setLinkedProfiles([]);
    }
  }, [parentToken, token]);

  // Apply band + dark mode on mount from saved user
  useEffect(() => {
    applyDarkMode(darkMode);
    if (ageGroup) {
      applyBand(ageGroup, darkMode);
    }
  }, [ageGroup, darkMode]);

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get(`${BACKEND_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
        if (res.data) {
          localStorage.setItem('user', JSON.stringify(res.data));
          if (res.data.age_group) applyBand(res.data.age_group, darkMode);
        }
        fetchLinkedProfiles(parentToken || token);
      } catch (e) {
        logout();
      }
      setLoading(false);
    };
    verifyToken();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ThemeContext.Provider value={{
      token, setToken,
      parentToken, setParentToken,
      user, setUserData,
      ageGroup,
      band,
      themeMode,
      darkMode,
      toggleDarkMode,
      isAuthenticated,
      loading,
      logout,
      AGE_GROUPS,
      linkedProfiles,
      fetchLinkedProfiles,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
