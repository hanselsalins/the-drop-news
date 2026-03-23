import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { F7Icon } from './F7Icon';
import { ProfileSwitcherModal } from './ProfileSwitcherModal';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export const ProfilePanel = ({ open, onClose }) => {
  const navigate = useNavigate();
  const { user, token, logout, linkedProfiles: ctxLinkedProfiles, fetchLinkedProfiles, parentToken, darkMode, toggleDarkMode } = useTheme();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const [streak, setStreak] = useState({ current_streak: 0 });
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showSwitcher, setShowSwitcher] = useState(false);

  const isChildAccount = user?.account_type === 'child';
  const hasLinkedProfiles = (ctxLinkedProfiles || []).length > 0;
  const showSwitchButton = isChildAccount || hasLinkedProfiles;
  const isSelfAccount = user?.account_type === 'self' || user?.account_type === 'independent';

  const fetchData = useCallback(async () => {
    if (!token) return;
    try { const r = await axios.get(`${BACKEND_URL}/api/streak`, { headers }); setStreak(r.data); } catch {}
    fetchLinkedProfiles();
  }, [token, fetchLinkedProfiles]);

  useEffect(() => {
    if (open) { fetchData(); setShowSwitcher(false); setShowChangePassword(false); setPasswordForm({ current: '', new: '', confirm: '' }); setPasswordError(''); setPasswordSuccess(false); }
  }, [open, fetchData]);

  const handleChangePassword = async () => {
    setPasswordError('');
    if (passwordForm.new !== passwordForm.confirm) { setPasswordError('Passwords do not match'); return; }
    if (passwordForm.new.length < 6) { setPasswordError('Min 6 characters'); return; }
    try {
      await axios.post(`${BACKEND_URL}/api/auth/change-password`, { current_password: passwordForm.current, new_password: passwordForm.new }, { headers });
      setPasswordSuccess(true);
      setTimeout(() => { setShowChangePassword(false); setPasswordSuccess(false); }, 2000);
    } catch (e) { setPasswordError(e.response?.data?.error || 'Failed'); }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try { await axios.delete(`${BACKEND_URL}/api/auth/account`, { headers }); logout(); navigate('/auth'); } catch {}
    setDeleting(false);
  };

  const handleLogout = () => { logout(); onClose(); navigate('/auth'); };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 z-[60]" style={{ background: 'var(--overlay-backdrop)' }} />
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 z-[70] overflow-y-auto"
            style={{ width: 'min(360px, 85vw)', background: 'var(--surface)', boxShadow: 'none', borderLeft: '1px solid var(--light-gray)' }}>

            <div className="flex justify-end p-4">
              <button onClick={onClose} className="p-2 cursor-pointer" style={{ background: 'var(--light-gray)', borderRadius: 10, border: 'none' }}>
                <F7Icon name="xmark" size={18} color="var(--text-color)" />
              </button>
            </div>

            {/* Avatar + name */}
            <div className="flex flex-col items-center px-6 pb-5">
              <div style={{ width: 55, height: 55, borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--accent)' }}>
                {user?.avatar_url ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--surface)', color: 'var(--accent)', fontFamily: 'var(--font)', fontSize: 24, fontWeight: 700 }}>{user?.full_name?.charAt(0)?.toUpperCase() || 'U'}</div>}
              </div>
              <h2 style={{ fontFamily: 'var(--font)', fontSize: 15, fontWeight: 500, color: 'var(--title-color)', marginTop: 12 }}>{user?.full_name}</h2>
              {user?.username && <p style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 400, color: 'var(--text-color)', marginTop: 2 }}>@{user.username}</p>}
            </div>

            {/* Settings toggles */}
            <div style={{ margin: '0 15px', background: 'var(--surface)', borderRadius: 18, overflow: 'hidden', marginBottom: 15, border: '1px solid var(--light-gray)' }}>
              <div className="flex items-center justify-between" style={{ padding: '14px 15px', borderBottom: '1px solid var(--light-gray)' }}>
                <span style={{ fontFamily: 'var(--font)', fontSize: 15, fontWeight: 500, color: 'var(--title-color)' }}>Dark Mode</span>
                <button onClick={toggleDarkMode} className="w-11 h-6 rounded-full flex items-center px-0.5 cursor-pointer"
                  style={{ background: darkMode ? 'var(--accent)' : 'var(--light-gray)', border: 'none' }}>
                  <div className="w-5 h-5 rounded-full" style={{ background: '#fff', transform: darkMode ? 'translateX(20px)' : 'translateX(0)', transition: 'transform 0.2s', boxShadow: 'none' }} />
                </button>
              </div>
            </div>

            {/* Switch Profile */}
            {!isSelfAccount && showSwitchButton && (
              <div style={{ margin: '0 15px 15px' }}>
                <button onClick={() => setShowSwitcher(true)}
                  className="w-full flex items-center gap-3 py-3 px-4 cursor-pointer"
                  style={{ background: 'var(--surface)', borderRadius: 18, border: '1px solid var(--light-gray)' }}>
                  <F7Icon name="person_2_fill" size={20} color="var(--accent)" />
                  <span className="flex-1 text-left" style={{ fontFamily: 'var(--font)', fontSize: 15, fontWeight: 500, color: 'var(--title-color)' }}>Switch Profile</span>
                  <F7Icon name="chevron_right" size={16} color="#8896b8" />
                </button>
              </div>
            )}

            <ProfileSwitcherModal open={showSwitcher} onClose={() => setShowSwitcher(false)} onPanelClose={onClose} />

            {/* Account section */}
            <div style={{ margin: '0 15px 15px' }}>
              <p style={{ fontFamily: 'var(--font)', fontSize: 18, fontWeight: 600, color: 'var(--title-color)', marginBottom: 8, marginTop: 25 }}>Account</p>
              <div style={{ background: 'var(--surface)', borderRadius: 18, overflow: 'hidden', border: '1px solid var(--light-gray)' }}>
                <button onClick={() => setShowChangePassword(!showChangePassword)}
                  className="w-full flex items-center justify-between cursor-pointer"
                  style={{ padding: '14px 15px', height: 50, background: 'none', border: 'none', borderBottom: '1px solid var(--light-gray)' }}>
                  <span style={{ fontFamily: 'var(--font)', fontSize: 15, fontWeight: 500, color: 'var(--title-color)' }}>Change Password</span>
                  <F7Icon name="chevron_right" size={16} color="#8896b8" />
                </button>
                <button onClick={() => navigate('/profile')}
                  className="w-full flex items-center justify-between cursor-pointer"
                  style={{ padding: '14px 15px', height: 50, background: 'none', border: 'none' }}>
                  <span style={{ fontFamily: 'var(--font)', fontSize: 15, fontWeight: 500, color: 'var(--title-color)' }}>Edit Account</span>
                  <F7Icon name="chevron_right" size={16} color="#8896b8" />
                </button>
              </div>
            </div>

            <AnimatePresence>
              {showChangePassword && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden" style={{ margin: '0 15px 15px' }}>
                  <div className="space-y-3 p-4" style={{ background: 'var(--surface)', borderRadius: 18, border: '1px solid var(--light-gray)' }}>
                    <input type="password" placeholder="Current password" value={passwordForm.current} onChange={e => setPasswordForm({ ...passwordForm, current: e.target.value })}
                      className="w-full px-3 py-2.5 text-sm outline-none" style={{ background: 'var(--light-gray)', borderRadius: 10, border: 'none', fontFamily: 'var(--font)', color: 'var(--title-color)' }} />
                    <input type="password" placeholder="New password" value={passwordForm.new} onChange={e => setPasswordForm({ ...passwordForm, new: e.target.value })}
                      className="w-full px-3 py-2.5 text-sm outline-none" style={{ background: 'var(--light-gray)', borderRadius: 10, border: 'none', fontFamily: 'var(--font)', color: 'var(--title-color)' }} />
                    <input type="password" placeholder="Confirm new password" value={passwordForm.confirm} onChange={e => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                      className="w-full px-3 py-2.5 text-sm outline-none" style={{ background: 'var(--light-gray)', borderRadius: 10, border: 'none', fontFamily: 'var(--font)', color: 'var(--title-color)' }} />
                    {passwordError && <p style={{ fontFamily: 'var(--font)', fontSize: 12, color: '#FF3B30' }}>{passwordError}</p>}
                    {passwordSuccess && <p style={{ fontFamily: 'var(--font)', fontSize: 12, color: '#34C759' }}>Password changed!</p>}
                    <button onClick={handleChangePassword} className="w-full py-2.5 cursor-pointer"
                      style={{ fontFamily: 'var(--font)', fontSize: 14, fontWeight: 500, height: 44, borderRadius: 10, background: 'var(--accent)', color: '#FFFFFF', border: 'none' }}>
                      Update Password
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Log out */}
            <div style={{ margin: '25px 15px 15px' }}>
              <button onClick={handleLogout} className="w-full cursor-pointer"
                style={{ fontFamily: 'var(--font)', fontSize: 14, fontWeight: 500, height: 44, borderRadius: 10, background: 'var(--light-gray)', color: '#FF3B30', border: 'none' }}>
                Log Out
              </button>
            </div>

            <div style={{ height: 32 }} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
