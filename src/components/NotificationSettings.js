import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { F7Icon } from './F7Icon';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const TOGGLES = [
  { key: 'streak_reminders', label: 'Streak Reminders', desc: "Get reminded at 6 PM if you haven't read today" },
  { key: 'milestone_alerts', label: 'Milestone Alerts', desc: 'Celebrate when you hit 7, 30, 50, 100 day streaks' },
  { key: 'daily_news_alerts', label: 'Daily News Alerts', desc: 'Get notified when fresh news drops (coming soon)' },
];

export const NotificationSettings = ({ permission, onRequestPermission }) => {
  const { token } = useTheme();
  const [prefs, setPrefs] = useState({ streak_reminders: true, milestone_alerts: true, daily_news_alerts: true });
  const [loading, setLoading] = useState(true);
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/notifications/settings`, { headers });
        setPrefs(res.data);
      } catch (e) {}
      setLoading(false);
    };
    if (token) fetch();
  }, [token]);

  const toggle = async (key) => {
    const newVal = !prefs[key];
    setPrefs(prev => ({ ...prev, [key]: newVal }));
    try {
      await axios.put(`${BACKEND_URL}/api/notifications/settings`, { [key]: newVal }, { headers });
    } catch (e) {
      setPrefs(prev => ({ ...prev, [key]: !newVal }));
    }
  };

  return (
    <div data-testid="notification-settings" className="overflow-hidden"
      style={{ background: 'var(--surface)', borderRadius: 18 }}>
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center gap-2">
          <F7Icon name="bell_fill" size={16} color="var(--accent)" />
          <p style={{ fontFamily: 'var(--font)', fontSize: 15, fontWeight: 500, color: 'var(--title-color)' }}>
            Notifications
          </p>
        </div>
        {permission !== 'granted' && (
          <button data-testid="enable-notifications-btn" onClick={onRequestPermission}
            className="px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase cursor-pointer"
            style={{ fontFamily: 'var(--font)', background: 'var(--accent)', color: '#fff', border: 'none' }}>
            Enable
          </button>
        )}
      </div>

      {permission === 'denied' && (
        <div className="mx-4 mb-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(255,59,48,0.08)' }}>
          <p style={{ fontFamily: 'var(--font)', fontSize: 12, color: '#FF3B30' }}>
            Notifications blocked. Enable them in your browser settings.
          </p>
        </div>
      )}

      <div className="px-4 pb-3 space-y-1">
        {TOGGLES.map((t) => (
          <button key={t.key} data-testid={`notif-toggle-${t.key}`}
            onClick={() => toggle(t.key)} disabled={loading || permission === 'denied'}
            className="w-full flex items-center justify-between py-3 text-left cursor-pointer"
            style={{ opacity: permission === 'denied' ? 0.4 : 1, background: 'none', border: 'none' }}>
            <div className="flex-1 mr-3">
              <p style={{ fontFamily: 'var(--font)', fontSize: 15, fontWeight: 500, color: 'var(--title-color)' }}>{t.label}</p>
              <p style={{ fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text-color)', marginTop: 2 }}>{t.desc}</p>
            </div>
            <div className="w-11 h-6 rounded-full flex items-center px-0.5 shrink-0"
              style={{ background: prefs[t.key] ? 'var(--accent)' : 'var(--light-gray)', border: prefs[t.key] ? 'none' : '1px solid var(--text-color)' }}>
              <div className="w-5 h-5 rounded-full"
                style={{
                  background: '#fff', transform: prefs[t.key] ? 'translateX(20px)' : 'translateX(0)',
                  transition: 'transform 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                }} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
