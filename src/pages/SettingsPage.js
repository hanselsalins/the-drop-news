import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useNotifications } from '../hooks/useNotifications';
import { BottomNav } from '../components/BottomNav';
import { ProfilePanel } from '../components/ProfilePanel';
import { F7Icon } from '../components/F7Icon';
import { MemojiPicker } from '../components/MemojiPicker';
import { getMemoji, getMemojiById } from '../lib/memojis';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const f = 'Rubik, var(--font), sans-serif';

/* ── reusable section header ── */
const SectionHeader = ({ children }) => (
  <p style={{
    fontFamily: f, fontSize: 13, fontWeight: 600, color: 'var(--text-color)',
    textTransform: 'uppercase', letterSpacing: '0.06em', padding: '20px 20px 6px 20px',
  }}>{children}</p>
);

/* ── reusable list group ── */
const ListGroup = ({ children }) => (
  <div style={{ background: 'var(--surface)', borderRadius: 14, margin: '0 15px', overflow: 'hidden' }}>
    {children}
  </div>
);

/* ── reusable row ── */
const Row = ({ label, right, onClick, isLast, testId }) => (
  <button
    data-testid={testId}
    onClick={onClick}
    className="w-full cursor-pointer"
    style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 16px', minHeight: 50,
      borderBottom: isLast ? 'none' : '1px solid var(--light-gray)',
      background: 'none', border: isLast ? 'none' : undefined,
      borderTop: 'none', borderLeft: 'none', borderRight: 'none',
    }}
  >
    <span style={{ fontFamily: f, fontSize: 15, fontWeight: 500, color: 'var(--title-color)' }}>{label}</span>
    <div className="flex items-center gap-1.5">{right}</div>
  </button>
);

/* ── iOS toggle ── */
const Toggle = ({ on, onChange }) => (
  <button onClick={onChange} className="cursor-pointer" style={{ background: 'none', border: 'none', padding: 0 }}>
    <div className="flex items-center" style={{
      width: 44, height: 26, borderRadius: 13, padding: '0 2px',
      background: on ? '#FF6B00' : 'var(--light-gray)',
      transition: 'background 0.2s',
    }}>
      <div style={{
        width: 22, height: 22, borderRadius: 11, background: '#fff',
        transform: on ? 'translateX(18px)' : 'translateX(0)',
        transition: 'transform 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
      }} />
    </div>
  </button>
);

/* ── chevron ── */
const Chevron = () => <F7Icon name="chevron_right" size={16} color="#8896b8" />;

/* ── value + chevron ── */
const ValueChevron = ({ value }) => (
  <>
    <span style={{ fontFamily: f, fontSize: 14, color: 'var(--text-color)', marginRight: 6 }}>{value}</span>
    <Chevron />
  </>
);

/* ── bottom sheet ── */
const BottomSheet = ({ open, onClose, title, children }) => (
  <AnimatePresence>
    {open && (
      <>
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, background: 'hsl(0 0% 10% / 0.78)', zIndex: 999 }}
        />
        <motion.div
          initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000,
            background: 'var(--surface)', borderRadius: '20px 20px 0 0',
            padding: '20px 20px 40px', maxHeight: '80vh', overflowY: 'auto',
          }}
        >
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--light-gray)', margin: '0 auto 16px' }} />
          {title && <p style={{ fontFamily: f, fontSize: 18, fontWeight: 600, color: 'var(--title-color)', marginBottom: 16 }}>{title}</p>}
          {children}
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

const AGE_BAND_NAMES = { '8-10': '8–10', '11-13': '11–13', '14-16': '14–16', '17-20': '17–20' };
const AGE_BAND_DESCRIPTIONS = {
  '8-10': 'Junior Reader — big, bold stories made simple and fun for younger readers.',
  '11-13': 'News Scout — stories written for curious tweens who want to understand the world.',
  '14-16': 'Drop Regular — sharper, deeper coverage for teens ready for real news.',
  '17-20': 'Sharp Mind — editorial-quality journalism for young adults.',
};

