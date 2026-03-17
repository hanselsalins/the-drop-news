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

function applyBand(ageGroup) {
  const band = AGE_TO_BAND[ageGroup] || 'cool-connected';
  document.documentElement.setAttribute('data-band', band);
  return band;
}

export function ThemeProvider({ children }) {
  const [token, setTokenState] = useState(() => localStorage.getItem('token') || null);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);
  const [linkedProfiles, setLinkedProfiles] = useState([]);

  const ageGroup = user?.age_group || null;
  const band = ageGroup ? AGE_TO_BAND[ageGroup] || 'cool-connected' : null;
  const themeMode = ageGroup && (ageGroup === '8-10' || ageGroup === '11-13') ? 'kids' : 'teens';
  const isAuthenticated = !!token && !!user;

  const setToken = useCallback((newToken) => {
    setTokenState(newToken);
    if (newToken) {
      localStorage.setItem('token', newToken);
    } else {
      localStorage.removeItem('token');
    }
  }, []);

  const setUserData = useCallback((userData) => {
    setUser(userData);
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
      // Apply band immediately on user data change
      if (userData.age_group) {
        applyBand(userData.age_group);
      }
    } else {
      localStorage.removeItem('user');
      document.documentElement.removeAttribute('data-band');
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUserData(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('ageGroup');
    localStorage.removeItem('userId');
    localStorage.removeItem('hasOnboarded');
    document.documentElement.removeAttribute('data-band');
  }, [setToken, setUserData]);

  const fetchLinkedProfiles = useCallback(async (tkn) => {
    const t = tkn || token;
    if (!t) return;
    try {
      const res = await axios.get(`${BACKEND_URL}/api/auth/linked-profiles`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      const profiles = Array.isArray(res.data) ? res.data : [];
      setLinkedProfiles(profiles);
    } catch (err) {
      console.error('[LinkedProfiles] Fetch error:', err.response?.status);
      setLinkedProfiles([]);
    }
  }, []);

  // Apply band on mount from saved user
  useEffect(() => {
    if (ageGroup) {
      applyBand(ageGroup);
    }
  }, [ageGroup]);

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
          if (res.data.age_group) applyBand(res.data.age_group);
        }
        fetchLinkedProfiles(token);
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
      user, setUserData,
      ageGroup,
      band,
      themeMode,
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
