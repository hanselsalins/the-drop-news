import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Flame, ChevronRight, LogOut, Trash2, Lock, Eye, EyeOff, Users, Moon, Sun } from 'lucide-react';
import { ProfileSwitcherModal } from './ProfileSwitcherModal';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export const ProfilePanel = ({ open, onClose }) => {
  const navigate = useNavigate();
  const { user, token, ageGroup, band, logout, linkedProfiles: ctxLinkedProfiles, fetchLinkedProfiles, parentToken, darkMode, toggleDarkMode } = useTheme();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const isDark = band === 'sharp-aware' || band === 'editorial';

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
    try {
      const streakRes = await axios.get(`${BACKEND_URL}/api/streak`, { headers }).catch(() => ({ data: { current_streak: 0 } }));
      setStreak(streakRes.data);
    } catch {}
    fetchLinkedProfiles();
  }, [token, fetchLinkedProfiles]);

  useEffect(() => {
    if (open) {
      fetchData();
      setShowSwitcher(false);
      setShowChangePassword(false);
      setPasswordForm({ current: '', new: '', confirm: '' });
      setPasswordError('');
      setPasswordSuccess(false);
    }
  }, [open, fetchData]);

  const handleChangePassword = async () => {
    setPasswordError('');
    if (passwordForm.new !== passwordForm.confirm) { setPasswordError('Passwords do not match'); return; }
    if (passwordForm.new.length < 6) { setPasswordError('Password must be at least 6 characters'); return; }
    try {
      await axios.post(`${BACKEND_URL}/api/auth/change-password`, {
        current_password: passwordForm.current, new_password: passwordForm.new,
      }, { headers });
      setPasswordSuccess(true);
      setTimeout(() => { setShowChangePassword(false); setPasswordSuccess(false); }, 2000);
    } catch (e) {
      setPasswordError(e.response?.data?.error || 'Failed to change password');
    }
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
            onClick={onClose} className="fixed inset-0 z-[60]"
            style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }} />

          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 z-[70] overflow-y-auto"
            style={{ width: 'min(360px, 85vw)', background: 'var(--drop-surface)', boxShadow: '-8px 0 40px rgba(0,0,0,0.12)' }}
          >
            <div className="flex justify-end p-4">
              <button onClick={onClose} className="p-2 rounded-xl"
                style={{ background: 'color-mix(in srgb, var(--drop-text-muted) 10%, transparent)' }}>
                <X size={18} style={{ color: 'var(--drop-text-muted)' }} />
              </button>
            </div>

            {/* Avatar */}
            <div className="flex flex-col items-center px-6 pb-5">
              <div style={{ width: 80, height: 80, borderRadius: '50%', padding: 3, background: 'var(--drop-header-bg, var(--drop-primary))' }}>
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden' }}>
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"
                      style={{ background: 'var(--drop-primary)', color: '#FFFFFF', fontFamily: 'var(--drop-font-heading)', fontSize: 32, fontWeight: 700 }}>
                      {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
              </div>

              <h2 className="mt-3 text-xl font-bold text-center"
                style={{ fontFamily: 'var(--drop-font-heading)', color: 'var(--drop-text)' }}>
                {user?.full_name}
              </h2>
              {user?.username && (
                <p className="text-sm mt-0.5" style={{ fontFamily: 'var(--drop-font-body)', color: 'var(--drop-text-muted)' }}>
                  @{user.username}
                </p>
              )}

              <div className="flex items-center gap-2 mt-3">
                <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full"
                  style={{ fontFamily: 'var(--drop-font-body)', background: 'color-mix(in srgb, var(--drop-primary) 10%, transparent)', color: 'var(--drop-primary)' }}>
                  {ageGroup === '8-10' ? 'Junior Reader' : ageGroup === '11-13' ? 'News Scout' : ageGroup === '17-20' ? 'Sharp Mind' : 'Drop Regular'}
                </span>
              </div>

              <div className="flex items-center gap-2 mt-4 px-4 py-2 rounded-full"
                style={{ background: 'color-mix(in srgb, var(--drop-accent2, #F59E0B) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--drop-accent2, #F59E0B) 20%, transparent)' }}>
                <Flame size={18} style={{ color: 'var(--drop-accent2, #F59E0B)' }} fill="currentColor" />
                <span className="text-sm font-bold" style={{ fontFamily: 'var(--drop-font-heading)', color: 'var(--drop-accent2, #F59E0B)' }}>
                  {streak.current_streak} day streak
                </span>
              </div>
            </div>

            {/* Dark Mode Toggle — only for Bands 1 & 2 */}
            {(band === 'big-bold-bright' || band === 'cool-connected') && (
              <div className="px-6 py-3">
                <button onClick={toggleDarkMode} className="w-full flex items-center gap-3 py-2.5 px-4 rounded-2xl transition-colors"
                  style={{ background: 'color-mix(in srgb, var(--drop-text-muted) 8%, transparent)', border: '1px solid var(--drop-border)' }}>
                  {darkMode ? <Sun size={18} style={{ color: 'var(--drop-accent2, #F59E0B)' }} /> : <Moon size={18} style={{ color: 'var(--drop-text-muted)' }} />}
                  <span className="flex-1 text-left text-sm font-medium" style={{ fontFamily: 'var(--drop-font-body)', color: 'var(--drop-text)' }}>
                    {darkMode ? 'Light Mode' : 'Dark Mode'}
                  </span>
                </button>
              </div>
            )}

            <div style={{ height: 1, background: 'var(--drop-border)', margin: '0 24px' }} />

            {/* Switch Profile */}
            {!isSelfAccount && showSwitchButton && (
              <div className="px-6 py-4">
                <button onClick={() => setShowSwitcher(true)}
                  className="w-full flex items-center gap-3 py-2.5 px-4 rounded-2xl transition-colors"
                  style={{ background: 'color-mix(in srgb, var(--drop-primary) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--drop-primary) 20%, transparent)' }}>
                  <Users size={20} style={{ color: 'var(--drop-primary)' }} />
                  <span className="flex-1 text-left text-sm font-bold" style={{ fontFamily: 'var(--drop-font-body)', color: 'var(--drop-text)' }}>
                    Switch Profile
                  </span>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{ background: 'color-mix(in srgb, var(--drop-text-muted) 10%, transparent)', color: 'var(--drop-text-muted)', fontFamily: 'var(--drop-font-body)' }}>
                    {(ctxLinkedProfiles || []).length} profiles
                  </span>
                  <ChevronRight size={16} style={{ color: 'var(--drop-text-muted)' }} />
                </button>
              </div>
            )}

            <ProfileSwitcherModal open={showSwitcher} onClose={() => setShowSwitcher(false)} onPanelClose={onClose} />

            {/* Change Password */}
            <div className="px-6 py-4">
              <button onClick={() => setShowChangePassword(!showChangePassword)} className="w-full flex items-center gap-3 py-2">
                <Lock size={18} style={{ color: 'var(--drop-text-muted)' }} />
                <span className="flex-1 text-left text-sm font-medium" style={{ fontFamily: 'var(--drop-font-body)', color: 'var(--drop-text)' }}>
                  Change Password
                </span>
                <ChevronRight size={16} style={{ color: 'var(--drop-text-muted)', transform: showChangePassword ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>

              <AnimatePresence>
                {showChangePassword && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="pt-3 space-y-3">
                      <div className="relative">
                        <input type={showCurrentPw ? 'text' : 'password'} placeholder="Current password"
                          value={passwordForm.current} onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                          style={{ fontFamily: 'var(--drop-font-body)', background: 'color-mix(in srgb, var(--drop-text-muted) 6%, transparent)', border: '1px solid var(--drop-border)', color: 'var(--drop-text)' }} />
                        <button onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2">
                          {showCurrentPw ? <Eye size={14} style={{ color: 'var(--drop-text-muted)' }} /> : <EyeOff size={14} style={{ color: 'var(--drop-text-muted)' }} />}
                        </button>
                      </div>
                      <div className="relative">
                        <input type={showNewPw ? 'text' : 'password'} placeholder="New password"
                          value={passwordForm.new} onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                          style={{ fontFamily: 'var(--drop-font-body)', background: 'color-mix(in srgb, var(--drop-text-muted) 6%, transparent)', border: '1px solid var(--drop-border)', color: 'var(--drop-text)' }} />
                        <button onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2">
                          {showNewPw ? <Eye size={14} style={{ color: 'var(--drop-text-muted)' }} /> : <EyeOff size={14} style={{ color: 'var(--drop-text-muted)' }} />}
                        </button>
                      </div>
                      <input type="password" placeholder="Confirm new password"
                        value={passwordForm.confirm} onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                        style={{ fontFamily: 'var(--drop-font-body)', background: 'color-mix(in srgb, var(--drop-text-muted) 6%, transparent)', border: '1px solid var(--drop-border)', color: 'var(--drop-text)' }} />
                      {passwordError && <p className="text-xs" style={{ color: 'var(--drop-error)', fontFamily: 'var(--drop-font-body)' }}>{passwordError}</p>}
                      {passwordSuccess && <p className="text-xs" style={{ color: 'var(--drop-success)', fontFamily: 'var(--drop-font-body)' }}>Password changed!</p>}
                      <button onClick={handleChangePassword} className="w-full py-2.5 rounded-xl text-sm font-bold"
                        style={{ fontFamily: 'var(--drop-font-body)', background: 'var(--drop-primary)', color: '#FFFFFF', border: 'none' }}>
                        Update Password
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Delete Account */}
            <div className="px-6 pb-2">
              <button onClick={() => setShowDeleteConfirm(!showDeleteConfirm)} className="w-full flex items-center gap-3 py-2">
                <Trash2 size={18} style={{ color: 'var(--drop-error)' }} />
                <span className="flex-1 text-left text-sm font-medium" style={{ fontFamily: 'var(--drop-font-body)', color: 'var(--drop-error)' }}>
                  Delete Account
                </span>
              </button>

              <AnimatePresence>
                {showDeleteConfirm && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="p-4 rounded-xl mt-2" style={{ background: 'color-mix(in srgb, var(--drop-error) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--drop-error) 20%, transparent)' }}>
                      <p className="text-sm mb-3" style={{ fontFamily: 'var(--drop-font-body)', color: 'var(--drop-text)' }}>
                        Are you sure? This action cannot be undone.
                      </p>
                      <div className="flex gap-2">
                        <button onClick={() => setShowDeleteConfirm(false)}
                          className="flex-1 py-2 rounded-xl text-sm font-medium"
                          style={{ fontFamily: 'var(--drop-font-body)', background: 'var(--drop-surface)', border: '1px solid var(--drop-border)', color: 'var(--drop-text-muted)' }}>
                          Cancel
                        </button>
                        <button onClick={handleDeleteAccount} disabled={deleting}
                          className="flex-1 py-2 rounded-xl text-sm font-bold"
                          style={{ fontFamily: 'var(--drop-font-body)', background: 'var(--drop-error)', color: '#FFFFFF', border: 'none' }}>
                          {deleting ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div style={{ height: 1, background: 'var(--drop-border)', margin: '0 24px' }} />

            {/* Logout */}
            <div className="px-6 py-4 pb-8">
              <button onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold"
                style={{ fontFamily: 'var(--drop-font-body)', background: 'color-mix(in srgb, var(--drop-error) 10%, transparent)', color: 'var(--drop-error)', border: '1px solid color-mix(in srgb, var(--drop-error) 20%, transparent)' }}>
                <LogOut size={16} />
                Log Out
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