const TEXT_SIZES = ['Small', 'Medium', 'Large'];

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, setUserData, token, ageGroup, logout, darkMode, toggleDarkMode, linkedProfiles } = useTheme();
  const { permission, requestPermission } = useNotifications();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  // Notification prefs
  const [notifDaily, setNotifDaily] = useState(() => localStorage.getItem('notif_daily') !== 'false');
  const [notifBreaking, setNotifBreaking] = useState(() => localStorage.getItem('notif_breaking') !== 'false');
  const [notifStreak, setNotifStreak] = useState(() => localStorage.getItem('notif_streak') !== 'false');

  // Text size
  const [textSize, setTextSize] = useState(() => localStorage.getItem('text_size') || 'Medium');
  const [showTextSize, setShowTextSize] = useState(false);

  // Country picker
  const [countries, setCountries] = useState([]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  // Sheets
  const [showAgeBand, setShowAgeBand] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Memoji
  const [showMemojiPicker, setShowMemojiPicker] = useState(false);
  const [selectedMemojiId, setSelectedMemojiId] = useState(() => localStorage.getItem(`memoji_${user?.id || 'default'}`) || null);

  // Profile panel
  const [profilePanelOpen, setProfilePanelOpen] = useState(false);

  useEffect(() => {
    axios.get(`${BACKEND_URL}/api/countries`).then(r => setCountries(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, []);

  const toggleNotif = (key, val, setter) => {
    const next = !val;
    setter(next);
    localStorage.setItem(key, String(next));
  };

  const handleCountrySelect = async (c) => {
    setShowCountryPicker(false);
    try { const res = await axios.put(`${BACKEND_URL}/api/auth/me`, { country: c.country_name }, { headers }); setUserData(res.data); } catch {}
  };

  const handleTextSizeSelect = (size) => {
    setTextSize(size);
    localStorage.setItem('text_size', size);
    setShowTextSize(false);
  };

  const handleLogout = () => { logout(); navigate('/auth'); };

  const handleDeleteAccount = async () => {
    try { await axios.delete(`${BACKEND_URL}/api/auth/me`, { headers }); } catch {}
    logout(); navigate('/auth');
  };

  const showToast = (msg) => {
    // Simple toast — could be upgraded
    const el = document.createElement('div');
    el.textContent = msg;
    Object.assign(el.style, {
      position: 'fixed', bottom: '100px', left: '50%', transform: 'translateX(-50%)',
      background: 'var(--surface)', color: 'var(--title-color)', fontFamily: f,
      fontSize: '13px', padding: '10px 20px', borderRadius: '10px', zIndex: 9999,
      boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
    });
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2500);
  };

  const isParent = user?.account_type === 'parent';
  const filteredCountries = countries.filter(c =>
    c.country_name?.toLowerCase().includes(countrySearch.toLowerCase())
  );

  return (
    <div data-testid="profile-page" className="min-h-screen" style={{ backgroundColor: 'var(--bg)', paddingBottom: 68 }}>

      {/* Page title */}
      <h1 style={{ fontFamily: f, fontSize: 28, fontWeight: 600, color: 'var(--title-color)', padding: '16px 20px 8px 20px', margin: 0 }}>Settings</h1>

      {/* ══════ APPEARANCE ══════ */}
      <SectionHeader>Appearance</SectionHeader>
      <ListGroup>
        <Row label="Dark Mode" isLast={false} right={<Toggle on={darkMode} onChange={toggleDarkMode} />} />
        <Row label="Text Size" isLast right={<ValueChevron value={textSize} />} onClick={() => setShowTextSize(true)} />
      </ListGroup>

      {/* ══════ NOTIFICATIONS ══════ */}
      <SectionHeader>Notifications</SectionHeader>
      <ListGroup>
        <Row label="Daily Drop reminder" isLast={false}
          right={<Toggle on={notifDaily} onChange={() => toggleNotif('notif_daily', notifDaily, setNotifDaily)} />} />
        <Row label="Breaking news alerts" isLast={false}
          right={<Toggle on={notifBreaking} onChange={() => toggleNotif('notif_breaking', notifBreaking, setNotifBreaking)} />} />
        <Row label="Streak reminders" isLast
          right={<Toggle on={notifStreak} onChange={() => toggleNotif('notif_streak', notifStreak, setNotifStreak)} />} />
      </ListGroup>

      {/* ══════ NEWS PREFERENCES ══════ */}
      <SectionHeader>News preferences</SectionHeader>
      <ListGroup>
        <Row label="My Country" isLast={false}
          right={<ValueChevron value={user?.country || 'Not set'} />}
          onClick={() => setShowCountryPicker(true)} />
        <Row label="Language" isLast
          right={<ValueChevron value="English" />}
          onClick={() => showToast('More languages coming soon')} />
      </ListGroup>

      {/* ══════ ACCOUNT ══════ */}
      <SectionHeader>Account</SectionHeader>
      <ListGroup>
        <Row label="Edit Profile" isLast={false} right={<Chevron />} onClick={() => showToast('Coming soon')} />
        <Row label="Change Password" isLast={false} right={<Chevron />} onClick={() => showToast('Coming soon')} />
        <Row label="Change Email" isLast={false} right={<Chevron />} onClick={() => showToast('Coming soon')} />
        <Row label="My Age Band" isLast
          right={<ValueChevron value={AGE_BAND_NAMES[ageGroup] || ageGroup || '—'} />}
          onClick={() => setShowAgeBand(true)} />
      </ListGroup>

      {/* ══════ FAMILY (parent only) ══════ */}
      {isParent && (
        <>
          <SectionHeader>Family</SectionHeader>
          <ListGroup>
            <Row label="Manage Children" isLast={false} right={<Chevron />} onClick={() => showToast('Coming soon')} />
            <Row label="Switch Profile" isLast right={<Chevron />} onClick={() => setProfilePanelOpen(true)} />
          </ListGroup>
        </>
      )}

      {/* ══════ ABOUT ══════ */}
      <SectionHeader>About</SectionHeader>
      <ListGroup>
        <Row label="About The Drop" isLast={false} right={<Chevron />} onClick={() => setShowAbout(true)} />
        <Row label="How It Works" isLast={false} right={<Chevron />} onClick={() => setShowHowItWorks(true)} />
        <Row label="Privacy Policy" isLast={false} right={<Chevron />}
          onClick={() => window.open('https://the-drop-news.lovable.app/privacy', '_blank')} />
        <Row label="Terms of Use" isLast={false} right={<Chevron />}
          onClick={() => window.open('https://the-drop-news.lovable.app/terms', '_blank')} />
        <Row label="Rate the App" isLast right={<Chevron />} onClick={() => showToast('Coming soon')} />
      </ListGroup>

      {/* ══════ SUPPORT ══════ */}
      <SectionHeader>Support</SectionHeader>
      <ListGroup>
        <Row label="Help & FAQ" isLast={false} right={<Chevron />} onClick={() => showToast('Coming soon')} />
        <Row label="Report a Bug" isLast={false} right={<Chevron />}
          onClick={() => window.open('mailto:support@thedrop.news?subject=Bug%20Report', '_self')} />
        <Row label="Contact Us" isLast right={<Chevron />}
          onClick={() => window.open('mailto:hello@thedrop.news', '_self')} />
      </ListGroup>

      {/* ══════ ACCOUNT ACTIONS ══════ */}
      <div style={{ margin: '20px 15px 8px' }}>
        <button onClick={handleLogout} data-testid="logout-btn" className="w-full cursor-pointer"
          style={{
            fontFamily: f, fontSize: 15, fontWeight: 500, height: 44, borderRadius: 22,
            background: 'var(--surface)', color: 'var(--title-color)',
            border: '1px solid var(--light-gray)', marginBottom: 10,
          }}>
          Sign Out
        </button>
        <button onClick={() => setShowDeleteConfirm(true)} data-testid="delete-account-btn" className="w-full cursor-pointer"
          style={{
            fontFamily: f, fontSize: 15, fontWeight: 500, height: 44, borderRadius: 22,
            background: 'transparent', color: '#FF3B30',
            border: '1px solid rgba(255,59,48,0.3)',
          }}>
          Delete Account
        </button>
      </div>

      <div style={{ height: 20 }} />

      {/* ══════ BOTTOM NAV ══════ */}
      <BottomNav active="settings" />

      {/* ══════ SHEETS ══════ */}

      {/* Text Size */}
      <BottomSheet open={showTextSize} onClose={() => setShowTextSize(false)} title="Text Size">
        {TEXT_SIZES.map(size => (
          <button key={size} onClick={() => handleTextSizeSelect(size)} className="w-full cursor-pointer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 0', borderBottom: size !== 'Large' ? '1px solid var(--light-gray)' : 'none',
              background: 'none', border: size !== 'Large' ? undefined : 'none',
              borderTop: 'none', borderLeft: 'none', borderRight: 'none',
            }}>
            <span style={{ fontFamily: f, fontSize: 15, fontWeight: 500, color: 'var(--title-color)' }}>{size}</span>
            {textSize === size && <F7Icon name="checkmark_alt" size={18} color="#FF6B00" />}
          </button>
        ))}
      </BottomSheet>

      {/* Country Picker */}
      <BottomSheet open={showCountryPicker} onClose={() => setShowCountryPicker(false)} title="Select Country">
        <div className="relative mb-3">
          <F7Icon name="search" size={14} color="var(--text-color)" className="absolute left-3 top-1/2 -translate-y-1/2" />
          <input placeholder="Search countries..." value={countrySearch} onChange={e => setCountrySearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm outline-none"
            style={{ fontFamily: f, background: 'var(--bg)', borderRadius: 10, border: 'none', color: 'var(--title-color)' }} />
        </div>
        <div style={{ maxHeight: '50vh', overflowY: 'auto' }}>
          {filteredCountries.map(c => (
            <button key={c.country_code} onClick={() => handleCountrySelect(c)} className="w-full cursor-pointer"
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0',
                borderBottom: '1px solid var(--light-gray)', background: 'none',
                border: 'none', borderBottomStyle: 'solid', borderBottomWidth: 1, borderBottomColor: 'var(--light-gray)',
              }}>
              <span style={{ fontSize: 20 }}>{c.flag_emoji}</span>
              <span style={{ fontFamily: f, fontSize: 15, color: c.country_name === user?.country ? '#FF6B00' : 'var(--title-color)' }}>{c.country_name}</span>
              {c.country_name === user?.country && <F7Icon name="checkmark_alt" size={16} color="#FF6B00" style={{ marginLeft: 'auto' }} />}
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* Age Band Info */}
      <BottomSheet open={showAgeBand} onClose={() => setShowAgeBand(false)} title="Your Age Band">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12, background: '#FF6B00',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: f, fontSize: 18, fontWeight: 700, color: '#fff',
          }}>{AGE_BAND_NAMES[ageGroup] || '—'}</div>
          <div>
            <p style={{ fontFamily: f, fontSize: 17, fontWeight: 600, color: 'var(--title-color)' }}>Ages {AGE_BAND_NAMES[ageGroup] || '—'}</p>
          </div>
        </div>
        <p style={{ fontFamily: f, fontSize: 14, color: 'var(--text-color)', lineHeight: 1.7 }}>
          {AGE_BAND_DESCRIPTIONS[ageGroup] || 'Your content is tailored to your age group.'}
        </p>
        <p style={{ fontFamily: f, fontSize: 12, color: 'var(--text-color)', marginTop: 16, opacity: 0.7 }}>
          Age band is set during sign-up and determines the reading level and content style of your news feed.
        </p>
      </BottomSheet>

      {/* About */}
      <BottomSheet open={showAbout} onClose={() => setShowAbout(false)} title="About The Drop">
        <p style={{ fontFamily: f, fontSize: 14, color: 'var(--text-color)', lineHeight: 1.7 }}>
          The Drop is a daily news app built for young readers. We take the world's biggest stories and rewrite them for different age groups — making news accessible, engaging and age-appropriate.
        </p>
        <p style={{ fontFamily: f, fontSize: 14, color: 'var(--text-color)', lineHeight: 1.7, marginTop: 12 }}>
          Every morning, our AI-powered editorial system curates, rewrites and delivers fresh stories tailored to your reading level.
        </p>
        <p style={{ fontFamily: f, fontSize: 12, color: 'var(--text-color)', marginTop: 16, opacity: 0.5 }}>Version 1.0.0</p>
      </BottomSheet>

      {/* How It Works */}
      <BottomSheet open={showHowItWorks} onClose={() => setShowHowItWorks(false)} title="How It Works">
        {[
          { icon: 'globe', title: 'We scan the world', desc: 'Our system monitors thousands of news sources every day.' },
          { icon: 'pencil', title: 'We rewrite for you', desc: 'Stories are rewritten at the right reading level for your age band.' },
          { icon: 'bell_fill', title: 'You get The Drop', desc: 'Fresh stories drop every morning — read, react and build your streak.' },
        ].map((step, i) => (
          <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 18 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10, background: 'rgba(255,107,0,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <F7Icon name={step.icon} size={18} color="#FF6B00" />
            </div>
            <div>
              <p style={{ fontFamily: f, fontSize: 15, fontWeight: 600, color: 'var(--title-color)', marginBottom: 2 }}>{step.title}</p>
              <p style={{ fontFamily: f, fontSize: 13, color: 'var(--text-color)', lineHeight: 1.5 }}>{step.desc}</p>
            </div>
          </div>
        ))}
      </BottomSheet>

      {/* Delete Confirm */}
      <BottomSheet open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Delete Account?">
        <p style={{ fontFamily: f, fontSize: 14, color: 'var(--text-color)', lineHeight: 1.7, marginBottom: 20 }}>
          Are you sure? This cannot be undone. All your data, streak and reading history will be permanently deleted.
        </p>
        <div className="flex gap-3">
          <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 cursor-pointer"
            style={{
              fontFamily: f, fontSize: 15, fontWeight: 500, height: 44, borderRadius: 22,
              background: 'var(--light-gray)', color: 'var(--title-color)', border: 'none',
            }}>Cancel</button>
          <button onClick={handleDeleteAccount} className="flex-1 cursor-pointer"
            style={{
              fontFamily: f, fontSize: 15, fontWeight: 500, height: 44, borderRadius: 22,
              background: '#FF3B30', color: '#fff', border: 'none',
            }}>Delete</button>
        </div>
      </BottomSheet>

      {/* Profile Panel */}
      <ProfilePanel open={profilePanelOpen} onClose={() => setProfilePanelOpen(false)} />

      {/* Memoji Picker */}
      {showMemojiPicker && (
        <MemojiPicker
          currentId={selectedMemojiId}
          onSelect={(id) => {
            setSelectedMemojiId(id);
            localStorage.setItem(`memoji_${user?.id || 'default'}`, id);
            setShowMemojiPicker(false);
          }}
          onClose={() => setShowMemojiPicker(false)}
        />
      )}
    </div>
  );
}
