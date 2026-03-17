import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Flame, ChevronRight, LogOut, Trash2, Lock, Eye, EyeOff, Users } from 'lucide-react';
import { ProfileSwitcherModal } from './ProfileSwitcherModal';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const AGE_BADGES = {
  '8-10': { label: 'Junior Reader', color: '#FFD60A' },
  '11-13': { label: 'News Scout', color: '#3B82F6' },
  '14-16': { label: 'Drop Regular', color: '#8B5CF6' },
  '17-20': { label: 'Sharp Mind', color: '#EC4899' },
};

const ACCOUNT_TYPES = {
  child: { label: 'Child Account', color: '#3B82F6' },
  parent: { label: 'Parent Account', color: '#8B5CF6' },
  independent: { label: 'Independent', color: '#10B981' },
  self: { label: 'Independent', color: '#10B981' },
};

export const ProfilePanel = ({ open, onClose }) => {
  const navigate = useNavigate();
  const { user, token, ageGroup, band, logout, linkedProfiles: ctxLinkedProfiles, fetchLinkedProfiles, parentToken } = useTheme();
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

  // Show Switch Profile for child accounts or accounts with linked profiles
  const isChildAccount = user?.account_type === 'child';
  const hasLinkedProfiles = (ctxLinkedProfiles || []).length > 0;
  const showSwitchButton = isChildAccount || hasLinkedProfiles;
  // Self accounts: no switch, no create
  const isSelfAccount = user?.account_type === 'self' || user?.account_type === 'independent';

  useEffect(() => {
    if (open) {
      console.log('[ProfilePanel] Panel opened');
      console.log('[ProfilePanel] user.account_type:', user?.account_type);
      console.log('[ProfilePanel] ctxLinkedProfiles:', (ctxLinkedProfiles || []).length);
      console.log('[ProfilePanel] showSwitchButton:', showSwitchButton, '(child:', isChildAccount, ', profiles:', hasLinkedProfiles, ')');
      console.log('[ProfilePanel] isSelfAccount:', isSelfAccount);
      console.log('[ProfilePanel] parentToken present:', !!parentToken);
    }
  }, [open]);

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

  const badge = AGE_BADGES[ageGroup] || AGE_BADGES['14-16'];
  const accountType = ACCOUNT_TYPES[user?.account_type] || ACCOUNT_TYPES.independent;

  const gradients = {
    'big-bold-bright': 'linear-gradient(135deg, #FF4B4B, #FFD93D)',
    'cool-connected': 'linear-gradient(135deg, #1E90FF, #00D4AA)',
    'sharp-aware': 'linear-gradient(135deg, #5C4EFA, #22D3EE)',
    'editorial': 'linear-gradient(135deg, #00D4FF, #FF2D78)',
  };
  const avatarGradient = gradients[band] || 'linear-gradient(135deg, #3B82F6, #8B5CF6)';
  const dividerColor = isDark ? 'var(--drop-border)' : '#F1F5F9';
  const inputBg = isDark ? 'rgba(255,255,255,0.06)' : '#F8FAFC';
  const inputBorder = isDark ? 'var(--drop-border)' : '1.5px solid #E2E8F0';

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
                style={{ background: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9' }}>
                <X size={18} style={{ color: 'var(--drop-text-muted)' }} />
              </button>
            </div>

            {/* Avatar */}
            <div className="flex flex-col items-center px-6 pb-5">
              <div style={{ width: 80, height: 80, borderRadius: '50%', padding: 3, background: avatarGradient }}>
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden' }}>
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"
                      style={{ background: avatarGradient, color: '#FFFFFF', fontFamily: 'var(--drop-font-heading)', fontSize: 32, fontWeight: 700 }}>
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
                  style={{ fontFamily: 'var(--drop-font-body)', background: `${badge.color}15`, color: badge.color }}>
                  {badge.label}
                </span>
                <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full"
                  style={{ fontFamily: 'var(--drop-font-body)', background: `${accountType.color}15`, color: accountType.color }}>
                  {accountType.label}
                </span>
              </div>

              <div className="flex items-center gap-2 mt-4 px-4 py-2 rounded-full"
                style={{ background: isDark ? 'rgba(249,115,22,0.1)' : '#FFF7ED', border: isDark ? '1px solid rgba(249,115,22,0.2)' : '1.5px solid #FFEDD5' }}>
                <Flame size={18} style={{ color: '#F97316' }} fill="#F97316" />
                <span className="text-sm font-bold" style={{ fontFamily: 'var(--drop-font-heading)', color: '#F97316' }}>
                  {streak.current_streak} day streak
                </span>
              </div>
            </div>

            <div style={{ height: 1, background: dividerColor, margin: '0 24px' }} />

            {/* Switch Profile — only for child accounts or accounts with linked profiles, NOT for self */}
            {!isSelfAccount && showSwitchButton && (
              <div className="px-6 py-4">
                <button onClick={() => { console.log('[ProfilePanel] Switch Profile tapped'); setShowSwitcher(true); }}
                  className="w-full flex items-center gap-3 py-2.5 px-4 rounded-2xl transition-colors"
                  style={{ background: isDark ? 'rgba(92,78,250,0.08)' : '#EFF6FF', border: isDark ? '1px solid rgba(92,78,250,0.2)' : '1.5px solid #BFDBFE' }}>
                  <Users size={20} style={{ color: isDark ? 'var(--drop-accent, #00D4FF)' : '#3B82F6' }} />
                  <span className="flex-1 text-left text-sm font-bold" style={{ fontFamily: 'var(--drop-font-body)', color: 'var(--drop-text)' }}>
                    Switch Profile
                  </span>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{ background: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9', color: 'var(--drop-text-muted)', fontFamily: 'var(--drop-font-body)' }}>
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
                          style={{ fontFamily: 'var(--drop-font-body)', background: inputBg, border: inputBorder, color: 'var(--drop-text)' }} />
                        <button onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2">
                          {showCurrentPw ? <Eye size={14} style={{ color: 'var(--drop-text-muted)' }} /> : <EyeOff size={14} style={{ color: 'var(--drop-text-muted)' }} />}
                        </button>
                      </div>
                      <div className="relative">
                        <input type={showNewPw ? 'text' : 'password'} placeholder="New password"
                          value={passwordForm.new} onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                          style={{ fontFamily: 'var(--drop-font-body)', background: inputBg, border: inputBorder, color: 'var(--drop-text)' }} />
                        <button onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2">
                          {showNewPw ? <Eye size={14} style={{ color: 'var(--drop-text-muted)' }} /> : <EyeOff size={14} style={{ color: 'var(--drop-text-muted)' }} />}
                        </button>
                      </div>
                      <input type="password" placeholder="Confirm new password"
                        value={passwordForm.confirm} onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                        style={{ fontFamily: 'var(--drop-font-body)', background: inputBg, border: inputBorder, color: 'var(--drop-text)' }} />
                      {passwordError && <p className="text-xs" style={{ color: '#EF4444', fontFamily: 'var(--drop-font-body)' }}>{passwordError}</p>}
                      {passwordSuccess && <p className="text-xs" style={{ color: '#10B981', fontFamily: 'var(--drop-font-body)' }}>Password changed!</p>}
                      <button onClick={handleChangePassword} className="w-full py-2.5 rounded-xl text-sm font-bold"
                        style={{ fontFamily: 'var(--drop-font-body)', background: avatarGradient, color: '#FFFFFF', border: 'none' }}>
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
                <Trash2 size={18} style={{ color: '#EF4444' }} />
                <span className="flex-1 text-left text-sm font-medium" style={{ fontFamily: 'var(--drop-font-body)', color: '#EF4444' }}>
                  Delete Account
                </span>
              </button>

              <AnimatePresence>
                {showDeleteConfirm && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="p-4 rounded-xl mt-2" style={{ background: isDark ? 'rgba(239,68,68,0.1)' : '#FEF2F2', border: isDark ? '1px solid rgba(239,68,68,0.2)' : '1.5px solid #FECACA' }}>
                      <p className="text-sm mb-3" style={{ fontFamily: 'var(--drop-font-body)', color: isDark ? '#FCA5A5' : '#991B1B' }}>
                        Are you sure? This action cannot be undone.
                      </p>
                      <div className="flex gap-2">
                        <button onClick={() => setShowDeleteConfirm(false)}
                          className="flex-1 py-2 rounded-xl text-sm font-medium"
                          style={{ fontFamily: 'var(--drop-font-body)', background: 'var(--drop-surface)', border: `1px solid var(--drop-border)`, color: 'var(--drop-text-muted)' }}>
                          Cancel
                        </button>
                        <button onClick={handleDeleteAccount} disabled={deleting}
                          className="flex-1 py-2 rounded-xl text-sm font-bold"
                          style={{ fontFamily: 'var(--drop-font-body)', background: '#EF4444', color: '#FFFFFF', border: 'none' }}>
                          {deleting ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div style={{ height: 1, background: dividerColor, margin: '0 24px' }} />

            {/* Logout */}
            <div className="px-6 py-4 pb-8">
              <button onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold"
                style={{ fontFamily: 'var(--drop-font-body)', background: isDark ? 'rgba(239,68,68,0.1)' : '#FEF2F2', color: '#EF4444', border: isDark ? '1px solid rgba(239,68,68,0.2)' : '1.5px solid #FECACA' }}>
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
